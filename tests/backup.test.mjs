import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBackup, backupText, backupCode, readBackup, backupSummary, backupFileName } from '../js/backup.js';
import { defaultSave } from '../js/storage.js';

function sample() {
  const s = defaultSave();
  s.savings = 86;
  s.days = 12;
  s.totalStars = 20;
  s.settings = { level: 4, cups: { small: 20, large: 15 } };
  s.decorations = { owned: ['wall-polka', 'thing-pet'], chosen: { wall: 'wall-polka' }, hidden: [] };
  s.day = { phase: 'open', number: 13, shift: { time: 120 } };
  s.lastSong = 'dragon';
  return s;
}

test('a backup file comes back exactly', () => {
  const s = sample();
  const r = readBackup(backupText(s));
  assert.equal(r.ok, true);
  assert.deepEqual(r.save, s);
});

test('a text code comes back exactly, even pasted with line breaks', () => {
  const s = sample();
  s.history.push({ day: 1, money: 10, note: 'Café ☕' });
  const code = backupCode(s);
  assert.ok(code.startsWith('BOBA1:'));
  const broken = code.slice(0, 40) + '\n' + code.slice(40);
  const r = readBackup(broken);
  assert.equal(r.ok, true);
  assert.deepEqual(r.save, s);
});

test('something that is not a backup is refused', () => {
  assert.equal(readBackup('hello').ok, false);
  assert.equal(readBackup('{"a":1}').why, 'notBackup');
  assert.equal(readBackup('BOBA1:!!!').ok, false);
  assert.equal(readBackup('').ok, false);
});

test('an older backup with missing parts still loads', () => {
  const old = { app: 'boba-shop-backup', version: 1, save: { savings: 5, days: 2 } };
  const r = readBackup(JSON.stringify(old));
  assert.equal(r.ok, true);
  assert.equal(r.save.savings, 5);
  assert.deepEqual(r.save.decorations.owned, []);
  assert.deepEqual(r.save.rotation.byCount, {});
});

test('the summary and file name', () => {
  assert.deepEqual(backupSummary(sample()), { days: 12, savings: 86, stars: 20, decorations: 2, dayInProgress: true });
  assert.equal(backupFileName(new Date('2026-10-13T12:00:00Z')), 'boba-shop-backup-2026-10-13.json');
  assert.equal(makeBackup(sample()).app, 'boba-shop-backup');
});
