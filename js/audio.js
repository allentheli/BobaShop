// Sound effects and the spoken voice.
// iPad Safari plays nothing until the first tap, so unlock() must be called
// from inside the Start button's tap.

import { SOUNDS } from './assets.js';

let ctx = null;
let master = null;
let volume = 0.8;
let voiceOn = true;
let muted = false;
const files = {};
let chosenVoice = null;

export function configureSound({ volume: v, voice }) {
  if (typeof v === 'number') volume = v;
  if (typeof voice === 'boolean') voiceOn = voice;
  if (master) master.gain.value = volume;
}

export function setMuted(m) { muted = m; if (m) stopSpeaking(); }

export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = volume;
        master.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    // A silent blip inside the tap unlocks Web Audio on iOS.
    if (ctx) {
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(master); s.start(0);
    }
  } catch (e) { /* no sound is fine */ }
  // Speaking once inside a tap unlocks speech on iOS.
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  } catch (e) { /* ignore */ }
  for (const [id, path] of Object.entries(SOUNDS)) {
    if (path && !files[id]) { files[id] = new Audio(path); files[id].preload = 'auto'; }
  }
  pickVoice();
}

// Keep sound working when the iPad comes back from the lock screen.
export function resume() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const choose = () => {
    const voices = speechSynthesis.getVoices();
    const en = voices.filter((v) => /^en/i.test(v.lang));
    const pref = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Daniel'];
    chosenVoice = pref.map((n) => en.find((v) => v.name.includes(n))).find(Boolean)
      || en.find((v) => v.localService) || en[0] || null;
  };
  choose();
  if (!chosenVoice) speechSynthesis.onvoiceschanged = choose;
}

// --- Speech -----------------------------------------------------------

const queue = [];
let speaking = false;

// Speak a line. Returns a promise that resolves when it is done (or a time
// limit runs out, because iPad Safari sometimes never reports the end).
export function speak(text, { pitch = 1, rate = 1, onStart, onEnd, interrupt = false } = {}) {
  return new Promise((resolve) => {
    const done = () => { onEnd && onEnd(); resolve(); };
    if (!text || muted || !voiceOn || !('speechSynthesis' in window)) {
      onStart && onStart();
      setTimeout(done, Math.min(2500, 300 + text.length * 45));
      return;
    }
    if (interrupt) { queue.length = 0; speechSynthesis.cancel(); speaking = false; }
    queue.push({ text, pitch, rate, onStart, done });
    pump();
  });
}

function pump() {
  if (speaking || queue.length === 0) return;
  const item = queue.shift();
  speaking = true;
  const u = new SpeechSynthesisUtterance(item.text);
  if (chosenVoice) u.voice = chosenVoice;
  u.lang = chosenVoice ? chosenVoice.lang : 'en-US';
  u.pitch = item.pitch;
  u.rate = item.rate;
  u.volume = Math.max(0.1, volume);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    speaking = false;
    item.done();
    pump();
  };
  const guard = setTimeout(finish, 1500 + item.text.length * 110);
  u.onstart = () => item.onStart && item.onStart();
  u.onend = finish;
  u.onerror = finish;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  queue.length = 0;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  speaking = false;
}

// --- Sound effects ------------------------------------------------------

export function play(id) {
  if (muted) return;
  if (files[id]) {
    try { files[id].currentTime = 0; files[id].volume = volume; files[id].play(); } catch (e) { /* ignore */ }
    return;
  }
  if (!ctx) return;
  const fx = SYNTH[id];
  if (fx) fx(ctx.currentTime);
}

function tone(t, freq, dur, { type = 'sine', gain = 0.3, slideTo = null, attack = 0.005 } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

const SYNTH = {
  tap: (t) => tone(t, 660, 0.08, { type: 'triangle', gain: 0.15 }),
  door: (t) => { tone(t, 1318, 0.5, { gain: 0.15 }); tone(t + 0.15, 1046, 0.7, { gain: 0.15 }); },
  coin: (t) => { tone(t, 988, 0.08, { type: 'square', gain: 0.08 }); tone(t + 0.07, 1319, 0.3, { type: 'square', gain: 0.08 }); },
  drawer: (t) => {
    tone(t, 220, 0.12, { type: 'triangle', gain: 0.25, slideTo: 120 });
    tone(t + 0.12, 1568, 0.5, { gain: 0.2 });
    tone(t + 0.12, 2093, 0.6, { gain: 0.12 });
  },
  bell: (t) => { tone(t, 2093, 1.2, { gain: 0.25 }); tone(t, 3136, 0.8, { gain: 0.08 }); },
  hmm: (t) => { tone(t, 330, 0.18, { type: 'triangle', gain: 0.2 }); tone(t + 0.2, 262, 0.3, { type: 'triangle', gain: 0.2 }); },
  aww: (t) => { tone(t, 523, 0.25, { type: 'triangle', gain: 0.16, slideTo: 440 }); tone(t + 0.25, 440, 0.45, { type: 'triangle', gain: 0.16, slideTo: 330 }); },
  sunset: (t) => [784, 659, 523, 392].forEach((f, i) => tone(t + i * 0.22, f, 0.5, { type: 'triangle', gain: 0.18 })),
  hop: (t) => tone(t, 400, 0.18, { type: 'sine', gain: 0.2, slideTo: 900 }),
  // The cleanup song: a short bouncy tune, played twice.
  song: (t) => {
    const n = { C: 523, D: 587, E: 659, F: 698, G: 784, A: 880, c: 1046 };
    const tune = 'G-E-G-E-C-D-E---G-E-G-E-c-A-G---F-F-E-E-D-D-C---';
    let i = 0;
    for (let rep = 0; rep < 2; rep++) {
      for (let k = 0; k < tune.length; k += 2) {
        const ch = tune[k];
        if (ch !== '-') tone(t + i * 0.2, n[ch], 0.3, { type: 'triangle', gain: 0.16 });
        i++;
      }
    }
  },
  fanfare: (t) => [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.14, f, i === 3 ? 0.8 : 0.2, { type: 'triangle', gain: 0.2 })),
};
