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
  // Shop radio (songs are in js/music.js).
  radio: 'assets/icons/radio.svg',
  'music.bubbly': 'assets/icons/music-bubbly.svg',
  'music.sunny': 'assets/icons/music-sunny.svg',
  'music.rainy': 'assets/icons/music-rainy.svg',
  'music.dragon': 'assets/icons/music-dragon.svg',
  'music.off': 'assets/icons/music-off.svg',
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

// Customers. Besides `face`, each has `head` (where a hat sits: the top
// middle of the head and the head's width) and `neck` (where a bow tie or
// scarf goes), as fractions of the picture. `hues` are fur colors a visitor
// may have (degrees of color shift; 0 is the drawing's own color).
// Names and voices make each visitor different: names are in js/strings.js.
const ANCHORS = { head: { x: 0.5, y: 0.12, w: 0.64 }, neck: { x: 0.5, y: 0.6, w: 0.6 } };

export const CUSTOMERS = [
  {
    id: 'mochi', body: 'assets/characters/mochi.svg', color: '#f4c27f',
    face: { x: 0.5, y: 0.37, w: 0.42 }, ...ANCHORS, hues: [0, 0, 160, 300],
    voice: { pitch: 1.6, rate: 1.0 }, clips: { greet: null, happy: null },
  },
  {
    id: 'bao', body: 'assets/characters/bao.svg', color: '#a8744f',
    face: { x: 0.5, y: 0.37, w: 0.42 }, ...ANCHORS, head: { x: 0.5, y: 0.11, w: 0.66 }, hues: [0, 0, 330, 20],
    voice: { pitch: 0.7, rate: 0.9 }, clips: { greet: null, happy: null },
  },
  {
    id: 'taro', body: 'assets/characters/taro.svg', color: '#9a7bd0',
    face: { x: 0.5, y: 0.37, w: 0.42 }, ...ANCHORS, hues: [0, 0, 120, 200],
    voice: { pitch: 1.25, rate: 1.05 }, clips: { greet: null, happy: null },
  },
  {
    id: 'momo', body: 'assets/characters/momo.svg', color: '#fdf6f0',
    face: { x: 0.5, y: 0.38, w: 0.42 }, ...ANCHORS, head: { x: 0.5, y: 0.135, w: 0.5 }, hues: [0],
    voice: { pitch: 1.8, rate: 1.1 }, clips: { greet: null, happy: null },
  },
  {
    id: 'dumpling', body: 'assets/characters/dumpling.svg', color: '#fbfbf6',
    face: { x: 0.5, y: 0.37, w: 0.42 }, ...ANCHORS, head: { x: 0.5, y: 0.11, w: 0.66 }, hues: [0],
    voice: { pitch: 0.9, rate: 0.85 }, clips: { greet: null, happy: null },
  },
  {
    id: 'hop', body: 'assets/characters/hop.svg', color: '#8fd17a',
    face: { x: 0.5, y: 0.4, w: 0.42 }, ...ANCHORS, head: { x: 0.5, y: 0.16, w: 0.5 }, hues: [0, 0, 60, 190],
    voice: { pitch: 1.4, rate: 1.15 }, clips: { greet: null, happy: null },
  },
  {
    id: 'pebble', body: 'assets/characters/pebble.svg', color: '#3d4a6b',
    face: { x: 0.5, y: 0.37, w: 0.4 }, ...ANCHORS, hues: [0, 0, 300],
    voice: { pitch: 1.5, rate: 0.95 }, clips: { greet: null, happy: null },
  },
];

// Things a visitor may wear. `slot`: head (sits on top of the head), eyes
// (drawn over the face), or neck. `w` is the size as a share of the head's
// width, `dy` moves it down onto the head, `dx` to one side.
export const ACCESSORIES = {
  crown: { slot: 'head', file: 'assets/accessories/crown.svg', w: 0.55 },
  party: { slot: 'head', file: 'assets/accessories/party.svg', w: 0.5 },
  flower: { slot: 'head', file: 'assets/accessories/flower.svg', w: 0.4, dx: 0.12, dy: 0.04 },
  bow: { slot: 'head', file: 'assets/accessories/bow.svg', w: 0.5, dy: 0.02 },
  beanie: { slot: 'head', file: 'assets/accessories/beanie.svg', w: 0.95, dy: 0.15 },
  cap: { slot: 'head', file: 'assets/accessories/cap.svg', w: 0.9, dy: 0.13 },
  roundGlasses: { slot: 'eyes', file: 'assets/accessories/glasses-round.svg' },
  sunglasses: { slot: 'eyes', file: 'assets/accessories/glasses-sun.svg' },
  heartGlasses: { slot: 'eyes', file: 'assets/accessories/glasses-heart.svg' },
  bowtie: { slot: 'neck', file: 'assets/accessories/bowtie.svg', w: 0.45 },
  scarf: { slot: 'neck', file: 'assets/accessories/scarf.svg', w: 0.9 },
};

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
