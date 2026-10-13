// The Open phase: customers come in, order, pay, wait and get served.
// The state lives in Shift (js/shift.js); this file draws it and handles taps.

import { Shift } from './shift.js';
import { MENU, option } from './menu.js';
import { CUSTOMERS, BOSS, ICONS } from './assets.js';
import { activeDetails, priceParts, price, starsFor } from './logic.js';
import { t, line, customerName, orderSentence } from './text.js';
import { speak, play, stopSpeaking, resume } from './audio.js';
import { createCharacter, setExpression, setTalking, act } from './character.js';
import { h, icon, onTap, wait } from './ui.js';
import { orderIcons } from './orderview.js';

// Where characters stand, in stage pixels (the stage is 1180 x 820).
// x, y is the point between the character's feet; s is the size.
const SLOTS = {
  // Up to 5 places in line (5 only at order level 7).
  line: [{ x: 345, y: 560, s: 0.6 }, { x: 255, y: 557, s: 0.58 }, { x: 170, y: 554, s: 0.56 }, { x: 95, y: 551, s: 0.54 }, { x: 30, y: 548, s: 0.52 }],
  counter: { x: 575, y: 655, s: 1.22 },
  waiting: [{ x: 910, y: 645, s: 0.8 }, { x: 1080, y: 645, s: 0.8 }],
  // A served customer steps forward from their waiting spot to the counter.
  pickup: { dy: 28, s: 0.92 },
  door: { x: 110, y: 540, s: 0.5 },
};

