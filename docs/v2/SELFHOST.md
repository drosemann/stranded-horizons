# v2 self-hosting

## Vercel (now)
- Static frontend deploys as-is: `index.html`, `game.html` (v1), `game-v2.html`, `admin/`.
- `api/socket.js` is the optional serverless socket shim; set in Vercel env:
  `SUPABASE_JWT_SECRET`, `CORS_ORIGINS` (your Vercel domain), `DATABASE_URL`,
  `REDIS_URL` (omit Redis for single-instance mode), `DEV_UNAUTHENTICATED=1` only for CI smoke.
- Set `window.SH_SOCKET_URL` before loading `game-v2.html` if the socket host differs.

## VPS (later)
1. `cp .env.example .env` and fill `POSTGRES_PASSWORD`, `SUPABASE_JWT_SECRET`, `CORS_ORIGINS`.
2. `docker compose up -d --build`
3. Apply SQL: `psql $DATABASE_URL -f db/schema.sql`
4. Point DNS to the VPS, provision TLS (certbot), keep ports closed except 443.
5. Nightly `pg_dump`; test restores. Postgres + Redis are on the private
   `internal` network and are never published — only NGINX 443 is public.

## Notes
- Supabase CLI local stack is dev-only; never expose it. Production uses the compose stack.
- No managed backups when self-hosting: the operator owns backups, updates, monitoring.
