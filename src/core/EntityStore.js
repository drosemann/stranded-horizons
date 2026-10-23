// Entity store: lifecycle for enemies, projectiles, pickups, particles.
// Entity shape: { id, kind, typeId, position:{x,y,z}, velocity:{x,y}, radius,
//                 health, maxHealth, state, data:{...kind-specific} }
export function createEntityStore() {
  return { entities: [], seq: 0 };
}

export function spawnEntity(store, entity) {
  store.seq += 1;
  const e = { ...entity, id: entity.id ?? `e${store.seq}` };
  if (!e.position) e.position = { x: 0, y: 0, z: 0 };
  if (e.position.z === undefined) e.position.z = 0;
  if (!e.velocity) e.velocity = { x: 0, y: 0 };
  store.entities.push(e);
  return e;
}

export function removeEntity(store, entityOrId) {
  const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
  const i = store.entities.findIndex((e) => e.id === id);
  if (i >= 0) store.entities.splice(i, 1);
}

export function queryByKind(store, kind) {
  return store.entities.filter((e) => e.kind === kind);
}

export function clearKind(store, kind) {
  store.entities = store.entities.filter((e) => e.kind !== kind);
}

export function makeEntity(kind, typeId, x, y, opts = {}) {
  return {
    id: opts.id, kind, typeId,
    position: { x, y, z: opts.z ?? 0 },
    velocity: opts.velocity ?? { x: 0, y: 0 },
    radius: opts.radius ?? 0,
    health: opts.health ?? 1, maxHealth: opts.maxHealth ?? 1,
    state: 'alive', data: opts.data ?? {}
  };
}
