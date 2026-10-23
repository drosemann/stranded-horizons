import { WEAPONS } from './weapons.js';
import { ENEMY_TYPES } from './enemies.js';

export const GAME_CONFIG = {
  player: { width: 46, height: 46, baseSpeed: 280, baseHealth: 180, maxStamina: 100, staminaRegen: 20, dashCost: 35, dashCooldown: 650, dashMultiplier: 3, invulnerabilityMs: 300 },
  weapons: WEAPONS,
  enemyTypes: ENEMY_TYPES,
  wave: { preparationDuration: 8000, baseCount: 8, growthPerWave: 4, baseSpawnInterval: 1200, minSpawnInterval: 350 },
  drops: { baseChance: 0.24, durationMs: 7000, coinBurst: 14 },
  visuals: { hitFlashMs: 120, deathFadeMs: 1400, screenShakeDecay: 0.84 }
};
