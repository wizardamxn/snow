/**
 * Declarative layout of the "Wild Frontier" world (compact edition).
 *
 *   rows 0–5    MOUNTAIN RANGE (north wall) — impassable stone cliffs
 *   rows 6–11   WILD FRONTIER — pond + waterfall (west) and cave (east)
 *   rows 12–13  RIVER across the map, one BRIDGE crossing
 *   rows 14–25  TOWN — buildings you explore, spawn near the centre-south
 *
 * All three nature features sit at the far (north) border, opposite the town.
 * Small enough for a recruiter to cross in a few seconds, dense with life.
 */
import { TILE } from "./tiles";

export { TILE };
export const COLS = 36;
export const ROWS = 26;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

/** Rows 0..MOUNTAIN_ROWS-1 are the northern mountain wall. */
export const MOUNTAIN_ROWS = 6;

export type Rect = { col: number; row: number; w: number; h: number };

export const RIVER = { row: 12, rows: 2 };
export const BRIDGE = { col: 22, w: 4 };

export const POND: Rect = { col: 3, row: 8, w: 10, h: 4 };
export const WATERFALL: Rect = { col: 6, row: 5, w: 3, h: 4 };
export const CAVE: Rect = { col: 28, row: 4, w: 3, h: 2 };

/** Where the player starts (tile coords). */
export const SPAWN = { col: 18, row: 21 };

export type TileCode =
  | "grass"
  | "grassMtn"
  | "cliffCap"
  | "cliff"
  | "water"
  | "bridge";

export type BuildingDef = {
  id: string;
  name: string;
  action: string;
  sprite: string;
  /** Footprint TOP-LEFT tile. */
  col: number;
  row: number;
  /** Footprint size in tiles (matches the sprite's native size / 64). */
  w: number;
  h: number;
  interior: boolean;
};

const B = "/pixel/buildings";

/** The buildings you can enter, mapped to portfolio sections. */
export const BUILDINGS: BuildingDef[] = [
  { id: "sanctum", name: "The Sanctum", action: "Enter", sprite: `${B}/Castle.png`, col: 14, row: 15, w: 5, h: 4, interior: true },
  { id: "contact", name: "Contact Spire", action: "Enter", sprite: `${B}/Tower.png`, col: 20, row: 15, w: 2, h: 4, interior: true },
  { id: "chronicles", name: "Hall of Chronicles", action: "Enter", sprite: `${B}/Barracks.png`, col: 4, row: 15, w: 3, h: 4, interior: true },
  { id: "relics", name: "Vault of Relics", action: "Enter", sprite: `${B}/Monastery.png`, col: 29, row: 14, w: 3, h: 5, interior: true },
  { id: "armory", name: "The Armory", action: "Enter", sprite: `${B}/Archery.png`, col: 7, row: 20, w: 3, h: 4, interior: true },
  { id: "testimonies", name: "Hall of Testimonies", action: "Enter", sprite: `${B}/House1.png`, col: 24, row: 21, w: 2, h: 3, interior: true },
];

/** Purely decorative homes (no interior). */
export const DECOR_HOUSES: { sprite: string; col: number; row: number; w: number; h: number }[] = [
  { sprite: `${B}/House2.png`, col: 11, row: 21, w: 2, h: 3 },
  { sprite: `${B}/House3.png`, col: 32, row: 20, w: 2, h: 3 },
];

/** Dirt footpaths (walkable grass, drawn as tan ribbons). */
export const PATH_SEGMENTS: Rect[] = [
  { col: 4, row: 19, w: 28, h: 1 }, // main street in front of the northern doors
  { col: 8, row: 19, w: 1, h: 5 }, // down to the Armory
  { col: 25, row: 19, w: 1, h: 5 }, // down to the Hall of Testimonies
  { col: 23, row: 13, w: 1, h: 7 }, // up to the bridge
  { col: 18, row: 19, w: 1, h: 3 }, // spawn connector
];

/** Bottom-centre door position of a building, in world pixels. */
export function doorPos(b: { col: number; row: number; w: number; h: number }): {
  x: number;
  y: number;
} {
  return { x: (b.col + b.w / 2) * TILE, y: (b.row + b.h) * TILE };
}

function inRect(col: number, row: number, r: Rect): boolean {
  return col >= r.col && col < r.col + r.w && row >= r.row && row < r.row + r.h;
}

/** Build the visual tile-code grid from the region definitions above. */
export function buildTileGrid(): TileCode[][] {
  const grid: TileCode[][] = [];
  for (let row = 0; row < ROWS; row++) {
    const line: TileCode[] = [];
    for (let col = 0; col < COLS; col++) {
      let code: TileCode = "grass";

      // Northern mountain wall: grassy plateau → cap → bare stone face.
      if (row < MOUNTAIN_ROWS) {
        if (row <= MOUNTAIN_ROWS - 4) code = "grassMtn";
        else if (row === MOUNTAIN_ROWS - 3) code = "cliffCap";
        else code = "cliff";
      }

      if (inRect(col, row, POND) || inRect(col, row, WATERFALL)) code = "water";
      if (row >= RIVER.row && row < RIVER.row + RIVER.rows) code = "water";

      if (
        row >= RIVER.row &&
        row < RIVER.row + RIVER.rows &&
        col >= BRIDGE.col &&
        col < BRIDGE.col + BRIDGE.w
      ) {
        code = "bridge";
      }

      line.push(code);
    }
    grid.push(line);
  }
  return grid;
}

/** True for tile codes the player cannot walk onto. */
export function isSolidCode(code: TileCode): boolean {
  return code !== "grass" && code !== "bridge";
}
