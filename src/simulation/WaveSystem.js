import { GAME_CONFIG } from '../data/config.js';
import { getWaveKillTarget } from '../core/GameState.js';
import { spawnEnemyForWave } from './EnemySystem.js';

// ctx = { bus }
export function updateWave(state, ctx) {
  if (state.wave.status === 'prep' && state.timeMs >= state.wave.prepEndAtMs) {
    beginWave(state, state.run.wave, ctx);
  }
  const waveActive = state.wave.status === 'active';
  if (waveActive && state.timeMs >= state.wave.nextSpawnAtMs && state.wave.spawned < state.wave.targetKills) {
    spawnEnemyForWave(state, ctx);
    state.wave.spawnInterval = Math.max(GAME_CONFIG.wave.minSpawnInterval, GAME_CONFIG.wave.baseSpawnInterval - state.run.wave * 65);
    state.wave.nextSpawnAtMs = state.timeMs + state.wave.spawnInterval;
  }
  const remaining = state.store.entities.filter((e) => e.kind === 'enemy').length;
  if (waveActive && state.wave.killed >= state.wave.targetKills && remaining === 0) {
    completeWave(state, ctx);
  }
}

export function beginWave(state, waveNumber, ctx) {
  state.run.wave = waveNumber;
  state.wave.status = 'active';
  state.wave.targetKills = getWaveKillTarget(waveNumber);
  state.wave.spawned = 0;
  state.wave.killed = 0;
  state.wave.nextSpawnAtMs = state.timeMs + 400;
  state.wave.spawnInterval = Math.max(GAME_CONFIG.wave.minSpawnInterval, GAME_CONFIG.wave.baseSpawnInterval - waveNumber * 65);
  if (waveNumber === 4 && !state.player.weaponIds.includes('shotgun')) state.player.weaponIds.push('shotgun');
  if (waveNumber === 7 && !state.player.weaponIds.includes('railgun')) state.player.weaponIds.push('railgun');
  ctx.bus.emit('ui:waveStatus', 'Wave active — survive and clear enemies.');
}

export function beginNextWave(state, ctx) {
  ctx.bus.emit('ui:hideWaveComplete');
  state.phase = 'playing';
  beginWave(state, state.run.wave + 1, ctx);
}

export function completeWave(state, ctx) {
  const bonus = 35 + state.run.wave * 12;
  state.player.coins += bonus;
  state.wave.status = 'prep';
  state.wave.prepEndAtMs = state.timeMs + GAME_CONFIG.wave.preparationDuration;
  state.phase = 'waveComplete';
  ctx.bus.emit('sfx:waveClear');
  ctx.bus.emit('ui:waveComplete', bonus);
}
