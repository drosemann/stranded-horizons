// Shared world math (client + server). Server is authoritative.
export const WORLD = { size: 20000, chunkSize: 200, chunksPerSide: 100, gridCells: 20 };

export function getEfficiency(x, y) {
  const d = Math.hypot(x, y);
  return Math.max(30, 100 - d * 0.005);
}

export function applyBonuses(base, { faction = false, boosterActive = false } = {}) {
  let e = base;
  if (faction) e += 10;
  if (boosterActive) e += 10;
  return Math.min(100, Math.max(0, e));
}

export function chunkOf(x, y) {
  return {
    cx: Math.floor((x + WORLD.size / 2) / WORLD.chunkSize),
    cy: Math.floor((y + WORLD.size / 2) / WORLD.chunkSize),
  };
}

export function chunkCenter(cx, cy) {
  return {
    x: (cx - WORLD.chunksPerSide / 2) * WORLD.chunkSize + WORLD.chunkSize / 2,
    y: (cy - WORLD.chunksPerSide / 2) * WORLD.chunkSize + WORLD.chunkSize / 2,
  };
}
