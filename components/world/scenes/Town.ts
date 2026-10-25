import { Application, Container, Graphics, Rectangle, Sprite, Texture, Text, TextStyle } from "pixi.js";
import { buildTilemap, TILEMAP_URLS } from "@/components/world/Tilemap";
import { createPlayer, PLAYER_URLS } from "@/components/world/Player";
import { getTex, mulberry32, preloadAll, sliceFrames, TILE } from "@/components/world/tiles";
import { SPRITE_TRIM } from "@/components/world/spriteTrim";
import { BUILDING_MASK } from "@/components/world/buildingCollision";
import * as props from "@/components/world/props";
import { input, KEY } from "@/components/world/input";
import { setNear, worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";
import { track } from "@/lib/analytics/track";
import { sampleDayNight, lerpColor } from "@/lib/world/dayNight";
import { getVisited } from "@/lib/world/achievements";
import { buildInterior, hasInterior, INTERIOR_URLS, type Room } from "@/components/world/scenes/Interior";
import {
  BARD,
  BUILDINGS,
  CAVE,
  CHRONICLE_SPOT,
  COLS,
  DECOR_HOUSES,
  doorPos,
  levelOf,
  ORC_CHIEF_SPOT,
  POND,
  RAVEN_SPOT,
  RECRUITER_SIGNPOST_SPOT,
  ROADS,
  ROWS,
  SPAWN,
  SQUARE,
  TERMINAL_SPOT,
  TROPHY_SPOT,
  WATERFALL,
  WORLD_H,
  WORLD_W,
  type Level,
} from "@/components/world/world.config";

export type SceneController = {
  container: Container;
  update: (dtSeconds: number) => void;
  /** Releases anything that outlives the Pixi Application itself (e.g. bus subscriptions). */
  dispose?: () => void;
};

/** Real-world seconds for one full in-game day when the cycle is running. */
const DAY_CYCLE_SECONDS = 480;

/** Tiny Swords unit frames are drawn at the player's scale, so everyone reads as one cast. */
const UNIT_SCALE = 88 / 192;

const TREE_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/trees/Tree${n}.png`);
const BUSH_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/bushes/Bushe${n}.png`);
const ROCK_URLS = [1, 2, 3, 4].map((n) => `/pixel/terrain/Rock${n}.png`);
const STUMP_URLS = [1, 2, 3, 4].map((n) => `/pixel/deco/stump_${n}.png`);
const WATER_ROCK_URLS = [1, 2, 3, 4].map((n) => `/pixel/deco/water_rock_${n}.png`);
const GOLD_STONE_URLS = [1, 2, 3, 4, 5, 6].map((n) => `/pixel/deco/gold_stone_${n}.png`);

const U = "/pixel/units";
/** Every single-file texture Town.ts loads on its own (outside the batch lists above). */
const TOWN_SINGLE_URLS = [
  "/pixel/terrain/water_foam.png",
  "/pixel/fx/water_splash.png",
  "/pixel/fx/fire_01.png",
  "/pixel/deco/sheep_idle.png",
  "/pixel/deco/sheep_move.png",
  "/pixel/deco/sheep_grass.png",
  "/pixel/deco/duck.png",
  "/pixel/deco/bard.png",
  "/pixel/knight/Raven_Idle.png",
  "/pixel/props/terminal_computer.png",
  "/pixel/props/gold_trophy.png",
  "/pixel/terrain/cave_mouth.webp",
  "/pixel/fx/waterfall_flow.png",
  "/pixel/props/sign_trail.png",
  "/pixel/props/sign_chronicle.png",
  "/pixel/deco/wood_pile.png",
  "/pixel/deco/gold_pile.png",
  `${U}/black_warrior_idle.png`,
  `${U}/black_warrior_run.png`,
  `${U}/black_lancer_idle.png`,
  `${U}/black_lancer_run.png`,
  `${U}/blue_lancer_idle.png`,
  `${U}/blue_archer_idle.png`,
  `${U}/monk_idle.png`,
  `${U}/monk_run.png`,
  `${U}/pawn_blue_idle.png`,
  `${U}/pawn_blue_run.png`,
  `${U}/pawn_yellow_idle.png`,
  `${U}/pawn_yellow_run.png`,
  `${U}/pawn_red_idle.png`,
  `${U}/pawn_red_run.png`,
  `${U}/pawn_purple_idle.png`,
  `${U}/pawn_purple_run.png`,
  `${U}/pawn_axe.png`,
  `${U}/pawn_pickaxe.png`,
  `${U}/pawn_hammer.png`,
  `${U}/pawn_gold_idle.png`,
  `${U}/pawn_gold_run.png`,
];

type Animated = { sprite: Sprite; frames: Texture[]; fps: number; phase: number };
type Pose = { ax: number; ay: number; wf: number; hf: number };
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
  level: Level;
  idleFrames: Texture[];
  moveFrames: Texture[];
  idleFps: number;
  moveFps: number;
  speed: number;
  /** Display size of one (square) animation frame, in world px. */
  frameDisplay: number;
  idleTrim: Pose;
  moveTrim: Pose;
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
/** Hand-drawn (no sprite asset) — a soft glowing dot that only shows once night falls. */
type Firefly = {
  g: Graphics;
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  glowPhase: number;
  glowSpeed: number;
  wanderTimer: number;
};

const trimOf = (url: string) => SPRITE_TRIM[url] ?? { ax: 0.5, ay: 1, wf: 1 };
const poseOf = (url: string): Pose => {
  const t = trimOf(url);
  return { ax: t.ax, ay: t.ay, wf: t.wf, hf: t.hf ?? 1 };
};
/** Colour variants share their blue original's collision mask. */
const maskOf = (sprite: string) =>
  BUILDING_MASK[sprite] ?? BUILDING_MASK[`/pixel/buildings/${sprite.split("/").pop()}`];

