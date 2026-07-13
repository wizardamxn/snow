import { Assets, Rectangle, Texture } from "pixi.js";

/**
 * Loads a horizontal spritesheet strip (one PNG, N equal-width frames side by
 * side — how Tiny Swords and most simple packs export animations) and slices
 * it into individual Textures sharing the same underlying GPU texture source.
 * Frame count is inferred from the strip's total width.
 */
export async function loadStrip(
  url: string,
  frameWidth: number,
  frameHeight: number,
): Promise<Texture[]> {
  const base = (await Assets.load(url)) as Texture;
  base.source.scaleMode = "nearest";
  const count = Math.round(base.width / frameWidth);
  const frames: Texture[] = [];
  for (let i = 0; i < count; i++) {
    frames.push(
      new Texture({
        source: base.source,
        frame: new Rectangle(i * frameWidth, 0, frameWidth, frameHeight),
      }),
    );
  }
  return frames;
}
