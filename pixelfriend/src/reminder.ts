import * as vscode from 'vscode';

const MAX_TIMEOUT = 2_147_483_647; // setTimeout ceiling (~24.8 days)
const KEY_NEXT_AT = 'pixelfriend.nextReminderAt';
const KEY_PAUSED = 'pixelfriend.paused';
const KEY_DRINK_LOG = 'pixelfriend.drinkLog'; // { date: 'YYYY-MM-DD', count: number, lastAt: number }

interface DrinkLog {
  date: string;
  count: number;
  lastAt: number | null;
}

export interface ReminderSnapshot {
  nextAt: number | null;
  paused: boolean;
  drinksToday: number;
  lastDrinkAt: number | null;
  intervalMinutes: number;
}

export type ReminderAnswer = 'yes' | 'later' | 'dismissed';

/**
 * Owns the reminder timer. Everything observable (next time, pause state,
 * drink count) is exposed through `snapshot()` and `onDidChange`.
 */
export class ReminderScheduler implements vscode.Disposable {
  private timer: NodeJS.Timeout | undefined;
  private nextAt: number | null = null;
  private paused = false;
  private showing = false;
  private readonly changeEmitter = new vscode.EventEmitter<ReminderSnapshot>();
  private readonly drinkEmitter = new vscode.EventEmitter<{ drinksToday: number }>();

  readonly onDidChange = this.changeEmitter.event;
  /** Fires when the user confirms they drank water (from the notification, the avatar, or a command). */
  readonly onDidDrink = this.drinkEmitter.event;

  constructor(
    private readonly memento: vscode.Memento,
    private getIntervalMinutes: () => number,
    private getSnoozeMinutes: () => number,
    private readonly onReminderShown: () => void,
  ) {
    this.paused = memento.get<boolean>(KEY_PAUSED, false);
  }

  /** Resume a persisted schedule or start a fresh one. */
  start(): void {
    const persisted = this.memento.get<number | null>(KEY_NEXT_AT, null);
    if (this.paused) {
      this.nextAt = null;
      this.emit();
      return;
    }
    if (persisted && persisted > Date.now()) {
      this.scheduleAt(persisted);
    } else if (persisted) {
      // Missed while VS Code was closed. Give the user a moment to settle in.
      this.scheduleAt(Date.now() + 15_000);
    } else {
      this.scheduleInterval();
    }
  }

  snapshot(): ReminderSnapshot {
    const log = this.todayLog();
    return {
      nextAt: this.nextAt,
      paused: this.paused,
      drinksToday: log.count,
      lastDrinkAt: log.lastAt,
      intervalMinutes: this.getIntervalMinutes(),
    };
  }

  /** Restart the countdown using the configured interval (e.g. after settings change). */
  scheduleInterval(): void {
    if (this.paused) { return; }
    this.scheduleAt(Date.now() + this.getIntervalMinutes() * 60_000);
  }

  snooze(): void {
    if (this.paused) { return; }
    this.scheduleAt(Date.now() + this.getSnoozeMinutes() * 60_000);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    void this.memento.update(KEY_PAUSED, paused);
    if (paused) {
      this.clearTimer();
      this.nextAt = null;
      void this.memento.update(KEY_NEXT_AT, null);
      this.emit();
    } else {
      this.scheduleInterval();
    }
  }

  /** Record a drink regardless of where it came from, then restart the interval. */
  recordDrink(): number {
    const today = todayKey();
    const log = this.todayLog();
    const next: DrinkLog = { date: today, count: log.count + 1, lastAt: Date.now() };
    void this.memento.update(KEY_DRINK_LOG, next);
    this.drinkEmitter.fire({ drinksToday: next.count });
    this.scheduleInterval();
    return next.count;
  }

  /** Show the notification immediately (also used by the "Show Reminder Now" command). */
  async fire(): Promise<ReminderAnswer> {
    if (this.showing) { return 'dismissed'; }
    this.showing = true;
    this.onReminderShown();
    try {
      const choice = await vscode.window.showInformationMessage(
        '💧 Did you have water?',
        'YES',
        'Remind me later',
      );
      if (choice === 'YES') {
        this.recordDrink();
        return 'yes';
      }
      if (choice === 'Remind me later') {
        this.snooze();
        return 'later';
      }
      // Closed without answering: treat as a soft snooze so the countdown is never left stale.
      this.snooze();
      return 'dismissed';
    } finally {
      this.showing = false;
    }
  }

  dispose(): void {
    this.clearTimer();
    this.changeEmitter.dispose();
    this.drinkEmitter.dispose();
  }

  private scheduleAt(epochMs: number): void {
    this.clearTimer();
    this.nextAt = epochMs;
    void this.memento.update(KEY_NEXT_AT, epochMs);
    this.armTimer();
    this.emit();
  }

  private armTimer(): void {
    if (this.nextAt === null) { return; }
    const delay = this.nextAt - Date.now();
    if (delay > MAX_TIMEOUT) {
      this.timer = setTimeout(() => this.armTimer(), MAX_TIMEOUT);
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.fire();
    }, Math.max(0, delay));
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private todayLog(): DrinkLog {
    const log = this.memento.get<DrinkLog>(KEY_DRINK_LOG);
    const today = todayKey();
    if (!log || log.date !== today) {
      return { date: today, count: 0, lastAt: null };
    }
    return log;
  }

  private emit(): void {
    this.changeEmitter.fire(this.snapshot());
  }
}

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
