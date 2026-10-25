/* Sounds, all made in code with Web Audio, so there are no sound files to ship yet.
   The palette is a temple's: bells, a singing bowl, a gong, wood knocks, a blade swish, a low drum.
   Real recorded sounds or music can replace any of these later by name (see play()). */
import { getSettings } from './settings';

export type Sfx =
  | 'tap' | 'draw' | 'card' | 'hit' | 'bigHit' | 'block' | 'heal' | 'burn' | 'status'
  | 'yoga' | 'turn' | 'enemyTurn' | 'win' | 'lose' | 'buy' | 'upgrade' | 'death';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
  return ctx;
}

/* Phones only allow sound after a touch, so wake the audio on the first one. */
export function unlockAudio(): void {
  const wake = () => { const c = audio(); if (c && c.state === 'suspended') void c.resume(); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(e => window.addEventListener(e, wake, { passive: true }));
}

type Tone = { f: number; type?: OscillatorType; at?: number; dur: number; vol: number; to?: number; attack?: number };
function tone(c: AudioContext, t0: number, o: Tone) {
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type ?? 'sine';
  const s = t0 + (o.at ?? 0);
  osc.frequency.setValueAtTime(o.f, s);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, s + o.dur);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(o.vol, s + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, s + o.dur);
  osc.connect(g).connect(master!);
  osc.start(s); osc.stop(s + o.dur + 0.05);
}

type Noise = { at?: number; dur: number; vol: number; freq: number; q?: number; to?: number; kind?: BiquadFilterType; attack?: number };
function noise(c: AudioContext, t0: number, o: Noise) {
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = o.kind ?? 'bandpass'; f.Q.value = o.q ?? 1;
  const s = t0 + (o.at ?? 0);
  f.frequency.setValueAtTime(o.freq, s);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, s + o.dur);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(o.vol, s + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, s + o.dur);
  src.connect(f).connect(g).connect(master!);
  src.start(s, Math.random() * 0.5); src.stop(s + o.dur + 0.05);
}

/* A bell: a few inharmonic partials that ring and fade. */
function bell(c: AudioContext, t0: number, f: number, vol: number, dur = 1.6, at = 0) {
  [[1, 1], [2.76, 0.45], [5.4, 0.2], [8.93, 0.08]].forEach(([m, v]) =>
    tone(c, t0, { f: f * m, at, dur: dur / Math.sqrt(m), vol: vol * v, attack: 0.003 }));
}

let lastAt: Partial<Record<Sfx, number>> = {};

export function sfx(kind: Sfx): void {
  if (!getSettings().sound) return;
  const c = audio();
  if (!c || !master) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime + 0.01;
  // don't stack the same sound many times in one instant
  if ((lastAt[kind] ?? -1) > t - 0.04) return;
  lastAt[kind] = t;
  const r = 0.94 + Math.random() * 0.12; // a little variation so repeats don't feel mechanical

  switch (kind) {
    case 'tap': tone(c, t, { f: 900 * r, type: 'triangle', dur: 0.06, vol: 0.12 }); break;
    case 'draw': noise(c, t, { dur: 0.09, vol: 0.12, freq: 2800 * r, q: 0.8, to: 4200 }); break;
    case 'card':
      noise(c, t, { dur: 0.16, vol: 0.22, freq: 900 * r, q: 0.7, to: 3800, attack: 0.03 });
      break;
    case 'hit':
      tone(c, t, { f: 150 * r, type: 'sine', dur: 0.18, vol: 0.55, to: 55 });
      noise(c, t, { dur: 0.08, vol: 0.3, freq: 1800, q: 0.6 });
      break;
    case 'bigHit':
      tone(c, t, { f: 110 * r, type: 'sine', dur: 0.4, vol: 0.8, to: 38 });
      tone(c, t, { f: 220 * r, type: 'triangle', dur: 0.15, vol: 0.2, to: 80 });
      noise(c, t, { dur: 0.22, vol: 0.45, freq: 1200, q: 0.5, to: 300 });
      break;
    case 'block':
      // a knock on wood
      tone(c, t, { f: 520 * r, type: 'triangle', dur: 0.09, vol: 0.35, to: 380 });
      tone(c, t, { f: 1240 * r, type: 'sine', dur: 0.05, vol: 0.12 });
      noise(c, t, { dur: 0.04, vol: 0.15, freq: 3000, q: 2 });
      break;
    case 'heal':
      bell(c, t, 880 * r, 0.16, 1.2);
      bell(c, t, 1320 * r, 0.1, 1.0, 0.09);
      break;
    case 'burn':
      for (let i = 0; i < 5; i++) noise(c, t, { at: i * 0.045 + Math.random() * 0.02, dur: 0.05, vol: 0.18, freq: 2500 + Math.random() * 2500, q: 3 });
      noise(c, t, { dur: 0.35, vol: 0.08, freq: 600, q: 0.5, kind: 'lowpass' });
      break;
    case 'status':
      tone(c, t, { f: 330 * r, type: 'triangle', dur: 0.3, vol: 0.14, to: 260 });
      tone(c, t, { f: 495 * r, type: 'sine', dur: 0.25, vol: 0.08, at: 0.04, to: 390 });
      break;
    case 'yoga':
      // a singing bowl: two close tones that beat slowly, with a soft strike
      [[196, 0.22], [198.5, 0.22], [392 * 1.003, 0.09], [588, 0.05]].forEach(([f, v]) =>
        tone(c, t, { f: f * r, dur: 3.2, vol: v, attack: 0.02 }));
      bell(c, t, 784 * r, 0.08, 1.5);
      break;
    case 'turn':
      // a small gong for your turn
      tone(c, t, { f: 98, dur: 1.6, vol: 0.28, attack: 0.01 });
      tone(c, t, { f: 147.5, dur: 1.2, vol: 0.12, attack: 0.01 });
      tone(c, t, { f: 231, dur: 0.8, vol: 0.06, attack: 0.01 });
      noise(c, t, { dur: 0.25, vol: 0.06, freq: 400, q: 0.7 });
      break;
    case 'enemyTurn':
      // a low drum
      tone(c, t, { f: 70, dur: 0.35, vol: 0.5, to: 45 });
      tone(c, t, { f: 70, at: 0.16, dur: 0.3, vol: 0.32, to: 45 });
      break;
    case 'death':
      noise(c, t, { dur: 0.9, vol: 0.2, freq: 1800, q: 0.6, to: 120, attack: 0.02 });
      tone(c, t, { f: 220, dur: 0.9, vol: 0.12, to: 70 });
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => bell(c, t, f, 0.13, 1.8, i * 0.13));
      break;
    case 'lose':
      [392, 349, 311, 262].forEach((f, i) => tone(c, t, { f, at: i * 0.22, dur: 0.6, vol: 0.14, type: 'triangle' }));
      tone(c, t, { f: 65, at: 0.66, dur: 1.6, vol: 0.3 });
      break;
    case 'buy':
      bell(c, t, 1568 * r, 0.08, 0.5);
      bell(c, t, 2093 * r, 0.06, 0.5, 0.06);
      break;
    case 'upgrade':
      [440, 554, 659, 880].forEach((f, i) => tone(c, t, { f: f * r, at: i * 0.06, dur: 0.5, vol: 0.1, type: 'triangle' }));
      bell(c, t, 1760, 0.08, 1.2, 0.24);
      break;
  }
}

