# @pixelfriend/character

The cartoon buddy, as one SVG plus a few hundred lines of dependency-free JavaScript. It renders inside the PixelFriend VS Code webview.

## API

The bundle exposes `window.PixelCharacter`:

| Method | What it does |
|---|---|
| `ask()` | Raises a hand, shows the "Did you drink water?" bubble with a YES button, and speaks "Hi, do you have water?" (internal speech mode). The bubble stays until YES or `celebrate()`. |
| `celebrate()` | Both hands up, big grin, blush. Returns to idle after 2.6 s. |
| `idle()` | Back to breathing, blinking and looking around. |
| `setSpeech('internal' \| 'external')` | Internal uses the Web Speech API. External means the host speaks and calls `wordBoundary(i)` per word and `speechEnd()` when done, so the mouth stays in sync. |
| `isAsking()` | True while the bubble is up. |

It also listens for `window.postMessage` events of the same names (`{ type: 'ask' }`, `celebrate`, `idle`, `word`, `speechEnd`) and posts `{ type: 'ready' | 'mode' | 'yes' }` back to the host through the VS Code webview API.

Configuration comes from the URL query or a `window.PIXEL_CHARACTER_CONFIG` object set before the bundle loads: `framing` (`full` or `half`), `bg` (`clean` or `transparent`), and `shirtColor`, `hairColor`, `skinColor`, `pantsColor`.

## Develop

```bash
npm install          # from the repo root
npm run build --workspace character
npm run dev --workspace character   # then open http://127.0.0.1:8765/index.html
```

`src/character.js` holds the SVG, the animation loop, the arm rig, the viseme table and the speech glue. After a change, run `npm run build:character` from the root to copy the bundle into the extension.
