import * as path from 'path';
import * as vscode from 'vscode';
import { PixelFriendConfig, readConfig, updateSetting } from './config';
import { ReminderSnapshot } from './reminder';
import { nonce } from './webviewUtil';

type SettingsAction = 'uploadSprite' | 'resetSprite' | 'remindNow' | 'drinkNow' | 'togglePause';

type HostMessage = {
  type: 'state';
  config: PixelFriendConfig;
  snapshot: ReminderSnapshot;
  spriteName: string | null;
};

type WebviewMessage =
  | { type: 'ready' }
  | { type: 'save'; key: string; value: unknown }
  | { type: 'action'; action: SettingsAction };

/** A lightweight settings page rendered as a webview panel. */
export class SettingsPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly getSnapshot: () => ReminderSnapshot,
    private readonly runAction: (action: SettingsAction) => void | Promise<void>,
  ) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'pixelfriend.settings',
      'PixelFriend Settings',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
      },
    );
    panel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icon.svg');
    this.panel = panel;
    panel.webview.html = this.html(panel.webview);
    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      switch (msg.type) {
        case 'ready':
          this.refresh();
          break;
        case 'save':
          await updateSetting(msg.key, msg.value);
          break;
        case 'action':
          await this.runAction(msg.action);
          this.refresh();
          break;
      }
    });
    panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  refresh(): void {
    if (!this.panel) { return; }
    const config = readConfig();
    const message: HostMessage = {
      type: 'state',
      config,
      snapshot: this.getSnapshot(),
      spriteName: config.sprite.path ? path.basename(config.sprite.path) : null,
    };
    void this.panel.webview.postMessage(message);
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private html(webview: vscode.Webview): string {
    const n = nonce();
    const media = (file: string) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', file));
    const csp = [
      "default-src 'none'",
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${n}'`,
    ].join('; ');

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${media('settings.css')}">
  <title>PixelFriend Settings</title>
</head>
<body>
  <main>
    <header>
      <h1>PixelFriend</h1>
      <p class="tagline">Tiny buddy. Big hydration.</p>
    </header>

    <section class="card status">
      <div>
        <div class="label">Next reminder</div>
        <div id="next" class="big">…</div>
      </div>
      <div>
        <div class="label">Drinks today</div>
        <div id="drinks" class="big">0</div>
      </div>
      <div class="actions">
        <button data-action="drinkNow" class="primary">💧 I drank water</button>
        <button data-action="remindNow">Remind me now</button>
        <button data-action="togglePause" id="pause-btn">Pause</button>
      </div>
    </section>

    <section class="card">
      <h2>Reminders</h2>
      <label class="row">
        <span>Remind me every</span>
        <span class="control"><input type="number" min="1" max="480" data-key="reminderIntervalMinutes"> <em>min</em></span>
      </label>
      <label class="row">
        <span>"Remind me later" waits</span>
        <span class="control"><input type="number" min="1" max="120" data-key="snoozeMinutes"> <em>min</em></span>
      </label>
      <label class="row">
        <span>Sounds</span>
        <span class="control"><input type="checkbox" data-key="soundsEnabled"></span>
      </label>
      <label class="row">
        <span>Show buddy on startup</span>
        <span class="control"><input type="checkbox" data-key="showOnStartup"></span>
      </label>
    </section>

    <section class="card">
      <h2>Avatar</h2>
      <label class="row">
        <span>Style</span>
        <span class="control">
          <select data-key="avatar.style">
            <option value="cartoon">Cartoon character (speaks)</option>
            <option value="pixel">Pixel buddy</option>
          </select>
        </span>
      </label>
      <label class="row">
        <span>Size</span>
        <span class="control"><input type="range" min="2" max="10" step="1" data-key="avatar.scale"> <output id="scale-out"></output></span>
      </label>
      <label class="row">
        <span>Walking speed</span>
        <span class="control"><input type="range" min="0.25" max="4" step="0.25" data-key="avatar.speed"> <output id="speed-out"></output></span>
      </label>
      <div class="colors">
        <label><span>Shirt</span><input type="color" data-key="avatar.shirtColor"></label>
        <label><span>Hair</span><input type="color" data-key="avatar.hairColor"></label>
        <label><span>Skin</span><input type="color" data-key="avatar.skinColor"></label>
        <label><span>Pants</span><input type="color" data-key="avatar.pantsColor"></label>
      </div>
      <p class="hint">Colors apply to both avatars. Size and speed apply to the pixel buddy only.</p>
    </section>

    <section class="card">
      <h2>Custom sprite sheet</h2>
      <p class="hint">
        A PNG with three rows of equal-sized frames: <strong>walk</strong>, <strong>wave</strong>, <strong>dance</strong>.
        Frames should face right.
      </p>
      <div class="row">
        <span>Current</span>
        <span class="control"><code id="sprite-name">Built-in buddy</code></span>
      </div>
      <div class="actions">
        <button data-action="uploadSprite" class="primary">Upload PNG…</button>
        <button data-action="resetSprite">Use built-in buddy</button>
      </div>
      <div class="grid">
        <label><span>Frame width</span><input type="number" min="1" data-key="sprite.frameWidth"></label>
        <label><span>Frame height</span><input type="number" min="1" data-key="sprite.frameHeight"></label>
        <label><span>Walk frames</span><input type="number" min="1" data-key="sprite.walkFrames"></label>
        <label><span>Wave frames</span><input type="number" min="1" data-key="sprite.waveFrames"></label>
        <label><span>Dance frames</span><input type="number" min="1" data-key="sprite.danceFrames"></label>
        <label><span>FPS</span><input type="number" min="1" max="30" data-key="sprite.fps"></label>
      </div>
    </section>

  </main>
  <script nonce="${n}" src="${media('settings.js')}"></script>
</body>
</html>`;
  }
}
