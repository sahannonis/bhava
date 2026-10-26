// npm test (runs with tsx)
import test from 'node:test';
import assert from 'node:assert';
import { castChart } from '../src/seed';
import { firstReading, houseReading } from '../src/readings';
import { LAGNA_READ, MOON_READ } from '../src/readings/first';
import { HOUSE_MEANING, LORD_FROM, LORD_TO, lordLine } from '../src/readings/houses';
import { PLANETS, PLANET_IN_HOUSE, PLANET_PAGE } from '../src/readings/planets';
import { SIGN_TEXT, YOGA_PAGE, chartYogas } from '../src/readings/signs';
import { YOGAS } from '../src/game/yogas';

const colombo = { name: 'Colombo', prov: 'Western', country: 'Sri Lanka', lat: 6.9319, lon: 79.8478, tz: 'Asia/Colombo' };

test('every reading text is written, and none is left as a placeholder', () => {
  const all = [...LAGNA_READ, ...MOON_READ, ...HOUSE_MEANING.map(h => h.text), ...LORD_FROM, ...LORD_TO, ...SIGN_TEXT,
    ...PLANETS.flatMap(p => [PLANET_PAGE[p].text, ...PLANET_IN_HOUSE[p]]), ...YOGAS.map(y => YOGA_PAGE[y.id])];
  assert.equal(all.length, 12 + 12 + 12 + 12 + 12 + 12 + 9 * 13 + 9);
  for (const t of all) assert.ok(typeof t === 'string' && t.length > (LORD_FROM.includes(t) ? 20 : 40) && !/TODO|lorem/i.test(t), t);
  for (const p of PLANETS) {
    assert.equal(PLANET_IN_HOUSE[p].length, 12, p);
    PLANET_IN_HOUSE[p].forEach((t, i) => assert.ok(t.includes(`${p} in your ${i + 1}`), `${p} ${i + 1}: ${t.slice(0, 30)}`));
  }
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) assert.ok(lordLine(a, b).endsWith('.'));
});

test('readings come from the real chart, for many births, with and without a time', () => {
  for (let d = 1; d <= 28; d += 3) {
    for (const time of ['06:45', '22:30', null]) {
      const r = castChart({ date: `1999-01-${String(d).padStart(2, '0')}`, time, place: colombo });
      const f = firstReading(r);
      assert.ok(f.sections.length >= 4 && f.sections.some(s => s.heading.startsWith('Your birth star')) && f.sections.some(s => s.kind === 'now'));
      for (let n = 1; n <= 12; n++) {
        const h = houseReading(r, n);
        const heads = h.sections.map(s => s.heading);
        assert.equal(heads.filter(x => !x.startsWith('Its lord') && / in your \d/.test(x)).length, r.houses[n - 1].planets.length);
        assert.ok(heads.includes('When it speaks loudest') && heads.includes('The thread') && heads.some(x => x.startsWith('Its lord')), heads.join('|'));
        for (const s of h.sections) assert.ok(s.text.length > 30 && !s.text.includes('undefined'), s.heading);
      }
      for (const y of chartYogas(r)) assert.ok(YOGAS.some(x => x.id === y));
    }
  }
});

test('chart yogas: Budhaditya is very common, since Mercury stays close to the Sun', () => {
  let n = 0;
  for (let d = 1; d <= 28; d++) if (chartYogas(castChart({ date: `2000-03-${String(d).padStart(2, '0')}`, time: '12:00', place: colombo })).includes('budhaditya')) n++;
  assert.ok(n > 5, `${n}`);
});
