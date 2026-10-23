import { GAME_CONFIG } from '../data/config.js';
import { clamp, recalculatePlayerDerivedStats } from '../core/GameState.js';

// ctx = { bus }
export function handleMovement(state, input, dt) {
  let mx = 0, my = 0;
  if (input.moveUp) my -= 1;
  if (input.moveDown) my += 1;
  if (input.moveLeft) mx -= 1;
  if (input.moveRight) mx += 1;
  if (input.touchActive) { mx += input.touchX; my += input.touchY; }
  const len = Math.hypot(mx, my) || 1;
  const dash = state.timeMs < state.player.dashUntilMs ? GAME_CONFIG.player.dashMultiplier : 1;
  const p = state.player;
  p.position.x += (mx / len) * p.speed * dash * dt;
  p.position.y += (my / len) * p.speed * dash * dt;
  p.position.x = clamp(p.position.x, p.width / 2, state.world.width - p.width / 2);
  p.position.y = clamp(p.position.y, p.height / 2, state.world.height - p.height / 2);
  p.stamina = Math.min(GAME_CONFIG.player.maxStamina, p.stamina + GAME_CONFIG.player.staminaRegen * dt);
}

export function tryDash(state, ctx) {
  const p = state.player;
  if (state.timeMs < p.dashCooldownUntilMs || p.stamina < GAME_CONFIG.player.dashCost) return;
  p.stamina -= GAME_CONFIG.player.dashCost;
  p.dashUntilMs = state.timeMs + 180;
  p.dashCooldownUntilMs = state.timeMs + GAME_CONFIG.player.dashCooldown;
  state.run.shake = Math.max(state.run.shake, 6);
  ctx.bus.emit('sfx:dash');
}

export function damagePlayer(state, amount, ctx) {
  const p = state.player;
  if (state.timeMs - p.lastDamageAtMs < GAME_CONFIG.player.invulnerabilityMs) return;
  let incoming = amount;
  if (p.shield > 0) { const a = Math.min(p.shield, incoming); p.shield -= a; incoming -= a; }
  if (incoming > 0) p.health -= incoming;
  p.lastDamageAtMs = state.timeMs;
  state.run.damageFlashUntilMs = state.timeMs + 120;
  state.run.shake = Math.max(state.run.shake, 5);
  ctx.bus.emit('sfx:hit');
  if (p.health <= 0) ctx.onGameOver();
}

export function applyDerivedStats(state) {
  recalculatePlayerDerivedStats(state);
}
