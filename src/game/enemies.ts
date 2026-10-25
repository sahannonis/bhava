/* Enemies and their moves. Day 3 has the practice shade; the nine planet enemies get their moves on Day 5. */
import type { StatusId } from './cards';

export type EnemyAction =
  | { kind: 'attack'; amount: number; times?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'status'; to: 'self' | 'player'; status: StatusId; amount: number };

export type Move = { name: string; actions: EnemyAction[] };

export type EnemyDef = {
  id: string;
  name: string;
  planet?: string;
  hp: number;
  moves: Move[];
  order: 'cycle' | 'random'; // cycle: in order from a seeded start; random: seeded, never the same move three times running
};

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  shade: {
    id: 'shade',
    name: 'Practice Shade',
    hp: 42,
    order: 'cycle',
    moves: [
      { name: 'Cut', actions: [{ kind: 'attack', amount: 7 }] },
      { name: 'Hunch', actions: [{ kind: 'block', amount: 6 }, { kind: 'attack', amount: 4 }] },
      { name: 'Twin cut', actions: [{ kind: 'attack', amount: 4, times: 2 }] },
      { name: 'Gather', actions: [{ kind: 'status', to: 'self', status: 'might', amount: 2 }] },
    ],
  },
};
