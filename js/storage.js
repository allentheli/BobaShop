// Saving on the device. Everything lives in one record in localStorage.
// Pictures and voice recordings (milestone 4) will go in IndexedDB instead.
//
// The record:
//   settings     parent settings that override js/config.js (milestone 3)
//   savings      the savings jar, carried between days (spent in milestone 5)
//   totalStars   stars earned over all days (unlock toppings and customers)
//   days         how many days have been played
//   history      a short summary of each finished day
//   decorations  owned and chosen decorations (milestone 5)
//   unlocks      unlocked toppings and customers
//   rotation     last jobs for each player count, and the last decorator
//   day          the day in progress, or null

const KEY = 'bobashop.save.v1';
export const SAVE_VERSION = 1;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    settings: {},
    savings: 0,
    totalStars: 0,
    days: 0,
    history: [],
    decorations: { owned: [], chosen: {} },
    unlocks: [],
    rotation: { byCount: {}, lastDecorator: null },
    day: null,
  };
}

function store() {
  try { return globalThis.localStorage || null; } catch (e) { return null; }
}

export function loadSave(storage = store()) {
  const base = defaultSave();
  if (!storage) return base;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return base;
    return { ...base, ...data, rotation: { ...base.rotation, ...(data.rotation || {}) }, decorations: { ...base.decorations, ...(data.decorations || {}) } };
  } catch (e) {
    return base;
  }
}

export function writeSave(save, storage = store()) {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch (e) {
    return false;
  }
}
