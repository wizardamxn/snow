"use client";

import { useEffect, useRef } from "react";
import { worldState } from "@/lib/world/worldState";

/**
 * Screen-space cinematic framing: a static vignette plus a subtle colour grade
 * that tracks the in-game clock (pink dawn, neutral noon, amber dusk, blue night).
 *
 * Deliberately SUBTLE — the world already has its own full-map day/night tint
 * (`nightOverlay` in Town.ts, which lives in world space and scales with the
 * camera). This layer only adds what a world-space tint can't: darkened screen
 * corners, and a touch of hue the world tint doesn't reach at full daylight
 * (where its alpha is 0). Keep the alphas low or the two stack into mud.
 *
 * Driven by requestAnimationFrame writing straight to `style`, never React
 * state — the clock changes every frame and re-rendering the overlay tree that
 * often would be wasteful.
 */

/** Grade stops by hour-of-day; alpha is the strength of the wash. */
const STOPS: { hour: number; rgb: [number, number, number]; alpha: number }[] = [
  { hour: 0, rgb: [40, 70, 160], alpha: 0.14 }, // deep night — cool blue
  { hour: 5, rgb: [255, 130, 160], alpha: 0.12 }, // dawn — pink
  { hour: 8, rgb: [255, 200, 140], alpha: 0.05 }, // morning — soft warm
  { hour: 12, rgb: [255, 240, 210], alpha: 0.02 }, // noon — near neutral
  { hour: 17, rgb: [255, 150, 60], alpha: 0.1 }, // golden hour — amber
  { hour: 20, rgb: [90, 80, 170], alpha: 0.13 }, // dusk — violet
  { hour: 24, rgb: [40, 70, 160], alpha: 0.14 }, // wraps back to night
];

function gradeAt(hour: number): string {
  let a = STOPS[0];
  let b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (hour >= STOPS[i].hour && hour <= STOPS[i + 1].hour) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const span = b.hour - a.hour || 1;
  const k = Math.min(1, Math.max(0, (hour - a.hour) / span));
  const ch = (i: number) => Math.round(a.rgb[i] + (b.rgb[i] - a.rgb[i]) * k);
  const alpha = a.alpha + (b.alpha - a.alpha) * k;
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, ${alpha.toFixed(3)})`;
}

export default function ColorGrade() {
  const gradeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Honour reduced-motion by holding a fixed neutral grade rather than
    // letting the tint drift with the clock.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      if (gradeRef.current) gradeRef.current.style.background = gradeAt(12);
      return;
    }

    let frame = 0;
    let lastKey = "";
    const tick = () => {
      const el = gradeRef.current;
      if (el) {
        // Only touch the DOM when the rounded hour-tenth actually changes —
        // the grade moves far slower than 60fps, so this is a no-op most frames.
        const key = (Math.round(worldState.timeOfDay * 10) / 10).toFixed(1);
        if (key !== lastKey) {
          lastKey = key;
          el.style.background = gradeAt(worldState.timeOfDay);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div ref={gradeRef} aria-hidden className="pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 78%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
