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
