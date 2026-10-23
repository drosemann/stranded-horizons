import { GAME_CONFIG } from '../data/config.js';
import { createEntityStore } from './EntityStore.js';

export function createInitialState(world, meta) {
  return {
    phase: 'init',
    timeMs: 0,
    world: { width: world.width, height: world.height },
    player: null, run: null, runUpgrades: null, wave: null,
    activeBuffs: [], meta,
    store: createEntityStore()
  };
}

// Mirrors legacy resetRun(). nowMs injected (was performance.now()).
export function resetRun(state, meta, world, nowMs, fullPrep) {
  const prep = fullPrep ? GAME_CONFIG.wave.preparationDuration : 1200;
  state.run = { score: 0, kills: 0, elapsedMs: 0, wave: 1, coins: 0, shake: 0, killsInWave: 0, damageFlashUntilMs: 0 };
  state.runUpgrades = { speed: 0, damage: 0, maxHealth: 0, fireRate: 0, critChance: 0, ammoCap: 0, reload: 0, pickupRadius: 0 };
  state.player = {
    position: { x: world.width / 2, y: world.height / 2, z: 0 }, velocity: { x: 0, y: 0 },
    width: GAME_CONFIG.player.width, height: GAME_CONFIG.player.height,
    speed: GAME_CONFIG.player.baseSpeed,
    maxHealth: GAME_CONFIG.player.baseHealth + meta.survivor * 10,
    health: GAME_CONFIG.player.baseHealth + meta.survivor * 10,
    stamina: GAME_CONFIG.player.maxStamina,
    coins: meta.prospector * 15,
    baseDamage: 16 * (1 + meta.veteran * 0.04),
    pickupRadius: 70, shield: 0, reloadUntilMs: 0,
    weaponIds: meta.arsenal > 0 ? ['pistol', 'shotgun'] : ['pistol'],
    weaponIndex: 0, ammoInMag: 0, lastShotAtMs: -9999, lastDamageAtMs: -9999,
    dashUntilMs: -9999, dashCooldownUntilMs: -9999
  };
  state.wave = { status: 'prep', prepEndAtMs: nowMs + prep, targetKills: getWaveKillTarget(1), spawned: 0, killed: 0, nextSpawnAtMs: 0, spawnInterval: GAME_CONFIG.wave.baseSpawnInterval };
  state.activeBuffs = [];
  state.store.entities.length = 0;
  syncWeaponState(state, true);
}

export function getWaveKillTarget(waveNumber) {
  return GAME_CONFIG.wave.baseCount + (waveNumber - 1) * GAME_CONFIG.wave.growthPerWave;
}

export function currentWeapon(state) {
  return GAME_CONFIG.weapons[state.player.weaponIds[state.player.weaponIndex]];
}

export function syncWeaponState(state, forceFill = false) {
  const weapon = currentWeapon(state);
  const cap = Math.round(weapon.ammoCapacity * (1 + state.runUpgrades.ammoCap * 0.1));
  if (forceFill || state.player.ammoInMag > cap) state.player.ammoInMag = cap;
}

export function recalculatePlayerDerivedStats(state) {
  state.player.speed = GAME_CONFIG.player.baseSpeed * (1 + state.runUpgrades.speed * 0.08);
  state.player.maxHealth = GAME_CONFIG.player.baseHealth + state.meta.survivor * 10 + state.runUpgrades.maxHealth * 14;
  state.player.health = Math.min(state.player.health, state.player.maxHealth);
  state.player.pickupRadius = 70 + state.runUpgrades.pickupRadius * 16;
  syncWeaponState(state);
}

export function circleHit(x1, y1, r1, x2, y2, r2) {
  return Math.hypot(x2 - x1, y2 - y1) <= r1 + r2;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
