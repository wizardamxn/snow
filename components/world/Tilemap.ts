import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { extractTile, getTex, TILE } from "./tiles";
import {
  buildTileGrid,
  COLS,
  isSolidCode,
  levelOf,
  ROADS,
  ROWS,
  SQUARE,
  WORLD_H,
  WORLD_W,
  type Level,
  type TileCode,
} from "./world.config";

export type TileMap = {
  /** Static terrain, bottom to top: water, foam (filled by the scene), ground, shadows, ground roads, plateau, plateau roads. */
  container: Container;
  /** Empty layer between the water and the ground — the scene animates shoreline foam into it. */
  foamLayer: Container;
  grid: TileCode[][];
  blocked: boolean[][];
  /** Land cells whose neighbour is water (where foam belongs). */
  shoreCells: { col: number; row: number }[];
  /** Walkability for someone standing on `level`; ramps connect the two levels. */
  canWalkAt: (x: number, y: number, level: Level, fromRamp: boolean) => boolean;
  /** Tile code under a world pixel, or "water" out of bounds. */
  codeAtPx: (x: number, y: number) => TileCode;
  /** Mark a rectangle of tiles solid (used for building footprints). */
  blockRect: (col0: number, row0: number, w: number, h: number) => void;
};

/**
 * Builds the ground from the Tiny Swords tileset by auto-tiling: each land cell
 * picks its edge piece from which of its four neighbours are also land. The
 * tileset's left block is flat ground, the right block is a raised plateau
 * (with cliff faces and side ramps beneath it).
 */
export const TILEMAP_URLS = [
  "/pixel/terrain/Tilemap_color3.png",
  "/pixel/terrain/Tilemap_color2.png",
  "/pixel/terrain/shadow.png",
];

const WATER_COLOR = 0x47aba9;

/** Column/row inside a 4×4 autotile block for a cell with the given same-kind neighbours. */
const edgeIndex = (n: boolean, s: boolean, w: boolean, e: boolean) => ({
  col: w && e ? 1 : !w && e ? 0 : w && !e ? 2 : 3,
  row: n && s ? 1 : !n && s ? 0 : n && !s ? 2 : 3,
});

