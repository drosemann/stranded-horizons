import { BUILDINGS, BOOSTER } from '../../shared/economy.js';
import { applyBonuses } from '../../shared/world.js';
import { db } from './db.js';

function canAfford(stock, cost) {
  return Object.entries(cost).every(([k, v]) => (stock[k] || 0) >= v);
}

export async function placeBuilding(userId, { grid_x, grid_y, type }) {
  if (!Number.isInteger(grid_x) || !Number.isInteger(grid_y) || grid_x < 0 || grid_x > 19 || grid_y < 0 || grid_y > 19) {
    return { ok: false, error: 'out_of_bounds' };
  }
  if (!BUILDINGS[type]) return { ok: false, error: 'unknown_building' };
  const base = (await db.query('select * from bases where owner_id = $1', [userId])).rows[0];
  if (!base) return { ok: false, error: 'no_base' };
  const occupied = (await db.query(
    'select 1 from buildings where base_id = $1 and grid_x = $2 and grid_y = $3',
    [base.id, grid_x, grid_y]
  )).rows.length;
  if (occupied) return { ok: false, error: 'occupied' };
  const res = await db.query('select * from resources where base_id = $1', [base.id]);
  const stock = Object.fromEntries(res.rows.map((r) => [r.resource, r.amount]));
  if (!canAfford(stock, BUILDINGS[type].cost)) return { ok: false, error: 'insufficient_resources' };
  for (const [k, v] of Object.entries(BUILDINGS[type].cost)) {
    await db.query('update resources set amount = amount - $1 where base_id = $2 and resource = $3', [v, base.id, k]);
  }
  await db.query('insert into buildings (base_id, grid_x, grid_y, type) values ($1,$2,$3,$4)', [base.id, grid_x, grid_y, type]);
  return { ok: true };
}

export async function activateBooster(userId) {
  const base = (await db.query('select * from bases where owner_id = $1', [userId])).rows[0];
  if (!base) return { ok: false, error: 'no_base' };
  const now = new Date();
  if (base.booster_expires_at && new Date(base.booster_expires_at) > now) return { ok: false, error: 'already_active' };
  if (base.booster_cooldown_until && new Date(base.booster_cooldown_until) > now) return { ok: false, error: 'on_cooldown' };
  const credits = (await db.query(
    "select amount from resources where base_id = $1 and resource = 'credits'", [base.id]
  )).rows[0]?.amount || 0;
  if (credits < BOOSTER.costCredits) return { ok: false, error: 'insufficient_credits' };
  await db.query("update resources set amount = amount - $1 where base_id = $2 and resource = 'credits'", [BOOSTER.costCredits, base.id]);
  const expires = new Date(now.getTime() + BOOSTER.durationDays * 864e5);
  const cooldown = new Date(expires.getTime() + BOOSTER.cooldownDays * 864e5);
  await db.query('update bases set booster_expires_at = $1, booster_cooldown_until = $2 where id = $3', [expires.toISOString(), cooldown.toISOString(), base.id]);
  return { ok: true, expires_at: expires.toISOString() };
}

export async function requestLink(userId, targetBaseId) {
  const mine = (await db.query('select * from bases where owner_id = $1', [userId])).rows[0];
  if (!mine) return { ok: false, error: 'no_base' };
  if (mine.id === targetBaseId) return { ok: false, error: 'self_link' };
  const target = (await db.query('select * from bases where id = $1', [targetBaseId])).rows[0];
  if (!target) return { ok: false, error: 'unknown_base' };
  const [a, b_] = [mine.id, targetBaseId].sort();
  await db.query(
    "insert into faction_links (base_a, base_b, status) values ($1,$2,'pending') on conflict do nothing",
    [a, b_]
  );
  return { ok: true };
}

export async function confirmLink(userId, otherBaseId, accept) {
  const mine = (await db.query('select * from bases where owner_id = $1', [userId])).rows[0];
  if (!mine) return { ok: false, error: 'no_base' };
  const [a, b_] = [mine.id, otherBaseId].sort();
  const link = (await db.query('select * from faction_links where base_a = $1 and base_b = $2', [a, b_])).rows[0];
  if (!link || link.status !== 'pending') return { ok: false, error: 'no_pending_link' };
  await db.query('update faction_links set status = $1 where base_a = $2 and base_b = $3', [accept ? 'active' : 'rejected', a, b_]);
  return { ok: true };
}
