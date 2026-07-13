import { Application, Container, Graphics, Sprite, Texture, Text, TextStyle } from "pixi.js";
import { buildTilemap } from "@/components/world/Tilemap";
import { createPlayer } from "@/components/world/Player";
import { loadTex, mulberry32, sliceFrames, TILE } from "@/components/world/tiles";
import { SPRITE_TRIM } from "@/components/world/spriteTrim";
import { BUILDING_MASK } from "@/components/world/buildingCollision";
import { input, KEY } from "@/components/world/input";
import { setNear, worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";
import {
  BUILDINGS,
  CAVE,
  COLS,
  DECOR_HOUSES,
  doorPos,
  MOUNTAIN_ROWS,
  PATH_SEGMENTS,
  POND,
  ROWS,
  SPAWN,
  WATERFALL,
  WORLD_H,
  WORLD_W,
} from "@/components/world/world.config";

export type SceneController = {
  container: Container;
  update: (dtSeconds: number) => void;
};

const TREE_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/trees/Tree${n}.png`);
const BUSH_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/bushes/Bushe${n}.png`);
const ROCK_URLS = [1, 2, 3, 4].map((n) => `/pixel/terrain/Rock${n}.png`);
const STUMP_URLS = [1, 2, 3, 4].map((n) => `/pixel/deco/stump_${n}.png`);
const WATER_ROCK_URLS = [1, 2, 3, 4].map((n) => `/pixel/deco/water_rock_${n}.png`);

type Animated = { sprite: Sprite; frames: Texture[]; fps: number; phase: number };
type Critter = {
  sprite: Sprite;
  shadow: Graphics;
  x: number;
  y: number;
  tx: number;
  ty: number;
  state: "idle" | "move";
  timer: number;
  facing: number;
  anim: number;
  baseScale: number;
  region: { col: number; row: number; w: number; h: number };
  idleFrames: Texture[];
  moveFrames: Texture[];
  idleFps: number;
  moveFps: number;
  speed: number;
};
type Duck = { sprite: Sprite; baseX: number; baseY: number; phase: number };
type Butterfly = {
  g: Graphics;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  flapPhase: number;
  flapSpeed: number;
  wanderTimer: number;
  baseColor: number;
  size: number;
};

const trimOf = (url: string) => SPRITE_TRIM[url] ?? { ax: 0.5, ay: 1, wf: 1 };

