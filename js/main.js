// Starts the app and moves through the day:
// Title -> Meet the boss -> Before opening -> Open -> Closing -> Title.
// The day in progress is saved after every change (js/storage.js), so the
// app can be closed at any point and continued on the next launch.

import { CONFIG } from './config.js';
import { BOSS, CUSTOMERS, ICONS, ACCESSORIES } from './assets.js';
import { MENU } from './menu.js';
import { starsFor, pickHint, pickInspection, makeLook } from './logic.js';
import { t, line } from './text.js';
import { unlock, speak, stopSpeaking, configureSound, setMuted, play, resume, resetSpeech } from './audio.js';
import { createCharacter, setTalking, act, setExpression } from './character.js';
import { h, icon, onTap, onHold, wait } from './ui.js';
import { startOpen } from './open.js';
import { meetScreen } from './meet.js';
import { beforeScreen } from './before.js';
import { closingScreen } from './closing.js';
import { loadSave, writeSave, defaultSave } from './storage.js';
import { openSettings } from './settings.js';
import { openCatalog } from './catalog.js';
import { addPauseButton, addSkipButton } from './pause.js';
import { howtoScreen } from './howto.js';
import { configureMusic, stopMusic } from './music.js';
import { cardsFor } from './tutorial.js';

const STAGE_W = 1180;
const STAGE_H = 820;

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
let save = loadSave();
let config = withSettings(save.settings);

// Parent settings (milestone 3) are stored as overrides of js/config.js.
function withSettings(settings) {
  const c = structuredClone(CONFIG);
  for (const [k, v] of Object.entries(settings || {})) {
    c[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...c[k], ...v } : v;
  }
  return c;
}

function persist() {
  writeSave(save);
}

// ---- Fit the fixed-size stage to any screen --------------------------------

function fit() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  app.style.transform = `translate(-50%, -50%) scale(${s})`;
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 300));
fit();
// Resolved to a full address so the stylesheet finds it.
document.documentElement.style.setProperty('--star-url', `url("${new URL(ICONS.star, location.href)}")`);

// ---- iPad: no zooming, no long-press menus, no rubber-band scrolling -------

for (const ev of ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
// Scrolling is allowed only inside panels marked .scroll (the settings).
document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
// Coming back after the iPad was locked or another app was used: wake the
// sound up, and clear any speech Safari left stuck.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return; }
  resume();
  if (Date.now() - hiddenAt > 2000) resetSpeech();
});

// ---- Offline support --------------------------------------------------------

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !params.has('nosw')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---- Boss helper ------------------------------------------------------------

function bossSay(el, text) {
  return speak(text, {
    pitch: BOSS.voice.pitch,
    rate: BOSS.voice.rate,
    onStart: () => el && setTalking(el, true),
    onEnd: () => el && setTalking(el, false),
  });
}

// ---- Title ------------------------------------------------------------------

// The running shift screen, so it can always be stopped before another
// screen takes over (Home, Reset, Restore, Continue...).
let stopShift = null;
function stopRunningShift() {
  if (stopShift) { stopShift(); stopShift = null; }
}

function titleScreen() {
  stopRunningShift();
  stopSpeaking();
  stopMusic();
  const hasDay = !!save.day;
  const startBtn = h('button', { class: `btn big start-btn ${hasDay ? 'secondary' : ''}` }, h('span', { class: 'play-tri' }), h('span', { class: 'label' }, t(hasDay ? 'ui.newDay' : 'ui.start')));
  const continueBtn = hasDay ? h('button', { class: 'btn big continue-btn' }, h('span', { class: 'play-tri' }), h('span', { class: 'label' }, t('ui.continueDay'))) : null;
  const parentBtn = h('button', { class: 'btn parent-btn' }, h('span', { class: 'label' }, t('ui.parents')));
  // The savings jar, and a look at the shop's decorations (buying happens
  // at closing time, by the day's decorator).
  const shopBtn = h('button', { class: 'btn title-shop' }, icon('coin', 'jar-coin'), h('span', {}, String(save.savings)));
  const root = h('div', { class: `screen title-screen ${hasDay ? 'has-day' : ''}` },
    h('div', { class: 'awning' }),
    h('div', { class: 'title-sign' }, icon('drink', 'title-cup'), h('h1', {}, t('ui.appName')), icon('drink', 'title-cup flip')),
    // Three random friends wave from the title screen, dressed up.
    h('div', { class: 'title-friends' }, ...[...CUSTOMERS].sort(() => Math.random() - 0.5).slice(0, 3)
      .map((c) => createCharacter(c, { expression: 'happy', look: makeLook(c, ACCESSORIES) }))),
    continueBtn,
    startBtn,
    h('div', { class: 'sound-hint' }, t('ui.soundHint')),
    shopBtn,
    parentBtn,
  );
  app.replaceChildren(root);

  // With a day in progress, New day needs a second tap: it replaces the
  // saved day.
  let armed = false;
  onTap(startBtn, () => {
    unlock();
    play('tap');
    if (hasDay && !armed) {
      armed = true;
      startBtn.classList.add('armed');
      startBtn.querySelector('.label').textContent = t('ui.newDaySure');
      setTimeout(() => { armed = false; startBtn.classList.remove('armed'); startBtn.querySelector('.label').textContent = t('ui.newDay'); }, 3000);
      return;
    }
    newDay();
  }, { sound: null });
  if (continueBtn) {
    onTap(continueBtn, () => {
      unlock();
      play('tap');
      showPhase();
    }, { sound: null });
  }
  onHold(parentBtn, () => { unlock(); settingsPanel(root, { withDemo: true }); }, 3);
  onTap(shopBtn, () => {
    unlock();
    openCatalog(root, {
      getSave: () => save, onSave: persist, canBuy: false, onClose: () => titleScreen(),
      say: (text) => { stopSpeaking(); speak(text, { pitch: BOSS.voice.pitch, rate: BOSS.voice.rate }); },
    });
  });
}

