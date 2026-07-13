import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { createKnight } from "@/components/world/Knight";

export type InteriorController = {
  container: Container;
  update: (dtSeconds: number) => void;
};

const BG_URL = "/pixel/bg/castle_interior.png";

export async function buildInteriorScene(
  app: Application,
): Promise<InteriorController> {
  const container = new Container();

  const bgTex = (await Assets.load(BG_URL)) as Texture;
  bgTex.source.scaleMode = "nearest";

  const bgSprite = new Sprite(bgTex);
  bgSprite.anchor.set(0.5, 0.5);
  container.addChild(bgSprite);

  const DESIGN_H = 600;
  const knight = await createKnight(130);
  container.addChild(knight.container);

  let lastW = 0;
  let lastH = 0;

  const performLayout = () => {
    const curW = app.screen.width;
    const curH = app.screen.height;
    if (curW === lastW && curH === lastH) return;

    lastW = curW;
    lastH = curH;

    const scale = curH / DESIGN_H;

    // Scale background to fill screen while preserving aspect ratio
    const bgScale = Math.max(curH / bgTex.height, curW / bgTex.width);
    bgSprite.scale.set(bgScale);
    bgSprite.x = curW / 2;
    bgSprite.y = curH / 2;

    // Position Knight on the floor of the throne room (near the bottom-center)
    knight.container.scale.set(scale);
    knight.container.x = curW / 2;
    const groundY = curH - 128 * scale;
    knight.setGround(groundY);
  };

  performLayout();

  const update = (dt: number) => {
    performLayout();
    knight.update(dt);
  };

  return { container: container, update };
}
