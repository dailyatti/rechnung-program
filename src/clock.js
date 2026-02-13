import { $ } from './utils.js';

export function initClock() {
  const el = $("liveClock");
  if (!el) return;

  function update() {
    const now = new Date();
    const opts = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    el.textContent = now.toLocaleDateString('de-DE', opts);
  }

  update();
  setInterval(update, 1000);
}
