import { currentWeapon } from '../core/GameState.js';
import { SHOP_DEFS, META_DEFS, levelCost } from '../data/upgrades.js';

// DOM cache: same element ids as legacy cacheDOM().
export function cacheDOM() {
  const ids = ['startScreen', 'deathScreen', 'pauseMenu', 'waveComplete', 'startButton', 'restartButton', 'menuButton', 'pauseResume', 'pauseRestart', 'pauseMenuBtn', 'health', 'stamina', 'score', 'coins', 'wave', 'waveRemaining', 'weapon', 'ammo', 'waveStatus', 'finalScore', 'finalWave', 'finalKills', 'finalMeta', 'bestRun', 'waveBonus', 'shopRows', 'activeBuffs', 'metaCredits', 'metaRows', 'touchControls', 'stickZone', 'stickKnob', 'touchShoot', 'touchDash', 'touchReload', 'touchSwitch'];
  const dom = {};
  for (const id of ids) dom[id] = document.getElementById(id);
  return dom;
}

export function createShopUI(dom, state, actions) {
  dom.shopRows.innerHTML = '';
  for (const def of SHOP_DEFS) {
    const row = document.createElement('button');
    row.className = 'shop-btn'; row.dataset.id = def.id; row.title = def.tooltip;
    row.addEventListener('click', () => actions.buyShop(def.id));
    dom.shopRows.appendChild(row);
  }
  dom.metaRows.innerHTML = '';
  for (const def of META_DEFS) {
    const btn = document.createElement('button');
    btn.className = 'meta-btn'; btn.dataset.id = def.id;
    btn.addEventListener('click', () => actions.buyMeta(def.id));
    dom.metaRows.appendChild(btn);
  }
}

export function createHUD(dom) {
  function sync(state) {
    const waveRemaining = Math.max(0, state.wave.targetKills - state.wave.killed);
    const weapon = currentWeapon(state);
    dom.health.textContent = `HP: ${Math.ceil(state.player.health)} / ${Math.ceil(state.player.maxHealth)} ${state.player.shield > 0 ? `(Shield ${Math.ceil(state.player.shield)})` : ''}`;
    dom.stamina.textContent = `Stamina: ${Math.ceil(state.player.stamina)} / 100`;
    dom.score.textContent = `Score: ${state.run.score}`;
    dom.coins.textContent = `Coins: ${state.player.coins}`;
    dom.wave.textContent = `Wave: ${state.run.wave}`;
    dom.waveRemaining.textContent = `Remaining: ${waveRemaining}`;
    dom.weapon.textContent = `Weapon: ${weapon.name}`;
    dom.ammo.textContent = state.player.reloadUntilMs > 0 ? 'Reloading...' : `Ammo: ${state.player.ammoInMag}`;
    dom.activeBuffs.textContent = state.activeBuffs.length > 0 ? state.activeBuffs.map((b) => b.id).join(', ') : 'none';
    for (const def of SHOP_DEFS) {
      const lvl = state.runUpgrades[def.id];
      const cost = levelCost(def.baseCost, def.scale, lvl);
      const btn = dom.shopRows.querySelector(`[data-id="${def.id}"]`);
      if (btn) { btn.textContent = `${def.label} Lv.${lvl} — ${cost}c`; btn.disabled = state.player.coins < cost; }
    }
    dom.metaCredits.textContent = state.meta.credits;
    for (const def of META_DEFS) {
      const lvl = state.meta[def.id] || 0;
      const cost = levelCost(def.baseCost, def.scale, lvl);
      const btn = dom.metaRows.querySelector(`[data-id="${def.id}"]`);
      if (btn) {
        const maxed = lvl >= def.maxLevel;
        btn.textContent = maxed ? `${def.label} (MAX)` : `${def.label} Lv.${lvl} — ${cost} MC`;
        btn.disabled = maxed || state.meta.credits < cost;
      }
    }
  }
  function showBestRun(bestRun) {
    dom.bestRun.textContent = !bestRun ? 'Best Run: none' : `Best Run: Score ${bestRun.score}, Wave ${bestRun.wave}, Kills ${bestRun.kills}`;
  }
  return { sync, showBestRun };
}

export function createMenus(dom, bus) {
  bus.on('ui:waveStatus', (msg) => { dom.waveStatus.textContent = msg; });
  bus.on('ui:waveComplete', (bonus) => {
    dom.waveBonus.textContent = bonus;
    dom.waveComplete.style.display = 'block';
    dom.waveStatus.textContent = 'Wave cleared — shop window open.';
  });
  bus.on('ui:hideWaveComplete', () => { dom.waveComplete.style.display = 'none'; });
  return {
    showStart() { dom.startScreen.style.display = 'flex'; dom.deathScreen.style.display = 'none'; dom.pauseMenu.style.display = 'none'; },
    showPlaying() { dom.startScreen.style.display = 'none'; dom.deathScreen.style.display = 'none'; dom.pauseMenu.style.display = 'none'; },
    showPause() { dom.pauseMenu.style.display = 'flex'; },
    hidePause() { dom.pauseMenu.style.display = 'none'; },
    showDeath(run, metaGain) {
      dom.finalScore.textContent = run.score;
      dom.finalWave.textContent = run.wave;
      dom.finalKills.textContent = run.kills;
      dom.finalMeta.textContent = metaGain;
      dom.deathScreen.style.display = 'block';
    }
  };
}
