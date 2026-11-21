/**
 * Ambient audio engine.
 * Plays a real MP3 file on loop and synthesizes UI sounds and footsteps.
 */

let ctx: AudioContext | null = null;
let bgMusic: HTMLAudioElement | null = null;

// Volumes
let masterVolume = 0.8;
/** Background music sits well under the master level so it stays ambience, not a soundtrack. */
const MUSIC_LEVEL = 0.3;
const MUTE_KEY = "sigma_muted";
let muted = (() => {
  try {
    return typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

let started = false;

/**
 * Music plays only when unmuted AND the tab is visible. iOS ignores
 * `audio.volume`, so muting must use `muted` + pause, not volume 0; and a hidden
 * tab (app switched, screen locked) should never keep playing.
 */
function applyVolumes() {
  if (!bgMusic) return;
  bgMusic.volume = masterVolume * MUSIC_LEVEL;
  bgMusic.muted = muted;
  if (muted || document.hidden) bgMusic.pause();
  else if (bgMusic.paused) bgMusic.play().catch(() => {});
}

export function ensureStarted(): void {
  if (typeof window === "undefined") return;
  if (started) {
    applyVolumes();
    ctx?.resume();
    return;
  }
  started = true;

  // 1. Setup BG Music
  bgMusic = new Audio("/audio/music.mp3");
  bgMusic.loop = true;

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
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    // private mode / storage off: mute still works for this visit
  }
  applyVolumes();
}

export function getAudioState(): { volume: number; muted: boolean } {
  return { volume: masterVolume, muted };
}

/**
 * Synthesize a quick 8-bit "blip" sound for UI interactions.
 */
export function playBlip(): void {
  if (!ctx || muted) return;
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
  if (!ctx || muted) return;
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

/**
 * Start the music on the first key or click. Called by the game's Overlay only:
 * this module is also bundled into the phone resume view, and arming it at
 * import time made any tap on that page start the game's music.
 */
export function armAutostart(): () => void {
  const start = () => {
    if (!started) ensureStarted();
    disarm();
  };
  const disarm = () => {
    window.removeEventListener("keydown", start);
    window.removeEventListener("click", start);
  };
  window.addEventListener("keydown", start);
  window.addEventListener("click", start);
  return disarm;
}

if (typeof window !== "undefined") {
  // Pause everything when the tab is hidden (app switch, screen lock), resume when it's back.
  document.addEventListener("visibilitychange", () => {
    if (!started) return;
    applyVolumes();
    if (document.hidden) ctx?.suspend();
    else ctx?.resume();
  });
}
