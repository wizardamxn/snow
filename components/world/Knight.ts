import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { worldState } from "@/lib/world/worldState";
import { loadStrip } from "./sliceStrip";

/**
 * The knight, built from Tiny Swords' Warrior sprite sheets (192x192 frames).
 * We DON'T use Pixi's AnimatedSprite/its autoplay — that hooks into the global
 * shared ticker, a second clock independent of our own per-frame `dt`. Instead
 * we manually pick the current frame from `frames[idle|run]` inside `update`,
 * so animation speed is driven by the exact same clock as everything else in
 * the scene (and can be scaled by runBlend, paused, etc. — full control).
 *
 * The source art faces left; we mirror it (scale.x = -1) to face right, the
 * direction of travel.
 */

const FRAME = 192;
// The character occupies only the middle of the 192px frame (transparent
// padding + baked shadow below the feet) — feet sit at roughly 81% down.
const FEET_ANCHOR_Y = 0.81;
const IDLE_FPS = 6;
const RUN_FPS = 12;

export type Knight = {
  container: Container;
  update: (dtSeconds: number) => void;
  setGround: (y: number) => void;
};

export async function createKnight(displayHeight: number): Promise<Knight> {
  const [idleFrames, runFrames] = await Promise.all([
    loadStrip("/pixel/knight/Warrior_Idle.png", FRAME, FRAME),
    loadStrip("/pixel/knight/Warrior_Run.png", FRAME, FRAME),
  ]);

  const container = new Container();

  const shadow = new Graphics()
    .ellipse(0, 0, displayHeight * 0.18, displayHeight * 0.045)
    .fill({ color: 0x000000, alpha: 0.25 });
  container.addChild(shadow);

  const scale = displayHeight / FRAME;
  const sprite = new Sprite(idleFrames[0]);
  sprite.anchor.set(0.5, FEET_ANCHOR_Y);
  sprite.scale.set(-scale, scale); // negative x = mirrored to face right
  container.addChild(sprite);

  let elapsed = 0;
  let runBlend = 0;
  let baseY = container.y;

  const setGround = (y: number) => {
    baseY = y;
    container.y = y;
  };

  const pickFrame = (frames: Texture[], fps: number): Texture => {
    const idx = Math.floor(elapsed * fps) % frames.length;
    return frames[idx];
  };

  const update = (dt: number) => {
    elapsed += dt;
    const target = worldState.running ? 1 : 0;
    runBlend += (target - runBlend) * Math.min(1, dt * 10);

    sprite.texture = worldState.running
      ? pickFrame(runFrames, RUN_FPS)
      : pickFrame(idleFrames, IDLE_FPS);

    // A light procedural bob layered on top of the spritesheet for extra weight.
    const idleBob = Math.sin(elapsed * 2.2) * 1.2 * (1 - runBlend);
    const runBob = Math.abs(Math.sin(elapsed * RUN_FPS * 0.9)) * 2.5 * runBlend;
    container.y = baseY - runBob + idleBob;
  };

  return { container, update, setGround };
}
