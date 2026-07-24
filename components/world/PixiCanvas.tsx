"use client";

import { useEffect, useRef, useState } from "react";
import { Application, Ticker } from "pixi.js";
import { buildTownScene } from "./scenes/Town";
import { initInput, initMouseInput, input } from "./input";

const LOADING_TIPS = [
  "The Bard plays what Aman is listening to — live.",
  "Press [E] near a building to step inside.",
  "Hold SHIFT to sprint across the Frontier.",
  "There's a hidden terminal near spawn — try typing \"help\".",
  "A chieftain guards the north — bring your sword.",
  "Press [T] to fast-forward through the day/night cycle.",
];

export default function PixiCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  // Texture loading (trees, mobs, NPCs, buildings, decorations — dozens of
  // individual fetches) can take a visible moment, and the canvas isn't
  // appended to the DOM until it's done. Without this, that whole window is
  // just a blank/black gap. Show something immediately instead.
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTipIndex((i) => (i + 1) % LOADING_TIPS.length), 3200);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let sceneDispose: (() => void) | null = null;
    let cancelled = false;
    let disposeMouse: (() => void) | null = null;
    const disposeInput = initInput();

    (async () => {
      const instance = new Application();
      await instance.init({
        resizeTo: host,
        background: 0x1f3b2a,
        antialias: false,
      });

      // React 19 / dev-mode StrictMode mounts, unmounts, and remounts effects
      // immediately — if cleanup already fired while init() was awaiting,
      // discard this instance instead of attaching it.
      if (cancelled) {
        instance.destroy(true, { children: true });
        return;
      }

      const town = await buildTownScene(instance, (fraction) => {
        if (!cancelled) setProgress(fraction);
      });

      if (cancelled) {
        town.dispose?.();
        instance.destroy(true, { children: true });
        return;
      }

      sceneDispose = town.dispose ?? null;
      instance.stage.addChild(town.container);

      instance.ticker.add((ticker: Ticker) => {
        // Clamp long frame gaps (tab switches) so nothing tunnels through walls.
        const dt = Math.min(ticker.deltaMS / 1000, 0.05);
        town.update(dt);
        input.endFrame();
      });

      app = instance;
      host.appendChild(instance.canvas);
      disposeMouse = initMouseInput(instance.canvas);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      sceneDispose?.();
      disposeInput();
      disposeMouse?.();
      if (app) {
        host.removeChild(app.canvas);
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0" style={{ background: "#1f3b2a" }} />
      {loading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: "#0a1026" }}
        >
          <p
            className="font-pixel animate-pulse"
            style={{ fontSize: "10px", color: "#f0c050", letterSpacing: "0.15em" }}
          >
            LOADING THE FRONTIER…
          </p>
          <div
            style={{
              width: "160px",
              height: "10px",
              background: "#0d0b08",
              border: "2px solid #5a4020",
              boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#c8861e",
                width: `${Math.round(progress * 100)}%`,
                transition: "width 120ms linear",
              }}
            />
          </div>
          <p
            className="font-pixel text-center px-6"
            style={{ fontSize: "6px", color: "#8a6820", lineHeight: 1.8, maxWidth: "280px" }}
          >
            {LOADING_TIPS[tipIndex]}
          </p>
        </div>
      )}
    </div>
  );
}
