import { GAME_CONFIG } from '../data/config.js';
import { circleHit } from '../core/GameState.js';
import { queryByKind, removeEntity, makeEntity, spawnEntity } from '../core/EntityStore.js';
import { spawnPickup, applyPickup } from './PickupSystem.js';
import { damagePlayer } from './PlayerSystem.js';

// ctx = { rng, bus, onGameOver }
export function handleCollisions(state, ctx) {
  const enemies = queryByKind(state.store, 'enemy');
  for (const proj of [...queryByKind(state.store, 'projectile')].filter((p) => p.data.faction === 'player')) {
    let consumed = false;
    for (const enemy of [...enemies]) {
      if (!state.store.entities.includes(enemy)) continue;
      if (!circleHit(proj.position.x, proj.position.y, proj.radius, enemy.position.x, enemy.position.y, enemy.radius)) continue;
      enemy.health -= proj.data.damage;
      enemy.data.hitFlashUntilMs = state.timeMs + GAME_CONFIG.visuals.hitFlashMs;
      spawnHitParticles(state, enemy.position.x, enemy.position.y, proj.data.crit ? 16 : 7, '#ffffff', ctx);
      state.run.shake = Math.max(state.run.shake, proj.data.crit ? 8 : 3);
      if (enemy.health <= 0) killEnemy(state, enemy, ctx);
      if (proj.data.pierce > 0) proj.data.pierce -= 1;
      else consumed = true;
      break;
    }
    if (consumed) removeEntity(state.store, proj);
  }
  for (const proj of [...queryByKind(state.store, 'projectile')].filter((p) => p.data.faction === 'enemy')) {
    if (circleHit(proj.position.x, proj.position.y, proj.radius, state.player.position.x, state.player.position.y, state.player.width / 2)) {
      removeEntity(state.store, proj);
      damagePlayer(state, proj.data.damage, ctx);
    }
  }
  for (const enemy of [...queryByKind(state.store, 'enemy')]) {
    if (circleHit(enemy.position.x, enemy.position.y, enemy.radius, state.player.position.x, state.player.position.y, state.player.width * 0.45)) {
      removeEntity(state.store, enemy);
      damagePlayer(state, enemy.data.touchDamage, ctx);
      if (enemy.typeId === 'exploder') triggerExplosion(state, enemy.position.x, enemy.position.y, enemy.data.explosionRadius, enemy.data.explosionDamage, ctx);
    }
  }
  for (const pickup of [...queryByKind(state.store, 'pickup')]) {
    if (circleHit(state.player.position.x, state.player.position.y, state.player.width / 2, pickup.position.x, pickup.position.y, pickup.radius)) {
      applyPickup(state, pickup, ctx);
      removeEntity(state.store, pickup);
    }
  }
}

export function killEnemy(state, enemy, ctx) {
  removeEntity(state.store, enemy);
  state.run.kills += 1;
  state.wave.killed += 1;
  state.run.killsInWave += 1;
  state.run.score += enemy.data.score;
  state.player.coins += enemy.data.value;
  if (enemy.typeId === 'exploder') triggerExplosion(state, enemy.position.x, enemy.position.y, enemy.data.explosionRadius, enemy.data.explosionDamage, ctx, false);
  if (ctx.rng() < GAME_CONFIG.drops.baseChance) spawnPickup(state, enemy.position.x, enemy.position.y, ctx);
  ctx.bus.emit('sfx:kill');
}

export function triggerExplosion(state, x, y, radius, damage, ctx, hurtsEnemies = true) {
  state.run.shake = Math.max(state.run.shake, 12);
  spawnHitParticles(state, x, y, 20, '#ff922b', ctx);
  ctx.bus.emit('sfx:explosion');
  if (circleHit(x, y, radius, state.player.position.x, state.player.position.y, state.player.width / 2)) {
    damagePlayer(state, damage, ctx);
  }
  if (hurtsEnemies) {
    for (const enemy of queryByKind(state.store, 'enemy')) {
      if (circleHit(x, y, radius, enemy.position.x, enemy.position.y, enemy.radius)) enemy.health -= damage * 0.7;
    }
  }
}

export function spawnHitParticles(state, x, y, count, color, ctx) {
  for (let i = 0; i < count; i++) {
    const angle = ctx.rng() * Math.PI * 2;
    const speed = 40 + ctx.rng() * 200;
    const life = 0.2 + ctx.rng() * 0.35;
    spawnEntity(state.store, makeEntity('particle', 'hit', x, y, {
      radius: 0,
      data: { dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, size: 2 + ctx.rng() * 3, life, maxLife: life, color }
    }));
  }
}

export function updateParticles(state, dt) {
  for (const p of [...queryByKind(state.store, 'particle')]) {
    p.position.x += p.data.dx * dt;
    p.position.y += p.data.dy * dt;
    p.data.life -= dt;
    if (p.data.life <= 0) removeEntity(state.store, p);
  }
  state.run.shake *= GAME_CONFIG.visuals.screenShakeDecay;
}
