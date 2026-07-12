import { Application, Assets, Container, FillGradient, Graphics, Sprite, Texture } from "pixi.js";
import { advanceWorld, worldState } from "@/lib/world/worldState";
import { lerpColor, sampleDayNight } from "@/lib/world/dayNight";
import { createKnight } from "@/components/world/Knight";
import { createParallaxLayer } from "@/components/world/Parallax";
import { createStations } from "@/components/world/Stations";
import { createCastle } from "@/components/world/Castle";
import { loadStrip } from "@/components/world/sliceStrip";

// Tiny Swords (Free Pack) assets — see public/pixel/README.md for provenance.
const CLOUD_URLS = [1, 2, 3, 4, 5].map((n) => `/pixel/bg/clouds/Clouds_0${n}.png`);
const TREE_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/trees/Tree${n}.png`);
const BUSH_URLS = [1, 2, 3, 4].map((n) => `/pixel/bg/bushes/Bushe${n}.png`);
const TREE_FRAME = { w: 192, h: 256 };
const BUSH_FRAME = { w: 128, h: 128 };
const DECO_FPS = 5; // shared sway rate for trees + bushes

const LEAF_COLORS = [0x6aa84f, 0x8fbf5f, 0xc98a3a, 0xd9a441];
const TAU = Math.PI * 2;

export type SceneController = {
  container: Container;
  /** Called every frame by the ticker with elapsed seconds since last frame. */
  update: (dtSeconds: number) => void;
};

/** Builds one full-screen vertical gradient as a Graphics rect. */
function gradientRect(
  width: number,
  height: number,
  top: number,
  bottom: number,
): Graphics {
  const gradient = new FillGradient({
    type: "linear",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: top },
      { offset: 1, color: bottom },
    ],
  });
  return new Graphics().rect(0, 0, width, height).fill(gradient);
}

export async function buildOverworldScene(
  app: Application,
): Promise<SceneController> {
  const width = app.screen.width;
  const height = app.screen.height;
  const scene = new Container();

  // Proportional layout: the world band scales with the viewport instead of
  // fixed pixel sizes (which looked miniature on large screens).
  const GROUND_H = Math.round(height * 0.14);

  // --- Sky: three stacked gradients we cross-fade (dusk is the always-on base) ---
  const duskSky = gradientRect(width, height, 0x394a8a, 0xffb27a);
  const daySky = gradientRect(width, height, 0x4a90d9, 0xbfe3ff);
  const nightSky = gradientRect(width, height, 0x0a1026, 0x1a2547);
  scene.addChild(duskSky, daySky, nightSky);

  // --- Stars: many tiny dots, faded in/out as one layer via container.alpha ---
  const stars = new Container();
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.6;
    const r = Math.random() < 0.2 ? 1.6 : 1;
    stars.addChild(new Graphics().circle(x, y, r).fill(0xffffff));
  }
  scene.addChild(stars);

  // --- Sun & moon: glowing discs arcing across the sky ---
  const sun = new Graphics()
    .circle(0, 0, 58)
    .fill({ color: 0xffe08a, alpha: 0.18 })
    .circle(0, 0, 40)
    .fill({ color: 0xffe08a, alpha: 0.3 })
    .circle(0, 0, 28)
    .fill(0xffe08a);
  const moon = new Graphics()
    .circle(0, 0, 34)
    .fill({ color: 0xdfe6f0, alpha: 0.2 })
    .circle(0, 0, 22)
    .fill(0xdfe6f0);
  scene.addChild(sun, moon);

  // --- Load textures (async) ---
  const cloudTextures = (await Promise.all(
    CLOUD_URLS.map((u) => Assets.load(u)),
  )) as Texture[];
  cloudTextures.forEach((t) => (t.source.scaleMode = "nearest"));

  const [treeFrameSets, bushFrameSets] = await Promise.all([
    Promise.all(TREE_URLS.map((u) => loadStrip(u, TREE_FRAME.w, TREE_FRAME.h))),
    Promise.all(BUSH_URLS.map((u) => loadStrip(u, BUSH_FRAME.w, BUSH_FRAME.h))),
  ]);

  // --- Clouds: a few varied shapes at different sizes/speeds, drifting and wrapping ---
  const cloudLayer = new Container();
  const clouds: { sprite: Sprite; vx: number; halfW: number }[] = [];
  const cloudPlan = [
    { w: 240, y: 0.1, vx: 8 },
    { w: 170, y: 0.22, vx: 12 },
    { w: 300, y: 0.06, vx: 5 },
  ];
  for (const c of cloudPlan) {
    const texture = cloudTextures[Math.floor(Math.random() * cloudTextures.length)];
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = c.w;
    sprite.height = c.w * (texture.height / texture.width);
    sprite.x = Math.random() * width;
    sprite.y = height * c.y;
    cloudLayer.addChild(sprite);
    clouds.push({ sprite, vx: c.vx, halfW: c.w / 2 });
  }
  scene.addChild(cloudLayer);

  // --- Birds: little chevrons that flap and cross the sky ---
  const birdLayer = new Container();
  const birds: {
    g: Graphics;
    vx: number;
    flap: number;
    flapSpeed: number;
  }[] = [];
  for (let i = 0; i < 2; i++) {
    const g = new Graphics()
      .moveTo(-9, 0)
      .lineTo(0, -5)
      .lineTo(9, 0)
      .stroke({ width: 2, color: 0x3a3a3a });
    g.x = Math.random() * width;
    g.y = height * (0.15 + Math.random() * 0.15);
    birdLayer.addChild(g);
    birds.push({ g, vx: 40 + Math.random() * 30, flap: Math.random() * 6, flapSpeed: 9 });
  }
  scene.addChild(birdLayer);

  const groundY = height - GROUND_H;

  // --- Rolling hills, two depths, tall enough to actually frame the scene ---
  const makeHills = (factor: number, rise: number, color: number) =>
    createParallaxLayer(width, factor, () => {
      const c = new Container();
      const g = new Graphics();
      g.moveTo(0, groundY);
      const segs = 3 + Math.round(factor * 10);
      const segW = width / segs;
      for (let i = 0; i < segs; i++) {
        const x0 = i * segW;
        const peak = groundY - rise * (0.6 + Math.random() * 0.4);
        g.quadraticCurveTo(x0 + segW * 0.5, peak, x0 + segW, groundY);
      }
      g.lineTo(width, height);
      g.lineTo(0, height);
      g.closePath();
      g.fill(color);
      c.addChild(g);
      return c;
    });
  const hillsFar = makeHills(0.08, height * 0.3, 0x7da183);
  const hillsNear = makeHills(0.18, height * 0.18, 0x5d8767);
  scene.addChild(hillsFar.container);
  scene.addChild(hillsNear.container);

  // --- Castle: on the horizon, grows as the knight nears the gate ---
  const castle = await createCastle(width, height, groundY);
  scene.addChild(castle.container);

  // --- Ground (static base band with a sunlit top edge) ---
  const ground = new Graphics()
    .rect(0, groundY, width, GROUND_H)
    .fill(0x3d7247)
    .rect(0, groundY, width, Math.max(4, GROUND_H * 0.08))
    .fill(0x5d9c62);
  scene.addChild(ground);

  // Animated decorations (swaying trees/bushes) each track their own frame
  // set + a random phase offset so instances don't sway in lockstep.
  // anchorY < 1 compensates for transparent padding + baked shadows at the
  // bottom of Tiny Swords frames, so sprites actually touch the ground.
  type Deco = { sprite: Sprite; frames: Texture[]; phase: number };
  const decos: Deco[] = [];

  const placeDeco = (
    frameSets: Texture[][],
    x: number,
    y: number,
    displayH: number,
    anchorY: number,
  ): Sprite => {
    const frames = frameSets[Math.floor(Math.random() * frameSets.length)];
    const sprite = new Sprite(frames[0]);
    sprite.anchor.set(0.5, anchorY);
    sprite.height = displayH;
    sprite.width = displayH * (frames[0].width / frames[0].height);
    sprite.x = x;
    sprite.y = y;
    decos.push({ sprite, frames, phase: Math.random() * 10 });
    return sprite;
  };

  // --- Mid trees: a distant tree-line, slightly desaturated for depth ---
  const trees = createParallaxLayer(width, 0.5, () => {
    const c = new Container();
    for (let i = 0; i < 5; i++) {
      const s = placeDeco(
        treeFrameSets,
        60 + Math.random() * (width - 120),
        groundY + 4,
        height * (0.24 + Math.random() * 0.05),
        0.92,
      );
      s.tint = 0xcfdccf;
      c.addChild(s);
    }
    return c;
  });
  scene.addChild(trees.container);

  // --- Near trees: big foreground trees framing the scene ---
  const nearTrees = createParallaxLayer(width, 0.85, () => {
    const c = new Container();
    for (let i = 0; i < 3; i++) {
      const s = placeDeco(
        treeFrameSets,
        100 + Math.random() * (width - 200),
        groundY + GROUND_H * 0.25,
        height * (0.36 + Math.random() * 0.08),
        0.92,
      );
      c.addChild(s);
    }
    return c;
  });
  scene.addChild(nearTrees.container);

  // --- Near bushes: foreground, full speed (factor 1.0) ---
  const bushes = createParallaxLayer(width, 1.0, () => {
    const c = new Container();
    for (let i = 0; i < 5; i++) {
      const s = placeDeco(
        bushFrameSets,
        40 + Math.random() * (width - 80),
        groundY + GROUND_H * 0.4,
        height * (0.1 + Math.random() * 0.04),
        0.82,
      );
      c.addChild(s);
    }
    return c;
  });
  scene.addChild(bushes.container);

  // --- Falling leaves: a small recycled particle pool ---
  const leafLayer = new Container();
  const leaves: {
    sprite: Graphics;
    vy: number;
    swayAmp: number;
    swaySpeed: number;
    phase: number;
    rotSpeed: number;
  }[] = [];
  for (let i = 0; i < 12; i++) {
    const color = LEAF_COLORS[i % LEAF_COLORS.length];
    const sprite = new Graphics().ellipse(0, 0, 7, 3.5).fill(color);
    sprite.x = Math.random() * width;
    sprite.y = Math.random() * height;
    leafLayer.addChild(sprite);
    leaves.push({
      sprite,
      vy: 20 + Math.random() * 30,
      swayAmp: 12 + Math.random() * 18,
      swaySpeed: 1 + Math.random() * 1.5,
      phase: Math.random() * TAU,
      rotSpeed: (Math.random() - 0.5) * 3,
    });
  }
  scene.addChild(leafLayer);

  const knightScreenX = width * 0.18;

  // --- Stations: project landmarks along the road (behind the knight) ---
  const stations = await createStations(knightScreenX, groundY, height * 0.3);
  scene.addChild(stations.container);

  // --- Knight: anchored bottom-left, standing on the ground line ---
  const knight = await createKnight(height * 0.42);
  knight.container.x = knightScreenX;
  knight.setGround(groundY);
  scene.addChild(knight.container);

  app.stage.addChild(scene);

  // --- Per-frame update -----------------------------------------------------
  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;
    advanceWorld(dt);

    const sky = sampleDayNight(worldState.timeOfDay);
    daySky.alpha = sky.dayAlpha;
    nightSky.alpha = sky.nightAlpha;
    stars.alpha = sky.starAlpha;

    sun.position.set(sky.sun.nx * width, sky.sun.ny * height);
    sun.alpha = sky.sun.alpha;
    moon.position.set(sky.moon.nx * width, sky.moon.ny * height);
    moon.alpha = sky.moon.alpha;

    // Clouds dim toward gray at night, drift right and wrap around.
    const cloudTint = lerpColor(0x5a6478, 0xffffff, sky.daylight);
    for (const c of clouds) {
      c.sprite.tint = cloudTint;
      c.sprite.x += c.vx * dt;
      if (c.sprite.x - c.halfW > width) c.sprite.x = -c.halfW;
    }

    // Birds flap (scale.y wobble) and cross, wrapping off the right edge.
    for (const b of birds) {
      b.flap += b.flapSpeed * dt;
      b.g.scale.y = 0.6 + Math.sin(b.flap) * 0.4;
      b.g.x += b.vx * dt;
      if (b.g.x > width + 20) {
        b.g.x = -20;
        b.g.y = height * (0.15 + Math.random() * 0.15);
      }
    }

    // Parallax layers slide left as the world advances (each at its own depth).
    hillsFar.update();
    hillsNear.update();
    castle.update();
    trees.update();
    nearTrees.update();
    bushes.update();
    stations.update();

    // Trees/bushes sway: pick the current frame from each instance's own
    // sprite sheet, offset by its random phase so they don't move in lockstep.
    for (const d of decos) {
      const idx = Math.floor((elapsed + d.phase) * DECO_FPS) % d.frames.length;
      d.sprite.texture = d.frames[idx];
    }

    // Leaves fall + sway, respawning at the top once off-screen.
    for (const leaf of leaves) {
      leaf.phase += leaf.swaySpeed * dt;
      leaf.sprite.y += leaf.vy * dt;
      leaf.sprite.x += Math.sin(leaf.phase) * leaf.swayAmp * dt;
      leaf.sprite.rotation += leaf.rotSpeed * dt;
      if (leaf.sprite.y > height + 10) {
        leaf.sprite.y = -10;
        leaf.sprite.x = Math.random() * width;
      }
    }

    knight.update(dt);
  };

  return { container: scene, update };
}
