import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU } from '../js/menu.js';
import { CONFIG } from '../js/config.js';
import { CUSTOMERS } from '../js/assets.js';
import { Shift } from '../js/shift.js';
import { price, pickHint, pickInspection, badgesFor } from '../js/logic.js';
import { assignJobs, nextDecorator, JOB_SETS, APRONS } from '../js/jobs.js';
import { loadSave, writeSave, defaultSave } from '../js/storage.js';
import { jobSentence } from '../js/text.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

test('job sets for 2, 3 and 4 players', () => {
  assert.deepEqual(Object.values(assignJobs(['pink', 'blue', 'yellow', 'green'])).sort(), [...JOB_SETS[4]].sort());
  assert.deepEqual(Object.values(assignJobs(['pink', 'blue', 'yellow'])).sort(), [...JOB_SETS[3]].sort());
  assert.deepEqual(Object.values(assignJobs(['pink', 'blue'])).sort(), [...JOB_SETS[2]].sort());
});

test('jobs rotate to the next job each day', () => {
  const aprons = ['pink', 'blue', 'yellow', 'green'];
  let jobs = assignJobs(aprons);
  const seen = Object.fromEntries(aprons.map((a) => [a, new Set([jobs[a]])]));
  for (let day = 0; day < 3; day++) {
    const next = assignJobs(aprons, jobs);
    for (const a of aprons) {
      const i = JOB_SETS[4].indexOf(jobs[a]);
      assert.equal(next[a], JOB_SETS[4][(i + 1) % 4]);
      seen[a].add(next[a]);
    }
    jobs = next;
  }
  // After four days everyone has had every job.
  for (const a of aprons) assert.equal(seen[a].size, 4);
});

test('a parent lock keeps a job, and the others still get a job each', () => {
  const aprons = ['pink', 'blue', 'yellow'];
  const prev = { pink: 'cashier', blue: 'manager', yellow: 'maker' };
  const jobs = assignJobs(aprons, prev, { yellow: 'maker' });
  assert.equal(jobs.yellow, 'maker');
  assert.deepEqual(Object.values(jobs).sort(), [...JOB_SETS[3]].sort());
});

test('new aprons fill the jobs left over', () => {
  const jobs = assignJobs(['pink', 'orange'], { pink: 'front' });
  assert.equal(jobs.pink, 'maker');
  assert.equal(jobs.orange, 'front');
});

test('the decorator rotates through the aprons playing today', () => {
  const aprons = ['green', 'pink', 'blue'];
  assert.equal(nextDecorator(aprons, null), 'pink');
  assert.equal(nextDecorator(aprons, 'pink'), 'blue');
  assert.equal(nextDecorator(aprons, 'blue'), 'green');
  assert.equal(nextDecorator(aprons, 'green'), 'pink');
  assert.equal(nextDecorator(aprons, 'yellow'), 'green');
  assert.equal(APRONS.length >= 4, true);
});

test('every job has a sentence in every call mode', () => {
  for (const jobs of Object.values(JOB_SETS)) {
    for (const j of jobs) {
      for (const mode of ['easy', 'normal', 'hard']) {
        const s = jobSentence(j, 'pink', mode);
        assert.ok(s.startsWith('Pink apron'), `${j} ${mode}: ${s}`);
      }
    }
  }
});

test('the hint names an owned tea or topping', () => {
  const rng = seeded(8);
  for (let i = 0; i < 100; i++) {
    const h = pickHint(MENU, { owned: { tea: ['milk', 'taro'] }, rng });
    assert.ok(['tea', 'topping'].includes(h.detail));
    if (h.detail === 'tea') assert.ok(['milk', 'taro'].includes(h.option));
  }
});

test('inspection picks 3 at random, or all when fewer', () => {
  const served = [1, 2, 3, 4, 5, 6].map((n) => ({ number: n }));
  const pick = pickInspection(served, 3, seeded(2));
  assert.equal(pick.length, 3);
  assert.equal(new Set(pick.map((p) => p.number)).size, 3);
  assert.deepEqual(pick.map((p) => p.number), pick.map((p) => p.number).sort((a, b) => a - b));
  assert.equal(pickInspection(served.slice(0, 2), 3).length, 2);
  assert.equal(pickInspection([], 3).length, 0);
});

test('badges', () => {
  assert.deepEqual(badgesFor({ results: [true, true, true], rungUp: 5, mistakes: 0, ranOut: false }), ['perfectDay', 'perfectRegister', 'neverRanOut']);
  assert.deepEqual(badgesFor({ results: [true, false], rungUp: 5, mistakes: 1, ranOut: true }), []);
  assert.deepEqual(badgesFor({ results: [], rungUp: 0, mistakes: 0, ranOut: null }), []);
});

