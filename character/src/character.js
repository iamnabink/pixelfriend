// PixelFriend 2D cartoon character engine. Shared by the VS Code webview and the macOS app.
// Public API: window.PixelCharacter = { ready, idle(), ask(), celebrate(), setSpeech(mode), wordBoundary(i), speechEnd(), phrase, setColors() }
const PHRASE = 'Hi, do you have water?';
const BUBBLE_TEXT = params_bubble();
function params_bubble() { return 'Did you drink water?'; }
// Per-word viseme sequences (name, seconds), played when that word's boundary fires.
const WORD_VISEMES = [
  [['aa', 0.13], ['I', 0.12]],                              // Hi
  [['DD', 0.05], ['U', 0.14]],                              // do
  [['I', 0.05], ['U', 0.14]],                               // you
  [['aa', 0.12], ['FF', 0.10]],                             // have
  [['U', 0.06], ['aa', 0.11], ['DD', 0.05], ['RR', 0.14]],  // water
];
// Mouth parameters per viseme: width (0..1.2), openness (0..1), roundness (0..1)
const MOUTH = {
  sil: [1.0, 0.0, 0.0], aa: [1.0, 0.95, 0.2], E: [1.1, 0.5, 0.0], I: [1.15, 0.3, 0.0], O: [0.6, 0.85, 1.0],
  U: [0.45, 0.55, 1.0], FF: [1.0, 0.18, 0.0], PP: [0.8, 0.0, 0.3], DD: [0.9, 0.35, 0.2], RR: [0.8, 0.4, 0.5],
  TH: [0.95, 0.3, 0.1], kk: [0.9, 0.4, 0.2], CH: [0.8, 0.35, 0.6], SS: [1.05, 0.2, 0.0], nn: [0.9, 0.25, 0.1],
};
const WORD_FALLBACK_SPACING = 0.34;

const params = Object.assign({}, window.PIXEL_CHARACTER_CONFIG || {}, Object.fromEntries(new URLSearchParams(location.search)));
const colors = {
  skin: params.skinColor || '#F3C8A2',
  hair: params.hairColor || '#4A2C1A',
  shirt: params.shirtColor || '#F28C28',
  pants: params.pantsColor || '#3E6192',
};
const FRAMING = params.framing || 'full'; // full | half

const state = {
  mode: 'idle', speaking: false, speechMode: 'internal',
  visemeQueue: [], blinkAt: 2, blinkPhase: -1, saccadeAt: 0, saccade: [0, 0],
  ask: 0, cheer: 0, mouth: [1, 0, 0],
};

