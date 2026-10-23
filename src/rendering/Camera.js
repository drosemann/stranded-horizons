// Camera: world <-> screen transform. Identity in topdown mode; iso mode reserved for 2.5D.
export function createCamera() {
  return { x: 0, y: 0, zoom: 1, shakeX: 0, shakeY: 0, mode: 'topdown' };
}

export function worldToScreen(camera, x, y, z = 0) {
  if (camera.mode === 'iso') {
    const c = Math.cos(Math.PI / 6), s = 0.5;
    return { x: (x - y) * c * camera.zoom + camera.x + camera.shakeX, y: (x + y) * s * camera.zoom - z + camera.y + camera.shakeY };
  }
  return { x: (x + camera.x) * camera.zoom + camera.shakeX, y: (y + camera.y) * camera.zoom + camera.shakeY - z };
}

export function screenToWorld(camera, sx, sy) {
  return { x: (sx - camera.shakeX) / camera.zoom - camera.x, y: (sy - camera.shakeY) / camera.zoom - camera.y };
}

// Depth key: lower y (+z) draws first.
export function depthKey(entity) {
  return entity.position.y + (entity.position.z || 0);
}
