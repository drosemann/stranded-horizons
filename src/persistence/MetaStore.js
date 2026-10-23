// localStorage persistence with verbatim sanitizers from legacy game.js.
// Keys and shapes are frozen for save compatibility.
export const STORAGE_KEYS = { META: 'sh_meta_v2', HIGH_RUN: 'sh_high_run_v2' };

export function toSafeInt(value, min, max, fallback = min) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const normalized = Math.trunc(value);
  if (normalized < min || normalized > max) return fallback;
  return normalized;
}

export function toSafeDateString(value) {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export function sanitizeMeta(rawMeta) {
  const fallback = { credits: 0, survivor: 0, prospector: 0, arsenal: 0, veteran: 0 };
  if (!rawMeta || typeof rawMeta !== 'object' || Array.isArray(rawMeta)) return fallback;
  return {
    credits: toSafeInt(rawMeta.credits, 0, 1000000, fallback.credits),
    survivor: toSafeInt(rawMeta.survivor, 0, 8, fallback.survivor),
    prospector: toSafeInt(rawMeta.prospector, 0, 6, fallback.prospector),
    arsenal: toSafeInt(rawMeta.arsenal, 0, 1, fallback.arsenal),
    veteran: toSafeInt(rawMeta.veteran, 0, 7, fallback.veteran)
  };
}

export function sanitizeBestRun(rawRun) {
  if (!rawRun || typeof rawRun !== 'object' || Array.isArray(rawRun)) return null;
  return {
    score: toSafeInt(rawRun.score, 0, 10000000, 0),
    wave: toSafeInt(rawRun.wave, 1, 100000, 1),
    kills: toSafeInt(rawRun.kills, 0, 10000000, 0),
    runPower: toSafeInt(rawRun.runPower, 0, 50000000, 0),
    date: toSafeDateString(rawRun.date)
  };
}

export function loadMetaProgress(storage = globalThis.localStorage) {
  let raw = null;
  try { raw = storage ? storage.getItem(STORAGE_KEYS.META) : null; } catch { return sanitizeMeta(null); }
  if (!raw) return sanitizeMeta(null);
  try { return sanitizeMeta(JSON.parse(raw)); } catch { return sanitizeMeta(null); }
}

export function loadBestRun(storage = globalThis.localStorage) {
  let raw = null;
  try { raw = storage ? storage.getItem(STORAGE_KEYS.HIGH_RUN) : null; } catch { return null; }
  if (!raw) return null;
  try { return sanitizeBestRun(JSON.parse(raw)); } catch { return null; }
}

export function saveMeta(meta, storage = globalThis.localStorage) {
  const safe = sanitizeMeta(meta);
  try { if (storage) storage.setItem(STORAGE_KEYS.META, JSON.stringify(safe)); } catch { /* quota/private mode */ }
  return safe;
}

export function saveBestRun(run, storage = globalThis.localStorage) {
  const safe = sanitizeBestRun(run);
  if (!safe) return null;
  try { if (storage) storage.setItem(STORAGE_KEYS.HIGH_RUN, JSON.stringify(safe)); } catch { /* ignore */ }
  return safe;
}
