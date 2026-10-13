import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG, KINDS, DEFAULTS, decorState, buy, choose, owns, shopLook } from '../js/decor.js';
import { STRINGS } from '../js/strings.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('buying spends the jar and puts the item up', () => {
  const r = buy({}, 20, 'wall-polka', 3);
  assert.equal(r.ok, true);
  assert.equal(r.savings, 8);
  assert.equal(r.dec.chosen.wall, 'wall-polka');
  assert.deepEqual(r.dec.newest, { id: 'wall-polka', day: 3 });
  // Not twice, and not without enough coins.
  assert.equal(buy(r.dec, 100, 'wall-polka').why, 'owned');
  assert.equal(buy(r.dec, 5, 'thing-pet').why, 'coins');
  assert.equal(buy(r.dec, 5, 'thing-pet').savings, 5);
});

test('the free styles are owned from the start, and switching is free', () => {
  const d = decorState({});
  for (const id of Object.values(DEFAULTS)) assert.ok(owns(d, id));
  const r = buy(d, 50, 'floor-wood');
  const back = choose(r.dec, 'floor-checker');
  assert.equal(back.chosen.floor, 'floor-checker');
  // Choosing something not owned changes nothing.
  assert.equal(choose(back, 'floor-rainbow').chosen.floor, 'floor-checker');
});

test('things can be shown and hidden once bought', () => {
  const r = buy({}, 30, 'thing-plant');
  assert.deepEqual(shopLook(r.dec).things.map((x) => x.id), ['thing-plant']);
  const hidden = choose(r.dec, 'thing-plant');
  assert.deepEqual(shopLook(hidden).things, []);
  assert.deepEqual(shopLook(choose(hidden, 'thing-plant')).things.map((x) => x.id), ['thing-plant']);
});

test('prices: something after any ordinary day, the biggest take a few days', () => {
  const paid = CATALOG.filter((c) => c.price > 0);
  for (const k of KINDS) assert.ok(paid.some((c) => c.kind === k && c.price <= 12), `cheap ${k}`);
  const max = Math.max(...paid.map((c) => c.price));
  assert.ok(max >= 40 && max <= 80, `max ${max}`);
});

test('every decoration has a name and its picture or style', () => {
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  for (const c of CATALOG) {
    assert.ok(STRINGS.en.decor[c.id], c.id);
    if (c.file) assert.ok(fs.existsSync(path.join(root, c.file)), c.file);
    else if (c.price > 0) assert.ok(css.includes(`.${c.id}`), `style for ${c.id}`);
  }
});
