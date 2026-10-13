// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU } from '../js/menu.js';
import { CONFIG } from '../js/config.js';
import { generateOrder, activeDetails, price, priceParts, tipFor, starsFor, useCup, soldOut, sameOrder } from '../js/logic.js';

// A repeatable random number source for tests.
function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

test('level 1 orders have only tea and topping', () => {
  const rng = seeded(3);
  for (let i = 0; i < 200; i++) {
    const o = generateOrder(MENU, { level: 1, rng });
    assert.deepEqual(Object.keys(o).sort(), ['tea', 'topping']);
  }
});

test('each level adds its detail', () => {
  const expected = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 7, 8: 8 };
  for (const [level, n] of Object.entries(expected)) {
    assert.equal(activeDetails(MENU, Number(level)).length, n, `level ${level}`);
    const o = generateOrder(MENU, { level: Number(level), rng: seeded(5) });
    assert.equal(Object.keys(o).length, n);
  }
});

test('a parent can switch a detail on or off regardless of level', () => {
  const o = generateOrder(MENU, { level: 1, enabled: { size: true }, rng: seeded(2) });
  assert.ok(o.size);
  const o2 = generateOrder(MENU, { level: 7, enabled: { ice: false }, rng: seeded(2) });
  assert.equal(o2.ice, undefined);
});

test('only owned flavors and toppings are ordered', () => {
  const rng = seeded(9);
  for (let i = 0; i < 200; i++) {
    const o = generateOrder(MENU, { level: 1, owned: { tea: ['taro'], topping: ['pearls', 'hearts'] }, rng });
    assert.equal(o.tea, 'taro');
    // "No topping" is always possible: it needs no pieces.
    assert.ok(['none', 'pearls', 'hearts'].includes(o.topping));
  }
});

test('never orders a cup size that has run out', () => {
  const rng = seeded(4);
  for (let i = 0; i < 200; i++) {
    const o = generateOrder(MENU, { level: 2, cupsLeft: { small: 0, large: 3 }, rng });
    assert.equal(o.size, 'large');
  }
  assert.equal(generateOrder(MENU, { level: 2, cupsLeft: { small: 0, large: 0 }, rng }), null);
});

test('never the same order twice in a row', () => {
  const rng = seeded(11);
  let prev = null;
  for (let i = 0; i < 500; i++) {
    const o = generateOrder(MENU, { level: 1, previous: prev, rng });
    if (prev) assert.ok(!sameOrder(o, prev));
    prev = o;
  }
});

test("the boss's hint makes that item more common", () => {
  const rng = seeded(7);
  let taro = 0;
  const n = 3000;
  for (let i = 0; i < n; i++) {
    if (generateOrder(MENU, { level: 1, bias: { detail: 'tea', option: 'taro', weight: 2 }, rng }).tea === 'taro') taro++;
  }
  // Weight 2 of 4 means about half, instead of a third.
  assert.ok(taro / n > 0.44 && taro / n < 0.56, `taro share ${taro / n}`);
});

test('prices', () => {
  const p = CONFIG.prices;
  assert.equal(price({ tea: 'milk', topping: 'pearls' }, p), 3);
  assert.equal(price({ size: 'small' }, p), 3);
  assert.equal(price({ size: 'large' }, p), 5);
  assert.equal(price({ size: 'large', fresh: 'yes' }, p), 6);
  assert.equal(price({ size: 'small', fresh: 'no' }, p), 3);
  assert.equal(price({ size: 'small', brew: 'yes' }, p), 4);
  assert.equal(price({ size: 'large', fresh: 'yes', brew: 'yes' }, p), 7);
  assert.equal(price({ size: 'large', extra: 'yes', fresh: 'yes', brew: 'yes' }, p), 8);
  assert.deepEqual(priceParts({ size: 'small', fresh: 'yes' }, p).map((x) => x.id), ['small', 'fresh']);
});

test('tips', () => {
  const t = CONFIG.tips;
  assert.equal(tipFor(10, t), 2);
  assert.equal(tipFor(75, t), 2);
  assert.equal(tipFor(76, t), 1);
  assert.equal(tipFor(150, t), 1);
  assert.equal(tipFor(151, t), 0);
});

test('star goals', () => {
  const g = CONFIG.starGoals;
  assert.equal(starsFor(0, g), 0);
  assert.equal(starsFor(9, g), 0);
  assert.equal(starsFor(10, g), 1);
  assert.equal(starsFor(18, g), 2);
  assert.equal(starsFor(25, g), 2);
  assert.equal(starsFor(26, g), 3);
  assert.equal(starsFor(99, g), 3);
});

test('cup counting', () => {
  let cups = { small: 1, large: 1 };
  cups = useCup(cups, { size: 'small' });
  assert.deepEqual(cups, { small: 0, large: 1 });
  assert.equal(soldOut(cups), false);
  cups = useCup(cups, { size: 'large' });
  assert.equal(soldOut(cups), true);
  assert.deepEqual(useCup({ small: 0, large: 0 }, { size: 'small' }), { small: 0, large: 0 });
});

test('the spoken order names every detail', async () => {
  const { orderSentence, drinkPhrase } = await import('../js/text.js');
  assert.equal(drinkPhrase({ tea: 'milk', topping: 'pearls' }), 'milk tea with boba pearls');
  assert.equal(drinkPhrase({ tea: 'milk', topping: 'none' }), 'milk tea with no topping');
  assert.equal(
    drinkPhrase({ tea: 'taro', topping: 'pearls', size: 'large', extra: 'yes', ice: 'lots', sugar: 'some', fresh: 'yes' }),
    'a large taro with extra fresh boba pearls, lots of ice and some sugar');
  assert.equal(
    drinkPhrase({ tea: 'milk', topping: 'jelly', size: 'small', brew: 'yes', fresh: 'no', extra: 'no' }),
    'a small freshly brewed milk tea with coconut jelly');
  assert.ok(orderSentence({ tea: 'matcha', topping: 'jelly', size: 'small', ice: 'none' }).includes('a small matcha with coconut jelly, no ice'));
});

test('no extra or fresh topping when there is no topping', () => {
  const rng = seeded(21);
  let none = 0;
  for (let i = 0; i < 500; i++) {
    const o = generateOrder(MENU, { level: 8, rng });
    if (o.topping === 'none') { none++; assert.equal(o.extra, 'no'); assert.equal(o.fresh, 'no'); }
  }
  assert.ok(none > 50);
});

test('notes like fresh and extra come up less often than not', () => {
  const rng = seeded(4);
  let fresh = 0;
  for (let i = 0; i < 2000; i++) if (generateOrder(MENU, { level: 6, rng }).fresh === 'yes') fresh++;
  assert.ok(fresh / 2000 < 0.3, `fresh share ${fresh / 2000}`);
});

test('hard register: the customer pays with a bigger coin', async () => {
  const { payWith } = await import('../js/logic.js');
  assert.equal(payWith(3), 5);
  assert.equal(payWith(5), 10);
  assert.equal(payWith(8), 10);
  assert.equal(payWith(10), 20);
  assert.equal(payWith(25), 30);
});

test('every detail option has a picture', async () => {
  const { ICONS } = await import('../js/assets.js');
  for (const d of MENU.details) for (const o of d.options) if (o.icon) assert.ok(ICONS[o.icon], o.icon);
});
