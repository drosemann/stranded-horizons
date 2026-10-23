import { createEventBus } from './core/EventBus.js';
import { createInitialState, resetRun } from './core/GameState.js';
import { createGameLoop } from './core/GameLoop.js';
import { mulberry32 } from './core/rng.js';
import { loadMetaProgress, loadBestRun, saveMeta, saveBestRun } from './persistence/MetaStore.js';
import { handleMovement, tryDash, applyDerivedStats } from './simulation/PlayerSystem.js';
import { tryShoot, switchWeapon, startReload, finishReloadIfNeeded } from './simulation/WeaponSystem.js';
import { updateEnemies } from './simulation/EnemySystem.js';
import { updateProjectiles } from './simulation/ProjectileSystem.js';
import { updatePickups, updateBuffs } from './simulation/PickupSystem.js';
import { updateWave, beginNextWave } from './simulation/WaveSystem.js';
import { handleCollisions, updateParticles } from './simulation/CollisionSystem.js';
import { buyShopUpgrade, buyMetaUpgrade } from './simulation/ProgressionSystem.js';
import { createRenderer2D } from './rendering/Renderer2D.js';
import { createRenderer25D } from './rendering/Renderer25D.js';
import { createCamera, screenToWorld } from './rendering/Camera.js';
import { createAssetStore, loadAssets } from './rendering/Assets.js';
import { createInput } from './input/Input.js';
import { consumeActions } from './input/InputState.js';
import { cacheDOM, createShopUI, createHUD, createMenus } from './ui/UI.js';
import { createAudioAdapter } from './audio/AudioAdapter.js';

// Renderer switch: ?renderer=25d selects the 2.5D foundation renderer. Default stays 2D.
const params = new URLSearchParams(location.search);
const rendererName = params.get('renderer') === '25d' ? '25d' : '2d';

const canvas = document.getElementById('gameCanvas');
const dom = cacheDOM();
const bus = createEventBus();
createAudioAdapter(bus);

const meta = loadMetaProgress();
let bestRun = loadBestRun();
const state = createInitialState({ width: window.innerWidth, height: window.innerHeight }, meta);
const camera = createCamera();
const assets = createAssetStore();
const hud = createHUD(dom);
const menus = createMenus(dom, bus);
const renderer = rendererName === '25d' ? createRenderer25D(canvas) : createRenderer2D(canvas);

const rng = mulberry32((Math.random() * 0xffffffff) >>> 0);
const ctx = {
  rng, bus,
  persistMeta: () => { saveMeta(state.meta); },
  onGameOver: () => gameOver()
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.world.width = canvas.width;
  state.world.height = canvas.height;
}
window.addEventListener('resize', resize);
resize();
resetRun(state, meta, state.world, 0, true);
hud.showBestRun(bestRun);

createShopUI(dom, state, {
  buyShop: (id) => { if (buyShopUpgrade(state, id, ctx)) hud.sync(state); },
  buyMeta: (id) => { if (buyMetaUpgrade(state, id, ctx)) { hud.sync(state); } }
});

// Input: shoot intent converts screen aim to world aim via camera, then fires.
const { input } = createInput(canvas, {
  onShootIntent: () => {
    if (state.phase !== 'playing') return;
    const w = screenToWorld(camera, input.aimX, input.aimY);
    tryShoot(state, w, ctx);
  }
});

// Camera: follow player in 25D mode, identity in 2D mode.
function updateCamera() {
  if (renderer.name === '25d') {
    camera.x = canvas.width / 2 - state.player.position.x;
    camera.y = canvas.height / 2 - state.player.position.y;
  } else { camera.x = 0; camera.y = 0; }
  const wheel = updateCamera._zoom;
  if (wheel) camera.zoom = Math.min(2, Math.max(0.5, wheel));
}
window.addEventListener('wheel', (e) => {
  if (renderer.name !== '25d') return;
  updateCamera._zoom = (updateCamera._zoom || 1) * (e.deltaY > 0 ? 0.9 : 1.1);
}, { passive: true });

