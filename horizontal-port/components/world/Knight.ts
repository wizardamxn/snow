import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { worldState } from "@/lib/world/worldState";
import { loadStrip } from "./sliceStrip";

/**
 * The knight, built from Tiny Swords' Warrior sprite sheets (192x192 frames).
 * The source art faces right, which is the direction of travel.
 */

const FRAME = 192;
// The character occupies the middle of the 192px frame. The feet are at 65% down.
const FEET_ANCHOR_Y = 0.65;
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

  // Ground shadow stays fixed at container origin (Y = 0)
  const shadow = new Graphics()
    .ellipse(0, 0, displayHeight * 0.18, displayHeight * 0.045)
    .fill({ color: 0x000000, alpha: 0.25 });
  container.addChild(shadow);

  const scale = displayHeight / FRAME;
  const sprite = new Sprite(idleFrames[0]);
  sprite.anchor.set(0.5, FEET_ANCHOR_Y);
  sprite.scale.set(scale, scale);
  sprite.y = 0; // relative starting position
  container.addChild(sprite);

  let elapsed = 0;
  let runBlend = 0;

  const setGround = (y: number) => {
    container.y = y; // container Y stays locked to ground
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

    // Apply the procedural bobbing solely to the sprite's relative Y,
    // leaving the shadow container anchored flat on the ground.
    const idleBob = Math.sin(elapsed * 2.2) * 0.8 * (1 - runBlend);
    const runBob = Math.abs(Math.sin(elapsed * RUN_FPS * 0.9)) * 1.5 * runBlend;
    sprite.y = -runBob + idleBob;
  };

  return { container, update, setGround };
}
