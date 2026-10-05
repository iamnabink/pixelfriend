<p align="center">
  <img src="docs/character-wave.png" width="220" alt="PixelFriend asking: Did you drink water?">
</p>

<h1 align="center">PixelFriend</h1>

<p align="center">
  A tiny cartoon buddy who lives in VS Code, asks <em>"Hi, do you have water?"</em> every hour, and celebrates when you say yes.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#what-it-does">What it does</a> ·
  <a href="#how-it-is-built">How it is built</a> ·
  <a href="#settings">Settings</a> ·
  <a href="#development">Development</a>
</p>

---

## Why

Developers forget to drink water. Calendar pings and phone alarms are easy to dismiss and easy to resent. PixelFriend tries the opposite approach: a small, friendly character who asks politely, waits for you, and is visibly happy when you take a sip. Positive reinforcement, no nagging, no guilt. Everything runs locally inside VS Code; nothing is sent anywhere.

## What it does

| | |
|---|---|
| <img src="docs/character-idle.png" width="200"> | **A cartoon buddy in VS Code.** He lives in the sidebar, breathes, blinks, looks around, and keeps a countdown to the next reminder under his feet. The status bar shows the same countdown. |
| <img src="docs/character-wave.png" width="200"> | **He asks out loud.** Every hour (configurable) he raises a hand and says *"Hi, do you have water?"* with lip-synced mouth shapes, and a chat bubble asks **Did you drink water?** with a **YES** button. The bubble stays until you tap it. A VS Code notification with **YES** / **Remind me later** shows at the same time. |
| <img src="docs/character-celebrate.png" width="200"> | **He celebrates.** Tap YES (or tap him) and he throws both hands up with a big grin and a "Nice!" bubble showing how many drinks you have logged today. |
| <img src="docs/character-idle.png" width="200"> | **He floats over your code.** Run `PixelFriend: Float Buddy Over VS Code` (or the ⧉ button in his view) and he pops out into a small always-on-top VS Code window, wandering around it while you work. He also works as a plain editor tab. |

Prefer pixels? Switch the avatar style to **Pixel Buddy** for a tiny 12×16 sprite that walks across the view, waves, and dances. You can upload your own PNG sprite sheet for that one.

## Quick start

```bash
cd pixelfriend
npm install
npm run compile
npx @vscode/vsce package --allow-missing-repository --no-dependencies
code --install-extension pixelfriend-0.4.0.vsix
```

Or press **F5** inside `pixelfriend/` to run it in an Extension Development Host. The floating window needs VS Code 1.94 or newer.

## How it is built

Two packages, each with its own README. The root `package.json` only adds convenience scripts.

```
.
├── pixelfriend/   VS Code extension (TypeScript)               → pixelfriend/README.md
│   ├── src/       reminder scheduler, webviews, settings page, sprite upload
│   └── media/     webview assets (cartoon host, pixel renderer, settings UI)
├── character/     2D cartoon character engine (one SVG + JS)    → character/README.md
└── docs/          screenshots
```

```bash
npm install                 # esbuild + extension dev deps for the workspaces
npm run build               # character bundle → extension compile
npm run package:extension
```

**The character** is a hand-written SVG animated with plain JavaScript: breathing, head sway, blinks, eye saccades, a four-joint arm for the raised hand, and a parametric mouth driven by viseme sequences. The voice is the Web Speech API; word-boundary events keep the mouth in sync. No frameworks, no assets to download, about 10 KB minified.

**The reminder** is a plain timer in the extension host that survives restarts (the next time is persisted), snoozes on "Remind me later", and keeps a per-day drink count.

## Settings

Everything lives under `pixelfriend.*` in VS Code settings, or in the extension's own settings page (`PixelFriend: Open Settings`, the ⚙ in the buddy view, or the status bar item).

| Setting | Default | Notes |
|---|---|---|
| `reminderIntervalMinutes` | 60 | 1 to 480 |
| `snoozeMinutes` | 5 | "Remind me later" delay |
| `soundsEnabled` | true | Voice for the cartoon, system sound for the pixel buddy |
| `showOnStartup` | true | Reveal the buddy view when VS Code opens |
| `avatar.style` | cartoon | `cartoon` or `pixel` |
| `avatar.shirtColor` / `hairColor` / `skinColor` / `pantsColor` | hoodie palette | Apply to both avatars |
| `avatar.scale` / `avatar.speed` | 4 / 1 | Pixel buddy only |
| `sprite.*` | | Custom sprite sheet for the pixel buddy, see [pixelfriend/README.md](pixelfriend/README.md) |

## Development

- `pixelfriend/`: `npm run watch`, then F5. See [pixelfriend/README.md](pixelfriend/README.md).
- `character/`: edit `src/character.js`, then `npm run build:character` from the root. `npm run dev --workspace character` serves `index.html` for quick iteration in a browser.

## License

MIT
