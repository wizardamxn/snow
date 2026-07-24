import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { getTex, sliceFrames } from "./tiles";
import { input, KEY } from "./input";

const PLAYER_H = 74; // display height in world px
const FRAME = 192; // source frame size of the Warrior strips
const SPEED = 155; // walk speed, world px/s
const SPRINT = 1.7;
const AUTOPILOT_SPEED = 3.0; // faster than manual sprint — this is a guided tour, not a walk
const IDLE_FPS = 7;
const RUN_FPS = 13;
const ATTACK_FPS = 12; // 4 frames ≈ a 1/3s swing

/** A point is walkable if this predicate returns true. */
export type CanWalk = (x: number, y: number) => boolean;

export type Player = {
  container: Container;
  /** Advance one frame. Returns whether the player moved this frame. */
  update: (dt: number, canWalk: CanWalk) => boolean;
  get x(): number;
  get y(): number; // feet position
  /** True only on the single frame a sword swing begins — a hit-detection pulse. */
  get justSwung(): boolean;
  setPosition: (x: number, y: number) => void;
  /** Steers toward `target` each frame (ignoring keyboard input) until it arrives, then clears itself. Pass null to cancel. */
  setAutopilotTarget: (target: { x: number; y: number } | null) => void;
  get isAutopiloting(): boolean;
};

export const PLAYER_URLS = [
  "/pixel/knight/Warrior_Idle.png",
  "/pixel/knight/Warrior_Run.png",
  "/pixel/knight/Warrior_Attack1.png",
];

export async function createPlayer(startX: number, startY: number): Promise<Player> {
  const idleTex = getTex(PLAYER_URLS[0]);
  const runTex = getTex(PLAYER_URLS[1]);
  const attackTex = getTex(PLAYER_URLS[2]);
  const idleFrames: Texture[] = sliceFrames(idleTex, FRAME, FRAME);
  const runFrames: Texture[] = sliceFrames(runTex, FRAME, FRAME);
  const attackFrames: Texture[] = sliceFrames(attackTex, FRAME, FRAME);

  const container = new Container();

  const shadow = new Graphics()
    .ellipse(0, -2, 18, 7)
    .fill({ color: 0x000000, alpha: 0.28 });
  container.addChild(shadow);

  const baseScale = PLAYER_H / FRAME;
  const sprite = new Sprite(idleFrames[0]);
  sprite.anchor.set(0.5, 0.82); // feet near the container origin
  sprite.scale.set(baseScale);
  container.addChild(sprite);

  let x = startX;
  let y = startY;
  let facing = 1;
  let animTime = 0;
  let bob = 0;
  let attacking = false;
  let attackTime = 0;
  let swungThisFrame = false;
  let autopilotTarget: { x: number; y: number } | null = null;
  // Tour waypoints sit in open street, not against a wall, so this can stay
  // tight enough for crisp corner-turning without overshooting.
  const AUTOPILOT_ARRIVE = 16; // px — close enough to count as "reached this waypoint"

  container.x = x;
  container.y = y;

  // Feet collision box corners, tested against the walkability predicate.
  const HW = 13; // half-width
  const boxFree = (cx: number, cy: number, canWalk: CanWalk): boolean =>
    canWalk(cx - HW, cy - 2) &&
    canWalk(cx + HW, cy - 2) &&
    canWalk(cx - HW, cy - 16) &&
    canWalk(cx + HW, cy - 16);

  const update = (dt: number, canWalk: CanWalk): boolean => {
    swungThisFrame = false;
    let dx = 0;
    let dy = 0;
    let onAutopilot = false;

    if (autopilotTarget) {
      const tdx = autopilotTarget.x - x;
      const tdy = autopilotTarget.y - y;
      const dist = Math.hypot(tdx, tdy);
      if (dist <= AUTOPILOT_ARRIVE) {
        autopilotTarget = null;
      } else {
        dx = tdx / dist;
        dy = tdy / dist;
        onAutopilot = true;
      }
    }
    if (!onAutopilot) {
      if (input.isDown(...KEY.left)) dx -= 1;
      if (input.isDown(...KEY.right)) dx += 1;
      if (input.isDown(...KEY.up)) dy -= 1;
      if (input.isDown(...KEY.down)) dy += 1;
    }

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      // Normalise so diagonals aren't faster.
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const sprint = onAutopilot ? AUTOPILOT_SPEED : input.isDown(...KEY.sprint) ? SPRINT : 1;
      const step = SPEED * sprint * dt;

      const nx = x + dx * step;
      if (boxFree(nx, y, canWalk)) x = nx;
      const ny = y + dy * step;
      if (boxFree(x, ny, canWalk)) y = ny;

      if (dx < 0) facing = -1;
      else if (dx > 0) facing = 1;
    }

    // Frame animation (driven manually, no reliance on a shared ticker).
    const frames = moving ? runFrames : idleFrames;
    const fps = moving ? (onAutopilot ? RUN_FPS * (AUTOPILOT_SPEED / SPRINT) : RUN_FPS) : IDLE_FPS;
    animTime += dt;
    const currentFrameIdx = Math.floor(animTime * fps) % frames.length;
    
    // Play footstep on specific run animation frames (e.g. frame 1 and 4)
    if (moving && sprite.texture !== frames[currentFrameIdx]) {
      if (currentFrameIdx === 1 || currentFrameIdx === 4) {
        import("@/lib/audio/ambient").then(m => m.playFootstep());
      }
    }
    
    sprite.texture = frames[currentFrameIdx];

    // Left-click swings the sword — a one-shot overlay on top of idle/run, so
    // movement keeps working mid-swing instead of locking the player in place.
    if (input.justPressed(...KEY.attack) && !attacking) {
      attacking = true;
      attackTime = 0;
      swungThisFrame = true;
    }
    if (attacking) {
      attackTime += dt;
      const attackIdx = Math.floor(attackTime * ATTACK_FPS);
      if (attackIdx >= attackFrames.length) {
        attacking = false;
      } else {
        sprite.texture = attackFrames[attackIdx];
      }
    }

    // Subtle walk bob
    bob = moving ? bob + dt * 12 : 0;
    sprite.y = moving ? -Math.abs(Math.sin(bob)) * 3 : 0;

    sprite.scale.x = baseScale * facing;
    container.x = Math.round(x);
    container.y = Math.round(y);
    container.zIndex = y; // depth-sort against buildings/trees

    return moving;
  };

  return {
    container,
    update,
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get justSwung() {
      return swungThisFrame;
    },
    setPosition(nx: number, ny: number) {
      x = nx;
      y = ny;
      container.x = nx;
      container.y = ny;
    },
    setAutopilotTarget(target: { x: number; y: number } | null) {
      autopilotTarget = target;
    },
    get isAutopiloting() {
      return autopilotTarget !== null;
    },
  };
}