// ---- Parent settings and the pause menu ------------------------------------

function reloadConfig() {
  config = withSettings(save.settings);
  configureSound(config.sound);
  configureMusic(config.music);
}

// host: the element the settings panel opens over.
function settingsPanel(host, { onClose = () => {}, withDemo = false } = {}) {
  openSettings({
    host,
    save,
    getConfig: () => config,
    dayRunning: !!save.day,
    onChange: () => { persist(); reloadConfig(); },
    onReset: (kind) => {
      if (kind === 'day') save.day = null;
      else save = defaultSave();
      persist();
      reloadConfig();
      titleScreen();
    },
    onDemo: withDemo ? () => demoShift() : null,
    // Load a backup: it replaces the whole shop.
    onRestore: (loaded) => {
      save = loaded;
      persist();
      reloadConfig();
      titleScreen();
    },
    onClose,
  });
}

// What every pause menu needs. During the shift, closing the settings
// restarts the shift screen from its save, so new settings apply at once.
// Outside the shift, the screen is redrawn from the save when play goes on,
// so new settings apply there too.
function pauseOptions() {
  return {
    onHome: () => { persist(); titleScreen(); },
    onResume: () => showPhase(),
    onSettings: (menuEl) => settingsPanel(menuEl, {
      onClose: () => { stopRunningShift(); showPhase(); },
    }),
    getSoundOn: () => config.sound.voice && config.sound.volume > 0 && !soundMuted,
    onToggleSound: () => { soundMuted = !soundMuted; setMuted(soundMuted); },
  };
}
let soundMuted = false;

// ---- The day ------------------------------------------------------------------

function newDay() {
  // The order level and cup counts are fixed for the whole day, so
  // changing them in the settings never changes a shift halfway.
  save.day = {
    phase: 'meet', number: save.days + 1, startedAt: Date.now(), song: save.lastSong || config.music.song,
    level: config.level, cups: { ...config.cups }, enabled: { ...(config.enabledDetails || {}) },
  };
  if (config.setup === 'skip') skipToShop();
  else { persist(); showPhase(); }
}

// Skip the jobs, the how-to cards and the checklists: straight to the shop.
function skipToShop() {
  const day = save.day;
  if (!day.hint) day.hint = pickHint(MENU, { owned: config.owned, weight: config.hintWeight });
  setPhase('open');
}

function setPhase(phase) {
  save.day.phase = phase;
  persist();
  stopSpeaking();
  showPhase();
}

// The order rules for a day: the level, details and cups it started with.
function dayRules(day) {
  return {
    level: day.level ?? config.level,
    enabledDetails: day.enabled ?? config.enabledDetails ?? {},
    cups: day.cups ?? config.cups,
  };
}

