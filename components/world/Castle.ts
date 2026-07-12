import { Assets, Container, Sprite, Texture } from "pixi.js";
import { CASTLE_X, worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";

export type CastleController = {
  container: Container;
  update: () => void;
};

/** Distance (world px) before the gate at which the castle starts to appear. */
const REVEAL_DIST = 6000;
const CASTLE_URL = "/pixel/castle/Castle.png";

export async function createCastle(
  width: number,
  height: number,
  groundY: number,
): Promise<CastleController> {
  const texture = (await Assets.load(CASTLE_URL)) as Texture;
  texture.source.scaleMode = "nearest";

  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 1);
  sprite.visible = false;

  let atGateLatch = false;

  const update = () => {
    const remaining = CASTLE_X - worldState.worldX;
    if (remaining > REVEAL_DIST) {
      sprite.visible = false;
      return;
    }
    sprite.visible = true;

    // t: 0 when first revealed (far, small, hazy) → 1 at the gate (near, large).
    // At the gate the castle fills just over half the screen height.
    const t = 1 - remaining / REVEAL_DIST;
    const scaleMax = (height * 0.55) / texture.height;
    sprite.scale.set(scaleMax * (0.25 + 0.75 * t));
    sprite.x = width * (0.72 - 0.14 * t); // drifts toward center as you near
    sprite.y = groundY;
    sprite.alpha = Math.min(1, t * 2.2); // atmospheric haze fade-in

    const atGate = remaining < 100;
    if (atGate !== atGateLatch) {
      atGateLatch = atGate;
      bus.emitGate(atGate);
    }
  };

  return { container: sprite, update };
}
