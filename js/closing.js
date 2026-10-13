// Closing: the boss inspects drinks, then stars, badges and the cleanup song.
//
// day.closing keeps where we are, so closing the app halfway picks up at
// the same step:
//   { step: 'inspect' | 'stars' | 'badges' | 'decorate' | 'cleanup',
//     picks: [served orders to inspect], results: [true/false...],
//     ranOut: true | false | null, banked: false }

import { BOSS, CUSTOMERS, ICONS } from './assets.js';
import { MENU } from './menu.js';
import { starsFor, badgesFor } from './logic.js';
import { t, line, orderSentence } from './text.js';
import { speak, stopSpeaking, play } from './audio.js';
import { createCharacter, setExpression, setTalking, act } from './character.js';
import { h, icon, onTap, wait, nextButton, apronSvg } from './ui.js';
import { openCatalog } from './catalog.js';
import { APRONS } from './jobs.js';
import { orderIcons } from './orderview.js';
import { bossSayer } from './meet.js';

export const BADGES = ['perfectDay', 'perfectRegister', 'neverRanOut'];
const BADGE_SLOTS = 4;   // the fourth slot waits for the tea maker's badge

// The day's money including inspection bonuses.
export function dayMoney(day, config) {
  const right = (day.closing.results || []).filter(Boolean).length;
  return day.summary.money + right * config.inspection.bonus;
}