function showPhase() {
  stopRunningShift();
  const day = save.day;
  if (!day) { titleScreen(); return; }
  switch (day.phase) {
    case 'meet':
      meetScreen({
        app, config, save,
        onDone: (team) => {
          Object.assign(day, team, {
            hint: pickHint(MENU, { owned: config.owned, weight: config.hintWeight }),
            ready: [],
            howto: { card: 0, step: 0 },
          });
          setPhase(config.setup === 'jobs' ? 'before' : 'howto');
        },
      });
      break;
    case 'howto':
      howtoScreen({
        app,
        cards: cardsFor(MENU, { level: dayRules(day).level, enabled: dayRules(day).enabledDetails, owned: config.owned }),
        at: day.howto || { card: 0, step: 0 },
        onProgress: (at) => { day.howto = at; persist(); },
        onDone: () => setPhase('before'),
      });
      break;
    case 'before':
      beforeScreen({
        app, day,
        onReady: (list) => { day.ready = list; persist(); },
        onDone: () => setPhase('open'),
        onHowTo: () => { day.howto = { card: 0, step: 0 }; setPhase('howto'); },
        onSong: (id) => { save.lastSong = id; persist(); },
      });
      break;
    case 'open':
      stopShift = startOpen({
        app,
        config: { ...structuredClone(config), ...(config.crowds[config.crowd] || {}), bias: day.hint, ...dayRules(day) },
        pause: pauseOptions(),
        music: { song: day.song || 'off', onPick: (id) => { day.song = id; save.lastSong = id; persist(); } },
        decor: save.decorations,
        // A customer notices a decoration bought at the end of the last day.
        mention: save.decorations && save.decorations.newest && save.decorations.newest.day === (day.number || 0) - 1 ? save.decorations.newest : null,
        speed: Number(params.get('speed')) || 1,
        restore: day.shift || null,
        onSave: (snapshot) => { day.shift = snapshot; persist(); },
        onFinish: (summary) => {
          day.summary = summary;
          day.shift = null;
          day.closing = {
            step: 'inspect',
            picks: pickInspection(summary.served, config.inspection.drinks),
            results: [],
            ranOut: null,
            banked: false,
          };
          setPhase('closing');
        },
      });
      break;
    case 'closing':
      closingScreen({
        app, day, config,
        shop: { getSave: () => save, onSave: persist },
        onChange: persist,
        onBank: (money, stars) => {
          save.savings += money;
          save.totalStars += stars;
          persist();
        },
        onDone: (result) => finishDay(result),
      });
      break;
    default:
      // A day saved by a newer version of the app, in a part of the day this
      // version does not know: start a fresh day instead of getting stuck.
      save.day = null;
      persist();
      titleScreen();
      return;
  }
  // Every part of the day has a pause button (the shift adds its own).
  if (day.phase !== 'open') addPauseButton(app.querySelector('.screen'), pauseOptions());
  // Jobs, how-to cards and checklists can be skipped (hold Skip).
  if (day.phase === 'meet' || day.phase === 'before') addSkipButton(app.querySelector('.screen'), () => skipToShop());
}

function finishDay(result) {
  const day = save.day;
  save.days += 1;
  save.history.push({
    day: day.number,
    date: new Date().toISOString().slice(0, 10),
    players: day.players,
    money: result.money,
    stars: result.stars,
    badges: result.badges,
    drinks: day.summary.drinks,
  });
  if (save.history.length > 100) save.history.shift();
  // Jobs rotate only when the team got jobs today (not when skipped).
  if (day.jobs && day.players) {
    save.rotation.byCount[day.players] = day.jobs;
    save.rotation.lastDecorator = day.decorator;
  }
  save.day = null;
  persist();
  titleScreen();
}

// ---- Demo shift: plays by itself, fast, and saves nothing ----------------------

function demoShift() {
  setMuted(true);
  startOpen({
    app,
    config: { ...structuredClone(config), ...(config.crowds[config.crowd] || {}) },
    demo: true,
    speed: config.demo.speed,
    onFinish: (summary) => {
      setMuted(false);
      console.log('Demo shift finished', summary);
      dayTotalScreen(summary, { demo: true });
    },
  });
}

// ---- Day total (demo only) -------------------------------------------------------


function dayTotalScreen(sum, { demo = false } = {}) {
  const boss = createCharacter(BOSS, { expression: 'happy' });
  const stars = starsFor(sum.money, config.starGoals);
  const doneBtn = h('button', { class: 'btn big done-btn', 'aria-label': t('ui.done') }, icon('check'), h('span', { class: 'label' }, t('ui.done')));
  const starRow = h('div', { class: 'star-row' }, ...config.starGoals.map((g, i) =>
    h('div', { class: `big-star ${i < stars ? 'lit' : ''}`, style: { animationDelay: `${0.8 + i * 0.5}s` } }, icon('star'), h('span', { class: 'goal' }, String(g)))));
  const root = h('div', { class: 'screen total-screen' },
    h('div', { class: 'boss-spot' }, boss),
    h('div', { class: 'total-right' },
      h('div', { class: 'parent-label' }, t('ui.dayTotal')),
      h('div', { class: 'total-coins' }, icon('coin', 'total-coin'), h('span', {}, String(sum.money))),
      h('div', { class: 'total-detail' },
        h('span', {}, `${t('ui.fromSales')}: ${sum.sales}`),
        h('span', {}, `${t('ui.fromTips')}: ${sum.tips}`)),
      starRow,
      h('div', { class: 'total-drinks' }, ...Array.from({ length: Math.min(sum.drinks, 16) }, () => icon('drink', 'mini-drink')),
        h('span', { class: 'parent-label small' }, `${t('ui.drinksServed')}: ${sum.drinks}`)),
      doneBtn));
  app.replaceChildren(root);
  play('fanfare');
  act(boss, 'hop');
  (async () => {
    await bossSay(boss, line('say.dayEnd', { n: sum.money }));
    await bossSay(boss, stars > 0 ? line(`say.stars${stars}`) : line('say.noStars'));
  })();
  onTap(doneBtn, () => titleScreen());
  if (demo && params.has('demo')) setTimeout(() => titleScreen(), 4000);
}

// ---- Start -------------------------------------------------------------------

configureSound(config.sound);
configureMusic(config.music);
titleScreen();
if (params.has('demo')) {
  unlock();
  demoShift();
}
