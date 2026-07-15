"use client";

import { useEffect, useState } from "react";

/**
 * The world is wide (52x38 tiles, camera locked to a landscape-ish aspect) —
 * in portrait on a phone everything crowds into a narrow strip. There's no
 * reliable cross-browser way to force real orientation-lock outside a
 * fullscreen/PWA context (iOS Safari never supports it at all), so this is
 * the actual fix: block the game with a "rotate" prompt until the device is
 * physically turned. The screen.orientation.lock call below is just a
 * best-effort bonus for the browsers that do support it.
 */
export default function RotatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const touchMq = window.matchMedia("(pointer: coarse)");
    const portraitMq = window.matchMedia("(orientation: portrait)");
    const update = () => setShow(touchMq.matches && portraitMq.matches);
    update();
    touchMq.addEventListener("change", update);
    portraitMq.addEventListener("change", update);

    const orientation = screen.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
      | undefined;
    orientation?.lock?.("landscape").catch(() => {});

    return () => {
      touchMq.removeEventListener("change", update);
      portraitMq.removeEventListener("change", update);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6 pointer-events-auto"
      style={{ zIndex: 100, background: "#0a1026" }}
    >
      <div style={{ width: 44, height: 70 }}>
        <div
          className="rotate-hint"
          style={{
            width: 44,
            height: 70,
            border: "3px solid #f0c050",
            borderRadius: "8px",
            background: "#0a1026",
            boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "16px",
              height: "3px",
              background: "#f0c050",
            }}
          />
        </div>
      </div>
      <p
        className="font-pixel text-center"
        style={{ fontSize: "11px", color: "#f0c050", letterSpacing: "0.1em", padding: "0 24px" }}
      >
        ROTATE YOUR DEVICE
      </p>
      <p
        className="font-mono text-sm text-center"
        style={{ color: "#7a6a4a", padding: "0 32px", maxWidth: "320px" }}
      >
        The frontier is wider than it is tall — turn to landscape to explore.
      </p>
    </div>
  );
}
