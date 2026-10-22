-- Seed a small dev world: owner ids are placeholders for local testing.
insert into bases (owner_id, chunk_x, chunk_y, world_x, world_y, efficiency_cached)
values
  (null, 50, 50, 100.0, 100.0, 99.29),
  (null, 52, 48, 500.0, -300.0, 97.08),
  (null, 65, 65, 3100.0, 3100.0, 78.07)
on conflict do nothing;
