// Procedural sound: WebAudio only, no audio files. Four radio stations (all
// synthesized loops), engine hum, sirens, cash and checkpoint stingers.
export const RADIO = [
  { name: 'EMBER FM 88.1', desc: 'Volcano rock — "Ashfall Anthem"', bpm: 132, wave: 'sawtooth', base: 110 },
  { name: 'LAVA LOUNGE 94.7', desc: 'Late-night island jazz — "Magma Moon"', bpm: 76, wave: 'triangle', base: 164.8 },
  { name: 'SLAG TALK 101.3', desc: 'Talk radio — "The Caldera Hour"', bpm: 100, wave: 'square', base: 220 },
  { name: 'BLACKSAND 107.9', desc: 'Beach synthwave — "Tide of Fire"', bpm: 118, wave: 'sine', base: 130.8 },
];

export function makeAudio() {
  return { ctx: null, muted: false, station: 0, beat: 0, nextNote: 0, osc: null, gain: null };
}

export function ensureAudio(audio) {
  if (audio.ctx || audio.muted) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new AC();
    audio.gain = audio.ctx.createGain();
    audio.gain.gain.value = 0.05;
    audio.gain.connect(audio.ctx.destination);
  } catch (e) { audio.ctx = null; }
}

export function radioTick(audio, dt) {
  if (!audio.ctx || audio.muted) return;
  const st = RADIO[audio.station];
  audio.nextNote -= dt;
  if (audio.nextNote <= 0) {
    audio.nextNote = 60 / st.bpm / 2;
    audio.beat++;
    const scale = [0, 3, 5, 7, 10, 12, 15];
    const note = scale[audio.beat % scale.length];
    const freq = st.base * Math.pow(2, note / 12);
    try {
      const o = audio.ctx.createOscillator();
      o.type = st.wave; o.frequency.value = freq;
      const g = audio.ctx.createGain();
      g.gain.setValueAtTime(0.5, audio.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.22);
      o.connect(g); g.connect(audio.gain);
      o.start(); o.stop(audio.ctx.currentTime + 0.24);
    } catch (e) { /* audio is best-effort */ }
  }
}

export function blip(audio, freq, dur, type) {
  if (!audio.ctx || audio.muted) return;
  try {
    const o = audio.ctx.createOscillator();
    o.type = type || 'sine'; o.frequency.value = freq;
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(0.4, audio.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + dur);
    o.connect(g); g.connect(audio.gain);
    o.start(); o.stop(audio.ctx.currentTime + dur);
  } catch (e) { /* best-effort */ }
}
