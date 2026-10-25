/* Today's sky: where the real planets are now, counted from the birth Moon (gochara).
   The daily effect is read at local noon so it holds for the whole day. */
import { E } from './engine';
import { GOOD_FROM_MOON, MOON_DAY, PRESS } from './content';
import { ordinal, type Reading } from './seed';

export type Transit = {
  name: string; sign: number; signName: string; retro: boolean;
  house: number;     // the house of your chart it is crossing (counted from the lagna, as drawn)
  fromMoon: number;  // counted from your birth Moon, the way gochara is read
  good: boolean;
};

export type Sky = {
  dayKey: string;
  fromMoon: number; signName: string; title: string; effect: string; // today's Moon and its game effect
  elong: number; lit: number;          // the Moon's phase
  transits: Transit[];
  chandrashtama: boolean;              // Moon 8th from the birth Moon
  sadeSati: 'rising' | 'peak' | 'setting' | null; // Saturn 12th, 1st or 2nd from it
  pressing: string;                    // the planet whose remedy fits today
  blessing: string | null;             // the heaviest planet in a good place: it lends a card in every fight today
};

const signOf = (r: Reading, n: number) => E.SIGNS[n].en;

export function todaySky(r: Reading, now = new Date()): Sky {
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const sky = E.chart(noon.getTime(), 0, 0) as ReturnType<typeof E.chart> & { elong: number };
  const birthMoon = r.chart.by.Moon.sign;
  const from = (sign: number, base: number) => ((sign - base + 12) % 12) + 1;

  const transits: Transit[] = sky.planets.map(p => {
    const fromMoon = from(p.sign, birthMoon);
    return {
      name: p.name, sign: p.sign, signName: signOf(r, p.sign), retro: p.retro && p.name !== 'Rahu' && p.name !== 'Ketu',
      house: from(p.sign, r.lagnaSign), fromMoon, good: GOOD_FROM_MOON[p.name].includes(fromMoon),
    };
  });
  const moon = transits.find(t => t.name === 'Moon')!;
  const saturn = transits.find(t => t.name === 'Saturn')!;
  const hard = transits.filter(t => !t.good).sort((a, b) => PRESS[b.name] - PRESS[a.name]);
  const good = transits.filter(t => t.good).sort((a, b) => PRESS[b.name] - PRESS[a.name]);
  const chandrashtama = moon.fromMoon === 8;

  const dayKey = `${noon.getFullYear()}-${String(noon.getMonth() + 1).padStart(2, '0')}-${String(noon.getDate()).padStart(2, '0')}`;
  return {
    dayKey,
    fromMoon: moon.fromMoon,
    signName: moon.signName,
    title: moon.fromMoon === 1 ? 'Moon over your birth Moon' : `Moon ${ordinal(moon.fromMoon)} from your birth Moon`,
    effect: MOON_DAY[moon.fromMoon - 1].effect,
    elong: sky.elong,
    lit: (1 - Math.cos((sky.elong * Math.PI) / 180)) / 2,
    transits,
    chandrashtama,
    sadeSati: saturn.fromMoon === 12 ? 'rising' : saturn.fromMoon === 1 ? 'peak' : saturn.fromMoon === 2 ? 'setting' : null,
    // Chandrashtama asks for the Moon's remedy; otherwise the heaviest planet in a hard place
    pressing: chandrashtama ? 'Moon' : hard.length ? hard[0].name : 'Moon',
    blessing: good.length ? good[0].name : null,
  };
}

/* Today's Moon as seen from the north: lit on the right while it grows, on the left as it shrinks. */
export function moonSvg(elong: number, r = 15): string {
  const c = Math.cos((elong * Math.PI) / 180), rx = Math.abs(c) * r;
  const lit = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx.toFixed(2)},${r} 0 0 ${c > 0 ? 0 : 1} 0,${-r}Z`;
  const flip = elong > 180 ? ' transform="scale(-1,1)"' : '';
  const pad = r + 9, size = pad * 2;
  return `<svg class="moon" viewBox="${-pad} ${-pad} ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <defs><filter id="moon-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" /></filter></defs>
    <circle class="moon-halo" r="${r + 1}" filter="url(#moon-blur)" />
    <circle class="moon-dark" r="${r}" />
    <path class="moon-lit" d="${lit}"${flip} />
    <circle class="moon-rim" r="${r}" />
  </svg>`;
}
