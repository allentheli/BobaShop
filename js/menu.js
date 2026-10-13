// The menu is plain data, matching the printed order ticket. Add a flavor,
// a topping or a whole new detail here and the order generator, pictures
// and voice pick it up without code changes.
//
// Each detail has:
//   level    the order level at which it starts to appear
//   row      the ticket row it is circled in (1 Cup ... 6 Notes)
//   priced   true when it changes the price (see prices in js/config.js)
//   onlyIf   another detail it depends on, e.g. no "extra topping" when the
//            order has no topping; the order then gets the first option
// Options may have a `weight` (default 1) to come up more or less often,
// and `always: true` to be offered even when not in the family's owned list.
// Each option's `icon` is a key in the asset manifest (js/assets.js) and its
// spoken name is in js/strings.js under menu.<detail>.<option>.

export const MENU = {
  id: 'boba',
  // The order pictures are shown in, the same as the ticket rows.
  showOrder: ['size', 'tea', 'topping', 'ice', 'sugar', 'fresh', 'extra', 'brew'],
  // Ticket row colors, so each picture sits on the same color as on paper.
  rows: {
    1: { name: 'cup', fill: '#fbeee0', line: '#efcfa8' },
    2: { name: 'tea', fill: '#e8f4dc', line: '#bfdca0' },
    3: { name: 'topping', fill: '#fde4ea', line: '#f5b8c6' },
    4: { name: 'ice', fill: '#ebe7f8', line: '#c9bfee' },
    5: { name: 'sugar', fill: '#fdefdf', line: '#f2d0a8' },
    6: { name: 'notes', fill: '#e8f4dc', line: '#bfdca0' },
  },
  details: [
    {
      id: 'tea', level: 1, row: 2,
      options: [
        { id: 'milk', icon: 'tea.milk', color: '#e8564a' },
        { id: 'matcha', icon: 'tea.matcha', color: '#9fcf6a' },
        { id: 'taro', icon: 'tea.taro', color: '#a983cf' },
      ],
    },
    {
      id: 'topping', level: 1, row: 3,
      options: [
        { id: 'none', icon: 'topping.none', always: true },
        { id: 'pearls', icon: 'topping.pearls', color: '#6b4434' },
        { id: 'jelly', icon: 'topping.jelly', color: '#fff6dc' },
        { id: 'hearts', icon: 'topping.hearts', color: '#ff7f95' },
      ],
    },
    {
      id: 'size', level: 2, row: 1, priced: true,
      options: [{ id: 'small', icon: 'size.small' }, { id: 'large', icon: 'size.large' }],
    },
    {
      // One more scoop than the cup size calls for.
      id: 'extra', level: 3, row: 6, priced: true, onlyIf: { detail: 'topping', not: 'none' },
      options: [{ id: 'no', icon: null, weight: 2 }, { id: 'yes', icon: 'extra.yes' }],
    },
    {
      id: 'ice', level: 4, row: 4,
      options: [{ id: 'none', icon: 'ice.none' }, { id: 'some', icon: 'ice.some' }, { id: 'lots', icon: 'ice.lots' }],
    },
    {
      id: 'sugar', level: 5, row: 5,
      options: [{ id: 'none', icon: 'sugar.none' }, { id: 'some', icon: 'sugar.some' }, { id: 'lots', icon: 'sugar.lots' }],
    },
    {
      // Toppings made on the spot.
      id: 'fresh', level: 6, row: 6, priced: true, onlyIf: { detail: 'topping', not: 'none' },
      options: [{ id: 'no', icon: null, weight: 2 }, { id: 'yes', icon: 'fresh.yes' }],
    },
    {
      // Freshly brewed tea: the manager brews a new pot for this drink.
      // Not on the printed ticket: the cashier writes it on the Notes line.
      id: 'brew', level: 8, row: 6, priced: true,
      options: [{ id: 'no', icon: null, weight: 2 }, { id: 'yes', icon: 'brew.yes' }],
    },
  ],
};

export function detail(menu, id) {
  return menu.details.find((d) => d.id === id);
}

export function option(menu, detailId, optionId) {
  const d = detail(menu, detailId);
  return d && d.options.find((o) => o.id === optionId);
}
