import { Assets, Rectangle, Texture } from "pixi.js";

/** One tile is 64×64 source pixels across all Tiny Swords terrain art. */
export const TILE = 64;

/** Load a texture and keep it crisp (nearest-neighbour, no smoothing). */
export async function loadTex(url: string): Promise<Texture> {
  const tex = (await Assets.load(url)) as Texture;
  tex.source.scaleMode = "nearest";
  return tex;
}

/** Load several textures in parallel, all set to nearest-neighbour. */
export function loadTextures(urls: string[]): Promise<Texture[]> {
  return Promise.all(urls.map(loadTex));
}

/**
 * Slice a single tile out of a tilemap spritesheet (shares the GPU source).
 */
export function extractTile(
  source: Texture,
  col: number,
  row: number,
  tw = TILE,
  th = TILE,
): Texture {
  return new Texture({
    source: source.source,
    frame: new Rectangle(col * tw, row * th, tw, th),
  });
}

/**
 * Slice a horizontal animation strip (one row of equal-width frames) into
 * individual textures. Frame count is inferred from the strip width.
 */
export function sliceFrames(
  source: Texture,
  frameW: number,
  frameH: number,
): Texture[] {
  const count = Math.max(1, Math.round(source.width / frameW));
  const frames: Texture[] = [];
  for (let i = 0; i < count; i++) {
    frames.push(
      new Texture({
        source: source.source,
        frame: new Rectangle(i * frameW, 0, frameW, frameH),
      }),
    );
  }
  return frames;
}

/** Mulberry32 — a tiny seeded PRNG for deterministic decoration scatter. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
