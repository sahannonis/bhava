// node --test tests/
// The frozen engine on a known moment: 21 March 1985, 06:45 in Colombo (a New Moon at sunrise).
const test = require('node:test');
const assert = require('node:assert');
const A = require('astronomy-engine');
// star-engine.js is a browser UMD file inside an ES-module package, so load its text directly
const code = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/engine/star-engine.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'self', code)(mod, {});
const E = mod.exports(A);

const SIGN = n => E.SIGNS[n].en;

test('historical time zones: Sri Lanka was UTC+6 from 1996 to 2006', () => {
  assert.equal(E.fmtOffset(E.localToUTC(1999, 6, 1, 12, 0, 'Asia/Colombo').offset), 'UTC+06:00');
  assert.equal(E.fmtOffset(E.localToUTC(1985, 3, 21, 6, 45, 'Asia/Colombo').offset), 'UTC+05:30');
  assert.equal(E.fmtOffset(E.localToUTC(2010, 6, 1, 12, 0, 'Asia/Colombo').offset), 'UTC+05:30');
});

test('a known chart', () => {
  const { utc } = E.localToUTC(1985, 3, 21, 6, 45, 'Asia/Colombo');
  const c = E.chart(utc, 6.93, 79.85);
  assert.equal(SIGN(c.lagna.sign), 'Pisces');
  assert.equal(SIGN(c.by.Sun.sign), 'Pisces');
  assert.equal(SIGN(c.by.Moon.sign), 'Pisces');
  assert.equal(SIGN(c.by.Mars.sign), 'Aries');
  assert.equal(c.by.Mars.dignity, 'own sign');
  assert.equal(SIGN(c.by.Jupiter.sign), 'Capricorn');
  assert.equal(c.by.Jupiter.dignity, 'debilitated');
  assert.equal(SIGN(c.by.Saturn.sign), 'Scorpio');
  assert.equal(SIGN(c.by.Rahu.sign), 'Aries');
  assert.equal((c.by.Rahu.sign + 6) % 12, c.by.Ketu.sign);
  assert.equal(c.by.Sun.house, 1);
});
