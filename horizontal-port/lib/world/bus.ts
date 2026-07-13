/**
 * A tiny pub/sub bridge between the Pixi world (imperative, 60fps) and React
 * (declarative, event-driven).
 *
 * The Pixi loop checks proximity every frame, but we DON'T want React
 * re-rendering every frame. So the world only emits DISCRETE events — "the
 * near station changed" or "open this station" — and React subscribes and sets
 * state only when those fire. This keeps the two worlds decoupled and cheap.
 */

type StationId = string | null;
type Handler = (id: StationId) => void;
type GateHandler = (atGate: boolean) => void;
type SceneId = "overworld" | "interior";
type SceneHandler = (scene: SceneId) => void;

const nearHandlers = new Set<Handler>();
const openHandlers = new Set<Handler>();
const gateHandlers = new Set<GateHandler>();
const sceneHandlers = new Set<SceneHandler>();

export const bus = {
  emitNear(id: StationId) {
    nearHandlers.forEach((h) => h(id));
  },
  emitOpen(id: StationId) {
    openHandlers.forEach((h) => h(id));
  },
  emitGate(atGate: boolean) {
    gateHandlers.forEach((h) => h(atGate));
  },
  emitScene(scene: SceneId) {
    sceneHandlers.forEach((h) => h(scene));
  },
  /** Fires when the station the knight is standing at changes (or null). */
  onNear(h: Handler): () => void {
    nearHandlers.add(h);
    return () => nearHandlers.delete(h);
  },
  /** Fires when a station should open its panel. */
  onOpen(h: Handler): () => void {
    openHandlers.add(h);
    return () => openHandlers.delete(h);
  },
  /** Fires when the knight reaches (or leaves) the castle gate. */
  onGate(h: GateHandler): () => void {
    gateHandlers.add(h);
    return () => gateHandlers.delete(h);
  },
  /** Fires when the scene changes. */
  onScene(h: SceneHandler): () => void {
    sceneHandlers.add(h);
    return () => sceneHandlers.delete(h);
  },
};
