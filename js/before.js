// Before opening: a picture checklist for each job, the boss's hint for the
// day, and a Ready button for each apron. The app does not check the
// lists: everything on them happens at the table.

import { BOSS, ICONS } from './assets.js';
import { APRONS, CHECKLISTS } from './jobs.js';
import { t, line, hintSentence } from './text.js';
import { stopSpeaking, play, speak } from './audio.js';
import { createCharacter, setExpression, act } from './character.js';
import { h, icon, onTap, wait, apronSvg } from './ui.js';
import { bossSayer } from './meet.js';
import { JOB_ICONS } from './assets.js';
import { openRadio } from './radio.js';

// day: { aprons, jobs, hint, ready }
// onReady(list) whenever a Ready button changes; onDone() when all are ready.
export function beforeScreen({ app, day, onReady, onDone, onHowTo = null, onSong = () => {} }) {
  const boss = createCharacter(BOSS);
  const ready = new Set(day.ready || []);
  const hintIcon = day.hint ? (day.hint.detail === 'tea' ? `tea.${day.hint.option}` : `topping.${day.hint.option}`) : null;

  const columns = day.aprons.map((a) => {
    const color = APRONS.find((x) => x.id === a).color;
    const job = day.jobs[a];
    const items = CHECKLISTS[job].map((item) => {
      const iconKey = item === 'music' ? 'radio' : (ICONS[item] ? item : 'ticket');
      const b = h('button', { class: `btn check-item ${item === 'music' ? 'radio-item' : ''}` }, icon(iconKey, 'check-icon'));
      onTap(b, () => {
        stopSpeaking();
        b.classList.add('seen');
        if (item === 'music') {
          openRadio(app.querySelector('.screen'), { current: day.song, onPick: (id) => { day.song = id; onSong(id); } });
          return;
        }
        speak(line(`checklist.${item}`), { pitch: BOSS.voice.pitch, rate: BOSS.voice.rate });
      });
      return b;
    });
    const readyBtn = h('button', { class: 'btn ready-btn', style: { '--apron': color } }, icon('check', 'ready-check'), h('span', { class: 'label' }, t('ui.ready')));
    const col = h('div', { class: 'before-col', style: { '--apron': color }, 'data-apron': a },
      h('div', { class: 'col-head' }, apronSvg(color, 'apron small'), h('div', { class: 'job-icons' }, ...JOB_ICONS[job].map((k) => icon(k, 'job-icon small')))),
      h('div', { class: 'check-list' }, ...items),
      readyBtn);
    onTap(readyBtn, () => toggleReady(a, col), { sound: 'coin' });
    if (ready.has(a)) col.classList.add('is-ready');
    return col;
  });

  const sign = h('div', { class: 'sign big-sign' },
    h('div', { class: 'sign-face sign-open' }, t('ui.open')),
    h('div', { class: 'sign-face sign-closed' }, t('ui.closed')));
  sign.classList.add('flipped');

  const hintCard = hintIcon ? h('button', { class: 'btn hint-card' }, icon('star', 'hint-star'), icon(hintIcon, 'hint-icon')) : null;

  // Watch the how-to cards again.
  const howToBtn = onHowTo ? h('button', { class: 'btn howto-again' }, h('img', { class: 'howto-thumb', src: 'assets/cards/boba.jpg', alt: '' }), h('span', {}, t('ui.howTo'))) : null;
  if (howToBtn) onTap(howToBtn, () => { stopSpeaking(); onHowTo(); });

  const root = h('div', { class: 'screen before-screen' },
    h('div', { class: 'before-top' }, h('div', { class: 'boss-mini' }, boss), hintCard, howToBtn, sign),
    h('div', { class: 'before-cols' }, ...columns));
  app.replaceChildren(root);
  const alive = () => root.isConnected;
  const say = bossSayer(boss, alive);

  if (hintCard) onTap(hintCard, () => { stopSpeaking(); say(hintSentence(day.hint)); });

  let finishing = false;
  function toggleReady(a, col) {
    if (finishing) return;
    if (ready.has(a)) ready.delete(a); else ready.add(a);
    col.classList.toggle('is-ready', ready.has(a));
    onReady([...ready]);
    if (ready.size === day.aprons.length) allReady();
  }

  async function allReady() {
    finishing = true;
    stopSpeaking();
    await wait(400);
    sign.classList.remove('flipped');
    play('door');
    setExpression(boss, 'happy');
    act(boss, 'hop');
    await say(line('say.allReady'));
    await wait(300);
    if (alive()) onDone();
  }

  (async () => {
    await say(line('say.bossBefore'));
    if (day.hint) await say(hintSentence(day.hint));
    if (Object.values(day.jobs).some((j) => CHECKLISTS[j].includes('music'))) await say(line('say.pickMusic'));
    if (ready.size === day.aprons.length && alive() && !finishing) allReady();
  })();
}
