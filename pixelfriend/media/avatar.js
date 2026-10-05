// @ts-check
/* PixelFriend avatar renderer.
 * Default buddy is drawn from tiny text-art frames (no binary assets).
 * A custom PNG sprite sheet (3 rows: walk, wave, dance) can replace it.
 */
(function () {
  const vscode = acquireVsCodeApi();

  // ───────────────────────── Default pixel buddy ─────────────────────────
  // 12 x 16 cells. Legend: h hair · s skin · e eye · m mouth · b shirt · p pants · k shoes · . empty
  const WALK = [
    [
      '....hhhh....',
      '...hhhhhh...',
      '...hhssss...',
      '...hsesse...',
      '...sssss....',
      '....ssss....',
      '..bbbbbbbb..',
      '.sbbbbbbbbs.',
      '.sbbbbbbbbs.',
      '..bbbbbbbb..',
      '...pppppp...',
      '...ppp.ppp..',
      '...pp...pp..',
      '...pp...pp..',
      '..kkk...kkk.',
      '............',
    ],
    [
      '....hhhh....',
      '...hhhhhh...',
      '...hhssss...',
      '...hsesse...',
      '...sssss....',
      '....ssss....',
      '..bbbbbbbb..',
      '.sbbbbbbbb..',
      '..bbbbbbbbs.',
      '..bbbbbbbb..',
      '...pppppp...',
      '..ppp..ppp..',
      '.pp......pp.',
      '.pp......pp.',
      'kkk......kkk',
      '............',
    ],
    [
      '............',
      '....hhhh....',
      '...hhhhhh...',
      '...hhssss...',
      '...hsesse...',
      '...sssss....',
      '....ssss....',
      '..bbbbbbbb..',
      '.sbbbbbbbbs.',
      '.sbbbbbbbbs.',
      '..bbbbbbbb..',
      '...pppppp...',
      '...pppppp...',
      '...pp.pp....',
      '...pp.pp....',
      '..kkk.kkk...',
    ],
    [
      '....hhhh....',
      '...hhhhhh...',
      '...hhssss...',
      '...hsesse...',
      '...sssss....',
      '....ssss....',
      '..bbbbbbbb..',
      '..bbbbbbbbs.',
      '.sbbbbbbbb..',
      '..bbbbbbbb..',
      '...pppppp...',
      '..ppp..ppp..',
      '.pp......pp.',
      '.pp......pp.',
      'kkk......kkk',
      '............',
    ],
  ];

  const WAVE = [
    [
      '....hhhh...s',
      '...hhhhhh..s',
      '...hhssss..s',
      '...hsesse..s',
      '...smmss..bs',
      '....ssss..b.',
      '..bbbbbbbbb.',
      '.sbbbbbbbb..',
      '.sbbbbbbbb..',
      '..bbbbbbbb..',
      '...pppppp...',
      '...ppp.ppp..',
      '...pp...pp..',
      '...pp...pp..',
      '..kkk...kkk.',
      '............',
    ],
    [
      '....hhhh..s.',
      '...hhhhhh.s.',
      '...hhssss.s.',
      '...hsessebs.',
      '...smmss.b..',
      '....ssss.b..',
      '..bbbbbbbbb.',
      '.sbbbbbbbb..',
      '.sbbbbbbbb..',
      '..bbbbbbbb..',
      '...pppppp...',
      '...ppp.ppp..',
      '...pp...pp..',
      '...pp...pp..',
      '..kkk...kkk.',
      '............',
    ],
  ];

  const DANCE_A = [
    's...hhhh...s',
    's..hhhhhh..s',
    's..hhssss..s',
    'b..hsesse..b',
    'b..smmss...b',
    '.b..ssss..b.',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...pppppp...',
    '...ppp.ppp..',
    '...pp...pp..',
    '...pp...pp..',
    '..kkk...kkk.',
    '............',
  ];
  const DANCE_B = [
    '............',
    's...hhhh...s',
    's..hhhhhh..s',
    's..hhssss..s',
    'b..hsesse..b',
    'b..smmss...b',
    '.b..ssss..b.',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...pppppp...',
    '..ppp..ppp..',
    '.pp......pp.',
    'kkk......kkk',
    '............',
  ];
  const DANCE_C = [
    '..s.hhhh.s..',
    '..shhhhhhs..',
    '...hhssss...',
    '..bhsesseb..',
    '...smmss....',
    '....ssss....',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '..bbbbbbbb..',
    '...pppppp...',
    '...ppp.ppp..',
    '...pp...pp..',
    '...pp...pp..',
    '..kkk...kkk.',
    '............',
  ];
  const mirror = (frame) => frame.map((row) => row.split('').reverse().join(''));
  const DANCE = [DANCE_A, DANCE_B, DANCE_C, mirror(DANCE_B)];

  const CELL_W = 12;
  const CELL_H = 16;

  // ───────────────────────── State ─────────────────────────
  const stage = /** @type {HTMLElement} */ (document.getElementById('stage'));
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('avatar'));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const bubble = /** @type {HTMLElement} */ (document.getElementById('bubble'));
  const bubbleText = /** @type {HTMLElement} */ (document.getElementById('bubble-text'));
  const bubbleSub = /** @type {HTMLElement} */ (document.getElementById('bubble-sub'));
  const countdown = /** @type {HTMLElement} */ (document.getElementById('countdown'));
  const settingsBtn = /** @type {HTMLElement} */ (document.getElementById('settings-btn'));

  /** @type {any} */
  let config = null;
  /** @type {HTMLImageElement | null} */
  let sheet = null;
  /** @type {HTMLCanvasElement[][]} */
  let prerendered = [];
  let spriteW = CELL_W * 4;
  let spriteH = CELL_H * 4;

  /** @type {'walk' | 'wave' | 'dance' | 'nice'} */
  let mode = 'walk';
  let modeStart = 0;
  let x = 10;
  let dir = 1;
  let lastTs = 0;
  let schedule = { nextAt: null, paused: false, drinksToday: 0 };
  let bubbleTimer = 0;

  const WAVE_MS = 1200;
  const DANCE_MS = 2000;
  const NICE_MS = 2400;

  // ───────────────────────── Setup ─────────────────────────
  function applyConfig(next, spriteUri) {
    config = next;
    sheet = null;
    if (spriteUri) {
      const img = new Image();
      img.onload = () => {
        sheet = img;
        spriteW = config.sprite.frameWidth * Math.max(1, Math.round(config.avatar.scale / 2));
        spriteH = config.sprite.frameHeight * Math.max(1, Math.round(config.avatar.scale / 2));
        resizeCanvas();
      };
      img.onerror = () => {
        sheet = null;
        useDefaultBuddy();
      };
      img.src = spriteUri;
    } else {
      useDefaultBuddy();
    }
  }

  function useDefaultBuddy() {
    const scale = config.avatar.scale;
    spriteW = CELL_W * scale;
    spriteH = CELL_H * scale;
    const palette = {
      h: config.avatar.hairColor,
      s: config.avatar.skinColor,
      e: '#1f1f1f',
      m: '#c07a5e',
      b: config.avatar.shirtColor,
      p: config.avatar.pantsColor,
      k: '#2b2b2b',
    };
    prerendered = [WALK, WAVE, DANCE].map((set) => set.map((frame) => bake(frame, palette, scale)));
    resizeCanvas();
  }

  function bake(frame, palette, scale) {
    const c = document.createElement('canvas');
    c.width = CELL_W * scale;
    c.height = CELL_H * scale;
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    for (let y = 0; y < CELL_H; y++) {
      const row = frame[y] || '';
      for (let xx = 0; xx < CELL_W; xx++) {
        const ch = row[xx];
        if (!ch || ch === '.') continue;
        g.fillStyle = palette[ch] || '#ff00ff';
        g.fillRect(xx * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  function resizeCanvas() {
    canvas.width = spriteW;
    canvas.height = spriteH;
    canvas.style.width = spriteW + 'px';
    canvas.style.height = spriteH + 'px';
    ctx.imageSmoothingEnabled = false;
    x = Math.min(x, Math.max(0, stage.clientWidth - spriteW));
  }

  // ───────────────────────── Animation loop ─────────────────────────
  function frameIndex(count, fps, since) {
    return Math.floor((since / 1000) * fps) % Math.max(1, count);
  }

  function draw(ts) {
    requestAnimationFrame(draw);
    if (!config) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    const since = ts - modeStart;

    // Mode transitions
    if (mode === 'wave' && since >= WAVE_MS) setMode('dance', ts);
    else if (mode === 'dance' && since >= DANCE_MS) {
      setMode('nice', ts);
      showBubble('Nice!', schedule.drinksToday > 0 ? `💧 ${schedule.drinksToday} today` : '');
    } else if (mode === 'nice' && since >= NICE_MS) setMode('walk', ts);

    // Movement (walking only)
    const maxX = Math.max(0, stage.clientWidth - spriteW);
    if (mode === 'walk') {
      const speed = 38 * config.avatar.speed;
      x += dir * speed * dt;
      if (x >= maxX) { x = maxX; dir = -1; }
      if (x <= 0) { x = 0; dir = 1; }
    }
    canvas.style.left = Math.round(x) + 'px';
    positionBubble();

    // Pick frame
    let row = 0;
    let idx = 0;
    const fps = sheet ? config.sprite.fps : 8;
    if (mode === 'walk') { row = 0; idx = frameIndex(sheet ? config.sprite.walkFrames : WALK.length, sheet ? fps : 7 * config.avatar.speed, ts); }
    else if (mode === 'wave') { row = 1; idx = frameIndex(sheet ? config.sprite.waveFrames : WAVE.length, sheet ? fps : 4, since); }
    else if (mode === 'dance') { row = 2; idx = frameIndex(sheet ? config.sprite.danceFrames : DANCE.length, sheet ? fps : 8, since); }
    else { row = 1; idx = 0; } // 'nice': stand still, waving pose

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    // Frames face right; mirror when walking left. Celebrations always face the viewer (right).
    const faceLeft = mode === 'walk' && dir < 0;
    if (faceLeft) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    if (sheet) {
      const fw = config.sprite.frameWidth;
      const fh = config.sprite.frameHeight;
      ctx.drawImage(sheet, idx * fw, row * fh, fw, fh, 0, 0, canvas.width, canvas.height);
    } else if (prerendered[row]) {
      const img = prerendered[row][idx % prerendered[row].length];
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();
  }

  function setMode(next, ts) {
    mode = next;
    modeStart = ts;
  }

  function positionBubble() {
    if (bubble.classList.contains('hidden')) return;
    bubble.style.left = Math.round(x + spriteW / 2) + 'px';
    bubble.style.bottom = Math.round(spriteH + 22) + 'px';
  }

  function showBubble(text, sub) {
    bubbleText.textContent = text;
    bubbleSub.textContent = sub || '';
    bubble.classList.remove('hidden');
    bubble.style.animation = 'none';
    void bubble.offsetWidth; // restart pop animation
    bubble.style.animation = '';
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), NICE_MS);
    positionBubble();
  }

  // ───────────────────────── Celebration ─────────────────────────
  function celebrate(drinksToday) {
    schedule.drinksToday = drinksToday;
    bubble.classList.add('hidden');
    setMode('wave', performance.now());
    if (config && config.soundsEnabled) chime();
  }

  /** @type {AudioContext | null} */
  let audio = null;
  function chime() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const now = audio.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.11 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.18);
        osc.connect(gain).connect(audio.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.2);
      });
    } catch {
      // Audio is a nice-to-have.
    }
  }

  // ───────────────────────── Countdown ─────────────────────────
  function renderCountdown() {
    if (schedule.paused || !schedule.nextAt) {
      countdown.textContent = 'Reminders paused';
      return;
    }
    const remaining = Math.max(0, schedule.nextAt - Date.now());
    const total = Math.round(remaining / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const clock = new Date(schedule.nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    countdown.textContent = `Next sip at ${clock} · in ${m}m ${String(s).padStart(2, '0')}s`;
  }
  setInterval(renderCountdown, 1000);

  // ───────────────────────── Wiring ─────────────────────────
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'config':
        applyConfig(msg.config, msg.spriteUri);
        break;
      case 'schedule':
        schedule = msg.snapshot;
        renderCountdown();
        break;
      case 'celebrate':
        celebrate(msg.drinksToday);
        break;
    }
  });

  stage.addEventListener('click', () => {
    if (mode !== 'walk') return; // already celebrating
    vscode.postMessage({ type: 'drink' });
  });
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'openSettings' });
  });
  window.addEventListener('resize', resizeCanvas);

  vscode.postMessage({ type: 'ready' });
  requestAnimationFrame(draw);
})();
