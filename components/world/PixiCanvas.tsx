"use client";

import { useEffect, useRef } from "react";
import { Application, Ticker } from "pixi.js";
import { buildOverworldScene } from "./scenes/Overworld";

export default function PixiCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let cancelled = false;

    (async () => {
      const instance = new Application();
      await instance.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: false,
      });

      // React 19 / dev-mode StrictMode mounts, unmounts, and remounts effects
      // immediately — if cleanup already fired while init() was awaiting,
      // discard this instance instead of attaching it.
      if (cancelled) {
        instance.destroy(true, { children: true });
        return;
      }

      // buildOverworldScene awaits Assets.load, so cancellation can still land
      // mid-build — check again before this instance goes live.
      const scene = await buildOverworldScene(instance);

      if (cancelled) {
        instance.destroy(true, { children: true });
        return;
      }

      // The ticker is Pixi's per-frame loop. It runs scene.update every frame
      // with the real elapsed time (deltaMS), so animation speed stays constant
      // regardless of the monitor's refresh rate.
      instance.ticker.add((ticker: Ticker) => {
        scene.update(ticker.deltaMS / 1000);
      });

      app = instance;
      host.appendChild(instance.canvas);
    })();

    return () => {
      cancelled = true;
      if (app) {
        host.removeChild(app.canvas);
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}
