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
let speechLang = 'en';

// The voice for each language: the first of `names` the iPad has, then any
// voice whose language matches `langs` (in that order).
const VOICES = {
  en: { names: ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Daniel'], langs: [/^en[-_]US/i, /^en/i], fallback: 'en-US' },
  // Mandarin as spoken in Taiwan (Meijia on iPad); a mainland Mandarin voice
  // if that is missing. Never Cantonese (zh-HK).
  zh: { names: ['Meijia', 'Mei-Jia', '美佳', 'Google 國語'], langs: [/^zh[-_]TW/i, /^zh[-_]Hant/i, /^zh[-_]CN/i, /^cmn/i], fallback: 'zh-TW' },
};

export function setSpeechLanguage(l) {
  if (!VOICES[l] || l === speechLang) return;
  speechLang = l;
  stopSpeaking();
  chosenVoice = null;
  pickVoice();
}

// Roughly how long a line takes to say, in milliseconds per character:
// a Chinese character takes about as long as a short English word.
const CJK = /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/g;
function speechLength(text, perLetter) {
  const cjk = (text.match(CJK) || []).length;
  return (text.length - cjk) * perLetter + cjk * perLetter * 3;
}

export function configureSound({ volume: v, voice }) {
  if (typeof v === 'number') volume = v;
  if (typeof voice === 'boolean') voiceOn = voice;
  if (master) master.gain.value = volume;
}

export function setMuted(m) { muted = m; if (m) stopSpeaking(); muteListeners.forEach((f) => f(m)); }
export function isMuted() { return muted; }
const muteListeners = [];
export function onMuteChange(f) { muteListeners.push(f); }

// For the music player (js/music.js): the shared audio context, and a way
// to hear when someone starts or stops talking, so the music can get quieter.
export function audioOut() { return ctx ? { ctx, master } : null; }
const talkListeners = [];
export function onTalking(f) { talkListeners.push(f); }
function setTalkingState(on) {
  talkListeners.forEach((f) => f(on));
  if (!on) keepSoundAwake();
}

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
    if (ctx && ctx.state !== 'running') ctx.resume();
    // Play through the iPad's silent switch, like a game (where supported).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iPad */ }
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

// Keep sound working after the iPad was locked, a call came in, or Siri
// spoke. Called when the app comes back and on every tap.
export function resume() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

// The iPad can pause the app's sound by itself (the screen was locked, a
// call, Siri, another app's sound). While music is on, js/music.js calls
// this often; it tries to start the sound again, at most once a second.
let lastWake = 0;
export function keepSoundAwake() {
  if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
  const now = performance.now();
  if (now - lastWake < 1000) return;
  lastWake = now;
  ctx.resume().catch(() => {});
}

// iPad Safari can leave speech stuck after the screen was locked.
export function resetSpeech() {
  stopSpeaking();
  pickVoice();
}

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const choose = () => {
    const want = VOICES[speechLang];
    const voices = speechSynthesis.getVoices();
    const matching = (re) => voices.filter((v) => re.test(v.lang));
    const all = want.langs.flatMap(matching);
    chosenVoice = want.names.map((n) => all.find((v) => v.name.includes(n))).find(Boolean)
      || all.find((v) => v.localService) || all[0] || null;
  };
  choose();
  if (!chosenVoice) speechSynthesis.onvoiceschanged = choose;
}

// --- Speech -----------------------------------------------------------

const queue = [];
let speaking = false;
let current = null;   // the line being spoken: { item, finish }

// Speak a line. Returns a promise that always resolves: when the line is
// done, when it is cut off by stopSpeaking(), or when a time limit runs out
// (iPad Safari sometimes never reports the end). Anything waiting on a line
// therefore never hangs.
export function speak(text, { pitch = 1, rate = 1, onStart, onEnd, interrupt = false } = {}) {
  return new Promise((resolve) => {
    let resolved = false;
    const done = () => { if (resolved) return; resolved = true; onEnd && onEnd(); resolve(); };
    if (!text || muted || !voiceOn || !('speechSynthesis' in window)) {
      onStart && onStart();
      setTimeout(done, text ? Math.min(2500, 300 + speechLength(text, 45)) : 0);
      return;
    }
    if (interrupt) stopSpeaking();
    queue.push({ text, pitch, rate, onStart, done });
    pump();
  });
}

function pump() {
  if (speaking || queue.length === 0) return;
  const item = queue.shift();
  speaking = true;
  setTalkingState(true);
  if (!chosenVoice) pickVoice();
  const u = new SpeechSynthesisUtterance(item.text);
  if (chosenVoice) u.voice = chosenVoice;
  u.lang = chosenVoice ? chosenVoice.lang : VOICES[speechLang].fallback;
  u.pitch = item.pitch;
  u.rate = item.rate;
  u.volume = Math.max(0.1, volume);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    // Ignore late reports from a line that was already cut off.
    if (current && current.item === item) { current = null; speaking = false; }
    if (queue.length === 0 && !speaking) setTalkingState(false);
    item.done();
    pump();
  };
  current = { item, finish };
  const guard = setTimeout(finish, 1500 + speechLength(item.text, 110));
  u.onstart = () => { if (!finished && item.onStart) item.onStart(); };
  u.onend = finish;
  u.onerror = finish;
  speechSynthesis.speak(u);
}

// Stop all talking now. Every line that was waiting is finished (not
// dropped), so nothing that was waiting for it gets stuck.
export function stopSpeaking() {
  const waiting = queue.splice(0);
  const was = current;
  current = null;
  speaking = false;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (was) was.finish();
  waiting.forEach((i) => i.done());
  setTalkingState(false);
}

// --- Sound effects ------------------------------------------------------

export function play(id) {
  if (muted) return;
  if (files[id]) {
    try { files[id].currentTime = 0; files[id].volume = volume; files[id].play(); } catch (e) { /* ignore */ }
    return;
  }
  // While the iPad has the sound paused (a call, Siri), skip effects
  // instead of letting them all play at once later.
  if (!ctx || ctx.state !== 'running') return;
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
  o.onended = () => { o.disconnect(); g.disconnect(); };
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
