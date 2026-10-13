// Pure game rules: order generation, prices, tips and stars.
// No DOM here, so these run in the automated tests (tests/*.test.mjs).

// Details that appear in orders at this level. `enabled` (optional) lists
// detail ids a parent has switched on or off, overriding the level.
export function activeDetails(menu, level, enabled = {}) {
  return menu.details.filter((d) => {
    if (enabled[d.id] === false) return false;
    if (enabled[d.id] === true) return true;
    return d.level <= level;
  });
}

// opts:
//   level, enabled            which details to include
//   owned: { tea: [...], topping: [...] }   options the family owns (all if missing)
//   cupsLeft: { small, large }               sizes with 0 are never ordered
//   bias: { detail: 'tea', option: 'taro', weight: 2 }   the boss's hint
//   previous: the last order, to avoid repeating it
//   rng: () => number in [0, 1)
// Returns an object like { tea: 'milk', topping: 'pearls' } or null if
// nothing can be ordered (for example every cup is used).
export function generateOrder(menu, opts = {}) {
  const rng = opts.rng || Math.random;
  const details = activeDetails(menu, opts.level ?? 1, opts.enabled);

  const choicesFor = (d) => {
    let opts2 = d.options;
    const owned = opts.owned && opts.owned[d.id];
    if (owned) opts2 = opts2.filter((o) => o.always || owned.includes(o.id));
    if (d.id === 'size' && opts.cupsLeft) {
      opts2 = opts2.filter((o) => (opts.cupsLeft[o.id] ?? 1) > 0);
    }
    return opts2;
  };

  const pickOnce = () => {
    const order = {};
    for (const d of details) {
      const choices = choicesFor(d);
      if (choices.length === 0) return null;
      const weights = choices.map((o) =>
        (o.weight ?? 1) * (opts.bias && opts.bias.detail === d.id && opts.bias.option === o.id ? (opts.bias.weight ?? 2) : 1),
      );
      order[d.id] = choices[weightedIndex(weights, rng)].id;
    }
    // Details that only make sense with another one (no "extra topping"
    // when there is no topping) fall back to their first option.
    for (const d of details) {
      if (d.onlyIf && order[d.onlyIf.detail] === d.onlyIf.not) order[d.id] = d.options[0].id;
    }
    return order;
  };

  let order = pickOnce();
  if (!order) return null;
  // Avoid the same order twice in a row (only possible to avoid when the
  // menu has more than one combination).
  for (let i = 0; i < 20 && opts.previous && sameOrder(order, opts.previous); i++) {
    order = pickOnce();
  }
  return order;
}

export function sameOrder(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (a[k] !== b[k]) return false;
  return true;
}

function weightedIndex(weights, rng) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

// The priced parts of an order, as the easy register shows them.
// Orders without a size are priced as a plain drink at `base`.
export function priceParts(order, prices) {
  const parts = [];
  if (order.size) parts.push({ id: order.size, coins: prices[order.size] });
  else parts.push({ id: 'base', coins: prices.base });
  if (order.extra === 'yes') parts.push({ id: 'extra', coins: prices.extra });
  if (order.fresh === 'yes') parts.push({ id: 'fresh', coins: prices.fresh });
  if (order.brew === 'yes') parts.push({ id: 'brew', coins: prices.brew });
  return parts;
}

export function price(order, prices) {
  return priceParts(order, prices).reduce((s, p) => s + p.coins, 0);
}

// Hard register: the customer pays with the smallest coin bigger than the
// price, and the cashier works out the change.
export function payWith(due, coins = [5, 10, 20]) {
  return coins.find((c) => c > due) ?? Math.ceil((due + 1) / 10) * 10;
}

export function tipFor(secondsSinceOrder, tips) {
  for (const t of tips) if (secondsSinceOrder <= t.within) return t.coins;
  return 0;
}

export function starsFor(coins, goals) {
  return goals.filter((g) => coins >= g).length;
}

// Cup counting: returns a new cupsLeft after an order is taken.
export function useCup(cupsLeft, order) {
  if (!order.size) return { ...cupsLeft };
  return { ...cupsLeft, [order.size]: Math.max(0, (cupsLeft[order.size] ?? 0) - 1) };
}

export function soldOut(cupsLeft) {
  return Object.values(cupsLeft).every((n) => n <= 0);
}

// ---- The full day (milestone 2) -------------------------------------------

// The boss's hint for the day: one tea or topping that customers will ask
// for more often. Only items the family owns are picked.
export function pickHint(menu, { owned = {}, weight = 2, rng = Math.random } = {}) {
  const detailIds = ['tea', 'topping'];
  const d = detailIds[Math.floor(rng() * detailIds.length)];
  const options = menu.details.find((x) => x.id === d).options
    .filter((o) => !o.always && (!owned[d] || owned[d].includes(o.id)));
  if (options.length < 2) return null;
  return { detail: d, option: options[Math.floor(rng() * options.length)].id, weight };
}

// Closing inspection: pick up to `count` served orders at random, shown in
// order-number order. All of them when fewer were served.
export function pickInspection(served, count, rng = Math.random) {
  const pool = served.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a.number - b.number);
}

// Badges earned at closing.
//   results:    true/false for each inspected cup
//   rungUp:     how many orders were rung up
//   mistakes:   wrong totals at the register
//   ranOut:     the honor-system answer (true, false, or null if not asked)
export function badgesFor({ results = [], rungUp = 0, mistakes = 0, ranOut = null }) {
  const badges = [];
  if (results.length > 0 && results.every(Boolean)) badges.push('perfectDay');
  if (rungUp > 0 && mistakes === 0) badges.push('perfectRegister');
  if (ranOut === false) badges.push('neverRanOut');
  return badges;
}

// A visitor's look: a random hat, glasses and neckwear (or none), maybe a
// different fur color, and one of their kind's names. Kept with the
// customer so they look the same all day (and at the closing inspection).
export function makeLook(type, accessories = {}, rng = Math.random, nameCount = 1) {
  const bySlot = (slot) => Object.keys(accessories).filter((k) => accessories[k].slot === slot);
  const maybe = (chance, list) => (list.length && rng() < chance ? list[Math.floor(rng() * list.length)] : null);
  const hues = type.hues || [0];
  return {
    head: maybe(0.55, bySlot('head')),
    eyes: maybe(0.3, bySlot('eyes')),
    neck: maybe(0.35, bySlot('neck')),
    hue: hues[Math.floor(rng() * hues.length)],
    name: Math.floor(rng() * nameCount),
  };
}
