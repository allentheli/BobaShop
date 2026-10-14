// Parent settings. Opened from the title screen (hold "Parents") or from
// the pause menu during a day. Settings are stored as overrides of
// js/config.js in save.settings.
//
// Every setting takes effect right away, even in the middle of a day:
// customers who have not paid yet get an order that fits a new level.

import { MENU } from './menu.js';
import { APRONS } from './jobs.js';
import { t, lookupList } from './text.js';
import { h, onTap } from './ui.js';
import { openBackup } from './backupui.js';

// Details a parent can switch on or off, with the level they normally start at.
const TOGGLES = [
  { id: 'size', level: 2 },
  { id: 'extra', level: 3 },
  { id: 'ice', level: 4 },
  { id: 'sugar', level: 5 },
  { id: 'fresh', level: 6 },
  { id: 'longLine', level: 7 },
  { id: 'brew', level: 8 },
];

// Each language names itself, so anyone can find their own.
export const LANGUAGES = [['en', 'English'], ['zh', '中文']];

const ALL_JOBS = ['cashier', 'manager', 'topping', 'tea', 'maker', 'front'];

// save: the save record; getConfig(): the current config with settings applied
// onChange(): called after every change (the caller saves and reloads config)
// onReset(kind): 'day' or 'everything'; onDemo(): start the demo (or null)
// onClose(): the panel was closed
export function openSettings({ host, save, getConfig, onChange, onReset, onDemo = null, onClose, onRestore = null }) {
  const st = save.settings;
  const body = h('div', { class: 'settings-body scroll' });
  const closeBtn = h('button', { class: 'btn settings-close' });
  const heading = h('h2');
  const panel = h('div', { class: 'parent-panel settings-panel' },
    h('div', { class: 'settings-card' },
      h('div', { class: 'settings-head' }, heading, closeBtn),
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
    const show = (i) => { label.textContent = stops[i] === 99 ? t('parent.drinksChaos') : t('parent.drinksAt', { n: stops[i] }); };
    show(at);
    range.addEventListener('input', () => show(Number(range.value)));
    range.addEventListener('change', () => set('drinksInProgress', stops[Number(range.value)]));
    const ticks = h('div', { class: 'drinks-ticks' }, ...stops.map((n) => h('span', {}, n === 99 ? t('parent.chaosTick') : String(n))));
    return h('div', { class: 'drinks-slider' }, label, range, ticks);
  }

  function draw() {
    const c = getConfig();
    // The language can change while the panel is open.
    heading.textContent = t('parent.title');
    closeBtn.textContent = t('parent.done');
    const levels = lookupList('parent.levels');
    const enabled = c.enabledDetails || {};
    const isOn = (tg) => (enabled[tg.id] !== undefined ? enabled[tg.id] : c.level >= tg.level);
    const custom = Object.keys(enabled).length > 0;

    const toggles = h('div', { class: 'choice-row wrap' }, ...TOGGLES.map((tg) => {
      const b = h('button', { class: `btn chip ${isOn(tg) ? 'on' : ''}` }, `${isOn(tg) ? '✓ ' : ''}${t(`parent.toggles.${tg.id}`)}`);
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
    const word = (id) => t(`parent.owned.${id}`);

    const locks = c.jobLocks || {};
    const lockRows = APRONS.map((a) => {
      const cur = locks[a.id] || '';
      const b = h('button', { class: 'btn chip lock-chip' }, cur ? t(`jobs.${cur}`) : t('parent.rotates'));
      onTap(b, () => {
        const order = ['', ...ALL_JOBS];
        const next = order[(order.indexOf(cur) + 1) % order.length];
        const nl = { ...locks };
        if (next) nl[a.id] = next; else delete nl[a.id];
        set('jobLocks', nl);
      });
      return h('div', { class: 'lock-row' }, h('span', { class: 'lock-dot', style: { background: a.color } }), h('span', { class: 'lock-name' }, t(`aprons.${a.id}`)), b);
    });

    const resetDay = h('button', { class: 'btn danger' }, t('parent.resetDay'));
    const resetAll = h('button', { class: 'btn danger' }, t('parent.resetAll'));
    const confirmTap = (btn, label, kind) => {
      let armed = false;
      onTap(btn, () => {
        if (!armed) { armed = true; btn.textContent = t('parent.tapAgain', { label }); btn.classList.add('armed'); setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('armed'); }, 3000); return; }
        panel.remove();
        onReset(kind);
      });
    };
    confirmTap(resetDay, t('parent.resetDay'), 'day');
    confirmTap(resetAll, t('parent.resetAll'), 'everything');

    const demoBtn = onDemo ? h('button', { class: 'btn choice' }, t('parent.demoBtn')) : null;
    if (demoBtn) onTap(demoBtn, () => { panel.remove(); onDemo(); });

    const backupBtn = h('button', { class: 'btn choice' }, t('parent.backupBtn'));
    if (onRestore) onTap(backupBtn, () => openBackup(panel, { getSave: () => save, onRestore: (s2) => { panel.remove(); onRestore(s2); } }));

    const scrollTop = body.scrollTop;
    body.replaceChildren(
      section(t('parent.language'), null,
        choices(LANGUAGES, c.language, (v) => set('language', v))),
      section(t('parent.levelTitle'), t('parent.levelNote'),
        choices(levels.map((_, i) => [i + 1, String(i + 1)]), custom ? null : c.level, (v) => { st.level = v; st.enabledDetails = {}; onChange(); draw(); }),
        h('p', { class: 'settings-note strong' }, custom ? t('parent.custom') : t('parent.levelSummary', { n: c.level, list: levels.slice(0, c.level).join(t('parent.levelJoin')) })),
        toggles),
      section(t('parent.setupTitle'), t('parent.setupNote'),
        choices(['full', 'jobs', 'skip'].map((k) => [k, t(`parent.setup.${k}`)]), c.setup, (v) => set('setup', v))),
      section(t('parent.afterTitle'), t('parent.afterNote'),
        choices([[true, t('parent.inspectOn')], [false, t('parent.inspectOff')]], c.afterShift.inspect, (v) => set('afterShift', { ...c.afterShift, inspect: v })),
        choices([[true, t('parent.badgesOn')], [false, t('parent.badgesOff')]], c.afterShift.badges, (v) => set('afterShift', { ...c.afterShift, badges: v }))),
      section(t('parent.cupsTitle'), t('parent.cupsNote'),
        h('div', { class: 'cup-row' },
          h('div', { class: 'cup-field' }, h('span', {}, t('parent.small')), stepper(c.cups.small, 0, 99, (v) => set('cups', { ...c.cups, small: v }))),
          h('div', { class: 'cup-field' }, h('span', {}, t('parent.large')), stepper(c.cups.large, 0, 99, (v) => set('cups', { ...c.cups, large: v }))))),
      section(t('parent.shiftTitle'), null,
        choices([180, 240, 300, 360, 480, 600].map((sec) => [sec, t('parent.minutes', { n: sec / 60 })]), c.shiftLength, (v) => set('shiftLength', v))),
      section(t('parent.haveTitle'), t('parent.haveNote'),
        h('div', { class: 'settings-sub' }, t('parent.teas')), ownedRow('tea', word),
        h('div', { class: 'settings-sub' }, t('parent.toppings')), ownedRow('topping', word)),
      section(t('parent.registerTitle'), t('parent.registerNote'),
        choices(['easy', 'medium', 'hard'].map((k) => [k, t(`parent.register.${k}`)]), c.registerMode, (v) => set('registerMode', v))),
      section(t('parent.callTitle'), t('parent.callNote'),
        choices(['easy', 'normal', 'hard'].map((k) => [k, t(`parent.call.${k}`)]), c.callMode, (v) => set('callMode', v))),
      section(t('parent.crowdTitle'), t('parent.crowdNote'),
        choices(['normal', 'busy', 'chaos'].map((k) => [k, t(`parent.crowd.${k}`)]), c.crowd, (v) => set('crowd', v))),
      section(t('parent.drinksTitle'), t('parent.drinksNote'),
        drinksSlider(c.drinksInProgress)),
      section(t('parent.waitTitle'), t('parent.waitNote'),
        choices([[true, t('parent.leaveOn')], [false, t('parent.leaveOff')]], c.customersLeave, (v) => set('customersLeave', v)),
        choices([[true, t('parent.barsOn')], [false, t('parent.barsOff')]], c.patienceBar, (v) => set('patienceBar', v))),
      section(t('parent.locksTitle'), t('parent.locksNote'),
        h('div', { class: 'lock-grid' }, ...lockRows)),
      section(t('parent.soundTitle'), null,
        choices([[0.4, t('parent.quiet')], [0.8, t('parent.normal')], [1, t('parent.loud')]], c.sound.volume, (v) => set('sound', { ...c.sound, volume: v })),
        choices([[true, t('parent.voiceOn')], [false, t('parent.voiceOff')]], c.sound.voice, (v) => set('sound', { ...c.sound, voice: v }))),
      section(t('parent.musicTitle'), t('parent.musicNote'),
        choices([[true, t('parent.musicOn')], [false, t('parent.musicOff')]], c.music.on, (v) => set('music', { ...c.music, on: v })),
        choices([[0.3, t('parent.quiet')], [0.6, t('parent.normal')], [0.9, t('parent.loud')]], c.music.volume, (v) => set('music', { ...c.music, volume: v }))),
      demoBtn ? section(t('parent.demoTitle'), t('parent.demoNote'), demoBtn) : null,
      onRestore ? section(t('parent.backupTitle'), t('parent.backupNote'), backupBtn) : null,
      section(t('parent.resetTitle'), t('parent.resetNote'),
        h('div', { class: 'choice-row' }, resetDay, resetAll)),
    );
    body.scrollTop = scrollTop;
  }

  draw();
  return panel;
}

