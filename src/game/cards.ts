/* Cards: a neutral few, and four for each of the seven planets plus two each for Rahu and Ketu.
   Each class (lagna ruler) starts with its signature card and two more of its planet.
   Playing two planets' cards in one turn can form a yoga (see yogas.ts). Numbers are first drafts. */

export type StatusId = 'burn' | 'weak' | 'exposed' | 'might' | 'charmed';

export type Effect =
  | { kind: 'damage'; amount: number; times?: number; perTurn?: number; perPlayed?: number; max?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'status'; to: 'target' | 'self'; status: StatusId; amount: number }
  | { kind: 'draw'; n: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'breath'; n: number }
  | { kind: 'drain'; amount: number }   // damage, and heal what got through
  | { kind: 'cleanse' };                // clear your burn, weak and exposed

export type CardType = 'attack' | 'skill';
export type CardDef = {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  target: 'enemy' | 'self';
  effects: Effect[];
  exhaust?: boolean; // used up for the rest of the fight
  planet?: string;   // the planet the card belongs to; its colour, and its part in yogas
};

const c = (d: CardDef) => d;

const BASE: Record<string, CardDef> = {
  // neutral
  strike: c({ id: 'strike', name: 'Strike', cost: 1, type: 'attack', target: 'enemy', effects: [{ kind: 'damage', amount: 6 }] }),
  guard: c({ id: 'guard', name: 'Guard', cost: 1, type: 'skill', target: 'self', effects: [{ kind: 'block', amount: 5 }] }),
  riposte: c({ id: 'riposte', name: 'Riposte', cost: 1, type: 'attack', target: 'enemy', effects: [{ kind: 'damage', amount: 5 }, { kind: 'block', amount: 3 }] }),
  deepBreath: c({ id: 'deepBreath', name: 'Deep Breath', cost: 0, type: 'skill', target: 'self', exhaust: true, effects: [{ kind: 'breath', n: 1 }, { kind: 'draw', n: 1 }] }),
  focus: c({ id: 'focus', name: 'Focus', cost: 1, type: 'skill', target: 'self', exhaust: true, effects: [{ kind: 'status', to: 'self', status: 'might', amount: 2 }] }),

  // Sun: power that grows
  noon: c({ id: 'noon', name: 'Noon Blaze', cost: 1, type: 'attack', target: 'enemy', planet: 'Sun', effects: [{ kind: 'damage', amount: 3, perTurn: 2, max: 21 }] }),
  ember: c({ id: 'ember', name: 'Ember', cost: 1, type: 'attack', target: 'enemy', planet: 'Sun', effects: [{ kind: 'damage', amount: 4 }, { kind: 'status', to: 'target', status: 'burn', amount: 3 }] }),
  solarFlare: c({ id: 'solarFlare', name: 'Solar Flare', cost: 2, type: 'attack', target: 'enemy', planet: 'Sun', effects: [{ kind: 'damage', amount: 9 }, { kind: 'status', to: 'target', status: 'burn', amount: 4 }] }),
  kinglyBearing: c({ id: 'kinglyBearing', name: 'Kingly Bearing', cost: 1, type: 'skill', target: 'self', planet: 'Sun', exhaust: true, effects: [{ kind: 'status', to: 'self', status: 'might', amount: 2 }, { kind: 'block', amount: 5 }] }),

  // Moon: healing and flow
  tidecall: c({ id: 'tidecall', name: 'Tidecall', cost: 1, type: 'skill', target: 'self', planet: 'Moon', effects: [{ kind: 'heal', amount: 4 }, { kind: 'block', amount: 4 }] }),
  moonlight: c({ id: 'moonlight', name: 'Moonlight', cost: 1, type: 'skill', target: 'self', planet: 'Moon', effects: [{ kind: 'heal', amount: 3 }, { kind: 'draw', n: 1 }] }),
  ebb: c({ id: 'ebb', name: 'Ebb', cost: 0, type: 'skill', target: 'self', planet: 'Moon', effects: [{ kind: 'block', amount: 4 }] }),
  wane: c({ id: 'wane', name: 'Wane', cost: 1, type: 'skill', target: 'enemy', planet: 'Moon', effects: [{ kind: 'status', to: 'target', status: 'weak', amount: 2 }, { kind: 'heal', amount: 2 }] }),

  // Mars: fast and fierce
  redRush: c({ id: 'redRush', name: 'Red Rush', cost: 1, type: 'attack', target: 'enemy', planet: 'Mars', effects: [{ kind: 'loseHp', amount: 3 }, { kind: 'damage', amount: 14 }] }),
  openWound: c({ id: 'openWound', name: 'Open Wound', cost: 0, type: 'skill', target: 'enemy', planet: 'Mars', effects: [{ kind: 'status', to: 'target', status: 'exposed', amount: 2 }] }),
  twinSpears: c({ id: 'twinSpears', name: 'Twin Spears', cost: 1, type: 'attack', target: 'enemy', planet: 'Mars', effects: [{ kind: 'damage', amount: 4, times: 2 }] }),
  warCry: c({ id: 'warCry', name: 'War Cry', cost: 1, type: 'skill', target: 'self', planet: 'Mars', exhaust: true, effects: [{ kind: 'loseHp', amount: 4 }, { kind: 'status', to: 'self', status: 'might', amount: 3 }] }),

  // Mercury: quick hands, many cards
  quickWit: c({ id: 'quickWit', name: 'Quick Wit', cost: 0, type: 'skill', target: 'self', planet: 'Mercury', effects: [{ kind: 'draw', n: 2 }] }),
  feint: c({ id: 'feint', name: 'Feint', cost: 0, type: 'attack', target: 'enemy', planet: 'Mercury', effects: [{ kind: 'damage', amount: 3 }, { kind: 'draw', n: 1 }] }),
  doubleTalk: c({ id: 'doubleTalk', name: 'Double Talk', cost: 1, type: 'skill', target: 'enemy', planet: 'Mercury', effects: [{ kind: 'status', to: 'target', status: 'weak', amount: 1 }, { kind: 'status', to: 'target', status: 'exposed', amount: 1 }, { kind: 'draw', n: 1 }] }),
  messenger: c({ id: 'messenger', name: 'Messenger', cost: 1, type: 'attack', target: 'enemy', planet: 'Mercury', effects: [{ kind: 'damage', amount: 3, perPlayed: 2, max: 15 }] }),

  // Jupiter: shields and blessings
  gurusShield: c({ id: 'gurusShield', name: "Guru's Shield", cost: 1, type: 'skill', target: 'self', planet: 'Jupiter', effects: [{ kind: 'block', amount: 9 }] }),
  blessing: c({ id: 'blessing', name: 'Blessing', cost: 1, type: 'skill', target: 'self', planet: 'Jupiter', effects: [{ kind: 'block', amount: 6 }, { kind: 'heal', amount: 3 }] }),
  wisdom: c({ id: 'wisdom', name: 'Wisdom', cost: 1, type: 'skill', target: 'self', planet: 'Jupiter', effects: [{ kind: 'draw', n: 2 }, { kind: 'block', amount: 3 }] }),
  thunderbolt: c({ id: 'thunderbolt', name: 'Thunderbolt', cost: 2, type: 'attack', target: 'enemy', planet: 'Jupiter', effects: [{ kind: 'damage', amount: 15 }] }),

  // Venus: charm and grace
  charm: c({ id: 'charm', name: 'Charm', cost: 1, type: 'skill', target: 'enemy', planet: 'Venus', exhaust: true, effects: [{ kind: 'status', to: 'target', status: 'charmed', amount: 1 }] }),
  sweetWords: c({ id: 'sweetWords', name: 'Sweet Words', cost: 1, type: 'skill', target: 'enemy', planet: 'Venus', effects: [{ kind: 'status', to: 'target', status: 'weak', amount: 2 }, { kind: 'block', amount: 3 }] }),
  silkLash: c({ id: 'silkLash', name: 'Silk Lash', cost: 1, type: 'attack', target: 'enemy', planet: 'Venus', effects: [{ kind: 'damage', amount: 5 }, { kind: 'status', to: 'target', status: 'weak', amount: 1 }] }),
  grace: c({ id: 'grace', name: 'Grace', cost: 1, type: 'skill', target: 'self', planet: 'Venus', effects: [{ kind: 'heal', amount: 5 }, { kind: 'cleanse' }] }),

  // Saturn: slow, heavy, lasting
  slowToll: c({ id: 'slowToll', name: 'Slow Toll', cost: 2, type: 'attack', target: 'enemy', planet: 'Saturn', effects: [{ kind: 'damage', amount: 6, perTurn: 4, max: 30 }] }),
  weighDown: c({ id: 'weighDown', name: 'Weigh Down', cost: 1, type: 'skill', target: 'enemy', planet: 'Saturn', effects: [{ kind: 'status', to: 'target', status: 'weak', amount: 2 }] }),
  stoneWall: c({ id: 'stoneWall', name: 'Stone Wall', cost: 2, type: 'skill', target: 'self', planet: 'Saturn', effects: [{ kind: 'block', amount: 16 }] }),
  grind: c({ id: 'grind', name: 'Grind', cost: 1, type: 'attack', target: 'enemy', planet: 'Saturn', effects: [{ kind: 'damage', amount: 3, perTurn: 3, max: 15 }] }),

  // Rahu and Ketu: hunger and release
  eclipse: c({ id: 'eclipse', name: 'Eclipse', cost: 1, type: 'attack', target: 'enemy', planet: 'Rahu', effects: [{ kind: 'loseHp', amount: 2 }, { kind: 'damage', amount: 11 }] }),
  hunger: c({ id: 'hunger', name: 'Hunger', cost: 1, type: 'attack', target: 'enemy', planet: 'Rahu', effects: [{ kind: 'drain', amount: 6 }] }),
  detach: c({ id: 'detach', name: 'Detach', cost: 1, type: 'skill', target: 'self', planet: 'Ketu', effects: [{ kind: 'cleanse' }, { kind: 'block', amount: 5 }] }),
  release: c({ id: 'release', name: 'Release', cost: 0, type: 'skill', target: 'self', planet: 'Ketu', exhaust: true, effects: [{ kind: 'draw', n: 2 }, { kind: 'breath', n: 1 }] }),
};

