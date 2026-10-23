import { SHOP_DEFS, META_DEFS, levelCost } from '../data/upgrades.js';
import { recalculatePlayerDerivedStats } from '../core/GameState.js';

// Pure purchase logic. Returns true on success. UI only renders defs.
export function buyShopUpgrade(state, id, ctx) {
  if (!(state.phase === 'playing' || state.phase === 'waveComplete')) return false;
  const def = SHOP_DEFS.find((d) => d.id === id);
  if (!def) return false;
  const lvl = state.runUpgrades[id] ?? 0;
  const cost = levelCost(def.baseCost, def.scale, lvl);
  if (state.player.coins < cost) return false;
  state.player.coins -= cost;
  state.runUpgrades[id] = lvl + 1;
  recalculatePlayerDerivedStats(state);
  ctx.bus.emit('sfx:buy');
  return true;
}

export function buyMetaUpgrade(state, id, ctx) {
  const def = META_DEFS.find((d) => d.id === id);
  if (!def) return false;
  const level = state.meta[id] || 0;
  if (level >= def.maxLevel) return false;
  const cost = levelCost(def.baseCost, def.scale, level);
  if (state.meta.credits < cost) return false;
  state.meta.credits -= cost;
  state.meta[id] = level + 1;
  ctx.persistMeta();
  ctx.bus.emit('sfx:buy');
  return true;
}