// ───────────── Build the SVG ─────────────
// Cartoon boy: messy dark hair, round glasses, orange hoodie with a backpack, jeans, white sneakers.
const O = '#3a2414'; // outline color
const shirtDark = shade(colors.shirt, -0.18);
const shirtLight = shade(colors.shirt, 0.12);
const pantsLight = shade(colors.pants, 0.25);
const host = document.getElementById('character') || document.body;
host.innerHTML = `
<svg id="pf-svg" viewBox="0 ${FRAMING === 'half' ? -60 : -95} 300 ${FRAMING === 'half' ? 340 : 495}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" aria-label="PixelFriend">
  <defs>
    <clipPath id="eyeL"><ellipse cx="128" cy="110" rx="11" ry="12"/></clipPath>
    <clipPath id="eyeR"><ellipse cx="172" cy="110" rx="11" ry="12"/></clipPath>
    <linearGradient id="shirtShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient>
  </defs>
  <g id="body">
    <g id="legs" stroke="${O}" stroke-width="2.5">
      <rect x="118" y="262" width="29" height="112" rx="12" fill="${colors.pants}"/>
      <rect x="153" y="262" width="29" height="112" rx="12" fill="${colors.pants}"/>
      <rect x="117" y="356" width="31" height="16" rx="6" fill="${pantsLight}"/>
      <rect x="152" y="356" width="31" height="16" rx="6" fill="${pantsLight}"/>
      <path d="M110 384 C110 372 122 368 134 370 C146 370 156 376 156 384 C156 392 146 395 132 395 C120 395 110 392 110 384 Z" fill="#fff"/>
      <path d="M110 386 C120 393 146 393 156 386 L156 390 C150 396 116 396 110 390 Z" fill="${colors.shirt}" stroke="none"/>
      <path d="M144 384 C144 372 156 368 168 370 C180 370 190 376 190 384 C190 392 180 395 166 395 C154 395 144 392 144 384 Z" fill="#fff"/>
      <path d="M144 386 C154 393 180 393 190 386 L190 390 C184 396 150 396 144 390 Z" fill="${colors.shirt}" stroke="none"/>
      <path d="M122 376 L140 376 M156 376 L174 376" stroke="${O}" stroke-width="2" opacity=".5"/>
    </g>
    <path id="hoodBack" d="M102 176 C102 150 124 140 150 142 C176 140 198 150 198 176 Z" fill="${shirtDark}" stroke="${O}" stroke-width="2.5"/>
    <g id="armL" transform="translate(196 186)">
      <g id="armL-upper">
        <line x1="0" y1="0" x2="0" y2="44" stroke="${O}" stroke-width="27" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="0" y2="44" stroke="${colors.shirt}" stroke-width="22" stroke-linecap="round"/>
        <g id="armL-fore" transform="translate(0 44)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="${O}" stroke-width="25" stroke-linecap="round"/>
          <line x1="0" y1="0" x2="0" y2="40" stroke="${colors.shirt}" stroke-width="20" stroke-linecap="round"/>
          <rect x="-11" y="30" width="22" height="10" rx="4" fill="${shirtDark}" stroke="${O}" stroke-width="2"/>
          <g id="handL" transform="translate(0 46)">
            <circle r="12" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
            <g class="fingers" stroke="${O}" stroke-width="9.5" stroke-linecap="round"><line x1="-7" y1="6" x2="-9" y2="19"/><line x1="-1" y1="8" x2="-1" y2="22"/><line x1="6" y1="7" x2="8" y2="19"/><line x1="10" y1="2" x2="17" y2="9"/></g>
            <g class="fingers" stroke="${colors.skin}" stroke-width="6.5" stroke-linecap="round"><line x1="-7" y1="6" x2="-9" y2="19"/><line x1="-1" y1="8" x2="-1" y2="22"/><line x1="6" y1="7" x2="8" y2="19"/><line x1="10" y1="2" x2="17" y2="9"/></g>
          </g>
        </g>
      </g>
    </g>
    <g id="armR" transform="translate(104 186)">
      <g id="armR-upper">
        <line x1="0" y1="0" x2="0" y2="44" stroke="${O}" stroke-width="27" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="0" y2="44" stroke="${colors.shirt}" stroke-width="22" stroke-linecap="round"/>
        <g id="armR-fore" transform="translate(0 44)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="${O}" stroke-width="25" stroke-linecap="round"/>
          <line x1="0" y1="0" x2="0" y2="40" stroke="${colors.shirt}" stroke-width="20" stroke-linecap="round"/>
          <rect x="-11" y="30" width="22" height="10" rx="4" fill="${shirtDark}" stroke="${O}" stroke-width="2"/>
          <g id="handR" transform="translate(0 46)">
            <circle r="12" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
            <g class="fingers" stroke="${O}" stroke-width="9.5" stroke-linecap="round"><line x1="7" y1="6" x2="9" y2="19"/><line x1="1" y1="8" x2="1" y2="22"/><line x1="-6" y1="7" x2="-8" y2="19"/><line x1="-10" y1="2" x2="-17" y2="9"/></g>
            <g class="fingers" stroke="${colors.skin}" stroke-width="6.5" stroke-linecap="round"><line x1="7" y1="6" x2="9" y2="19"/><line x1="1" y1="8" x2="1" y2="22"/><line x1="-6" y1="7" x2="-8" y2="19"/><line x1="-10" y1="2" x2="-17" y2="9"/></g>
          </g>
        </g>
      </g>
    </g>
    <g id="torso" stroke="${O}" stroke-width="2.5">
      <rect x="100" y="166" width="100" height="106" rx="28" fill="${colors.shirt}"/>
      <rect x="100" y="166" width="100" height="106" rx="28" fill="url(#shirtShade)" stroke="none"/>
      <rect x="116" y="238" width="68" height="30" rx="12" fill="${shirtDark}"/>
      <path d="M118 172 C132 160 168 160 182 172 L176 190 C164 180 136 180 124 190 Z" fill="${shirtDark}"/>
      <path d="M142 180 L138 212 M158 180 L162 212" stroke="#fff" stroke-width="2.5" opacity=".9"/>
      <rect x="112" y="166" width="14" height="76" rx="7" fill="#8b5a2b"/>
      <rect x="174" y="166" width="14" height="76" rx="7" fill="#8b5a2b"/>
      <path d="M150 198 C144 206 141 210 141 215 A9 9 0 0 0 159 215 C159 210 156 206 150 198 Z" fill="#fff6e6" stroke="none" opacity=".95"/>
    </g>
    <rect id="neck" x="138" y="146" width="24" height="30" rx="8" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
    <g id="head">
      <ellipse cx="94" cy="112" rx="9" ry="12" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
      <ellipse cx="206" cy="112" rx="9" ry="12" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
      <path d="M94 104 C94 62 118 44 150 44 C182 44 206 62 206 104 C206 140 184 164 150 164 C116 164 94 140 94 104 Z" fill="${colors.skin}" stroke="${O}" stroke-width="2.5"/>
      <path id="hair" d="M92 104 C86 70 104 42 136 38 C140 26 154 24 160 34 C168 22 184 30 182 42 C204 46 214 72 208 104 C204 90 196 84 186 82 C178 72 170 80 160 78 C150 72 140 80 130 80 C118 78 106 86 102 96 C98 100 95 102 92 104 Z" fill="${colors.hair}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M118 54 C126 44 140 42 150 44" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".18"/>
      <g id="cheeks" opacity="0.35">
        <ellipse cx="114" cy="130" rx="11" ry="6" fill="#ff7b7b" opacity=".7"/>
        <ellipse cx="186" cy="130" rx="11" ry="6" fill="#ff7b7b" opacity=".7"/>
      </g>
      <g id="brows" stroke="${colors.hair}" stroke-width="6" stroke-linecap="round" fill="none">
        <path id="browL" d="M114 86 Q128 78 142 86"/>
        <path id="browR" d="M158 86 Q172 78 186 86"/>
      </g>
      <g id="eyes">
        <ellipse cx="128" cy="110" rx="11" ry="12" fill="#fff"/>
        <ellipse cx="172" cy="110" rx="11" ry="12" fill="#fff"/>
        <g id="pupils">
          <circle cx="129" cy="111" r="7.5" fill="#6b3a1e"/><circle cx="129" cy="111" r="4" fill="#2a1508"/><circle cx="131.5" cy="108" r="2.2" fill="#fff"/>
          <circle cx="173" cy="111" r="7.5" fill="#6b3a1e"/><circle cx="173" cy="111" r="4" fill="#2a1508"/><circle cx="175.5" cy="108" r="2.2" fill="#fff"/>
        </g>
        <rect id="lidL" x="115" y="96" width="27" height="0" fill="${colors.skin}" clip-path="url(#eyeL)"/>
        <rect id="lidR" x="159" y="96" width="27" height="0" fill="${colors.skin}" clip-path="url(#eyeR)"/>
      </g>
      <g id="glasses" fill="none" stroke="#2a1a10" stroke-width="3.5">
        <circle cx="128" cy="110" r="17"/><circle cx="172" cy="110" r="17"/>
        <path d="M145 108 Q150 104 155 108"/>
        <path d="M111 106 L96 104 M189 106 L204 104"/>
      </g>
      <path d="M147 124 Q150 130 154 124" fill="none" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/>
      <g id="mouthGroup">
        <path id="mouthOpen" d="" fill="#7a2a2a" stroke="${O}" stroke-width="2"/>
        <path id="teeth" d="" fill="#fff"/>
        <path id="tongue" d="" fill="#e4696b"/>
        <path id="mouthLine" d="" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</svg>`;

