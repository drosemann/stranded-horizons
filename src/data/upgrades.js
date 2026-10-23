// Shop / meta upgrade definitions as pure data (no closures).
// Costs match legacy baseShopDefinitions/metaUpgradeDefs: cost = floor(baseCost * scale^level).
export const SHOP_DEFS = [
  { id: 'speed', label: 'Movement Speed', baseCost: 45, scale: 1.38, tooltip: 'Run 8% faster pro level.' },
  { id: 'damage', label: 'Weapon Damage', baseCost: 55, scale: 1.45, tooltip: 'Increase base projectile damage.' },
  { id: 'maxHealth', label: 'Max Health', baseCost: 65, scale: 1.42, tooltip: 'More survivability each run.' },
  { id: 'fireRate', label: 'Fire Rate', baseCost: 70, scale: 1.48, tooltip: 'Shoot faster with all weapons.' },
  { id: 'critChance', label: 'Crit Chance', baseCost: 60, scale: 1.5, tooltip: 'Chance for 2x critical hits.' },
  { id: 'ammoCap', label: 'Ammo Capacity', baseCost: 50, scale: 1.34, tooltip: 'Larger magazines before reload.' },
  { id: 'reload', label: 'Reload Speed', baseCost: 50, scale: 1.34, tooltip: 'Shorter reload times.' },
  { id: 'pickupRadius', label: 'Pickup Radius', baseCost: 40, scale: 1.36, tooltip: 'Collect drops from farther away.' }
];

export const META_DEFS = [
  { id: 'survivor', label: '+10 Start HP', baseCost: 10, scale: 1.7, maxLevel: 8 },
  { id: 'prospector', label: '+15 Start Coins', baseCost: 12, scale: 1.8, maxLevel: 6 },
  { id: 'arsenal', label: 'Unlock Shotgun', baseCost: 24, scale: 1, maxLevel: 1 },
  { id: 'veteran', label: '+4% Start Damage', baseCost: 15, scale: 1.7, maxLevel: 7 }
];

export function levelCost(baseCost, scale, level) {
  return Math.floor(baseCost * Math.pow(scale, level));
}
