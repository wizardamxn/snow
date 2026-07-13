import { Container } from "pixi.js";
import { worldState } from "@/lib/world/worldState";

export type ParallaxLayer = {
  container: Container;
  update: () => void;
};

/**
 * A horizontally-scrolling, infinitely-wrapping layer.
 *
 * We build the tile content TWICE and lay the copies side by side (at x=0 and
 * x=tileWidth). As `worldX` grows we slide the whole thing left; once it has
 * slid a full tile we wrap back to 0 (via modulo), and because copy B looks
 * like copy A the seam is invisible for continuous content (like hills).
 *
 * `factor` is the depth: 0.15 = distant/slow, 1.0 = foreground/fast. Feeding
 * every layer the same `worldX` but different factors is the whole trick of
 * parallax — near things race past, far things barely move.
 */
export function createParallaxLayer(
  tileWidth: number,
  factor: number,
  build: () => Container,
): ParallaxLayer {
  const container = new Container();
  const a = build();
  const b = build();
  a.x = 0;
  b.x = tileWidth;
  container.addChild(a, b);

  const update = () => {
    const off =
      (((worldState.worldX * factor) % tileWidth) + tileWidth) % tileWidth;
    container.x = -off;
  };

  return { container, update };
}
