/**
 * The single source of truth the world reads from every frame.
 *
 * A plain module singleton so both Pixi (the render loop) and React (the HUD
 * overlay) read/write the exact same state without prop-drilling.
 */
import { bus, type Scene, type NearInfo } from "@/lib/world/bus";

let currentScene: Scene = "town";

export const worldState = {
  get scene(): Scene {
    return currentScene;
  },
  set scene(val: Scene) {
    if (currentScene !== val) {
      currentScene = val;
      bus.emitScene(val);
    }
  },
  /** The interactable the player is currently next to (drives the HUD prompt). */
  near: null as NearInfo,
};

/**
 * Update what the player is standing next to, emitting only on a real change so
 * React re-renders at most once per proximity transition (not every frame).
 */
export function setNear(info: NearInfo): void {
  const prevId = worldState.near?.id ?? null;
  const nextId = info?.id ?? null;
  if (prevId !== nextId) {
    worldState.near = info;
    bus.emitNear(info);
  }
}
