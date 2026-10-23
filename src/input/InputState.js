// Normalized per-frame input snapshot. Simulation reads only this object.
export function createInputState() {
  return {
    moveUp: false, moveDown: false, moveLeft: false, moveRight: false,
    touchActive: false, touchX: 0, touchY: 0,
    aimX: 0, aimY: 0,
    shootHeld: false,
    actions: [] // edge-triggered: 'dash' | 'reload' | 'switch' | 'pause' | 'shoot'
  };
}

export function consumeActions(input) {
  const a = input.actions;
  input.actions = [];
  return a;
}
