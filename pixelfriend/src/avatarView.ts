import * as path from 'path';
import * as vscode from 'vscode';
import { PixelFriendConfig, readConfig } from './config';
import { ReminderSnapshot } from './reminder';
import { nonce } from './webviewUtil';

/** Messages host -> webview */
type HostMessage =
  | { type: 'config'; config: PixelFriendConfig; spriteUri: string | null }
  | { type: 'schedule'; snapshot: ReminderSnapshot }
  | { type: 'celebrate'; drinksToday: number }
  | { type: 'ask' };

/** Messages webview -> host */
type WebviewMessage =
  | { type: 'ready' }
  | { type: 'drink' }
  | { type: 'yes' }
  | { type: 'openSettings' };

/**
 * Renders the buddy in the sidebar view and, optionally, in an editor tab.
 * Both surfaces share the same HTML and receive the same broadcasts.
 */
export class AvatarViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly viewType = 'pixelfriend.avatarView';

  private readonly webviews = new Set<vscode.Webview>();
  private panel: vscode.WebviewPanel | undefined;
  private sidebarView: vscode.WebviewView | undefined;
  private latestSnapshot: ReminderSnapshot | undefined;
  private renderedSpritePath = readConfig().sprite.path;
  private renderedStyle = '';

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onDrink: () => void,
    private readonly onOpenSettings: () => void,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.sidebarView = view;
    this.attach(view.webview);
    view.onDidDispose(() => {
      this.webviews.delete(view.webview);
      this.sidebarView = undefined;
    });
  }

  /** Open (or focus) the buddy as an editor tab. In this surface the cartoon wanders around the tab. */
  openInEditor(focus = false): vscode.WebviewPanel {
    if (this.panel) {
      this.panel.reveal(undefined, !focus);
      return this.panel;
    }
    const panel = vscode.window.createWebviewPanel(
      'pixelfriend.avatarPanel',
      'PixelFriend',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: !focus },
      { retainContextWhenHidden: true },
    );
    panel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icon.svg');
    this.panel = panel;
    this.attach(panel.webview);
    panel.onDidDispose(() => {
      this.webviews.delete(panel.webview);
      this.panel = undefined;
    });
    return panel;
  }

  /**
   * Pop the buddy out into his own small VS Code window and keep it on top, so he floats over your code.
   * Uses VS Code's floating editor windows (1.85+) and "always on top" (1.94+); older builds just get the tab.
   */
  async floatOverVSCode(): Promise<void> {
    this.openInEditor(true);
    await new Promise((r) => setTimeout(r, 150));
    try {
      await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      await new Promise((r) => setTimeout(r, 400));
      await vscode.commands.executeCommand('workbench.action.toggleWindowAlwaysOnTop');
    } catch (err) {
      console.warn('[PixelFriend] floating window not supported here', err);
    }
  }

  async revealSidebar(): Promise<void> {
    if (this.sidebarView) {
      this.sidebarView.show(true);
    } else {
      await vscode.commands.executeCommand('pixelfriend.avatarView.focus');
    }
  }

  celebrate(drinksToday: number): void {
    this.broadcast({ type: 'celebrate', drinksToday });
  }

  /** The cartoon character raises a hand and asks "Hi, do you have water?" */
  ask(): void {
    this.broadcast({ type: 'ask' });
  }

  updateSchedule(snapshot: ReminderSnapshot): void {
    this.latestSnapshot = snapshot;
    this.broadcast({ type: 'schedule', snapshot });
  }

  /**
   * Push new settings to every surface. A changed sprite path needs new
   * resource roots (full re-render); anything else is a live config update
   * so the buddy keeps walking from where it was.
   */
  refreshConfig(): void {
    const { sprite, avatar } = readConfig();
    const colorKey = `${avatar.style}|${avatar.shirtColor}|${avatar.hairColor}|${avatar.skinColor}|${avatar.pantsColor}`;
    const needsRerender = sprite.path !== this.renderedSpritePath || colorKey !== this.renderedStyle;
    this.renderedSpritePath = sprite.path;
    this.renderedStyle = colorKey;
    for (const webview of this.webviews) {
      if (needsRerender) {
        this.configure(webview);
      } else {
        this.sendConfig(webview);
      }
    }
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private attach(webview: vscode.Webview): void {
    this.webviews.add(webview);
    webview.onDidReceiveMessage((msg: WebviewMessage) => {
      switch (msg.type) {
        case 'ready':
          this.sendConfig(webview);
          if (this.latestSnapshot) {
            void webview.postMessage({ type: 'schedule', snapshot: this.latestSnapshot } satisfies HostMessage);
          }
          break;
        case 'drink':
        case 'yes':
          this.onDrink();
          break;
        case 'openSettings':
          this.onOpenSettings();
          break;
      }
    });
    this.configure(webview);
  }

  private configure(webview: vscode.Webview): void {
    const config = readConfig();
    const roots = [vscode.Uri.joinPath(this.context.extensionUri, 'media')];
    if (config.sprite.path) {
      roots.push(vscode.Uri.file(path.dirname(config.sprite.path)));
    }
    webview.options = { enableScripts: true, localResourceRoots: roots };
    webview.html = this.html(webview);
  }

  private sendConfig(webview: vscode.Webview): void {
    const config = readConfig();
    const spriteUri = config.sprite.path
      ? webview.asWebviewUri(vscode.Uri.file(config.sprite.path)).toString()
      : null;
    void webview.postMessage({ type: 'config', config, spriteUri } satisfies HostMessage);
  }

  private broadcast(message: HostMessage): void {
    for (const webview of this.webviews) {
      void webview.postMessage(message);
    }
  }

  private html(webview: vscode.Webview): string {
    if (readConfig().avatar.style === 'cartoon') { return this.htmlCartoon(webview, webview === this.panel?.webview); }
    const n = nonce();
    const media = (file: string) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', file));
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${n}'`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${media('avatar.css')}">
  <title>PixelFriend</title>
</head>
<body>
  <div id="stage" title="Click me when you drink water!">
    <div id="bubble" class="bubble hidden"><span id="bubble-text">Nice!</span><span id="bubble-sub"></span></div>
    <canvas id="avatar" width="64" height="64" aria-label="PixelFriend avatar"></canvas>
    <div id="ground"></div>
  </div>
  <div id="footer">
    <span id="countdown">…</span>
    <button id="settings-btn" title="PixelFriend settings" aria-label="Open settings">⚙</button>
  </div>
  <script nonce="${n}" src="${media('avatar.js')}"></script>
</body>
</html>`;
  }

  private htmlCartoon(webview: vscode.Webview, roam: boolean): string {
    const n = nonce();
    const media = (...parts: string[]) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', ...parts));
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} data: blob:`,
      `connect-src ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${n}'`,
    ].join('; ');
    const { avatar } = readConfig();
    const config = JSON.stringify({
      framing: 'full',
      bg: 'clean',
      roam,
      shirtColor: avatar.shirtColor,
      hairColor: avatar.hairColor,
      skinColor: avatar.skinColor,
      pantsColor: avatar.pantsColor,
    });

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${media('cartoon.css')}">
  <title>PixelFriend</title>
</head>
<body>
  <div id="stage" title="Click me when you drink water!">
    <div id="character"></div>
    <div id="bubble" class="bubble hidden"><span id="bubble-text">Nice!</span><span id="bubble-sub"></span></div>
  </div>
  <div id="footer">
    <span id="countdown">…</span>
    <button id="settings-btn" title="PixelFriend settings" aria-label="Open settings">⚙</button>
  </div>
  <script nonce="${n}">
    window.__vscodeApi = acquireVsCodeApi();
    window.PIXEL_CHARACTER_CONFIG = ${config};
  </script>
  <script nonce="${n}" src="${media('character', 'character.bundle.js')}"></script>
  <script nonce="${n}" src="${media('cartoon.js')}"></script>
</body>
</html>`;
  }
}
