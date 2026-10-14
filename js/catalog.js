// The decoration shop: a catalog of wall, floor, counter, sign and things,
// paid for from the savings jar. A little copy of the shop on top shows how
// it looks. Items show their price in coins; there are no mystery prizes.
//
// mode 'buy': the day's decorator may buy one thing (at closing).
// mode 'arrange': switch between things already bought (title screen).

import { CATALOG, KINDS, decorState, owns, shopLook, buy, choose } from './decor.js';
import { applyDecor, miniShop } from './decorview.js';
import { t, line } from './text.js';
import { play } from './audio.js';
import { h, icon, onTap } from './ui.js';

// host: where it opens. getSave()/onSave(): the save record.
// canBuy: true when a purchase is allowed now. onBought(id) after buying.
// say(text): the boss speaks. onClose(): the catalog was closed.
export function openCatalog(host, { getSave, onSave, canBuy = false, bought = false, dayNumber = 0, say = () => {}, onBought = () => {}, onClose = () => {}, embedded = false, scale = 0.36 }) {
  let kind = 'wall';
  let flashId = null;
  let armedId = null;   // an item tapped once, waiting for the second tap
  const mini = miniShop(scale);
  const jarNum = h('span', { class: 'jar-num' });
  const tabs = h('div', { class: 'decor-tabs' });
  const grid = h('div', { class: 'decor-grid scroll' });
  const note = h('div', { class: 'decor-note parent-label small' });
  const close = h('button', { class: 'btn round decor-close', 'aria-label': t('ui.done') }, icon('check'));
  const panel = h('div', { class: `decor-panel ${embedded ? 'embedded' : ''}` },
    h('div', { class: 'decor-card' },
      h('div', { class: 'decor-top' },
        mini.el,
        h('div', { class: 'decor-jar' }, h('div', { class: 'jar' }, icon('coin', 'jar-coin-big')), jarNum, h('div', { class: 'parent-label small' }, t('ui.jar')))),
      tabs, grid, note),
    embedded ? null : close);
  host.appendChild(panel);
  if (!embedded) onTap(close, () => { panel.remove(); onClose(); });

  const swatch = (it) => {
    if (it.kind === 'things') return h('img', { class: 'decor-swatch-img', src: it.file, alt: '' });
    if (it.kind === 'sign') return h('div', { class: `sign swatch-sign ${it.id}` }, h('div', { class: 'sign-face sign-open' }, 'Open'));
    return h('div', { class: `decor-swatch ${it.kind} ${it.id}` });
  };

  function draw() {
    const save = getSave();
    const dec = decorState(save.decorations);
    jarNum.textContent = String(save.savings);
    applyDecor(mini.els, shopLook(dec), flashId);
    flashId = null;
    tabs.replaceChildren(...KINDS.map((k) => {
      const sample = CATALOG.find((c) => c.kind === k && (k === 'things' || c.price > 0));
      const b = h('button', { class: `btn decor-tab ${k === kind ? 'chosen' : ''}` }, swatch(sample), h('span', {}, t(`kinds.${k}`)));
      onTap(b, () => { kind = k; armedId = null; draw(); });
      return b;
    }));
    grid.replaceChildren(...CATALOG.filter((c) => c.kind === kind).map((it) => {
      const have = owns(dec, it.id);
      const inUse = it.kind === 'things' ? have && !dec.hidden.includes(it.id) : dec.chosen[it.kind] === it.id;
      const afford = save.savings >= it.price;
      const state = have ? (inUse ? 'in-use' : 'owned') : (canBuy && afford ? 'buyable' : 'locked');
      const price = have ? h('div', { class: 'decor-have' }, inUse ? '✓' : '') : h('div', { class: 'decor-price' }, icon('coin', 'price-coin-sm'), h('span', {}, String(it.price)));
      const b = h('button', { class: `btn decor-item ${state} ${armedId === it.id ? 'armed' : ''}` }, swatch(it), price);
      onTap(b, () => tapItem(it, have, afford), { sound: null });
      return b;
    }));
    note.textContent = canBuy ? '' : bought ? t('ui.boughtToday') : t('ui.buyAtClosing');
  }

  function tapItem(it, have, afford) {
    const save = getSave();
    if (have) {
      armedId = null;
      play('tap');
      save.decorations = choose(save.decorations, it.id);
      onSave();
      draw();
      return;
    }
    if (!canBuy) { play('hmm'); if (!bought) say(line('say.buyLater')); return; }
    if (!afford) { play('hmm'); say(line('say.tooMuch')); return; }
    // The first tap shows it in the little shop; a second tap buys it, so
    // a stray tap never spends the jar.
    if (armedId !== it.id) {
      play('tap');
      armedId = it.id;
      draw();
      applyDecor(mini.els, shopLook(buy(save.decorations, 9999, it.id).dec));
      say(t(`decor.${it.id}`));
      return;
    }
    armedId = null;
    const r = buy(save.decorations, save.savings, it.id, dayNumber);
    if (!r.ok) return;
    save.decorations = r.dec;
    save.savings = r.savings;
    onSave();
    play('fanfare');
    flashId = it.id;
    canBuy = false;
    bought = true;
    draw();
    say(line('say.bought'));
    onBought(it.id);
  }

  draw();
  return { panel, refresh: draw };
}
