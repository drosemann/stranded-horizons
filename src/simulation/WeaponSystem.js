import { currentWeapon, syncWeaponState } from '../core/GameState.js';
import { makeEntity, spawnEntity } from '../core/EntityStore.js';

// ctx = { rng, bus }
export function switchWeapon(state, ctx) {
  state.player.weaponIndex = (state.player.weaponIndex + 1) % state.player.weaponIds.length;
  syncWeaponState(state, true);
  ctx.bus.emit('sfx:ui');
}

export function startReload(state, ctx) {
  const weapon = currentWeapon(state);
  const cap = Math.round(weapon.ammoCapacity * (1 + state.runUpgrades.ammoCap * 0.1));
  if (state.player.ammoInMag >= cap || state.timeMs < state.player.reloadUntilMs) return;
  const mult = 1 - Math.min(0.45, state.runUpgrades.reload * 0.06);
  state.player.reloadUntilMs = state.timeMs + weapon.reloadTime * mult;
  ctx.bus.emit('sfx:reload');
}

export function finishReloadIfNeeded(state, ctx) {
  if (state.player.reloadUntilMs > 0 && state.timeMs >= state.player.reloadUntilMs) {
    state.player.reloadUntilMs = 0;
    syncWeaponState(state, true);
    ctx.bus.emit('sfx:reloaded');
  }
}

function damageMult(state) {
  return state.activeBuffs.some((b) => b.id === 'doubleDamage') ? 2 : 1;
}
function pierceBonus(state) {
  return state.activeBuffs.some((b) => b.id === 'piercingShots') ? 2 : 0;
}

export function tryShoot(state, aimWorld, ctx) {
  const weapon = currentWeapon(state);
  const fireScale = 1 - Math.min(0.55, state.runUpgrades.fireRate * 0.05);
  if (state.timeMs - state.player.lastShotAtMs < weapon.fireInterval * fireScale) return;
  if (state.player.reloadUntilMs > 0) return;
  if (state.player.ammoInMag <= 0) { startReload(state, ctx); return; }
  const baseAngle = Math.atan2(aimWorld.y - state.player.position.y, aimWorld.x - state.player.position.x);
  for (let i = 0; i < weapon.pellets; i++) {
    const angle = baseAngle + weapon.spread * (ctx.rng() - 0.5);
    const crit = ctx.rng() < Math.min(0.45, state.runUpgrades.critChance * 0.035);
    const damage = state.player.baseDamage * (1 + state.runUpgrades.damage * 0.15) * weapon.damageMult * (crit ? 2 : 1) * damageMult(state);
    spawnEntity(state.store, makeEntity('projectile', 'player', state.player.position.x, state.player.position.y, {
      radius: weapon.projectileSize,
      data: { faction: 'player', dx: Math.cos(angle), dy: Math.sin(angle), speed: weapon.projectileSpeed, damage, life: weapon.projectileLife, pierce: weapon.pierce + pierceBonus(state), splashRadius: weapon.splashRadius, crit }
    }));
  }
  state.player.ammoInMag -= 1;
  state.player.lastShotAtMs = state.timeMs;
  ctx.bus.emit('sfx:shoot', { weapon: weapon.id });
  if (state.player.ammoInMag <= 0) startReload(state, ctx);
}
