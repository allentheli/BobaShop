// Checks that every app file is saved for offline play and every asset exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS, CUSTOMERS, BOSS } from '../js/assets.js';
import { MENU } from '../js/menu.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
}

test('every app file is listed for offline play', () => {
  const files = [...walk('js'), ...walk('css'), ...walk('assets')].filter((f) => !f.endsWith('icon.svg'));
  for (const f of files) assert.ok(sw.includes(`'${f}'`), `${f} is missing from sw.js`);
});

test('every listed asset exists', () => {
  const paths = [...Object.values(ICONS), ...CUSTOMERS.map((c) => c.body), BOSS.body];
  for (const p of paths) assert.ok(fs.existsSync(path.join(root, p)), p);
  for (const m of sw.matchAll(/'([^']+\.[a-z]+)'/g)) assert.ok(fs.existsSync(path.join(root, m[1])), m[1]);
});

test('the tea and topping on every order have a picture', () => {
  for (const id of ['tea', 'topping']) {
    for (const o of MENU.details.find((d) => d.id === id).options) assert.ok(ICONS[o.icon], o.icon);
  }
});
