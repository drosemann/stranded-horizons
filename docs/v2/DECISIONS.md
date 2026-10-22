# v2 decisions (locked)

1. Platform: self-hosted Supabase (Auth + Postgres). Game writes via server
   service-role key only; RLS deny-all; clients never write game tables.
2. Efficiency: `max(30, 100 - distance * 0.005)`; faction link +10, in-game
   booster +10; hard cap 100. Pinned values: 0->100, 2k->90, 6k->70, 10k->50, 14k->30 floor.
3. World: 20000x20000 units, 100x100 chunks of 200x200, 20x20 build grid per chunk.
4. Scatter: jittered random chunk + anchor, min distance 150u (25 tries) then 75u, 50 tries total.
   Assigned chunks never reused; deleted accounts anonymise to ruins.
5. Economy: see shared/economy.js (server-authoritative 2s tick, idempotent per shard+tick).
6. Booster: in-game currency only (500 credits, +10% / 7 days, 1 active, 7-day cooldown, cap 100).
   No real money anywhere (GPL hobby project).
7. Deploy: Vercel hosts static frontend now (`game-v2.html`, `admin/`); game server runs
   as `server/` (Vercel function shim in `api/socket.js`, or `npm start` on a VPS later).
8. Assets/maps: owner-created only; provenance recorded in ASSETS_LICENSES.md / IMPORTS_LICENSES.md.
9. Redis/MariaDB-style internals never public: Postgres + Redis on private network, only NGINX 443 exposed.
