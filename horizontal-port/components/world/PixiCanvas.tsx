"use client";

import { useEffect, useRef } from "react";
import { Application, Ticker } from "pixi.js";
import { buildOverworldScene } from "./scenes/Overworld";
import { buildInteriorScene } from "./scenes/Interior";
import { worldState } from "@/lib/world/worldState";

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

      const overworldScene = await buildOverworldScene(instance);
      const interiorScene = await buildInteriorScene(instance);

      if (cancelled) {
        instance.destroy(true, { children: true });
        return;
      }

      // Hide interior initially
      interiorScene.container.visible = false;

      // The ticker is Pixi's per-frame loop. It runs the active scene's update loop.
      instance.ticker.add((ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;
        const showOverworld = worldState.scene === "overworld";
        
        overworldScene.container.visible = showOverworld;
        interiorScene.container.visible = !showOverworld;

        if (showOverworld) {
          overworldScene.update(dt);
        } else {
          interiorScene.update(dt);
        }
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
