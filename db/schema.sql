-- Stranded Horizons v2 schema. Postgres (self-hosted Supabase compatible).
-- Game writes go through the game server service-role key only.
-- RLS enabled with NO permissive policies = deny-all for anon/authenticated.

create extension if not exists "pgcrypto";

create table if not exists bases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  chunk_x int not null, chunk_y int not null,
  world_x float8 not null, world_y float8 not null,
  efficiency_cached float8 not null,
  blueprint_json jsonb not null default '{"cells":{}}',
  booster_expires_at timestamptz,
  booster_cooldown_until timestamptz,
  created_at timestamptz not null default now(),
  unique (chunk_x, chunk_y),
  unique (owner_id)
);

create table if not exists faction_links (
  base_a uuid not null references bases(id) on delete cascade,
  base_b uuid not null references bases(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (base_a, base_b),
  check (base_a <> base_b)
);

create table if not exists buildings (
  base_id uuid not null references bases(id) on delete cascade,
  grid_x int not null check (grid_x between 0 and 19),
  grid_y int not null check (grid_y between 0 and 19),
  type text not null
    check (type in ('mine', 'solar', 'conveyor', 'factory', 'wall', 'turret')),
  level int not null default 1,
  primary key (base_id, grid_x, grid_y)
);

create table if not exists resources (
  base_id uuid not null references bases(id) on delete cascade,
  resource text not null
    check (resource in ('iron', 'energy', 'components', 'credits')),
  amount float8 not null default 0 check (amount >= 0),
  updated_at_tick bigint not null default 0,
  primary key (base_id, resource)
);

create table if not exists ticks (
  shard text not null,
  tick_number bigint not null,
  applied_at timestamptz not null default now(),
  primary key (shard, tick_number)
);

create table if not exists admin_audit (
  id bigserial primary key,
  admin_id uuid,
  action text not null,
  payload_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  mapping_version text not null,
  blueprint_json jsonb not null,
  placed_base_id uuid references bases(id),
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table bases enable row level security;
alter table faction_links enable row level security;
alter table buildings enable row level security;
alter table resources enable row level security;
alter table ticks enable row level security;
alter table admin_audit enable row level security;
alter table imports enable row level security;

create table if not exists admin_allowlist (
  user_id uuid primary key,
  added_at timestamptz not null default now()
);
alter table admin_allowlist enable row level security;
