/**
 * Declarative layout of the "Wild Frontier" world.
 *
 *   rows 0–6    MOUNTAIN RANGE (north wall) — impassable stone cliffs
 *   rows 7–17   WILD FRONTIER — pond + waterfall (west) and cave (east)
 *   rows 18–19  RIVER across the map, one wide BRIDGE crossing
 *   rows 20–37  TOWN — buildings you explore, two streets, spawn in the south
 *
 * All three nature features sit at the far (north) border, opposite the town.
 */
import { TILE } from "./tiles";

export { TILE };
export const COLS = 52;
export const ROWS = 38;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

/** Rows 0..MOUNTAIN_ROWS-1 are the northern mountain wall. */
export const MOUNTAIN_ROWS = 7;

export type Rect = { col: number; row: number; w: number; h: number };

export const RIVER = { row: 18, rows: 2 };
export const BRIDGE = { col: 25, w: 5 };

export const POND: Rect = { col: 4, row: 9, w: 14, h: 6 };
export const WATERFALL: Rect = { col: 8, row: 5, w: 4, h: 5 };
export const CAVE: Rect = { col: 40, row: 5, w: 4, h: 2 };

/** Where the player starts (tile coords). */
export const SPAWN = { col: 26, row: 35};

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

/** Two streets running east–west; buildings' doors sit on one of them. */
export const STREET_1 = 26;
export const STREET_2 = 31;

/** The buildings you can enter, mapped to portfolio sections. */
export const BUILDINGS: BuildingDef[] = [
  { id: "sanctum", name: "The Sanctum", action: "Enter", sprite: `${B}/Castle.png`, col: 23, row: STREET_1 - 4, w: 5, h: 4, interior: true },
  { id: "contact", name: "Contact Spire", action: "Enter", sprite: `${B}/Tower.png`, col: 30, row: STREET_1 - 4, w: 2, h: 4, interior: true },
  { id: "chronicles", name: "Hall of Chronicles", action: "Enter", sprite: `${B}/Barracks.png`, col: 8, row: STREET_1 - 4, w: 3, h: 4, interior: true },
  { id: "relics", name: "Vault of Relics", action: "Enter", sprite: `${B}/Monastery.png`, col: 40, row: STREET_1 - 5, w: 3, h: 5, interior: true },
  { id: "armory", name: "The Armory", action: "Enter", sprite: `${B}/Archery.png`, col: 12, row: STREET_2 - 4, w: 3, h: 4, interior: true },
  { id: "testimonies", name: "Hall of Testimonies", action: "Enter", sprite: `${B}/House1.png`, col: 34, row: STREET_2 - 3, w: 2, h: 3, interior: true },
];

/** Purely decorative homes (no interior). */
export const DECOR_HOUSES: { sprite: string; col: number; row: number; w: number; h: number }[] = [
  { sprite: `${B}/House2.png`, col: 17, row: STREET_2 - 3, w: 2, h: 3 },
  { sprite: `${B}/House3.png`, col: 45, row: STREET_1 + 1, w: 2, h: 3 },
  { sprite: `${B}/House2.png`, col: 6, row: STREET_2 + 2, w: 2, h: 3 },
];

/** Dirt footpaths (walkable grass, drawn as tan ribbons + cobblestone). */
export const PATH_SEGMENTS: Rect[] = [
  { col: 6, row: STREET_1, w: 42, h: 1 }, // main street, front doors of the row-1 buildings
  { col: 10, row: STREET_2, w: 30, h: 1 }, // second street
  { col: 28, row: RIVER.row + RIVER.rows, w: 1, h: STREET_1 - (RIVER.row + RIVER.rows) }, // bridge → main street (gap between Sanctum and Contact)
  { col: 20, row: STREET_1, w: 1, h: STREET_2 - STREET_1 + 1 }, // main → second street
  { col: 36, row: STREET_1, w: 1, h: STREET_2 - STREET_1 + 1 }, // main → second street
  { col: 26, row: STREET_2, w: 1, h: SPAWN.row - STREET_2 + 1 }, // second street → spawn
];

/** The busker's fixed spot — Second Street, a lively crossroads in the town square. */
export const BARD = { col: 24, row: STREET_2 };

/** The Raven's perch — just off spawn, so new visitors meet the guide immediately. */
export const RAVEN_SPOT = { col: 23, row: 34 };

/** A fourth-wall-breaking CRT terminal, clustered near the Bard and Raven. */
export const TERMINAL_SPOT = { col: 21, row: 32 };

/** A wooden notice board displaying live site stats — open ground south of Contact Spire. */
export const CHRONICLE_SPOT = { col: 30, row: 33 };

/** Recruiter Mode's signpost — right next to spawn, so it's the first thing a new visitor sees. */
export const RECRUITER_SIGNPOST_SPOT = { col: 28, row: 34 };

/** A stationary orc chieftain, north of the river — a fixed boss encounter, not a wandering critter. */
export const ORC_CHIEF_SPOT = { col: 26, row: 11 };

/** Where the chieftain's gold trophy appears near spawn, once defeated. */
export const TROPHY_SPOT = { col: 24, row: 35 };

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

      if (inRect(col, row, POND)) code = "water";
      // Only the WATERFALL rect's pool (south of the mountain wall) is water —
      // its northern rows stay cliff, so the falls reads as a gap in the SAME
      // rock face as the rest of the mountain, not a patch of flat water cut
      // into it.
      if (inRect(col, row, WATERFALL) && row >= MOUNTAIN_ROWS) code = "water";
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