/* An upgraded card is the same id with a '+': bigger numbers, or one less breath if it has none to grow. */
export function upgradeDef(d: CardDef): CardDef {
  let grew = false;
  const effects = d.effects.map((e): Effect => {
    switch (e.kind) {
      case 'damage': grew = true; return e.times && e.times > 1 ? { ...e, amount: e.amount + 1 } : e.perTurn || e.perPlayed ? { ...e, amount: e.amount + 2, ...(e.max ? { max: e.max + 4 } : {}) } : { ...e, amount: e.amount + 3 };
      case 'drain': grew = true; return { ...e, amount: e.amount + 3 };
      case 'block': grew = true; return { ...e, amount: e.amount + 3 };
      case 'heal': grew = true; return { ...e, amount: e.amount + 2 };
      case 'status': if (e.status === 'charmed') return e; grew = true; return { ...e, amount: e.amount + 1 };
      case 'draw': if (d.cost === 0) { grew = true; return { ...e, n: e.n + 1 }; } return e;
      default: return e;
    }
  });
  return { ...d, id: `${d.id}+`, name: `${d.name}+`, effects, cost: grew ? d.cost : Math.max(0, d.cost - 1) };
}

const UPGRADED: Record<string, CardDef> = {};
/* Every card by id; 'strike+' gives the upgraded Strike. */
export const CARDS: Record<string, CardDef> = new Proxy(BASE, {
  get(t, k) {
    if (typeof k !== 'string') return undefined;
    if (k in t) return t[k];
    if (k.endsWith('+') && k.slice(0, -1) in t) return (UPGRADED[k] ??= upgradeDef(t[k.slice(0, -1)]));
    return undefined;
  },
});
export const isUpgraded = (id: string) => id.endsWith('+');
export const BASE_IDS = () => Object.keys(BASE);

