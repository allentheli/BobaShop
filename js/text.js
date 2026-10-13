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

// A list of lines (for example one per tutorial step), or [].
export function lookupList(path) {
  const v = lookup(path);
  return Array.isArray(v) ? v : [];
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

// The spoken order, with every detail the order has.
export function orderSentence(order, rng = Math.random) {
  return line('say.order', { drink: drinkPhrase(order) }, rng);
}

export function drinkPhrase(order) {
  const P = (k, vars) => fill(lookup(`orderParts.${k}`), vars);
  let tea = menuWord('tea', order.tea);
  if (order.brew === 'yes') tea = P('brewed', { tea });
  let topping = menuWord('topping', order.topping);
  if (order.topping !== 'none') {
    if (order.fresh === 'yes') topping = P('fresh', { topping });
    if (order.extra === 'yes') topping = P('extra', { topping });
  }
  let s = order.size ? P('sized', { size: menuWord('size', order.size), tea }) : P('unsized', { tea });
  s += ' ' + P('topping', { topping });
  const extras = [];
  if (order.ice) extras.push(menuWord('ice', order.ice));
  if (order.sugar) extras.push(menuWord('sugar', order.sugar));
  if (extras.length) {
    const and = lookup('orderParts.and');
    const list = extras.length === 1 ? extras[0] : extras.slice(0, -1).join(lookup('orderParts.comma')) + and + extras[extras.length - 1];
    s += P('extras', { list });
  }
  return s;
}

// The boss's one-sentence job explanation, matching the call mode.
export function jobSentence(job, apronId, callMode = 'normal') {
  const lines = lookup(`jobSay.${job}`) || {};
  const s = lines[callMode] || lines.normal || '';
  return fill(s, { apron: lookup(`aprons.${apronId}`) || apronId });
}

export function hintSentence(hint, rng = Math.random) {
  if (!hint) return '';
  return hint.detail === 'tea'
    ? line('say.hintTea', { tea: menuWord('tea', hint.option) }, rng)
    : line('say.hintTopping', { topping: menuWord('topping', hint.option) }, rng);
}
