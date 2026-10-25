/* The D1 chart drawn North Indian style, and also the run map: houses fixed, house 1 at the top,
   counting counter-clockwise. Lines are drawn twice (a pale line under a soot line) so they read as
   cut into the leaf. What waits in each house is shown by ink hatching: light for a fight, dense for
   a boss, crossed for the final gate, none for a rest place. Each house is a tappable shape (data-house). */
import type { Reading } from './seed';
import type { Transit } from './today';

const ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };

const SHAPES: Record<number, string> = {
  1: '200,0 300,100 200,200 100,100', 2: '0,0 200,0 100,100', 3: '0,0 100,100 0,200',
  4: '0,200 100,100 200,200 100,300', 5: '0,200 100,300 0,400', 6: '0,400 100,300 200,400',
  7: '200,400 100,300 200,200 300,300', 8: '200,400 300,300 400,400', 9: '400,400 300,300 400,200',
  10: '400,200 300,300 200,200 300,100', 11: '400,200 300,100 400,0', 12: '400,0 300,100 200,0',
};
// where the sign number sits (near the inner point) and where the planets gather
const SIGN_AT: Record<number, [number, number]> = {
  1: [200, 178], 2: [100, 80], 3: [80, 100], 4: [170, 200], 5: [80, 300], 6: [100, 320],
  7: [200, 224], 8: [300, 320], 9: [320, 300], 10: [230, 200], 11: [320, 100], 12: [300, 80],
};
type Flow = 'down' | 'up' | 'mid';
const PLANETS_AT: Record<number, [number, number, number, Flow]> = { // x, y, per row, flow
  1: [200, 82, 3, 'mid'], 4: [100, 200, 3, 'mid'], 7: [200, 304, 3, 'mid'], 10: [300, 200, 3, 'mid'],
  2: [100, 34, 3, 'down'], 12: [300, 34, 3, 'down'], 6: [100, 376, 3, 'up'], 8: [300, 376, 3, 'up'],
  3: [34, 100, 2, 'mid'], 5: [34, 300, 2, 'mid'], 9: [366, 300, 2, 'mid'], 11: [366, 100, 2, 'mid'],
};

const LINES = 'M2 2H398V398H2Z M2 2L398 398 M398 2L2 398 M200 2L398 200L200 398L2 200Z';

const DEFS = `<defs>
  <pattern id="hatch-fight" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" /></pattern>
  <pattern id="hatch-boss" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4.5" /></pattern>
  <filter id="planet-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5.5" /></filter>
  <radialGradient id="lamp-on-house"><stop offset="0" stop-color="#fff0c2" stop-opacity="0.75" /><stop offset="1" stop-color="#ffd98a" stop-opacity="0.18" /></radialGradient>
  <pattern id="hatch-gate" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" /><line x1="0" y1="0" x2="7" y2="0" /></pattern>
</defs>`;

export type MapState = {
  current?: number; selected?: number; cast?: boolean;
  sky?: Transit[]; // when set, today's planets are drawn instead of the birth planets
};

/* Each planet breathes at its own pace, quick for the Moon and slow for Saturn, as they move in the sky. */
const BREATH: Record<string, number> = { Moon: 3.2, Mercury: 4.1, Venus: 4.8, Sun: 5.6, Mars: 6.4, Rahu: 7.6, Ketu: 7.6, Jupiter: 9, Saturn: 11 };

export function chartSvg(r: Reading, state: MapState = {}): string {
  let rise = 0; // planets appear one by one, in run order
  const houses = r.houses.map(h => {
    const [sx, sy] = SIGN_AT[h.n];
    const [px, py, per, flow] = PLANETS_AT[h.n];
    const shown: { name: string; hard?: boolean }[] = state.sky
      ? state.sky.filter(t => t.house === h.n).map(t => ({ name: t.name, hard: !t.good }))
      : h.planets;
    const rows = Math.ceil(shown.length / per);
    const startY = flow === 'down' ? py : flow === 'up' ? py - (rows - 1) * 21 : py - ((rows - 1) * 21) / 2;
    const names = shown.map((p, i) => {
      const row = Math.floor(i / per), inRow = Math.min(per, shown.length - row * per), col = i % per;
      const x = px + (col - (inRow - 1) / 2) * 31, y = startY + row * 21;
      const id = p.name.toLowerCase(), at = `x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central"`;
      return `<g class="pl-g" style="--rise:${(1.5 + 0.13 * rise++).toFixed(2)}s;--breath:${BREATH[p.name]}s;--lag:${(-((x * 7 + y * 3) % 50) / 10).toFixed(1)}s">
        <text class="pl-glow glow-${id}" ${at} filter="url(#planet-glow)">${ABBR[p.name]}</text>
        <text class="pl pl-${id}" ${at}>${ABBR[p.name]}</text>${p.hard ? `<line class="hard-mark" x1="${x - 9}" x2="${x + 9}" y1="${y + 11}" y2="${y + 11}" />` : ''}
      </g>`;
    }).join('');
    const lagna = h.n === 1 ? `<text class="lagna-word" x="200" y="160" text-anchor="middle">lagna</text>` : '';
    const hatch = h.kind === 'rest' ? '' : `<polygon class="hatch" points="${SHAPES[h.n]}" fill="url(#hatch-${h.kind})" />`;
    const cls = ['house', `kind-${h.kind}`, state.current === h.n ? 'is-current' : '', state.selected === h.n ? 'is-selected' : ''].filter(Boolean).join(' ');
    const what = h.kind === 'rest' ? 'rest place' : h.kind === 'gate' ? 'final gate' : h.kind;
    return `<g class="${cls}" data-house="${h.n}" role="button" tabindex="0" aria-pressed="${state.selected === h.n}" aria-label="${h.n}${['st', 'nd', 'rd'][h.n - 1] || 'th'} house, ${h.signName}, ${what}${shown.length ? `: ${state.sky ? 'today ' : ''}${shown.map(p => p.name).join(', ')}` : ''}">
      ${hatch}<polygon class="hit" points="${SHAPES[h.n]}" />${state.selected === h.n ? `<polygon class="lit" points="${SHAPES[h.n]}" fill="url(#lamp-on-house)" />` : ''}
      <text class="sign-no" x="${sx}" y="${sy}" text-anchor="middle" dominant-baseline="central">${h.sign + 1}</text>${lagna}${names}
    </g>`;
  }).join('');
  const sel = state.selected ? `<polygon class="selected-ring" points="${SHAPES[state.selected]}" />` : '';
  // where you stand: a dotted line of red ink around the house
  const here = state.current ? `<polygon class="current-ring" points="${SHAPES[state.current]}" />` : '';
  return `<svg class="chart${state.cast ? ' cast' : ''}${state.sky ? ' sky-mode' : ''}" viewBox="-4 -4 408 408" role="group" aria-label="${state.sky ? 'Today\'s planets over your twelve houses' : 'Your birth chart, your twelve houses'}">
    ${DEFS}
    ${houses}
    <path class="cut-light" d="${LINES}" transform="translate(0 1.4)" />
    <path class="cut" d="${LINES}" />
    ${sel}${here}
  </svg>`;
}
