import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU } from '../js/menu.js';
import { CONFIG } from '../js/config.js';
import { CUSTOMERS } from '../js/assets.js';
import { Shift } from '../js/shift.js';
import { price } from '../js/logic.js';

function make(overrides = {}) {
  const config = { ...structuredClone(CONFIG), ...overrides };
  const events = [];
  const shift = new Shift({ config, menu: MENU, customers: CUSTOMERS, onEvent: (type, p) => events.push({ type, p }) });
  return { shift, events, config };
}

function run(shift, seconds, step = 0.1) {
  for (let t = 0; t < seconds; t += step) shift.tick(step);
}

test('the first customer arrives and steps up as order 1', () => {
  const { shift } = make();
  run(shift, 3);
  assert.ok(shift.counter);
  assert.equal(shift.counter.number, 1);
});

test('a wrong total is refused and the right one is paid', () => {
  const { shift } = make();
  run(shift, 3);
  const c = shift.counter;
  const due = price(c.order, CONFIG.prices);
  assert.equal(shift.ringUp(due + 1), false);
  assert.equal(shift.money, 0);
  assert.equal(shift.ringUp(due), true);
  assert.equal(shift.money, due);
  assert.equal(c.place, 'waiting');
  assert.equal(shift.registerMistakes, 1);
});

test('a customer steps up only when a waiting spot is free', () => {
  const { shift } = make({ arrivalEvery: 5 });
  run(shift, 3);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  run(shift, 6);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  run(shift, 10);
  // Two drinks in progress: the next customer stays in line.
  assert.equal(shift.waiting.length, 2);
  assert.equal(shift.counter, null);
  assert.ok(shift.line.length > 0);
  // Serving one frees a spot.
  shift.serve(shift.waiting[0].id);
  run(shift, 0.2);
  assert.ok(shift.counter);
  assert.equal(shift.counter.number, 3);
});

test('waiting spots stay put when another customer is served', () => {
  const { shift } = make({ arrivalEvery: 5 });
  run(shift, 3);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  run(shift, 6);
  const second = shift.counter;
  shift.ringUp(price(second.order, CONFIG.prices));
  assert.equal(second.spot, 1);
  shift.serve(shift.waiting.find((p) => p.spot === 0).id);
  assert.equal(second.spot, 1);
  run(shift, 5);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  assert.equal(shift.waiting.find((p) => p.number === 3).spot, 0);
});

test('the line never grows past its limit', () => {
  const { shift } = make({ arrivalEvery: 1 });
  run(shift, 60);
  assert.ok(shift.line.length <= CONFIG.lineLength);
});

test('tips depend on how fast the drink is served', () => {
  const { shift } = make({ arrivalEvery: 5 });
  run(shift, 3);
  const a = shift.counter;
  shift.ringUp(price(a.order, CONFIG.prices));
  run(shift, 6);
  const b = shift.counter;
  shift.ringUp(price(b.order, CONFIG.prices));
  run(shift, 30);
  shift.serve(a.id);
  assert.equal(a.tip, 2);
  run(shift, 100);
  shift.serve(b.id);
  assert.equal(b.tip, 1);
  assert.equal(shift.tips, 3);
});

test('customers in line never leave when leaving is off', () => {
  const { shift } = make({ arrivalEvery: 5, customersLeave: false });
  run(shift, 250);
  assert.equal(shift.people.filter((p) => p.leftBecause === 'gaveUp').length, 0);
});

test('customers in line leave without paying when leaving is on', () => {
  const { shift, config } = make({ arrivalEvery: 5, customersLeave: true });
  run(shift, 3);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  const left = [];
  shift.emit = (type, p) => { if (type === 'leave') left.push(p); };
  run(shift, config.patience.lineLeave + 10);
  const fromLine = left.filter((p) => !p.refund);
  assert.ok(fromLine.length > 0);
  for (const p of fromLine) assert.equal(p.paidAt, null);
});

test('a paid customer who waits too long leaves and gets their coins back', () => {
  const { shift, config } = make({ arrivalEvery: 1000, customersLeave: true });
  run(shift, 3);
  const c = shift.counter;
  const due = price(c.order, CONFIG.prices);
  shift.ringUp(due);
  assert.equal(shift.money, due);
  // Halfway: the bar is shrinking but they are still waiting.
  run(shift, config.patience.waitWarn + 1);
  assert.equal(shift.patienceOf(c).warn, true);
  assert.ok(shift.patienceOf(c).left < 0.5);
  run(shift, config.patience.waitLeave - config.patience.waitWarn);
  assert.equal(c.place, 'gone');
  assert.equal(c.refund, due);
  assert.equal(shift.money, 0);
  assert.equal(shift.refunds, due);
  assert.equal(shift.served.length, 0);
});

test('nobody leaves when leaving is off', () => {
  const { shift } = make({ arrivalEvery: 5, customersLeave: false });
  run(shift, 3);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  run(shift, 280);
  assert.equal(shift.waiting.length, 1);
  assert.equal(shift.line.length, 3);
  assert.equal(shift.refunds, 0);
});

