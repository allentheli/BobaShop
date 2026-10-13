// The asset manifest: every picture and sound the app uses, in one place.
// To swap a picture or voice, replace the file (or point the path at a new
// file) here. No code changes needed.

export const ICONS = {
  // Order pictures, the same as on the printed ticket.
  'tea.milk': 'assets/icons/tea-milk.svg',
  'tea.matcha': 'assets/icons/tea-matcha.svg',
  'tea.taro': 'assets/icons/tea-taro.svg',
  'topping.none': 'assets/icons/topping-none.svg',
  'topping.pearls': 'assets/icons/topping-pearls.svg',
  'topping.jelly': 'assets/icons/topping-jelly.svg',
  'topping.hearts': 'assets/icons/topping-hearts.svg',
  'size.small': 'assets/icons/size-small.svg',
  'size.large': 'assets/icons/size-large.svg',
  'ice.none': 'assets/icons/ice-none.svg',
  'ice.some': 'assets/icons/ice-some.svg',
  'ice.lots': 'assets/icons/ice-lots.svg',
  'sugar.none': 'assets/icons/sugar-none.svg',
  'sugar.some': 'assets/icons/sugar-some.svg',
  'sugar.lots': 'assets/icons/sugar-lots.svg',
  'fresh.yes': 'assets/icons/fresh-yes.svg',
  'extra.yes': 'assets/icons/extra-yes.svg',
  'brew.yes': 'assets/icons/brew-yes.svg',
  // A finished drink of each tea, held by served customers.
  'cup.milk': 'assets/icons/cup-milk.svg',
  'cup.matcha': 'assets/icons/cup-matcha.svg',
  'cup.taro': 'assets/icons/cup-taro.svg',
  drink: 'assets/icons/drink.svg',
  coin: 'assets/icons/coin.svg',
  star: 'assets/icons/star.svg',
  speaker: 'assets/icons/speaker.svg',
  check: 'assets/icons/check.svg',
  clear: 'assets/icons/clear.svg',
  bell: 'assets/icons/bell.svg',
  cross: 'assets/icons/cross.svg',
  register: 'assets/icons/register.svg',
  ticket: 'assets/icons/ticket.svg',
  // Before-opening checklist pictures (keys match js/jobs.js CHECKLISTS).
  tickets: 'assets/icons/tickets.svg',
  brew: 'assets/icons/brew.svg',
  rail: 'assets/icons/rail.svg',
  batch: 'assets/icons/batch.svg',
  cups: 'assets/icons/cups.svg',
  bowls: 'assets/icons/bowls.svg',
  lids: 'assets/icons/lids.svg',
  'bowl.full': 'assets/icons/bowl-full.svg',
  'bowl.empty': 'assets/icons/bowl-empty.svg',
  'badge.perfectDay': 'assets/icons/badge-day.svg',
  'badge.perfectRegister': 'assets/icons/badge-register.svg',
  'badge.neverRanOut': 'assets/icons/badge-bowl.svg',
  'badge.empty': 'assets/icons/badge-empty.svg',
};

// The picture (or pictures) for each job.
export const JOB_ICONS = {
  cashier: ['register'],
  manager: ['ticket'],
  topping: ['batch'],
  tea: ['drink'],
  maker: ['batch', 'drink'],
  front: ['register', 'ticket'],
};

// Characters. `face` says where the app draws eyes and a mouth on the
// picture: x and y of the face centre and its width, as fractions of the
// picture's width and height. `voice` tunes the built-in device voice.
// `clips` will hold recorded voice files (milestone 4); null means the
// device voice speaks the line.
export const BOSS = {
  id: 'boss',
  body: 'assets/characters/boss.svg',
  face: { x: 0.5, y: 0.40, w: 0.40 },
  color: '#6fcf97',
  voice: { pitch: 1.0, rate: 0.95 },
  clips: {},
};

export const CUSTOMERS = [
  {
    id: 'mochi',
    body: 'assets/characters/mochi.svg',
    face: { x: 0.5, y: 0.37, w: 0.42 },
    color: '#f4c27f',
    voice: { pitch: 1.6, rate: 1.0 },
    clips: { greet: null, happy: null },
  },
  {
    id: 'bao',
    body: 'assets/characters/bao.svg',
    face: { x: 0.5, y: 0.37, w: 0.42 },
    color: '#a8744f',
    voice: { pitch: 0.7, rate: 0.9 },
    clips: { greet: null, happy: null },
  },
  {
    id: 'taro',
    body: 'assets/characters/taro.svg',
    face: { x: 0.5, y: 0.37, w: 0.42 },
    color: '#9a7bd0',
    voice: { pitch: 1.25, rate: 1.05 },
    clips: { greet: null, happy: null },
  },
];

// Sound effects. null means the app plays its own built-in sound.
// Put a path to an audio file here to replace one.
export const SOUNDS = {
  tap: null,
  door: null,
  drawer: null,
  coin: null,
  bell: null,
  hmm: null,
  aww: null,
  sunset: null,
  hop: null,
  fanfare: null,
  song: null,
};

export const APP_ICON = 'assets/app/icon-512.png';
