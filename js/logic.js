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
    if (owned) opts2 = opts2.filter((o) => owned.includes(o.id));
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
        opts.bias && opts.bias.detail === d.id && opts.bias.option === o.id ? (opts.bias.weight ?? 2) : 1,
      );
      order[d.id] = choices[weightedIndex(weights, rng)].id;
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
  if (order.fresh === 'yes') parts.push({ id: 'fresh', coins: prices.fresh });
  return parts;
}

export function price(order, prices) {
  return priceParts(order, prices).reduce((s, p) => s + p.coins, 0);
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