function shade(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)));
  return '#' + [ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Chat bubble: "Did you drink water?" + YES. Stays until YES is tapped (or the host celebrates).
const bubbleStyle = document.createElement('style');
bubbleStyle.textContent = `
  #character { position: relative; }
  .pf-bubble { position: absolute; top: 2%; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px;
    background: #fff; color: #2a1a10; border: 3px solid #3a2414; border-radius: 16px; padding: 10px 14px; font: 600 15px/1.2 -apple-system, "Segoe UI", system-ui, sans-serif;
    white-space: normal; text-align: center; max-width: calc(100% - 16px); box-sizing: border-box; box-shadow: 0 6px 18px rgba(0,0,0,.25); z-index: 5; animation: pf-bubble-pop 280ms cubic-bezier(.2,1.4,.4,1) both; }
  .pf-small .pf-bubble { font-size: 12px; padding: 7px 10px; border-width: 2px; border-radius: 12px; gap: 6px; }
  .pf-small .pf-bubble-yes { font-size: 12px; padding: 5px 12px; border-width: 2px; }
  .pf-small .pf-bubble::after { width: 12px; height: 12px; bottom: -8px; border-width: 2px; }
  .pf-bubble::after { content: ''; position: absolute; left: 50%; bottom: -12px; width: 18px; height: 18px; background: #fff; border-right: 3px solid #3a2414; border-bottom: 3px solid #3a2414; transform: translateX(-50%) rotate(45deg); }
  .pf-bubble-yes { font: 700 15px -apple-system, "Segoe UI", system-ui, sans-serif; color: #fff; background: #F28C28; border: 3px solid #3a2414; border-radius: 12px; padding: 7px 18px; cursor: pointer; }
  .pf-bubble-yes:hover { background: #ff9d3a; } .pf-bubble-yes:active { transform: scale(.96); }
  .pf-bubble.hidden { display: none; }
  @keyframes pf-bubble-pop { from { transform: translateX(-50%) scale(.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }`;
document.head.appendChild(bubbleStyle);
const bubble = document.createElement('div');
bubble.className = 'pf-bubble hidden';
bubble.innerHTML = `<span class="pf-bubble-text">${BUBBLE_TEXT}</span><button class="pf-bubble-yes" type="button">YES 💧</button>`;
host.appendChild(bubble);
bubble.querySelector('.pf-bubble-yes').addEventListener('click', (e) => {
  e.stopPropagation();
  setMode('celebrate');
  post({ type: 'yes' });
});

// Compact bubble for small hosts (the desktop overlay)
function fitBubble() { host.classList.toggle('pf-small', (host.clientWidth || window.innerWidth) < 210); }
fitBubble();
window.addEventListener('resize', fitBubble);

const $ = (id) => document.getElementById(id);
const el = {
  body: $('body'), head: $('head'), armR: $('armR'), armRFore: $('armR-fore'), handR: $('handR'),
  armL: $('armL'), armLFore: $('armL-fore'), handL: $('handL'), pupils: $('pupils'), lidL: $('lidL'), lidR: $('lidR'),
  brows: $('brows'), cheeks: $('cheeks'), mouthOpen: $('mouthOpen'), teeth: $('teeth'), tongue: $('tongue'), mouthLine: $('mouthLine'),
};

// ───────────── Animation ─────────────
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, t) => a + (b - a) * t;

