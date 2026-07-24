import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { extractTile, getTex, mulberry32, TILE } from "./tiles";
import {
  buildTileGrid,
  COLS,
  isSolidCode,
  PATH_SEGMENTS,
  ROWS,
  type TileCode,
} from "./world.config";

export type TileMap = {
  /** The static ground layer (drawn once). */
  container: Container;
  grid: TileCode[][];
  blocked: boolean[][];
  /** True if the world pixel (x,y) is inside a solid tile or out of bounds. */
  isBlockedPx: (x: number, y: number) => boolean;
  /** Mark a rectangle of tiles solid (used for building footprints). */
  blockRect: (col0: number, row0: number, w: number, h: number) => void;
};

/**
 * Builds the ground layer by mapping each tile code to a texture sliced from
 * the Tiny Swords tileset, and derives the collision grid from the codes.
 */
export const TILEMAP_URLS = ["/pixel/terrain/Tilemap_color1.png", "/pixel/terrain/water.png"];

export async function buildTilemap(): Promise<TileMap> {
  const tm = getTex(TILEMAP_URLS[0]);
  const water = getTex(TILEMAP_URLS[1]);

  // (1,1) is the only fully-interior grass tile — every other grass cell in the
  // tileset carries a dark island edge, which would tile into a maze pattern.
  const grassTiles = [extractTile(tm, 1, 1)];
  // Grass→stone cap that reads as the top of the cliff face.
  const capTile = extractTile(tm, 6, 3);
  // Interior stone columns (6,7) of the elevated island's face (5 & 8 are edges).
  const cliffTiles: Texture[] = [
    extractTile(tm, 6, 4),
    extractTile(tm, 7, 4),
    extractTile(tm, 6, 5),
    extractTile(tm, 7, 5),
  ];

  const grid = buildTileGrid();
  const container = new Container();
  const blocked: boolean[][] = [];
  const rng = mulberry32(1337);

  for (let row = 0; row < ROWS; row++) {
    blocked[row] = [];
    for (let col = 0; col < COLS; col++) {
      const code = grid[row][col];
      blocked[row][col] = isSolidCode(code);

      let tex: Texture;
      switch (code) {
        case "grass":
        case "grassMtn":
          tex = grassTiles[Math.floor(rng() * grassTiles.length)];
          break;
        case "cliffCap":
          tex = capTile;
          break;
        case "cliff":
          tex = cliffTiles[(col % 2) + (row % 2) * 2];
          break;
        default:
          tex = water; // water + bridge share the water base
      }

      const sprite = new Sprite(tex);
      sprite.x = col * TILE;
      sprite.y = row * TILE;
      sprite.width = TILE;
      sprite.height = TILE;
      container.addChild(sprite);

      // Wooden planks over the water for the bridge.
      if (code === "bridge") {
        const plank = new Graphics();
        plank.rect(col * TILE, row * TILE, TILE, TILE).fill(0x9c6b3a);
        plank
          .rect(col * TILE, row * TILE + 20, TILE, 3)
          .rect(col * TILE, row * TILE + 42, TILE, 3)
          .fill(0x6f4a25);
        plank
          .rect(col * TILE, row * TILE, TILE, 4)
          .rect(col * TILE, row * TILE + TILE - 4, TILE, 4)
          .fill(0x7a5228);
        container.addChild(plank);
      }
    }
  }

  // Dirt footpaths — visual only (the grass beneath stays walkable), drawn as
  // continuous tan ribbons that connect at intersections.
  const paths = new Graphics();
  for (const s of PATH_SEGMENTS) {
    const horiz = s.w >= s.h;
    const pad = 12;
    const x = s.col * TILE + (horiz ? -2 : pad);
    const y = s.row * TILE + (horiz ? pad : -2);
    const w = s.w * TILE - (horiz ? -4 : pad * 2);
    const h = s.h * TILE - (horiz ? pad * 2 : -4);
    paths.roundRect(x, y, w, h, 16).fill({ color: 0xc9a86a, alpha: 0.92 });
  }
  container.addChild(paths);

  const isBlockedPx = (x: number, y: number): boolean => {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
    return blocked[row][col];
  };

  const blockRect = (col0: number, row0: number, w: number, h: number) => {
    for (let r = row0; r < row0 + h; r++) {
      for (let c = col0; c < col0 + w; c++) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) blocked[r][c] = true;
      }
    }
  };

  return { container, grid, blocked, isBlockedPx, blockRect };
}