/* Each class: its signature card, and the two cards of its planet it starts with. */
export const CLASS_CARDS: Record<string, [string, string, string]> = {
  Sun: ['noon', 'ember', 'kinglyBearing'],
  Moon: ['tidecall', 'moonlight', 'wane'],
  Mars: ['redRush', 'twinSpears', 'openWound'],
  Mercury: ['quickWit', 'feint', 'doubleTalk'],
  Jupiter: ['gurusShield', 'blessing', 'wisdom'],
  Venus: ['charm', 'silkLash', 'sweetWords'],
  Saturn: ['slowToll', 'weighDown', 'grind'],
};
export const SIGNATURE: Record<string, string> = Object.fromEntries(Object.entries(CLASS_CARDS).map(([k, v]) => [k, v[0]]));

export function starterDeck(ruler: string): string[] {
  return ['strike', 'strike', 'strike', 'strike', 'guard', 'guard', 'guard', 'guard', ...CLASS_CARDS[ruler]];
}

/* The best card a planet can lend you for one fight (today's sky blessing). */
export const GIFT_CARD: Record<string, string> = {
  Sun: 'solarFlare', Moon: 'tidecall', Mars: 'twinSpears', Mercury: 'quickWit', Jupiter: 'thunderbolt',
  Venus: 'grace', Saturn: 'stoneWall', Rahu: 'hunger', Ketu: 'release',
};

