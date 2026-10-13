// The "How to make" screen: one station card at a time, the boss reading
// each step while that part of the card lights up. It plays on by itself;
// the arrows move back and forward, and tapping the card says the step again.

import { BOSS } from './assets.js';
import { t, line, lookupList } from './text.js';
import { speak, stopSpeaking, play } from './audio.js';
import { createCharacter, setTalking, act, setExpression } from './character.js';
import { h, onTap, wait, nextButton } from './ui.js';

// cards: from cardsFor(); at: { card, step } to start from (for Continue)
// onProgress(at) after every step; onDone() at the end (or when skipped).
export function howtoScreen({ app, cards, at = { card: 0, step: 0 }, onProgress = () => {}, onDone, intro = true }) {
  const boss = createCharacter(BOSS);
  const img = h('img', { class: 'howto-img', alt: '', draggable: 'false' });
  const glow = h('div', { class: 'howto-glow' });
  const cardBox = h('div', { class: 'howto-card' }, img, glow);
  const dots = h('div', { class: 'howto-dots' }, ...cards.map(() => h('span', { class: 'dot' })));
  const back = h('button', { class: 'btn round howto-back', 'aria-label': 'Back' }, h('span', { class: 'arrow' }));
  const next = nextButton('howto-next');
  const done = h('button', { class: 'btn big howto-done' }, h('span', { class: 'label' }, t('ui.gotIt')));
  const root = h('div', { class: 'screen howto-screen' },
    h('div', { class: 'boss-mini howto-boss' }, boss),
    h('div', { class: 'howto-title parent-label' }, t('ui.howTo')),
    dots,
    cardBox,
    h('div', { class: 'howto-controls' }, back, next),
    done);
  app.replaceChildren(root);
  const alive = () => root.isConnected;

  let ci = Math.min(at.card || 0, cards.length - 1);
  let si = at.step || 0;
  let token = 0;   // each step's playback gets a token, so old ones stop

  const say = (text) => (alive() ? speak(text, {
    pitch: BOSS.voice.pitch, rate: BOSS.voice.rate,
    onStart: () => setTalking(boss, true), onEnd: () => setTalking(boss, false),
  }) : Promise.resolve());

  function show() {
    const card = cards[ci];
    const step = card.steps[si];
    if (!img.src.endsWith(`${card.id}.jpg`)) {
      img.src = `assets/cards/${card.id}.jpg`;
      cardBox.classList.remove('flip'); void cardBox.offsetWidth; cardBox.classList.add('flip');
    }
    glow.style.top = `${step.top * 100}%`;
    glow.style.height = `${(step.bottom - step.top) * 100}%`;
    [...dots.children].forEach((d, k) => d.className = `dot ${k < ci ? 'good' : ''} ${k === ci ? 'now' : ''}`);
    back.classList.toggle('disabled', ci === 0 && si === 0);
    onProgress({ card: ci, step: si });
  }

  async function play1(auto = true) {
    const my = ++token;
    stopSpeaking();
    show();
    const card = cards[ci];
    const lines = lookupList(`tutorial.${card.id}`);
    const text = lines[card.steps[si].index] || '';
    if (si === 0 && (ci === 0 || cards[ci - 1].station !== card.station)) {
      await say(line(`tutorial.station.${card.station}`));
      if (my !== token) return;
    }
    await say(text);
    if (my !== token || !auto) return;
    await wait(700);
    if (my !== token || !alive()) return;
    forward();
  }

  function forward() {
    const card = cards[ci];
    if (si < card.steps.length - 1) si++;
    else if (ci < cards.length - 1) { ci++; si = 0; play('hop'); }
    else { finish(); return; }
    play1();
  }

  function backward() {
    if (si > 0) si--;
    else if (ci > 0) { ci--; si = cards[ci].steps.length - 1; }
    play1();
  }

  let finished = false;
  async function finish() {
    if (finished) return;
    finished = true;
    token++;
    stopSpeaking();
    setExpression(boss, 'happy');
    act(boss, 'hop');
    await say(line('tutorial.outro'));
    if (alive()) onDone();
  }

  onTap(next, () => forward());
  onTap(back, () => backward());
  onTap(cardBox, () => play1(false), { sound: null });
  onTap(done, () => finish());

  (async () => {
    if (intro && ci === 0 && si === 0) await say(line('tutorial.intro'));
    if (alive() && !finished) play1();
  })();
}
