/**
 * The single source of truth the world reads from every frame.
 *
 * A plain module singleton so both Pixi (the render loop) and React (the HUD
 * overlay) read/write the exact same state without prop-drilling.
 */
import { bus } from "@/lib/world/bus";

let currentScene: "overworld" | "interior" = "overworld";

export const worldState = {
  get scene() {
    return currentScene;
  },
  set scene(val: "overworld" | "interior") {
    if (currentScene !== val) {
      currentScene = val;
      bus.emitScene(val);
    }
  },
  /** Position in the day, 0..1 — 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. */
  timeOfDay: 0.22,
  /** How far the knight has travelled, in world pixels. Drives parallax + time. */
  worldX: 0,
  /** Whether the knight is currently running. The HUD drives this from input. */
  running: false,
  /** Hold Shift to sprint (covers ground faster). */
  sprint: false,
};

/** How fast the world slides past while running, in world pixels per second. */
const RUN_SPEED = 240;
/** Travel distance (world px) for one full day→night cycle. */
const DAY_DISTANCE = 20000;
/** Time of day the journey begins at (mid-morning). */
const START_TIME = 0.22;

/** World-X of the castle gate — the end of the road. Running stops here. */
export const CASTLE_X = 15500;

export function advanceWorld(dtSeconds: number): void {
  if (worldState.scene === "interior") {
    worldState.running = false;
    return;
  }

  if (worldState.running) {
    worldState.worldX += RUN_SPEED * (worldState.sprint ? 2.8 : 1) * dtSeconds;
  }
  // Hard boundary: you can't run past the castle gate.
  worldState.worldX = Math.max(0, Math.min(CASTLE_X, worldState.worldX));

  // Time of day is now a function of distance travelled — the journey itself
  // carries us toward dusk and night. Standing still holds the clock.
  worldState.timeOfDay = (START_TIME + worldState.worldX / DAY_DISTANCE) % 1;
}