function updateBody(now, dt) {
  const ask = easeOut(state.ask), cheer = easeOut(state.cheer);
  // Breathing + tiny weight shift
  const breathe = 1 + Math.sin(now * 1.3) * 0.012;
  const hop = cheer * Math.abs(Math.sin(now * 7)) * 10;
  el.body.setAttribute('transform', `translate(150 395) scale(${1 + cheer * 0.02} ${breathe}) translate(-150 ${-395 - hop})`);
  // Head: slow sway, a friendly tilt when asking, a wiggle when celebrating
  const tilt = Math.sin(now * 0.6) * 2 + ask * -7 + Math.sin(now * 9) * 5 * cheer;
  const bob = Math.sin(now * 1.3) * 1.5 + ask * -3;
  el.head.setAttribute('transform', `translate(0 ${bob}) rotate(${tilt} 150 156)`);
}

function updateArms(now, dt) {
  state.ask += ((state.mode === 'ask' ? 1 : 0) - state.ask) * (1 - Math.exp(-dt * 5));
  state.cheer += ((state.mode === 'celebrate' ? 1 : 0) - state.cheer) * (1 - Math.exp(-dt * 7));
  const a = easeOut(state.ask), c = easeOut(state.cheer);
  const sway = Math.sin(now * 1.3) * 2;
  // Right arm (viewer's left): hangs at rest; raises beside the head with an open palm when asking.
  const bob = Math.sin(now * 2.6) * 4 * a;
  const raise = Math.max(a, c);
  const rUpperTarget = c > a ? 165 + Math.sin(now * 7) * 8 : 140 + bob;
  const rUpper = lerp(-8 + sway, rUpperTarget, raise);
  const rFore = lerp(4, c > a ? 10 : 40, raise);
  el.armR.setAttribute('transform', `translate(104 186) rotate(${rUpper})`);
  el.armRFore.setAttribute('transform', `translate(0 44) rotate(${rFore})`);
  el.handR.setAttribute('transform', `translate(0 46) rotate(${lerp(0, -8, a)})`);
  // Left arm: rests, both arms up for the celebration.
  const lUpper = lerp(8 - sway, -165 - Math.sin(now * 7) * 8, c);
  el.armL.setAttribute('transform', `translate(196 186) rotate(${lUpper})`);
  el.armLFore.setAttribute('transform', `translate(0 44) rotate(${lerp(-4, -10, c)})`);
}

