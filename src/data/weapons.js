// Weapon definitions. Values byte-identical to GAME_CONFIG.weapons in legacy game.js.
export const WEAPONS = {
  pistol: { id: 'pistol', name: 'Pistol', fireInterval: 280, projectileSpeed: 700, projectileSize: 8, projectileLife: 1.4, ammoCapacity: 14, reloadTime: 950, pellets: 1, spread: 0, pierce: 0, splashRadius: 0, damageMult: 1 },
  shotgun: { id: 'shotgun', name: 'Shotgun', fireInterval: 700, projectileSpeed: 560, projectileSize: 7, projectileLife: 0.75, ammoCapacity: 6, reloadTime: 1250, pellets: 5, spread: 0.24, pierce: 0, splashRadius: 0, damageMult: 0.7 },
  railgun: { id: 'railgun', name: 'Railgun', fireInterval: 620, projectileSpeed: 860, projectileSize: 10, projectileLife: 1.6, ammoCapacity: 4, reloadTime: 1450, pellets: 1, spread: 0, pierce: 3, splashRadius: 0, damageMult: 2.2 }
};