test('a saved shift comes back the same', () => {
  const config = structuredClone(CONFIG);
  const shift = new Shift({ config, menu: MENU, customers: CUSTOMERS });
  for (let t = 0; t < 80; t += 0.5) {
    shift.tick(0.5);
    if (shift.counter && shift.counter.placeTime > 3) shift.ringUp(price(shift.counter.order, config.prices));
  }
  shift.serve(shift.waiting[0].id);
  const json = JSON.parse(JSON.stringify(shift.toJSON()));
  const back = Shift.restore(json, { config, menu: MENU, customers: CUSTOMERS });
  assert.equal(back.time, shift.time);
  assert.equal(back.money, shift.money);
  assert.equal(back.nextOrderNumber, shift.nextOrderNumber);
  assert.deepEqual(back.served, shift.served);
  assert.deepEqual(back.waiting.map((p) => [p.number, p.spot, p.type.id]), shift.waiting.map((p) => [p.number, p.spot, p.type.id]));
  assert.equal(back.people.some((p) => p.place === 'served'), false);
  // It keeps running after coming back.
  for (let t = 0; t < 300; t += 0.5) back.tick(0.5);
  assert.equal(back.closed, true);
});

test('saving and loading the save record', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.deepEqual(loadSave(storage), defaultSave());
  const s = defaultSave();
  s.savings = 42;
  s.day = { phase: 'open', players: 3 };
  assert.equal(writeSave(s, storage), true);
  const back = loadSave(storage);
  assert.equal(back.savings, 42);
  assert.equal(back.day.phase, 'open');
  mem.set('bobashop.save.v1', '{broken');
  assert.deepEqual(loadSave(storage), defaultSave());
});

test('the how-to cards follow the day\'s order details and toppings', async () => {
  const { cardsFor, CARDS } = await import('../js/tutorial.js');
  const { STRINGS } = await import('../js/strings.js');
  const ids = (cards) => cards.map((c) => c.id);
  // Level 1: no ice or sugar cards; "how much" explains cup sizes and "none".
  const l1 = cardsFor(MENU, { level: 1 });
  assert.deepEqual(ids(l1), ['boba', 'jelly', 'hearts', 'howmuch', 'tea', 'finish']);
  assert.deepEqual(l1.find((c) => c.id === 'howmuch').steps.map((s) => s.index), [0, 1, 4]);
  // Level 6: every card, and every "how much" line.
  const l6 = cardsFor(MENU, { level: 6 });
  assert.deepEqual(ids(l6), ['boba', 'jelly', 'hearts', 'howmuch', 'tea', 'ice', 'sugar', 'finish']);
  assert.equal(l6.find((c) => c.id === 'howmuch').steps.length, 5);
  // Only the toppings the family has.
  assert.deepEqual(ids(cardsFor(MENU, { level: 1, owned: { topping: ['hearts'] } })).slice(0, 2), ['hearts', 'howmuch']);
  // Every step has a spoken line, and every card a picture.
  for (const c of CARDS) {
    assert.equal(STRINGS.en.tutorial[c.id].length, c.steps.length, c.id);
    assert.ok(fs.existsSync(path.join(root, `assets/cards/${c.id}.jpg`)), c.id);
  }
});

test('visitors get their own look, kept through the day', async () => {
  const { makeLook } = await import('../js/logic.js');
  const { ACCESSORIES } = await import('../js/assets.js');
  const { STRINGS } = await import('../js/strings.js');
  const rng = seeded(12);
  const looks = Array.from({ length: 300 }, () => makeLook(CUSTOMERS[0], ACCESSORIES, rng, 4));
  for (const l of looks) {
    for (const slot of ['head', 'eyes', 'neck']) if (l[slot]) assert.equal(ACCESSORIES[l[slot]].slot, slot);
    assert.ok(CUSTOMERS[0].hues.includes(l.hue));
    assert.ok(l.name >= 0 && l.name < 4);
  }
  // Plenty of variety: hats, glasses and plain faces all show up.
  assert.ok(looks.some((l) => l.head) && looks.some((l) => !l.head) && looks.some((l) => l.eyes));
  // Every kind of customer has a picture and four names.
  for (const c of CUSTOMERS) {
    assert.ok(fs.existsSync(path.join(root, c.body)), c.id);
    assert.equal(STRINGS.en.customers[c.id].names.length, 4, c.id);
  }
  for (const a of Object.values(ACCESSORIES)) assert.ok(fs.existsSync(path.join(root, a.file)), a.file);
  // A shift gives each visitor a look, and the served record keeps it.
  const shift = new Shift({ config: structuredClone(CONFIG), menu: MENU, customers: CUSTOMERS, looks: { accessories: ACCESSORIES, nameCount: 4 } });
  for (let t = 0; t < 10; t += 0.5) shift.tick(0.5);
  const c = shift.counter;
  assert.ok(c.look);
  shift.ringUp(price(c.order, CONFIG.prices));
  shift.serve(c.id);
  assert.deepEqual(shift.served[0].look, c.look);
});
