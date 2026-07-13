import { Assets, Container, Sprite, Texture } from "pixi.js";
import { CASTLE_X, worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";

export type CastleController = {
  container: Container;
  update: (currentW: number, currentH: number, currentGroundY: number, scale: number) => void;
};

const CASTLE_URL = "/pixel/castle/Castle.png";

export async function createCastle(
  width: number,
  height: number,
  groundY: number,
): Promise<CastleController> {
  const texture = (await Assets.load(CASTLE_URL)) as Texture;
  texture.source.scaleMode = "nearest";

  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 1); // bottom-center anchored on the ground

  let atGateLatch = false;

  const update = (currentW: number, currentH: number, currentGroundY: number, scale: number) => {
    const progress = worldState.worldX / CASTLE_X; // 0..1

    // 2.5D Scaling: Castle grows from 20% to 100% of its target height as you approach
    const targetHeight = currentH * 0.38; // standard fully-scaled height
    const scaleMult = 0.25 + 0.75 * Math.pow(progress, 1.8);
    const castleScale = (targetHeight * scaleMult) / texture.height;
    sprite.scale.set(castleScale);

    // Parallax scrolling factor: starts at 0.35 (slower/far) and reaches 1.0 (ground locked) at arrival
    const scrollFactor = 0.35 + 0.65 * progress;
    const knightScreenX = currentW * 0.18;
    sprite.x = knightScreenX + (CASTLE_X - worldState.worldX) * scale * scrollFactor;
    
    // Y stays anchored at groundY; anchor (0.5, 1.0) keeps base flat on the grass
    sprite.y = currentGroundY;

    // Trigger "Enter Castle" overlay prompt when within 100px of the gate
    const remaining = CASTLE_X - worldState.worldX;
    const atGate = remaining < 100;
    if (atGate !== atGateLatch) {
      atGateLatch = atGate;
      bus.emitGate(atGate);
    }
  };

  return { container: sprite, update };
}
