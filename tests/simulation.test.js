import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMeta, sanitizeBestRun } from '../src/persistence/MetaStore.js';
import { createInitialState, resetRun, getWaveKillTarget, syncWeaponState, currentWeapon } from '../src/core/GameState.js';
import { mulberry32 } from '../src/core/rng.js';
import { createEventBus } from '../src/core/EventBus.js';
import { updateWave, beginWave } from '../src/simulation/WaveSystem.js';
import { tryShoot } from '../src/simulation/WeaponSystem.js';
import { levelCost } from '../src/data/upgrades.js';

const meta = { credits: 0, survivor: 0, prospector: 0, arsenal: 0, veteran: 0 };

function makeState(seed = 1) {
  const s = createInitialState({ width: 800, height: 600 }, { ...meta });
  resetRun(s, s.meta, s.world, 0, false);
  s.phase = 'playing';
  const rng = mulberry32(seed);
  const bus = createEventBus();
  return { s, ctx: { rng, bus, persistMeta: () => {}, onGameOver: () => { s.phase = 'gameover'; } } };
}

test('wave kill target formula', () => {
  assert.equal(getWaveKillTarget(1), 8);
  assert.equal(getWaveKillTarget(2), 12);
  assert.equal(getWaveKillTarget(5), 24);
});

test('shop cost curve', () => {
  assert.equal(levelCost(45, 1.38, 0), 45);
  assert.equal(levelCost(45, 1.38, 1), 62);
});

test('pistol fires and consumes ammo', () => {
  const { s, ctx } = makeState();
  s.player.ammoInMag = 14;
  s.player.lastShotAtMs = -9999;
  s.timeMs = 1000;
  const before = s.store.entities.length;
  tryShoot(s, { x: s.player.position.x + 100, y: s.player.position.y }, ctx);
  assert.equal(s.player.ammoInMag, 13);
  assert.ok(s.store.entities.length > before);
});

test('reload refills magazine', () => {
  const { s, ctx } = makeState();
  syncWeaponState(s, true);
  const weapon = currentWeapon(s);
  assert.equal(s.player.ammoInMag, weapon.ammoCapacity);
});

test('wave begins and spawns deterministically', () => {
  const a = makeState(42); const b = makeState(42);
  beginWave(a.s, 1, a.ctx); beginWave(b.s, 1, b.ctx);
  for (let i = 0; i < 600; i++) {
    a.s.timeMs += 16.7; b.s.timeMs += 16.7;
    updateWave(a.s, a.ctx); updateWave(b.s, b.ctx);
  }
  assert.equal(a.s.wave.spawned, b.s.wave.spawned);
  assert.ok(a.s.wave.spawned > 0);
});

test('sanitizers reject corrupt saves', () => {
  assert.deepEqual(sanitizeMeta(null), { credits: 0, survivor: 0, prospector: 0, arsenal: 0, veteran: 0 });
  assert.deepEqual(sanitizeMeta({ credits: 99999999 }), { credits: 0, survivor: 0, prospector: 0, arsenal: 0, veteran: 0 });
  assert.equal(sanitizeBestRun(null), null);
  assert.equal(sanitizeBestRun({ score: 10 }).wave, 1);
});
