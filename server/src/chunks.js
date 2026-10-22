import { getEfficiency } from '../../shared/world.js';
import { db } from './db.js';

// Jittered-grid scatter: random chunk + random anchor, min distance to bases.
// 50 attempts (>=150u for first 25, >=75u after), then any free chunk.
export async function assignChunk(userId) {
  const existing = await db.query('select * from bases where owner_id = $1', [userId]);
  if (existing.rows[0]) return existing.rows[0];
  for (let attempt = 0; attempt < 50; attempt++) {
    const cx = Math.floor(Math.random() * 100);
    const cy = Math.floor(Math.random() * 100);
    const world_x = (cx - 50) * 200 + Math.random() * 200;
    const world_y = (cy - 50) * 200 + Math.random() * 200;
    const minDist = attempt < 25 ? 150 : 75;
    const clash = await db.query(
      'select 1 from bases where power(world_x - $1, 2) + power(world_y - $2, 2) < power($3, 2) limit 1',
      [world_x, world_y, minDist]
    );
    if (clash.rows.length) continue;
    try {
      const r = await db.query(
        `insert into bases (owner_id, chunk_x, chunk_y, world_x, world_y, efficiency_cached)
         values ($1,$2,$3,$4,$5,$6) returning *`,
        [userId, cx, cy, world_x, world_y, getEfficiency(world_x, world_y)]
      );
      await db.query(
        `insert into resources (base_id, resource, amount) values
         ($1,'iron',40),($1,'energy',20),($1,'components',0),($1,'credits',100)
         on conflict do nothing`,
        [r.rows[0].id]
      );
      return r.rows[0];
    } catch {
      // chunk taken concurrently -> retry
    }
  }
  throw new Error('world_full');
}
