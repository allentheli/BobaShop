// Meet the boss: how many players, apron colors, jobs and the day's goals.

import { BOSS, JOB_ICONS } from './assets.js';
import { APRONS, assignJobs, nextDecorator } from './jobs.js';
import { t, line, jobSentence } from './text.js';
import { speak, stopSpeaking, play } from './audio.js';
import { createCharacter, setTalking, act, setExpression } from './character.js';
import { h, icon, onTap, wait, nextButton, apronSvg } from './ui.js';

export function bossSayer(boss, alive = () => true) {
  return (text) => (alive() ? speak(text, {
    pitch: BOSS.voice.pitch,
    rate: BOSS.voice.rate,
    onStart: () => setTalking(boss, true),
    onEnd: () => setTalking(boss, false),
  }) : Promise.resolve());
}

// save: the save record (for last days' jobs and the decorator).
// onDone({ players, aprons, jobs, decorator }) when the team is set up.
export function meetScreen({ app, config, save, onDone }) {
  const boss = createCharacter(BOSS);
  const right = h('div', { class: 'meet-right' });
  const root = h('div', { class: 'screen meet-screen' }, h('div', { class: 'boss-spot' }, boss), right);
  app.replaceChildren(root);
  // A screen stops talking and moving on when it is left or paused.
  const alive = () => root.isConnected && !root.querySelector('.pause-menu');
  const say = bossSayer(boss, alive);

  // 1. How many players?
  function stepCount() {
    const buttons = [2, 3, 4].map((n) => {
      const heads = h('div', { class: 'heads' }, ...Array.from({ length: n }, (_, i) => h('span', { class: `head c${i}` })));
      return h('button', { class: 'btn count-btn', 'data-n': n }, heads, h('span', { class: 'count-num' }, String(n)));
    });
    right.replaceChildren(h('div', { class: 'parent-label' }, t('ui.howMany')), h('div', { class: 'count-row' }, ...buttons));
    say(line('say.bossHello'));
    let chosen = false;
    buttons.forEach((b, i) => onTap(b, async () => {
      if (chosen) return;
      chosen = true;
      const n = i + 2;
      b.classList.add('chosen');
      stopSpeaking();
      setExpression(boss, 'happy');
      act(boss, 'hop');
      await say(line('say.bossPlayers', { n }));
      setExpression(boss, 'waiting');
      if (alive()) stepAprons(n);
    }));
  }

  // 2. Each player taps an apron color.
  function stepAprons(n) {
    const picked = [];
    const slots = h('div', { class: 'apron-slots' }, ...Array.from({ length: n }, () => h('div', { class: 'apron-slot' })));
    const choices = APRONS.map((a) => {
      const b = h('button', { class: 'btn apron-btn', 'data-apron': a.id, style: { '--apron': a.color } }, apronSvg(a.color));
      onTap(b, () => toggle(a), { sound: 'hop' });
      return b;
    });
    right.replaceChildren(
      h('div', { class: 'parent-label' }, t('ui.pickApron')),
      slots,
      h('div', { class: 'apron-grid' }, ...choices));
    say(line('say.bossAprons'));
    let done = false;

    function draw() {
      [...slots.children].forEach((s, i) => {
        const a = picked[i];
        s.replaceChildren(...(a ? [apronSvg(APRONS.find((x) => x.id === a).color)] : []));
        s.classList.toggle('filled', !!a);
      });
      choices.forEach((b) => b.classList.toggle('taken', picked.includes(b.dataset.apron)));
    }

    async function toggle(a) {
      if (done) return;
      const i = picked.indexOf(a.id);
      if (i >= 0) picked.splice(i, 1);
      else if (picked.length < n) picked.push(a.id);
      draw();
      if (picked.length === n) {
        done = true;
        stopSpeaking();
        await wait(500);
        if (alive()) stepJobs(picked.slice());
      }
    }
  }

  // 3. The boss gives each apron a job.
  async function stepJobs(aprons) {
    const n = aprons.length;
    const previous = (save.rotation.byCount || {})[n] || {};
    const locks = config.jobLocks || {};
    const jobs = assignJobs(aprons, previous, locks);
    const decorator = nextDecorator(aprons, save.rotation.lastDecorator);

    const cards = aprons.map((a) => {
      const color = APRONS.find((x) => x.id === a).color;
      const card = h('button', { class: 'btn job-card', style: { '--apron': color } },
        apronSvg(color, 'apron small'),
        h('div', { class: 'job-icons' }, ...JOB_ICONS[jobs[a]].map((k) => icon(k, 'job-icon'))),
        h('div', { class: 'job-name' }, t(`jobs.${jobs[a]}`)));
      onTap(card, () => { stopSpeaking(); highlight(card); say(jobSentence(jobs[a], a, config.callMode)); });
      return card;
    });
    const next = nextButton('hidden');
    right.replaceChildren(h('div', { class: 'job-row' }, ...cards), next);

    function highlight(card) {
      cards.forEach((c) => c.classList.toggle('speaking', c === card));
    }

    let moved = false;
    onTap(next, () => { if (moved) return; moved = true; stopSpeaking(); stepGoals({ players: n, aprons, jobs, decorator }); });

    await say(line('say.bossJobs'));
    for (let i = 0; i < aprons.length && alive() && !moved; i++) {
      highlight(cards[i]);
      await say(jobSentence(jobs[aprons[i]], aprons[i], config.callMode));
    }
    if (!moved) highlight(null);
    next.classList.remove('hidden');
    if (!moved) say(line('say.tapArrow'));
  }

  // 4. The day's coin goals for stars.
  async function stepGoals(team) {
    const g = config.starGoals;
    const stars = h('div', { class: 'goal-row' }, ...g.map((goal, i) =>
      h('div', { class: 'goal-card', style: { animationDelay: `${0.3 + i * 0.5}s` } },
        h('div', { class: 'goal-stars' }, ...Array.from({ length: i + 1 }, () => icon('star', 'goal-star'))),
        h('div', { class: 'goal-coins' }, icon('coin', 'goal-coin'), h('span', {}, String(goal))))));
    const next = nextButton();
    right.replaceChildren(h('div', { class: 'parent-label' }, t('ui.goals')), stars, next);
    play('fanfare');
    let moved = false;
    onTap(next, () => { if (moved) return; moved = true; stopSpeaking(); onDone(team); });
    await say(line('say.bossGoals', { a: g[0], b: g[1], c: g[2] }));
    if (!moved) await say(line('say.tapArrow'));
  }

  stepCount();
}
