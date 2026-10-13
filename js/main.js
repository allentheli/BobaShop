// Starts the app and moves between screens:
// Title -> How many players -> Open -> Day total -> Title.

import { CONFIG } from './config.js';
import { BOSS, CUSTOMERS, ICONS } from './assets.js';
import { starsFor } from './logic.js';
import { t, line } from './text.js';
import { unlock, speak, stopSpeaking, configureSound, setMuted, play, resume } from './audio.js';
import { createCharacter, setTalking, act, setExpression } from './character.js';
import { h, icon, onTap, onHold, wait } from './ui.js';
import { startOpen } from './open.js';

const STAGE_W = 1180;
const STAGE_H = 820;

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
let config = structuredClone(CONFIG);

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
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });

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

function titleScreen() {
  stopSpeaking();
  const startBtn = h('button', { class: 'btn big start-btn' }, h('span', { class: 'play-tri' }), h('span', { class: 'label' }, t('ui.start')));
  const parentBtn = h('button', { class: 'btn parent-btn' }, h('span', { class: 'label' }, t('ui.parents')));
  const root = h('div', { class: 'screen title-screen' },
    h('div', { class: 'awning' }),
    h('div', { class: 'title-sign' }, icon('drink', 'title-cup'), h('h1', {}, t('ui.appName')), icon('drink', 'title-cup flip')),
    h('div', { class: 'title-friends' }, ...CUSTOMERS.map((c) => createCharacter(c, { expression: 'happy' }))),
    startBtn,
    h('div', { class: 'sound-hint' }, t('ui.soundHint')),
    parentBtn,
  );
  app.replaceChildren(root);

  onTap(startBtn, () => {
    unlock();
    play('tap');
    playersScreen();
  }, { sound: null });
  onHold(parentBtn, () => { unlock(); parentPanel(); }, 3);
}

// ---- Parent panel (full settings arrive in milestone 3) ---------------------

function parentPanel() {
  const close = h('button', { class: 'btn small-btn' }, 'Close');
  const demo = h('button', { class: 'btn small-btn' }, 'Play a demo shift (fast, by itself)');
  const voice = h('button', { class: 'btn small-btn' }, `Voice: ${config.sound.voice ? 'on' : 'off'}`);
  const panel = h('div', { class: 'parent-panel' },
    h('div', { class: 'panel-card' },
      h('h2', {}, 'Parents'),
      h('p', {}, 'More settings (cups, shift length, order levels, register and call modes) come in milestone 3.'),
      voice, demo, close));
  app.querySelector('.screen').appendChild(panel);
  onTap(close, () => panel.remove());
  onTap(voice, () => {
    config.sound.voice = !config.sound.voice;
    configureSound(config.sound);
    voice.textContent = `Voice: ${config.sound.voice ? 'on' : 'off'}`;
  });
  onTap(demo, () => openScreen(4, { demo: true }));
}

// ---- How many players --------------------------------------------------------

function playersScreen() {
  const boss = createCharacter(BOSS);
  const buttons = [2, 3, 4].map((n) => {
    const heads = h('div', { class: 'heads' }, ...Array.from({ length: n }, (_, i) => h('span', { class: `head c${i}` })));
    return h('button', { class: 'btn count-btn', 'data-n': n }, heads, h('span', { class: 'count-num' }, String(n)));
  });
  const root = h('div', { class: 'screen players-screen' },
    h('div', { class: 'boss-spot' }, boss),
    h('div', { class: 'players-right' },
      h('div', { class: 'parent-label' }, t('ui.howMany')),
      h('div', { class: 'count-row' }, ...buttons)),
  );
  app.replaceChildren(root);
  bossSay(boss, line('say.bossHello'));

  let chosen = false;
  buttons.forEach((b, i) => onTap(b, async () => {
    if (chosen) return;
    chosen = true;
    const n = i + 2;
    b.classList.add('chosen');
    stopSpeaking();
    setExpression(boss, 'happy');
    act(boss, 'hop');
    await bossSay(boss, line('say.bossPlayers', { n }));
    await wait(300);
    openScreen(n);
  }));
}

// ---- Open --------------------------------------------------------------------

function openScreen(players, { demo = false } = {}) {
  const runConfig = structuredClone(config);
  let speed = Number(params.get('speed')) || 1;
  if (demo) {
    speed = config.demo.speed;
    setMuted(true);
  }
  startOpen({
    app,
    config: runConfig,
    demo,
    speed,
    players,
    onFinish: (summary) => {
      if (demo) {
        setMuted(false);
        console.log('Demo shift finished', summary);
      }
      dayTotalScreen(summary, { demo });
    },
  });
}

// ---- Day total -----------------------------------------------------------------

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
titleScreen();
if (params.has('demo')) {
  unlock();
  openScreen(4, { demo: true });
}
