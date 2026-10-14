// Puts the shop's decorations on screen: styles on the wall, floor,
// counter and sign, and pictures for the things. Used by the shop screen
// and by the catalog's little preview of the shop.

import { DEFAULTS } from './decor.js';
import { h } from './ui.js';
import { t } from './text.js';

// els: { wall, floor, counter, sign, things, counterThings }
// look: from shopLook() in js/decor.js. newId: a just-bought thing to pop in.
export function applyDecor(els, look, newId = null) {
  for (const kind of ['wall', 'floor', 'counter', 'sign']) {
    const el = els[kind];
    if (!el) continue;
    for (const c of [...el.classList]) if (c.startsWith(`${kind}-`) && !['sign-open', 'sign-closed', 'sign-face'].includes(c)) el.classList.remove(c);
    el.classList.add(look[kind] || DEFAULTS[kind]);
  }
  if (els.things) els.things.replaceChildren();
  if (els.counterThings) els.counterThings.replaceChildren();
  for (const t of look.things || []) {
    const img = h('img', { class: `decor-thing ${t.id === newId ? 'new-thing' : ''}`, src: t.file, alt: '', draggable: 'false' });
    if (t.onCounter && els.counterThings) {
      // Things on the counter are placed relative to the counter top (y 600).
      Object.assign(img.style, { left: `${t.at.x}px`, top: `${t.at.y - 600}px`, width: `${t.at.w}px` });
      els.counterThings.appendChild(img);
    } else if (els.things) {
      Object.assign(img.style, { left: `${t.at.x}px`, top: `${t.at.y}px`, width: `${t.at.w}px` });
      els.things.appendChild(img);
    }
  }
}

// A small copy of the shop (wall, floor, door, sign, counter and things),
// for the catalog. scale: how small to draw it.
export function miniShop(scale = 0.4) {
  const wall = h('div', { class: 'wall' });
  const floor = h('div', { class: 'floor' });
  const things = h('div', { class: 'decor-things' });
  const counterThings = h('div', { class: 'decor-things' });
  const sign = h('div', { class: 'sign mini-sign' },
    h('div', { class: 'sign-face sign-open' }, t('ui.open')));
  const counter = h('div', { class: 'counter mini-counter' }, counterThings);
  const stage = h('div', { class: 'mini-stage' },
    wall, floor,
    h('div', { class: 'door' }, h('div', { class: 'door-window' }), h('div', { class: 'door-knob' })),
    things, sign, counter);
  stage.style.transform = `scale(${scale})`;
  const box = h('div', { class: 'mini-shop', style: { width: `${1180 * scale}px`, height: `${720 * scale}px` } }, stage);
  return { el: box, els: { wall, floor, counter, sign, things, counterThings } };
}
