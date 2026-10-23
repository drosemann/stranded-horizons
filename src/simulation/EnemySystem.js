import { GAME_CONFIG } from '../data/config.js';
import { makeEntity, spawnEntity, queryByKind } from '../core/EntityStore.js';

export function getSpawnPosition(state, padding, rng) {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: rng() * state.world.width, y: -padding };
  if (side === 1) return { x: state.world.width + padding, y: rng() * state.world.height };
  if (side === 2) return { x: rng() * state.world.width, y: state.world.height + padding };
  return { x: -padding, y: rng() * state.world.height };
}

export function pickEnemyType(waveNo, rng) {
  const roll = rng();
  let typeId = 'basic';
  if (waveNo > 1 && roll < 0.25 + waveNo * 0.01) typeId = 'fast';
  if (waveNo > 2 && roll > 0.7) typeId = 'tank';
  if (waveNo > 3 && roll > 0.45 && roll < 0.64) typeId = 'ranged';
  if (waveNo > 5 && roll > 0.87) typeId = 'exploder';
  return typeId;
}

export function spawnEnemyForWave(state, ctx) {
  const typeId = pickEnemyType(state.run.wave, ctx.rng);
  const type = GAME_CONFIG.enemyTypes[typeId];
  const spawn = getSpawnPosition(state, type.size, ctx.rng);
  const hpScale = 1 + state.run.wave * 0.12;
  spawnEntity(state.store, makeEntity('enemy', typeId, spawn.x, spawn.y, {
    radius: type.size / 2,
    health: type.health * hpScale, maxHealth: type.health * hpScale,
    data: {
      speed: type.speed * (1 + state.run.wave * 0.03),
      touchDamage: type.touchDamage,
      value: Math.floor(type.value * (1 + state.run.wave * 0.1)),
      score: Math.floor(type.score * (1 + state.run.wave * 0.08)),
      preferredRange: type.preferredRange || 0,
      shootInterval: type.shootInterval || 0,
      projectileSpeed: type.projectileSpeed || 0,
      projectileDamage: type.projectileDamage || 0,
      explosionRadius: type.explosionRadius || 0,
      explosionDamage: type.explosionDamage || 0,
      nextShotAtMs: state.timeMs + 650, hitFlashUntilMs: 0
    }
  }));
  state.wave.spawned += 1;
}

export function updateEnemies(state, dt, ctx) {
  for (const enemy of queryByKind(state.store, 'enemy')) {
    const dx = state.player.position.x - enemy.position.x;
    const dy = state.player.position.y - enemy.position.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (enemy.typeId === 'ranged' && dist < enemy.data.preferredRange * 0.85) {
      enemy.position.x -= (dx / dist) * enemy.data.speed * dt * 0.75;
      enemy.position.y -= (dy / dist) * enemy.data.speed * dt * 0.75;
    } else {
      enemy.position.x += (dx / dist) * enemy.data.speed * dt;
      enemy.position.y += (dy / dist) * enemy.data.speed * dt;
    }
    if (enemy.typeId === 'ranged' && state.timeMs >= enemy.data.nextShotAtMs) {
      spawnEntity(state.store, makeEntity('projectile', 'enemy', enemy.position.x, enemy.position.y, {
        radius: 7,
        data: { faction: 'enemy', dx: dx / dist, dy: dy / dist, speed: enemy.data.projectileSpeed, damage: enemy.data.projectileDamage, life: 2.8 }
      }));
      enemy.data.nextShotAtMs = state.timeMs + enemy.data.shootInterval;
      ctx.bus.emit('sfx:enemyShoot');
    }
  }
}
