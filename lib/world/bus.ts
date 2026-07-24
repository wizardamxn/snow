/**
 * A tiny pub/sub bridge between the Pixi world (imperative, 60fps) and React
 * (declarative, event-driven).
 *
 * The Pixi loop checks proximity every frame, but we DON'T want React
 * re-rendering every frame. So the world only emits DISCRETE events — "the
 * thing I'm standing next to changed", "open this panel", "the scene changed" —
 * and React subscribes and sets state only when those fire.
 */

/** "town" for the overworld, or "interior:<buildingId>" for a building interior. */
export type Scene = "town" | (string & {});

/** What the player is currently standing next to (a door, an exhibit, a feature). */
export type NearInfo = { id: string; label: string; action: string } | null;

/** Recruiter Mode: the auto-walk tour's current stop, or null while inactive. */
export type TourInfo = { index: number; total: number; id: string; label: string; caption: string } | null;

type SceneHandler = (scene: Scene) => void;
type NearHandler = (info: NearInfo) => void;
type OpenHandler = (id: string) => void;
type VisitHandler = (id: string) => void;
type TourHandler = (info: TourInfo) => void;
type TourCommandHandler = (cmd: "start" | "skip") => void;

const sceneHandlers = new Set<SceneHandler>();
const nearHandlers = new Set<NearHandler>();
const openHandlers = new Set<OpenHandler>();
const visitHandlers = new Set<VisitHandler>();
const tourHandlers = new Set<TourHandler>();
const tourCommandHandlers = new Set<TourCommandHandler>();

export const bus = {
  emitScene(scene: Scene) {
    sceneHandlers.forEach((h) => h(scene));
  },
  /** Fires when the scene changes (town ⇄ interior). */
  onScene(h: SceneHandler): () => void {
    sceneHandlers.add(h);
    return () => sceneHandlers.delete(h);
  },

  emitNear(info: NearInfo) {
    nearHandlers.forEach((h) => h(info));
  },
  /** Fires when the interactable in range changes (or null when nothing is near). */
  onNear(h: NearHandler): () => void {
    nearHandlers.add(h);
    return () => nearHandlers.delete(h);
  },

  emitOpen(id: string) {
    openHandlers.forEach((h) => h(id));
  },
  /** Fires when a panel should open for the given content id. */
  onOpen(h: OpenHandler): () => void {
    openHandlers.add(h);
    return () => openHandlers.delete(h);
  },

  emitVisit(id: string) {
    visitHandlers.forEach((h) => h(id));
  },
  /** Fires whenever the player interacts with ANY landmark (panel or not — e.g. the bard). */
  onVisit(h: VisitHandler): () => void {
    visitHandlers.add(h);
    return () => visitHandlers.delete(h);
  },

  emitTour(info: TourInfo) {
    tourHandlers.forEach((h) => h(info));
  },
  /** Fires on every Recruiter Mode tour stop change, and once with `null` when it ends. */
  onTour(h: TourHandler): () => void {
    tourHandlers.add(h);
    return () => tourHandlers.delete(h);
  },

  emitTourCommand(cmd: "start" | "skip") {
    tourCommandHandlers.forEach((h) => h(cmd));
  },
  /** UI → world: request the Recruiter Mode tour start or be skipped. */
  onTourCommand(h: TourCommandHandler): () => void {
    tourCommandHandlers.add(h);
    return () => tourCommandHandlers.delete(h);
  },
};
