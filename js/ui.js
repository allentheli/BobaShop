// Small helpers for building screens.

import { ICONS } from './assets.js';
import { play } from './audio.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export function icon(key, cls = 'icon') {
  return h('img', { class: cls, src: ICONS[key], alt: '', draggable: 'false' });
}

// Every button responds once: repeated taps within a short time, and taps
// on a disabled button, are ignored.
let lastTapAt = 0;
export function onTap(el, fn, { sound = 'tap', gap = 350 } = {}) {
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (el.disabled || el.classList.contains('disabled')) return;
    const now = performance.now();
    if (now - lastTapAt < gap) return;
    lastTapAt = now;
    if (sound) play(sound);
    fn(e);
  });
  return el;
}

// A button that only works after being held down (for parents).
export function onHold(el, fn, seconds = 3) {
  let timer = null;
  const ring = h('div', { class: 'hold-ring' });
  el.appendChild(ring);
  const start = (e) => {
    e.preventDefault();
    cancel();
    el.classList.add('holding');
    ring.style.transitionDuration = `${seconds}s`;
    timer = setTimeout(() => { cancel(); play('tap'); fn(); }, seconds * 1000);
  };
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    el.classList.remove('holding');
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  return el;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Where an element is, in stage coordinates (the stage is scaled to fit).
export function stagePos(el, stage, scale) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - s.left) / scale, y: (r.top + r.height / 2 - s.top) / scale };
}
