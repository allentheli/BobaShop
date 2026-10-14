// Checks every language has every word and line English has, in the same
// shape, with the same {slots}, so nothing is ever missing on screen or
// in the voice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS } from '../js/strings.js';
import { setLanguage, drinkPhrase, orderSentence, line, t, jobSentence } from '../js/text.js';

// Lines a language may leave empty.
const MAY_BE_EMPTY = ['ui.titleSub'];
// Lists that go with pictures or levels, so their length must match.
const SAME_LENGTH = (path) => path.startsWith('tutorial.') || path === 'cleanupSteps' || path === 'parent.levels';

const slots = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function compare(en, other, path, problems) {
  if (typeof en === 'string') {
    if (typeof other !== 'string') return problems.push(`${path}: missing`);
    const a = slots(en); const b = slots(other);
    for (const k of a) if (!b.includes(k)) problems.push(`${path}: no {${k}}`);
    for (const k of b) if (!a.includes(k)) problems.push(`${path}: unknown {${k}}`);
    if (en !== '' && other === '' && !MAY_BE_EMPTY.includes(path)) problems.push(`${path}: empty`);
    return;
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(other)) return problems.push(`${path}: should be a list`);
    if (SAME_LENGTH(path) && other.length !== en.length) problems.push(`${path}: ${other.length} lines, English has ${en.length}`);
    // Each variant must fill the same slots as English's first one.
    for (const [i, v] of other.entries()) compare(en[Math.min(i, en.length - 1)], v, `${path}[${i}]`, problems);
    return;
  }
  if (!other || typeof other !== 'object') return problems.push(`${path}: missing`);
  for (const k of Object.keys(en)) compare(en[k], other[k], path ? `${path}.${k}` : k, problems);
  for (const k of Object.keys(other)) if (!(k in en)) problems.push(`${path ? path + '.' : ''}${k}: not in English`);
}

for (const lang of Object.keys(STRINGS).filter((l) => l !== 'en')) {
  test(`${lang} has every line English has`, () => {
    const problems = [];
    compare(STRINGS.en, STRINGS[lang], '', problems);
    assert.deepEqual(problems, []);
  });
}

test('Chinese orders read naturally', () => {
  setLanguage('zh');
  try {
    assert.equal(drinkPhrase({ tea: 'milk', topping: 'pearls' }), '一杯奶茶，加珍珠');
    assert.equal(drinkPhrase({ tea: 'taro', topping: 'none', size: 'large' }), '大杯芋頭，不加配料');
    assert.equal(
      drinkPhrase({ tea: 'matcha', topping: 'jelly', size: 'small', extra: 'yes', fresh: 'yes', ice: 'some', sugar: 'lots', brew: 'yes' }),
      '小杯現泡的抹茶，加現做的椰果，多加一勺，少冰，全糖');
    assert.equal(orderSentence({ tea: 'milk', topping: 'hearts' }, () => 0), '請給我一杯奶茶，加愛心軟糖。');
    assert.match(jobSentence('cashier', 'pink'), /^粉紅色圍裙，你是收銀員。/);
  } finally {
    setLanguage('en');
  }
});

test('Chinese says 兩 for two of something, but not for order numbers', () => {
  setLanguage('zh');
  try {
    assert.equal(line('say.payWith', { n: 2 }), '給你兩個金幣。');
    assert.equal(line('say.payWith', { n: 12 }), '給你12個金幣。');
    assert.equal(line('say.servedCall', { n: 2 }), '2號！');
    assert.equal(line('say.bossPlayers', { n: 2 }, () => 0), '兩個人，太好了！');
    // On screen, numbers stay as digits.
    assert.equal(t('ui.coins', { n: 2 }), '2個金幣');
  } finally {
    setLanguage('en');
  }
});

test('English orders are unchanged', () => {
  assert.equal(drinkPhrase({ tea: 'milk', topping: 'pearls' }), 'milk tea with boba pearls');
  assert.equal(drinkPhrase({ tea: 'taro', topping: 'none', size: 'large', ice: 'some', sugar: 'none' }), 'a large taro with no topping, some ice and no sugar');
});
