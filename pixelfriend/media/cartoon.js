// @ts-check
/* Host glue for the cartoon character inside the VS Code webview. The engine (character.bundle.js)
 * already reacts to 'ask' / 'celebrate' messages; this adds the countdown, bubble and click-to-drink. */
(function () {
  const vscode = window.__vscodeApi;
  const bubble = /** @type {HTMLElement} */ (document.getElementById('bubble'));
  const bubbleSub = /** @type {HTMLElement} */ (document.getElementById('bubble-sub'));
  const countdown = /** @type {HTMLElement} */ (document.getElementById('countdown'));
  let schedule = { nextAt: null, paused: false, drinksToday: 0 };
  let bubbleTimer = 0;

  function renderCountdown() {
    if (schedule.paused || !schedule.nextAt) { countdown.textContent = 'Reminders paused'; return; }
    const total = Math.max(0, Math.round((schedule.nextAt - Date.now()) / 1000));
    const clock = new Date(schedule.nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    countdown.textContent = `Next sip at ${clock} · in ${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
  }
  setInterval(renderCountdown, 1000);

  window.addEventListener('message', (event) => {
    const msg = event.data || {};
    if (msg.type === 'schedule') { schedule = msg.snapshot; renderCountdown(); }
    if (msg.type === 'celebrate') {
      schedule.drinksToday = msg.drinksToday;
      bubbleSub.textContent = msg.drinksToday > 0 ? `💧 ${msg.drinksToday} today` : '';
      bubble.classList.remove('hidden');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), 2600);
    }
  });

  document.getElementById('stage')?.addEventListener('click', () => {
    if (window.PixelCharacter && window.PixelCharacter.isAsking()) { window.PixelCharacter.celebrate(); }
    vscode.postMessage({ type: 'drink' });
  });
  document.getElementById('settings-btn')?.addEventListener('click', (e) => { e.stopPropagation(); vscode.postMessage({ type: 'openSettings' }); });
  vscode.postMessage({ type: 'ready' });
})();
