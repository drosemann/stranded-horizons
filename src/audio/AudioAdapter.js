// Audio adapter: subscribes to sim/UI events, owns the WebAudio oscillator beeps.
// Port of legacy playTone().
export function createAudioAdapter(bus) {
  let audioCtx = null;
  function playTone(freq, duration = 0.05, type = 'square') {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch { /* no-op if audio blocked */ }
  }
  const tones = {
    'sfx:shoot': (p) => playTone(p && p.weapon === 'shotgun' ? 160 : 430, 0.03, 'square'),
    'sfx:reload': () => playTone(250, 0.05, 'sawtooth'),
    'sfx:reloaded': () => playTone(520, 0.06, 'triangle'),
    'sfx:dash': () => playTone(760, 0.05, 'square'),
    'sfx:buy': () => playTone(480, 0.05, 'triangle'),
    'sfx:hit': () => playTone(110, 0.06, 'square'),
    'sfx:kill': () => playTone(220 + Math.random() * 140, 0.03, 'triangle'),
    'sfx:explosion': () => playTone(90, 0.09, 'sawtooth'),
    'sfx:pickup': () => playTone(660, 0.04, 'square'),
    'sfx:waveClear': () => playTone(920, 0.08, 'triangle'),
    'sfx:enemyShoot': () => playTone(130, 0.02, 'sawtooth'),
    'sfx:ui': () => playTone(660, 0.04, 'square')
  };
  for (const [event, fn] of Object.entries(tones)) bus.on(event, fn);
  return { playTone };
}
