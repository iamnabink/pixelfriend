import { execFile } from 'child_process';

/**
 * Host-side sounds. The webview plays the celebration chime itself (WebAudio),
 * but the reminder notification can fire while no webview is visible, so on
 * macOS the reminder sound goes through the system player instead.
 */
export type SoundName = 'reminder';

const MAC_SOUNDS: Record<SoundName, string> = {
  reminder: '/System/Library/Sounds/Glass.aiff',
};

export function playHostSound(name: SoundName): void {
  if (process.platform !== 'darwin') { return; }
  execFile('afplay', [MAC_SOUNDS[name]], (err) => {
    if (err) { console.warn('[PixelFriend] afplay failed', err.message); }
  });
}