function scheduleBlink(now) { state.blinkAt = now + 2 + Math.random() * 4; }
function scheduleSaccade(now) {
  state.saccadeAt = now + 0.8 + Math.random() * 2.4;
  state.saccade = [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4];
}

function updateFace(now, dt) {
  const ask = easeOut(state.ask), cheer = easeOut(state.cheer);
  // Eyes look around a little; toward you when asking
  if (now > state.saccadeAt) scheduleSaccade(now);
  const look = ask > 0.5 ? [0, 0] : state.saccade;
  el.pupils.setAttribute('transform', `translate(${look[0]} ${look[1]})`);
  // Blink
  if (state.blinkPhase < 0 && now > state.blinkAt) state.blinkPhase = 0;
  let blink = 0;
  if (state.blinkPhase >= 0) {
    state.blinkPhase += dt / 0.16;
    blink = state.blinkPhase < 0.5 ? state.blinkPhase * 2 : Math.max(0, 2 - state.blinkPhase * 2);
    if (state.blinkPhase >= 1) { state.blinkPhase = -1; blink = 0; scheduleBlink(now); }
  }
  const squint = cheer * 0.45;
  const lid = Math.max(blink, squint) * 30;
  el.lidL.setAttribute('height', lid); el.lidR.setAttribute('height', lid);
  // Brows up when asking
  el.brows.setAttribute('transform', `translate(0 ${-7 * ask - 3 * cheer})`);
  el.cheeks.setAttribute('opacity', String(0.35 + 0.65 * cheer));
  // Mouth: active viseme, else a resting smile that widens for the celebration
  while (state.visemeQueue.length && state.visemeQueue[0].until < now) state.visemeQueue.shift();
  const active = state.visemeQueue[0];
  const target = active ? MOUTH[active.name] || MOUTH.sil : MOUTH.sil;
  const k = 1 - Math.exp(-dt * 24);
  state.mouth = state.mouth.map((v, i) => lerp(v, target[i], k));
  drawMouth(state.mouth[0], state.mouth[1], state.mouth[2], 0.5 + 0.15 * ask + 0.6 * cheer);
}

function drawMouth(width, open, round, smile) {
  const cx = 150, cy = 142;
  const w = 16 * width * (1 - round * 0.45) + 4;
  const h = 14 * open + 0.5;
  const curve = 6 * smile * (1 - open * 0.6);
  if (open < 0.08) {
    el.mouthOpen.setAttribute('d', '');
    el.teeth.setAttribute('d', '');
    el.tongue.setAttribute('d', '');
    el.mouthLine.setAttribute('d', `M${cx - w} ${cy - curve * 0.3} Q${cx} ${cy + curve * 1.6} ${cx + w} ${cy - curve * 0.3}`);
    return;
  }
  el.mouthLine.setAttribute('d', '');
  const top = cy - h * 0.35 - curve * 0.2;
  const bottom = cy + h * 0.75 + curve * 0.3;
  const rx = w, ry = (bottom - top) / 2;
  const my = (top + bottom) / 2;
  el.mouthOpen.setAttribute('d', `M${cx - rx} ${my} A${rx} ${ry} 0 1 0 ${cx + rx} ${my} A${rx} ${ry} 0 1 0 ${cx - rx} ${my} Z`);
  const teethH = Math.min(5, ry * 0.5);
  el.teeth.setAttribute('d', `M${cx - rx * 0.75} ${top + 1} H${cx + rx * 0.75} V${top + 1 + teethH} H${cx - rx * 0.75} Z`);
  el.tongue.setAttribute('d', open > 0.5 ? `M${cx - rx * 0.5} ${bottom - 1} A${rx * 0.5} ${ry * 0.5} 0 0 1 ${cx + rx * 0.5} ${bottom - 1} Z` : '');
}

function queueWord(index, startAt) {
  const seq = WORD_VISEMES[index];
  if (!seq) return;
  let t = startAt;
  state.visemeQueue = seq.map(([name, dur]) => ({ name, until: (t += dur) }));
}

