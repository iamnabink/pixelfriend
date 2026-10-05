# Activ

A minimal macOS menu bar app that shows when PixelFriend will next ask you to drink water:

```
💧 next at 14:32 - in 273s
```

Native Swift + AppKit, no dependencies, no Dock icon. It reads the JSON file PixelFriend writes and refreshes every second.

## Standalone mode

Activ runs its own hourly reminder when VS Code is not running. When a reminder fires, the desktop character raises a hand, says "Hi, do you have water?" (native macOS speech, lip-synced) and shows a chat bubble: **Did you drink water?** with a **YES** button. The bubble stays until you tap YES, or tap the character anywhere. He waves again every 40 seconds while he waits. If the desktop buddy is hidden, a floating card with the same character and buttons appears at the top right instead.

When the PixelFriend extension is alive in VS Code (it heartbeats once a minute into `state.json`), Activ follows VS Code's schedule instead and relays your answer back through `command.json`. The menu shows which side is driving.

## Desktop buddy

Activ also shows the character as a small always-on-top overlay that drifts between spots on your screen, over VS Code and every other window. Drag him with the mouse to put him where you want; he stays there for a while before wandering again. In **Cartoon Character** mode it is the same SVG character as the VS Code view (a WKWebView running the shared engine); in **Pixel Buddy** mode it is the tiny walking sprite. Either way it celebrates when a drink is logged anywhere.

Toggle it from the menu: **Show Desktop Buddy** (⌘B while the menu is open). The choice is remembered.

## Build and run

```bash
./build-app.sh        # swift build -c release, wraps into dist/Activ.app
open dist/Activ.app
```

For a quick dev run without the bundle:

```bash
swift run
```

## Menu

- Drinks today and which side is driving the schedule
- I Drank Water (⌘D), Remind Me Now (⌘R), Pause / Resume
- Remind Every: 15 to 120 minutes (standalone mode)
- Avatar: Cartoon Character / Pixel Buddy
- Show Desktop Buddy (⌘B)
- Open VS Code, Quit

## State file

Default: `~/Library/Application Support/PixelFriend/state.json`

Override with the `ACTIV_STATE_FILE` environment variable, and set the matching `pixelfriend.stateFilePath` in VS Code.

If the file is missing the item reads `💧 waiting for PixelFriend`. If reminders are paused it reads `💧 paused`.

## Start at login

Copy `com.whoamie.activ.plist.example` to `~/Library/LaunchAgents/com.whoamie.activ.plist`, replace the executable path with your absolute `dist/Activ.app/Contents/MacOS/Activ`, then:

```bash
launchctl load ~/Library/LaunchAgents/com.whoamie.activ.plist
```

Alternatively add `dist/Activ.app` under System Settings → General → Login Items.

## Character assets

`build-app.sh` copies `../character/index.html` and `../character/dist/character.bundle.js` into `Activ.app/Contents/Resources/character`. Rebuild the bundle first if you change the character (see the extension README).

## Requirements

macOS 13+, Xcode command line tools (Swift 5.9+).
