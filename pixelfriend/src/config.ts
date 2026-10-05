import * as vscode from 'vscode';

export type AvatarStyle = 'cartoon' | 'pixel';

export interface AvatarConfig {
  style: AvatarStyle;
  scale: number;
  speed: number;
  shirtColor: string;
  hairColor: string;
  skinColor: string;
  pantsColor: string;
}

export interface SpriteConfig {
  path: string;
  frameWidth: number;
  frameHeight: number;
  walkFrames: number;
  waveFrames: number;
  danceFrames: number;
  fps: number;
}

export interface PixelFriendConfig {
  reminderIntervalMinutes: number;
  snoozeMinutes: number;
  soundsEnabled: boolean;
  showOnStartup: boolean;
  avatar: AvatarConfig;
  sprite: SpriteConfig;
  stateFilePath: string;
}

const SECTION = 'pixelfriend';

export function readConfig(): PixelFriendConfig {
  const c = vscode.workspace.getConfiguration(SECTION);
  return {
    reminderIntervalMinutes: clamp(c.get<number>('reminderIntervalMinutes', 60), 1, 480),
    snoozeMinutes: clamp(c.get<number>('snoozeMinutes', 5), 1, 120),
    soundsEnabled: c.get<boolean>('soundsEnabled', true),
    showOnStartup: c.get<boolean>('showOnStartup', true),
    avatar: {
      style: c.get<string>('avatar.style', 'cartoon') === 'pixel' ? 'pixel' : 'cartoon',
      scale: clamp(c.get<number>('avatar.scale', 4), 2, 10),
      speed: clamp(c.get<number>('avatar.speed', 1), 0.25, 4),
      shirtColor: c.get<string>('avatar.shirtColor', '#F28C28'),
      hairColor: c.get<string>('avatar.hairColor', '#4A2C1A'),
      skinColor: c.get<string>('avatar.skinColor', '#F3C8A2'),
      pantsColor: c.get<string>('avatar.pantsColor', '#3E6192'),
    },
    sprite: {
      path: c.get<string>('sprite.path', ''),
      frameWidth: Math.max(1, c.get<number>('sprite.frameWidth', 32)),
      frameHeight: Math.max(1, c.get<number>('sprite.frameHeight', 32)),
      walkFrames: Math.max(1, c.get<number>('sprite.walkFrames', 4)),
      waveFrames: Math.max(1, c.get<number>('sprite.waveFrames', 2)),
      danceFrames: Math.max(1, c.get<number>('sprite.danceFrames', 4)),
      fps: clamp(c.get<number>('sprite.fps', 8), 1, 30),
    },
    stateFilePath: c.get<string>('stateFilePath', ''),
  };
}

/** Write a single setting globally (user settings). */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  await vscode.workspace
    .getConfiguration(SECTION)
    .update(key, value, vscode.ConfigurationTarget.Global);
}

export function affectsPixelFriend(e: vscode.ConfigurationChangeEvent): boolean {
  return e.affectsConfiguration(SECTION);
}

function clamp(n: number, min: number, max: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) { return min; }
  return Math.min(max, Math.max(min, n));
}
