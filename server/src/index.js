import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { assignChunk } from './chunks.js';
import { placeBuilding, activateBooster, requestLink, confirmLink } from './actions.js';
import { runTick } from './tick.js';
import { db } from './db.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/', (_req, res) => res.json({ name: 'stranded-horizons-server', v: 1 }));
  // Admin chunk list for the Leaflet live map. Bearer JWT, allowlist-checked.
  app.get('/admin/chunks', async (req, res) => {
    try {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const payload = verifyToken(token);
      const me = (await db.query(
        'select (select count(*) from admin_allowlist where user_id = $1) > 0 as is_admin',
        [payload.sub]
      )).rows[0]?.is_admin;
      if (!me) return res.status(403).json({ ok: false, error: 'forbidden' });
      const r = await db.query(
        'select id, chunk_x, chunk_y, world_x, world_y, efficiency_cached, owner_id, created_at from bases limit 10000'
      );
      res.json(r.rows);
    } catch {
      res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  });
  return app;
}

function verifyToken(token) {
  const raw = token || '';
  // Hobby default: Supabase JWT secret (HS256). VPS/self-host sets SUPABASE_JWT_SECRET.
  // Vercel preview without auth configured: allow DEV_UNAUTHENTICATED=1 for CI smoke only.
  if (process.env.DEV_UNAUTHENTICATED === '1') return { sub: 'dev-user' };
  return jwt.verify(raw, process.env.SUPABASE_JWT_SECRET);
}

export function attachSockets(http, opts = {}) {
  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const io = new Server(http, { cors: { origin: origins.length ? origins : true } });

  io.use((socket, next) => {
    try {
      const payload = verifyToken(socket.handshake.auth?.token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  // Optional Redis fan-out for multi-worker/VPS deploys. Absence = single-process mode.
  let pub = null;
  if (process.env.REDIS_URL && !opts.skipRedis) {
    pub = createClient({ url: process.env.REDIS_URL });
    pub.connect().catch(() => { pub = null; });
  }

  io.on('connection', (socket) => {
    const uid = () => socket.data.userId;
    socket.on('chunk:get', async (ack) => {
      try { ack({ ok: true, base: await assignChunk(uid()) }); }
      catch (e) { ack({ ok: false, error: e.message === 'world_full' ? 'world_full' : 'chunk_failed' }); }
    });
    socket.on('place', async (msg, ack) => {
      try { ack(await placeBuilding(uid(), msg)); }
      catch { ack({ ok: false, error: 'place_failed' }); }
    });
    socket.on('booster:activate', async (ack) => {
      try { ack(await activateBooster(uid())); }
      catch { ack({ ok: false, error: 'booster_failed' }); }
    });
    socket.on('link:request', async (msg, ack) => {
      try { ack(await requestLink(uid(), msg?.targetBaseId)); }
      catch { ack({ ok: false, error: 'link_failed' }); }
    });
    socket.on('link:confirm', async (msg, ack) => {
      try { ack(await confirmLink(uid(), msg?.otherBaseId, msg?.accept !== false)); }
      catch { ack({ ok: false, error: 'link_failed' }); }
    });
    // Admin console (server re-checks admin flag on every command).
    socket.on('admin:cmd', async (msg, ack) => {
      try {
        const me = (await db.query(
          `select (select count(*) from admin_allowlist where user_id = $1) > 0 as is_admin`, [uid()]
        )).rows[0]?.is_admin;
        if (!me) { ack({ ok: false, error: 'forbidden' }); return; }
        const [cmd, ...rest] = String(msg?.line || '').trim().split(/\s+/);
        await db.query('insert into admin_audit (admin_id, action, payload_json) values ($1,$2,$3)',
          [uid(), cmd || 'noop', JSON.stringify({ line: msg?.line || '' })]);
        if (pub) await pub.publish('chunk:update', JSON.stringify({ by: uid(), cmd: cmd || 'noop' }));
        ack({ ok: true, ran: cmd || 'noop', args: rest });
      } catch { ack({ ok: false, error: 'admin_failed' }); }
    });
  });

  return io;
}

// Local / VPS long-running process. On Vercel, api/socket.js imports createApp/attachSockets.
const isVercel = !!process.env.VERCEL;
if (!isVercel || process.env.RUN_STANDALONE === '1') {
  const app = createApp();
  const http = createServer(app);
  attachSockets(http);
  let n = Math.floor(Date.now() / 2000);
  setInterval(() => { n += 1; runTick('shard-0', n).catch(() => {}); }, 2000);
  const port = Number(process.env.PORT || 3000);
  http.listen(port, () => console.log(`sh-server listening on :${port}`));
}
