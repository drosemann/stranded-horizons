import { GAME_CONFIG } from '../data/config.js';
import { queryByKind, removeEntity, makeEntity, spawnEntity } from '../core/EntityStore.js';
import { circleHit } from '../core/GameState.js';

// ctx = { rng, bus }
export function updatePickups(state, dt) {
  for (const pickup of queryByKind(state.store, 'pickup')) {
    pickup.data.ttl -= dt;
    const dx = state.player.position.x - pickup.position.x;
    const dy = state.player.position.y - pickup.position.y;
    const dist = Math.hypot(dx, dy) || 1;
    const magnetBonus = state.activeBuffs.some((b) => b.id === 'magnet') ? 110 : 0;
    if (dist < state.player.pickupRadius + magnetBonus) {
      pickup.position.x += (dx / dist) * 290 * dt;
      pickup.position.y += (dy / dist) * 290 * dt;
    }
    if (pickup.data.ttl <= 0) removeEntity(state.store, pickup);
  }
}

export function updateBuffs(state) {
  state.activeBuffs = state.activeBuffs.filter((b) => b.endsAtMs > state.timeMs);
}

const POOL = ['heal', 'shield', 'speed', 'doubleDamage', 'piercingShots', 'magnet', 'coins'];

export function spawnPickup(state, x, y, ctx) {
  const id = POOL[Math.floor(ctx.rng() * POOL.length)];
  spawnEntity(state.store, makeEntity('pickup', id, x, y, { radius: 12, data: { ttl: 16 } }));
}

export function applyPickup(state, pickup, ctx) {
  if (pickup.typeId === 'coins') { state.player.coins += GAME_CONFIG.drops.coinBurst; return; }
  if (pickup.typeId === 'heal') {
    state.player.health = Math.min(state.player.maxHealth, state.player.health + 45);
    return;
  }
  if (pickup.typeId === 'shield') {
    state.player.shield = Math.min(60, state.player.shield + 28);
    return;
  }
  state.activeBuffs = state.activeBuffs.filter((b) => b.id !== pickup.typeId);
  state.activeBuffs.push({ id: pickup.typeId, endsAtMs: state.timeMs + GAME_CONFIG.drops.durationMs });
  ctx.bus.emit('sfx:pickup');
}
