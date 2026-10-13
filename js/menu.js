// The menu is plain data. Add a flavor, a topping or a whole new detail here
// and the order generator, pictures and voice pick it up without code changes.
// `level` is the order level at which a detail starts to appear.
// Each option's `icon` is a key in the asset manifest (js/assets.js) and its
// spoken name is in js/strings.js under menu.<detail>.<option>.

export const MENU = {
  id: 'boba',
  // The order the pictures are shown in, matching how the manager calls
  // the steps: cup, topping and scoops, then tea, ice and sugar.
  showOrder: ['size', 'topping', 'scoops', 'fresh', 'tea', 'brew', 'ice', 'sugar'],
  details: [
    {
      id: 'tea', level: 1,
      options: [
        { id: 'milk', icon: 'tea.milk', color: '#a8744f' },
        { id: 'matcha', icon: 'tea.matcha', color: '#7fb04a' },
        { id: 'taro', icon: 'tea.taro', color: '#a07cc5' },
      ],
    },
    {
      id: 'topping', level: 1,
      options: [
        { id: 'pearls', icon: 'topping.pearls', color: '#2b2b2b' },
        { id: 'jelly', icon: 'topping.jelly', color: '#f4f4ee' },
        { id: 'hearts', icon: 'topping.hearts', color: '#e0434f' },
      ],
    },
    {
      id: 'size', level: 2, priced: true,
      options: [{ id: 'small', icon: 'size.small' }, { id: 'large', icon: 'size.large' }],
    },
    {
      id: 'scoops', level: 3,
      options: [{ id: '1', icon: 'scoops.1' }, { id: '2', icon: 'scoops.2' }, { id: '3', icon: 'scoops.3' }],
    },
    {
      id: 'ice', level: 4,
      options: [{ id: 'none', icon: 'ice.none' }, { id: 'some', icon: 'ice.some' }, { id: 'lots', icon: 'ice.lots' }],
    },
    {
      id: 'sugar', level: 5,
      options: [{ id: 'none', icon: 'sugar.none' }, { id: 'half', icon: 'sugar.half' }, { id: 'full', icon: 'sugar.full' }],
    },
    {
      id: 'fresh', level: 6, priced: true,
      options: [{ id: 'no', icon: null }, { id: 'yes', icon: 'fresh.yes' }],
    },
    {
      // Freshly brewed tea: the manager brews a new pot for this drink.
      id: 'brew', level: 8, priced: true,
      options: [{ id: 'no', icon: null }, { id: 'yes', icon: 'brew.yes' }],
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
