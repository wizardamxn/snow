"use client";

import { useEffect, useRef, useState } from "react";
import { Application, Ticker } from "pixi.js";
import { buildTownScene } from "./scenes/Town";
import { initInput, initMouseInput, input } from "./input";

export default function PixiCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  // Texture loading (trees, mobs, NPCs, buildings, decorations — dozens of
  // individual fetches) can take a visible moment, and the canvas isn't
  // appended to the DOM until it's done. Without this, that whole window is
  // just a blank/black gap. Show something immediately instead.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
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

      const town = await buildTownScene(instance);

      if (cancelled) {
        instance.destroy(true, { children: true });
        return;
      }

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
              className="loading-bar-fill"
              style={{ height: "100%", background: "#c8861e", width: "40%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
