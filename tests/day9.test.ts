// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { castChart } from '../src/seed';
import { wholeChartReading, dashaTimeline, houseReading } from '../src/readings';
import { ashtakoota, band } from '../src/readings/compat';
import { DAILY_LINE, dailyLine } from '../src/readings/daily';
import { NAKSHATRAS, nakOf } from '../src/readings/nakshatras';
import { houseScore, toneOf, aspectsFrom } from '../src/readings/depth';

const colombo = { name: 'Colombo', prov: 'Western', country: 'Sri Lanka', lat: 6.9319, lon: 79.8478, tz: 'Asia/Colombo' };
const NAK = 360 / 27;
const moon = (nak: number, sign?: number) => { const lon = nak * NAK + 1; return { lon, sign: sign ?? Math.floor(lon / 30) }; };

test('the 36-point match follows the classic rules', () => {
  // same Moon: same nadi (0 of 8), same sign is a happy Bhakoot (7), same animal (4), same gana (6), same lord (5)
  const same = ashtakoota(moon(7), moon(7));
  const k = Object.fromEntries(same.kootas.map(x => [x.id, x.score]));
  assert.deepEqual([k.nadi, k.bhakoot, k.yoni, k.gana, k.maitri], [0, 7, 4, 6, 5]);
  assert.equal(same.kootas.reduce((a, x) => a + x.max, 0), 36);
  // Ashwini (horse, Adi) with Swati (buffalo, Antya): sworn yoni enemies, different nadis
  const ab = ashtakoota(moon(0), moon(14));
  const kb = Object.fromEntries(ab.kootas.map(x => [x.id, x.score]));
  assert.equal(kb.yoni, 0); assert.equal(kb.nadi, 8);
  // 6/8 Moon signs are Bhakoot dosha
  assert.equal(ashtakoota({ sign: 0, lon: 5 }, { sign: 7, lon: 215 }).kootas.find(x => x.id === 'bhakoot')!.score, 0);
  // symmetric: reading without gender, A with B equals B with A
  for (let a = 0; a < 27; a += 4) for (let b = 0; b < 27; b += 5) assert.equal(ashtakoota(moon(a), moon(b)).total, ashtakoota(moon(b), moon(a)).total);
  assert.equal(band(30).name, 'A very good match'); assert.equal(band(10).name, 'A challenging match');
});

test('the dasha timeline covers a whole life without gaps, and one period is now', () => {
  const r = castChart({ date: '1999-01-14', time: '10:30', place: colombo });
  const t = dashaTimeline(r, Date.parse('2026-10-26'));
  assert.ok(t.length >= 6);
  for (let i = 1; i < t.length; i++) assert.ok(Math.abs(t[i].start - t[i - 1].end) < 1000);
  assert.equal(t.filter(p => p.now).length, 1);
  assert.equal(t[0].start, r.utc, 'starts at birth');
  // the first period's lord is the lord of the birth star
  assert.equal(t[0].lord, ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][nakOf(r.chart.by.Moon.lon) % 9]);
});

test('the whole-chart reading and the house readings name real years and ages', () => {
  const r = castChart({ date: '1990-07-02', time: '05:10', place: colombo });
  const w = wholeChartReading(r, Date.parse('2026-10-26'));
  assert.ok(w.sections.length >= 5);
  assert.ok(/\b(19|20)\d\d\b/.test(w.sections.find(s => s.kind === 'now')!.text));
  for (let n = 1; n <= 12; n++) {
    const h = houseReading(r, n, Date.parse('2026-10-26'));
    assert.ok(/\b(19|20)\d\d\b/.test(h.sections.find(s => s.kind === 'time')!.text), `house ${n}`);
    assert.ok(['blessed', 'strong', 'mixed', 'tested', 'forged'].includes(toneOf(houseScore(r, n))));
  }
});

test('aspects: everyone looks at the 7th; Mars, Jupiter and Saturn have their special looks', () => {
  assert.deepEqual(aspectsFrom('Venus', 1), [7]);
  assert.deepEqual(aspectsFrom('Mars', 1).sort((a, b) => a - b), [4, 7, 8]);
  assert.deepEqual(aspectsFrom('Jupiter', 1).sort((a, b) => a - b), [5, 7, 9]);
  assert.deepEqual(aspectsFrom('Saturn', 10).sort((a, b) => a - b), [4, 7, 12]);
});

test('a daily line for every Moon day, with today\'s nakshatra', () => {
  assert.equal(DAILY_LINE.length, 12);
  assert.equal(NAKSHATRAS.length, 27);
  assert.ok(dailyLine(8, 100).includes(NAKSHATRAS[nakOf(100)].name));
});
