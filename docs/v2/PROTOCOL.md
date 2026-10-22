# v2 socket protocol (v1)

Auth: Supabase JWT in handshake `auth.token`. Server rejects unauthenticated sockets.
Client -> server intents only; server never trusts client-computed resources/positions.

- `chunk:get` -> `{ ok, base } | { ok:false, error }`
- `place { grid_x 0-19, grid_y 0-19, type }` -> `{ ok } | insufficient_resources | occupied | out_of_bounds | unknown_building`
- `booster:activate` -> `{ ok, expires_at } | insufficient_credits | already_active | on_cooldown`
- `link:request { targetBaseId }` -> `{ ok } | self_link | unknown_base`
- `link:confirm { otherBaseId, accept }` -> `{ ok } | no_pending_link`
- `admin:cmd { line }` (admin allowlist only) -> `{ ok, ran, args } | forbidden`
  - `:tp x y`, `:give <resource> <amount>`, `:place <type>`; every call -> admin_audit.
- Server fan-out: Redis `chunk:update` (reload hint; MariaDB is the truth).

Versions: every message carries protocol v1; unknown versions are rejected.