export async function buildTownScene(app: Application): Promise<SceneController> {
  const scene = new Container();
  const world = new Container();
  scene.addChild(world);

  const DEBUG_COLLISION =
    typeof window !== "undefined" && window.location.search.includes("debug");

  // ── Ground + collision ─────────────────────────────────────────────────────
  const tilemap = await buildTilemap();
  world.addChild(tilemap.container);

  // Buildings block only the tiles where their sprite is actually opaque (a
  // per-tile alpha mask), so transparent gaps — tower tops, spire gaps, eaves —
  // stay walkable and there are no invisible walls. Sprites are content-bottom
  // aligned to their footprint, so frame tile (fr,fc) maps to world tile
  // (row+fr, col+fc).
  const blockBuilding = (b: { sprite: string; col: number; row: number; w: number; h: number }) => {
    const mask = BUILDING_MASK[b.sprite];
    if (!mask) {
      tilemap.blockRect(b.col, b.row + b.h - Math.min(2, b.h), b.w, Math.min(2, b.h));
      return;
    }
    for (let fr = 0; fr < mask.length; fr++) {
      for (let fc = 0; fc < mask[fr].length; fc++) {
        if (mask[fr][fc]) tilemap.blockRect(b.col + fc, b.row + fr, 1, 1);
      }
    }
  };
  BUILDINGS.forEach(blockBuilding);
  DECOR_HOUSES.forEach(blockBuilding);

  const waterFX = new Container();
  world.addChild(waterFX);

  const entities = new Container();
  entities.sortableChildren = true;
  world.addChild(entities);

  const cloudLayer = new Container();
  world.addChild(cloudLayer);

  const animated: Animated[] = [];
  const critters: Critter[] = [];
  const ducks: Duck[] = [];
  const butterflies: Butterfly[] = [];

  // ── Load textures ──────────────────────────────────────────────────────────
  const [
    treeTexes,
    bushTexes,
    rockTexes,
    stumpTexes,
    waterRockTexes,
    foamTex,
    splashTex,
    fireTex,
    sheepIdleTex,
    sheepMoveTex,
    duckTex,
    caveTex,
    waterfallTex,
    peasantIdleTex,
    peasantRunTex,
    tavernIdleTex,
    tavernRunTex,
    knightIdleTex,
    knightRunTex,
    wizardIdleTex,
    wizardRunTex,
    orcIdleTex,
    orcRunTex,
    skeletonIdleTex,
    skeletonRunTex,
    buildingTexes,
  ] = await Promise.all([
    Promise.all(TREE_URLS.map(loadTex)),
    Promise.all(BUSH_URLS.map(loadTex)),
    Promise.all(ROCK_URLS.map(loadTex)),
    Promise.all(STUMP_URLS.map(loadTex)),
    Promise.all(WATER_ROCK_URLS.map(loadTex)),
    loadTex("/pixel/terrain/water_foam.png"),
    loadTex("/pixel/fx/water_splash.png"),
    loadTex("/pixel/fx/fire_01.png"),
    loadTex("/pixel/deco/sheep_idle.png"),
    loadTex("/pixel/deco/sheep_move.png"),
    loadTex("/pixel/deco/duck.png"),
    loadTex("/pixel/terrain/cave_mouth.webp"),
    loadTex("/pixel/terrain/waterfall.png"),
    loadTex("/pixel/npcs/peasant_idle.png"),
    loadTex("/pixel/npcs/peasant_run.png"),
    loadTex("/pixel/npcs/tavern_idle.png"),
    loadTex("/pixel/npcs/tavern_run.png"),
    loadTex("/pixel/npcs/knight_idle.png"),
    loadTex("/pixel/npcs/knight_run.png"),
    loadTex("/pixel/npcs/wizard_idle.png"),
    loadTex("/pixel/npcs/wizard_run.png"),
    loadTex("/pixel/mobs/orc_idle.png"),
    loadTex("/pixel/mobs/orc_run.png"),
    loadTex("/pixel/mobs/skeleton_idle.png"),
    loadTex("/pixel/mobs/skeleton_run.png"),
    (async () => {
      const map = new Map<string, Texture>();
      const urls = new Set<string>([
        ...BUILDINGS.map((b) => b.sprite),
        ...DECOR_HOUSES.map((h) => h.sprite),
      ]);
      await Promise.all([...urls].map(async (u) => map.set(u, await loadTex(u))));
      return map;
    })(),
  ]);

  const foamFrames = sliceFrames(foamTex, 192, 192);
  const splashFrames = sliceFrames(splashTex, 192, 192);
  const fireFrames = sliceFrames(fireTex, 64, 64);
  const sheepIdleFrames = sliceFrames(sheepIdleTex, 128, 128);
  const sheepMoveFrames = sliceFrames(sheepMoveTex, 128, 128);
  const duckFrames = sliceFrames(duckTex, 32, 32);
  // trees/bushes/water-rocks are strips — keep first pose, indexed to their url
  const treeFrames = treeTexes.map((t) => sliceFrames(t, 192, t.height)[0]);
  const bushFrames = bushTexes.map((t) => sliceFrames(t, 128, 128)[0]);
  const waterRockFrames = waterRockTexes.map((t) => sliceFrames(t, 64, 64)[0]);

  const peasantIdleFrames = sliceFrames(peasantIdleTex, 64, 64);
  const peasantRunFrames = sliceFrames(peasantRunTex, 64, 64);
  const tavernIdleFrames = sliceFrames(tavernIdleTex, 64, 64);
  const tavernRunFrames = sliceFrames(tavernRunTex, 64, 64);
  const knightIdleFrames = sliceFrames(knightIdleTex, 32, 32);
  const knightRunFrames = sliceFrames(knightRunTex, 64, 64);
  const wizardIdleFrames = sliceFrames(wizardIdleTex, 32, 32);
  const wizardRunFrames = sliceFrames(wizardRunTex, 64, 64);
  const orcIdleFrames = sliceFrames(orcIdleTex, 32, 32);
  const orcRunFrames = sliceFrames(orcRunTex, 64, 64);
  const skeletonIdleFrames = sliceFrames(skeletonIdleTex, 32, 32);
  const skeletonRunFrames = sliceFrames(skeletonRunTex, 64, 64);

  // ── Depth-sorted placement using real content bounds ───────────────────────
  const placeEntity = (
    tex: Texture,
    url: string,
    feetX: number,
    feetY: number,
    displayH: number,
    shadow = true,
  ): Sprite => {
    const t = trimOf(url);
    const s = new Sprite(tex);
    s.anchor.set(t.ax, t.ay);
    s.height = displayH;
    s.width = displayH * (tex.width / tex.height);
    s.x = feetX;
    s.y = feetY;
    s.zIndex = feetY;
    if (shadow) {
      const cw = s.width * t.wf;
      const sh = new Graphics()
        .ellipse(feetX, feetY, cw * 0.5, cw * 0.17)
        .fill({ color: 0x000000, alpha: 0.2 });
      sh.zIndex = feetY - 0.5;
      entities.addChild(sh);
    }
    entities.addChild(s);
    return s;
  };

  // ── Buildings (sprite content bottom-centre = footprint bottom-centre) ─────
  const placeBuilding = (b: { sprite: string; col: number; row: number; w: number; h: number }) => {
    const t = trimOf(b.sprite);
    const fx = (b.col + b.w / 2) * TILE;
    const fy = (b.row + b.h) * TILE;
    const cw = b.w * TILE * t.wf;
    const sh = new Graphics()
      .ellipse(fx, fy - 2, cw * 0.5, TILE * 0.2)
      .fill({ color: 0x000000, alpha: 0.18 });
    sh.zIndex = fy - 1;
    entities.addChild(sh);

    const s = new Sprite(buildingTexes.get(b.sprite)!);
    s.anchor.set(t.ax, t.ay);
    s.width = b.w * TILE;
    s.height = b.h * TILE;
    s.x = fx;
    s.y = fy;
    s.zIndex = fy;
    entities.addChild(s);
  };
  BUILDINGS.forEach(placeBuilding);
  DECOR_HOUSES.forEach(placeBuilding);

  // ── Floating building name labels (always visible, guides newcomers) ────────
  const labelStyle = new TextStyle({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 7,
    fill: "#f0c050",
    align: "center",
    stroke: { color: "#000000", width: 3, join: "round" },
  });
  const subLabelStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
    fill: "#f0c050",
    align: "center",
    stroke: { color: "#000000", width: 3 },
  });

  const BUILDING_DESC: Record<string, string> = {
    sanctum:     "About",
    chronicles:  "Experience",
    relics:      "Projects",
    armory:      "Skills",
    testimonies: "Testimonials",
    contact:     "Contact",
  };

  for (const b of BUILDINGS) {
    const door = doorPos(b);
    const labelY = door.y - TILE * 0.6;

    const arrow = new Text({ text: "▼", style: new TextStyle({
      fontFamily: "monospace", fontSize: 9, fill: "#c8861e",
      stroke: { color: "#000", width: 2 },
    }) });
    arrow.anchor.set(0.5, 1);
    arrow.x = door.x;
    arrow.y = labelY;
    arrow.zIndex = 9000;
    entities.addChild(arrow);

    const nameLabel = new Text({ text: b.name.toUpperCase(), style: labelStyle });
    nameLabel.anchor.set(0.5, 1);
    nameLabel.x = door.x;
    nameLabel.y = labelY - 12;
    nameLabel.zIndex = 9000;
    entities.addChild(nameLabel);

    const desc = BUILDING_DESC[b.id];
    if (desc) {
      const descLabel = new Text({ text: `[ ${desc} ]`, style: subLabelStyle });
      descLabel.anchor.set(0.5, 1);
      descLabel.x = door.x;
      descLabel.y = labelY - 26;
      descLabel.zIndex = 9000;
      entities.addChild(descLabel);
    }
  }

  // ── Cave: a standalone rock-mound diorama set into the mountain's east face ─
  const caveMouth = { x: 0, y: 0 };
  {
    const t = trimOf("/pixel/terrain/cave_mouth.webp");
    const cx = (CAVE.col + CAVE.w / 2) * TILE;
    const displayW = CAVE.w * TILE * 1.7;
    const displayH = displayW * (caveTex.height / caveTex.width);
    // Feet sit just south of the cliff base so the mound reads as built into the rock.
    const feetY = MOUNTAIN_ROWS * TILE + TILE * 0.9;
    const s = new Sprite(caveTex);
    s.anchor.set(t.ax, t.ay);
    s.width = displayW;
    s.height = displayH;
    s.x = cx;
    s.y = feetY;
    s.zIndex = feetY;
    entities.addChild(s);
    // Footprint block removed to prevent invisible walls blocking the player
    caveMouth.x = cx;
    caveMouth.y = feetY - displayH * 0.15; // roughly the entrance, not the mound's outer edge
    // Torches flanking the entrance.
    for (const dx of [-displayW * 0.42, displayW * 0.42]) {
      const torch = new Sprite(fireFrames[0]);
      torch.anchor.set(0.5, 1);
      torch.height = TILE * 0.85;
      torch.width = TILE * 0.85;
      torch.x = cx + dx;
      torch.y = feetY - displayH * 0.08;
      torch.zIndex = feetY + 1;
      entities.addChild(torch);
      animated.push({ sprite: torch, frames: fireFrames, fps: 12, phase: Math.random() * 3 });
    }
  }

  // ── Waterfall: a standalone cliff+tree+falls diorama feeding the pond ───────
  {
    const t = trimOf("/pixel/terrain/waterfall.png");
    const cx = (WATERFALL.col + WATERFALL.w / 2) * TILE;
    const displayH = WATERFALL.h * TILE * 1.25;
    const displayW = displayH * (waterfallTex.width / waterfallTex.height);
    const feetY = (WATERFALL.row + WATERFALL.h) * TILE + TILE * 0.3;
    const s = new Sprite(waterfallTex);
    s.anchor.set(t.ax, t.ay);
    s.width = displayW;
    s.height = displayH;
    s.x = cx;
    s.y = feetY;
    s.zIndex = feetY;
    waterFX.addChild(s);
    // Block the rock footprint (centre of the diorama), leave the pool open —
    // the pond's own water tiles already stop the player there.
    const footCols = Math.max(2, Math.round(WATERFALL.w * 0.6));
    const footCol0 = WATERFALL.col + Math.floor((WATERFALL.w - footCols) / 2);
    tilemap.blockRect(footCol0, WATERFALL.row, footCols, 2);
    // Splash where the falls meet the pool.
    for (let i = 0; i < 2; i++) {
      const sp = new Sprite(splashFrames[0]);
      sp.anchor.set(0.5, 0.5);
      sp.width = TILE * 1.3;
      sp.height = TILE * 1.3;
      sp.x = cx + (i - 0.5) * TILE * 0.6;
      sp.y = feetY - displayH * 0.02;
      waterFX.addChild(sp);
      animated.push({ sprite: sp, frames: splashFrames, fps: 10, phase: Math.random() * 2 });
    }
  }

  // ── Pond: water rocks + duck ────────────────────────────────────────────────
  {
    const rr = mulberry32(909);
    for (let i = 0; i < 7; i++) {
      const url = WATER_ROCK_URLS[Math.floor(rr() * WATER_ROCK_URLS.length)];
      const tex = waterRockFrames[WATER_ROCK_URLS.indexOf(url)];
      const t = trimOf(url);
      const s = new Sprite(tex);
      s.anchor.set(t.ax, t.ay);
      const hgt = TILE * (0.5 + rr() * 0.4);
      s.height = hgt;
      s.width = hgt * (tex.width / tex.height);
      s.x = (POND.col + 1 + rr() * (POND.w - 2)) * TILE;
      s.y = (POND.row + 2 + rr() * (POND.h - 3)) * TILE;
      waterFX.addChild(s);
    }

    const duck = new Sprite(duckFrames[0]);
    duck.anchor.set(0.5, 0.8);
    duck.height = TILE * 0.5;
    duck.width = duck.height * (duckFrames[0].width / duckFrames[0].height);
    const duckBaseX = (POND.col + POND.w * 0.7) * TILE;
    const duckBaseY = (POND.row + POND.h * 0.6) * TILE;
    duck.x = duckBaseX;
    duck.y = duckBaseY;
    waterFX.addChild(duck);
    animated.push({ sprite: duck, frames: duckFrames, fps: 4, phase: 0 });
    ducks.push({ sprite: duck, baseX: duckBaseX, baseY: duckBaseY, phase: Math.random() * 6 });
  }

  // ── Foam along shorelines ──────────────────────────────────────────────────
  {
    const isWater = (c: number, r: number) =>
      r >= 0 && r < ROWS && c >= 0 && c < COLS && tilemap.grid[r][c] === "water";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tilemap.grid[r][c] !== "water") continue;
        const edge =
          !isWater(c - 1, r) || !isWater(c + 1, r) || !isWater(c, r - 1) || !isWater(c, r + 1);
        if (!edge) continue;
        const foam = new Sprite(foamFrames[0]);
        foam.anchor.set(0.5, 0.5);
        foam.width = TILE * 1.15;
        foam.height = TILE * 1.15;
        foam.x = (c + 0.5) * TILE;
        foam.y = (r + 0.5) * TILE;
        foam.alpha = 0.5;
        waterFX.addChild(foam);
        animated.push({ sprite: foam, frames: foamFrames, fps: 8, phase: Math.random() * 4 });
      }
    }
  }

  // ── Roads: dirt ribbon + evenly-spaced rock cobblestones ───────────────────
  const onPath = (c: number, r: number) =>
    PATH_SEGMENTS.some((s) => c >= s.col && c < s.col + s.w && r >= s.row && r < s.row + s.h);
  {
    const cobbleLayer = new Container();
    for (const s of PATH_SEGMENTS) {
      const horiz = s.w >= s.h;
      const cRng = mulberry32(s.col * 977 + s.row * 131);
      const GAP = 30;
      const HALF = 21;
      if (horiz) {
        const cy = (s.row + 0.5) * TILE;
        const x0 = s.col * TILE;
        const x1 = (s.col + s.w) * TILE;
        // Two staggered rows of cobbles across the ribbon's width for a paved look.
        for (let x = x0 + 14; x < x1 - 14; x += GAP) {
          for (const oy of [-HALF, HALF]) {
            const tex = rockTexes[Math.floor(cRng() * rockTexes.length)];
            const stone = new Sprite(tex);
            stone.anchor.set(0.5, 0.5);
            stone.x = x + (cRng() - 0.5) * 8;
            stone.y = cy + oy + (cRng() - 0.5) * 6;
            stone.width = 26;
            stone.height = 26 * (tex.height / tex.width);
            stone.tint = 0xcfd3d8;
            stone.alpha = 0.9;
            cobbleLayer.addChild(stone);
          }
        }
      } else {
        const cx = (s.col + 0.5) * TILE;
        const y0 = s.row * TILE;
        const y1 = (s.row + s.h) * TILE;
        for (let y = y0 + 14; y < y1 - 14; y += GAP) {
          for (const ox of [-HALF, HALF]) {
            const tex = rockTexes[Math.floor(cRng() * rockTexes.length)];
            const stone = new Sprite(tex);
            stone.anchor.set(0.5, 0.5);
            stone.x = cx + ox + (cRng() - 0.5) * 6;
            stone.y = y + (cRng() - 0.5) * 8;
            stone.width = 26;
            stone.height = 26 * (tex.height / tex.width);
            stone.tint = 0xcfd3d8;
            stone.alpha = 0.9;
            cobbleLayer.addChild(stone);
          }
        }
      }
    }
    world.addChildAt(cobbleLayer, world.getChildIndex(entities));
  }

  // ── Scattered decoration (scaled up for the bigger map) ────────────────────
  {
    const rng = mulberry32(4242);
    const freeGrass = (c: number, r: number) =>
      r >= 0 && r < ROWS && c >= 0 && c < COLS && tilemap.grid[r][c] === "grass" && !tilemap.blocked[r][c];
    const scatter = (
      count: number,
      frames: Texture[],
      urls: string[],
      hMin: number,
      hMax: number,
      shadow: boolean,
    ) => {
      let placed = 0;
      let guard = 0;
      while (placed < count && guard++ < count * 25) {
        const c = Math.floor(rng() * COLS);
        const r = Math.floor(rng() * ROWS);
        if (!freeGrass(c, r) || onPath(c, r)) continue;
        if (Math.abs(c - SPAWN.col) < 2 && Math.abs(r - SPAWN.row) < 2) continue;
        if (c >= CAVE.col - 2 && c <= CAVE.col + CAVE.w + 1 && r >= MOUNTAIN_ROWS && r <= MOUNTAIN_ROWS + CAVE.h + 2) continue;
        const idx = Math.floor(rng() * frames.length);
        placeEntity(frames[idx], urls[idx], (c + 0.5) * TILE, (r + 1) * TILE, hMin + rng() * (hMax - hMin), shadow);
        placed++;
      }
    };
    scatter(90, treeFrames, TREE_URLS, TILE * 1.9, TILE * 2.6, true);
    scatter(100, bushFrames, BUSH_URLS, TILE * 0.9, TILE * 1.3, true);
    scatter(60, rockTexes, ROCK_URLS, TILE * 0.5, TILE * 0.85, true);
    scatter(26, stumpTexes, STUMP_URLS, TILE * 0.9, TILE * 1.1, true);

    // Southern tree border
    for (let c = 1; c < COLS - 1; c += 2) {
      const r = ROWS - 1 - Math.floor(rng() * 2);
      if (!freeGrass(c, r)) continue;
      const idx = Math.floor(rng() * treeFrames.length);
      placeEntity(treeFrames[idx], TREE_URLS[idx], (c + 0.5) * TILE + (rng() - 0.5) * 18, (r + 1) * TILE, TILE * 2.3, true);
    }
  }

  // ── Mountain plateau: dark pine silhouette + boulders ──────────────────────
  {
    const rng = mulberry32(2024);
    const plateauRows = Math.max(1, MOUNTAIN_ROWS - 4);
    for (let i = 0; i < 60; i++) {
      const c = Math.floor(rng() * COLS);
      const r = Math.floor(rng() * plateauRows);
      if (c >= CAVE.col - 1 && c <= CAVE.col + CAVE.w) continue;
      if (rng() < 0.5) {
        const idx = Math.floor(rng() * rockTexes.length);
        placeEntity(rockTexes[idx], ROCK_URLS[idx], (c + 0.5) * TILE, (r + 1) * TILE, TILE * (0.6 + rng() * 0.7), false);
      } else {
        const idx = Math.floor(rng() * treeFrames.length);
        const pine = placeEntity(treeFrames[idx], TREE_URLS[idx], (c + 0.5) * TILE, (r + 1) * TILE, TILE * (1.6 + rng() * 0.8), false);
        pine.tint = 0x6f8592;
      }
    }
  }

  // ── Cloud shadows ──────────────────────────────────────────────────────────
  const clouds: { g: Graphics; vx: number; vy: number }[] = [];
  {
    const rng = mulberry32(77);
    for (let i = 0; i < 6; i++) {
      const g = new Graphics()
        .ellipse(0, 0, 110 + rng() * 70, 64 + rng() * 34)
        .fill({ color: 0x001018, alpha: 0.05 });
      g.x = rng() * WORLD_W;
      g.y = rng() * WORLD_H;
      cloudLayer.addChild(g);
      clouds.push({ g, vx: 7 + rng() * 8, vy: 2 + rng() * 3 });
    }
  }

  // ── Butterflies ─────────────────────────────────────────────────────────────
  const BUTTERFLY_COLORS = [0xff88cc, 0xffcc44, 0x44ddff, 0x88ff88, 0xee88ff, 0xff9966];
  {
    const bfRng = mulberry32(3141);
    const butterflyLayer = new Container();
    world.addChild(butterflyLayer);
    for (let i = 0; i < 28; i++) {
      const col = 2 + Math.floor(bfRng() * (COLS - 4));
      const row = MOUNTAIN_ROWS + Math.floor(bfRng() * (ROWS - MOUNTAIN_ROWS - 4));
      const color = BUTTERFLY_COLORS[Math.floor(bfRng() * BUTTERFLY_COLORS.length)];
      const size = 5 + bfRng() * 4;
      const g = new Graphics();
      g.moveTo(0, 0).lineTo(-size * 1.4, -size * 0.6).lineTo(-size * 0.3, size * 0.5).fill({ color, alpha: 0.85 });
      g.moveTo(0, 0).lineTo(size * 1.4, -size * 0.6).lineTo(size * 0.3, size * 0.5).fill({ color, alpha: 0.85 });
      g.circle(0, 0, 1.5).fill({ color: 0x220022, alpha: 0.7 });
      g.x = (col + 0.5) * TILE;
      g.y = (row + 0.5) * TILE;
      butterflyLayer.addChild(g);
      butterflies.push({
        g, x: g.x, y: g.y, tx: g.x, ty: g.y, vx: 0, vy: 0,
        flapPhase: bfRng() * Math.PI * 2, flapSpeed: 6 + bfRng() * 5,
        wanderTimer: bfRng() * 3, baseColor: color, size,
      });
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────
  const player = await createPlayer((SPAWN.col + 0.5) * TILE, (SPAWN.row + 0.9) * TILE);
  entities.addChild(player.container);
  const canWalk = (x: number, y: number) => !tilemap.isBlockedPx(x, y);

  // ── Wandering critters (sheep, townsfolk, wild mobs) ───────────────────────
  const pickSpot = (reg: { col: number; row: number; w: number; h: number }, rng: () => number) => {
    for (let i = 0; i < 24; i++) {
      const x = (reg.col + rng() * reg.w) * TILE;
      const y = (reg.row + rng() * reg.h) * TILE;
      if (canWalk(x, y) && tilemap.grid[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] === "grass")
        return { x, y };
    }
    return null;
  };

  const spawnCritter = (
    idleFrames: Texture[],
    moveFrames: Texture[],
    reg: { col: number; row: number; w: number; h: number },
    count: number,
    opts: { displayH: number; idleFps: number; moveFps: number; speed: number; anchorY?: number },
  ) => {
    const rng = mulberry32(reg.col * 31 + reg.row * 17 + count * 7);
    for (let i = 0; i < count; i++) {
      const spot = pickSpot(reg, rng);
      if (!spot) continue;
      const sprite = new Sprite(idleFrames[0]);
      sprite.anchor.set(0.5, opts.anchorY ?? 0.85);
      sprite.height = opts.displayH;
      sprite.width = sprite.height * (idleFrames[0].width / idleFrames[0].height);
      const baseScale = sprite.scale.x;
      sprite.x = spot.x;
      sprite.y = spot.y;
      entities.addChild(sprite);
      const shadow = new Graphics()
        .ellipse(0, 0, opts.displayH * 0.34, opts.displayH * 0.12)
        .fill({ color: 0, alpha: 0.22 });
      entities.addChild(shadow);
      critters.push({
        sprite, shadow, x: spot.x, y: spot.y, tx: spot.x, ty: spot.y,
        state: "idle", timer: 1 + rng() * 3, facing: 1, anim: rng() * 3,
        baseScale, region: reg, idleFrames, moveFrames,
        idleFps: opts.idleFps, moveFps: opts.moveFps, speed: opts.speed,
      });
    }
  };

  // Sheep dot the grassy frontier and the town green.
  spawnCritter(sheepIdleFrames, sheepMoveFrames, { col: 2, row: 20, w: 48, h: 16 }, 7, {
    displayH: TILE * 0.82, idleFps: 5, moveFps: 6, speed: 26, anchorY: trimOf("/pixel/deco/sheep_idle.png").ay,
  });
  spawnCritter(sheepIdleFrames, sheepMoveFrames, { col: 14, row: 8, w: 24, h: 8 }, 4, {
    displayH: TILE * 0.82, idleFps: 5, moveFps: 6, speed: 26, anchorY: trimOf("/pixel/deco/sheep_idle.png").ay,
  });

  // Friendly townsfolk wander the streets.
  spawnCritter(peasantIdleFrames, peasantRunFrames, { col: 2, row: 20, w: 48, h: 17 }, 3, {
    displayH: 48, idleFps: 6, moveFps: 8, speed: 30,
  });
  spawnCritter(tavernIdleFrames, tavernRunFrames, { col: 2, row: 20, w: 48, h: 17 }, 2, {
    displayH: 48, idleFps: 6, moveFps: 8, speed: 30,
  });
  spawnCritter(wizardIdleFrames, wizardRunFrames, { col: 2, row: 20, w: 48, h: 17 }, 2, {
    displayH: 48, idleFps: 6, moveFps: 9, speed: 26,
  });
  spawnCritter(knightIdleFrames, knightRunFrames, { col: 18, row: 20, w: 20, h: 12 }, 2, {
    displayH: 48, idleFps: 6, moveFps: 9, speed: 32,
  });

  // Wild mobs roam the frontier, north of the river.
  spawnCritter(orcIdleFrames, orcRunFrames, { col: 20, row: 7, w: 16, h: 9 }, 3, {
    displayH: 48, idleFps: 6, moveFps: 9, speed: 30,
  });
  spawnCritter(skeletonIdleFrames, skeletonRunFrames, { col: 30, row: 7, w: 8, h: 9 }, 2, {
    displayH: 48, idleFps: 6, moveFps: 9, speed: 28,
  });

  // ── Interaction / proximity ────────────────────────────────────────────────
  const TRIGGER = 90;
  const detectNear = () => {
    let best: { id: string; label: string; action: string } | null = null;
    let bestD = TRIGGER;
    for (const b of BUILDINGS) {
      const d = doorPos(b);
      const dist = Math.hypot(player.x - d.x, player.y - d.y);
      if (dist < bestD) {
        bestD = dist;
        best = { id: b.id, label: b.name, action: b.action };
      }
    }
    if (Math.hypot(player.x - caveMouth.x, player.y - caveMouth.y) < bestD) {
      best = { id: "cave", label: "The Hollow Cave", action: "Peer inside" };
    }
    setNear(best);
  };

  // ── Camera ─────────────────────────────────────────────────────────────────
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const applyCamera = () => {
    const vw = app.screen.width;
    const vh = app.screen.height;
    if (DEBUG_COLLISION) {
      const scale = Math.min(vw / WORLD_W, vh / WORLD_H);
      world.scale.set(scale);
      world.x = Math.round((vw - WORLD_W * scale) / 2);
      world.y = Math.round((vh - WORLD_H * scale) / 2);
      return;
    }
    const scale = clamp(Math.max(vw / 1000, vh / 620), 1.2, 2.6);
    world.scale.set(scale);
    world.x = Math.round(clamp(vw / 2 - player.x * scale, vw - WORLD_W * scale, 0));
    world.y = Math.round(clamp(vh / 2 - player.y * scale, vh - WORLD_H * scale, 0));
  };

  // ── Per-frame update ───────────────────────────────────────────────────────
  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;
    player.update(dt, canWalk);
    detectNear();

    if (input.justPressed(...KEY.interact) && worldState.near) {
      bus.emitOpen(worldState.near.id);
    }

    // wandering critters (sheep, townsfolk, mobs)
    for (const cr of critters) {
      cr.anim += dt;
      if (cr.state === "idle") {
        cr.timer -= dt;
        cr.sprite.texture = cr.idleFrames[Math.floor(cr.anim * cr.idleFps) % cr.idleFrames.length];
        if (cr.timer <= 0) {
          const spot = pickSpot(cr.region, Math.random);
          if (spot) {
            cr.tx = spot.x;
            cr.ty = spot.y;
            cr.state = "move";
            cr.timer = 2 + Math.random() * 4;
          } else cr.timer = 1;
        }
      } else {
        const dx = cr.tx - cr.x;
        const dy = cr.ty - cr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4 || cr.timer <= 0) {
          cr.state = "idle";
          cr.timer = 1.5 + Math.random() * 3;
        } else {
          const step = cr.speed * dt;
          const nx = cr.x + (dx / dist) * step;
          const ny = cr.y + (dy / dist) * step;
          if (canWalk(nx, ny)) {
            cr.x = nx;
            cr.y = ny;
            if (dx < -0.5) cr.facing = -1;
            else if (dx > 0.5) cr.facing = 1;
          } else {
            cr.state = "idle";
            cr.timer = 1;
          }
          cr.sprite.texture = cr.moveFrames[Math.floor(cr.anim * cr.moveFps) % cr.moveFrames.length];
        }
      }
      cr.sprite.x = Math.round(cr.x);
      cr.sprite.y = Math.round(cr.y);
      cr.sprite.scale.x = cr.baseScale * cr.facing;
      cr.sprite.zIndex = cr.y;
      cr.shadow.x = cr.sprite.x;
      cr.shadow.y = cr.sprite.y;
      cr.shadow.zIndex = cr.y - 0.5;
    }

    // duck bob
    for (const d of ducks) {
      d.phase += dt;
      d.sprite.y = d.baseY + Math.sin(d.phase * 1.6) * 3;
      d.sprite.x = d.baseX + Math.sin(d.phase * 0.5) * 8;
    }

    // butterflies
    for (const bf of butterflies) {
      bf.flapPhase += bf.flapSpeed * dt;
      bf.wanderTimer -= dt;
      if (bf.wanderTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        bf.tx = Math.max(TILE * 2, Math.min(WORLD_W - TILE * 2, bf.x + Math.cos(angle) * dist));
        bf.ty = Math.max(TILE * (MOUNTAIN_ROWS + 1), Math.min(WORLD_H - TILE * 2, bf.y + Math.sin(angle) * dist));
        bf.wanderTimer = 1.5 + Math.random() * 3;
      }
      const ddx = bf.tx - bf.x;
      const ddy = bf.ty - bf.y;
      const spd = 38;
      bf.vx += ddx * 2.5 * dt;
      bf.vy += ddy * 2.5 * dt;
      bf.vx *= 0.92;
      bf.vy *= 0.92;
      const vel = Math.hypot(bf.vx, bf.vy);
      if (vel > spd) { bf.vx = (bf.vx / vel) * spd; bf.vy = (bf.vy / vel) * spd; }
      bf.x += bf.vx * dt;
      bf.y += bf.vy * dt;
      const flapAmt = Math.abs(Math.sin(bf.flapPhase));
      const facing = bf.vx < -0.5 ? -1 : 1;
      bf.g.clear();
      const wx = bf.size * 1.4 * (0.15 + flapAmt * 0.85);
      const wy = bf.size * 0.6 + flapAmt * bf.size * 0.3;
      bf.g.moveTo(0, 0).lineTo(-wx * facing, -wy).lineTo(-bf.size * 0.3 * facing, bf.size * 0.5).fill({ color: bf.baseColor, alpha: 0.82 });
      bf.g.moveTo(0, 0).lineTo(wx * facing, -wy).lineTo(bf.size * 0.3 * facing, bf.size * 0.5).fill({ color: bf.baseColor, alpha: 0.82 });
      bf.g.circle(0, 0, 1.5).fill({ color: 0x220022, alpha: 0.7 });
      bf.g.x = Math.round(bf.x);
      bf.g.y = Math.round(bf.y) + Math.sin(elapsed * 1.2 + bf.flapPhase * 0.1) * 3;
    }

    // environment frame animation (torches, splashes, foam, duck)
    for (const a of animated) {
      a.sprite.texture = a.frames[Math.floor((elapsed + a.phase) * a.fps) % a.frames.length];
    }

    // clouds
    for (const c of clouds) {
      c.g.x += c.vx * dt;
      c.g.y += c.vy * dt;
      if (c.g.x > WORLD_W + 200) c.g.x = -200;
      if (c.g.y > WORLD_H + 150) c.g.y = -150;
    }

    entities.sortChildren();
    applyCamera();
  };

  if (DEBUG_COLLISION) {
    const dbg = new Graphics();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tilemap.blocked[r][c]) {
          dbg.rect(c * TILE, r * TILE, TILE, TILE).fill({ color: 0xff0000, alpha: 0.4 });
        }
      }
    }
    world.addChild(dbg);
  }

  applyCamera();
  return { container: scene, update };
}
