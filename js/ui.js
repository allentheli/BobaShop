// Small helpers for building screens.

import { ICONS } from './assets.js';
import { play, resume } from './audio.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv;
      }
    }
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

// Every button responds once. Each button ignores a second tap within a
// short time (a double tap), and a button that has just appeared ignores
// taps for a moment (so a double tap on Next does not also press whatever
// appears under the finger). Different buttons never block each other, so
// several kids can tap at once.
export function onTap(el, fn, { sound = 'tap', gap = 350 } = {}) {
  const bornAt = performance.now();
  let lastTapAt = 0;
  el.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (el.disabled || el.classList.contains('disabled')) return;
    const now = performance.now();
    if (now - lastTapAt < gap || now - bornAt < 250) return;
    lastTapAt = now;
    resume();
    if (sound) play(sound);
    fn(e);
  });
  return el;
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Where an element is, in stage coordinates (the stage is scaled to fit).
export function stagePos(el, stage, scale) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - s.left) / scale, y: (r.top + r.height / 2 - s.top) / scale };
}

// A big arrow button that moves to the next step.
export function nextButton(cls = '') {
  return h('button', { class: `btn round next-btn ${cls}`, 'aria-label': 'Next' }, h('span', { class: 'arrow' }));
}

// An apron picture in a given color, drawn in code.
export function apronSvg(color, cls = 'apron') {
  const el = h('div', { class: cls });
  el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M34 8 Q50 18 66 8" fill="none" stroke="#3b2a4a" stroke-width="4" stroke-linecap="round"/>
    <path d="M34 8 L32 30 L14 38 Q20 60 22 92 H78 Q80 60 86 38 L68 30 L66 8 Q50 16 34 8 Z" fill="${color}" stroke="#3b2a4a" stroke-width="4" stroke-linejoin="round"/>
    <rect x="36" y="54" width="28" height="20" rx="4" fill="#fff" fill-opacity=".55" stroke="#3b2a4a" stroke-width="3"/>
    <path d="M14 38 Q4 44 6 56 M86 38 Q96 44 94 56" fill="none" stroke="#3b2a4a" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
  return el;
}