/* Each planet's cards have their own voice when played, under the swish of the card. */
export function sfxCard(planet?: string): void {
  sfx('card');
  if (!planet || !getSettings().sound) return;
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime + 0.05, r = 0.97 + Math.random() * 0.06;
  switch (planet) {
    case 'Sun': // a bright brass ring
      [[392, 0.12], [784, 0.08], [1176, 0.05], [1568, 0.03]].forEach(([f, v]) => tone(c, t, { f: f * r, type: 'sawtooth', dur: 0.5, vol: v * 0.5, attack: 0.02 }));
      bell(c, t, 1568 * r, 0.05, 0.6);
      break;
    case 'Moon': // a soft chime
      bell(c, t, 1318 * r, 0.09, 1.4); bell(c, t, 1976 * r, 0.05, 1.1, 0.12);
      break;
    case 'Mars': // a war drum
      tone(c, t, { f: 90 * r, dur: 0.3, vol: 0.5, to: 50 });
      noise(c, t, { dur: 0.08, vol: 0.25, freq: 900, q: 0.8 });
      tone(c, t, { f: 90 * r, at: 0.12, dur: 0.25, vol: 0.35, to: 50 });
      break;
    case 'Mercury': // a quick flute run
      [880, 988, 1175].forEach((f, i) => { tone(c, t, { f: f * r, at: i * 0.05, dur: 0.12, vol: 0.08, attack: 0.02 }); noise(c, t, { at: i * 0.05, dur: 0.1, vol: 0.02, freq: f * 2, q: 6 }); });
      break;
    case 'Jupiter': // a deep bell
      bell(c, t, 220 * r, 0.2, 2.2);
      break;
    case 'Venus': // a harp pluck
      [523, 659, 784].forEach((f, i) => { tone(c, t, { f: f * r, at: i * 0.045, dur: 0.7, vol: 0.09, type: 'triangle', attack: 0.003 }); tone(c, t, { f: f * 2 * r, at: i * 0.045, dur: 0.3, vol: 0.03, attack: 0.003 }); });
      break;
    case 'Saturn': // a low gong
      tone(c, t, { f: 73, dur: 2, vol: 0.25, attack: 0.02 }); tone(c, t, { f: 110.5, dur: 1.4, vol: 0.1, attack: 0.02 }); tone(c, t, { f: 183, dur: 0.9, vol: 0.05, attack: 0.02 });
      break;
    case 'Rahu': // a smoky rush
      noise(c, t, { dur: 0.7, vol: 0.18, freq: 300, q: 0.7, to: 2400, attack: 0.25 });
      tone(c, t, { f: 98, dur: 0.7, vol: 0.12, to: 82, type: 'sawtooth', attack: 0.2 });
      break;
    case 'Ketu': // a dry rattle
      for (let i = 0; i < 6; i++) noise(c, t, { at: i * 0.035, dur: 0.03, vol: 0.16, freq: 3500 + i * 200, q: 4 });
      break;
  }
}
