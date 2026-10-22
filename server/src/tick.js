import { BUILDINGS, CREDITS_DRIP } from '../../shared/economy.js';
import { applyBonuses } from '../../shared/world.js';
import { db } from './db.js';

// Server-authoritative 2s production tick for one shard.
// Idempotent per (shard, tick_number): duplicate runs are no-ops.
export async function runTick(shard, tickNumber) {
  const claimed = await db.query(
    'insert into ticks (shard, tick_number) values ($1,$2) on conflict do nothing returning tick_number',
    [shard, tickNumber]
  );
  if (!claimed.rows.length) return { deduped: true };

  const bases = await db.query('select * from bases');
  for (const base of bases.rows) {
    const b = await db.query('select * from buildings where base_id = $1', [base.id]);
    const counts = {};
    for (const row of b.rows) counts[row.type] = (counts[row.type] || 0) + 1;

    const boosterActive =
      base.booster_expires_at && new Date(base.booster_expires_at) > new Date();
    const link = await db.query(
      `select 1 from faction_links
        where status = 'active' and (base_a = $1 or base_b = $1) limit 1`,
      [base.id]
    );
    const eff = applyBonuses(base.efficiency_cached, {
      faction: link.rows.length > 0,
      boosterActive: !!boosterActive,
    }) / 100;

    // Upkeep first (factory consumes iron+energy), then outputs scaled by eff.
    const res = await db.query('select * from resources where base_id = $1', [base.id]);
    const stock = Object.fromEntries(res.rows.map((r) => [r.resource, r.amount]));
    const factories = counts.factory || 0;
    const needIron = (BUILDINGS.factory.upkeep.iron || 0) * factories;
    const needEnergy = (BUILDINGS.factory.upkeep.energy || 0) * factories;
    const canRun = (stock.iron || 0) >= needIron && (stock.energy || 0) >= needEnergy;
    const next = { ...stock };
    if (canRun && factories > 0) {
      next.iron -= needIron;
      next.energy -= needEnergy;
      next.components = (next.components || 0) + BUILDINGS.factory.output.components * factories * eff;
    }
    next.iron = (next.iron || 0) + (BUILDINGS.mine.output.iron || 0) * (counts.mine || 0) * eff;
    next.energy = (next.energy || 0) + (BUILDINGS.solar.output.energy || 0) * (counts.solar || 0) * eff;
    if (CREDITS_DRIP.requiresFactory && factories > 0) {
      next.credits = (next.credits || 0) + CREDITS_DRIP.perTick;
    }
    for (const [k, v] of Object.entries(next)) {
      await db.query(
        'update resources set amount = greatest(0, $1), updated_at_tick = $2 where base_id = $3 and resource = $4',
        [v, tickNumber, base.id, k]
      );
    }
  }
  return { deduped: false };
}
