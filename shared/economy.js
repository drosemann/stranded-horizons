// Balanced starter economy. Tick = 2s. All rates per-tick, server-side only.
// Efficiency scales OUTPUTS only, never costs: out * (efficiency / 100).
export const TICK_SECONDS = 2;
export const RESOURCES = ['iron', 'energy', 'components', 'credits'];

export const STARTING = { iron: 40, energy: 20, components: 0, credits: 100 };

// Balance rationale:
// - Centre base (100%): 1 mine + 1 solar + 1 factory nets +1 component / 2s.
//   Factory costs 60 iron + 150 credits -> ~6 min from start, a good first goal.
// - Edge base (30%): same setup nets +0.3 components / tick -> ~3x slower,
//   pushing edge players toward faction links (+10) and the booster (+10).
// - Credits trickle: every completed wave-equivalent tick batch grants credits
//   via the server (see server/src/tick.js), so the booster is earnable in-game.
export const BUILDINGS = {
  mine: {
    cost: { credits: 50 }, upkeep: {},
    output: { iron: 1.0 }, desc: 'Produces iron',
  },
  solar: {
    cost: { credits: 40 }, upkeep: {},
    output: { energy: 2.0 }, desc: 'Produces energy',
  },
  conveyor: {
    cost: { iron: 10, credits: 20 }, upkeep: {},
    output: {}, desc: 'Reserves grid, chain bonus in later phase',
  },
  factory: {
    cost: { iron: 60, credits: 150 },
    upkeep: { iron: 2.0, energy: 3.0 },
    output: { components: 1.0 }, desc: '2 iron + 3 energy -> 1 component per tick',
  },
  wall: {
    cost: { iron: 15, credits: 10 }, upkeep: {},
    output: {}, desc: 'Static defence (v1: no behaviour, reserves grid)',
  },
  turret: {
    cost: { iron: 40, credits: 120 }, upkeep: { energy: 1.0 },
    output: {}, desc: 'Static defence (v1: no behaviour, reserves grid)',
  },
};

// Efficiency booster: IN-GAME CURRENCY ONLY. No real money anywhere.
// +10% efficiency for 7 days, costs 500 credits, max one active,
// 7-day cooldown after expiry, total efficiency hard-capped at 100.
export const BOOSTER = { costCredits: 500, bonusPct: 10, durationDays: 7, cooldownDays: 7 };

// Credits drip: server grants this many credits per production tick
// once the player owns at least one factory (rewards progression).
export const CREDITS_DRIP = { perTick: 0.5, requiresFactory: true };