export async function buildTownScene(
  app: Application,
  onProgress?: (fraction: number) => void,
): Promise<SceneController> {
  const scene = new Container();
  const world = new Container();
  scene.addChild(world);

  const DEBUG_COLLISION =
    typeof window !== "undefined" && window.location.search.includes("debug");
  // ?overview fits the whole world on screen without the collision tint (for screenshots).
  const OVERVIEW =
    DEBUG_COLLISION || (typeof window !== "undefined" && window.location.search.includes("overview"));

  // ── Preload every texture the scene needs as ONE batch, so onProgress
  // reports real aggregate load progress instead of a fake sweep. Everything
  // below reads from the cache via getTex() — no more awaiting individual loads.
  const buildingUrls = [...new Set([...BUILDINGS.map((b) => b.sprite), ...DECOR_HOUSES.map((h) => h.sprite)])];
  await preloadAll(
    [
      ...TILEMAP_URLS, ...PLAYER_URLS, ...TREE_URLS, ...BUSH_URLS, ...ROCK_URLS, ...STUMP_URLS,
      ...WATER_ROCK_URLS, ...GOLD_STONE_URLS, ...TOWN_SINGLE_URLS, ...INTERIOR_URLS, ...buildingUrls,
    ],
    onProgress,
  );
  const tex = (url: string) => getTex(url);

  // ── Ground + collision ─────────────────────────────────────────────────────
  const tilemap = await buildTilemap();
  world.addChild(tilemap.container);
  const inside = (c: number, r: number) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const codeAt = (c: number, r: number) => (inside(c, r) ? tilemap.grid[r][c] : "water");

  // Buildings block only the tiles where their sprite is actually opaque (a
  // per-tile alpha mask), so transparent gaps — tower tops, spire gaps, eaves —
  // stay walkable and there are no invisible walls. Sprites are content-bottom
  // aligned to their footprint, so frame tile (fr,fc) maps to world tile
  // (row+fr, col+fc).
  const blockBuilding = (b: { sprite: string; col: number; row: number; w: number; h: number }) => {
    const mask = maskOf(b.sprite);
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
  const labelLayer = new Container();

  const animated: Animated[] = [];
  const critters: Critter[] = [];
  const ducks: Duck[] = [];
  const butterflies: Butterfly[] = [];
  const fireflies: Firefly[] = [];
  /** Additive bloom halos behind each torch — alpha driven by the night tint. */
  const torchGlows: { g: Graphics; phase: number }[] = [];
  /** Reflected-light glints on open water; geometry static, alpha/x animated. */
  const shimmers: { g: Graphics; baseX: number; phase: number; speed: number }[] = [];

  // ── Frames ─────────────────────────────────────────────────────────────────
  const strip = (url: string, fw: number, fh = fw) => sliceFrames(tex(url), fw, fh);
  const foamFrames = strip("/pixel/terrain/water_foam.png", 192);
  const splashFrames = strip("/pixel/fx/water_splash.png", 192);
  // Each 256px frame is mostly empty canvas around a ~60px stream; crop to the stream.
  const waterfallFlowFrames = strip("/pixel/fx/waterfall_flow.png", 256, 512).map(
    (f) => new Texture({ source: f.source, frame: new Rectangle(f.frame.x + 104, 0, 64, 512) }),
  );
  const fireFrames = strip("/pixel/fx/fire_01.png", 64);
  const sheepGrassFrames = strip("/pixel/deco/sheep_grass.png", 128);
  const duckFrames = strip("/pixel/deco/duck.png", 32);
  const bardFrames = strip("/pixel/deco/bard.png", 32);
  const ravenFrames = strip("/pixel/knight/Raven_Idle.png", 192);
  const terminalFrames = strip("/pixel/props/terminal_computer.png", 32);
  const goldTrophyTex = tex("/pixel/props/gold_trophy.png");
  const caveTex = tex("/pixel/terrain/cave_mouth.webp");
  // trees/bushes/water-rocks are strips — keep first pose, indexed to their url
  const treeFrames = TREE_URLS.map((u) => sliceFrames(tex(u), 192, tex(u).height)[0]);
  const bushFrames = BUSH_URLS.map((u) => sliceFrames(tex(u), 128, 128)[0]);
  const rockTexes = ROCK_URLS.map(tex);
  const stumpTexes = STUMP_URLS.map(tex);
  const waterRockFrames = WATER_ROCK_URLS.map((u) => sliceFrames(tex(u), 64, 64)[0]);
  const goldStoneTexes = GOLD_STONE_URLS.map(tex);
  const unit = (name: string, fw = 192) => strip(`${U}/${name}.png`, fw);

  // ── Depth-sorted placement using real content bounds ───────────────────────
  const placeEntity = (
    t: Texture,
    url: string,
    feetX: number,
    feetY: number,
    displayH: number,
    shadow = true,
  ): Sprite => {
    const trim = trimOf(url);
    const s = new Sprite(t);
    s.anchor.set(trim.ax, trim.ay);
    s.height = displayH;
    s.width = displayH * (t.width / t.height);
    s.x = feetX;
    s.y = feetY;
    s.zIndex = feetY;
    if (shadow) {
      const cw = s.width * trim.wf;
      const sh = new Graphics()
        .ellipse(feetX, feetY, cw * 0.5, cw * 0.17)
        .fill({ color: 0x000000, alpha: 0.2 });
      sh.zIndex = feetY - 0.5;
      entities.addChild(sh);
    }
    entities.addChild(s);
    return s;
  };

  /** A Tiny Swords unit that stays put and loops one animation (workers, guards). */
  const placeUnit = (frames: Texture[], url: string, feetX: number, feetY: number, fps: number, flip = false, scale = 1) => {
    const p = poseOf(url);
    const size = frames[0].width * UNIT_SCALE * scale;
    const s = new Sprite(frames[0]);
    s.anchor.set(p.ax, p.ay);
    s.width = size;
    s.height = size;
    if (flip) s.scale.x *= -1;
    s.x = feetX;
    s.y = feetY;
    s.zIndex = feetY;
    entities.addChild(s);
    const sh = new Graphics()
      .ellipse(feetX, feetY, size * p.wf * 0.42, size * p.wf * 0.14)
      .fill({ color: 0, alpha: 0.22 });
    sh.zIndex = feetY - 0.5;
    entities.addChild(sh);
    animated.push({ sprite: s, frames, fps, phase: Math.random() * 3 });
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

    const s = new Sprite(tex(b.sprite));
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

  // ── Labels: drawn in their own top layer (after the night tint) so trees,
  // roofs and darkness never hide them. ─────────────────────────────────────
  const labelStyle = new TextStyle({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 7,
    fill: "#f0c050",
    align: "center",
    stroke: { color: "#000000", width: 3, join: "round" },
  });

  const BUILDING_DESC: Record<string, string> = {
    sanctum:     "ABOUT",
    chronicles:  "EXPERIENCE",
    relics:      "PROJECTS",
    armory:      "SKILLS",
    testimonies: "TESTIMONIALS",
    contact:     "CONTACT",
  };

  /** A dark signboard: the section in big gold letters, the building's name under it. */
  const makePlate = (title: string, subtitle: string) => {
    const plate = new Container();
    const t1 = new Text({ text: title, style: new TextStyle({ fontFamily: "'Press Start 2P', monospace", fontSize: 10, fill: "#f6c75a" }) });
    const t2 = new Text({ text: subtitle, style: new TextStyle({ fontFamily: "'Press Start 2P', monospace", fontSize: 6, fill: "#d9b98a" }) });
    t1.anchor.set(0.5, 0);
    t2.anchor.set(0.5, 0);
    const padX = 9;
    const w = Math.max(t1.width, t2.width) + padX * 2;
    const h = t1.height + t2.height + 15;
    t1.y = -h + 6;
    t2.y = t1.y + t1.height + 4;
    const bg = new Graphics()
      .roundRect(-w / 2 - 2, -h - 2, w + 4, h + 4, 5).fill({ color: 0x000000, alpha: 0.9 })
      .roundRect(-w / 2, -h, w, h, 4).fill({ color: 0x1a130b, alpha: 0.94 })
      .roundRect(-w / 2, -h, w, h, 4).stroke({ width: 1.5, color: 0xc8861e, alpha: 0.95 })
      // a little pointer under the board, aimed at the door below
      .poly([-5, 0, 5, 0, 0, 6]).fill({ color: 0xc8861e });
    plate.addChild(bg, t1, t2);
    return plate;
  };

  const plates = new Map<string, Container>();
  for (const b of BUILDINGS) {
    const door = doorPos(b);
    // Hung right over the doorway (its pointer touches the door), so the sign is
    // always on screen when you're anywhere near the building.
    const plate = makePlate(BUILDING_DESC[b.id] ?? b.name.toUpperCase(), b.name.toUpperCase());
    plate.x = door.x;
    plate.y = door.y - TILE * 0.95;
    labelLayer.addChild(plate);
    plates.set(b.id, plate);
  }

  /** A torch on a post, with an additive bloom that only lights up after dusk. */
  const placeTorch = (x: number, y: number, z = y) => {
    const torch = new Sprite(fireFrames[0]);
    torch.anchor.set(0.5, 1);
    torch.height = TILE * 0.85;
    torch.width = TILE * 0.85;
    torch.x = x;
    torch.y = y;
    torch.zIndex = z + 1;
    entities.addChild(torch);
    animated.push({ sprite: torch, frames: fireFrames, fps: 12, phase: Math.random() * 3 });

    // Drawn once here (static geometry); the per-frame update just scales
    // alpha with the night tint and a flicker, so there's no re-tessellation.
    const glow = new Graphics();
    for (const [r, a] of [[46, 0.05], [30, 0.07], [18, 0.1]] as const) {
      glow.circle(0, 0, r).fill({ color: 0xff9a3c, alpha: a });
    }
    glow.x = x;
    glow.y = y - TILE * 0.5;
    glow.blendMode = "add";
    glow.zIndex = z + 0.9;
    glow.alpha = 0;
    entities.addChild(glow);
    torchGlows.push({ g: glow, phase: Math.random() * Math.PI * 2 });
  };

  // ── Market square dressing: a well, stalls, lamps and stacked goods ───────
  {
    /** Places a prop with its feet at tile coords (x, y) and blocks the tiles it stands on. */
    const prop = (g: Graphics, x: number, y: number, blockW = 1, blockH = 1) => {
      g.x = x * TILE;
      g.y = y * TILE;
      g.zIndex = g.y;
      entities.addChild(g);
      tilemap.blockRect(Math.floor(x - blockW / 2 + 0.01), Math.floor(y - 0.01) - (blockH - 1), blockW, blockH);
    };
    const sq = { cx: SQUARE.col + SQUARE.w / 2, top: SQUARE.row, bot: SQUARE.row + SQUARE.h };
    prop(props.well(), sq.cx, sq.top + 1.3);
    prop(props.stall(new Graphics(), 0xb5473a, "fruit"), SQUARE.col - 1.8, sq.top + 3.6, 2);
    prop(props.stall(new Graphics(), 0x3b6fb6, "bread"), SQUARE.col + SQUARE.w + 1.8, sq.top + 3.6, 2);
    prop(props.crate(), SQUARE.col - 3.3, sq.top + 3.7);
    prop(props.barrel(), SQUARE.col - 0.4, sq.top + 3.9);
    prop(props.crate(new Graphics(), 26, 22), SQUARE.col + SQUARE.w + 3.3, sq.top + 3.7);
    prop(props.barrel(), SQUARE.col + SQUARE.w + 0.4, sq.top + 3.9);
    for (const [x, y] of [[SQUARE.col + 0.6, sq.top + 0.9], [SQUARE.col + SQUARE.w - 0.6, sq.top + 0.9], [SQUARE.col + 1.4, sq.bot - 0.2], [SQUARE.col + SQUARE.w - 1.4, sq.bot - 0.2]]) {
      prop(props.lampPost(), x, y);
      placeTorch(x * TILE, y * TILE + props.LAMP_TOP + 8, y * TILE);
    }
    // goods stacked by the homes and the forge
    for (const h of DECOR_HOUSES.slice(0, 4)) prop(props.barrel(), h.col - 0.4, h.row + h.h - 0.1);
  }

  // ── Cave: a rock mound set into the east plateau's cliff face ──────────────
  const caveMouth = { x: 0, y: 0 };
  {
    const t = trimOf("/pixel/terrain/cave_mouth.webp");
    const cx = (CAVE.col + CAVE.w / 2) * TILE;
    const displayW = CAVE.w * TILE * 1.4;
    const displayH = displayW * (caveTex.height / caveTex.width);
    const feetY = (CAVE.row + 1) * TILE + TILE * 0.55;
    const s = new Sprite(caveTex);
    s.anchor.set(t.ax, t.ay);
    s.width = displayW;
    s.height = displayH;
    s.x = cx;
    s.y = feetY;
    s.zIndex = feetY;
    entities.addChild(s);
    caveMouth.x = cx;
    caveMouth.y = feetY - displayH * 0.15; // roughly the entrance, not the mound's outer edge
    for (const dx of [-displayW * 0.42, displayW * 0.42]) placeTorch(cx + dx, feetY - displayH * 0.08, feetY);
  }

  // ── Waterfall: water pouring off the plateau's cliff into the pond ─────────
  {
    const fallsTopY = (WATERFALL.cliffRow - 0.45) * TILE;
    const fallsBottomY = (WATERFALL.cliffRow + 1.25) * TILE;
    const rng = mulberry32(4040);
    for (let i = 0; i < WATERFALL.w; i++) {
      const x = (WATERFALL.col + i + 0.5) * TILE;
      const cascade = new Sprite(waterfallFlowFrames[0]);
      cascade.anchor.set(0.5, 0);
      cascade.x = x;
      cascade.y = fallsTopY;
      cascade.width = TILE * (1.4 + rng() * 0.1);
      cascade.height = fallsBottomY - fallsTopY;
      cascade.zIndex = fallsBottomY;
      entities.addChild(cascade);
      animated.push({ sprite: cascade, frames: waterfallFlowFrames, fps: 7 + rng() * 3, phase: rng() * 4 });

      const sp = new Sprite(splashFrames[0]);
      sp.anchor.set(0.5, 0.5);
      sp.width = TILE * 1.3;
      sp.height = TILE * 1.3;
      sp.x = x;
      sp.y = fallsBottomY;
      waterFX.addChild(sp);
      animated.push({ sprite: sp, frames: splashFrames, fps: 10, phase: rng() * 2 });
    }
  }

  // ── Pond: water rocks + duck ────────────────────────────────────────────────
  {
    const rr = mulberry32(909);
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(rr() * WATER_ROCK_URLS.length);
      const tx = waterRockFrames[idx];
      const t = trimOf(WATER_ROCK_URLS[idx]);
      const s = new Sprite(tx);
      s.anchor.set(t.ax, t.ay);
      const hgt = TILE * (0.5 + rr() * 0.4);
      s.height = hgt;
      s.width = hgt * (tx.width / tx.height);
      s.x = (POND.col + rr() * POND.w) * TILE;
      s.y = (POND.row + 0.5 + rr() * POND.h) * TILE;
      waterFX.addChild(s);
    }

    const duck = new Sprite(duckFrames[0]);
    duck.anchor.set(0.5, 0.8);
    duck.height = TILE * 0.5;
    duck.width = duck.height * (duckFrames[0].width / duckFrames[0].height);
    const duckBaseX = (POND.col + POND.w * 0.6) * TILE;
    const duckBaseY = (POND.row + POND.h * 0.6) * TILE;
    duck.x = duckBaseX;
    duck.y = duckBaseY;
    waterFX.addChild(duck);
    animated.push({ sprite: duck, frames: duckFrames, fps: 4, phase: 0 });
    ducks.push({ sprite: duck, baseX: duckBaseX, baseY: duckBaseY, phase: Math.random() * 6 });
  }

  // ── Foam: Tiny Swords' animated surf, centred under every shoreline tile ────
  for (const { col, row } of tilemap.shoreCells) {
    const foam = new Sprite(foamFrames[0]);
    foam.anchor.set(0.5, 0.5);
    foam.width = TILE * 3;
    foam.height = TILE * 3;
    foam.x = (col + 0.5) * TILE;
    foam.y = (row + 0.5) * TILE;
    tilemap.foamLayer.addChild(foam);
    animated.push({ sprite: foam, frames: foamFrames, fps: 8, phase: ((col * 7 + row * 3) % 16) / 8 });
  }

  const isWater = (c: number, r: number) => codeAt(c, r) === "water";

  // ── Rocks out at sea, near the coasts ──────────────────────────────────────
  {
    const rr = mulberry32(6060);
    let placed = 0;
    for (let guard = 0; guard < 600 && placed < 14; guard++) {
      const c = Math.floor(rr() * COLS);
      const r = Math.floor(rr() * ROWS);
      if (!isWater(c, r) || !isWater(c - 1, r) || !isWater(c + 1, r) || !isWater(c, r - 1) || !isWater(c, r + 1)) continue;
      const nearLand = [[-2, 0], [2, 0], [0, -2], [0, 2]].some(([dx, dy]) => !isWater(c + dx, r + dy));
      if (!nearLand || (c >= 11 && c <= 15 && r >= 13 && r <= 16)) continue;
      const idx = Math.floor(rr() * WATER_ROCK_URLS.length);
      const t = trimOf(WATER_ROCK_URLS[idx]);
      const s = new Sprite(waterRockFrames[idx]);
      s.anchor.set(t.ax, t.ay);
      s.height = TILE * (0.55 + rr() * 0.35);
      s.width = s.height;
      s.x = (c + 0.5) * TILE;
      s.y = (r + 0.7) * TILE;
      waterFX.addChild(s);
      placed++;
    }
  }

  // ── Water shimmer — glints of reflected light on open water ────────────────
  // Geometry is drawn once and only alpha/x are animated, so this costs no
  // re-tessellation per frame (unlike the fireflies' clear()+redraw).
  {
    const shRng = mulberry32(5150);
    const shimmerLayer = new Container();
    shimmerLayer.blendMode = "add";
    waterFX.addChild(shimmerLayer);
    const open: { c: number; r: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // open water only — glints on the shoreline fight with the foam
        if ([[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]].every(([dx, dy]) => isWater(c + dx, r + dy))) {
          open.push({ c, r });
        }
      }
    }
    for (let i = 0; i < Math.min(70, open.length); i++) {
      const spot = open[Math.floor(shRng() * open.length)];
      const w = 7 + shRng() * 13;
      const g = new Graphics().roundRect(-w / 2, -1, w, 2, 1).fill({ color: 0xdff2ff, alpha: 0.5 });
      g.x = (spot.c + 0.2 + shRng() * 0.6) * TILE;
      g.y = (spot.r + 0.2 + shRng() * 0.6) * TILE;
      g.alpha = 0;
      shimmerLayer.addChild(g);
      shimmers.push({ g, baseX: g.x, phase: shRng() * Math.PI * 2, speed: 0.7 + shRng() * 1.1 });
    }
  }

  // ── Keep-clear zones: roads, the square, doors and landmarks stay readable ──
  const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  /** True if the tile-space point (x,y) is on or right next to a road or the square. */
  const nearRoad = (x: number, y: number, pad = 0.6) =>
    (x > SQUARE.col - pad && x < SQUARE.col + SQUARE.w + pad && y > SQUARE.row - pad && y < SQUARE.row + SQUARE.h + pad) ||
    ROADS.some((road) =>
      road.points.slice(1).some(([bx, by], i) => {
        const [ax, ay] = road.points[i];
        return distToSegment(x, y, ax, ay, bx, by) < road.width / 2 + pad;
      }),
    );
  const landmarks: { col: number; row: number }[] = [
    SPAWN, BARD, RAVEN_SPOT, TERMINAL_SPOT, CHRONICLE_SPOT, RECRUITER_SIGNPOST_SPOT, ORC_CHIEF_SPOT, TROPHY_SPOT,
    ...BUILDINGS.map((b) => ({ col: b.col + b.w / 2 - 0.5, row: b.row + b.h })),
  ];
  const nearLandmark = (x: number, y: number, pad: number) =>
    landmarks.some((l) => Math.abs(x - (l.col + 0.5)) < pad && Math.abs(y - (l.row + 0.5)) < pad);
  const inFootprint = (x: number, y: number) =>
    [...BUILDINGS, ...DECOR_HOUSES].some((b) => x > b.col - 0.3 && x < b.col + b.w + 0.3 && y > b.row && y < b.row + b.h + 0.6);
  const nearCave = (x: number, y: number) => x > CAVE.col - 1.5 && x < CAVE.col + CAVE.w + 1.5 && y > CAVE.row - 1 && y < CAVE.row + 3;
  const nearFalls = (x: number, y: number) => x > WATERFALL.col - 1 && x < WATERFALL.col + WATERFALL.w + 1 && y > 4 && y < 8;

  /** Free spot for scenery: solid land (ground or plateau top), clear of everything readable. */
  const freeForDecor = (x: number, y: number, pad = 0.6) => {
    const c = Math.floor(x);
    const r = Math.floor(y);
    const code = codeAt(c, r);
    if (code !== "ground" && code !== "high") return false;
    if (tilemap.blocked[r][c]) return false;
    // Stay a tile off the shore and the cliff edges so trunks never hang over them.
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
      const n = codeAt(c + dx, r + dy);
      if (n === "water" || n === "cliff" || n === "bridge") return false;
      if (n !== code && (n === "high" || n === "ground")) return false;
    }
    return !nearRoad(x, y, pad) && !nearLandmark(x, y, 2) && !inFootprint(x, y) && !nearCave(x, y) && !nearFalls(x, y);
  };

  // ── Forests: trees grow in clumps with bushes on their fringe ──────────────
  {
    const CLUMPS: { x: number; y: number; r: number; trees: number; bushes: number; seed: number }[] = [
      // the wilds — plateau woods
      { x: 8, y: 3.2, r: 3.5, trees: 12, bushes: 4, seed: 11 },
      { x: 15, y: 3.4, r: 2.3, trees: 6, bushes: 2, seed: 12 },
      { x: 22, y: 2.9, r: 2.2, trees: 5, bushes: 2, seed: 13 },
      { x: 35.5, y: 3.6, r: 3.5, trees: 11, bushes: 3, seed: 14 },
      { x: 41, y: 4.5, r: 1.6, trees: 3, bushes: 2, seed: 15 },
      // the wilds — lowland
      { x: 3, y: 10.5, r: 2, trees: 4, bushes: 2, seed: 16 },
      { x: 8, y: 12.4, r: 2, trees: 4, bushes: 2, seed: 17 },
      { x: 42.3, y: 11.6, r: 1.5, trees: 4, bushes: 2, seed: 18 },
      { x: 32, y: 12.2, r: 1.8, trees: 3, bushes: 2, seed: 19 },
      { x: 14.3, y: 7.4, r: 1.3, trees: 2, bushes: 2, seed: 20 },
      // the town's edges
      { x: 3.5, y: 22.2, r: 1.8, trees: 4, bushes: 3, seed: 21 },
      { x: 7, y: 17.3, r: 1.8, trees: 3, bushes: 2, seed: 22 },
      { x: 41.5, y: 21.6, r: 1.6, trees: 3, bushes: 2, seed: 23 },
      { x: 36, y: 17.2, r: 1.6, trees: 3, bushes: 2, seed: 24 },
      { x: 40, y: 30.5, r: 2, trees: 5, bushes: 3, seed: 25 },
      { x: 9.5, y: 32.3, r: 1.5, trees: 3, bushes: 2, seed: 26 },
      { x: 26.5, y: 32.3, r: 1.8, trees: 3, bushes: 2, seed: 27 },
      { x: 18, y: 32.4, r: 1.3, trees: 2, bushes: 2, seed: 28 },
      // hedges beside the homes
      ...DECOR_HOUSES.map((h, i) => ({ x: h.col + h.w + 0.6, y: h.row + h.h - 0.2, r: 1.2, trees: 0, bushes: 2, seed: 40 + i })),
    ];
    for (const k of CLUMPS) {
      const rng = mulberry32(k.seed * 7919);
      const scatterIn = (count: number, place: (x: number, y: number) => void) => {
        let n = 0;
        for (let guard = 0; guard < count * 40 && n < count; guard++) {
          const a = rng() * Math.PI * 2;
          const d = Math.sqrt(rng()) * k.r;
          const x = k.x + Math.cos(a) * d;
          const y = k.y + Math.sin(a) * d * 0.8;
          if (!freeForDecor(x, y)) continue;
          place(x, y);
          n++;
        }
      };
      scatterIn(k.trees, (x, y) => {
        const idx = Math.floor(rng() * treeFrames.length);
        placeEntity(treeFrames[idx], TREE_URLS[idx], x * TILE, y * TILE, TILE * (2 + rng() * 0.6), true);
      });
      scatterIn(k.bushes, (x, y) => {
        const idx = Math.floor(rng() * bushFrames.length);
        placeEntity(bushFrames[idx], BUSH_URLS[idx], x * TILE, y * TILE, TILE * (0.9 + rng() * 0.3), true);
      });
    }

    // A few loose rocks and stumps in the open, so meadows aren't bare.
    const rng = mulberry32(4242);
    const sprinkle = (count: number, texes: Texture[], urls: string[], hMin: number, hMax: number) => {
      let n = 0;
      for (let guard = 0; guard < count * 60 && n < count; guard++) {
        const x = 2 + rng() * (COLS - 4);
        const y = 2 + rng() * (ROWS - 4);
        if (!freeForDecor(x, y, 0.8)) continue;
        const idx = Math.floor(rng() * texes.length);
        placeEntity(texes[idx], urls[idx], x * TILE, y * TILE, hMin + rng() * (hMax - hMin), true);
        n++;
      }
    };
    sprinkle(26, rockTexes, ROCK_URLS, TILE * 0.45, TILE * 0.75);
    sprinkle(10, stumpTexes, STUMP_URLS, TILE * 0.9, TILE * 1.1);
  }

  // ── Bard: a lute-strumming busker in the middle of the square ──────────────
  const bardPos = { x: 0, y: 0 };
  {
    const feetX = (BARD.col + 0.5) * TILE;
    const feetY = (BARD.row + 1) * TILE;
    const bardDisplayH = 46;
    const bard = placeEntity(bardFrames[0], "/pixel/deco/bard.png", feetX, feetY, bardDisplayH, true);
    animated.push({ sprite: bard, frames: bardFrames, fps: 10, phase: 0 });
    bardPos.x = feetX;
    bardPos.y = feetY;
    worldState.bardX = feetX;
    // Head-top world-Y (not feet), so the floating bubble anchors right above his head.
    worldState.bardY = feetY - bardDisplayH * trimOf("/pixel/deco/bard.png").ay;
    // Two torches frame the busker's spot, so the square glows at night.
    placeTorch(feetX - TILE * 1.6, feetY - 4);
    placeTorch(feetX + TILE * 1.6, feetY - 4);
  }

  // ── Raven: a hooded guide perched just off spawn ────────────────────────────
  const ravenPos = { x: 0, y: 0 };
  {
    const feetX = (RAVEN_SPOT.col + 0.5) * TILE;
    const feetY = (RAVEN_SPOT.row + 1) * TILE;
    const ravenDisplayH = 84;
    const raven = placeEntity(ravenFrames[0], "/pixel/knight/Raven_Idle.png", feetX, feetY, ravenDisplayH, true);
    animated.push({ sprite: raven, frames: ravenFrames, fps: 6, phase: Math.random() * 2 });
    ravenPos.x = feetX;
    ravenPos.y = feetY;
    worldState.ravenX = feetX;
    // Head-top world-Y (not feet), so the dialogue bubble anchors right above its head.
    worldState.ravenY = feetY - ravenDisplayH * trimOf("/pixel/knight/Raven_Idle.png").ay;
  }

  // ── Terminal: a fourth-wall-breaking retro computer on the square ──────────
  const terminalPos = { x: 0, y: 0 };
  {
    const feetX = (TERMINAL_SPOT.col + 0.5) * TILE;
    const feetY = (TERMINAL_SPOT.row + 1) * TILE;
    const displayH = 48;
    const term = placeEntity(terminalFrames[0], "/pixel/props/terminal_computer.png", feetX, feetY, displayH, true);
    animated.push({ sprite: term, frames: terminalFrames, fps: 5, phase: 0 });

    const label = new Text({ text: "THE TERMINAL", style: labelStyle });
    label.anchor.set(0.5, 1);
    label.x = feetX;
    label.y = feetY - displayH - 6;
    label.zIndex = 9000;
    labelLayer.addChild(label);

    terminalPos.x = feetX;
    terminalPos.y = feetY;
  }

  // ── Chronicle Board: a wooden notice board displaying live site stats ──────
  const chroniclePos = { x: 0, y: 0 };
  {
    const feetX = (CHRONICLE_SPOT.col + 0.5) * TILE;
    const feetY = (CHRONICLE_SPOT.row + 1) * TILE;
    const displayH = 58;
    placeEntity(tex("/pixel/props/sign_chronicle.png"), "/pixel/props/sign_chronicle.png", feetX, feetY, displayH, true);

    const label = new Text({ text: "TOWN CHRONICLE", style: labelStyle });
    label.anchor.set(0.5, 1);
    label.x = feetX;
    label.y = feetY - displayH - 6;
    label.zIndex = 9000;
    labelLayer.addChild(label);

    chroniclePos.x = feetX;
    chroniclePos.y = feetY;
  }

  // ── Recruiter Signpost: launches the guided auto-walk tour ──────────────────
  const signpostPos = { x: 0, y: 0 };
  {
    const feetX = (RECRUITER_SIGNPOST_SPOT.col + 0.5) * TILE;
    const feetY = (RECRUITER_SIGNPOST_SPOT.row + 1) * TILE;
    const displayH = 54;
    placeEntity(tex("/pixel/props/sign_trail.png"), "/pixel/props/sign_trail.png", feetX, feetY, displayH, true);

    const label = new Text({ text: "RECRUITER'S TRAIL", style: labelStyle });
    label.anchor.set(0.5, 1);
    label.x = feetX;
    label.y = feetY - displayH - 6;
    label.zIndex = 9000;
    labelLayer.addChild(label);

    signpostPos.x = feetX;
    signpostPos.y = feetY;
  }

  // ── Working folk: the village is busy, not just decorated ──────────────────
  {
    const at = (c: number, r: number) => [c * TILE, r * TILE] as const;
    // Lancer guards at the Sanctum and the Spire.
    const lancer = unit("blue_lancer_idle", 320);
    placeUnit(lancer, `${U}/blue_lancer_idle.png`, ...at(17.4, 21.75), 8);
    placeUnit(lancer, `${U}/blue_lancer_idle.png`, ...at(28.4, 21.75), 8, true);
    // An archer practising by the Armory's targets.
    placeUnit(unit("blue_archer_idle"), `${U}/blue_archer_idle.png`, ...at(12.6, 28.3), 8, true);
    // Woodcutter at the west plateau forest's edge, with his pile.
    placeUnit(unit("pawn_axe"), `${U}/pawn_axe.png`, ...at(10.6, 12.5), 10);
    placeEntity(stumpTexes[0], STUMP_URLS[0], 11.35 * TILE, 12.45 * TILE, TILE, true);
    placeEntity(tex("/pixel/deco/wood_pile.png"), "/pixel/deco/wood_pile.png", 9.6 * TILE, 12.8 * TILE, TILE * 0.9, true);
    // A builder hammering at a house on the west side of town.
    placeUnit(unit("pawn_hammer"), `${U}/pawn_hammer.png`, ...at(7.6, 26.4), 8, true);
    // The gold mine outside the cave: ore, miners and a cart-load waiting.
    const gold = [[31.2, 10.2, 4], [33.5, 11.3, 5], [39.5, 8.6, 3], [40.6, 10.2, 2], [30, 11.6, 1]] as const;
    for (const [x, y, i] of gold) placeEntity(goldStoneTexes[i], GOLD_STONE_URLS[i], x * TILE, y * TILE, TILE * 1.6, false);
    placeUnit(unit("pawn_pickaxe"), `${U}/pawn_pickaxe.png`, ...at(32.1, 10.5), 10, true);
    placeUnit(unit("pawn_pickaxe"), `${U}/pawn_pickaxe.png`, ...at(40.3, 8.9), 10, true);
    placeEntity(tex("/pixel/deco/gold_pile.png"), "/pixel/deco/gold_pile.png", 36.2 * TILE, 10.2 * TILE, TILE * 1.6, true);
    // Grazing sheep in the north meadow and the town's east green (frames drawn at the wanderers' 60px).
    const sheepScale = 70 / (128 * UNIT_SCALE);
    for (const [x, y, flip] of [[16, 12.4, false], [23.5, 11.8, true], [37.5, 31.2, false], [4, 27.4, true]] as const) {
      placeUnit(sheepGrassFrames, "/pixel/deco/sheep_grass.png", x * TILE, y * TILE, 6, flip, sheepScale);
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────
  const player = await createPlayer((SPAWN.col + 0.5) * TILE, (SPAWN.row + 0.9) * TILE);
  entities.addChild(player.container);
  const codeUnder = (x: number, y: number) => tilemap.codeAtPx(x, y - 8);
  let playerLevel: Level = levelOf(codeUnder(player.x, player.y)) ?? 0;
  let playerOnRamp = false;
  const canWalk = (x: number, y: number) => tilemap.canWalkAt(x, y, playerLevel, playerOnRamp);

  // ── Wandering critters (sheep, townsfolk, the knight's raiders) ────────────
  const pickSpot = (reg: { col: number; row: number; w: number; h: number }, level: Level, rng: () => number) => {
    for (let i = 0; i < 24; i++) {
      const x = (reg.col + rng() * reg.w) * TILE;
      const y = (reg.row + rng() * reg.h) * TILE;
      if (tilemap.canWalkAt(x, y, level, false) && levelOf(tilemap.codeAtPx(x, y)) === level) return { x, y };
    }
    return null;
  };

  const applyPose = (cr: Critter, trim: Pose, frame: Texture) => {
    cr.sprite.texture = frame;
    cr.sprite.anchor.set(trim.ax, trim.ay);
    cr.sprite.height = cr.frameDisplay;
    cr.sprite.width = cr.frameDisplay;
    cr.baseScale = cr.sprite.scale.x;
  };

  const spawnCritter = (
    idleUrl: string,
    moveUrl: string,
    frameW: number,
    reg: { col: number; row: number; w: number; h: number },
    count: number,
    opts: { frameDisplay: number; idleFps: number; moveFps: number; speed: number; level?: Level },
  ) => {
    const idleFrames = strip(idleUrl, frameW);
    const moveFrames = strip(moveUrl, frameW);
    const idleTrim = poseOf(idleUrl);
    const moveTrim = poseOf(moveUrl);
    const level = opts.level ?? 0;
    const rng = mulberry32(reg.col * 31 + reg.row * 17 + count * 7 + frameW);
    for (let i = 0; i < count; i++) {
      const spot = pickSpot(reg, level, rng);
      if (!spot) continue;
      const sprite = new Sprite(idleFrames[0]);
      sprite.x = spot.x;
      sprite.y = spot.y;
      entities.addChild(sprite);
      const shadowW = opts.frameDisplay * idleTrim.wf;
      const shadow = new Graphics()
        .ellipse(0, 0, shadowW * 0.45, shadowW * 0.15)
        .fill({ color: 0, alpha: 0.22 });
      entities.addChild(shadow);
      const cr: Critter = {
        sprite, shadow, x: spot.x, y: spot.y, tx: spot.x, ty: spot.y,
        state: "idle", timer: 1 + rng() * 3, facing: rng() < 0.5 ? -1 : 1, anim: rng() * 3,
        baseScale: 1, region: reg, level, idleFrames, moveFrames,
        idleFps: opts.idleFps, moveFps: opts.moveFps, speed: opts.speed,
        frameDisplay: opts.frameDisplay, idleTrim, moveTrim,
      };
      applyPose(cr, idleTrim, idleFrames[0]);
      critters.push(cr);
    }
  };

  const SHEEP = { frameDisplay: 70, idleFps: 5, moveFps: 6, speed: 26 };
  spawnCritter("/pixel/deco/sheep_idle.png", "/pixel/deco/sheep_move.png", 128, { col: 14, row: 10, w: 10, h: 3 }, 3, SHEEP);
  spawnCritter("/pixel/deco/sheep_idle.png", "/pixel/deco/sheep_move.png", 128, { col: 35, row: 29, w: 6, h: 3 }, 2, SHEEP);
  spawnCritter("/pixel/deco/sheep_idle.png", "/pixel/deco/sheep_move.png", 128, { col: 4, row: 2, w: 12, h: 3 }, 2, { ...SHEEP, level: 1 });

  // Townsfolk: Tiny Swords pawns carrying the day's goods around the square and streets.
  const FOLK = { frameDisplay: 192 * UNIT_SCALE, idleFps: 8, moveFps: 10, speed: 34 };
  const TOWN = { col: 8, row: 22, w: 30, h: 9 };
  spawnCritter(`${U}/pawn_blue_idle.png`, `${U}/pawn_blue_run.png`, 192, TOWN, 2, FOLK);
  spawnCritter(`${U}/pawn_yellow_idle.png`, `${U}/pawn_yellow_run.png`, 192, TOWN, 1, FOLK);
  spawnCritter(`${U}/pawn_red_idle.png`, `${U}/pawn_red_run.png`, 192, TOWN, 1, FOLK);
  spawnCritter(`${U}/pawn_purple_idle.png`, `${U}/pawn_purple_run.png`, 192, { col: 11, row: 16, w: 6, h: 5 }, 1, FOLK);
  spawnCritter(`${U}/pawn_gold_idle.png`, `${U}/pawn_gold_run.png`, 192, { col: 28, row: 8, w: 10, h: 4 }, 1, FOLK);
  // A monk keeps the Vault of Relics.
  spawnCritter(`${U}/monk_idle.png`, `${U}/monk_run.png`, 192, { col: 31, row: 23, w: 6, h: 2 }, 1, { ...FOLK, speed: 24 });

  // The Black Knight's raiders prowl the arena.
  spawnCritter(`${U}/black_warrior_idle.png`, `${U}/black_warrior_run.png`, 192, { col: 16, row: 8, w: 8, h: 4 }, 2, { ...FOLK, speed: 30 });
  spawnCritter(`${U}/black_lancer_idle.png`, `${U}/black_lancer_run.png`, 320, { col: 16, row: 8, w: 8, h: 4 }, 1, {
    ...FOLK, frameDisplay: 320 * UNIT_SCALE, speed: 28,
  });

  // ── The Black Knight: a stationary boss fight in the wilds' arena ──────────
  // Persisted in localStorage — once defeated, the fight never respawns and the
  // trophy shows permanently near spawn instead.
  // New key for the Black Knight: beating the old Orc Chief must not hide the new boss.
  const ORC_DEFEATED_KEY = "sigma_black_knight_defeated";
  const ATTACK_RANGE = 70;
  const placeTrophy = () => {
    const tx = (TROPHY_SPOT.col + 0.5) * TILE;
    const ty = (TROPHY_SPOT.row + 1) * TILE;
    // The source sprite's actual gold-nugget content is a small fraction of its
    // padded canvas (hf≈0.2) — displayH scales the WHOLE canvas, so it has to be
    // large for the visible content to actually read as a reward prop.
    placeEntity(goldTrophyTex, "/pixel/props/gold_trophy.png", tx, ty, TILE * 1.8, true);
  };

  // The arena: a ring of stones and two braziers.
  {
    const cx = (ORC_CHIEF_SPOT.col + 0.5) * TILE;
    const cy = (ORC_CHIEF_SPOT.row + 1) * TILE;
    const rng = mulberry32(777);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.sin(a) > 0.75) continue; // an opening on the south side, facing the bridge road
      const idx = Math.floor(rng() * rockTexes.length);
      placeEntity(rockTexes[idx], ROCK_URLS[idx], cx + Math.cos(a) * TILE * 3.3, cy + Math.sin(a) * TILE * 2.3, TILE * (0.8 + rng() * 0.35), true);
    }
    placeTorch(cx - TILE * 1.8, cy - TILE * 1.6);
    placeTorch(cx + TILE * 1.8, cy - TILE * 1.6);
  }

  let chief: {
    sprite: Sprite;
    shadow: Graphics;
    label: Text;
    pips: Graphics[];
    health: number;
    alive: boolean;
    dying: boolean;
    dyingTime: number;
    hitFlash: number;
    baseScale: number;
  } | null = null;

  if (localStorage.getItem(ORC_DEFEATED_KEY) === "1") {
    placeTrophy();
  } else {
    const url = `${U}/black_warrior_idle.png`;
    const frames = unit("black_warrior_idle");
    const feetX = (ORC_CHIEF_SPOT.col + 0.5) * TILE;
    const feetY = (ORC_CHIEF_SPOT.row + 1) * TILE;
    const p = poseOf(url);
    const frameDisplay = 192 * UNIT_SCALE * 1.45;

    const sprite = new Sprite(frames[0]);
    sprite.anchor.set(p.ax, p.ay);
    sprite.width = frameDisplay;
    sprite.height = frameDisplay;
    sprite.scale.x *= -1; // faces the bridge, where challengers arrive
    sprite.x = feetX;
    sprite.y = feetY;
    sprite.zIndex = feetY;
    entities.addChild(sprite);
    animated.push({ sprite, frames, fps: 8, phase: 0 });

    const shadowW = frameDisplay * p.wf;
    const shadow = new Graphics()
      .ellipse(feetX, feetY, shadowW * 0.45, shadowW * 0.15)
      .fill({ color: 0, alpha: 0.25 });
    shadow.zIndex = feetY - 0.5;
    entities.addChild(shadow);

    const headTopY = feetY - frameDisplay * p.hf;
    const label = new Text({ text: "THE BLACK KNIGHT", style: labelStyle });
    label.anchor.set(0.5, 1);
    label.x = feetX;
    label.y = headTopY - 14;
    label.zIndex = 9000;
    labelLayer.addChild(label);

    const pips: Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const pip = new Graphics().rect(0, 0, 8, 8).fill({ color: 0xd03030 });
      pip.x = feetX - 14 + i * 12;
      pip.y = headTopY - 10;
      pip.zIndex = 9000;
      labelLayer.addChild(pip);
      pips.push(pip);
    }

    chief = {
      sprite, shadow, label, pips, health: 3, alive: true, dying: false, dyingTime: 0, hitFlash: 0,
      baseScale: Math.abs(sprite.scale.y),
    };
  }

  // ── Cloud shadows drifting across the islands ──────────────────────────────
  const clouds: { s: Graphics; vx: number }[] = [];
  {
    const rng = mulberry32(77);
    for (let i = 0; i < 6; i++) {
      const s = new Graphics()
        .ellipse(0, 0, 110 + rng() * 70, 64 + rng() * 34)
        .fill({ color: 0x001018, alpha: 0.06 });
      s.x = rng() * WORLD_W;
      s.y = rng() * WORLD_H;
      cloudLayer.addChild(s);
      clouds.push({ s, vx: 7 + rng() * 8 });
    }
  }

  // ── Butterflies ─────────────────────────────────────────────────────────────
  const landSpot = (rng: () => number) => {
    for (let i = 0; i < 40; i++) {
      const c = 2 + Math.floor(rng() * (COLS - 4));
      const r = 2 + Math.floor(rng() * (ROWS - 4));
      const code = codeAt(c, r);
      if (code === "ground" || code === "high") return { c, r };
    }
    return { c: SPAWN.col, r: SPAWN.row };
  };
  const BUTTERFLY_COLORS = [0xff88cc, 0xffcc44, 0x44ddff, 0x88ff88, 0xee88ff, 0xff9966];
  {
    const bfRng = mulberry32(3141);
    const butterflyLayer = new Container();
    world.addChild(butterflyLayer);
    for (let i = 0; i < 28; i++) {
      const { c, r } = landSpot(bfRng);
      const color = BUTTERFLY_COLORS[Math.floor(bfRng() * BUTTERFLY_COLORS.length)];
      const size = 5 + bfRng() * 4;
      const g = new Graphics();
      g.x = (c + 0.5) * TILE;
      g.y = (r + 0.5) * TILE;
      butterflyLayer.addChild(g);
      butterflies.push({
        g, x: g.x, y: g.y, tx: g.x, ty: g.y, vx: 0, vy: 0,
        flapPhase: bfRng() * Math.PI * 2, flapSpeed: 6 + bfRng() * 5,
        wanderTimer: bfRng() * 3, baseColor: color, size,
      });
    }
  }

  // ── Fireflies — hand-drawn glowing dots, only visible once night falls ─────
  {
    const ffRng = mulberry32(9182);
    const fireflyLayer = new Container();
    fireflyLayer.blendMode = "add";
    world.addChild(fireflyLayer);
    for (let i = 0; i < 30; i++) {
      const { c, r } = landSpot(ffRng);
      const g = new Graphics();
      g.x = (c + 0.5) * TILE;
      g.y = (r + 0.5) * TILE;
      fireflyLayer.addChild(g);
      fireflies.push({
        g, x: g.x, y: g.y, tx: g.x, ty: g.y, vx: 0, vy: 0,
        glowPhase: ffRng() * Math.PI * 2, glowSpeed: 1.2 + ffRng() * 1.6,
        wanderTimer: ffRng() * 4,
      });
    }
  }
  world.addChild(cloudLayer);

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
    const dCave = Math.hypot(player.x - caveMouth.x, player.y - caveMouth.y);
    if (dCave < bestD) {
      bestD = dCave;
      best = { id: "cave", label: "The Hollow Cave", action: "Peer inside" };
    }
    const dBard = Math.hypot(player.x - bardPos.x, player.y - bardPos.y);
    if (dBard < bestD) {
      bestD = dBard;
      best = { id: "bard", label: "The Wandering Bard", action: "Listen" };
    }
    const dRaven = Math.hypot(player.x - ravenPos.x, player.y - ravenPos.y);
    if (dRaven < bestD) {
      bestD = dRaven;
      best = { id: "raven", label: "The Raven", action: "Talk" };
    }
    const dTerminal = Math.hypot(player.x - terminalPos.x, player.y - terminalPos.y);
    if (dTerminal < bestD) {
      bestD = dTerminal;
      best = { id: "terminal", label: "The Terminal", action: "Access" };
    }
    const dChronicle = Math.hypot(player.x - chroniclePos.x, player.y - chroniclePos.y);
    if (dChronicle < bestD) {
      bestD = dChronicle;
      best = { id: "chronicle", label: "The Town Chronicle", action: "Read" };
    }
    const dSignpost = Math.hypot(player.x - signpostPos.x, player.y - signpostPos.y);
    if (dSignpost < bestD) {
      best = { id: "recruiterSignpost", label: "Recruiter's Trail", action: "Read" };
    }
    setNear(best);
  };

  // ── Recruiter Mode: guided auto-walk tour ────────────────────────────────────
  const TOUR_PAUSE_S = 1.2;
  const TOUR_WALK_TIMEOUT_S = 9; // safety net — never let a leg get stuck forever
  type TourStop = { id: string; caption: string };
  const TOUR_STOPS: TourStop[] = [
    { id: "sanctum", caption: "Full-stack developer, B.Tech '27 — three production internships, shipping end-to-end." },
    { id: "chronicles", caption: "Currently at 10ex.ai — shipping an embeddable AI chatbot and scheduled agents on the Claude API." },
    { id: "armory", caption: "The stack: React, Next.js, Node, FastAPI, Postgres, Redis, and AI agents on the Claude API." },
    { id: "testimonies", caption: "What the people I've worked with say — real quotes, real teams." },
    { id: "relics", caption: "5 shipped projects — live demos, real repos, real metrics." },
    { id: "contact", caption: "Open to opportunities — let's talk. Opening contact details..." },
  ];
  let tourStopIdx = -1; // -1 = inactive
  let tourWalking = false;
  let tourPauseTimer = 0;
  let tourWalkTimer = 0;
  let tourWaypoints: { x: number; y: number }[] = [];

  /**
   * Where the tour actually walks to: half a tile BELOW the door, out in the
   * open street. The door itself sits exactly on the building's collision edge
   * and the player's feet-box extends 16px above its feet, so the literal door
   * pixel is unreachable — steering straight at it just grinds into the wall.
   */
  const approachPos = (id: string) => {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b) return { x: player.x, y: player.y };
    const d = doorPos(b);
    return { x: d.x, y: d.y + TILE * 0.5 };
  };

  /**
   * Breadth-first search over tiles (and the two levels, joined by ramps), so
   * the tour finds its way around buildings, up castle hill and back down.
   * Returns tile-centre waypoints with straight runs collapsed.
   */
  const routeTo = (target: { x: number; y: number }) => {
    const sc = Math.floor(player.x / TILE);
    const sr = Math.floor((player.y - 8) / TILE);
    const tc = Math.floor(target.x / TILE);
    const tr = Math.floor((target.y - 8) / TILE);
    const key = (c: number, r: number, l: number) => (r * COLS + c) * 2 + l;
    const prev = new Map<number, number>();
    const startKey = key(sc, sr, playerLevel);
    prev.set(startKey, -1);
    const queue = [startKey];
    let found = -1;
    while (queue.length) {
      const k = queue.shift()!;
      const l = k % 2;
      const cell = (k - l) / 2;
      const c = cell % COLS;
      const r = (cell - c) / COLS;
      if (c === tc && r === tr) { found = k; break; }
      const here = codeAt(c, r);
      const onRamp = here === "rampL" || here === "rampR";
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!inside(nc, nr) || tilemap.blocked[nr][nc]) continue;
        const nl = levelOf(tilemap.grid[nr][nc]);
        if (nl !== null && nl !== l && !onRamp) continue;
        const nk = key(nc, nr, nl ?? l);
        if (prev.has(nk)) continue;
        prev.set(nk, k);
        queue.push(nk);
      }
    }
    if (found < 0) return [target];
    const cells: { c: number; r: number }[] = [];
    for (let k = found; k !== -1; k = prev.get(k)!) {
      const cell = (k - (k % 2)) / 2;
      cells.unshift({ c: cell % COLS, r: Math.floor(cell / COLS) });
    }
    const pts: { x: number; y: number }[] = [];
    for (let i = 1; i < cells.length - 1; i++) {
      const a = cells[i - 1];
      const b = cells[i];
      const n = cells[i + 1];
      // keep only the corners of the route
      if (b.c - a.c !== n.c - b.c || b.r - a.r !== n.r - b.r) pts.push({ x: (b.c + 0.5) * TILE, y: (b.r + 0.75) * TILE });
    }
    pts.push(target);
    return pts;
  };

  const tourLabel = (id: string) => BUILDINGS.find((b) => b.id === id)?.name ?? id;
  const emitTourStop = (idx: number) => {
    const stop = TOUR_STOPS[idx];
    const info = { index: idx, total: TOUR_STOPS.length, id: stop.id, label: tourLabel(stop.id), caption: stop.caption };
    worldState.tour = info;
    bus.emitTour(info);
  };

  const beginLeg = (idx: number) => {
    tourStopIdx = idx;
    tourWalking = true;
    tourWalkTimer = 0;
    tourWaypoints = routeTo(approachPos(TOUR_STOPS[idx].id));
    player.setAutopilotTarget(tourWaypoints.shift() ?? null);
    emitTourStop(idx);
  };
  const startTour = () => {
    if (tourStopIdx >= 0) return;
    exitRoom();
    beginLeg(0);
    track("tour_start");
  };
  const stopTour = (completed: boolean) => {
    if (tourStopIdx < 0) return;
    tourStopIdx = -1;
    tourWaypoints = [];
    player.setAutopilotTarget(null);
    worldState.tour = null;
    bus.emitTour(null);
    if (completed) track("tour_complete");
  };
  const offTourCommand = bus.onTourCommand((cmd) => {
    if (cmd === "start") startTour();
    else stopTour(false);
  });

  // ── Interiors: doors lead into walk-in rooms ───────────────────────────────
  const roomLayer = new Container();
  roomLayer.visible = false;
  scene.addChild(roomLayer);
  const fade = new Sprite(Texture.WHITE);
  fade.tint = 0x000000;
  fade.alpha = 0;
  scene.addChild(fade);
  const rooms = new Map<string, Room>();
  let room: Room | null = null;
  const enterRoom = (id: string) => {
    if (!hasInterior(id)) {
      bus.emitOpen(id);
      return;
    }
    let r = rooms.get(id);
    if (!r) {
      r = buildInterior(id, fireFrames, unit("blue_lancer_idle", 320));
      rooms.set(id, r);
    }
    room = r;
    roomLayer.removeChildren();
    roomLayer.addChild(r.container);
    entities.removeChild(player.container);
    r.entities.addChild(player.container);
    player.setAutopilotTarget(null);
    player.setPosition(r.spawn.x, r.spawn.y);
    world.visible = false;
    roomLayer.visible = true;
    fade.alpha = 1;
    setNear(null);
    worldState.scene = `interior:${id}`;
    bus.emitVisit(id);
  };
  const exitRoom = () => {
    if (!room) return;
    const out = approachPos(room.id);
    room.entities.removeChild(player.container);
    entities.addChild(player.container);
    player.setAutopilotTarget(null);
    player.setPosition(out.x, out.y);
    playerLevel = levelOf(codeUnder(out.x, out.y)) ?? playerLevel;
    room = null;
    roomLayer.visible = false;
    world.visible = true;
    fade.alpha = 1;
    setNear(null);
    worldState.scene = "town";
  };

  // ── Travel: click a place in the HUD and the hero walks there ──────────────
  const below = (p: { x: number; y: number }, dy = 0.55) => ({ x: p.x, y: p.y + TILE * dy });
  const travelTarget = (id: string): { x: number; y: number } | null => {
    if (BUILDINGS.some((b) => b.id === id)) return approachPos(id);
    switch (id) {
      case "bard": return below(bardPos);
      case "raven": return below(ravenPos);
      case "terminal": return below(terminalPos);
      case "chronicle": return below(chroniclePos);
      case "recruiterSignpost": return below(signpostPos);
      case "cave": return below(caveMouth, 0.9);
      case "knight": return { x: (ORC_CHIEF_SPOT.col + 0.5) * TILE, y: (ORC_CHIEF_SPOT.row + 2.2) * TILE };
      default: return null;
    }
  };
  let travel: { id: string; waypoints: { x: number; y: number }[]; timer: number } | null = null;
  const stopTravel = () => {
    if (!travel) return;
    travel = null;
    player.setAutopilotTarget(null);
  };
  const offTravel = bus.onTravel((id) => {
    if (room?.id === id) return;
    exitRoom();
    const target = travelTarget(id);
    if (!target) return;
    stopTour(false);
    const waypoints = routeTo(target);
    travel = { id, waypoints, timer: 0 };
    player.setAutopilotTarget(waypoints.shift() ?? null);
  });

  // ── Guide: an arrow by the hero pointing at the next unseen section ────────
  const GUIDE_ORDER = ["sanctum", "chronicles", "relics", "armory", "testimonies", "contact"];
  const visited = getVisited();
  const offVisit = bus.onVisit((id) => visited.add(id));
  const guide = new Container();
  {
    const g = new Graphics()
      .poly([16, 0, -6, -10, -2, 0, -6, 10]).fill({ color: 0xf6c75a })
      .poly([16, 0, -6, -10, -2, 0, -6, 10]).stroke({ width: 2, color: 0x000000, alpha: 0.85 });
    guide.addChild(g);
  }
  const guideText = new Text({ text: "", style: new TextStyle({
    fontFamily: "'Press Start 2P', monospace", fontSize: 7, fill: "#f6c75a",
    stroke: { color: "#000000", width: 3, join: "round" },
  }) });
  guideText.anchor.set(0.5, 1);
  labelLayer.addChild(guide, guideText);
  const updateGuide = (t: number) => {
    const nextId = GUIDE_ORDER.find((id) => !visited.has(id));
    for (const [id, plate] of plates) plate.scale.set(id === nextId ? 1 + 0.07 * Math.sin(t * 4) : 1);
    const target = nextId ? approachPos(nextId) : null;
    const dist = target ? Math.hypot(target.x - player.x, target.y - player.y) : 0;
    const show = !!target && !travel && tourStopIdx < 0 && dist > TILE * 2.5;
    guide.visible = guideText.visible = show;
    if (!show || !target) return;
    const cx = player.x;
    const cy = player.y - 26;
    const a = Math.atan2(target.y - cy, target.x - cx);
    const r = 46 + Math.sin(t * 5) * 4;
    guide.x = cx + Math.cos(a) * r;
    guide.y = cy + Math.sin(a) * r;
    guide.rotation = a;
    guideText.text = BUILDING_DESC[nextId!] ?? "";
    guideText.x = guide.x;
    guideText.y = guide.y - 14;
  };

  // ── Camera ─────────────────────────────────────────────────────────────────
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const applyCamera = () => {
    const vw = app.screen.width;
    const vh = app.screen.height;
    fade.width = vw;
    fade.height = vh;
    if (room) {
      const k = clamp(Math.min(vw / (room.width + 140), vh / (room.height + 180)), 1, 2.4);
      roomLayer.scale.set(k);
      roomLayer.x = Math.round((vw - room.width * k) / 2);
      roomLayer.y = Math.round((vh - room.height * k) / 2);
      return;
    }
    if (OVERVIEW) {
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
  const updateRoom = (dt: number) => {
    const r = room!;
    player.update(dt, r.canWalk);
    let best: { id: string; label: string; action: string } | null = null;
    let bestD = 72;
    for (const h of r.hotspots) {
      const d = Math.hypot(player.x - h.x, player.y - h.y);
      if (d < bestD) { bestD = d; best = { id: h.id, label: h.label, action: h.action }; }
    }
    setNear(best);
    if (input.justPressed(...KEY.interact) && best) {
      bus.emitVisit(best.id.startsWith("relic:") ? "relics" : best.id);
      bus.emitOpen(best.id);
    }
    r.update(elapsed);
    if (travel) stopTravel();
    if (r.isExit(player.x, player.y)) exitRoom();
    applyCamera();
  };
  const update = (dt: number) => {
    elapsed += dt;

    // Day/night: a full 24h cycle takes DAY_CYCLE_SECONDS of real time when
    // running; [T] in the overlay HUD can also jump straight to a fixed hour.
    if (worldState.cycleRunning) {
      worldState.timeOfDay = (worldState.timeOfDay + (dt / DAY_CYCLE_SECONDS) * 24) % 24;
    }
    const sky = sampleDayNight(worldState.timeOfDay / 24);
    // Deep indigo, not plain navy — reads as moody/dreamy rather than just "dim".
    // nightAlpha^1.4 steepens the ramp so full night visibly outdoes dusk instead
    // of both flattening out at the same overlay alpha once nightAlpha saturates.
    nightOverlay.tint = lerpColor(0xff9a4d, 0x140a30, sky.nightAlpha);
    nightOverlay.alpha = Math.pow(sky.nightAlpha, 1.4) * 0.72;

    fade.alpha = Math.max(0, fade.alpha - dt * 3.5);
    if (room) {
      updateRoom(dt);
      return;
    }

    // Ramps join the two levels: standing on one lets the next step change level.
    const hereCode = codeUnder(player.x, player.y);
    playerOnRamp = hereCode === "rampL" || hereCode === "rampR";
    player.update(dt, canWalk);
    playerLevel = levelOf(codeUnder(player.x, player.y)) ?? playerLevel;
    worldState.playerX = player.x;
    worldState.playerY = player.y;
    detectNear();

    if (input.justPressed(...KEY.interact) && worldState.near) {
      bus.emitVisit(worldState.near.id);
      if (worldState.near.id === "bard") {
        const url = worldState.bardTrack?.songUrl;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } else if (hasInterior(worldState.near.id)) {
        enterRoom(worldState.near.id);
      } else {
        bus.emitOpen(worldState.near.id);
      }
    }

    // ── Recruiter Mode stepping ────────────────────────────────────────────────
    if (tourStopIdx >= 0) {
      const manualControl =
        input.isDown(...KEY.left, ...KEY.right, ...KEY.up, ...KEY.down) ||
        input.justPressed(...KEY.attack) ||
        input.justPressed(...KEY.interact);
      if (manualControl) {
        stopTour(false);
      } else if (tourWalking) {
        tourWalkTimer += dt;
        if (!player.isAutopiloting && tourWaypoints.length > 0) {
          player.setAutopilotTarget(tourWaypoints.shift() ?? null);
        } else if (!player.isAutopiloting || tourWalkTimer > TOUR_WALK_TIMEOUT_S) {
          tourWalking = false;
          tourPauseTimer = 0;
          bus.emitVisit(TOUR_STOPS[tourStopIdx].id);
          if (TOUR_STOPS[tourStopIdx].id === "contact") {
            bus.emitOpen("contact");
          }
        }
      } else {
        tourPauseTimer += dt;
        if (tourPauseTimer >= TOUR_PAUSE_S) {
          const next = tourStopIdx + 1;
          if (next >= TOUR_STOPS.length) {
            stopTour(true);
          } else {
            beginLeg(next);
          }
        }
      }
    }

    // ── Travel stepping ────────────────────────────────────────────────────────
    if (travel) {
      travel.timer += dt;
      const manual =
        input.isDown(...KEY.left, ...KEY.right, ...KEY.up, ...KEY.down) ||
        input.justPressed(...KEY.attack);
      if (manual) {
        stopTravel();
      } else if (!player.isAutopiloting && travel.waypoints.length > 0) {
        player.setAutopilotTarget(travel.waypoints.shift() ?? null);
      } else if (!player.isAutopiloting || travel.timer > 12) {
        const id = travel.id;
        stopTravel();
        if (hasInterior(id)) enterRoom(id);
        else {
          bus.emitVisit(id);
          if (id !== "bard" && id !== "knight") bus.emitOpen(id);
        }
      }
    }
    updateGuide(elapsed);

    // ── Black Knight combat ──────────────────────────────────────────────────
    worldState.attackInRange =
      !!chief &&
      chief.alive &&
      !chief.dying &&
      Math.hypot(player.x - chief.sprite.x, player.y - chief.sprite.y) < ATTACK_RANGE;

    if (chief && chief.alive) {
      if (!chief.dying && player.justSwung) {
        const d = Math.hypot(player.x - chief.sprite.x, player.y - chief.sprite.y);
        if (d < ATTACK_RANGE) {
          chief.health -= 1;
          chief.hitFlash = 0.15;
          const lostPip = chief.pips[chief.health];
          if (lostPip) lostPip.alpha = 0.15;
          if (chief.health <= 0) chief.dying = true;
        }
      }
      if (chief.hitFlash > 0) {
        chief.hitFlash -= dt;
        chief.sprite.tint = 0xff6666;
      } else {
        chief.sprite.tint = 0xffffff;
      }
      if (chief.dying) {
        chief.dyingTime += dt;
        const t = Math.min(1, chief.dyingTime / 0.6);
        chief.sprite.alpha = 1 - t;
        const k = (1 - t * 0.4) * chief.baseScale;
        chief.sprite.scale.set(-k, k);
        chief.label.alpha = 1 - t;
        chief.shadow.alpha = 0.25 * (1 - t);
        for (const pip of chief.pips) pip.alpha *= 1 - dt * 3;
        if (t >= 1) {
          chief.alive = false;
          entities.removeChild(chief.sprite, chief.shadow);
          labelLayer.removeChild(chief.label, ...chief.pips);
          localStorage.setItem(ORC_DEFEATED_KEY, "1");
          track("boss_kill");
          placeTrophy();
        }
      }
    }

    // wandering critters — pose (size/anchor) is only recomputed on an
    // idle⇄move transition, so each state holds a steady frame size.
    for (const cr of critters) {
      cr.anim += dt;
      if (cr.state === "idle") {
        cr.timer -= dt;
        cr.sprite.texture = cr.idleFrames[Math.floor(cr.anim * cr.idleFps) % cr.idleFrames.length];
        if (cr.timer <= 0) {
          const spot = pickSpot(cr.region, cr.level, Math.random);
          if (spot) {
            cr.tx = spot.x;
            cr.ty = spot.y;
            cr.state = "move";
            cr.timer = 2 + Math.random() * 4;
            applyPose(cr, cr.moveTrim, cr.moveFrames[0]);
          } else cr.timer = 1;
        }
      } else {
        cr.timer -= dt;
        const dx = cr.tx - cr.x;
        const dy = cr.ty - cr.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4 || cr.timer <= 0) {
          cr.state = "idle";
          cr.timer = 1.5 + Math.random() * 3;
          applyPose(cr, cr.idleTrim, cr.idleFrames[0]);
        } else {
          const step = cr.speed * dt;
          const nx = cr.x + (dx / dist) * step;
          const ny = cr.y + (dy / dist) * step;
          if (tilemap.canWalkAt(nx, ny, cr.level, false)) {
            cr.x = nx;
            cr.y = ny;
            if (dx < -0.5) cr.facing = -1;
            else if (dx > 0.5) cr.facing = 1;
          } else {
            cr.state = "idle";
            cr.timer = 1;
            applyPose(cr, cr.idleTrim, cr.idleFrames[0]);
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
        bf.ty = Math.max(TILE * 2, Math.min(WORLD_H - TILE * 2, bf.y + Math.sin(angle) * dist));
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

    // water shimmer — glints strongest in daylight, with a faint moonlit hint
    if (shimmers.length > 0) {
      const light = 0.25 + 0.75 * sky.daylight;
      for (const s of shimmers) {
        const tw = Math.sin(elapsed * s.speed + s.phase);
        s.g.alpha = Math.max(0, tw) * 0.55 * light;
        s.g.x = s.baseX + Math.sin(elapsed * s.speed * 0.5 + s.phase) * 2;
      }
    }

    // torch bloom — swells after dusk, with a slow flicker so it reads as fire
    if (torchGlows.length > 0) {
      const nightLight = Math.pow(sky.nightAlpha, 0.8);
      for (const t of torchGlows) {
        const flicker = 0.85 + 0.15 * Math.sin(elapsed * 6 + t.phase);
        t.g.alpha = nightLight * flicker;
        t.g.scale.set(0.92 + 0.08 * flicker);
      }
    }

    // fireflies — lazy drift, glow fades in/out with the night tint itself
    for (const ff of fireflies) {
      ff.glowPhase += ff.glowSpeed * dt;
      ff.wanderTimer -= dt;
      if (ff.wanderTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 36;
        ff.tx = Math.max(TILE * 2, Math.min(WORLD_W - TILE * 2, ff.x + Math.cos(angle) * dist));
        ff.ty = Math.max(TILE * 2, Math.min(WORLD_H - TILE * 2, ff.y + Math.sin(angle) * dist));
        ff.wanderTimer = 3 + Math.random() * 4;
      }
      const ddx = ff.tx - ff.x;
      const ddy = ff.ty - ff.y;
      const spd = 12;
      ff.vx += ddx * 1.2 * dt;
      ff.vy += ddy * 1.2 * dt;
      ff.vx *= 0.94;
      ff.vy *= 0.94;
      const vel = Math.hypot(ff.vx, ff.vy);
      if (vel > spd) { ff.vx = (ff.vx / vel) * spd; ff.vy = (ff.vy / vel) * spd; }
      ff.x += ff.vx * dt;
      ff.y += ff.vy * dt;

      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(ff.glowPhase));
      const a = twinkle * sky.nightAlpha;
      ff.g.clear();
      if (a > 0.02) {
        // Outermost ring is the bloom; the layer blends additively, so
        // overlapping fireflies pool light instead of flatly stacking alpha.
        ff.g.circle(0, 0, 13).fill({ color: 0xaaff66, alpha: 0.07 * a });
        ff.g.circle(0, 0, 6).fill({ color: 0xccff88, alpha: 0.16 * a });
        ff.g.circle(0, 0, 1.8).fill({ color: 0xf2ffc4, alpha: 0.95 * a });
      }
      ff.g.x = Math.round(ff.x);
      ff.g.y = Math.round(ff.y) + Math.sin(elapsed * 0.8 + ff.glowPhase * 0.2) * 4;
    }

    // environment frame animation (torches, splashes, foam, duck, workers)
    for (const a of animated) {
      a.sprite.texture = a.frames[Math.floor((elapsed + a.phase) * a.fps) % a.frames.length];
    }

    // clouds drift east and wrap
    for (const c of clouds) {
      c.s.x += c.vx * dt;
      if (c.s.x > WORLD_W + 200) c.s.x = -200;
    }

    entities.sortChildren();
    applyCamera();
  };

  // ── Day/night tint — a full-world overlay, added last so it paints over
  // everything (buildings, entities, water) but still lets them show through
  // at partial alpha, like a screen-space lighting tint. ─────────────────────
  const nightOverlay = new Sprite(Texture.WHITE);
  nightOverlay.x = 0;
  nightOverlay.y = 0;
  nightOverlay.width = WORLD_W;
  nightOverlay.height = WORLD_H;
  nightOverlay.alpha = 0;
  world.addChild(nightOverlay);
  world.addChild(labelLayer);

  if (DEBUG_COLLISION) {
    const dbg = new Graphics();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tilemap.blocked[r][c] && codeAt(c, r) !== "water") {
          dbg.rect(c * TILE, r * TILE, TILE, TILE).fill({ color: 0xff0000, alpha: 0.35 });
        }
      }
    }
    world.addChild(dbg);
  }

  applyCamera();
  return { container: scene, update, dispose: () => { offTourCommand(); offTravel(); offVisit(); } };
}
