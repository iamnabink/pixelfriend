import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { readConfig, updateSetting } from './config';

/**
 * Custom sprite sheets are PNGs laid out in three rows:
 *   row 0: walking frames, row 1: waving frames, row 2: dancing frames.
 * Every frame is frameWidth x frameHeight. Frames face RIGHT; the webview mirrors them.
 */
export async function uploadSprite(context: vscode.ExtensionContext): Promise<void> {
  const picked = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Use this sprite sheet',
    filters: { Images: ['png'] },
    title: 'Choose a PNG sprite sheet (3 rows: walk, wave, dance)',
  });
  if (!picked || picked.length === 0) { return; }

  const source = picked[0].fsPath;
  const spriteDir = path.join(context.globalStorageUri.fsPath, 'sprites');
  await fs.promises.mkdir(spriteDir, { recursive: true });
  const target = path.join(spriteDir, `custom-${Date.now()}.png`);
  await fs.promises.copyFile(source, target);

  const current = readConfig().sprite;
  const frameWidth = await askNumber('Frame width in pixels', current.frameWidth);
  if (frameWidth === undefined) { return; }
  const frameHeight = await askNumber('Frame height in pixels', current.frameHeight);
  if (frameHeight === undefined) { return; }
  const walkFrames = await askNumber('Walking frames (row 1)', current.walkFrames);
  if (walkFrames === undefined) { return; }
  const waveFrames = await askNumber('Waving frames (row 2)', current.waveFrames);
  if (waveFrames === undefined) { return; }
  const danceFrames = await askNumber('Dancing frames (row 3)', current.danceFrames);
  if (danceFrames === undefined) { return; }

  await updateSetting('sprite.frameWidth', frameWidth);
  await updateSetting('sprite.frameHeight', frameHeight);
  await updateSetting('sprite.walkFrames', walkFrames);
  await updateSetting('sprite.waveFrames', waveFrames);
  await updateSetting('sprite.danceFrames', danceFrames);
  await updateSetting('sprite.path', target);

  await cleanupOldSprites(spriteDir, target);
  void vscode.window.showInformationMessage('🎨 New look loaded! Your buddy is ready to walk.');
}

export async function resetSprite(): Promise<void> {
  await updateSetting('sprite.path', '');
  void vscode.window.showInformationMessage('Back to the classic buddy.');
}

async function askNumber(prompt: string, fallback: number): Promise<number | undefined> {
  const value = await vscode.window.showInputBox({
    prompt,
    value: String(fallback),
    validateInput: (v) => (/^\d+$/.test(v.trim()) && Number(v) > 0 ? undefined : 'Enter a positive whole number'),
  });
  if (value === undefined) { return undefined; }
  return Number(value.trim());
}

async function cleanupOldSprites(dir: string, keep: string): Promise<void> {
  try {
    const entries = await fs.promises.readdir(dir);
    await Promise.all(
      entries
        .map((e) => path.join(dir, e))
        .filter((p) => p !== keep && p.endsWith('.png'))
        .map((p) => fs.promises.unlink(p).catch(() => undefined)),
    );
  } catch {
    // best effort
  }
}
