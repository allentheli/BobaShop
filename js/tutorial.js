// "How to make": the station cards from the printed sheet, read aloud by
// the boss one step at a time while that part of the card lights up.
//
// Each card lists its steps as parts of the card picture (top and bottom,
// as fractions of the card's height). A step or a card can depend on the
// day's order details (`needs`) or on a topping the family has (`topping`).
// The spoken words are in js/strings.js under tutorial.<card>.

import { activeDetails } from './logic.js';

const TOP3 = [[0.23, 0.37], [0.385, 0.57], [0.58, 0.77], [0.775, 0.97]];   // dough + 3 steps

export const CARDS = [
  { id: 'boba', station: 'topping', topping: 'pearls', steps: TOP3 },
  { id: 'jelly', station: 'topping', topping: 'jelly', steps: TOP3 },
  { id: 'hearts', station: 'topping', topping: 'hearts', steps: TOP3 },
  {
    id: 'howmuch', station: 'topping',
    steps: [[0.24, 0.37, 'size'], [0.38, 0.52, 'size'], [0.525, 0.665, 'extra'], [0.67, 0.815, 'fresh'], [0.82, 0.965]],
  },
  { id: 'tea', station: 'tea', steps: [[0.23, 0.34], [0.345, 0.46], [0.465, 0.63], [0.635, 0.8], [0.8, 0.97]] },
  { id: 'ice', station: 'tea', needs: 'ice', steps: [[0.23, 0.355], [0.37, 0.56], [0.57, 0.76], [0.77, 0.965]] },
  { id: 'sugar', station: 'tea', needs: 'sugar', steps: [[0.23, 0.355], [0.37, 0.56], [0.57, 0.76], [0.77, 0.965]] },
  { id: 'finish', station: 'tea', steps: [[0.21, 0.335], [0.345, 0.55], [0.555, 0.755], [0.76, 0.965]] },
];

// The cards (and steps) for today. A step is { index, top, bottom }.
export function cardsFor(menu, { level = 1, enabled = {}, owned = {} } = {}) {
  const active = new Set(activeDetails(menu, level, enabled).map((d) => d.id));
  const toppings = owned.topping;
  return CARDS
    .filter((c) => !c.needs || active.has(c.needs))
    .filter((c) => !c.topping || !toppings || toppings.includes(c.topping))
    .map((c) => ({
      ...c,
      steps: c.steps
        .map(([top, bottom, needs], index) => ({ index, top, bottom, needs }))
        .filter((s) => !s.needs || active.has(s.needs)),
    }));
}
