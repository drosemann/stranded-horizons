// Fixed-shape frame loop: update(dt) then render(). dt clamped to 0.05s like legacy.
export function createGameLoop({ update, render }) {
  let lastTs = -1;
  let running = true;
  function frame(ts) {
    if (!running) return;
    if (lastTs < 0) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt, ts);
    render(dt);
    requestAnimationFrame(frame);
  }
  return {
    start() { running = true; requestAnimationFrame(frame); },
    stop() { running = false; }
  };
}
