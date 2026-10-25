/* Cards. Day 3 has the starter set and each class's signature card; the full pool of about 30
   arrives on Day 4. Numbers are first drafts. */

export type StatusId = 'burn' | 'weak' | 'exposed' | 'might' | 'charmed';

export type Effect =
  | { kind: 'damage'; amount: number; times?: number; perTurn?: number; max?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'status'; to: 'target' | 'self'; status: StatusId; amount: number }
  | { kind: 'draw'; n: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHp'; amount: number };

export type CardType = 'attack' | 'skill';
export type CardDef = {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  target: 'enemy' | 'self';
  effects: Effect[];
  exhaust?: boolean; // used up for the rest of the fight
  planet?: string;   // the planet whose colour the card carries
};

export const CARDS: Record<string, CardDef> = {
  strike: { id: 'strike', name: 'Strike', cost: 1, type: 'attack', target: 'enemy', effects: [{ kind: 'damage', amount: 6 }] },
  guard: { id: 'guard', name: 'Guard', cost: 1, type: 'skill', target: 'self', effects: [{ kind: 'block', amount: 5 }] },

  // one signature card per class (lagna ruler)
  noon: { id: 'noon', name: 'Noon Blaze', cost: 1, type: 'attack', target: 'enemy', planet: 'Sun', effects: [{ kind: 'damage', amount: 3, perTurn: 2, max: 21 }] },
  tidecall: { id: 'tidecall', name: 'Tidecall', cost: 1, type: 'skill', target: 'self', planet: 'Moon', effects: [{ kind: 'heal', amount: 4 }, { kind: 'block', amount: 4 }] },
  redRush: { id: 'redRush', name: 'Red Rush', cost: 1, type: 'attack', target: 'enemy', planet: 'Mars', effects: [{ kind: 'loseHp', amount: 3 }, { kind: 'damage', amount: 14 }] },
  quickWit: { id: 'quickWit', name: 'Quick Wit', cost: 0, type: 'skill', target: 'self', planet: 'Mercury', effects: [{ kind: 'draw', n: 2 }] },
  gurusShield: { id: 'gurusShield', name: "Guru's Shield", cost: 1, type: 'skill', target: 'self', planet: 'Jupiter', effects: [{ kind: 'block', amount: 9 }] },
  charm: { id: 'charm', name: 'Charm', cost: 1, type: 'skill', target: 'enemy', planet: 'Venus', exhaust: true, effects: [{ kind: 'status', to: 'target', status: 'charmed', amount: 1 }] },
  slowToll: { id: 'slowToll', name: 'Slow Toll', cost: 2, type: 'attack', target: 'enemy', planet: 'Saturn', effects: [{ kind: 'damage', amount: 6, perTurn: 4, max: 30 }] },

  // a few more for the test fight, to try each status
  ember: { id: 'ember', name: 'Ember', cost: 1, type: 'attack', target: 'enemy', planet: 'Sun', effects: [{ kind: 'damage', amount: 4 }, { kind: 'status', to: 'target', status: 'burn', amount: 3 }] },
  weighDown: { id: 'weighDown', name: 'Weigh Down', cost: 1, type: 'skill', target: 'enemy', planet: 'Saturn', effects: [{ kind: 'status', to: 'target', status: 'weak', amount: 2 }] },
  openWound: { id: 'openWound', name: 'Open Wound', cost: 0, type: 'skill', target: 'enemy', planet: 'Mars', effects: [{ kind: 'status', to: 'target', status: 'exposed', amount: 2 }] },
};

export const SIGNATURE: Record<string, string> = {
  Sun: 'noon', Moon: 'tidecall', Mars: 'redRush', Mercury: 'quickWit', Jupiter: 'gurusShield', Venus: 'charm', Saturn: 'slowToll',
};

export function starterDeck(ruler: string): string[] {
  return ['strike', 'strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', SIGNATURE[ruler], 'ember', 'weighDown', 'openWound'];
}

export const STATUS_INFO: Record<StatusId, { name: string; text: string }> = {
  burn: { name: 'Burn', text: 'Takes this much damage at the start of its turn, then burn drops by 1.' },
  weak: { name: 'Weak', text: 'Deals a quarter less attack damage. Drops by 1 each turn.' },
  exposed: { name: 'Exposed', text: 'Takes half again as much attack damage. Drops by 1 each turn.' },
  might: { name: 'Might', text: 'Adds this much to every attack.' },
  charmed: { name: 'Charmed', text: 'Skips its next action.' },
};

/* What a card says, worked out for the turn it is in. */
export function cardText(def: CardDef, turn = 1): string {
  return def.effects.map(e => {
    switch (e.kind) {
      case 'damage': {
        if (e.perTurn) {
          const now = Math.min(e.max ?? Infinity, e.amount + e.perTurn * (turn - 1));
          return `Deal ${now} damage. Grows by ${e.perTurn} each turn${e.max ? `, up to ${e.max}` : ''}.`;
        }
        return `Deal ${e.amount} damage${e.times && e.times > 1 ? ` ${e.times} times` : ''}.`;
      }
      case 'block': return `Gain ${e.amount} block.`;
      case 'status': return e.status === 'charmed' ? 'The enemy skips its next action.' : `${e.to === 'self' ? 'Gain' : 'Give'} ${e.amount} ${STATUS_INFO[e.status].name.toLowerCase()}.`;
      case 'draw': return `Draw ${e.n} cards.`;
      case 'heal': return `Heal ${e.amount}.`;
      case 'loseHp': return `Lose ${e.amount} health.`;
    }
  }).join(' ') + (def.exhaust ? ' Used up.' : '');
}
