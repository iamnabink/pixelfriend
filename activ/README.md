# Activ

A minimal macOS menu bar app that shows when PixelFriend will next ask you to drink water:

```
💧 next at 14:32 - in 273s
```

Native Swift + AppKit, no dependencies, no Dock icon. It reads the JSON file PixelFriend writes and refreshes every second.

## Standalone mode

Activ runs its own hourly reminder only when VS Code is not running. A small card appears at the top right: the cartoon character raises a hand, says "Hi, do you have water?" (native macOS speech, lip-synced) and shows the **Did you drink water?** bubble with **YES**. It stays until you answer. While VS Code is open, the extension handles reminders and Activ only shows the countdown.

When the PixelFriend extension is alive in VS Code (it heartbeats once a minute into `state.json`), Activ follows VS Code's schedule instead and relays your answer back through `command.json`. The menu shows which side is driving.

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
