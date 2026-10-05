import * as vscode from 'vscode';
import { AvatarViewProvider } from './avatarView';
import { affectsPixelFriend, readConfig } from './config';
import { ReminderScheduler, ReminderSnapshot } from './reminder';
import { SettingsPanel } from './settingsPanel';
import { playHostSound } from './sound';
import { resetSprite, uploadSprite } from './sprite';

export function activate(context: vscode.ExtensionContext): void {
  const scheduler = new ReminderScheduler(
    context.globalState,
    () => readConfig().reminderIntervalMinutes,
    () => readConfig().snoozeMinutes,
    () => {
      if (readConfig().soundsEnabled && readConfig().avatar.style !== 'cartoon') { playHostSound('reminder'); }
      avatar.ask(); // the cartoon character asks out loud; the pixel buddy ignores this
    },
  );

  const avatar = new AvatarViewProvider(
    context,
    () => drink(),
    () => settings.show(),
  );

  const settings = new SettingsPanel(
    context,
    () => scheduler.snapshot(),
    async (action) => {
      switch (action) {
        case 'uploadSprite': return uploadSprite(context);
        case 'resetSprite': return resetSprite();
        case 'remindNow': { await scheduler.fire(); return; }
        case 'drinkNow': return drink();
        case 'togglePause': return togglePause();
      }
    },
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  statusBar.command = 'pixelfriend.openSettings';
  statusBar.show();

  const drink = (): void => {
    const count = scheduler.recordDrink();
    avatar.celebrate(count);
  };

  const togglePause = (): void => {
    const paused = !scheduler.snapshot().paused;
    scheduler.setPaused(paused);
    void vscode.window.showInformationMessage(
      paused ? '⏸ Reminders paused. Your buddy will keep you company anyway.' : '▶ Reminders back on!',
    );
  };

  const syncSnapshot = (snapshot: ReminderSnapshot): void => {
    renderStatusBar(statusBar, snapshot);
    avatar.updateSchedule(snapshot);
    settings.refresh();
  };

  // Keep the status bar countdown fresh without touching the scheduler.
  const ticker = setInterval(() => renderStatusBar(statusBar, scheduler.snapshot()), 1000);

  context.subscriptions.push(
    scheduler,
    avatar,
    settings,
    statusBar,
    { dispose: () => clearInterval(ticker) },
    vscode.window.registerWebviewViewProvider(AvatarViewProvider.viewType, avatar, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    scheduler.onDidChange(syncSnapshot),
    vscode.commands.registerCommand('pixelfriend.openAvatar', () => avatar.openInEditor()),
    vscode.commands.registerCommand('pixelfriend.floatBuddy', () => avatar.floatOverVSCode()),
    vscode.commands.registerCommand('pixelfriend.openSettings', () => settings.show()),
    vscode.commands.registerCommand('pixelfriend.drinkNow', drink),
    vscode.commands.registerCommand('pixelfriend.remindNow', () => scheduler.fire()),
    vscode.commands.registerCommand('pixelfriend.togglePause', togglePause),
    vscode.commands.registerCommand('pixelfriend.uploadSprite', () => uploadSprite(context)),
    vscode.commands.registerCommand('pixelfriend.resetSprite', resetSprite),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!affectsPixelFriend(e)) { return; }
      avatar.refreshConfig();
      settings.refresh();
      if (e.affectsConfiguration('pixelfriend.reminderIntervalMinutes')) {
        scheduler.scheduleInterval();
      } else {
        syncSnapshot(scheduler.snapshot());
      }
    }),
  );

  scheduler.start();
  syncSnapshot(scheduler.snapshot());

  if (readConfig().showOnStartup) {
    void avatar.revealSidebar();
  }
}

export function deactivate(): void {
  // Disposables are handled through context.subscriptions.
}

function renderStatusBar(item: vscode.StatusBarItem, snapshot: ReminderSnapshot): void {
  if (snapshot.paused || snapshot.nextAt === null) {
    item.text = '$(debug-pause) PixelFriend';
    item.tooltip = 'Reminders paused. Click to open settings.';
    return;
  }
  const remainingMs = Math.max(0, snapshot.nextAt - Date.now());
  const totalSec = Math.round(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const clock = new Date(snapshot.nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  item.text = `💧 ${mm}:${String(ss).padStart(2, '0')}`;
  item.tooltip = `Next sip at ${clock} · ${snapshot.drinksToday} today · click for settings`;
}
