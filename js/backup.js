// Backups: the whole shop (settings, savings jar, stars, history,
// decorations, the day in progress) as a file or a text code, so it can be
// kept safe or moved to another iPad. Nothing is sent anywhere by the app.

import { defaultSave, SAVE_VERSION } from './storage.js';

const TAG = 'boba-shop-backup';
const CODE_PREFIX = 'BOBA1:';

export function makeBackup(save, now = new Date()) {
  return { app: TAG, version: SAVE_VERSION, createdAt: now.toISOString(), save };
}

export function backupFileName(now = new Date()) {
  return `boba-shop-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function backupText(save, now = new Date()) {
  return JSON.stringify(makeBackup(save, now), null, 1);
}

// A shorter text code (for pasting into a note or a message).
export function backupCode(save, now = new Date()) {
  const json = JSON.stringify(makeBackup(save, now));
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return CODE_PREFIX + btoa(bin);
}

// Reads a backup file's text or a code. Returns { ok, save, createdAt } or
// { ok: false, why }. The save is filled in with defaults, so backups from
// older versions of the app still load.
export function readBackup(text) {
  let data;
  try {
    const t = String(text || '').trim();
    if (t.startsWith(CODE_PREFIX)) {
      const bin = atob(t.slice(CODE_PREFIX.length).replace(/\s+/g, ''));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      data = JSON.parse(new TextDecoder().decode(bytes));
    } else {
      data = JSON.parse(t);
    }
  } catch (e) {
    return { ok: false, why: 'unreadable' };
  }
  if (!data || data.app !== TAG || !data.save || typeof data.save !== 'object') return { ok: false, why: 'notBackup' };
  const base = defaultSave();
  const s = data.save;
  const save = {
    ...base,
    ...s,
    rotation: { ...base.rotation, ...(s.rotation || {}) },
    decorations: { ...base.decorations, ...(s.decorations || {}) },
    settings: s.settings && typeof s.settings === 'object' ? s.settings : {},
    savings: Number.isFinite(s.savings) ? Math.max(0, s.savings) : 0,
    history: Array.isArray(s.history) ? s.history : [],
  };
  return { ok: true, save, createdAt: data.createdAt || null };
}

// A short summary for the "load this backup?" question.
export function backupSummary(save) {
  return {
    days: save.days || 0,
    savings: save.savings || 0,
    stars: save.totalStars || 0,
    decorations: (save.decorations && save.decorations.owned ? save.decorations.owned.length : 0),
    dayInProgress: !!save.day,
  };
}
