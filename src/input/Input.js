import { createInputState } from './InputState.js';

export function createInput(canvas, opts = {}) {
  const input = createInputState();
  const keys = {};
  const mouse = { x: 0, y: 0 };

  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape') input.actions.push('pause');
    if (e.key.toLowerCase() === 'q') input.actions.push('switch');
    if (e.key.toLowerCase() === 'r') input.actions.push('reload');
    if (e.key === 'Shift') input.actions.push('dash');
    if (e.key === ' ') input.shootHeld = true;
    syncMoves();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === ' ') input.shootHeld = false;
    syncMoves();
  });
  function syncMoves() {
    input.moveUp = !!(keys['w'] || keys['arrowup']);
    input.moveDown = !!(keys['s'] || keys['arrowdown']);
    input.moveLeft = !!(keys['a'] || keys['arrowleft']);
    input.moveRight = !!(keys['d'] || keys['arrowright']);
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    input.aimX = mouse.x; input.aimY = mouse.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    input.aimX = mouse.x; input.aimY = mouse.y;
    if (opts.onShootIntent) opts.onShootIntent();
    else input.actions.push('shoot');
  });
  canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      mouse.x = e.touches[0].clientX - rect.left; mouse.y = e.touches[0].clientY - rect.top;
      input.aimX = mouse.x; input.aimY = mouse.y;
    }
    if (opts.onShootIntent) opts.onShootIntent();
    else input.actions.push('shoot');
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  if (isTouch) setupTouch(input, opts);

  return { input, isTouch };
}

function setupTouch(input, opts) {
  const zone = document.getElementById('stickZone');
  const knob = document.getElementById('stickKnob');
  const controls = document.getElementById('touchControls');
  if (!zone || !knob) return;
  controls.classList.add('active');
  controls.setAttribute('aria-hidden', 'false');
  const clampNum = (v, min, max) => Math.max(min, Math.min(max, v));
  let pointerId = null;
  const updateStick = (clientX, clientY) => {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = clientX - cx, dy = clientY - cy;
    const max = rect.width * 0.35;
    const len = Math.hypot(dx, dy) || 1;
    knob.style.transform = `translate(calc(-50% + ${clampNum(dx, -max, max)}px), calc(-50% + ${clampNum(dy, -max, max)}px))`;
    input.touchX = (dx / len) * Math.min(1, Math.abs(dx) / max);
    input.touchY = (dy / len) * Math.min(1, Math.abs(dy) / max);
    input.touchActive = true;
  };
  zone.addEventListener('pointerdown', (e) => { pointerId = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch {} updateStick(e.clientX, e.clientY); });
  zone.addEventListener('pointermove', (e) => { if (pointerId !== e.pointerId) return; updateStick(e.clientX, e.clientY); });
  const reset = () => { input.touchX = 0; input.touchY = 0; input.touchActive = false; knob.style.transform = 'translate(-50%, -50%)'; };
  zone.addEventListener('pointerup', reset);
  zone.addEventListener('pointercancel', reset);
  const byId = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('pointerdown', (e) => { fn(); e.preventDefault(); }); };
  byId('touchShoot', () => {
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    input.aimX = rect.width * 0.8; input.aimY = rect.height * 0.5;
    input.actions.push('shoot');
  });
  byId('touchDash', () => input.actions.push('dash'));
  byId('touchReload', () => input.actions.push('reload'));
  byId('touchSwitch', () => input.actions.push('switch'));
}
