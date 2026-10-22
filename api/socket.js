import { createApp, attachSockets } from '../../server/src/index.js';

// Vercel-compatible entry: Vercel runs this as a serverless function, so the
// Socket.IO server attaches per-invocation on the long-lived Node runtime.
// Hobby default: without REDIS_URL / SUPABASE_JWT_SECRET the socket layer
// still boots; auth rejects until env is configured (see docs/v2/SELFHOST.md).
// For a VPS, run `npm start` in server/ instead (persistent process + 2s tick).
let handler;
export default function (req, res) {
  if (!handler) {
    const app = createApp();
    handler = app;
    attachSockets(req.socket.server, { skipRedis: false });
  }
  return handler(req, res);
}
