// The row of pictures for one order, used on the counter and at inspection.

import { MENU } from './menu.js';
import { ICONS } from './assets.js';
import { h, icon } from './ui.js';

// width: the space the pictures may use, in stage pixels. Pictures shrink
// to fit when an order has many details.
export function orderIcons(order, { width = 560, max = 110 } = {}) {
  const keys = [];
  for (const id of MENU.showOrder) {
    const d = MENU.details.find((x) => x.id === id);
    if (!d || order[id] == null) continue;
    const o = d.options.find((x) => x.id === order[id]);
    if (o && o.icon && ICONS[o.icon]) keys.push(o.icon);
  }
  const plus = keys.length <= 2;
  const gap = plus ? 50 : 8;
  const size = Math.max(54, Math.min(max, Math.floor((width - gap * (keys.length - 1)) / keys.length)));
  const items = [];
  keys.forEach((k, i) => {
    if (i && plus) items.push(h('span', { class: 'plus' }, '+'));
    const img = icon(k, 'order-icon');
    img.style.width = img.style.height = `${size}px`;
    items.push(img);
  });
  return items;
}
