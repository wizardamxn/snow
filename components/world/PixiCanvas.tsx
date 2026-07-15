"use client";

import { useEffect, useRef } from "react";
import { Application, Ticker } from "pixi.js";
import { buildTownScene } from "./scenes/Town";
import { initInput, initMouseInput, input } from "./input";

export default function PixiCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

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

  return <div ref={hostRef} className="absolute inset-0" />;
}
