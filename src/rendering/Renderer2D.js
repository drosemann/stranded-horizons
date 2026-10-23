import { GAME_CONFIG } from '../data/config.js';
import { queryByKind } from '../core/EntityStore.js';

// Renderer2D: faithful port of legacy render(). Draw order:
// background -> pickups -> projectiles -> enemies -> player -> particles -> damage flash.
// All world coordinates pass through worldToScreen in Renderer25D; here the
// camera is identity and shake is applied via ctx.translate (pixel-identical).
export function createRenderer2D(canvas) {
  const ctx = canvas.getContext('2d');
  function render(state, assets, camera) {
    const shakeX = (Math.random() - 0.5) * state.run.shake;
    const shakeY = (Math.random() - 0.5) * state.run.shake;
    void camera;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(shakeX, shakeY);
    if (assets.images.background) {
      ctx.drawImage(assets.images.background, -20, -20, canvas.width + 40, canvas.height + 40);
    } else {
      ctx.fillStyle = '#0f1224';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    renderPickups(state);
    renderProjectiles(state);
    renderEnemies(state, assets);
    renderPlayer(state, assets);
    renderParticles(state);
    ctx.restore();
    if (state.timeMs < state.run.damageFlashUntilMs) {
      ctx.fillStyle = 'rgba(255, 71, 87, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function renderEnemies(state, assets) {
    for (const enemy of queryByKind(state.store, 'enemy')) {
      const x = enemy.position.x, y = enemy.position.y;
      const img = assets.images[enemy.typeId];
      if (img) ctx.drawImage(img, x - enemy.radius, y - enemy.radius, enemy.radius * 2, enemy.radius * 2);
      else {
        ctx.fillStyle = GAME_CONFIG.enemyTypes[enemy.typeId].color;
        ctx.beginPath(); ctx.arc(x, y, enemy.radius, 0, Math.PI * 2); ctx.fill();
      }
      if (state.timeMs < enemy.data.hitFlashUntilMs) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(x, y, enemy.radius, 0, Math.PI * 2); ctx.fill();
      }
      const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - enemy.radius, y - enemy.radius - 12, enemy.radius * 2, 6);
      ctx.fillStyle = '#69db7c';
      ctx.fillRect(x - enemy.radius, y - enemy.radius - 12, enemy.radius * 2 * hpRatio, 6);
    }
  }

  function renderProjectiles(state) {
    for (const proj of queryByKind(state.store, 'projectile').filter((p) => p.data.faction === 'player')) {
      ctx.fillStyle = proj.data.crit ? '#ffe066' : '#f8f9fa';
      ctx.beginPath(); ctx.arc(proj.position.x, proj.position.y, proj.radius, 0, Math.PI * 2); ctx.fill();
    }
    for (const proj of queryByKind(state.store, 'projectile').filter((p) => p.data.faction === 'enemy')) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.arc(proj.position.x, proj.position.y, proj.radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  function renderPlayer(state, assets) {
    const p = state.player;
    if (assets.images.player) {
      ctx.drawImage(assets.images.player, p.position.x - p.width / 2, p.position.y - p.height / 2, p.width, p.height);
    } else {
      ctx.fillStyle = '#4dabf7';
      ctx.fillRect(p.position.x - p.width / 2, p.position.y - p.height / 2, p.width, p.height);
    }
    if (state.timeMs < p.dashUntilMs) {
      ctx.strokeStyle = 'rgba(77,171,247,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.position.x, p.position.y, p.width * 0.65, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function renderPickups(state) {
    const colors = { heal: '#51cf66', shield: '#74c0fc', speed: '#fcc419', doubleDamage: '#ff6b6b', piercingShots: '#a78bfa', magnet: '#63e6be', coins: '#ffd43b' };
    for (const pickup of queryByKind(state.store, 'pickup')) {
      ctx.fillStyle = colors[pickup.typeId] || '#fff';
      ctx.beginPath(); ctx.arc(pickup.position.x, pickup.position.y, pickup.radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  function renderParticles(state) {
    for (const p of queryByKind(state.store, 'particle')) {
      ctx.globalAlpha = Math.max(0, p.data.life / p.data.maxLife);
      ctx.fillStyle = p.data.color;
      ctx.fillRect(p.position.x, p.position.y, p.data.size, p.data.size);
      ctx.globalAlpha = 1;
    }
  }

  return { render, name: '2d' };
}
