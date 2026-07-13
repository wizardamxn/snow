import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
  ColorMatrixFilter,
} from "pixi.js";
import { buildTilemap } from "@/components/world/Tilemap";
import { createPlayer } from "@/components/world/Player";
import { loadTex, mulberry32, sliceFrames, TILE } from "@/components/world/tiles";
import { SPRITE_TRIM } from "@/components/world/spriteTrim";
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
const trimOf = (url: string) => SPRITE_TRIM[url] ?? { ax: 0.5, ay: 1, wf: 1 };

export async function buildTownScene(app: Application): Promise<SceneController> {
  const scene = new Container();
  const world = new Container();
  scene.addChild(world);

  // Apply Day/Night tint filter
  const filter = new ColorMatrixFilter();
  world.filters = [filter];

  const DAY_MAT = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ] as any;
  const GOLDEN_MAT = [
    1.1, 0.0, 0.0, 0.0, 0.05,
    0.0, 0.95, 0.0, 0.0, 0.02,
    0.0, 0.0, 0.8, 0.0, -0.05,
    0.0, 0.0, 0.0, 1.0, 0.0,
  ] as any;
  const NIGHT_MAT = [
    0.5, 0.0, 0.0, 0.0, -0.1,
    0.0, 0.6, 0.0, 0.0, -0.05,
    0.0, 0.0, 0.9, 0.0, 0.1,
    0.0, 0.0, 0.0, 1.0, 0.0,
  ] as any;

  const lerpMat = (a: number[], b: number[], t: number) => 
    a.map((v, i) => v + (b[i] - v) * t) as any;

  // ── Ground + collision ─────────────────────────────────────────────────────
  const tilemap = await buildTilemap();
  world.addChild(tilemap.container);
  // Buildings block only their ground-floor rows (bottom 2 rows of the footprint).
  // Blocking the whole sprite height (including roof) creates invisible walls above
  // the building that the player gets stuck on — only the door area needs to be solid.
  BUILDINGS.forEach((b) => {
    const groundRows = Math.min(2, b.h);
    tilemap.blockRect(b.col, b.row + b.h - groundRows, b.w, groundRows);
  });
  DECOR_HOUSES.forEach((h) => {
    const groundRows = Math.min(2, h.h);
    tilemap.blockRect(h.col, h.row + h.h - groundRows, h.w, groundRows);
  });

  const waterFX = new Container();
  world.addChild(waterFX);

  const entities = new Container();
  entities.sortableChildren = true;
  world.addChild(entities);

  const cloudLayer = new Container();
  world.addChild(cloudLayer);

  const animated: Animated[] = [];
  const sheep: Sheep[] = [];
  const ducks: Duck[] = [];
  const butterflies: Butterfly[] = [];
  let waterfallStreaks: {
    streaks: { g: Graphics; x: number; y: number; speed: number; len: number }[];
    y0: number;
    y1: number;
  } | null = null;

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
    ravenTex,
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
    loadTex("/pixel/knight/Raven_Idle.png"),
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
  const ravenFrames = sliceFrames(ravenTex, 192, 192);
  // trees/bushes/water-rocks are strips — keep first pose, indexed to their url
  const treeFrames = treeTexes.map((t) => sliceFrames(t, 192, t.height)[0]);
  const bushFrames = bushTexes.map((t) => sliceFrames(t, 128, 128)[0]);
  const waterRockFrames = waterRockTexes.map((t) => sliceFrames(t, 64, 64)[0]);

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
  //  Each label hovers above the building door so players know what to expect
  //  before they're close enough to trigger the [E] prompt.
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

  // Map each building id to a short content description shown as a sub-label
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

    // Small bounce arrow above the label
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
      descLabel.y = labelY - 26; // Moved up slightly to accommodate larger font
      descLabel.zIndex = 9000;
      entities.addChild(descLabel);
    }
  }

  // ── Cave mouth in the eastern mountain face ────────────────────────────────
  {
    const cx = (CAVE.col + CAVE.w / 2) * TILE;
    const baseY = (CAVE.row + CAVE.h) * TILE;
    const w = CAVE.w * TILE * 0.95;
    const h = CAVE.h * TILE * 1.3;
    const cave = new Graphics();
    cave.ellipse(cx, baseY - h * 0.44, w * 0.66, h * 0.6).fill(0x4a5563); // stone rim
    cave.ellipse(cx, baseY - h * 0.42, w * 0.52, h * 0.5).fill(0x2c3440);
    cave.ellipse(cx, baseY - h * 0.4, w * 0.42, h * 0.44).fill(0x11131f); // mouth
    cave.ellipse(cx, baseY - h * 0.32, w * 0.3, h * 0.3).fill(0x05060b);
    cave.zIndex = baseY;
    entities.addChild(cave);
    // rocks framing the entrance
    placeEntity(rockTexes[2], ROCK_URLS[2], cx - w * 0.55, baseY + 4, TILE * 0.8, false);
    placeEntity(rockTexes[3], ROCK_URLS[3], cx + w * 0.55, baseY + 4, TILE * 0.8, false);
    for (const dx of [-w * 0.48, w * 0.48]) {
      const torch = new Sprite(fireFrames[0]);
      torch.anchor.set(0.5, 1);
      torch.height = TILE * 0.95;
      torch.width = TILE * 0.95;
      torch.x = cx + dx;
      torch.y = baseY + 6;
      torch.zIndex = baseY + 1;
      entities.addChild(torch);
      animated.push({ sprite: torch, frames: fireFrames, fps: 12, phase: Math.random() * 3 });
    }
  }

  // ── Waterfall + pond splash + water rocks + duck ───────────────────────────
  {
    const wfX0 = WATERFALL.col * TILE;
    const wfX1 = (WATERFALL.col + WATERFALL.w) * TILE;
    const wfY0 = WATERFALL.row * TILE;
    const wfY1 = (WATERFALL.row + WATERFALL.h) * TILE;

    // lighter water tint over the fall
    const tintG = new Graphics()
      .rect(wfX0, wfY0, wfX1 - wfX0, wfY1 - wfY0)
      .fill({ color: 0x8fd4e0, alpha: 0.35 });
    waterFX.addChild(tintG);

    const streaks: { g: Graphics; x: number; y: number; speed: number; len: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const g = new Graphics();
      const x = wfX0 + 5 + Math.random() * (wfX1 - wfX0 - 10);
      const len = 26 + Math.random() * 44;
      g.roundRect(0, 0, 5, len, 2).fill({ color: 0xeafcff, alpha: 0.6 });
      g.x = x;
      g.y = wfY0 + Math.random() * (wfY1 - wfY0);
      waterFX.addChild(g);
      streaks.push({ g, x, y: g.y, speed: 210 + Math.random() * 130, len });
    }
    waterfallStreaks = { streaks, y0: wfY0, y1: wfY1 };

    for (let i = 0; i < 3; i++) {
      const sp = new Sprite(splashFrames[0]);
      sp.anchor.set(0.5, 0.5);
      sp.width = TILE * 1.5;
      sp.height = TILE * 1.5;
      sp.x = wfX0 + ((i + 0.5) / 3) * (wfX1 - wfX0);
      sp.y = wfY1;
      waterFX.addChild(sp);
      animated.push({ sprite: sp, frames: splashFrames, fps: 10, phase: Math.random() * 2 });
    }

    const rr = mulberry32(909);
    for (let i = 0; i < 5; i++) {
      const url = WATER_ROCK_URLS[Math.floor(rr() * WATER_ROCK_URLS.length)];
      const tex = waterRockFrames[WATER_ROCK_URLS.indexOf(url)];
      const t = trimOf(url);
      const s = new Sprite(tex);
      s.anchor.set(t.ax, t.ay);
      const hgt = TILE * (0.5 + rr() * 0.4);
      s.height = hgt;
      s.width = hgt * (tex.width / tex.height);
      s.x = (POND.col + 1 + rr() * (POND.w - 2)) * TILE;
      s.y = (POND.row + 1 + rr() * (POND.h - 2)) * TILE;
      waterFX.addChild(s);
    }

    // Rubber duck bobbing on the pond
    const duck = new Sprite(duckFrames[0]);
    duck.anchor.set(0.5, 0.8);
    duck.height = TILE * 0.5;
    duck.width = duck.height * (duckFrames[0].width / duckFrames[0].height);
    const duckBaseX = (POND.col + POND.w * 0.68) * TILE;
    const duckBaseY = (POND.row + POND.h * 0.55) * TILE;
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

  // ── Scattered decoration (denser, since the world is smaller) ──────────────
  const onPath = (c: number, r: number) =>
    PATH_SEGMENTS.some((s) => c >= s.col && c < s.col + s.w && r >= s.row && r < s.row + s.h);
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
        const idx = Math.floor(rng() * frames.length);
        placeEntity(frames[idx], urls[idx], (c + 0.5) * TILE, (r + 1) * TILE, hMin + rng() * (hMax - hMin), shadow);
        placed++;
      }
    };
    scatter(46, treeFrames, TREE_URLS, TILE * 1.9, TILE * 2.6, true);
    scatter(52, bushFrames, BUSH_URLS, TILE * 0.9, TILE * 1.3, true);
    scatter(34, rockTexes, ROCK_URLS, TILE * 0.5, TILE * 0.85, true);
    scatter(14, stumpTexes, STUMP_URLS, TILE * 0.9, TILE * 1.1, true);

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
    const plateauRows = Math.max(1, MOUNTAIN_ROWS - 3);
    for (let i = 0; i < 44; i++) {
      const c = Math.floor(rng() * COLS);
      const r = Math.floor(rng() * plateauRows);
      if (c >= CAVE.col - 1 && c <= CAVE.col + CAVE.w) continue;
      if (rng() < 0.5) {
        const idx = Math.floor(rng() * rockTexes.length);
        placeEntity(rockTexes[idx], ROCK_URLS[idx], (c + 0.5) * TILE, (r + 1) * TILE, TILE * (0.6 + rng() * 0.7), false);
      } else {
        const idx = Math.floor(rng() * treeFrames.length);
        const pine = placeEntity(treeFrames[idx], TREE_URLS[idx], (c + 0.5) * TILE, (r + 1) * TILE, TILE * (1.6 + rng() * 0.8), false);
        pine.tint = 0x6f8592; // cool, hazy — reads as distant peaks
      }
    }
  }

  // ── Cloud shadows ──────────────────────────────────────────────────────────
  const clouds: { g: Graphics; vx: number; vy: number }[] = [];
  {
    const rng = mulberry32(77);
    for (let i = 0; i < 4; i++) {
      const g = new Graphics()
        .ellipse(0, 0, 110 + rng() * 70, 64 + rng() * 34)
        .fill({ color: 0x001018, alpha: 0.05 });
      g.x = rng() * WORLD_W;
      g.y = rng() * WORLD_H;
      cloudLayer.addChild(g);
      clouds.push({ g, vx: 7 + rng() * 8, vy: 2 + rng() * 3 });
    }
  }

  // ── Butterflies ────────────────────────────────────────────────────────────
  const BUTTERFLY_COLORS = [0xff88cc, 0xffcc44, 0x44ddff, 0x88ff88, 0xee88ff, 0xff9966];
  const bfRng = mulberry32(3141);
  const butterflyLayer = new Container();
  world.addChild(butterflyLayer);
  for (let i = 0; i < 18; i++) {
    // Spawn in grassy town/wild areas, away from water and mountains
    const col = 2 + Math.floor(bfRng() * (COLS - 4));
    const row = 6 + Math.floor(bfRng() * 18);
    const color = BUTTERFLY_COLORS[Math.floor(bfRng() * BUTTERFLY_COLORS.length)];
    const size = 5 + bfRng() * 4; // wing half-size in world px

    // Two wing triangles drawn from a centre point
    const g = new Graphics();
    // Left wing
    g.moveTo(0, 0).lineTo(-size * 1.4, -size * 0.6).lineTo(-size * 0.3, size * 0.5).fill({ color, alpha: 0.85 });
    // Right wing
    g.moveTo(0, 0).lineTo(size * 1.4, -size * 0.6).lineTo(size * 0.3, size * 0.5).fill({ color, alpha: 0.85 });
    // Body dot
    g.circle(0, 0, 1.5).fill({ color: 0x220022, alpha: 0.7 });

    g.x = (col + 0.5) * TILE;
    g.y = (row + 0.5) * TILE;
    butterflyLayer.addChild(g);

    butterflies.push({
      g,
      x: g.x,
      y: g.y,
      tx: g.x,
      ty: g.y,
      vx: 0,
      vy: 0,
      flapPhase: bfRng() * Math.PI * 2,
      flapSpeed: 6 + bfRng() * 5,
      wanderTimer: bfRng() * 3,
      baseColor: color,
      size,
    });
  }

  // ── High-Altitude Birds ────────────────────────────────────────────────────
  const birds: Bird[] = [];
  {
    const bRng = mulberry32(111);
    for (let i = 0; i < 15; i++) {
      const g = new Graphics();
      // Draw a tiny bird silhouette (V-shape)
      g.moveTo(0, 0).lineTo(-4, -3).moveTo(0, 0).lineTo(4, -3).stroke({ color: 0x111122, width: 1.5, join: "round", cap: "round" });
      g.alpha = 0.6;
      cloudLayer.addChild(g);
      birds.push({
        g,
        x: bRng() * WORLD_W,
        y: bRng() * WORLD_H,
        vx: 40 + bRng() * 30,
        vy: -15 - bRng() * 10,
        flapPhase: bRng() * Math.PI * 2,
        flapSpeed: 10 + bRng() * 5,
        baseScale: 0.8 + bRng() * 0.4,
      });
    }
  }

  // ── Falling Leaves ─────────────────────────────────────────────────────────
  const leaves: Leaf[] = [];
  {
    const lRng = mulberry32(222);
    for (let i = 0; i < 35; i++) {
      const g = new Graphics();
      g.rect(-1.5, -1.5, 3, 3).fill({ color: lRng() > 0.5 ? 0xc85a17 : 0x8a6820 });
      world.addChild(g);
      leaves.push({
        g,
        x: lRng() * WORLD_W,
        y: lRng() * WORLD_H,
        vx: -15 - lRng() * 20,
        vy: 25 + lRng() * 15,
        swayPhase: lRng() * Math.PI * 2,
        swaySpeed: 2 + lRng() * 2,
      });
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────
  const player = await createPlayer((SPAWN.col + 0.5) * TILE, (SPAWN.row + 0.9) * TILE);
  entities.addChild(player.container);
  const canWalk = (x: number, y: number) => !tilemap.isBlockedPx(x, y);

  // Glowing lantern for night
  const lantern = new Graphics();
  for (let r = 10; r <= 200; r += 20) {
    lantern.circle(0, 0, r).fill({ color: 0xffaa33, alpha: 0.08 * (1 - r / 200) });
  }
  lantern.blendMode = "add";
  lantern.zIndex = 9999;
  entities.addChild(lantern);

  // ── Raven NPC (The Guide) ──────────────────────────────────────────────────
  const ravenX = (SPAWN.col - 1.5) * TILE;
  const ravenY = (SPAWN.row + 1.5) * TILE;
  const ravenContainer = new Container();
  
  const ravenShadow = new Graphics().ellipse(0, -2, 16, 6).fill({ color: 0x000, alpha: 0.28 });
  ravenContainer.addChild(ravenShadow);

  const ravenSprite = new Sprite(ravenFrames[0]);
  ravenSprite.anchor.set(0.5, 0.82); // match player
  ravenSprite.scale.set(74 / 192); // match player height
  ravenContainer.addChild(ravenSprite);
  
  ravenContainer.x = ravenX;
  ravenContainer.y = ravenY;
  ravenContainer.zIndex = ravenY;
  entities.addChild(ravenContainer);

  // ── Wandering sheep ────────────────────────────────────────────────────────
  const sheepRegions = [
    { col: 2, row: 15, w: 33, h: 9 },
    { col: 14, row: 6, w: 12, h: 5 },
  ];
  const pickSpot = (reg: { col: number; row: number; w: number; h: number }, rng: () => number) => {
    for (let i = 0; i < 20; i++) {
      const x = (reg.col + rng() * reg.w) * TILE;
      const y = (reg.row + rng() * reg.h) * TILE;
      if (canWalk(x, y) && tilemap.grid[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] === "grass")
        return { x, y };
    }
    return null;
  };
  const rngS = mulberry32(555);
  for (let i = 0; i < 5; i++) {
    const reg = sheepRegions[i % sheepRegions.length];
    const spot = pickSpot(reg, rngS);
    if (!spot) continue;
    const t = trimOf("/pixel/deco/sheep_idle.png");
    const sprite = new Sprite(sheepIdleFrames[0]);
    sprite.anchor.set(t.ax, t.ay);
    sprite.height = TILE * 0.82;
    sprite.width = sprite.height * (sheepIdleFrames[0].width / sheepIdleFrames[0].height);
    const baseScale = sprite.scale.x;
    sprite.x = spot.x;
    sprite.y = spot.y;
    entities.addChild(sprite);
    const shadow = new Graphics().ellipse(0, 0, sprite.width * t.wf * 0.5, sprite.width * t.wf * 0.18).fill({ color: 0, alpha: 0.18 });
    entities.addChild(shadow);
    sheep.push({
      sprite, shadow, x: spot.x, y: spot.y, tx: spot.x, ty: spot.y,
      state: "idle", timer: 1 + rngS() * 3, facing: 1, anim: rngS() * 3,
      baseScale, region: reg,
    });
  }

  // ── Interaction / proximity ────────────────────────────────────────────────
  const caveMouth = { x: (CAVE.col + CAVE.w / 2) * TILE, y: (CAVE.row + CAVE.h + 1) * TILE };
  // Larger trigger radius (120 px) so the [E] prompt appears well before the door
  // — much more discoverable for first-time visitors.
  const TRIGGER = 120;
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
    const scale = clamp(Math.max(vw / 1000, vh / 620), 1.2, 2.6);
    world.scale.set(scale);
    world.x = Math.round(clamp(vw / 2 - player.x * scale, vw - WORLD_W * scale, 0));
    world.y = Math.round(clamp(vh / 2 - player.y * scale, vh - WORLD_H * scale, 0));
  };

  // ── Per-frame update ───────────────────────────────────────────────────────
  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;

    // ── Day / Night Cycle ────────────────────────────────────────────────────
    if (worldState.cycleRunning) {
      worldState.timeOfDay += dt * 0.4; // Faster cycle for demo (60s = 1 day)
      if (worldState.timeOfDay >= 24) worldState.timeOfDay -= 24;
    }
    
    const tOfDay = worldState.timeOfDay;
    let nightAmt = 0;
    let goldenAmt = 0;

    if (tOfDay >= 16 && tOfDay < 18) {
      goldenAmt = (tOfDay - 16) / 2;
    } else if (tOfDay >= 18 && tOfDay < 20) {
      goldenAmt = 1 - (tOfDay - 18) / 2;
      nightAmt = (tOfDay - 18) / 2;
    } else if (tOfDay >= 20 || tOfDay < 6) {
      nightAmt = 1;
    } else if (tOfDay >= 6 && tOfDay < 8) {
      nightAmt = 1 - (tOfDay - 6) / 2;
    }

    if (nightAmt > 0) {
      filter.matrix = lerpMat(DAY_MAT, NIGHT_MAT, nightAmt);
      if (goldenAmt > 0) filter.matrix = lerpMat(filter.matrix, GOLDEN_MAT, goldenAmt);
    } else if (goldenAmt > 0) {
      filter.matrix = lerpMat(DAY_MAT, GOLDEN_MAT, goldenAmt);
    } else {
      filter.matrix = DAY_MAT;
    }

    lantern.alpha = nightAmt * 0.8 + goldenAmt * 0.3;

    // ─────────────────────────────────────────────────────────────────────────

    player.update(dt, canWalk);
    // Expose player position for the React minimap (polled via rAF, no React state).
    worldState.playerX = player.x;
    worldState.playerY = player.y;
    worldState.ravenX = ravenX;
    worldState.ravenY = ravenY - 70; // bubble attaches above head
    
    lantern.x = player.x;
    lantern.y = player.y - TILE * 0.5;

    // Raven idle animation
    ravenSprite.texture = ravenFrames[Math.floor(elapsed * 6) % ravenFrames.length];

    // Proximity logic
    let anyNear = false;

    // 1. Check Raven
    const distToRaven = Math.hypot(player.x - ravenX, player.y - ravenY);
    if (distToRaven < 75) {
      anyNear = true;
      if (worldState.near?.id !== "raven") {
        setNear({ id: "raven", action: "TALK TO", label: "RAVEN" });
      }
    } else {
      // 2. Check buildings
      for (const b of BUILDINGS) {
        if (!b.id) continue;
        const dx = (b.col + b.w / 2) * TILE - player.x;
        const dy = (b.row + b.h) * TILE - player.y;
        if (Math.hypot(dx, dy) < 120) {
          anyNear = true;
          if (worldState.near?.id !== b.id) {
            setNear({ id: b.id, action: "ENTER", label: b.name });
          }
          break;
        }
      }
    }

    if (!anyNear && worldState.near) setNear(null);

    if (input.justPressed(...KEY.interact) && worldState.near) {
      bus.emitOpen(worldState.near.id);
    }

    // sheep wander
    for (const s of sheep) {
      s.timer -= dt;
      s.anim += dt;
      if (s.state === "idle") {
        s.sprite.texture = sheepIdleFrames[Math.floor(s.anim * 5) % sheepIdleFrames.length];
        if (s.timer <= 0) {
          const spot = pickSpot(s.region, () => Math.random());
          if (spot) {
            s.tx = spot.x;
            s.ty = spot.y;
            s.state = "move";
            s.timer = 2 + Math.random() * 4;
          } else s.timer = 1;
        }
      } else {
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4 || s.timer <= 0) {
          s.state = "idle";
          s.timer = 1.5 + Math.random() * 3;
        } else {
          const step = 26 * dt;
          const nx = s.x + (dx / dist) * step;
          const ny = s.y + (dy / dist) * step;
          if (canWalk(nx, ny)) {
            s.x = nx;
            s.y = ny;
            if (dx < -0.5) s.facing = -1;
            else if (dx > 0.5) s.facing = 1;
          } else {
            s.state = "idle";
            s.timer = 1;
          }
          s.sprite.texture = sheepMoveFrames[Math.floor(s.anim * 6) % sheepMoveFrames.length];
        }
      }
      s.sprite.x = Math.round(s.x);
      s.sprite.y = Math.round(s.y);
      s.sprite.scale.x = s.baseScale * s.facing;
      s.sprite.zIndex = s.y;
      s.shadow.x = s.sprite.x;
      s.shadow.y = s.sprite.y;
      s.shadow.zIndex = s.y - 0.5;
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

      // Pick a new wander target
      if (bf.wanderTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        bf.tx = bf.x + Math.cos(angle) * dist;
        bf.ty = bf.y + Math.sin(angle) * dist;
        // Clamp target inside world bounds with a margin
        bf.tx = Math.max(TILE * 2, Math.min(WORLD_W - TILE * 2, bf.tx));
        bf.ty = Math.max(TILE * 6, Math.min(WORLD_H - TILE * 2, bf.ty));
        bf.wanderTimer = 1.5 + Math.random() * 3;
      }

      // Smoothly glide toward target
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

      // Wing flap — scale X sinusoidally to simulate wing beat
      const flapAmt = Math.abs(Math.sin(bf.flapPhase)); // 0..1
      const facing = bf.vx < -0.5 ? -1 : 1;

      bf.g.clear();
      // Squish wings horizontally based on flap
      const wx = bf.size * 1.4 * (0.15 + flapAmt * 0.85);
      const wy = bf.size * 0.6 + flapAmt * bf.size * 0.3;
      bf.g.moveTo(0, 0).lineTo(-wx * facing, -wy).lineTo(-bf.size * 0.3 * facing, bf.size * 0.5).fill({ color: bf.baseColor, alpha: 0.82 });
      bf.g.moveTo(0, 0).lineTo(wx * facing, -wy).lineTo(bf.size * 0.3 * facing, bf.size * 0.5).fill({ color: bf.baseColor, alpha: 0.82 });
      bf.g.circle(0, 0, 1.5).fill({ color: 0x220022, alpha: 0.7 });

      bf.g.x = Math.round(bf.x);
      bf.g.y = Math.round(bf.y) + Math.sin(elapsed * 1.2 + bf.flapPhase * 0.1) * 3; // gentle vertical drift
    }

    // birds
    for (const b of birds) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      
      // Wrap around world
      if (b.x > WORLD_W + 100) b.x = -100;
      if (b.y < -100) b.y = WORLD_H + 100;

      b.flapPhase += b.flapSpeed * dt;
      const flapAmt = Math.sin(b.flapPhase);
      
      b.g.clear();
      b.g.moveTo(0, 0)
         .lineTo(-4, -3 + flapAmt * 3)
         .moveTo(0, 0)
         .lineTo(4, -3 + flapAmt * 3)
         .stroke({ color: 0x111122, width: 1.5, join: "round", cap: "round" });
         
      b.g.x = b.x;
      b.g.y = b.y + Math.sin(elapsed * 2) * 4;
      b.g.scale.set(b.baseScale);
    }

    // leaves
    for (const l of leaves) {
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      
      // Sway side to side
      l.swayPhase += l.swaySpeed * dt;
      const sway = Math.sin(l.swayPhase) * 20;

      // Wrap around world
      if (l.y > WORLD_H + 20) {
        l.y = -20;
        l.x = Math.random() * WORLD_W; // new random X when respawning at top
      }
      if (l.x < -20) l.x = WORLD_W + 20;
      
      l.g.x = l.x + sway;
      l.g.y = l.y;
      l.g.rotation += dt * 2;
    }

    // waterfall
    if (waterfallStreaks) {
      for (const st of waterfallStreaks.streaks) {
        st.y += st.speed * dt;
        if (st.y > waterfallStreaks.y1) st.y = waterfallStreaks.y0 - st.len;
        st.g.y = st.y;
      }
    }

    // environment frame animation
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

  applyCamera();
  return { container: scene, update };
}

// Scene-scoped mutable collections (module-level type aliases only).
type Sheep = {
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
type Bird = {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  flapPhase: number;
  flapSpeed: number;
  baseScale: number;
};
type Leaf = {
  g: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
};