// ───────────── Speech ─────────────
let fallbackTimer = null;
const nowSec = () => performance.now() / 1000;
function speakInternal() {
  if (!('speechSynthesis' in window)) { speakFallbackTimeline(); return; }
  try {
    const u = new SpeechSynthesisUtterance(PHRASE);
    u.rate = 0.95; u.pitch = 1.08;
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find((v) => /Samantha|Karen|Moira|Zoe|Google US English/i.test(v.name)) || voices.find((v) => /^en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    let wordIndex = 0, gotBoundary = false;
    u.onboundary = (e) => { if (e.name && e.name !== 'word') return; gotBoundary = true; queueWord(wordIndex++, nowSec()); };
    u.onstart = () => { state.speaking = true; setTimeout(() => { if (!gotBoundary) speakFallbackTimeline(); }, 250); };
    u.onend = () => endSpeech();
    u.onerror = () => speakFallbackTimeline();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch { speakFallbackTimeline(); }
}
function speakFallbackTimeline() {
  state.speaking = true;
  clearTimeout(fallbackTimer);
  let i = 0;
  const step = () => {
    if (i < WORD_VISEMES.length) { queueWord(i++, nowSec()); fallbackTimer = setTimeout(step, WORD_FALLBACK_SPACING * 1000); }
    else fallbackTimer = setTimeout(endSpeech, 300);
  };
  step();
}
function endSpeech() {
  state.speaking = false;
  state.visemeQueue = [];
  // Hand comes down, but the bubble stays until YES is tapped.
  setTimeout(() => { if (state.mode === 'ask') setMode('wait'); }, 900);
}

let nudgeTimer = null;
function scheduleNudge() {
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    if (state.mode !== 'wait') return;
    state.mode = 'ask'; // a little wave to remind you, without speaking again
    setTimeout(() => { if (state.mode === 'ask') setMode('wait'); }, 1600);
  }, 40_000);
}

// ───────────── Modes ─────────────
function setMode(mode) {
  state.mode = mode;
  if (mode === 'celebrate') setTimeout(() => { if (state.mode === 'celebrate') setMode('idle'); }, 2600);
  if (mode === 'wait') scheduleNudge(); else clearTimeout(nudgeTimer);
  if (mode === 'ask' || mode === 'wait') bubble.classList.remove('hidden'); else bubble.classList.add('hidden');
  post({ type: 'mode', mode });
}
function ask() {
  if (state.mode === 'ask' || state.mode === 'wait') return; // already asking
  setMode('ask');
  if (state.speechMode === 'internal') setTimeout(speakInternal, 350);
}

const vscodeApi = window.__vscodeApi || (window.acquireVsCodeApi ? window.acquireVsCodeApi() : null);
function post(msg) {
  try { vscodeApi?.postMessage(msg); } catch {}
  try { window.webkit?.messageHandlers?.character?.postMessage(msg); } catch {}
}

// ───────────── Loop ─────────────
let last = nowSec();
function tick() {
  requestAnimationFrame(tick);
  const now = nowSec();
  const dt = Math.min(0.05, now - last);
  last = now;
  updateArms(now, dt);
  updateBody(now, dt);
  updateFace(now, dt);
}
scheduleSaccade(0);
tick();

window.PixelCharacter = {
  ready: Promise.resolve(), phrase: PHRASE,
  idle: () => setMode('idle'),
  ask,
  celebrate: () => setMode('celebrate'),
  setSpeech: (mode) => { state.speechMode = mode === 'external' ? 'external' : 'internal'; },
  isAsking: () => state.mode === 'ask' || state.mode === 'wait',
  wordBoundary: (i) => { state.speaking = true; queueWord(i, nowSec()); },
  speechEnd: () => endSpeech(),
  _state: state,
};

window.addEventListener('message', (e) => {
  const m = e.data || {};
  switch (m.type) {
    case 'ask': ask(); break;
    case 'celebrate': setMode('celebrate'); break;
    case 'idle': setMode('idle'); break;
    case 'speech': window.PixelCharacter.setSpeech(m.mode); break;
    case 'word': window.PixelCharacter.wordBoundary(m.index); break;
    case 'speechEnd': endSpeech(); break;
  }
});
if ((params.bg || 'clean') === 'transparent') document.body.classList.add('transparent');
post({ type: 'ready' });
