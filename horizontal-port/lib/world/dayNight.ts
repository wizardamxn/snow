/**
 * Turns a single number (timeOfDay, 0..1) into the entire state of the sky.
 *
 * This is a pure function — no Pixi, no side effects — so it's easy to reason
 * about and could be unit-tested in isolation. The scene calls it once per
 * frame and just applies the results (alphas + positions) to sprites.
 */

const TAU = Math.PI * 2;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export type CelestialBody = {
  /** Normalized screen position, 0..1 (multiply by width/height in the scene). */
  nx: number;
  ny: number;
  alpha: number;
};

export type SkySample = {
  /** Cross-fade weights for the three stacked sky gradients. */
  dayAlpha: number;
  nightAlpha: number;
  /** How much the twilight (dusk) base shows through — highest at the horizon. */
  starAlpha: number;
  /** 0 = deep night, 1 = full daylight; handy for tinting clouds/props. */
  daylight: number;
  sun: CelestialBody;
  moon: CelestialBody;
};

/** Position of a body arcing east→west across the sky for its "up" half of the day. */
function arc(phase: number, altitude: number): CelestialBody {
  const progress = (phase - 0.25) / 0.5; // 0 at rise, 1 at set
  return {
    nx: clamp(0.12 + 0.76 * progress),
    ny: 0.72 - 0.5 * clamp(altitude), // higher (smaller y) near the peak
    alpha: clamp(altitude * 3),
  };
}

export function sampleDayNight(t: number): SkySample {
  // Sun height: -1 at midnight, 0 at the horizon (sunrise/sunset), +1 at noon.
  const sunAltitude = Math.sin((t - 0.25) * TAU);
  const moonAltitude = -sunAltitude;

  return {
    dayAlpha: clamp(sunAltitude * 2),
    nightAlpha: clamp(-sunAltitude * 2),
    starAlpha: clamp(-sunAltitude),
    daylight: clamp(sunAltitude * 2),
    sun: arc(t, sunAltitude),
    moon: arc((t + 0.5) % 1, moonAltitude),
  };
}

/** Linear blend between two 0xRRGGBB colors, k in 0..1. */
export function lerpColor(a: number, b: number, k: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return (r << 16) | (g << 8) | bl;
}
