// Parent settings. Opened from the title screen (hold "Parents") or from
// the pause menu during a day. Settings are stored as overrides of
// js/config.js in save.settings.
//
// The order level and the cup counts start with the next day, so a shift
// never changes halfway. Everything else takes effect right away.

import { MENU } from './menu.js';
import { APRONS } from './jobs.js';
import { t } from './text.js';
import { h, onTap } from './ui.js';

const LEVELS = [
  'Tea and topping',
  '+ cup size',
  '+ extra topping',
  '+ ice',
  '+ sugar',
  '+ fresh topping',
  '+ a longer line',
  '+ freshly brewed tea',
];

// Details a parent can switch on or off, with the level they normally start at.
const TOGGLES = [
  { id: 'size', label: 'Cup size', level: 2 },
  { id: 'extra', label: 'Extra topping', level: 3 },
  { id: 'ice', label: 'Ice', level: 4 },
  { id: 'sugar', label: 'Sugar', level: 5 },
  { id: 'fresh', label: 'Fresh topping', level: 6 },
  { id: 'longLine', label: 'Longer line', level: 7 },
  { id: 'brew', label: 'Freshly brewed tea', level: 8 },
];

const ALL_JOBS = ['cashier', 'manager', 'topping', 'tea', 'maker', 'front'];