export const STATUS_INFO: Record<StatusId, { name: string; text: string }> = {
  burn: { name: 'Burn', text: 'Takes this much damage at the start of its turn, through block, then burn drops by 1.' },
  weak: { name: 'Weak', text: 'Deals a quarter less attack damage. Drops by 1 each turn.' },
  exposed: { name: 'Exposed', text: 'Takes half again as much attack damage. Drops by 1 each turn.' },
  might: { name: 'Might', text: 'Adds this much to every attack, for the whole fight.' },
  charmed: { name: 'Charmed', text: 'Skips its next action.' },
};

/* What a card says, worked out for the turn it is in. */
export function cardText(def: CardDef, turn = 1, played = 0): string {
  return def.effects.map(e => {
    switch (e.kind) {
      case 'damage': {
        if (e.perTurn) {
          const now = Math.min(e.max ?? Infinity, e.amount + e.perTurn * (turn - 1));
          return `Deal ${now} damage. Grows by ${e.perTurn} each turn${e.max ? `, up to ${e.max}` : ''}.`;
        }
        if (e.perPlayed) {
          const now = Math.min(e.max ?? Infinity, e.amount + e.perPlayed * played);
          return `Deal ${now} damage. Plus ${e.perPlayed} for each card played before it this turn.`;
        }
        return `Deal ${e.amount} damage${e.times && e.times > 1 ? ` ${e.times} times` : ''}.`;
      }
      case 'block': return `Gain ${e.amount} block.`;
      case 'status': return e.status === 'charmed' ? 'The enemy skips its next action.' : `${e.to === 'self' ? 'Gain' : 'Give'} ${e.amount} ${STATUS_INFO[e.status].name.toLowerCase()}.`;
      case 'draw': return `Draw ${e.n} card${e.n > 1 ? 's' : ''}.`;
      case 'heal': return `Heal ${e.amount}.`;
      case 'loseHp': return `Lose ${e.amount} health.`;
      case 'breath': return `Gain ${e.n} breath.`;
      case 'drain': return `Deal ${e.amount} damage and heal what gets through.`;
      case 'cleanse': return 'Clear your burn, weak and exposed.';
    }
  }).join(' ') + (def.exhaust ? ' Used up.' : '');
}
