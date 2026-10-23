import { queryByKind, removeEntity } from '../core/EntityStore.js';

function updateSet(state, dt, faction) {
  for (const p of [...queryByKind(state.store, 'projectile')]) {
    if (p.data.faction !== faction) continue;
    p.position.x += p.data.dx * p.data.speed * dt;
    p.position.y += p.data.dy * p.data.speed * dt;
    p.data.life -= dt;
    if (p.data.life <= 0 || p.position.x < -30 || p.position.y < -30 || p.position.x > state.world.width + 30 || p.position.y > state.world.height + 30) {
      removeEntity(state.store, p);
    }
  }
}

export function updateProjectiles(state, dt) {
  updateSet(state, dt, 'player');
  updateSet(state, dt, 'enemy');
}
