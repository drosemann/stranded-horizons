// Minimal event bus for side effects only (audio/UI). Core sim stays direct calls.
export function createEventBus() {
  const handlers = new Map();
  return {
    on(event, fn) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(fn);
      return () => handlers.get(event).delete(fn);
    },
    emit(event, payload) {
      const set = handlers.get(event);
      if (!set) return;
      for (const fn of [...set]) { try { fn(payload); } catch { /* subscriber error isolated */ } }
    }
  };
}