// restore: a saved shift to pick up again (from Shift.toJSON).
// onSave:  called with the shift's state every few seconds and after every
//          change, so the shift survives the app being closed.
export function startOpen({ app, config, demo = false, speed = 1, restore = null, onSave = () => {}, onFinish }) {
  const walkMs = config.anim.walk * 1000;
  const root = h('div', { class: 'screen open-screen' });
  const people = new Map();   // customer id -> { p, el, slot, busyUntil, mood, moodUntil }
  let shift;
  let finished = false;
  let wakeLock = null;

  // ---- Static parts of the screen --------------------------------------

  const scene = h('div', { class: 'scene' },
    h('div', { class: 'wall' }),
    h('div', { class: 'shelf shelf-1' }, icon('tea.milk', 'shelf-cup'), icon('tea.matcha', 'shelf-cup'), icon('tea.taro', 'shelf-cup')),
    h('div', { class: 'floor' }),
    h('div', { class: 'door' }, h('div', { class: 'door-window' }), h('div', { class: 'door-knob' })),
  );
  const chars = h('div', { class: 'chars' });
  scene.appendChild(chars);

  // Clock: the sun crosses the shop window.
  const sun = h('div', { class: 'sun' });
  const windowEl = h('div', { class: 'sky-window' }, h('div', { class: 'sky' }), sun, h('div', { class: 'hills' }), h('div', { class: 'window-bars' }));

  const sign = h('div', { class: 'sign' },
    h('div', { class: 'sign-face sign-open' }, t('ui.open')),
    h('div', { class: 'sign-face sign-closed' }, t('ui.closed')));

  // Money against the star goals.
  const goals = config.starGoals;
  const barMax = Math.round(goals[goals.length - 1] * 1.15);
  const moneyNum = h('div', { class: 'money-num' }, '0');
  const barFill = h('div', { class: 'bar-fill' });
  const starMarks = goals.map((g) => {
    const m = h('div', { class: 'star-mark', style: { left: `${(g / barMax) * 100}%` } }, icon('star', 'star-icon'), h('span', { class: 'star-goal' }, String(g)));
    return m;
  });
  const money = h('div', { class: 'money' },
    h('div', { class: 'money-top' }, icon('coin', 'money-coin'), moneyNum),
    h('div', { class: 'bar' }, barFill, ...starMarks));

  const top = h('div', { class: 'topbar' }, windowEl, sign, money);

  // Order bubble over the counter customer.
  const bubbleNum = h('div', { class: 'order-num' });
  const bubbleItems = h('div', { class: 'order-items' });
  const repeatBtn = h('button', { class: 'btn round repeat', 'aria-label': t('ui.repeat') }, icon('speaker'));
  const bubble = h('div', { class: 'order-bubble hidden' }, bubbleNum, bubbleItems, repeatBtn);

  // Register on the counter.
  const partsRow = h('div', { class: 'reg-parts' });
  const trayCoins = h('div', { class: 'tray-coins' });
  const trayNum = h('div', { class: 'tray-num' }, '0');
  const clearBtn = h('button', { class: 'btn round reg-clear', 'aria-label': t('ui.clear') }, icon('clear'));
  const ringBtn = h('button', { class: 'btn round reg-ring', 'aria-label': t('ui.ringUp') }, icon('check'));
  const drawer = h('div', { class: 'drawer' }, h('div', { class: 'drawer-coins' }));
  const register = h('div', { class: 'register disabled' },
    partsRow,
    h('div', { class: 'tray' }, trayCoins, trayNum),
    clearBtn, ringBtn, drawer);

  const finishBtn = h('button', { class: 'btn big finish hidden' }, h('span', { class: 'moon' }), h('span', { class: 'label' }, t('ui.finish')));

  const counter = h('div', { class: 'counter' }, register, finishBtn);
  const popupLayer = h('div', { class: 'popups' });

  root.append(top, scene, bubble, counter, popupLayer);
  app.replaceChildren(root);

  // ---- Register ------------------------------------------------------------

  let regParts = [];
  let regBusy = false;
  const details = activeDetails(MENU, config.level, config.enabledDetails).map((d) => d.id);
  const partDefs = [];
  if (details.includes('size')) {
    partDefs.push({ id: 'small', coins: config.prices.small, cls: 'cup-small', icon: 'size.small' });
    partDefs.push({ id: 'large', coins: config.prices.large, cls: 'cup-large', icon: 'size.large' });
  } else {
    partDefs.push({ id: 'base', coins: config.prices.base, cls: 'cup-base', icon: 'drink' });
  }
  if (details.includes('fresh')) partDefs.push({ id: 'fresh', coins: config.prices.fresh, cls: 'fresh', icon: 'fresh.yes' });
  if (details.includes('brew')) partDefs.push({ id: 'brew', coins: config.prices.brew, cls: 'brew', icon: 'brew.yes' });

  for (const part of partDefs) {
    const coins = h('div', { class: 'part-coins' }, ...Array.from({ length: part.coins }, () => icon('coin', 'mini-coin')));
    const btn = h('button', { class: `btn part ${part.cls}` }, icon(part.icon, 'part-img'), coins, h('span', { class: 'part-price' }, String(part.coins)));
    onTap(btn, () => addPart(part), { sound: 'coin', gap: 200 });
    partsRow.appendChild(btn);
  }
  onTap(clearBtn, () => clearRegister());
  onTap(ringBtn, () => ringUp(), { sound: null });

  function addPart(part) {
    if (regBusy || !counterReady()) return;
    if (regParts.length >= 8) return;
    regParts.push(part);
    drawTray();
  }

  function clearRegister() {
    regParts = [];
    drawTray();
  }

  function drawTray() {
    const total = regParts.reduce((s, p) => s + p.coins, 0);
    trayNum.textContent = String(total);
    trayCoins.replaceChildren(...Array.from({ length: Math.min(total, 14) }, () => icon('coin', 'tray-coin')));
    ringBtn.classList.toggle('ready', total > 0);
  }

  async function ringUp() {
    const c = shift.counter;
    if (regBusy || !c || !counterReady() || regParts.length === 0) return;
    const total = regParts.reduce((s, p) => s + p.coins, 0);
    regBusy = true;
    const ok = shift.ringUp(total);
    if (!ok) {
      play('hmm');
      const v = people.get(c.id);
      setMood(v, 'unsure', 2500);
      act(v.el, 'wobble');
      await sayAs(c, line('say.wrongTotal'));
      await wait(config.anim.registerWrongPause * 1000);
      clearRegister();
      regBusy = false;
      return;
    }
    // Right total: the drawer opens and the coins fly to the money jar.
    play('drawer');
    register.classList.add('open-drawer');
    flyCoins(register, c.price);
    const v = people.get(c.id);
    setMood(v, 'happy', 1500);
    sayAs(c, line('say.paid'));
    bubble.classList.add('hidden');
    await wait(900);
    register.classList.remove('open-drawer');
    clearRegister();
    regBusy = false;
  }

  function counterReady() {
    const c = shift && shift.counter;
    if (!c) return false;
    const v = people.get(c.id);
    return !!(v && v.arrived);
  }

  // ---- Money -------------------------------------------------------------

  let shownMoney = 0;
  let shownStars = 0;
  function drawMoney() {
    const m = shift.money;
    if (m !== shownMoney) {
      shownMoney = m;
      moneyNum.textContent = String(m);
      barFill.style.width = `${Math.min(100, (m / barMax) * 100)}%`;
      money.classList.remove('bump'); void money.offsetWidth; money.classList.add('bump');
    }
    const stars = starsFor(m, goals);
    if (stars !== shownStars) {
      starMarks.forEach((mk, i) => mk.classList.toggle('lit', i < stars));
      if (stars > shownStars) play('fanfare');
      shownStars = stars;
    }
  }

  function flyCoins(fromEl, n) {
    const stage = app.getBoundingClientRect();
    const scale = stage.width / 1180;
    const a = fromEl.getBoundingClientRect();
    const b = money.querySelector('.money-coin').getBoundingClientRect();
    for (let i = 0; i < Math.min(n, 8); i++) {
      const c = icon('coin', 'fly-coin');
      const x0 = (a.left + a.width / 2 - stage.left) / scale + (i - n / 2) * 18;
      const y0 = (a.top + a.height / 3 - stage.top) / scale;
      const x1 = (b.left + b.width / 2 - stage.left) / scale;
      const y1 = (b.top + b.height / 2 - stage.top) / scale;
      c.style.transform = `translate(${x0 - 24}px, ${y0 - 24}px)`;
      root.appendChild(c);
      setTimeout(() => {
        c.style.transitionDelay = `${i * 70}ms`;
        c.style.transform = `translate(${x1 - 24}px, ${y1 - 24}px) scale(.6)`;
        c.style.opacity = '0.2';
      }, 30);
      setTimeout(() => { c.remove(); play('coin'); }, 800 + i * 70);
    }
  }

  // ---- Characters ----------------------------------------------------------

  function sayAs(p, text) {
    const v = people.get(p.id);
    return speak(text, {
      pitch: p.type.voice.pitch,
      rate: p.type.voice.rate,
      onStart: () => v && setTalking(v.el, true),
      onEnd: () => v && setTalking(v.el, false),
    });
  }

  function setMood(v, mood, ms) {
    if (!v) return;
    v.mood = mood;
    v.moodUntil = performance.now() + ms;
  }

  function slotFor(p) {
    switch (p.place) {
      case 'line': return { key: `line${shift.line.indexOf(p)}`, ...SLOTS.line[Math.min(shift.line.indexOf(p), SLOTS.line.length - 1)] };
      case 'counter': return { key: 'counter', ...SLOTS.counter };
      case 'waiting': return { key: `wait${p.spot}`, ...SLOTS.waiting[p.spot] };
      case 'served': {
        const w = SLOTS.waiting[p.spot];
        return { key: `pickup${p.spot}`, x: w.x, y: w.y + SLOTS.pickup.dy, s: SLOTS.pickup.s };
      }
      default: return { key: 'door', ...SLOTS.door };
    }
  }

  function placeEl(v, slot, instant = false) {
    const { el } = v;
    el.style.transition = instant ? 'none' : '';
    el.style.transform = `translate(${slot.x - 100}px, ${slot.y - 260}px) scale(${slot.s})`;
    el.style.zIndex = String(Math.round(slot.y));
    if (!instant) {
      el.classList.add('walking');
      v.busyUntil = performance.now() + walkMs;
      clearTimeout(v.walkTimer);
      v.walkTimer = setTimeout(() => el.classList.remove('walking'), walkMs);
    }
    v.slot = slot.key;
  }

  function addPerson(p, { instant = false } = {}) {
    const el = createCharacter(p.type);
    const wish = h('div', { class: 'wish' }, icon(option(MENU, 'topping', p.order.topping).icon, 'wish-icon'));
    const tag = h('div', { class: 'tag' });
    const cup = h('div', { class: 'held-cup' }, icon(`tea.${p.order.tea}`, 'held-cup-img'));
    el.append(wish, tag, cup);
    el.dataset.place = p.place;
    chars.appendChild(el);
    const v = { p, el, slot: null, busyUntil: 0, mood: null, moodUntil: 0, arrived: false };
    people.set(p.id, v);
    if (instant) {
      placeEl(v, slotFor(p), true);
    } else {
      placeEl(v, { key: 'door', ...SLOTS.door }, true);
      el.classList.add('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.remove('entering');
        layout();
      }));
    }
    onTap(el, () => tapPerson(v), { sound: null });
  }

  function layout() {
    for (const v of people.values()) {
      const { p, el } = v;
      if (el.classList.contains('entering')) continue;
      const slot = slotFor(p);
      if (v.slot !== slot.key) placeEl(v, slot);
      el.dataset.place = p.place;
      if (p.number != null) el.querySelector('.tag').textContent = String(p.number);

      // Faces and body language.
      let mood = 'waiting';
      if (v.mood && performance.now() < v.moodUntil) mood = v.mood;
      else if (p.place === 'served') mood = 'happy';
      else if (p.place === 'gone') mood = p.leftBecause === 'gaveUp' ? 'impatient' : 'happy';
      else if (p.place === 'line' && p.placeTime > config.patience.impatientAfter) mood = 'impatient';
      else if (p.place === 'waiting' && p.placeTime > config.patience.waitingSpotImpatientAfter) mood = 'impatient';
      setExpression(el, mood);
      el.classList.toggle('tapping', mood === 'impatient' && p.place === 'line');
      el.classList.toggle('servable', p.place === 'waiting' && performance.now() > v.busyUntil);
    }
  }

  // ---- Serving -------------------------------------------------------------

  let popup = null;
  function closePopup() { if (popup) { popup.remove(); popup = null; } }

  function tapPerson(v) {
    const { p } = v;
    if (p.place !== 'waiting' || performance.now() < v.busyUntil) return;
    play('tap');
    closePopup();
    const slot = SLOTS.waiting[p.spot];
    const serveBtn = h('button', { class: 'btn serve-btn' }, icon('bell', 'bell-icon'), h('span', { class: 'label' }, t('ui.serve')));
    const noBtn = h('button', { class: 'btn round serve-no', 'aria-label': t('ui.cancel') }, '✕');
    popup = h('div', { class: 'serve-popup', style: { left: `${Math.min(slot.x, 1180 - 130)}px` } },
      h('div', { class: 'serve-num' }, String(p.number)), serveBtn, noBtn);
    popupLayer.appendChild(popup);
    onTap(serveBtn, () => { closePopup(); serve(p); }, { sound: null });
    onTap(noBtn, closePopup);
  }

  async function serve(p) {
    if (!shift.serve(p.id)) return;
    play('bell');
    const v = people.get(p.id);
    layout();
    await wait(walkMs);
    v.el.classList.add('has-cup');
    act(v.el, 'hop');
    play('hop');
    await sayAs(p, line('say.sip'));
    if (p.tip > 0) {
      const pop = h('div', { class: 'tip-pop' }, ...Array.from({ length: p.tip }, () => icon('coin', 'tip-coin')));
      v.el.appendChild(pop);
      flyCoins(v.el, p.tip);
    }
    await wait(config.anim.servedStay * 1000);
    shift.finishServed(p.id);
    v.el.classList.remove('has-cup');
    layout();
    scheduleRemoval(p.id);
  }

  function scheduleRemoval(id) {
    setTimeout(() => {
      const v = people.get(id);
      if (v) { v.el.remove(); people.delete(id); }
    }, walkMs + 400);
  }

  // ---- Counter -------------------------------------------------------------

  async function stepUp(p) {
    layout();
    await wait(walkMs);
    const v = people.get(p.id);
    if (!v || shift.counter !== p) return;
    v.arrived = true;
    register.classList.remove('disabled');
    showBubble(p);
    p.sentence = orderSentence(p.order);
    await sayAs(p, line('say.greet', { name: customerName(p.type.id).name }));
    await sayAs(p, p.sentence);
  }

  function showBubble(p) {
    bubbleNum.textContent = String(p.number);
    const items = orderIcons(p.order, { width: 600 });
    bubble.classList.toggle('wide', items.length > 2);
    bubbleItems.replaceChildren(...items);
    bubble.classList.remove('hidden');
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }

  onTap(repeatBtn, () => {
    const c = shift.counter;
    if (c && c.sentence) sayAs(c, c.sentence);
  }, { sound: null });

  // ---- Shift events ----------------------------------------------------------

  function onEvent(type, p) {
    if (type !== 'arrive') saveNow();
    switch (type) {
      case 'arrive':
        addPerson(p);
        play('door');
        break;
      case 'stepUp':
        stepUp(p);
        break;
      case 'paid':
        register.classList.add('disabled');
        layout();
        break;
      case 'leave': {
        const v = people.get(p.id);
        if (v) { act(v.el, 'wave'); v.el.classList.remove('tapping'); }
        layout();
        scheduleRemoval(p.id);
        break;
      }
      case 'close':
        onClose(p);
        break;
      default:
    }
  }

  function showClosed() {
    sign.classList.add('flipped');
    finishBtn.classList.remove('hidden');
    root.classList.add('is-closed');
  }

  async function onClose(why) {
    play(why === 'soldOut' ? 'fanfare' : 'sunset');
    showClosed();
    await speak(line(why === 'soldOut' ? 'say.soldOut' : 'say.closing'), { pitch: BOSS.voice.pitch, rate: BOSS.voice.rate });
  }

  onTap(finishBtn, () => finish());

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearInterval(botTimer);
    stopSpeaking();
    document.removeEventListener('visibilitychange', onVisibility);
    clearInterval(saveTimer);
    if (wakeLock) wakeLock.release().catch(() => {});
    onFinish(shift.summary());
  }

  // ---- Clock -----------------------------------------------------------------

  function drawSun() {
    const k = shift.progress;
    // The sun rises from the left, crosses the window and sets on the right.
    const x = 6 + k * 88;
    const y = 78 - Math.sin(Math.min(1, k * 1.05) * Math.PI) * 62 + (k > 0.95 ? (k - 0.95) * 600 : 0);
    sun.style.left = `${x}%`;
    sun.style.top = `${y}%`;
    windowEl.style.setProperty('--dusk', String(Math.max(0, (k - 0.65) / 0.35)));
  }

  // ---- Main loop ---------------------------------------------------------

  let last = performance.now();
  let raf = 0;
  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!document.hidden && !finished) {
      shift.tick(dt * speed);
      layout();
      drawMoney();
      drawSun();
      finishBtn.classList.toggle('pulse', shift.allDone);
    }
    raf = requestAnimationFrame(frame);
  }

  async function keepAwake() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* not supported */ }
  }
  function onVisibility() {
    if (!document.hidden) { last = performance.now(); resume(); if (!finished) keepAwake(); }
  }
  document.addEventListener('visibilitychange', onVisibility);

  // ---- Demo: the app plays a shift by itself -------------------------------

  let botTimer = 0;
  function startBot() {
    let mistakeMade = false;
    const serveAfter = new Map();
    botTimer = setInterval(() => {
      if (finished) return;
      const c = shift.counter;
      if (c && counterReady() && !regBusy) {
        const parts = priceParts(c.order, config.prices).map((x) => partDefs.find((d) => d.id === x.id));
        clearRegister();
        if (!mistakeMade && Math.random() < 0.2) { mistakeMade = true; regParts = [partDefs[0], partDefs[0]]; } else regParts = parts;
        drawTray();
        ringUp();
      }
      for (const p of shift.waiting) {
        if (!serveAfter.has(p.id)) serveAfter.set(p.id, 15 + Math.random() * 120);
        const v = people.get(p.id);
        if (p.placeTime > serveAfter.get(p.id) && v && performance.now() > v.busyUntil) serve(p);
      }
      if (shift.allDone) setTimeout(finish, 1500);
    }, 400);
  }

  // ---- Go --------------------------------------------------------------------

  function saveNow() {
    if (!finished) onSave(shift.toJSON());
  }
  const saveTimer = setInterval(saveNow, 2000);

  const opts = { config, menu: MENU, customers: CUSTOMERS, onEvent };
  if (restore) {
    // Pick up a saved shift: everyone is put straight back in place, and
    // the customer at the counter orders again.
    shift = Shift.restore(restore, opts);
    for (const p of shift.people) addPerson(p, { instant: true });
    if (shift.closed) showClosed();
    if (shift.counter) stepUp(shift.counter);
  } else {
    shift = new Shift(opts);
    speak(line('say.shopOpen'), { pitch: BOSS.voice.pitch, rate: BOSS.voice.rate });
  }
  // Expose for checking in the browser console and automated runs.
  window.__boba = { shift, finish, price: (o) => price(o, config.prices) };
  keepAwake();
  drawTray();
  raf = requestAnimationFrame(frame);
  if (demo) startBot();
}
