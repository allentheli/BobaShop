// The row of pictures for one order, used on the counter and at inspection.
// Each picture sits on a tile with the color and number of its row on the
// printed ticket, so the cashier circles exactly what the screen shows.

import { MENU } from './menu.js';
import { ICONS } from './assets.js';
import { h, icon } from './ui.js';

// width: the space the tiles may use, in stage pixels. Tiles shrink to fit
// when an order has many details.
export function orderIcons(order, { width = 560, max = 110 } = {}) {
  const parts = [];
  for (const id of MENU.showOrder) {
    const d = MENU.details.find((x) => x.id === id);
    if (!d || order[id] == null) continue;
    const o = d.options.find((x) => x.id === order[id]);
    if (o && o.icon && ICONS[o.icon]) parts.push({ key: o.icon, row: d.row });
  }
  const gap = 8;
  const size = Math.max(56, Math.min(max, Math.floor((width - gap * (parts.length - 1)) / parts.length)));
  return parts.map(({ key, row }) => {
    const r = MENU.rows[row] || {};
    const tile = h('div', { class: 'order-tile', style: { width: `${size}px`, height: `${size}px`, '--row-fill': r.fill, '--row-line': r.line } },
      icon(key, 'order-icon'),
      h('span', { class: 'row-num' }, String(row)));
    return tile;
  });
}
