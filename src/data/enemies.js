// Enemy type definitions. Values byte-identical to GAME_CONFIG.enemyTypes in legacy game.js.
export const ENEMY_TYPES = {
  basic: { name: 'Basic', color: '#f06595', size: 44, speed: 95, health: 50, touchDamage: 12, value: 14, score: 12 },
  fast: { name: 'Fast', color: '#ffe066', size: 32, speed: 170, health: 30, touchDamage: 9, value: 12, score: 14 },
  tank: { name: 'Tank', color: '#74c0fc', size: 56, speed: 62, health: 155, touchDamage: 22, value: 30, score: 28 },
  ranged: { name: 'Ranged', color: '#63e6be', size: 40, speed: 78, health: 60, touchDamage: 10, value: 20, score: 18, preferredRange: 220, shootInterval: 1600, projectileSpeed: 280, projectileDamage: 12 },
  exploder: { name: 'Exploder', color: '#ff922b', size: 38, speed: 115, health: 45, touchDamage: 16, value: 24, score: 22, explosionRadius: 96, explosionDamage: 28 }
};