test('at closing the line leaves, no one steps up, and waiting drinks can still be served', () => {
  const { shift, config } = make({ arrivalEvery: 5, customersLeave: false });
  run(shift, 3);
  shift.ringUp(price(shift.counter.order, CONFIG.prices));
  run(shift, config.shiftLength);
  assert.equal(shift.closed, true);
  assert.equal(shift.line.length, 0);
  assert.equal(shift.counter === null || shift.counter.paidAt === null, true);
  const w = shift.waiting[0];
  assert.ok(shift.serve(w.id));
  run(shift, 60);
  assert.equal(shift.line.length, 0);
});

test('a whole played shift adds up', () => {
  const { shift, config } = make();
  let lastServe = 0;
  for (let t = 0; t < config.shiftLength + 30; t += 0.5) {
    shift.tick(0.5);
    if (shift.counter) shift.ringUp(price(shift.counter.order, CONFIG.prices));
    if (shift.waiting.length && t - lastServe > 40) { shift.serve(shift.waiting[0].id); lastServe = t; }
    for (const p of shift.people) if (p.place === 'served') shift.finishServed(p.id);
  }
  const s = shift.summary();
  assert.ok(s.drinks >= 5, `served ${s.drinks}`);
  assert.equal(s.money, s.sales + s.tips);
  // Sales also count drinks paid for but still waiting at the end.
  assert.ok(s.sales >= s.served.reduce((a, r) => a + r.price, 0));
  assert.equal(s.sales, s.served.reduce((a, r) => a + r.price, 0) + shift.waiting.length * CONFIG.prices.base);
  assert.deepEqual(s.served.map((r) => r.number), [...s.served.map((r) => r.number)].sort((a, b) => a - b));
});

test('higher levels put every detail in the orders', () => {
  const { shift } = make({ level: 6 });
  run(shift, 3);
  const o = shift.counter.order;
  for (const k of ['tea', 'topping', 'size', 'extra', 'ice', 'sugar', 'fresh']) assert.ok(o[k], k);
  assert.ok(shift.counter.pays > price(o, CONFIG.prices));
});

test('cups are counted and the shop sells out', () => {
  const { shift, events } = make({ level: 2, cups: { small: 2, large: 1 }, arrivalEvery: 3 });
  let promisedTooMany = false;
  for (let t = 0; t < 200; t += 0.5) {
    shift.tick(0.5);
    const free = shift.cupsFree;
    if (free.small < 0 || free.large < 0) promisedTooMany = true;
    if (shift.counter) shift.ringUp(price(shift.counter.order, CONFIG.prices));
    if (shift.waiting.length) shift.serve(shift.waiting[0].id);
    for (const p of shift.people) if (p.place === 'served') shift.finishServed(p.id);
  }
  assert.equal(promisedTooMany, false);
  assert.equal(shift.rungUp, 3);
  assert.deepEqual(shift.cupsLeft, { small: 0, large: 0 });
  assert.equal(shift.closedBecause, 'soldOut');
  assert.ok(events.some((e) => e.type === 'close' && e.p === 'soldOut'));
  assert.equal(shift.summary().soldOut, true);
  // Sold out before the sun set.
  assert.ok(shift.time < CONFIG.shiftLength);
});

test('cups are not counted at level 1, where orders have no size', () => {
  const { shift } = make({ level: 1, cups: { small: 1, large: 1 }, arrivalEvery: 3 });
  for (let t = 0; t < 60; t += 0.5) {
    shift.tick(0.5);
    if (shift.counter) shift.ringUp(price(shift.counter.order, CONFIG.prices));
    if (shift.waiting.length) shift.serve(shift.waiting[0].id);
  }
  assert.ok(shift.rungUp > 2);
  assert.equal(shift.closed, false);
});

test('level 8 adds freshly brewed tea and keeps the longer line', () => {
  const { shift, config } = make({ level: 8, arrivalEvery: 1 });
  run(shift, 30);
  assert.equal(shift.line.length, config.longLine);
  assert.ok(['yes', 'no'].includes(shift.counter.order.brew));
});

test('level 7 has a longer line', () => {
  const { shift, config } = make({ level: 7, arrivalEvery: 1 });
  run(shift, 30);
  assert.equal(shift.line.length, config.longLine);
});

test('chaos: no limit on customers in line or waiting for drinks', () => {
  const { shift } = make({ ...CONFIG.crowds.chaos, customersLeave: false });
  for (let t = 0; t < 200; t += 0.5) {
    shift.tick(0.5);
    if (shift.counter) shift.ringUp(price(shift.counter.order, CONFIG.prices));
  }
  // Nobody is served, so customers pile up.
  assert.ok(shift.waiting.length > 10, `waiting ${shift.waiting.length}`);
  const spots = shift.waiting.map((p) => p.spot);
  assert.equal(new Set(spots).size, spots.length);
});

test('busy: three drinks in progress and a longer line', () => {
  const { shift } = make({ ...CONFIG.crowds.busy, customersLeave: false });
  for (let t = 0; t < 200; t += 0.5) {
    shift.tick(0.5);
    if (shift.counter) shift.ringUp(price(shift.counter.order, CONFIG.prices));
  }
  assert.equal(shift.waiting.length, 3);
  assert.equal(shift.line.length, 5);
});
