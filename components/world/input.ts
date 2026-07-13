/**
 * Global keyboard state for the game loop.
 *
 * The Pixi update loop polls `input.isDown(...)` for held movement keys and
 * `input.justPressed(...)` for one-shot actions (like pressing E to interact).
 * `endFrame()` must be called once per frame, after all scenes have updated, to
 * clear the just-pressed edge set.
 */

const down = new Set<string>();
const pressed = new Set<string>();

const PREVENT = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

/** Attach the window listeners. Returns a cleanup function. */
export function initInput(): () => void {
  const onDown = (e: KeyboardEvent) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
  };
  const onUp = (e: KeyboardEvent) => {
    down.delete(e.code);
  };
  const onBlur = () => {
    down.clear();
    pressed.clear();
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);
  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
    down.clear();
    pressed.clear();
  };
}

export const input = {
  /** True while any of the given key codes are held. */
  isDown(...codes: string[]): boolean {
    return codes.some((c) => down.has(c));
  },
  /** True on the single frame a key transitions from up → down. */
  justPressed(...codes: string[]): boolean {
    return codes.some((c) => pressed.has(c));
  },
  /** Clear the one-frame edge set. Call once per frame after updates. */
  endFrame(): void {
    pressed.clear();
  },
};

// Semantic key groups shared across scenes.
export const KEY = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  sprint: ["ShiftLeft", "ShiftRight"],
  interact: ["KeyE", "Enter", "Space"],
  back: ["Escape", "KeyQ"],
} as const;
