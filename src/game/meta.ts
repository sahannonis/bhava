/* What lasts between runs: karma, the hub's upgrades, the next lives a chart has opened,
   and the daily sky trial with its practice streak. Pure rules here; saving is in metaStore.ts. */

export type UpId = 'vitality' | 'purse' | 'oil' | 'steady' | 'light' | 'eye';
export type Daily = { last?: string; streak: number; best: number; tries?: Record<string, number>; won?: string[] };
export type Meta = {
  v: 1;
  karma: number;          // to spend
  earned: number;         // all karma ever earned
  ups: Partial<Record<UpId, number>>;
  lives: Record<string, number>; // chart seed -> highest life opened (1 = the first life)
  chosen: Record<string, number>; // chart seed -> life chosen for the next run
  daily: Daily;
  won: number; lost: number;
};

export const newMeta = (): Meta => ({ v: 1, karma: 0, earned: 0, ups: {}, lives: {}, chosen: {}, daily: { streak: 0, best: 0 }, won: 0, lost: 0 });

/* ---------- the hub ---------- */
export type Upgrade = { id: UpId; name: string; costs: number[]; text: (level: number) => string };
export const UPGRADES: Upgrade[] = [
  { id: 'vitality', name: 'Strong body', costs: [15, 30, 50], text: n => `Start every run with ${5 * n} more health.` },
  { id: 'purse', name: 'Full purse', costs: [10, 20, 35], text: n => `Start every run with ${15 * n} prana.` },
  { id: 'oil', name: 'Lamp oil', costs: [20, 40], text: n => `Resting heals ${10 * n}% more of your health.` },
  { id: 'steady', name: 'Steady hand', costs: [40], text: () => 'Your signature card starts every run at level 2.' },
  { id: 'light', name: 'Light pack', costs: [35], text: () => 'Start every run with one Strike fewer, so your best cards come round sooner.' },
  { id: 'eye', name: 'Wide eye', costs: [60], text: () => 'One more card to choose from after every fight.' },
];
export const levelOf = (m: Meta, id: UpId) => m.ups[id] ?? 0;
export const nextCost = (m: Meta, u: Upgrade): number | null => u.costs[levelOf(m, u.id)] ?? null;

export function buy(m: Meta, id: UpId): boolean {
  const u = UPGRADES.find(x => x.id === id)!, cost = nextCost(m, u);
  if (cost === null || m.karma < cost) return false;
  m.karma -= cost;
  m.ups[id] = levelOf(m, id) + 1;
  return true;
}

/* What the upgrades give a new run. */
export function perks(m: Meta) {
  return {
    maxHp: 5 * levelOf(m, 'vitality'),
    prana: 15 * levelOf(m, 'purse'),
    restBonus: 0.1 * levelOf(m, 'oil'),
    steady: levelOf(m, 'steady') > 0,
    light: levelOf(m, 'light') > 0,
    extraChoice: levelOf(m, 'eye'),
  };
}

/* ---------- next lives ---------- */
/* Each life keeps every rule before it. A win opens the next, up to the 12th. */
export const LIVES: { n: number; name: string; text: string }[] = [
  { n: 1, name: 'First life', text: 'The houses as they are.' },
  { n: 2, name: 'Restless spirits', text: 'Lesser spirits have 15% more health.' },
  { n: 3, name: 'Thin lamps', text: 'Rest places heal a third less.' },
  { n: 4, name: 'Guarded', text: 'Every enemy starts the fight with 5 block.' },
  { n: 5, name: 'Quick anger', text: 'Planets, bosses and the gate grow enraged at 60% health.' },
  { n: 6, name: 'Narrow road', text: 'One card fewer to choose from after fights.' },
  { n: 7, name: 'Frail body', text: 'You start with 10% less health.' },
  { n: 8, name: 'Harder hands', text: 'Every enemy attack does 1 more damage.' },
  { n: 9, name: 'Lean years', text: 'Fights give a quarter less prana.' },
  { n: 10, name: 'Heavy crowns', text: 'Bosses and the gate have 15% more health.' },
  { n: 11, name: 'Dear prices', text: "The keeper's stall costs a quarter more." },
  { n: 12, name: 'No refuge', text: "The shrine's remedy no longer calms the pressing planet." },
];
export const MAX_LIFE = 12;

