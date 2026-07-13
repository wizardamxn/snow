/**
 * Ambient audio engine.
 * Plays a real MP3 file on loop and synthesizes UI sounds and footsteps.
 */

let ctx: AudioContext | null = null;
let bgMusic: HTMLAudioElement | null = null;

// Volumes
let masterVolume = 0.8;
let muted = false;

let started = false;

function applyVolumes() {
  if (bgMusic) {
    bgMusic.volume = muted ? 0 : masterVolume;
  }
}

export function ensureStarted(): void {
  if (typeof window === "undefined") return;
  if (started) {
    if (bgMusic && bgMusic.paused) bgMusic.play().catch(() => {});
    ctx?.resume();
    return;
  }
  started = true;

  // 1. Setup BG Music
  bgMusic = new Audio("/audio/music.mp3");
  bgMusic.loop = true;
  bgMusic.volume = muted ? 0 : masterVolume;
  bgMusic.play().catch((e) => console.warn("Audio play blocked:", e));

  // 2. Setup Web Audio for SFX
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AudioCtor();
  if (ctx.state === "suspended") ctx.resume();

  applyVolumes();
}

export function setVolume(v: number): void {
  masterVolume = Math.min(1, Math.max(0, v));
  applyVolumes();
}

export function setMuted(m: boolean): void {
  muted = m;
  applyVolumes();
}

export function getAudioState(): { volume: number; muted: boolean } {
  return { volume: masterVolume, muted };
}

/**
 * Synthesize a quick 8-bit "blip" sound for UI interactions.
 */
export function playBlip(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3 * masterVolume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.type = "square";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/**
 * Synthesize a soft footstep "crunch".
 */
export function playFootstep(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  
  // Create a tiny white noise burst
  const bufferSize = ctx.sampleRate * 0.1; // 100ms
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1000;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4 * masterVolume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(t);
}

// Ensure audio starts on the very first user interaction if the tutorial was already dismissed.
if (typeof window !== "undefined") {
  const startAudioOnInteraction = () => {
    if (!started) ensureStarted();
    window.removeEventListener("keydown", startAudioOnInteraction);
    window.removeEventListener("click", startAudioOnInteraction);
  };
  window.addEventListener("keydown", startAudioOnInteraction);
  window.addEventListener("click", startAudioOnInteraction);
}
