// Shop music, chosen by the cashier (or the manager) on the shop radio.
//
// Each song is written as notes and played by the app itself, so it works
// offline and costs nothing. To use a recorded song instead, set `file` to
// an audio file path (for example 'assets/music/sunny.mp3').
//
// Notes are written like C5 or F#4 or Bb2, one per eighth note in `lead`
// (four bars of eight, split by |), one per quarter note in `bass`.
// "-" is a rest. Drum lines have one character per eighth note in a bar:
// x = hit, - = nothing.

import { audioOut, onTalking, isMuted, onMuteChange } from './audio.js';

export const SONGS = [
  {
    id: 'bubbly', icon: 'music.bubbly', bpm: 118, lead: 'square', file: null,
    notes: 'E5 G5 C6 G5 E5 - D5 E5 | F5 A5 C6 A5 F5 - E5 F5 | G5 - E5 - C5 D5 E5 G5 | F5 E5 D5 - C5 - - -',
    bass: 'C3 G3 C3 G3 | F3 C4 F3 C4 | C3 G3 A3 E3 | F3 G3 C3 -',
    kick: 'x---x---', snare: '--x---x-', hat: 'xxxxxxxx',
  },
  {
    id: 'sunny', icon: 'music.sunny', bpm: 104, lead: 'triangle', file: null,
    notes: 'D5 - G5 - B5 A5 G5 - | E5 - G5 - A5 G5 E5 - | D5 - G5 - B5 - D6 - | C6 B5 A5 - G5 - - -',
    bass: 'G2 D3 G2 D3 | C3 G3 C3 G3 | G2 D3 E3 B2 | C3 D3 G2 -',
    kick: 'x--x-x--', snare: '--x---x-', hat: 'x-x-x-x-',
  },
  {
    id: 'rainy', icon: 'music.rainy', bpm: 78, lead: 'sine', file: null,
    notes: 'A4 - C5 - - - A4 G4 | F4 - - - G4 - A4 - | C5 - D5 - C5 - A4 - | G4 - - - F4 - - -',
    bass: 'F2 - C3 - | D2 - A2 - | Bb2 - F2 - | C3 - F2 -',
    kick: 'x-----x-', snare: '----x---', hat: '--x---x-',
  },
  {
    id: 'dragon', icon: 'music.dragon', bpm: 138, lead: 'square', file: null,
    notes: 'A4 C5 E5 A5 G5 E5 C5 E5 | F5 E5 D5 C5 B4 C5 D5 - | A4 C5 E5 A5 B5 A5 G5 E5 | F5 D5 B4 G#4 A4 - - -',
    bass: 'A2 A2 A2 A2 | F2 F2 G2 G2 | A2 A2 C3 C3 | E2 E2 A2 -',
    kick: 'x-x-x-x-', snare: '--x---x-', hat: 'xxxxxxxx',
  },
];

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteFreq(token) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(token);
  if (!m) return null;
  const semis = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semis - 69) / 12);
}

// Turns a song into steps (one per eighth note): { lead, bass, kick, snare, hat }.
export function songSteps(song) {
  const lead = song.notes.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
  const bassQ = song.bass.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
  return lead.map((n, i) => ({
    lead: n === '-' ? null : noteFreq(n),
    bass: i % 2 === 0 && bassQ[i / 2] && bassQ[i / 2] !== '-' ? noteFreq(bassQ[i / 2]) : null,
    kick: song.kick[i % 8] === 'x',
    snare: song.snare[i % 8] === 'x',
    hat: song.hat[i % 8] === 'x',
  }));
}

// ---- The player ----------------------------------------------------------

let current = null;      // { song, steps, step, nextTime, timer, gain, el }
let volume = 0.6;
let enabled = true;
let speed = 1;
let ducked = false;
let noise = null;

onTalking((on) => { ducked = on; applyGain(); });
onMuteChange(() => applyGain());

export function configureMusic({ volume: v, on }) {
  if (typeof v === 'number') volume = v;
  if (typeof on === 'boolean') enabled = on;
  if (!enabled) stopMusic();
  applyGain();
}

function level() {
  if (!enabled || isMuted()) return 0;
  return volume * 0.32 * (ducked ? 0.3 : 1);
}

function applyGain() {
  if (!current) return;
  if (current.el) current.el.volume = Math.min(1, level() * 2);
  const out = audioOut();
  if (current.gain && out) current.gain.gain.setTargetAtTime(level(), out.ctx.currentTime, 0.15);
}

// The music gets a little faster as the sun sets (k from 1 up).
export function setMusicSpeed(k) { speed = k; }

export function playMusic(id) {
  const song = SONGS.find((s) => s.id === id);
  if (current && current.song === song) return;
  stopMusic();
  if (!song || !enabled) return;
  if (song.file) {
    const el = new Audio(song.file);
    el.loop = true;
    current = { song, el };
    applyGain();
    el.play().catch(() => {});
    return;
  }
  const out = audioOut();
  if (!out) return;
  const gain = out.ctx.createGain();
  gain.gain.value = 0;
  gain.connect(out.master);
  current = { song, steps: songSteps(song), step: 0, nextTime: out.ctx.currentTime + 0.1, gain };
  applyGain();
  current.timer = setInterval(() => schedule(out.ctx), 50);
  schedule(out.ctx);
}

export function stopMusic() {
  if (!current) return;
  if (current.el) current.el.pause();
  if (current.timer) clearInterval(current.timer);
  if (current.gain) {
    const out = audioOut();
    if (out) current.gain.gain.setTargetAtTime(0, out.ctx.currentTime, 0.08);
    const g = current.gain;
    setTimeout(() => g.disconnect(), 600);
  }
  current = null;
}

export function currentSong() { return current ? current.song.id : null; }

function schedule(ctx) {
  const c = current;
  if (!c || !c.steps) return;
  // After a stall (the iPad was busy), skip the missed notes instead of
  // playing them all at once.
  if (c.nextTime < ctx.currentTime - 0.1) c.nextTime = ctx.currentTime + 0.05;
  while (c.nextTime < ctx.currentTime + 0.2) {
    const stepLen = 60 / c.song.bpm / 2 / speed;
    playStep(ctx, c, c.steps[c.step], c.nextTime, stepLen);
    c.step = (c.step + 1) % c.steps.length;
    c.nextTime += stepLen;
  }
}

function playStep(ctx, c, s, t, len) {
  const out = c.gain;
  if (s.lead) note(ctx, out, s.lead, t, len * 0.9, c.song.lead, 0.22);
  if (s.bass) note(ctx, out, s.bass, t, len * 1.8, 'triangle', 0.3);
  if (s.kick) kick(ctx, out, t);
  if (s.snare) hiss(ctx, out, t, 0.12, 1800, 0.18);
  if (s.hat) hiss(ctx, out, t, 0.04, 7000, 0.06);
}

function note(ctx, out, f, t, dur, type, gain) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(type === 'square' ? gain * 0.45 : gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out);
  o.onended = () => { o.disconnect(); g.disconnect(); };
  o.start(t); o.stop(t + dur + 0.05);
}

function kick(ctx, out, t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(out);
  o.onended = () => { o.disconnect(); g.disconnect(); };
  o.start(t); o.stop(t + 0.2);
}

function hiss(ctx, out, t, dur, freq, gain) {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = freq > 4000 ? 'highpass' : 'bandpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(out);
  src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); };
  src.start(t); src.stop(t + dur + 0.02);
}
