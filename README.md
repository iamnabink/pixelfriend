# PixelFriend + Activ

A playful hydration companion for VS Code, with a macOS menu bar sidekick.

```
vs-code-extension/
├── pixelfriend/   VS Code extension (TypeScript)  → reminders, cartoon character, settings page
├── activ/         macOS menu bar app (Swift/AppKit) → countdown, standalone reminders, desktop character
└── character/     Shared 2D cartoon character engine (SVG + JS) used by both
```

The two talk through one small JSON file that PixelFriend writes and Activ polls:

```
~/Library/Application Support/PixelFriend/state.json
```

```json
{
  "version": 1,
  "nextReminderAt": 1759660800000,
  "intervalMinutes": 30,
  "paused": false,
  "drinksToday": 3,
  "lastDrinkAt": 1759659000000,
  "updatedAt": 1759659000123
}
```

## Quick start

**Extension**

```bash
cd pixelfriend
npm install
npm run compile
# then press F5 in VS Code (Run PixelFriend), or install the .vsix:
npx @vscode/vsce package --allow-missing-repository
code --install-extension pixelfriend-0.1.0.vsix
```

**Menu bar app**

```bash
cd activ
./build-app.sh
open dist/Activ.app
```

See [pixelfriend/README.md](pixelfriend/README.md) and [activ/README.md](activ/README.md) for details, including the custom sprite sheet format.