export function lifeRules(life = 1) {
  const at = (n: number) => life >= n;
  return {
    lesserHp: at(2) ? 1.15 : 1,
    restHeal: at(3) ? 2 / 3 : 1,
    startBlock: at(4) ? 5 : 0,
    enrageAt: at(5) ? 0.6 : 0.5,
    fewerChoices: at(6) ? 1 : 0,
    maxHp: at(7) ? 0.9 : 1,
    atk: at(8) ? 1 : 0,
    prana: at(9) ? 0.75 : 1,
    bossHp: at(10) ? 1.15 : 1,
    price: at(11) ? 1.25 : 1,
    noRefuge: at(12),
  };
}

export const highestLife = (m: Meta, seed: number) => m.lives[seed] ?? 1;
export const chosenLife = (m: Meta, seed: number) => Math.min(m.chosen[seed] ?? highestLife(m, seed), highestLife(m, seed));

/* ---------- karma at the end of a run ---------- */
export type KarmaLine = { label: string; amount: number };
export function runKarma(o: { cleared: number[]; story: number; won: boolean; life: number }): { lines: KarmaLine[]; total: number } {
  const lines: KarmaLine[] = [];
  const houses = o.cleared.reduce((a, n) => a + n, 0);
  if (houses) lines.push({ label: `${o.cleared.length} house${o.cleared.length === 1 ? '' : 's'} cleared`, amount: houses });
  if (o.story) lines.push({ label: 'Your choices on the way', amount: o.story });
  if (o.won) lines.push({ label: 'Released from the twelfth house', amount: 20 });
  let total = Math.max(0, lines.reduce((a, l) => a + l.amount, 0));
  if (o.life > 1) { const extra = Math.round(total * 0.1 * (o.life - 1)); lines.push({ label: `Life ${o.life}: ${10 * (o.life - 1)}% more`, amount: extra }); total += extra; }
  if (!o.won) { const lost = Math.ceil(total / 2); if (lost) lines.push({ label: 'Falling costs half', amount: -lost }); total -= lost; }
  return { lines, total };
}

/* Bank a finished run. Returns whether a new life opened. */
export function endOfRun(m: Meta, seed: number, karma: number, won: boolean, life: number): { newLife: number | null } {
  m.karma += karma; m.earned += karma;
  if (won) m.won += 1; else m.lost += 1;
  if (won && life >= highestLife(m, seed) && life < MAX_LIFE) {
    m.lives[seed] = life + 1;
    m.chosen[seed] = life + 1;
    return { newLife: life + 1 };
  }
  return { newLife: null };
}

/* ---------- the daily sky trial ---------- */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

export const TRIES_PER_DAY = 1;
export const triesLeft = (m: Meta, today: string) => TRIES_PER_DAY - (m.daily.tries?.[today] ?? 0);
export const wonToday = (m: Meta, today: string) => !!m.daily.won?.includes(today);

/* The streak counts days you sat the trial. Missing days halves it instead of wiping it out. */
export function streakIfPlayed(m: Meta, today: string): number {
  const d = m.daily;
  if (!d.last) return 1;
  const gap = daysBetween(d.last, today);
  if (gap <= 0) return d.streak;
  if (gap === 1) return d.streak + 1;
  let s = d.streak;
  for (let i = 1; i < gap; i++) s = Math.floor(s / 2);
  return s + 1;
}
export const streakNow = (m: Meta, today: string) => {
  const d = m.daily;
  if (!d.last) return 0;
  const gap = daysBetween(d.last, today);
  let s = d.streak;
  for (let i = 1; i < gap; i++) s = Math.floor(s / 2);
  return s;
};
export const dailyReward = (streak: number) => 10 + Math.min(streak, 10);

export function recordDaily(m: Meta, today: string, won: boolean): { streak: number; karma: number } {
  const streak = streakIfPlayed(m, today);
  m.daily.tries = { [today]: (m.daily.tries?.[today] ?? 0) + 1 };
  m.daily.streak = streak; m.daily.last = today; m.daily.best = Math.max(m.daily.best, streak);
  let karma = 0;
  if (won && !wonToday(m, today)) {
    karma = dailyReward(streak);
    m.daily.won = [...(m.daily.won ?? []).slice(-30), today];
    m.karma += karma; m.earned += karma;
  }
  return { streak, karma };
}