// save: the save record; getConfig(): the current config with settings applied
// onChange(): called after every change (the caller saves and reloads config)
// onReset(kind): 'day' or 'everything'; onDemo(): start the demo (or null)
// onClose(): the panel was closed
export function openSettings({ host, save, getConfig, onChange, onReset, onDemo = null, onClose, dayRunning = false }) {
  const st = save.settings;
  const body = h('div', { class: 'settings-body scroll' });
  const closeBtn = h('button', { class: 'btn settings-close' }, 'Done');
  const panel = h('div', { class: 'parent-panel settings-panel' },
    h('div', { class: 'settings-card' },
      h('div', { class: 'settings-head' }, h('h2', {}, 'Parent settings'), closeBtn),
      body));
  host.appendChild(panel);
  onTap(closeBtn, () => { panel.remove(); onClose(); });

  const set = (key, value) => { st[key] = value; onChange(); draw(); };

  // A row of choice buttons.
  function choices(items, current, pick) {
    return h('div', { class: 'choice-row' }, ...items.map(([value, label]) => {
      const b = h('button', { class: `btn choice ${value === current ? 'chosen' : ''}` }, label);
      onTap(b, () => pick(value));
      return b;
    }));
  }

  function section(title, note, ...content) {
    return h('section', { class: 'settings-section' },
      h('h3', {}, title),
      note ? h('p', { class: 'settings-note' }, note) : null,
      ...content);
  }

  function stepper(value, min, max, apply) {
    const input = h('input', { class: 'num-input', type: 'number', inputmode: 'numeric', min: String(min), max: String(max), value: String(value) });
    const clamp = (n) => Math.max(min, Math.min(max, Math.round(Number(n) || 0)));
    input.addEventListener('change', () => apply(clamp(input.value)));
    const minus = h('button', { class: 'btn step' }, '−');
    const plus = h('button', { class: 'btn step' }, '+');
    onTap(minus, () => apply(clamp(value - 1)), { gap: 120 });
    onTap(plus, () => apply(clamp(value + 1)), { gap: 120 });
    return h('div', { class: 'stepper' }, minus, input, plus);
  }

  // A slider from 1 to 5, then Chaos (no limit, stored as 99).
  function drinksSlider(value) {
    const stops = [1, 2, 3, 4, 5, 99];
    const at = Math.max(0, stops.indexOf(value));
    const range = h('input', { class: 'drinks-range', type: 'range', min: '0', max: String(stops.length - 1), step: '1', value: String(at) });
    const label = h('div', { class: 'drinks-value' });
    const show = (i) => { label.textContent = stops[i] === 99 ? 'Chaos! No limit' : `${stops[i]} at once`; };
    show(at);
    range.addEventListener('input', () => show(Number(range.value)));
    range.addEventListener('change', () => set('drinksInProgress', stops[Number(range.value)]));
    const ticks = h('div', { class: 'drinks-ticks' }, ...stops.map((n) => h('span', {}, n === 99 ? 'Chaos' : String(n))));
    return h('div', { class: 'drinks-slider' }, label, range, ticks);
  }

  function draw() {
    const c = getConfig();
    const nextDay = dayRunning ? ' Starts with the next day.' : '';
    const enabled = c.enabledDetails || {};
    const isOn = (tg) => (enabled[tg.id] !== undefined ? enabled[tg.id] : c.level >= tg.level);
    const custom = Object.keys(enabled).length > 0;

    const toggles = h('div', { class: 'choice-row wrap' }, ...TOGGLES.map((tg) => {
      const b = h('button', { class: `btn chip ${isOn(tg) ? 'on' : ''}` }, `${isOn(tg) ? '✓ ' : ''}${tg.label}`);
      onTap(b, () => set('enabledDetails', { ...enabled, [tg.id]: !isOn(tg) }));
      return b;
    }));

    const owned = c.owned || {};
    const ownedRow = (detailId, word) => {
      const d = MENU.details.find((x) => x.id === detailId);
      const list = owned[detailId] || d.options.filter((o) => !o.always).map((o) => o.id);
      return h('div', { class: 'choice-row wrap' }, ...d.options.filter((o) => !o.always).map((o) => {
        const on = list.includes(o.id);
        const b = h('button', { class: `btn chip ${on ? 'on' : ''}` }, `${on ? '✓ ' : ''}${word(o.id)}`);
        onTap(b, () => {
          const next = on ? list.filter((x) => x !== o.id) : [...list, o.id];
          if (next.length === 0) return;   // keep at least one
          set('owned', { ...owned, [detailId]: next });
        });
        return b;
      }));
    };
    const words = { milk: 'Milk tea', matcha: 'Matcha', taro: 'Taro', pearls: 'Boba pearls', jelly: 'Coconut jelly', hearts: 'Gummy hearts' };

    const locks = c.jobLocks || {};
    const lockRows = APRONS.map((a) => {
      const cur = locks[a.id] || '';
      const b = h('button', { class: 'btn chip lock-chip' }, cur ? t(`jobs.${cur}`) : 'Rotates');
      onTap(b, () => {
        const order = ['', ...ALL_JOBS];
        const next = order[(order.indexOf(cur) + 1) % order.length];
        const nl = { ...locks };
        if (next) nl[a.id] = next; else delete nl[a.id];
        set('jobLocks', nl);
      });
      return h('div', { class: 'lock-row' }, h('span', { class: 'lock-dot', style: { background: a.color } }), h('span', { class: 'lock-name' }, t(`aprons.${a.id}`)), b);
    });

    const resetDay = h('button', { class: 'btn danger' }, 'Reset the day');
    const resetAll = h('button', { class: 'btn danger' }, 'Reset everything');
    const confirmTap = (btn, label, fn) => {
      let armed = false;
      onTap(btn, () => {
        if (!armed) { armed = true; btn.textContent = `Tap again: ${label}`; btn.classList.add('armed'); setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('armed'); }, 3000); return; }
        panel.remove();
        onReset(label === 'Reset the day' ? 'day' : 'everything');
      });
    };
    confirmTap(resetDay, 'Reset the day', null);
    confirmTap(resetAll, 'Reset everything', null);

    const demoBtn = onDemo ? h('button', { class: 'btn choice' }, 'Play a demo shift (fast, by itself)') : null;
    if (demoBtn) onTap(demoBtn, () => { panel.remove(); onDemo(); });

    const scrollTop = body.scrollTop;
    body.replaceChildren(
      section('Order level', `Each level adds one detail to the orders.${nextDay}`,
        choices(LEVELS.map((_, i) => [i + 1, String(i + 1)]), custom ? null : c.level, (v) => { st.level = v; st.enabledDetails = {}; onChange(); draw(); }),
        h('p', { class: 'settings-note strong' }, custom ? 'Custom: the details below are switched on by hand.' : `Level ${c.level}: ${LEVELS.slice(0, c.level).join(' ')}`),
        toggles),
      section('Before the shift', 'Full: meet the boss, jobs, the how-to cards and the checklists. Jobs only: no how-to cards. Skip: straight to the shop. (During the day you can also hold Skip.)',
        choices([['full', 'Full'], ['jobs', 'Jobs only'], ['skip', 'Skip to the shop']], c.setup, (v) => set('setup', v))),
      section('Our cups', `How many cups of each size are on the table. When every cup is used, the shop sells out and closes early. Cups are counted when orders have a size.${nextDay}`,
        h('div', { class: 'cup-row' },
          h('div', { class: 'cup-field' }, h('span', {}, 'Small'), stepper(c.cups.small, 0, 99, (v) => set('cups', { ...c.cups, small: v }))),
          h('div', { class: 'cup-field' }, h('span', {}, 'Large'), stepper(c.cups.large, 0, 99, (v) => set('cups', { ...c.cups, large: v }))))),
      section('Shift length', null,
        choices([[180, '3 min'], [240, '4 min'], [300, '5 min'], [360, '6 min'], [480, '8 min'], [600, '10 min']], c.shiftLength, (v) => set('shiftLength', v))),
      section('What we have', 'Customers only order teas and toppings you have. "No topping" can always be ordered.',
        h('div', { class: 'settings-sub' }, 'Teas'), ownedRow('tea', (id) => words[id] || id),
        h('div', { class: 'settings-sub' }, 'Toppings'), ownedRow('topping', (id) => words[id] || id)),
      section('Register (cashier)', 'Easy: tap the picture buttons. Medium: add the prices and type the total. Hard: the customer pays with a bigger coin; type the change.',
        choices([['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']], c.registerMode, (v) => set('registerMode', v))),
      section('Call mode (manager)', 'Easy: the ticket travels with the cup and the makers read it. Normal: only the manager holds the ticket and calls each step. Hard: customers only say hello, so the order is pictures only and the manager calls every step.',
        choices([['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], c.callMode, (v) => set('callMode', v))),
      section('Crowd', 'How fast customers come in. Normal: up to 3 in line. Busy: faster, up to 5 in line. Chaos: customers keep pouring in, with no limit on the line.',
        choices([['normal', 'Normal'], ['busy', 'Busy'], ['chaos', 'Chaos!']], c.crowd, (v) => set('crowd', v))),
      section('Drinks in progress at once', 'How many paid customers can wait for their drink at the same time. Chaos: no limit.',
        drinksSlider(c.drinksInProgress)),
      section('Waiting customers', 'When on, customers who wait too long leave. One who already paid gets their coins back.',
        choices([[true, 'Customers leave'], [false, 'Nobody leaves']], c.customersLeave, (v) => set('customersLeave', v)),
        choices([[true, 'Show patience bars'], [false, 'Hide patience bars']], c.patienceBar, (v) => set('patienceBar', v))),
      section('Lock an apron to a job', 'Tap to cycle. A locked apron always gets that job (when today\'s team has it). Others rotate each day.',
        h('div', { class: 'lock-grid' }, ...lockRows)),
      section('Sound', null,
        choices([[0.4, 'Quiet'], [0.8, 'Normal'], [1, 'Loud']], c.sound.volume, (v) => set('sound', { ...c.sound, volume: v })),
        choices([[true, 'Voice on'], [false, 'Voice off']], c.sound.voice, (v) => set('sound', { ...c.sound, voice: v }))),
      section('Music', 'The cashier picks a song on the shop radio before opening; the manager or cashier can change it by tapping the radio on the wall. The music gets quieter whenever someone talks.',
        choices([[true, 'Music on'], [false, 'Music off']], c.music.on, (v) => set('music', { ...c.music, on: v })),
        choices([[0.3, 'Quiet'], [0.6, 'Normal'], [0.9, 'Loud']], c.music.volume, (v) => set('music', { ...c.music, volume: v }))),
      demoBtn ? section('Demo', 'Watch a shift play itself at high speed. Nothing is saved.', demoBtn) : null,
      section('Reset', 'Reset the day starts today over. Reset everything also empties the savings jar, stars and history.',
        h('div', { class: 'choice-row' }, resetDay, resetAll)),
    );
    body.scrollTop = scrollTop;
  }

  draw();
  return panel;
}

