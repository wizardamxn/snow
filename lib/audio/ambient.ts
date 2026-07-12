/**
 * Ambient audio, synthesized with the Web Audio API — no asset needed yet.
 *
 * A low medieval drone (root + fifth + octave) through a slowly-sweeping
 * lowpass filter. In Phase 8 this is replaced by streaming a real royalty-free
 * track through the same masterGain, so the mute/volume UI keeps working.
 *
 * Browsers forbid audio until a user gesture, so nothing is created until
 * `ensureStarted()` is called from a real click/keypress.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;

let volume = 0.4;
let muted = false;

function applyGain() {
  if (master && ctx) {
    // Smooth the change to avoid clicks.
    master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05);
  }
}

export function ensureStarted(): void {
  if (typeof window === "undefined") return;
  if (started) {
    ctx?.resume();
    return;
  }
  started = true;

  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  ctx = new AudioCtor();

  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  filter.Q.value = 4;
  filter.connect(master);

  // Root A2, fifth E3, octave A3.
  const notes = [110, 164.81, 220];
  notes.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    osc.type = i === 2 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 5; // slight detune for warmth
    const voice = ctx!.createGain();
    voice.gain.value = i === 2 ? 0.05 : 0.09;
    osc.connect(voice);
    voice.connect(filter);
    osc.start();
  });

  // Slow filter sweep so the timbre gently breathes.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 140;
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  lfo.start();

  // Fade in the master over a few seconds.
  applyGain();
}

export function setVolume(v: number): void {
  volume = Math.min(1, Math.max(0, v));
  applyGain();
}

export function setMuted(m: boolean): void {
  muted = m;
  applyGain();
}

export function getAudioState(): { volume: number; muted: boolean } {
  return { volume, muted };
}
