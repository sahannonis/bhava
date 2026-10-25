// node --experimental-strip-types --test tests/rng.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { rngFor } from '../src/rng.ts';

test('the same birth and run give the same numbers', () => {
  const a = rngFor(1234567890123, 0), b = rngFor(1234567890123, 0);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
});

test('a new run, or a different birth, gives different numbers', () => {
  const base = Array.from({ length: 8 }, rngFor(1234567890123, 0).next);
  const nextRun = Array.from({ length: 8 }, rngFor(1234567890123, 1).next);
  const otherBirth = Array.from({ length: 8 }, rngFor(1234567890124, 0).next);
  assert.notDeepEqual(base, nextRun);
  assert.notDeepEqual(base, otherBirth);
});

test('numbers stay in range and spread evenly', () => {
  const r = rngFor(42, 3), counts = new Array(6).fill(0);
  for (let i = 0; i < 60000; i++) {
    const x = r.next();
    assert.ok(x >= 0 && x < 1);
    counts[r.int(1, 6) - 1]++;
  }
  for (const c of counts) assert.ok(Math.abs(c - 10000) < 500, `uneven: ${counts}`);
});

test('shuffle keeps every item', () => {
  const s = rngFor(7, 0).shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual([...s].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});
