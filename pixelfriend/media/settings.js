// @ts-check
(function () {
  const vscode = acquireVsCodeApi();

  const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[data-key], select[data-key]'));
  const nextEl = /** @type {HTMLElement} */ (document.getElementById('next'));
  const drinksEl = /** @type {HTMLElement} */ (document.getElementById('drinks'));
  const pauseBtn = /** @type {HTMLButtonElement} */ (document.getElementById('pause-btn'));
  const spriteName = /** @type {HTMLElement} */ (document.getElementById('sprite-name'));
  const scaleOut = /** @type {HTMLOutputElement} */ (document.getElementById('scale-out'));
  const speedOut = /** @type {HTMLOutputElement} */ (document.getElementById('speed-out'));

  /** @type {any} */
  let snapshot = { nextAt: null, paused: false, drinksToday: 0 };

  function get(obj, dotted) {
    return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function fill(config) {
    inputs.forEach((input) => {
      const key = input.dataset.key || '';
      const value = get(config, key);
      if (value === undefined) return;
      if (input.type === 'checkbox') input.checked = Boolean(value);
      else input.value = String(value);
    });
    scaleOut.value = String(config.avatar.scale) + '×';
    speedOut.value = String(config.avatar.speed) + '×';
  }

  function renderNext() {
    if (snapshot.paused || !snapshot.nextAt) {
      nextEl.textContent = 'Paused';
      pauseBtn.textContent = 'Resume';
      return;
    }
    pauseBtn.textContent = 'Pause';
    const remaining = Math.max(0, snapshot.nextAt - Date.now());
    const total = Math.round(remaining / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    const clock = new Date(snapshot.nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    nextEl.textContent = `${clock} · in ${m}m ${String(s).padStart(2, '0')}s`;
  }
  setInterval(renderNext, 1000);

  inputs.forEach((input) => {
    const key = input.dataset.key || '';
    const commit = () => {
      let value;
      if (input.type === 'checkbox') value = input.checked;
      else if (input.type === 'number' || input.type === 'range') {
        value = Number(input.value);
        if (!Number.isFinite(value)) return;
      } else value = input.value;
      vscode.postMessage({ type: 'save', key, value });
    };
    if (input.type === 'range') {
      input.addEventListener('input', () => {
        if (key === 'avatar.scale') scaleOut.value = input.value + '×';
        if (key === 'avatar.speed') speedOut.value = input.value + '×';
      });
    }
    input.addEventListener('change', commit);
  });

  document.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      vscode.postMessage({ type: 'action', action: /** @type {HTMLElement} */ (btn).dataset.action });
    });
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type !== 'state') return;
    fill(msg.config);
    snapshot = msg.snapshot;
    drinksEl.textContent = String(snapshot.drinksToday);
    spriteName.textContent = msg.spriteName || 'Built-in buddy';
    renderNext();
  });

  vscode.postMessage({ type: 'ready' });
})();
