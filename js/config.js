// Every tunable number lives here. All values are starting guesses to be
// tuned after playtesting. Times are in seconds, money is in coins.

export const CONFIG = {
  shiftLength: 300,          // 5 minutes
  cups: { small: 6, large: 6 },
  drinksInProgress: 2,       // waiting spots
  lineLength: 3,             // customers waiting at the door
  longLine: 5,               // the line at order level 7
  arrivalEvery: 35,          // seconds between new customers
  firstArrivalAt: 2,         // the first customer walks in right after opening

  // base = a drink with no size (level 1). extra = extra topping,
  // fresh = fresh topping, brew = freshly brewed tea; each adds to the price.
  prices: { base: 3, small: 3, large: 5, extra: 1, fresh: 1, brew: 1 },

  // Tip by seconds since the order was rung up.
  tips: [
    { within: 75, coins: 2 },
    { within: 150, coins: 1 },
  ],

  inspection: { drinks: 3, bonus: 1 },
  starGoals: [10, 18, 26],

  // How long customers wait, in seconds. A patience bar over their heads
  // shrinks as they wait. Only when `customersLeave` is on do they leave.
  patience: {
    lineWarn: 45,            // in line: the bar turns yellow and a foot taps
    lineLeave: 100,          // in line: they leave (they have not paid yet)
    waitWarn: 120,           // in a waiting spot, after paying
    waitLeave: 180,          // in a waiting spot: they leave and get their money back
  },
  customersLeave: true,
  patienceBar: true,

  // How busy the shop gets. 'busy' and 'chaos' change the arrivals and
  // limits below; in chaos there is no limit on customers waiting.
  crowd: 'normal',
  crowds: {
    normal: {},
    busy: { arrivalEvery: 22, lineLength: 5, longLine: 6, drinksInProgress: 3 },
    chaos: { arrivalEvery: 12, firstArrivalAt: 1, lineLength: 99, longLine: 99, drinksInProgress: 99 },
  },

  payCoins: [5, 10, 20],     // coins a customer pays with on the hard register

  // Before the shift: 'full' (meet the boss, jobs, how-to cards, checklists),
  // 'jobs' (no how-to cards) or 'skip' (straight to the shop).
  setup: 'full',

  level: 1,                  // order level, 1 to 8
  registerMode: 'easy',      // easy | medium | hard
  callMode: 'normal',        // easy | normal | hard

  sound: { volume: 0.8, voice: true },
  music: { on: true, volume: 0.6, song: 'bubbly' },   // song: the first day's pick

  // Timings for the on-screen show, in real seconds.
  anim: {
    walk: 1.1,
    servedStay: 2.6,
    registerWrongPause: 0.6,
  },

  hintWeight: 2,             // how much more often the boss's hint item is ordered
  jobLocks: {},              // { apronId: jobId } set by a parent (milestone 3)

  demo: { speed: 8 },
};
