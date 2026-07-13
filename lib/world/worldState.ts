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
  /**
   * Player world-pixel position — written every frame by the Pixi ticker.
   * React components (e.g. Minimap) poll these via requestAnimationFrame so
   * no re-renders are triggered. Do NOT read these in React state/effects.
   */
  playerX: 0,
  playerY: 0,
  /**
   * Day/Night cycle state.
   * timeOfDay goes from 0 to 24.
   */
  timeOfDay: 17, // Start at Golden Hour
  cycleRunning: true,
  /**
   * Raven NPC world-pixel position for the speech bubble.
   */
  ravenX: 0,
  ravenY: 0,
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
