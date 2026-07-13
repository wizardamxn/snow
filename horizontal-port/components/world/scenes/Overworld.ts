import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import { CASTLE_X, advanceWorld, worldState } from "@/lib/world/worldState";
import { createKnight } from "@/components/world/Knight";
import { createParallaxLayer } from "@/components/world/Parallax";
import { createStations } from "@/components/world/Stations";
import { createCastle } from "@/components/world/Castle";
import { loadStrip } from "@/components/world/sliceStrip";

// ─── Asset paths ────────────────────────────────────────────────────────────
const CLOUD_URLS = [1, 2, 3, 4, 5, 6, 7, 8].map(
  (n) => `/pixel/bg/clouds/Clouds_0${n}.png`,
);
const TREE_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/trees/Tree${n}.png`);
const BUSH_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/bushes/Bushe${n}.png`);
const ROCK_URLS = [1, 2, 3, 4].map((n) => `/pixel/terrain/Rock${n}.png`);
const TILEMAP_URL = "/pixel/terrain/Tilemap_color1.png";

const TREE_FRAME = { w: 192, h: 256 };
const BUSH_FRAME = { w: 128, h: 128 };
const DECO_FPS = 5;
const LEAF_COLORS = [0x6aa84f, 0x8fbf5f, 0xc98a3a, 0xd9a441];
const TAU = Math.PI * 2;
const TILE = 64;

/**
 * Mulberry32 — seeded PRNG for deterministic parallax tile copies.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SceneController = {
  container: Container;
  update: (dtSeconds: number) => void;
};

/**
 * Extracts a single tile texture from a tilemap spritesheet.
 */