// onChange() after every step; onBank(money, stars) once when the stars are
// counted; onDone({ money, stars, badges }) when the team taps Done.
// shop: { getSave, onSave } so the decorator can spend the savings jar.
export function closingScreen({ app, day, config, onChange, onBank, onDone, shop = null }) {
  const c = day.closing;
  const boss = createCharacter(BOSS);
  const main = h('div', { class: 'closing-main' });
  const root = h('div', { class: 'screen closing-screen' }, h('div', { class: 'boss-mini closing-boss' }, boss), main);
  app.replaceChildren(root);
  const alive = () => root.isConnected;
  const say = bossSayer(boss, alive);

  function go(step) {
    c.step = step;
    onChange();
    stopSpeaking();
    if (!alive()) return;
    ({ inspect, stars, badges, decorate, cleanup })[step]();
  }

  // ---- 1. Inspection ------------------------------------------------------

  async function inspect() {
    const i = c.results.length;
    if (c.picks.length === 0) {
      main.replaceChildren(h('div', { class: 'parent-label' }, t('ui.inspection')));
      await say(line('say.noInspection'));
      if (alive()) go('stars');
      return;
    }
    if (i >= c.picks.length) { go('stars'); return; }

    const pick = c.picks[i];
    const type = CUSTOMERS.find((x) => x.id === pick.type) || CUSTOMERS[0];
    const cust = createCharacter(type, { look: pick.look || null });
    const items = orderIcons(pick.order, { width: 500, max: 100 });
    const sentence = orderSentence(pick.order);
    const repeat = h('button', { class: 'btn round repeat' }, icon('speaker'));
    const rightBtn = h('button', { class: 'btn big judge right-btn' }, icon('check', 'judge-icon'), h('span', { class: 'label' }, t('ui.right')));
    const wrongBtn = h('button', { class: 'btn big judge wrong-btn' }, icon('cross', 'judge-icon'), h('span', { class: 'label' }, t('ui.notRight')));
    const dots = h('div', { class: 'progress-dots' }, ...c.picks.map((_, k) =>
      h('span', { class: `dot ${k < i ? (c.results[k] ? 'good' : 'bad') : ''} ${k === i ? 'now' : ''}` })));
    const custSpot = h('div', { class: 'inspect-cust' }, cust, h('div', { class: 'held-cup' }, icon(`cup.${pick.order.tea}`, 'held-cup-img')));
    main.replaceChildren(
      h('div', { class: 'inspect-head' }, h('div', { class: 'parent-label' }, t('ui.inspection')), dots),
      h('div', { class: 'inspect-body' },
        custSpot,
        h('div', { class: 'inspect-order' },
          h('div', { class: 'order-num big' }, String(pick.number)),
          h('div', { class: 'order-items' }, ...items),
          repeat)),
      h('div', { class: 'judge-row' }, wrongBtn, rightBtn));

    const custSay = (text) => speak(text, {
      pitch: type.voice.pitch, rate: type.voice.rate,
      onStart: () => setTalking(cust, true), onEnd: () => setTalking(cust, false),
    });
    onTap(repeat, () => { stopSpeaking(); custSay(sentence); }, { sound: null });

    let answered = false;
    const answer = async (ok) => {
      if (answered) return;
      answered = true;
      stopSpeaking();
      c.results.push(ok);
      onChange();
      rightBtn.classList.add('disabled');
      wrongBtn.classList.add('disabled');
      if (ok) {
        custSpot.classList.add('has-cup');
        setExpression(cust, 'happy');
        act(cust, 'hop');
        play('hop');
        const pop = h('div', { class: 'tip-pop' }, icon('coin', 'tip-coin'));
        cust.appendChild(pop);
        setTimeout(() => play('coin'), 500);
        await say(line('say.inspectRight'));
      } else {
        setExpression(cust, 'silly');
        act(cust, 'wobble');
        play('hmm');
        await say(line('say.inspectWrong'));
      }
      await wait(600);
      if (alive()) go('inspect');
    };
    onTap(rightBtn, () => answer(true), { sound: null });
    onTap(wrongBtn, () => answer(false), { sound: null });

    if (i === 0) await say(line('say.bossClosing'));
    await say(line('say.inspectOrder', { n: pick.number }));
    if (!answered) await custSay(sentence);
    if (!answered) await say(line('say.inspectAsk'));
  }

  // ---- 2. Stars ------------------------------------------------------------

  async function stars() {
    const money = dayMoney(day, config);
    const n = starsFor(money, config.starGoals);
    if (!c.banked) {
      c.banked = true;
      onBank(money, n);
      onChange();
    }
    const starRow = h('div', { class: 'star-row' }, ...config.starGoals.map((g, k) =>
      h('div', { class: `big-star ${k < n ? 'lit' : ''}`, style: { animationDelay: `${0.8 + k * 0.5}s` } }, icon('star'), h('span', { class: 'goal' }, String(g)))));
    const next = nextButton();
    main.replaceChildren(
      h('div', { class: 'parent-label' }, t('ui.dayTotal')),
      h('div', { class: 'total-coins' }, icon('coin', 'total-coin'), h('span', {}, String(money))),
      h('div', { class: 'total-detail' },
        h('span', {}, `${t('ui.fromSales')}: ${day.summary.sales}`),
        h('span', {}, `${t('ui.fromTips')}: ${day.summary.tips}`),
        h('span', {}, `${t('ui.bonus')}: ${money - day.summary.money}`),
        day.summary.refunds ? h('span', { class: 'refund-note' }, `${t('ui.refunds')}: −${day.summary.refunds}`) : null,
        h('span', {}, `${t('ui.drinksServed')}: ${day.summary.drinks}`)),
      starRow,
      next);
    play('fanfare');
    let moved = false;
    onTap(next, () => { if (moved) return; moved = true; go('badges'); });
    await say(line('say.dayEnd', { n: money }));
    await say(n > 0 ? line(`say.stars${n}`) : line('say.noStars'));
  }

  // ---- 3. Badges ------------------------------------------------------------

  async function badges() {
    if (c.ranOut === null || c.ranOut === undefined) {
      const no = h('button', { class: 'btn bowl-btn' }, icon('bowl.full', 'bowl-icon'), h('span', { class: 'label' }, t('ui.ranOutNo')));
      const yes = h('button', { class: 'btn bowl-btn' }, icon('bowl.empty', 'bowl-icon'), h('span', { class: 'label' }, t('ui.ranOutYes')));
      main.replaceChildren(h('div', { class: 'parent-label' }, t('ui.badges')), h('div', { class: 'bowl-row' }, no, yes));
      let picked = false;
      const pick = (v) => { if (picked) return; picked = true; c.ranOut = v; onChange(); stopSpeaking(); badges(); };
      onTap(no, () => pick(false));
      onTap(yes, () => pick(true));
      await say(line('say.badgeIntro'));
      if (!picked) await say(line('say.askRanOut'));
      return;
    }

    const earned = badgesFor({ results: c.results, rungUp: day.summary.rungUp ?? day.summary.drinks, mistakes: day.summary.registerMistakes, ranOut: c.ranOut });
    c.badges = earned;
    onChange();
    const slots = [];
    for (let k = 0; k < BADGE_SLOTS; k++) {
      const id = BADGES[k];
      const has = id && earned.includes(id);
      slots.push(h('div', { class: `badge-slot ${has ? 'earned' : ''} ${id ? '' : 'empty'}`, style: { animationDelay: `${0.4 + k * 0.6}s` } },
        icon(id ? `badge.${id}` : 'badge.empty', 'badge-icon')));
    }
    const next = nextButton();
    main.replaceChildren(h('div', { class: 'parent-label' }, t('ui.badges')), h('div', { class: 'badge-row' }, ...slots), next);
    let moved = false;
    onTap(next, () => { if (moved) return; moved = true; go(shop ? 'decorate' : 'cleanup'); });
    if (earned.length) {
      play('fanfare');
      setExpression(boss, 'happy');
      act(boss, 'hop');
      const say1 = { perfectDay: 'say.badgePerfectDay', perfectRegister: 'say.badgePerfectRegister', neverRanOut: 'say.badgeNeverRanOut' };
      for (const b of earned) { if (moved) break; await say(line(say1[b])); }
    } else {
      await say(line('say.noBadges'));
    }
  }

  // ---- 4. Decorating: the day's decorator buys one thing --------------------

  async function decorate() {
    const holder = h('div', { class: 'decorate-holder' });
    const next = nextButton('decorate-next');
    const apron = day.decorator ? APRONS.find((a) => a.id === day.decorator) : null;
    main.replaceChildren(
      h('div', { class: 'decorate-head' },
        apron ? apronSvg(apron.color, 'apron small') : null,
        h('div', { class: 'parent-label' }, t('ui.shop'))),
      holder, next);
    openCatalog(holder, {
      embedded: true,
      getSave: shop.getSave,
      onSave: shop.onSave,
      canBuy: !c.bought,
      bought: !!c.bought,
      scale: 0.28,
      dayNumber: day.number || 0,
      say: (text) => { stopSpeaking(); say(text); },
      onBought: () => { c.bought = true; onChange(); setExpression(boss, 'happy'); act(boss, 'hop'); },
    });
    let moved = false;
    onTap(next, () => { if (moved) return; moved = true; go('cleanup'); });
    if (!c.bought) {
      await say(apron ? jobSentenceDecorator(apron.id) : line('say.decoratorAny'));
    }
  }

  function jobSentenceDecorator(apronId) {
    return line('say.decorator', { apron: t(`aprons.${apronId}`) });
  }

  // ---- 4. Cleanup song --------------------------------------------------------

  async function cleanup() {
    const doughs = [
      { id: 'black', color: '#2a2522' },
      { id: 'white', color: '#fbfbf3' },
      { id: 'red', color: '#e0434f' },
    ];
    const lanes = doughs.map((d, k) => h('div', { class: 'tub-lane', style: { '--dough': d.color, animationDelay: `${k * 2.2}s` } },
      h('div', { class: 'dough', style: { animationDelay: `${0.4 + k * 0.7}s` } }),
      h('div', { class: 'tub' }, h('div', { class: 'tub-lid' }), h('div', { class: 'tub-band' }))));
    const done = h('button', { class: 'btn big done-btn' }, icon('check'), h('span', { class: 'label' }, t('ui.done')));
    main.replaceChildren(h('div', { class: 'parent-label' }, t('ui.cleanup')), h('div', { class: 'tub-row' }, ...lanes), done);
    play('song');
    let finished = false;
    onTap(done, async () => {
      if (finished) return;
      finished = true;
      stopSpeaking();
      setExpression(boss, 'happy');
      act(boss, 'hop');
      await say(line('say.bye'));
      if (alive()) onDone({ money: dayMoney(day, config), stars: starsFor(dayMoney(day, config), config.starGoals), badges: c.badges || [] });
    });
    await say(line('say.cleanup'));
  }

  go(c.step || 'inspect');
}
