/* Seeded randomness: the same birth and run number always give the same card offers and enemy order.
   sfc32, seeded through splitmix32 from the birth seed and the run number. */

function splitmix32(a: number) {
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export type Rng = {
  next(): number;              // 0 <= x < 1
  int(min: number, max: number): number; // min..max, both included
  pick<T>(list: readonly T[]): T;
  shuffle<T>(list: readonly T[]): T[];
};

export function rngFor(seed: number, run: number): Rng {
  // fold the 53-bit seed and the run number into 32-bit starting values
  const hi = Math.floor(seed / 4294967296) >>> 0, lo = seed >>> 0;
  const mix = splitmix32((hi ^ Math.imul(run + 1, 0x85ebca6b)) ^ lo);
  let a = mix(), b = mix(), c = mix(), d = mix();
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const r = (t + d) | 0;
    c = (c + r) | 0;
    return (r >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next(); // warm up
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: list => list[int(0, list.length - 1)],
    shuffle: list => {
      const out = list.slice();
      for (let i = out.length - 1; i > 0; i--) { const j = int(0, i); [out[i], out[j]] = [out[j], out[i]]; }
      return out;
    },
  };
}
