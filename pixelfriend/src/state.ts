import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { AvatarConfig, SpriteConfig } from './config';

/**
 * Shared state written to disk so the Activ menu bar app can show the countdown.
 * Format is intentionally tiny and stable.
 */
export interface SharedState {
  version: 1;
  nextReminderAt: number | null; // epoch milliseconds
  intervalMinutes: number;
  paused: boolean;
  drinksToday: number;
  lastDrinkAt: number | null;
  updatedAt: number;
  avatar: AvatarConfig;
  sprite: SpriteConfig;
}

export function defaultStatePath(context: vscode.ExtensionContext): string {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'PixelFriend', 'state.json');
  }
  return path.join(context.globalStorageUri.fsPath, 'state.json');
}

export function resolveStatePath(context: vscode.ExtensionContext, configured: string): string {
  const trimmed = (configured || '').trim();
  if (!trimmed) { return defaultStatePath(context); }
  return trimmed.startsWith('~') ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
}

export async function writeSharedState(filePath: string, state: SharedState): Promise<void> {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
    await fs.promises.rename(tmp, filePath); // atomic swap so Activ never reads a half-written file
  } catch (err) {
    console.warn('[PixelFriend] could not write state file', err);
  }
}

export interface ActivCommand {
  action: 'drink' | 'snooze';
  at: number;
}

/**
 * Activ writes `command.json` beside the state file when the user answers a reminder there.
 * We consume it exactly once and delete it.
 */
export async function readCommand(stateFilePath: string): Promise<ActivCommand | null> {
  const file = path.join(path.dirname(stateFilePath), 'command.json');
  try {
    const raw = await fs.promises.readFile(file, 'utf8');
    await fs.promises.unlink(file);
    const parsed = JSON.parse(raw) as Partial<ActivCommand>;
    if ((parsed.action === 'drink' || parsed.action === 'snooze') && typeof parsed.at === 'number') {
      // Ignore stale commands older than 10 minutes.
      if (Date.now() - parsed.at < 10 * 60_000) { return { action: parsed.action, at: parsed.at }; }
    }
  } catch {
    // no command waiting
  }
  return null;
}
