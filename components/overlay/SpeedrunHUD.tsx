"use client";

import { useEffect, useRef, useState } from "react";
import { speedrun, formatTime } from "@/lib/world/speedrun";

/**
 * Run timer for the terminal's `speedrun` easter egg. Only mounts its readout
 * while a run is active (or just finished). The digits are written straight to
 * the DOM via rAF — re-rendering React ten times a second for a clock would be
 * wasteful and would fight the rest of the overlay.
 */
export default function SpeedrunHUD() {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const timeRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sync = () => {
      setVisible(speedrun.running || speedrun.elapsedMs > 0);
      setDone(!speedrun.running && speedrun.elapsedMs > 0);
    };
    sync();
    return speedrun.subscribe(sync);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const tick = () => {
      if (timeRef.current) timeRef.current.textContent = formatTime(speedrun.elapsedMs);
      if (leftRef.current) leftRef.current.textContent = String(speedrun.remaining);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute right-4 font-pixel px-2.5 py-2 text-right"
      style={{
        top: "152px",
        background: "#0d0b08",
        border: `2px solid ${done ? "#40d020" : "#c8861e"}`,
        boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
        fontSize: "7px",
        color: done ? "#60d040" : "#f0c050",
        lineHeight: 1.9,
      }}
    >
      <div>
        {done ? "★ RUN COMPLETE " : "⏱ SPEEDRUN "}
        <span ref={timeRef}>{formatTime(speedrun.elapsedMs)}</span>
      </div>
      {!done && (
        <div style={{ color: "#b78a2a" }}>
          <span ref={leftRef}>{speedrun.remaining}</span> LEFT
        </div>
      )}
    </div>
  );
}