function startRun() {
  resetRun(state, state.meta, state.world, state.timeMs, false);
  state.phase = 'playing';
  menus.showPlaying();
  bus.emit('ui:waveStatus', 'Prepare... Shop and breathe.');
}

function gameOver() {
  state.phase = 'gameover';
  const metaGain = Math.floor(state.run.score / 45 + state.run.wave * 2 + state.run.kills * 0.4);
  state.meta.credits += metaGain;
  saveMeta(state.meta);
  const runPower = state.run.score + state.run.wave * 100 + state.run.kills * 6;
  if (!bestRun || runPower > bestRun.runPower) {
    bestRun = saveBestRun({ score: state.run.score, wave: state.run.wave, kills: state.run.kills, runPower, date: new Date().toISOString() });
  }
  hud.showBestRun(bestRun);
  menus.showDeath(state.run, metaGain);
}

function togglePause() {
  if (state.phase === 'init' || state.phase === 'gameover') return;
  if (state.phase === 'paused') {
    state.phase = state.wave.status === 'prep' ? 'waveComplete' : 'playing';
    menus.hidePause();
  } else {
    state.phase = 'paused';
    menus.showPause();
  }
}

dom.startButton.addEventListener('click', async () => {
  if (assets.ready) { startRun(); return; }
  dom.waveStatus.textContent = 'Loading assets...';
  dom.startButton.disabled = true;
  await loadAssets(assets);
  dom.startButton.disabled = false;
  startRun();
});
dom.restartButton.addEventListener('click', () => startRun());
dom.menuButton.addEventListener('click', () => { state.phase = 'init'; menus.showStart(); bus.emit('ui:waveStatus', 'Press Start Run.'); resetRun(state, state.meta, state.world, state.timeMs, true); });
dom.pauseResume.addEventListener('click', () => togglePause());
dom.pauseRestart.addEventListener('click', () => { menus.hidePause(); startRun(); });
dom.pauseMenuBtn.addEventListener('click', () => { state.phase = 'init'; menus.showStart(); resetRun(state, state.meta, state.world, state.timeMs, true); });

loadAssets(assets).then(() => {
  if (state.phase === 'init') bus.emit('ui:waveStatus', 'Assets loaded. Press Start Run.');
});

function update(dt) {
  if (state.phase === 'playing') {
    state.timeMs += dt * 1000;
    finishReloadIfNeeded(state, ctx);
    handleMovement(state, input, dt);
    if (input.shootHeld) {
      const w = screenToWorld(camera, input.aimX, input.aimY);
      tryShoot(state, w, ctx);
    }
    for (const action of consumeActions(input)) {
      if (action === 'shoot') { const w = screenToWorld(camera, input.aimX, input.aimY); tryShoot(state, w, ctx); }
      if (action === 'dash') tryDash(state, ctx);
      if (action === 'reload') startReload(state, ctx);
      if (action === 'switch') switchWeapon(state, ctx);
      if (action === 'pause') togglePause();
    }
    updateWave(state, ctx);
    updateEnemies(state, dt, ctx);
    updateProjectiles(state, dt);
    updatePickups(state, dt);
    updateBuffs(state);
    updateParticles(state, dt);
    handleCollisions(state, ctx);
    applyDerivedStats(state); // legacy updateUI() recalculated derived stats every frame
    if (state.phase === 'gameover') return;
  } else if (state.phase === 'waveComplete') {
    state.timeMs += dt * 1000;
    for (const action of consumeActions(input)) {
      if (action === 'pause') togglePause();
    }
    if (state.phase === 'waveComplete' && state.timeMs >= state.wave.prepEndAtMs) {
      beginNextWave(state, ctx);
    }
  } else {
    for (const action of consumeActions(input)) {
      if (action === 'pause') togglePause();
    }
  }
  updateCamera();
  hud.sync(state);
}

function render() {
  if (!state.run) return;
  renderer.render(state, assets, camera);
}

createGameLoop({ update, render }).start();
