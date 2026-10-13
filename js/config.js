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

  prices: { base: 3, small: 3, large: 5, fresh: 1 },

  // Tip by seconds since the order was rung up.
  tips: [
    { within: 75, coins: 2 },
    { within: 150, coins: 1 },
  ],

  inspection: { drinks: 3, bonus: 1 },
  starGoals: [10, 18, 26],

  patience: {
    impatientAfter: 45,      // a customer in line starts tapping a foot
    leaveAfter: 100,         // only used when waitingCustomersLeave is on
    waitingSpotImpatientAfter: 150,
  },
  waitingCustomersLeave: false,

  level: 1,                  // order level, 1 to 7
  registerMode: 'easy',      // easy | medium | hard
  callMode: 'normal',        // easy | normal | hard

  sound: { volume: 0.8, voice: true },

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