export async function buildTilemap(): Promise<TileMap> {
  const groundSheet = getTex(TILEMAP_URLS[0]);
  const highSheet = getTex(TILEMAP_URLS[1]);
  const shadowTex = getTex(TILEMAP_URLS[2]);

  const grid = buildTileGrid();
  const inside = (c: number, r: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const code = (c: number, r: number): TileCode => (inside(c, r) ? grid[r][c] : "water");
  const isLand = (c: number, r: number) => code(c, r) !== "water" && code(c, r) !== "bridge";
  const isHigh = (c: number, r: number) => code(c, r) === "high";

  const container = new Container();

  const water = new Graphics().rect(0, 0, WORLD_W, WORLD_H).fill(WATER_COLOR);
  container.addChild(water);

  const foamLayer = new Container();
  container.addChild(foamLayer);

  const groundLayer = new Container();
  const shadowLayer = new Container();
  const groundRoads = new Container();
  const highLayer = new Container();
  const highRoads = new Container();
  container.addChild(groundLayer, shadowLayer, groundRoads, highLayer, highRoads);

  const blocked: boolean[][] = [];
  const shoreCells: { col: number; row: number }[] = [];

  const put = (layer: Container, tex: Texture, col: number, row: number) => {
    const s = new Sprite(tex);
    s.x = col * TILE;
    s.y = row * TILE;
    s.width = TILE;
    s.height = TILE;
    layer.addChild(s);
  };

  for (let row = 0; row < ROWS; row++) {
    blocked[row] = [];
    for (let col = 0; col < COLS; col++) {
      const c = grid[row][col];
      blocked[row][col] = isSolidCode(c);

      if (isLand(col, row)) {
        const e = edgeIndex(isLand(col, row - 1), isLand(col, row + 1), isLand(col - 1, row), isLand(col + 1, row));
        put(groundLayer, extractTile(groundSheet, e.col, e.row), col, row);
        if (!isLand(col, row - 1) || !isLand(col, row + 1) || !isLand(col - 1, row) || !isLand(col + 1, row)) {
          shoreCells.push({ col, row });
        }
      }

      if (c === "high") {
        const e = edgeIndex(isHigh(col, row - 1), isHigh(col, row + 1), isHigh(col - 1, row), isHigh(col + 1, row));
        put(highLayer, extractTile(highSheet, 5 + e.col, e.row), col, row);
      } else if (c === "cliff") {
        // Face piece follows the plateau edge above it; the bottom row variant
        // meets water with foam instead of grass.
        const e = edgeIndex(true, true, isHigh(col - 1, row - 1), isHigh(col + 1, row - 1));
        const overWater = code(col, row + 1) === "water";
        put(highLayer, extractTile(highSheet, 5 + e.col, overWater ? 5 : 4), col, row);
        const sh = new Sprite(shadowTex);
        sh.anchor.set(0.5, 0.5);
        sh.x = (col + 0.5) * TILE;
        sh.y = (row + 0.9) * TILE;
        sh.width = TILE * 1.6;
        sh.height = TILE * 1.1;
        sh.alpha = 0.55;
        shadowLayer.addChild(sh);
      } else if (c === "rampL" || c === "rampR") {
        // Two-tile slope: the upper piece sits beside the plateau's last row,
        // the lower piece beside its cliff face.
        const upper = code(col, row + 1) === c;
        put(highLayer, extractTile(highSheet, c === "rampL" ? 0 : 3, upper ? 4 : 5), col, row);
      }
    }
  }

  // The bridge is painted as one piece: planks across, rails and posts along both sides.
  const bridgeCells: { col: number; row: number }[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === "bridge") bridgeCells.push({ col: c, row: r });
  // Above the road layer, so road ends tuck under the planks.
  if (bridgeCells.length) container.addChildAt(paintBridge(bridgeCells), container.getChildIndex(highLayer));

  // Roads and the square are painted pixel by pixel (2px "art pixels", like the
  // tileset) so they read as hand-drawn dirt and cobbles, not vector strokes.
  groundRoads.addChild(paintPaths(ROADS.filter((r) => r.level === 0), true));
  highRoads.addChild(paintPaths(ROADS.filter((r) => r.level === 1), false));

  const codeAtPx = (x: number, y: number): TileCode => code(Math.floor(x / TILE), Math.floor(y / TILE));

  const canWalkAt = (x: number, y: number, level: Level, fromRamp: boolean): boolean => {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (!inside(col, row) || blocked[row][col]) return false;
    const l = levelOf(grid[row][col]);
    // Ramps are walkable from either level; stepping off a ramp may change level.
    return l === null || l === level || fromRamp;
  };

  const blockRect = (col0: number, row0: number, w: number, h: number) => {
    for (let r = row0; r < row0 + h; r++) {
      for (let c = col0; c < col0 + w; c++) {
        if (inside(c, r)) blocked[r][c] = true;
      }
    }
  };

  return { container, foamLayer, grid, blocked, shoreCells, canWalkAt, codeAtPx, blockRect };
}

/** Art-pixel size for painted paths, in world px. */
const PX = 2;

export const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Smooth value noise in [0,1], one lattice cell per `scale` world px. */
export const noise = (x: number, y: number, scale: number) => {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * sx;
  const b = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * sx;
  return a + (b - a) * sy;
};

/** Chaikin corner-cutting: turns a polyline's hard corners into gentle bends. */
const smooth = (pts: [number, number][], passes = 3): [number, number][] => {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const out: [number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i];
      const [bx, by] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
};

const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as const;
const DIRT = [0xd4ae73, 0xcda56a, 0xd9b67e].map(rgb);
const DIRT_LIGHT = rgb(0xe6c890);
const DIRT_DARK = rgb(0xb48c56);
const DIRT_EDGE = rgb(0x93703f);
const PEBBLE = rgb(0xa8a296);
const STONES = [0xc9b893, 0xbfab84, 0xd3c29c, 0xb7a37d].map(rgb);
const STONE_LIGHT = rgb(0xe2d4b0);
const MORTAR = rgb(0xa39070);
const STONE_RING = rgb(0xaa9672);

/**
 * Rasterises roads (and optionally the market square) into one nearest-filtered
 * sprite: noisy dirt edges with a dark lip, speckles and pebbles; the square is
 * running-bond cobbles with a ring of darker stones round its centre.
 */
function paintPaths(roads: { width: number; points: [number, number][] }[], withSquare: boolean): Sprite | Container {
  const lines = roads.map((r) => ({ hw: (r.width * TILE) / 2, pts: smooth(r.points).map(([x, y]) => [x * TILE, y * TILE] as const) }));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of lines) for (const [x, y] of l.pts) {
    x0 = Math.min(x0, x - l.hw - 8); y0 = Math.min(y0, y - l.hw - 8);
    x1 = Math.max(x1, x + l.hw + 8); y1 = Math.max(y1, y + l.hw + 8);
  }
  const sq = { cx: (SQUARE.col + SQUARE.w / 2) * TILE, cy: (SQUARE.row + SQUARE.h / 2) * TILE, rx: (SQUARE.w / 2) * TILE, ry: (SQUARE.h / 2) * TILE };
  if (withSquare) {
    x0 = Math.min(x0, sq.cx - sq.rx - 8); y0 = Math.min(y0, sq.cy - sq.ry - 8);
    x1 = Math.max(x1, sq.cx + sq.rx + 8); y1 = Math.max(y1, sq.cy + sq.ry + 8);
  }
  if (!Number.isFinite(x0)) return new Container();
  x0 = Math.floor(x0 / PX) * PX; y0 = Math.floor(y0 / PX) * PX;
  const w = Math.ceil((x1 - x0) / PX);
  const h = Math.ceil((y1 - y0) / PX);

  // Distance (world px) from each art pixel to the nearest road centreline, minus that road's half-width.
  const field = new Float32Array(w * h).fill(Infinity);
  for (const l of lines) {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const [ax, ay] = l.pts[i];
      const [bx, by] = l.pts[i + 1];
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      const m = l.hw + 8;
      const px0 = Math.max(0, Math.floor((Math.min(ax, bx) - m - x0) / PX));
      const px1 = Math.min(w - 1, Math.ceil((Math.max(ax, bx) + m - x0) / PX));
      const py0 = Math.max(0, Math.floor((Math.min(ay, by) - m - y0) / PX));
      const py1 = Math.min(h - 1, Math.ceil((Math.max(ay, by) + m - y0) / PX));
      for (let py = py0; py <= py1; py++) {
        const wy = y0 + (py + 0.5) * PX;
        for (let px = px0; px <= px1; px++) {
          const wx = x0 + (px + 0.5) * PX;
          const t = Math.max(0, Math.min(1, ((wx - ax) * dx + (wy - ay) * dy) / len2));
          const d = Math.hypot(wx - (ax + t * dx), wy - (ay + t * dy)) - l.hw;
          const k = py * w + px;
          if (d < field[k]) field[k] = d;
        }
      }
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const put = (k: number, c: readonly [number, number, number], a = 255) => {
    img.data[k * 4] = c[0]; img.data[k * 4 + 1] = c[1]; img.data[k * 4 + 2] = c[2]; img.data[k * 4 + 3] = a;
  };

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const k = py * w + px;
      const wx = x0 + (px + 0.5) * PX;
      const wy = y0 + (py + 0.5) * PX;
      const r = hash(px + Math.floor(x0 / PX), py + Math.floor(y0 / PX));

      // The square: cobbles inside a slightly wobbly oval.
      if (withSquare) {
        const e = Math.hypot((wx - sq.cx) / sq.rx, (wy - sq.cy) / sq.ry) + (noise(wx, wy, 14) - 0.5) * 0.06;
        if (e < 1) {
          if (e > 0.975) { put(k, DIRT_EDGE); continue; }
          const ring = Math.hypot((wx - sq.cx) / (TILE * 2.2), (wy - sq.cy - TILE * 0.3) / (TILE * 1.1));
          const row = Math.floor(wy / 10);
          const off = (row & 1) * 8 + Math.floor(hash(row, 7) * 4) * PX;
          const col = Math.floor((wx + off) / 16);
          const u = (((wx + off) % 16) + 16) % 16;
          const v = ((wy % 10) + 10) % 10;
          if (u < PX || v < PX) { put(k, MORTAR); continue; }
          const tint = hash(col, row);
          let c = STONES[Math.floor(tint * STONES.length)];
          if (ring > 0.9 && ring < 1.03) c = STONE_RING;
          else if (v < PX * 2 && r < 0.6) c = STONE_LIGHT;
          put(k, c);
          continue;
        }
      }

      const d = field[k] + (noise(wx, wy, 10) - 0.5) * 7;
      if (d > 2.5) continue;
      if (d > 0) { put(k, [0, 0, 0], 38); continue; } // a soft lip where grass meets dirt
      if (d > -PX * 1.5) { put(k, DIRT_EDGE); continue; }
      let c = DIRT[Math.floor(noise(wx, wy, 18) * DIRT.length) % DIRT.length];
      if (r < 0.05) c = DIRT_LIGHT;
      else if (r < 0.11) c = DIRT_DARK;
      else if (r > 0.996) c = PEBBLE;
      put(k, c);
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = Texture.from(canvas);
  tex.source.scaleMode = "nearest";
  const sprite = new Sprite(tex);
  sprite.x = x0;
  sprite.y = y0;
  sprite.width = w * PX;
  sprite.height = h * PX;
  return sprite;
}

/** Paints a plank bridge over its cells (assumes one rectangular span). */
function paintBridge(cells: { col: number; row: number }[]): Sprite {
  const c0 = Math.min(...cells.map((c) => c.col));
  const c1 = Math.max(...cells.map((c) => c.col)) + 1;
  const r0 = Math.min(...cells.map((c) => c.row));
  const r1 = Math.max(...cells.map((c) => c.row)) + 1;
  const vertical = r1 - r0 >= c1 - c0;
  // Overhang half a tile onto each bank so the ends sit on land.
  const x0 = c0 * TILE - (vertical ? 0 : TILE / 2);
  const y0 = r0 * TILE - (vertical ? TILE / 2 : 0);
  const W = (c1 - c0) * TILE + (vertical ? 0 : TILE);
  const H = (r1 - r0) * TILE + (vertical ? TILE : 0);
  const w = W / PX;
  const h = H / PX;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h + 6;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h + 6);
  const put = (x: number, y: number, c: number, a = 255) => {
    const k = (y * w + x) * 4;
    img.data[k] = (c >> 16) & 255; img.data[k + 1] = (c >> 8) & 255; img.data[k + 2] = c & 255; img.data[k + 3] = a;
  };
  const along = vertical ? h : w; // length in art px
  const across = vertical ? w : h;
  for (let a = 0; a < along; a++) {
    for (let b = 0; b < across; b++) {
      const x = vertical ? b : a;
      const y = vertical ? a : b;
      let c: number;
      if (b < 3 || b >= across - 3) {
        // rails, with a post every 12 art px
        const post = a % 12 < 3;
        c = b === 0 || b === across - 1 ? 0x2a1a10 : post ? 0x5a3a1c : 0x7a5228;
        if (!post && b === 1) c = 0x9c6b3a;
      } else {
        // planks run across the walking direction
        const plank = Math.floor(a / 5);
        const edge = a % 5 === 0;
        const base = [0xa8763f, 0x9c6b3a, 0xb07f46][Math.floor(hash(plank, 9) * 3)];
        c = edge ? 0x5e3d22 : (a % 5 === 1 ? 0xc08a52 : base);
        if (hash(plank, b) < 0.03) c = 0x5e3d22; // knots / nails
      }
      put(x, y, c);
    }
  }
  // a shadow cast onto the water below the deck
  for (let x = 0; x < w; x++) for (let k = 0; k < 6; k++) put(x, h + k, 0x000000, 60 - k * 9);
  ctx.putImageData(img, 0, 0);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = "nearest";
  const s = new Sprite(tex);
  s.x = x0;
  s.y = y0;
  s.width = w * PX;
  s.height = (h + 6) * PX;
  return s;
}
