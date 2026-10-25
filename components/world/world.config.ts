/**
 * Declarative layout of the "Wild Frontier" world: two Tiny Swords islands.
 *
 *   rows 1–13   THE WILDS — a raised northern plateau (waterfall, cave, gold
 *               mine), the Black Knight's arena and a meadow below it
 *   rows 14–15  THE CHANNEL — open water, one bridge
 *   rows 16–33  THE TOWN — castle hill with the Sanctum and Contact Spire,
 *               a market square under it, districts west and east, spawn south
 *
 * The terrain is drawn as ASCII below so the shape of the world can be edited
 * by eye. Legend:
 *   ~  water          .  ground          ^  raised plateau (walkable on top)
 *   L  ramp down to the west (2 rows: plateau row + cliff row)
 *   R  ramp down to the east (same)     =  bridge
 * Cliff faces are derived: the ground cell under a plateau's south edge.
 */
import { TILE } from "./tiles";

export { TILE };

const TERRAIN = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~........................................~~~",
  "~~.^^^^^^^^^^^^^^^^^^^^^^^...^^^^^^^^^^^^^^.~~",
  "~..^^^^^^^^^^^^^^^^^^^^^^^...^^^^^^^^^^^^^^..~",
  "~..^^^^^^^^^^^^^^^^^^^^^^^R..^^^^^^^^^^^^^^..~",
  "~..^^^^^^^^^^^^^^^........R..^^^^^^^^^^^^^^..~",
  "~...........................L^^^^^^^^^^^^^^..~",
  "~.....~~~~~~................L................~",
  "~....~~~~~~~.................................~",
  "~....~~~~~~~.................................~",
  "~....~~~~~~~.................................~",
  "~............................................~",
  "~~.......................~~~~...............~~",
  "~~~.....................~~~~~~.............~~~",
  "~~~~~~~~~~~~===~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~===~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~......................................~~~~",
  "~~~..............^^^^^^^^^^^^..............~~~",
  "~~...............^^^^^^^^^^^^...............~~",
  "~~...............^^^^^^^^^^^^...............~~",
  "~~...............^^^^^^^^^^^^...............~~",
  "~~..............L^^^^^^^^^^^^R..............~~",
  "~~..............L............R..............~~",
  "~~..........................................~~",
  "~~..........................................~~",
  "~~..........................................~~",
  "~~..........................................~~",
  "~~..........................................~~",
  "~~~.........................................~~",
  "~~~~........................................~~",
  "~~~~........................................~~",
  "~~~~........................................~~",
  "~~~~.......................................~~~",
  "~~~~......................................~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
];

export const COLS = TERRAIN[0].length;
export const ROWS = TERRAIN.length;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export type Rect = { col: number; row: number; w: number; h: number };

export type TileCode = "water" | "ground" | "high" | "cliff" | "rampL" | "rampR" | "bridge";

/** Which height a walker is on: the town/meadow floor or a plateau top. */
export type Level = 0 | 1;

/** Pool under the waterfall (interior water, used for rocks and the duck). */
export const POND: Rect = { col: 6, row: 8, w: 5, h: 2 };
/** Columns where the falls pour off the plateau's cliff into the pond. */
export const WATERFALL = { col: 7, w: 3, cliffRow: 6 };
/** The cave mouth, cut into the east plateau's cliff face. */
export const CAVE: Rect = { col: 34, row: 7, w: 4, h: 2 };

/** Where the player starts (tile coords). */
export const SPAWN = { col: 22, row: 30 };

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
  { id: "sanctum", name: "The Sanctum", action: "Enter", sprite: `${B}/Castle.png`, col: 18, row: 17, w: 5, h: 4, interior: true },
  { id: "contact", name: "Contact Spire", action: "Enter", sprite: `${B}/Tower.png`, col: 25, row: 17, w: 2, h: 4, interior: true },
  { id: "chronicles", name: "Hall of Chronicles", action: "Enter", sprite: `${B}/Barracks.png`, col: 9, row: 19, w: 3, h: 4, interior: true },
  { id: "armory", name: "The Armory", action: "Enter", sprite: `${B}/Archery.png`, col: 9, row: 25, w: 3, h: 4, interior: true },
  { id: "relics", name: "Vault of Relics", action: "Enter", sprite: `${B}/Monastery.png`, col: 33, row: 18, w: 3, h: 5, interior: true },
  { id: "testimonies", name: "Hall of Testimonies", action: "Enter", sprite: `${B}/House1.png`, col: 34, row: 25, w: 2, h: 3, interior: true },
];

