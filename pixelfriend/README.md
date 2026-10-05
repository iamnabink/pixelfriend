# PixelFriend

A tiny pixel buddy who walks around your sidebar, reminds you to drink water, and throws a little party every time you do.

## What it does

- **Hydration reminders.** Every hour (configurable) a VS Code notification asks "Did you have water?" with **YES** and **Remind me later**.
- **Cartoon character.** A 2D cartoon kid (messy hair, round glasses, orange hoodie, backpack) lives in the PixelFriend sidebar view and can also be opened as an editor tab. He breathes, blinks, looks around, and when a reminder fires he raises a hand, says "Hi, do you have water?" out loud with lip-synced mouth shapes, and shows a chat bubble asking **Did you drink water?** with a **YES** button. The bubble stays until you tap YES (or click him). Click him any time you drink.
- **Pixel buddy.** Switch `pixelfriend.avatar.style` to `pixel` for the tiny walking sprite instead. Custom sprite sheets apply to this style.
- **Celebration.** On **YES** the character throws both hands up with a big grin (the pixel buddy waves and dances), then a "Nice!" bubble shows your count for the day.
- **Status bar countdown** and a shared state file for the Activ menu bar app (see the activ folder next to this extension).
- **Customizable.** Change the buddy's colors, size and speed, or upload your own PNG sprite sheet.
- **Settings page.** `PixelFriend: Open Settings` (also the ⚙ in the buddy view or the status bar item).

## Commands

| Command | What it does |
| --- | --- |
| `PixelFriend: Open Settings` | Opens the settings page |
| `PixelFriend: Open Buddy in Editor` | Shows the buddy in an editor tab beside your code |
| `PixelFriend: Float Buddy Over VS Code` | Pops the buddy into a small always-on-top VS Code window where he wanders around |
| `PixelFriend: I Drank Water!` | Logs a drink and celebrates |
| `PixelFriend: Show Reminder Now` | Fires the notification immediately |
| `PixelFriend: Pause / Resume Reminders` | Pauses the timer (buddy keeps walking) |
| `PixelFriend: Upload Custom Sprite Sheet` | Picks a PNG and asks for frame sizes |
| `PixelFriend: Reset to Default Avatar` | Back to the built-in buddy |

## Settings

All settings live under `pixelfriend.*` and are editable from the settings page or VS Code's Settings UI.

| Setting | Default | Notes |
| --- | --- | --- |
| `reminderIntervalMinutes` | 60 | 1 to 480 |
| `snoozeMinutes` | 5 | "Remind me later" delay |
| `soundsEnabled` | true | System sound on reminder, chime on celebration |
| `showOnStartup` | true | Reveal the buddy view when VS Code opens |
| `avatar.style` | cartoon | `cartoon` (speaks) or `pixel` (walks) |
| `avatar.scale` | 4 | Pixel size multiplier (pixel style) |
| `avatar.speed` | 1 | Walking speed multiplier |
| `avatar.shirtColor` / `hairColor` / `skinColor` / `pantsColor` | hoodie palette | Apply to both avatars |
| `sprite.path` | "" | Set by the upload command |
| `sprite.frameWidth` / `frameHeight` | 32 / 32 | Size of one frame |
| `sprite.walkFrames` / `waveFrames` / `danceFrames` | 4 / 2 / 4 | Frames per row |
| `sprite.fps` | 8 | Custom sheet animation speed |
| `stateFilePath` | "" | Override where the Activ state file is written |

## The character engine

`media/character/character.bundle.js` is built from `../character/src/character.js`, a dependency-free SVG character shared with the Activ macOS app. Rebuild it with:

```bash
npx esbuild ../character/src/character.js --bundle --format=iife --minify --outfile=../character/dist/character.bundle.js
cp ../character/dist/character.bundle.js media/character/
```

Speech uses the Web Speech API inside the webview; word boundary events drive the mouth shapes.

## Custom sprite sheets (pixel style)

A single PNG, three rows of equal-sized frames, all facing **right** (the extension mirrors them when walking left):

```
row 1: walk  frame0 frame1 frame2 frame3 ...
row 2: wave  frame0 frame1 ...
row 3: dance frame0 frame1 frame2 frame3 ...
```

Rows can have different frame counts; unused cells can be empty. Transparent background recommended.

The file examples/buddy-sheet.png in this extension is the built-in buddy exported in this layout (24×32 frames, 4/2/4 frames per row). Use it as a starting point, or upload it as-is to confirm the pipeline works.

Run `PixelFriend: Upload Custom Sprite Sheet`, pick the PNG, and enter the frame width, height and per-row counts when prompted. The file is copied into the extension's global storage so the original can move.

## Development

```bash
npm install
npm run watch      # or: npm run compile
```

Press **F5** to launch an Extension Development Host. Package with:

```bash
npx @vscode/vsce package --allow-missing-repository --no-dependencies
```

### Layout

```
src/extension.ts     wiring: commands, status bar, config listeners
src/reminder.ts      timer, persistence, notification, drink log
src/avatarView.ts    sidebar + editor webviews for the buddy
src/settingsPanel.ts settings webview
src/sprite.ts        sprite upload/reset
src/state.ts         shared state file for Activ
src/sound.ts         macOS system sound for reminders
media/avatar.js      canvas renderer, animations, chime
media/settings.js    settings form
```

## Notes

- VS Code does not let extensions draw onto the built-in Welcome page. The buddy is "always visible" via its sidebar view (revealed on startup) and an optional editor tab.
- With the cartoon avatar the character speaks the reminder; with the pixel buddy a system sound plays via `afplay` on macOS.
- When the Activ app answers a reminder, it writes `command.json` next to the state file and the extension applies it within two seconds.
