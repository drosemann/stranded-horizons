// Asset loading (image map identical to legacy loadAssets).
export function createAssetStore() {
  return { images: {}, ready: false };
}

export function loadAssets(store, onProgress) {
  if (store.ready) return Promise.resolve(store.images);
  const imageMap = {
    background: 'assets/game-background.png',
    player: 'assets/player-avatar.png',
    basic: 'assets/enemy-basic.png',
    fast: 'assets/enemy-fast.png',
    tank: 'assets/enemy-tank.png',
    ranged: 'assets/enemy-ranged.png',
    exploder: 'assets/enemy-exploder.png'
  };
  return new Promise((resolve) => {
    let loaded = 0;
    const total = Object.keys(imageMap).length;
    const done = () => {
      loaded += 1;
      if (onProgress) onProgress(loaded, total);
      if (loaded === total) { store.ready = true; resolve(store.images); }
    };
    for (const [key, src] of Object.entries(imageMap)) {
      const img = new Image();
      img.decoding = 'async'; img.loading = 'eager'; img.src = src;
      img.onload = () => { store.images[key] = img; done(); };
      img.onerror = () => done();
    }
  });
}
