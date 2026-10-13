// Looks up words and spoken lines from js/strings.js.

import { STRINGS } from './strings.js';

let lang = 'en';
export function setLanguage(l) { if (STRINGS[l]) lang = l; }

function lookup(path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), STRINGS[lang]);
}

function fill(s, vars) {
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

function pick(v, rng) {
  return Array.isArray(v) ? v[Math.floor(rng() * v.length)] : v;
}

// On-screen label.
export function t(path, vars = {}) {
  const v = lookup(path);
  if (v == null) return path;
  return fill(pick(v, () => 0), vars);
}

// Spoken line, picking a random variant when there are several.
export function line(path, vars = {}, rng = Math.random) {
  const v = lookup(path);
  if (v == null) return '';
  return fill(pick(v, rng), vars);
}

export function menuWord(detailId, optionId) {
  return lookup(`menu.${detailId}.${optionId}`) ?? optionId;
}

export function customerName(id) {
  return lookup(`customers.${id}`) || { name: id, full: id };
}

// The spoken order. Milestone 1 orders have tea and topping only.
export function orderSentence(order, rng = Math.random) {
  return line('say.order', {
    tea: menuWord('tea', order.tea),
    topping: menuWord('topping', order.topping),
  }, rng);
}