/** Purely decorative homes (no interior), in mixed colours so the town reads lived-in. */
export const DECOR_HOUSES: { sprite: string; col: number; row: number; w: number; h: number }[] = [
  { sprite: `${B}/yellow/House1.png`, col: 4, row: 19, w: 2, h: 3 },
  { sprite: `${B}/red/House2.png`, col: 5, row: 24, w: 2, h: 3 },
  { sprite: `${B}/purple/House1.png`, col: 6, row: 29, w: 2, h: 3 },
  { sprite: `${B}/purple/House3.png`, col: 39, row: 18, w: 2, h: 3 },
  { sprite: `${B}/yellow/House3.png`, col: 39, row: 24, w: 2, h: 3 },
  { sprite: `${B}/red/House1.png`, col: 14, row: 30, w: 2, h: 3 },
  { sprite: `${B}/House2.png`, col: 29, row: 30, w: 2, h: 3 },
];

/**
 * Dirt roads, as polylines through tile coordinates (x = col, y = row; .5 is a
 * tile centre). Drawn on the level they belong to so a road never paints over
 * a cliff face.
 */
export const ROADS: { level: Level; width: number; points: [number, number][] }[] = [
  // spawn → square
  { level: 0, width: 0.6, points: [[22.5, 31], [22.5, 27.5]] },
  // bridge → square
  { level: 0, width: 0.6, points: [[13.5, 16], [13.5, 19.5], [16, 22.8], [18.5, 24.4]] },
  // west district
  { level: 0, width: 0.55, points: [[19, 24.5], [16.5, 23.5], [10.5, 23.5]] },
  { level: 0, width: 0.55, points: [[18.6, 26.6], [15.5, 27.5], [13, 29.5], [10.5, 29.5]] },
  // east district
  { level: 0, width: 0.55, points: [[26, 24.5], [28.5, 23.5], [34.5, 23.5]] },
  { level: 0, width: 0.55, points: [[26.4, 26.6], [30, 27.5], [33, 28.5], [35, 28.5]] },
  // east ramp foot → square
  { level: 0, width: 0.5, points: [[30.5, 22.5], [28.2, 24]] },
  // castle hill terrace
  { level: 1, width: 0.5, points: [[16.3, 21.5], [29.7, 21.5]] },
  // the wilds
  { level: 0, width: 0.55, points: [[13.5, 13.5], [13.5, 11], [16, 10.3], [17.6, 10.3]] },
  { level: 0, width: 0.5, points: [[13.5, 11], [11, 11.4]] },
  { level: 0, width: 0.55, points: [[21.4, 10.3], [27, 8.6], [35.5, 8.8]] },
  { level: 0, width: 0.5, points: [[27, 8.6], [27.3, 7.5]] },
];

/** The paved market square at the foot of castle hill. */
export const SQUARE: Rect = { col: 17, row: 23, w: 11, h: 5 };

/** The busker's fixed spot — the middle of the market square. */
export const BARD = { col: 22, row: 25 };

/** The Raven's perch — just off spawn, so new visitors meet the guide immediately. */
export const RAVEN_SPOT = { col: 20, row: 30 };

/** A fourth-wall-breaking CRT terminal, on the square's west side. */
export const TERMINAL_SPOT = { col: 18, row: 25 };

/** A wooden notice board displaying live site stats — the square's east side. */
export const CHRONICLE_SPOT = { col: 26, row: 25 };

/** Recruiter Mode's signpost — right next to spawn, so it's the first thing a new visitor sees. */
export const RECRUITER_SIGNPOST_SPOT = { col: 24, row: 30 };

/** The Black Knight holds the arena in the middle of the wilds. */
export const ORC_CHIEF_SPOT = { col: 19, row: 9 };

/** Where the knight's gold trophy appears near spawn, once defeated. */
export const TROPHY_SPOT = { col: 18, row: 30 };

/** Bottom-centre door position of a building, in world pixels. */
export function doorPos(b: { col: number; row: number; w: number; h: number }): {
  x: number;
  y: number;
} {
  return { x: (b.col + b.w / 2) * TILE, y: (b.row + b.h) * TILE };
}

/** Build the tile-code grid from the ASCII terrain, deriving cliff faces. */
export function buildTileGrid(): TileCode[][] {
  const raw = TERRAIN.map((line) => line.split(""));
  const grid: TileCode[][] = raw.map((line) =>
    line.map((ch): TileCode => {
      switch (ch) {
        case "~": return "water";
        case "^": return "high";
        case "L": return "rampL";
        case "R": return "rampR";
        case "=": return "bridge";
        default: return "ground";
      }
    }),
  );
  // A plateau's south edge drops one tile: the cell beneath becomes a cliff face.
  for (let row = 0; row < ROWS - 1; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] === "high" && grid[row + 1][col] === "ground") grid[row + 1][col] = "cliff";
    }
  }
  return grid;
}

/** The level a tile's surface sits on (ramps return null: they join both). */
export function levelOf(code: TileCode): Level | null {
  if (code === "high") return 1;
  if (code === "rampL" || code === "rampR") return null;
  return 0;
}

/** True for tile codes nobody can stand on at any level. */
export function isSolidCode(code: TileCode): boolean {
  return code === "water" || code === "cliff";
}
