import { GAME_CONFIG } from '../data/config.js';
import { queryByKind } from '../core/EntityStore.js';
import { worldToScreen, depthKey } from './Camera.js';

// Renderer25D: 2.5D foundation. Same sim state, different projection:
// - shadow ellipses at (x, y), scaled by z
// - depth sorting by (y + z) before drawing actors
// - sprites anchored bottom-center (billboard-ready)
// - camera pan (follows player) + zoom; iso projection available via camera.mode
export function createRenderer25D(canvas) {
  const ctx = canvas.getContext('2d');
  function render(state, assets, camera) {
    const shakeX = (Math.random() - 0.5) * state.run.shake;
    const shakeY = (Math.random() - 0.5) * state.run.shake;
    const cam = { ...camera, shakeX, shakeY };
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (assets.images.background) {
      ctx.drawImage(assets.images.background, -20, -20, canvas.width + 40, canvas.height + 40);
    } else {
      ctx.fillStyle = '#0f1224';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const actors = [
      ...queryByKind(state.store, 'pickup'),
      ...queryByKind(state.store, 'enemy')
    ].sort((a, b) => depthKey(a) - depthKey(b));
    for (const a of actors) {
      drawShadow(a);
      if (a.kind === 'enemy') drawEnemy(state, assets, cam, a);
      else drawPickup(cam, a);
    }
    drawPlayer(state, assets, cam);
    drawProjectiles(state, cam);
    drawParticles(state, cam);
    ctx.restore();
    if (state.timeMs < state.run.damageFlashUntilMs) {
      ctx.fillStyle = 'rgba(255, 71, 87, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawShadow(e) {
    const z = e.position.z || 0;
    const s = worldToScreen({ mode: 'topdown', x: 0, y: 0, zoom: 1, shakeX: 0, shakeY: 0 }, e.position.x, e.position.y);
    const r = (e.radius || 20) * (1 + z * 0.002);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.12, 0.35 - z * 0.002)})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + (e.radius || 20) * 0.7, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function proj(cam, x, y, z = 0) { return worldToScreen(cam, x, y, z); }

  function drawEnemy(state, assets, cam, enemy) {
    const z = enemy.position.z || 0;
    const p = proj(cam, enemy.position.x, enemy.position.y, z);
    const img = assets.images[enemy.typeId];
    if (img) ctx.drawImage(img, p.x - enemy.radius, p.y - enemy.radius * 2, enemy.radius * 2, enemy.radius * 2);
    else {
      ctx.fillStyle = GAME_CONFIG.enemyTypes[enemy.typeId].color;
      ctx.beginPath(); ctx.arc(p.x, p.y - enemy.radius, enemy.radius, 0, Math.PI * 2); ctx.fill();
    }
    if (state.timeMs < enemy.data.hitFlashUntilMs) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(p.x, p.y - enemy.radius, enemy.radius, 0, Math.PI * 2); ctx.fill();
    }
    const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(p.x - enemy.radius, p.y - enemy.radius * 2 - 12, enemy.radius * 2, 6);
    ctx.fillStyle = '#69db7c';
    ctx.fillRect(p.x - enemy.radius, p.y - enemy.radius * 2 - 12, enemy.radius * 2 * hpRatio, 6);
  }

  function drawPlayer(state, assets, cam) {
    const p = state.player;
    const s = proj(cam, p.position.x, p.position.y, p.position.z || 0);
    if (assets.images.player) ctx.drawImage(assets.images.player, s.x - p.width / 2, s.y - p.height, p.width, p.height);
    else { ctx.fillStyle = '#4dabf7'; ctx.fillRect(s.x - p.width / 2, s.y - p.height, p.width, p.height); }
    if (state.timeMs < p.dashUntilMs) {
      ctx.strokeStyle = 'rgba(77,171,247,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(s.x, s.y - p.height / 2, p.width * 0.65, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawPickup(cam, pickup) {
    const colors = { heal: '#51cf66', shield: '#74c0fc', speed: '#fcc419', doubleDamage: '#ff6b6b', piercingShots: '#a78bfa', magnet: '#63e6be', coins: '#ffd43b' };
    const s = proj(cam, pickup.position.x, pickup.position.y, pickup.position.z || 0);
    ctx.fillStyle = colors[pickup.typeId] || '#fff';
    ctx.beginPath(); ctx.arc(s.x, s.y - pickup.radius, pickup.radius, 0, Math.PI * 2); ctx.fill();
  }

  function drawProjectiles(state, cam) {
    for (const pr of queryByKind(state.store, 'projectile')) {
      const s = proj(cam, pr.position.x, pr.position.y, pr.position.z || 0);
      ctx.fillStyle = pr.data.faction === 'enemy' ? '#ff6b6b' : (pr.data.crit ? '#ffe066' : '#f8f9fa');
      ctx.beginPath(); ctx.arc(s.x, s.y, pr.radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawParticles(state, cam) {
    for (const p of queryByKind(state.store, 'particle')) {
      const s = proj(cam, p.position.x, p.position.y, p.position.z || 0);
      ctx.globalAlpha = Math.max(0, p.data.life / p.data.maxLife);
      ctx.fillStyle = p.data.color;
      ctx.fillRect(s.x, s.y, p.data.size, p.data.size);
      ctx.globalAlpha = 1;
    }
  }

  return { render, name: '25d' };
}
