// Decorating the shop: the catalog, and the rules for buying and choosing.
// Decorations only change how the shop looks, never prices or difficulty.
// Every item is a direct purchase at the shown price (no mystery boxes).
//
// Kinds: wall, floor, counter and sign have one style each (choose any
// owned one); things (plants, lights...) can each be shown or hidden.
// The look of each style is in css/style.css (.wall-<id>, .floor-<id>...);
// things are pictures in assets/decor/, placed at `at` on the shop screen
// (x, y of the top-left corner and width, in stage pixels).
//
// Prices are in coins: something is affordable after any ordinary day
// (about 10 to 30 coins), and the biggest items take three or four days.

export const KINDS = ['wall', 'floor', 'counter', 'sign', 'things'];

export const CATALOG = [
  { id: 'wall-cream', kind: 'wall', price: 0 },
  { id: 'wall-mint', kind: 'wall', price: 8 },
  { id: 'wall-polka', kind: 'wall', price: 12 },
  { id: 'wall-clouds', kind: 'wall', price: 18 },
  { id: 'wall-night', kind: 'wall', price: 30 },
  { id: 'wall-rainbow', kind: 'wall', price: 45 },

  { id: 'floor-checker', kind: 'floor', price: 0 },
  { id: 'floor-mint', kind: 'floor', price: 8 },
  { id: 'floor-wood', kind: 'floor', price: 15 },
  { id: 'floor-hearts', kind: 'floor', price: 22 },
  { id: 'floor-rainbow', kind: 'floor', price: 40 },

  { id: 'counter-wood', kind: 'counter', price: 0 },
  { id: 'counter-pink', kind: 'counter', price: 8 },
  { id: 'counter-mint', kind: 'counter', price: 10 },
  { id: 'counter-marble', kind: 'counter', price: 20 },
  { id: 'counter-gold', kind: 'counter', price: 50 },

  { id: 'sign-green', kind: 'sign', price: 0 },
  { id: 'sign-pink', kind: 'sign', price: 5 },
  { id: 'sign-purple', kind: 'sign', price: 8 },
  { id: 'sign-rainbow', kind: 'sign', price: 20 },

  { id: 'thing-picture', kind: 'things', price: 10, file: 'assets/decor/picture.svg', at: { x: 300, y: 285, w: 88 } },
  { id: 'thing-plant', kind: 'things', price: 12, file: 'assets/decor/plant.svg', at: { x: 200, y: 400, w: 100 } },
  { id: 'thing-balloons', kind: 'things', price: 14, file: 'assets/decor/balloons.svg', at: { x: 1085, y: 140, w: 84 } },
  { id: 'thing-clock', kind: 'things', price: 15, file: 'assets/decor/clock.svg', at: { x: 76, y: 140, w: 80 } },
  { id: 'thing-rug', kind: 'things', price: 16, file: 'assets/decor/rug.svg', at: { x: 410, y: 545, w: 340 } },
  { id: 'thing-lights', kind: 'things', price: 18, file: 'assets/decor/lights.svg', at: { x: 0, y: 116, w: 1180 } },
  { id: 'thing-pet', kind: 'things', price: 60, file: 'assets/decor/pet.svg', at: { x: 1040, y: 530, w: 120 }, onCounter: true },
];

export const DEFAULTS = { wall: 'wall-cream', floor: 'floor-checker', counter: 'counter-wood', sign: 'sign-green' };

export function item(id) { return CATALOG.find((c) => c.id === id) || null; }

// The decorations part of the save, filled in with defaults.
export function decorState(dec = {}) {
  return {
    owned: dec.owned || [],
    chosen: { ...DEFAULTS, ...(dec.chosen || {}) },
    hidden: dec.hidden || [],
    newest: dec.newest || null,
  };
}

export function owns(dec, id) {
  const it = item(id);
  return !!it && (it.price === 0 || dec.owned.includes(id));
}

// What the shop shows: the chosen style for each kind, and the owned things
// that are not hidden.
export function shopLook(dec) {
  const d = decorState(dec);
  return {
    ...d.chosen,
    things: CATALOG.filter((c) => c.kind === 'things' && d.owned.includes(c.id) && !d.hidden.includes(c.id)),
  };
}

// Buy an item. Returns { ok, dec, savings, why }. A bought style is put up
// right away; a bought thing is shown.
export function buy(dec, savings, id, dayNumber = 0) {
  const d = decorState(dec);
  const it = item(id);
  if (!it) return { ok: false, dec: d, savings, why: 'unknown' };
  if (owns(d, id)) return { ok: false, dec: d, savings, why: 'owned' };
  if (savings < it.price) return { ok: false, dec: d, savings, why: 'coins' };
  d.owned = [...d.owned, id];
  if (it.kind === 'things') d.hidden = d.hidden.filter((x) => x !== id);
  else d.chosen = { ...d.chosen, [it.kind]: id };
  d.newest = { id, day: dayNumber };
  return { ok: true, dec: d, savings: savings - it.price };
}

// Use an owned style, or show/hide an owned thing. Free.
export function choose(dec, id) {
  const d = decorState(dec);
  const it = item(id);
  if (!it || !owns(d, id)) return d;
  if (it.kind === 'things') {
    d.hidden = d.hidden.includes(id) ? d.hidden.filter((x) => x !== id) : [...d.hidden, id];
  } else {
    d.chosen = { ...d.chosen, [it.kind]: id };
  }
  return d;
}