function extractTile(
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

export async function buildOverworldScene(
  app: Application,
): Promise<SceneController> {
  const scene = new Container();
  const width = app.screen.width || 800;
  const height = app.screen.height || 600;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD ALL TEXTURES
  // ═══════════════════════════════════════════════════════════════════════════

  const [tilemapTex, bgTex, ...cloudTextures] = (await Promise.all([
    Assets.load(TILEMAP_URL),
    Assets.load("/pixel/bg/parallax_bg.png"),
    ...CLOUD_URLS.map((u) => Assets.load(u)),
  ])) as Texture[];
  tilemapTex.source.scaleMode = "nearest";
  bgTex.source.scaleMode = "nearest"; // keep pixel art crisp
  cloudTextures.forEach((t) => (t.source.scaleMode = "nearest"));

  const [treeFrameSets, bushFrameSets, rockTextures] = await Promise.all([
    Promise.all(TREE_URLS.map((u) => loadStrip(u, TREE_FRAME.w, TREE_FRAME.h))),
    Promise.all(BUSH_URLS.map((u) => loadStrip(u, BUSH_FRAME.w, BUSH_FRAME.h))),
    Promise.all(ROCK_URLS.map((u) => Assets.load(u))) as Promise<Texture[]>,
  ]);
  rockTextures.forEach((t) => (t.source.scaleMode = "nearest"));

  // Extract terrain tiles from the tilemap
  const grassTopTile = extractTile(tilemapTex, 1, 0); // grass top-edge center
  const grassBodyTile = extractTile(tilemapTex, 1, 1); // grass interior
  const earthBodyTile = extractTile(tilemapTex, 5, 2); // earth/cliff fill

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOUDS — pixel art cloud sprites drifting across
  // ═══════════════════════════════════════════════════════════════════════════

  const cloudLayer = new Container();
  const clouds: { sprite: Sprite; vx: number; halfW: number }[] = [];
  const cloudPlan = [
    { w: 280, y: 0.05, vx: 5 },
    { w: 200, y: 0.12, vx: 8 },
    { w: 320, y: 0.03, vx: 3 },
    { w: 160, y: 0.2, vx: 11 },
    { w: 240, y: 0.08, vx: 6 },
  ];
  for (const c of cloudPlan) {
    const texture = cloudTextures[Math.floor(Math.random() * cloudTextures.length)];
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = c.w;
    sprite.height = c.w * (texture.height / texture.width);
    sprite.alpha = 0.5; // lower opacity to blend with the sky background
    cloudLayer.addChild(sprite);
    clouds.push({ sprite, vx: c.vx, halfW: c.w / 2 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BIRDS
  // ═══════════════════════════════════════════════════════════════════════════

  const birdLayer = new Container();
  const birds: { g: Graphics; vx: number; flap: number; flapSpeed: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new Graphics()
      .moveTo(-8, 0)
      .lineTo(0, -4)
      .lineTo(8, 0)
      .stroke({ width: 2, color: 0x3a3a3a });
    birdLayer.addChild(g);
    birds.push({ g, vx: 35 + Math.random() * 35, flap: Math.random() * 6, flapSpeed: 9 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARALLAX LAYER INITIALIZATION (4096px virtual width for 4K screen protection)
  // ═══════════════════════════════════════════════════════════════════════════

  type Deco = { sprite: Sprite; frames: Texture[]; phase: number };
  const decos: Deco[] = [];

  const placeDeco = (
    c: Container,
    frameSets: Texture[][],
    x: number,
    y: number,
    displayH: number,
    anchorY: number,
    rng: () => number = Math.random,
    addShadow = false,
    tint?: number,
    alpha?: number,
  ): Sprite => {
    const frames = frameSets[Math.floor(rng() * frameSets.length)];
    
    if (addShadow) {
      const estimatedW = displayH * (frames[0].width / frames[0].height);
      const shadowW = estimatedW * 0.35;
      const shadowH = shadowW * 0.22;
      const shadow = new Graphics()
        .ellipse(x, y, shadowW, shadowH)
        .fill({ color: 0x000000, alpha: 0.28 });
      c.addChild(shadow);
    }

    const sprite = new Sprite(frames[0]);
    sprite.anchor.set(0.5, anchorY);
    sprite.height = displayH;
    sprite.width = displayH * (frames[0].width / frames[0].height);
    sprite.x = x;
    sprite.y = y;
    if (tint !== undefined) sprite.tint = tint;
    if (alpha !== undefined) sprite.alpha = alpha;
    decos.push({ sprite, frames, phase: rng() * 10 });
    c.addChild(sprite);
    return sprite;
  };

  // Dimensions & proportions at design size
  const DESIGN_H = 600;
  const GROUND_H_DESIGN = 128;
  const VIRTUAL_WIDTH = 4096;

  // 1. Pixel Art Sky & Mountains Parallax (factor = 0.05)
  // Renders the entire sky gradient and mountain silhouettes as the backmost layer
  const parallaxBg = createParallaxLayer(VIRTUAL_WIDTH, 0.05, () => {
    const c = new Container();
    const w = 600; // design width of each tile
    const h = 600; // design height matches DESIGN_H
    const cols = Math.ceil(VIRTUAL_WIDTH / w) + 1;
    for (let i = 0; i < cols; i++) {
      const sprite = new Sprite(bgTex);
      sprite.x = i * w;
      sprite.anchor.set(0, 1);
      sprite.y = 600; // bottom of the screen at design size
      sprite.width = w;
      sprite.height = h;
      c.addChild(sprite);
    }
    return c;
  });
  scene.addChild(parallaxBg.container);

  // Clouds & birds sit in front of distant mountains
  scene.addChild(cloudLayer);
  scene.addChild(birdLayer);

  // 2. Far Trees Parallax (factor = 0.15)
  const FAR_TREE_SEED = 11111;
  const farTrees = createParallaxLayer(VIRTUAL_WIDTH, 0.15, () => {
    const rng = mulberry32(FAR_TREE_SEED);
    const c = new Container();
    for (let i = 0; i < 20; i++) {
      placeDeco(
        c,
        treeFrameSets,
        rng() * VIRTUAL_WIDTH,
        0, // relative Y (anchored to container groundY)
        120 + rng() * 30, // design height
        0.95,
        rng,
        false, // no shadow for far trees
        0x5a7060, // tint
        0.65, // alpha
      );
    }
    return c;
  });
  scene.addChild(farTrees.container);

  // 3. Mid Trees Parallax (factor = 0.4)
  const MID_TREE_SEED = 22222;
  const midTrees = createParallaxLayer(VIRTUAL_WIDTH, 0.4, () => {
    const rng = mulberry32(MID_TREE_SEED);
    const c = new Container();
    for (let i = 0; i < 15; i++) {
      placeDeco(
        c,
        treeFrameSets,
        rng() * VIRTUAL_WIDTH,
        0,
        150 + rng() * 30,
        0.95,
        rng,
        false,
        0x7b9380,
        0.8,
      );
    }
    return c;
  });
  scene.addChild(midTrees.container);

  // 4. Castle
  const castle = await createCastle(width, height, DESIGN_H - GROUND_H_DESIGN);
  scene.addChild(castle.container);

  // 5. Near Trees Parallax (factor = 0.8) — rendered BEHIND ground so bases are hidden
  const NEAR_TREE_SEED = 44444;
  const nearTrees = createParallaxLayer(VIRTUAL_WIDTH, 0.8, () => {
    const rng = mulberry32(NEAR_TREE_SEED);
    const c = new Container();
    for (let i = 0; i < 10; i++) {
      placeDeco(
        c,
        treeFrameSets,
        rng() * VIRTUAL_WIDTH,
        16, // relative Y (roots slightly embedded)
        240 + rng() * 40,
        0.95,
        rng,
        true, // add contact shadow for near trees
      );
    }
    return c;
  });
  scene.addChild(nearTrees.container);

  // 6. Tiled Ground (factor = 1.0)
  const groundWidth = (Math.ceil(VIRTUAL_WIDTH / TILE) + 1) * TILE;
  const ROCK_SEED = 33333;
  const ground = createParallaxLayer(groundWidth, 1.0, () => {
    const c = new Container();
    const tilesAcross = Math.ceil(groundWidth / TILE) + 1;
    const rowsNeeded = Math.ceil(GROUND_H_DESIGN / TILE) + 1;
    
    // Tiles
    for (let col = 0; col < tilesAcross; col++) {
      for (let row = 0; row < rowsNeeded; row++) {
        const tex = row === 0 ? grassTopTile : row === 1 ? grassBodyTile : earthBodyTile;
        const tile = new Sprite(tex);
        tile.x = col * TILE;
        tile.y = row * TILE; // relative Y
        tile.width = TILE;
        tile.height = TILE;
        c.addChild(tile);
      }
    }

    // Rocks scattered deterministically
    const rng = mulberry32(ROCK_SEED);
    for (let i = 0; i < 6; i++) {
      const tex = rockTextures[Math.floor(rng() * rockTextures.length)];
      const rock = new Sprite(tex);
      rock.anchor.set(0.5, 0.9);
      const rh = 18 + rng() * 12;
      rock.height = rh;
      rock.width = rh * (tex.width / tex.height);
      rock.x = rng() * groundWidth;
      rock.y = TILE * 0.15; // relative Y
      c.addChild(rock);
    }

    return c;
  });
  scene.addChild(ground.container);

  // 7. Near Bushes Parallax (factor = 1.0) — rendered IN FRONT of ground, locked at 1.0 speed
  const BUSH_SEED = 55555;
  const bushes = createParallaxLayer(VIRTUAL_WIDTH, 1.0, () => {
    const rng = mulberry32(BUSH_SEED);
    const c = new Container();
    for (let i = 0; i < 15; i++) {
      placeDeco(
        c,
        bushFrameSets,
        rng() * VIRTUAL_WIDTH,
        TILE * 0.15, // relative Y sitting exactly in the grass
        40 + rng() * 20,
        0.85,
        rng,
        true, // add contact shadow for bushes
      );
    }
    return c;
  });
  scene.addChild(bushes.container);

  // ═══════════════════════════════════════════════════════════════════════════
  // FALLING LEAVES
  // ═══════════════════════════════════════════════════════════════════════════

  const leafLayer = new Container();
  const leaves: {
    sprite: Graphics;
    vy: number;
    swayAmp: number;
    swaySpeed: number;
    phase: number;
    rotSpeed: number;
  }[] = [];
  for (let i = 0; i < 14; i++) {
    const color = LEAF_COLORS[i % LEAF_COLORS.length];
    const sprite = new Graphics().ellipse(0, 0, 5, 2.5).fill(color);
    sprite.alpha = 0.6 + Math.random() * 0.4;
    leafLayer.addChild(sprite);
    leaves.push({
      sprite,
      vy: 18 + Math.random() * 22,
      swayAmp: 12 + Math.random() * 18,
      swaySpeed: 0.8 + Math.random() * 1.2,
      phase: Math.random() * TAU,
      rotSpeed: (Math.random() - 0.5) * 3,
    });
  }
  scene.addChild(leafLayer);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATIONS & KNIGHT
  // ═══════════════════════════════════════════════════════════════════════════

  const stations = await createStations(width * 0.18, DESIGN_H - GROUND_H_DESIGN, 130);
  scene.addChild(stations.container);

  const knight = await createKnight(130);
  scene.addChild(knight.container);

  app.stage.addChild(scene);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSIVE LAYOUT CALCULATION (USING DESIGN HEIGHT SYSTEM)
  // ═══════════════════════════════════════════════════════════════════════════

  let lastW = 0;
  let lastH = 0;
  let scale = 1.0;
  let currentGroundY = DESIGN_H - GROUND_H_DESIGN;

  const performLayout = () => {
    const curW = app.screen.width;
    const curH = app.screen.height;
    if (curW === lastW && curH === lastH) return;

    lastW = curW;
    lastH = curH;

    // Recalculate scale factor and ground Y based on window height
    scale = lastH / DESIGN_H;
    currentGroundY = lastH - GROUND_H_DESIGN * scale;

    // Scale background image to cover screen height and have wrapping width
    parallaxBg.container.scale.set(scale);
    parallaxBg.container.y = 0; // anchors to the top

    // Apply uniform scale and Y position to all parallax layers
    const layers = [
      farTrees,
      midTrees,
      nearTrees,
      ground,
      bushes,
    ];
    for (const layer of layers) {
      layer.container.scale.set(scale);
      layer.container.y = currentGroundY;
    }

    // Scale and position stations container
    stations.container.scale.set(scale);
    stations.container.y = currentGroundY;

    // Scale and position knight container
    knight.container.scale.set(scale);
    knight.container.x = lastW * 0.18;
    knight.setGround(currentGroundY);

    // Place cloud coordinates based on current height
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].sprite.y = lastH * cloudPlan[i].y;
    }

    // Reset leaf bounds
    for (const leaf of leaves) {
      if (leaf.sprite.y > lastH) {
        leaf.sprite.y = Math.random() * lastH;
        leaf.sprite.x = Math.random() * lastW;
      }
    }
  };

  // Perform first layout pass
  performLayout();

  // ═══════════════════════════════════════════════════════════════════════════
  // PER-FRAME UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;
    advanceWorld(dt);

    // Keep layout up to date with any canvas resizes
    performLayout();

    const curW = app.screen.width;
    const curH = app.screen.height;

    // Clouds drift
    for (const c of clouds) {
      c.sprite.x += c.vx * dt;
      if (c.sprite.x - c.halfW > curW) c.sprite.x = -c.halfW;
    }

    // Birds
    for (const b of birds) {
      b.flap += b.flapSpeed * dt;
      b.g.scale.y = 0.6 + Math.sin(b.flap) * 0.4;
      b.g.x += b.vx * dt;
      if (b.g.x > curW + 20) {
        b.g.x = -20;
        b.g.y = curH * (0.1 + Math.random() * 0.15);
      }
    }

    // Parallax layers updates
    parallaxBg.update();
    farTrees.update();
    midTrees.update();
    castle.update(curW, curH, currentGroundY, scale);
    nearTrees.update();
    ground.update();
    bushes.update();
    stations.update(scale, curW * 0.18);

    // Deco sway animation
    for (const d of decos) {
      const idx = Math.floor((elapsed + d.phase) * DECO_FPS) % d.frames.length;
      d.sprite.texture = d.frames[idx];
    }

    // Falling leaves
    for (const leaf of leaves) {
      leaf.phase += leaf.swaySpeed * dt;
      leaf.sprite.y += leaf.vy * dt;
      leaf.sprite.x += Math.sin(leaf.phase) * leaf.swayAmp * dt;
      leaf.sprite.rotation += leaf.rotSpeed * dt;
      if (leaf.sprite.y > curH + 10) {
        leaf.sprite.y = -10;
        leaf.sprite.x = Math.random() * curW;
      }
    }

    knight.update(dt);
  };

  return { container: scene, update };
}
