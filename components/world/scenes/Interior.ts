import { Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { getTex, sliceFrames, TILE } from "@/components/world/tiles";
import { hash, noise } from "@/components/world/Tilemap";
import { SPRITE_TRIM } from "@/components/world/spriteTrim";
import * as props from "@/components/world/props";
import projects from "@/lib/data/projects.json";
import experience from "@/lib/data/experience.json";
import skills from "@/lib/data/skills.json";

/**
 * Walk-in rooms behind each building's door. Floors and walls are painted at
 * 2px "art pixels" like the roads outside; furniture is crisp pixel-rect
 * drawing plus Tiny Swords sprites. Each interactive prop opens a panel.
 */

const U = "/pixel/units";
const PROJECT_IMAGES = (projects as { image?: string }[]).map((p) => p.image).filter((x): x is string => !!x);
export const INTERIOR_URLS = [
  "/pixel/ui/icon_sword.png",
  "/pixel/ui/icon_coin.png",
  "/avatar.webp",
  "/pixel/knight/Raven_Idle.png",
  `${U}/monk_idle.png`,
  `${U}/blue_archer_idle.png`,
  `${U}/pawn_red_idle.png`,
  ...PROJECT_IMAGES,
];

export type Hotspot = { x: number; y: number; id: string; label: string; action: string };
export type Room = {
  id: string;
  container: Container;
  /** Depth-sorted layer the hero is moved into while inside. */
  entities: Container;
  /** Room size in world px (floor + back wall), for camera framing. */
  width: number;
  height: number;
  /** Where the hero appears when walking in (just inside the door). */
  spawn: { x: number; y: number };
  canWalk: (x: number, y: number) => boolean;
  /** True once the hero has stepped out through the door gap. */
  isExit: (x: number, y: number) => boolean;
  hotspots: Hotspot[];
  /** Per-frame: frame animations and torch flicker. */
  update: (t: number) => void;
};

type Floor = "wood" | "stone";
type Wall = "stone" | "wood";
type RoomDef = { w: number; h: number; floor: Floor; wall: Wall; accent: number; rug?: boolean };

const ROOMS: Record<string, RoomDef> = {
  sanctum: { w: 11, h: 6, floor: "stone", wall: "stone", accent: 0x3b6fb6, rug: true },
  chronicles: { w: 11, h: 6, floor: "wood", wall: "wood", accent: 0xb5473a, rug: true },
  relics: { w: 13, h: 6, floor: "stone", wall: "stone", accent: 0x7c4fa3, rug: true },
  armory: { w: 12, h: 6, floor: "wood", wall: "stone", accent: 0xc79a2e },
  testimonies: { w: 10, h: 6, floor: "wood", wall: "wood", accent: 0xc79a2e, rug: true },
  contact: { w: 9, h: 6, floor: "stone", wall: "stone", accent: 0x3b6fb6 },
};

export const hasInterior = (id: string) => id in ROOMS;

const PX = 2;
const WALL_ROWS = 2; // back wall height in tiles
const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255] as const;
const shade = (c: number, k: number) => {
  const [r, g, b] = rgb(c);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
};

/** Paints floor, back wall, rug and trims into one nearest-filtered sprite. */
function paintRoom(def: RoomDef): Sprite {
  const W = def.w * TILE;
  const H = def.h * TILE;
  const wallH = WALL_ROWS * TILE;
  const w = W / PX;
  const h = H / PX;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const put = (k: number, c: number, a = 255) => {
    img.data[k * 4] = (c >> 16) & 255; img.data[k * 4 + 1] = (c >> 8) & 255; img.data[k * 4 + 2] = c & 255; img.data[k * 4 + 3] = a;
  };
  const rugX0 = W / 2 - TILE * 1.1;
  const rugX1 = W / 2 + TILE * 1.1;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const k = py * w + px;
      const x = px * PX;
      const y = py * PX;
      const r = hash(px, py);
      let c: number;
      if (y < wallH) {
        // Back wall: crown moulding, brick or plank face, dark baseboard.
        if (y < 8) c = 0x2a2018;
        else if (y > wallH - 10) c = y > wallH - 4 ? 0x1c140e : 0x4a3424;
        else if (def.wall === "stone") {
          const row = Math.floor((y - 8) / 14);
          const off = (row & 1) * 14;
          const u = (x + off) % 28;
          const v = (y - 8) % 14;
          const base = [0x8995a3, 0x7f8b99, 0x929eab][Math.floor(hash(Math.floor((x + off) / 28), row) * 3)];
          c = u < PX || v < PX ? 0x5b6470 : v < PX * 2 ? shade(base, 1.12) : base;
          if (r < 0.05) c = shade(c, 0.9);
        } else {
          const plank = Math.floor(x / 20);
          const u = x % 20;
          const base = [0x8a5a34, 0x93633a, 0x7e5230][Math.floor(hash(plank, 3) * 3)];
          c = u < PX ? 0x5a3a20 : u < PX * 2 ? shade(base, 1.1) : base;
          if (noise(x, y, 6) > 0.72) c = shade(c, 0.93);
        }
        // light falloff toward the floor
        c = shade(c, 0.86 + 0.14 * (1 - y / wallH));
      } else {
        const fy = y - wallH;
        if (def.floor === "wood") {
          const row = Math.floor(fy / 16);
          const off = Math.floor(hash(row, 1) * 5) * 24;
          const seg = Math.floor((x + off) / 96);
          const v = fy % 16;
          const u = (x + off) % 96;
          const base = [0x9a6a3e, 0x8f6038, 0xa27244][Math.floor(hash(seg, row) * 3)];
          c = v < PX || u < PX ? 0x5e3d22 : v < PX * 2 ? shade(base, 1.08) : base;
          if (r < 0.04) c = shade(c, 0.88);
        } else {
          const ty = Math.floor(fy / 32);
          const tx = Math.floor(x / 32);
          const u = x % 32;
          const v = fy % 32;
          const base = [0x6f7684, 0x777e8c, 0x687080][Math.floor(hash(tx, ty) * 3)];
          c = u < PX || v < PX ? 0x4d5360 : u < PX * 2 || v < PX * 2 ? shade(base, 1.1) : base;
          if (r < 0.05) c = shade(c, 0.92);
        }
        // Rug runner from the door to the back wall.
        if (def.rug && x >= rugX0 && x < rugX1 && fy > 10 && y < H - 6) {
          const edge = x < rugX0 + 6 || x >= rugX1 - 6;
          const band = x < rugX0 + 12 || x >= rugX1 - 12;
          c = edge ? shade(def.accent, 0.55) : band ? 0xd9b45a : ((Math.floor(fy / 8) + Math.floor(x / 8)) & 1 ? def.accent : shade(def.accent, 0.88));
        }
        // Soft shadow cast by the back wall.
        if (fy < 22) c = shade(c, 0.72 + 0.28 * (fy / 22));
      }
      put(k, c);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = "nearest";
  const s = new Sprite(tex);
  s.width = W;
  s.height = H;
  return s;
}

/** Pixel-rect helper: every coordinate is snapped to the 2px art grid. */
const box = (g: Graphics, x: number, y: number, w: number, h: number, color: number) =>
  g.rect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, Math.round(w / PX) * PX, Math.round(h / PX) * PX).fill(color);

const labelStyle = new TextStyle({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 7,
  fill: "#f6c75a",
  align: "center",
  stroke: { color: "#000000", width: 3, join: "round" },
});

export function buildInterior(id: string, fireFrames: Texture[], lancerFrames: Texture[]): Room {
  const def = ROOMS[id];
  const W = def.w * TILE;
  const H = def.h * TILE;
  const wallH = WALL_ROWS * TILE;
  const container = new Container();
  const entities = new Container();
  entities.sortableChildren = true;
  const labels = new Container();
  const glows: { g: Graphics; phase: number }[] = [];
  const anims: { s: Sprite; frames: Texture[]; fps: number; phase: number }[] = [];
  const blockers: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const hotspots: Hotspot[] = [];

  // Frame: dark surround so the room reads as a lit box in the void.
  const frame = new Graphics();
  box(frame, -4000, -4000, W + 8000, H + 8000, 0x0b0806);
  box(frame, -16, -12, W + 32, H + 28, 0x120c08);
  box(frame, -6, -4, W + 12, H + 10, 0x3a2a1c);
  container.addChild(frame);
  container.addChild(paintRoom(def));
  // Front wall stubs either side of the door gap.
  const doorHalf = TILE * 0.9;
  const fw = new Graphics();
  box(fw, 0, H - 10, W / 2 - doorHalf, 10, 0x2a1e14);
  box(fw, W / 2 + doorHalf, H - 10, W / 2 - doorHalf, 10, 0x2a1e14);
  box(fw, 0, H - 12, W / 2 - doorHalf, 2, 0x5a4230);
  box(fw, W / 2 + doorHalf, H - 12, W / 2 - doorHalf, 2, 0x5a4230);
  // Doormat + light spill at the threshold.
  box(fw, W / 2 - doorHalf + 6, H - 8, doorHalf * 2 - 12, 12, 0x6b4a2a);
  container.addChild(fw);
  container.addChild(entities, labels);

  const block = (x: number, y: number, w: number, h: number) => blockers.push({ x0: x, y0: y, x1: x + w, y1: y + h });
  const label = (text: string, x: number, y: number) => {
    const t = new Text({ text, style: labelStyle });
    t.anchor.set(0.5, 1);
    t.x = x;
    t.y = y;
    labels.addChild(t);
  };
  const hotspot = (x: number, y: number, spot: Omit<Hotspot, "x" | "y">) => hotspots.push({ x, y, ...spot });
  const sorted = (c: Container, feetY: number) => {
    c.zIndex = feetY;
    entities.addChild(c);
    return c;
  };

  // ── Furniture kit ───────────────────────────────────────────────────────
  const torch = (x: number) => {
    const g = new Graphics();
    box(g, x - 3, wallH - 70, 6, 18, 0x4a3424);
    box(g, x - 6, wallH - 54, 12, 4, 0x2a2018);
    container.addChildAt(g, 2);
    const f = new Sprite(fireFrames[0]);
    f.anchor.set(0.5, 1);
    f.width = f.height = 34;
    f.x = x;
    f.y = wallH - 64;
    container.addChildAt(f, 3);
    anims.push({ s: f, frames: fireFrames, fps: 12, phase: Math.random() * 2 });
    const glow = new Graphics();
    for (const [r, a] of [[70, 0.05], [44, 0.07], [24, 0.1]] as const) glow.circle(0, 0, r).fill({ color: 0xffa040, alpha: a });
    glow.x = x;
    glow.y = wallH - 76;
    glow.blendMode = "add";
    container.addChildAt(glow, 3);
    glows.push({ g: glow, phase: Math.random() * 6 });
  };
  const banner = (x: number, color: number) => {
    const g = new Graphics();
    box(g, x - 26, 14, 52, 4, 0x3a2a1c);
    box(g, x - 20, 18, 40, 70, color);
    box(g, x - 20, 18, 4, 70, shade(color, 0.75));
    box(g, x - 20, 80, 12, 14, color);
    box(g, x + 8, 80, 12, 14, color);
    box(g, x - 8, 84, 16, 4, shade(color, 0.75));
    box(g, x - 8, 34, 16, 16, 0xd9b45a);
    box(g, x - 4, 38, 8, 8, shade(color, 0.7));
    container.addChildAt(g, 2);
  };
  const windowPane = (x: number) => {
    const g = new Graphics();
    box(g, x - 22, 22, 44, 62, 0x3a2a1c);
    box(g, x - 18, 26, 36, 54, 0x9fd3e6);
    box(g, x - 18, 26, 36, 10, 0xc8eaf5);
    box(g, x - 2, 26, 4, 54, 0x3a2a1c);
    box(g, x - 18, 50, 36, 4, 0x3a2a1c);
    container.addChildAt(g, 2);
    const light = new Graphics().poly([x - 18, 84, x + 18, 84, x + 46, wallH + 70, x - 6, wallH + 70]).fill({ color: 0xfff2c0, alpha: 0.08 });
    light.blendMode = "add";
    container.addChildAt(light, 2);
  };
  const bookshelf = (x: number, seed: number) => {
    const g = new Graphics();
    const bx = x - 32;
    const by = wallH - 96;
    box(g, bx - 2, by - 6, 68, 8, 0x2a1a10); // crown moulding
    box(g, bx, by - 4, 64, 4, 0x7a4f2c);
    box(g, bx, by, 64, 100, 0x2a1a10);
    box(g, bx + 2, by + 2, 60, 96, 0x6b4426);
    box(g, bx + 2, by + 2, 4, 96, 0x8a5a34); // lit left side
    box(g, bx + 58, by + 2, 4, 96, 0x4a2e18); // shaded right side
    box(g, bx + 6, by + 4, 52, 90, 0x24160c); // back panel
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = by + 6 + shelf * 30;
      let cx = bx + 8;
      let n = 0;
      while (cx < bx + 54) {
        const bw = 4 + Math.floor(hash(cx, seed + shelf) * 3) * 2;
        const bh = 16 + Math.floor(hash(seed, cx + shelf) * 5) * 2;
        const col = [0xa33b32, 0x3b6fb6, 0xc79a2e, 0x4f8a3a, 0x7c4fa3, 0xd9cfb8, 0x8a5a34][Math.floor(hash(cx * 3, seed + shelf) * 7)];
        if (cx + bw > bx + 56) break;
        // every so often a book leans on its neighbour
        const lean = n > 0 && hash(cx, seed * 5 + shelf) < 0.15;
        box(g, cx, sy + 24 - bh + (lean ? 4 : 0), bw, bh - (lean ? 4 : 0), col);
        box(g, cx, sy + 24 - bh + (lean ? 4 : 0), bw, 2, shade(col, 1.3));
        box(g, cx, sy + 14, bw, 2, shade(col, 0.7)); // spine band
        cx += bw + (hash(cx, 7) < 0.2 ? 4 : 2);
        n++;
      }
      box(g, bx + 6, sy + 24, 52, 4, 0x8a5a34);
      box(g, bx + 6, sy + 28, 52, 2, 0x3a2414);
    }
    // a candle on top
    box(g, x + 14, by - 18, 4, 12, 0xe8e0d0);
    box(g, x + 14, by - 22, 4, 4, 0xffc040);
    sorted(g, wallH + 2);
    block(bx, wallH - 4, 64, 12);
  };
  const table = (x: number, y: number, w: number, papers = true) => {
    const g = props.table(new Graphics(), w, papers);
    g.x = x;
    g.y = y + 16;
    sorted(g, y + 16);
    block(x - w / 2, y - 14, w, 26);
  };
  const barrel = (x: number, y: number) => {
    const g = props.barrel();
    g.x = x;
    g.y = y;
    sorted(g, y);
    block(x - 14, y - 12, 28, 12);
  };
  /** Any props.* drawing, feet at (x, y), blocking `bw` px of floor. */
  const prop = (g: Graphics, x: number, y: number, bw = 28) => {
    g.x = x;
    g.y = y;
    sorted(g, y);
    block(x - bw / 2, y - 12, bw, 12);
  };
  const npc = (frames: Texture[], url: string, x: number, y: number, flip = false, fw = 192) => {
    const t = SPRITE_TRIM[url] ?? { ax: 0.5, ay: 0.7 };
    const s = new Sprite(frames[0]);
    s.anchor.set(t.ax, t.ay);
    s.width = s.height = fw * (88 / 192);
    if (flip) s.scale.x *= -1;
    s.x = x;
    s.y = y;
    const sh = new Graphics().ellipse(x, y, 14, 5).fill({ color: 0, alpha: 0.25 });
    sh.zIndex = y - 1;
    entities.addChild(sh);
    sorted(s, y);
    anims.push({ s, frames, fps: 8, phase: Math.random() * 3 });
    block(x - 12, y - 8, 24, 10);
  };
  /** A framed picture on an easel (projects) or on the wall (portrait). */
  const picture = (img: Texture, x: number, y: number, fw: number, fh: number, onEasel: boolean, focusY = 0.5) => {
    const g = new Graphics();
    if (onEasel) {
      box(g, x - fw / 2 + 4, y - 10, 6, 34, 0x5e3d22);
      box(g, x + fw / 2 - 10, y - 10, 6, 34, 0x5e3d22);
      box(g, x - 3, y - 16, 6, 40, 0x4a3020);
    }
    box(g, x - fw / 2 - 6, y - fh - 6, fw + 12, fh + 12, 0xb8862a);
    box(g, x - fw / 2 - 6, y - fh - 6, fw + 12, 3, 0xe6c060);
    box(g, x - fw / 2 - 2, y - fh - 2, fw + 4, fh + 4, 0x3a2a1c);
    // Photos and screenshots are smoothed, not pixel-snapped, so faces and UI don't go jaggy.
    img.source.scaleMode = "linear";
    const s = new Sprite(img);
    // cover-fit, centred on the subject
    const k = Math.max(fw / img.width, fh / img.height);
    s.scale.set(k);
    s.x = x - fw / 2 - (img.width * k - fw) / 2;
    s.y = y - fh - (img.height * k - fh) * focusY;
    const mask = new Graphics().rect(x - fw / 2, y - fh, fw, fh).fill(0xffffff);
    s.mask = mask;
    const c = new Container();
    c.addChild(g, s, mask);
    return c;
  };
  const rack = (x: number, title: string) => {
    const g = new Graphics();
    const y = wallH - 6;
    box(g, x - 36, y - 78, 72, 80, 0x2a1a10);
    box(g, x - 34, y - 76, 6, 76, 0x6b4426);
    box(g, x + 28, y - 76, 6, 76, 0x6b4426);
    box(g, x - 34, y - 76, 2, 76, 0x8a5a34);
    for (const yy of [y - 70, y - 34]) {
      box(g, x - 34, yy, 68, 6, 0x7a4f2c);
      box(g, x - 34, yy, 68, 2, 0x9a6a3e);
      for (const px of [x - 20, x - 2, x + 16]) box(g, px, yy - 4, 4, 4, 0x4b4b55);
    }
    const c = new Container();
    c.addChild(g);
    const sword = getTex("/pixel/ui/icon_sword.png");
    for (let i = 0; i < 3; i++) {
      const s = new Sprite(sword);
      s.anchor.set(0.5);
      s.width = s.height = 30;
      s.x = x - 18 + i * 18;
      s.y = y - 46;
      s.rotation = -0.8 + i * 0.1;
      c.addChild(s);
    }
    sorted(c, y + 4);
    block(x - 34, y - 6, 68, 12);
    label(title.toUpperCase(), x, y - 82);
    hotspot(x, y + 24, { id: "armory", label: `Skills · ${title}`, action: "Inspect" });
  };
  const plaque = (x: number, title: string, sub: string, color: number) => {
    const g = new Graphics();
    box(g, x - 60, 22, 120, 72, 0x2a1a10);
    box(g, x - 56, 26, 112, 64, 0x6e4a2c);
    box(g, x - 56, 26, 112, 18, color);
    box(g, x - 56, 44, 112, 2, shade(color, 0.6));
    container.addChildAt(g, 2);
    const t1 = new Text({ text: title.toUpperCase(), style: new TextStyle({ fontFamily: "'Press Start 2P', monospace", fontSize: 8, fill: "#fff3d6" }) });
    t1.anchor.set(0.5, 0);
    t1.x = x; t1.y = 31;
    const t2 = new Text({ text: sub, style: new TextStyle({ fontFamily: "'Press Start 2P', monospace", fontSize: 7, fill: "#f6e2b8", align: "center", lineHeight: 12 }) });
    t2.anchor.set(0.5, 0);
    t2.x = x; t2.y = 54;
    container.addChildAt(t1, 3);
    container.addChildAt(t2, 3);
  };

  // ── Room-specific dressing ───────────────────────────────────────────────
  const cx = W / 2;
  const floorY = (r: number) => wallH + r * TILE;
  torch(TILE * 1.2);
  torch(W - TILE * 1.2);

  if (id === "sanctum") {
    banner(cx - TILE * 2.2, def.accent);
    banner(cx + TILE * 2.2, def.accent);
    // Portrait on the back wall above a throne.
    const portrait = picture(getTex("/avatar.webp"), cx, wallH - 20, 64, 72, false, 0.35);
    container.addChild(portrait);
    const th = new Graphics();
    const ty = floorY(0.2);
    box(th, cx - 22, ty - 6, 44, 64, 0x8a6a2a); // tall gilded back
    box(th, cx - 18, ty - 2, 36, 56, 0x2f4f8f);
    box(th, cx - 12, ty + 4, 24, 44, 0x3b6fb6);
    box(th, cx - 6, ty - 12, 12, 8, 0xd9b45a); // crest
    box(th, cx - 34, ty + 38, 68, 10, 0xd9b45a); // seat
    box(th, cx - 34, ty + 30, 10, 26, 0x8a6a2a); // armrests
    box(th, cx + 24, ty + 30, 10, 26, 0x8a6a2a);
    box(th, cx - 28, ty + 48, 56, 14, 0x6e4f1f); // base
    box(th, cx - 28, ty + 60, 56, 4, 0x3a2a1c);
    sorted(th, ty + 64);
    block(cx - 34, ty + 40, 68, 26);
    label("ABOUT AMAN", cx, floorY(0.2) - 16);
    hotspot(cx, floorY(1.75), { id: "sanctum", label: "The Sanctum · About", action: "Read" });
    npc(lancerFrames, `${U}/blue_lancer_idle.png`, cx - TILE * 1.7, floorY(1.3), false, 320);
    npc(lancerFrames, `${U}/blue_lancer_idle.png`, cx + TILE * 1.7, floorY(1.3), true, 320);
    bookshelf(TILE * 2.6, 3);
    bookshelf(W - TILE * 2.6, 7);
    prop(props.plant(), TILE * 0.7, floorY(3.6), 22);
    prop(props.plant(), W - TILE * 0.7, floorY(3.6), 22);
  } else if (id === "chronicles") {
    const jobs = experience as { company: string; period: string }[];
    jobs.forEach((j, i) => {
      const x = cx + (i - (jobs.length - 1) / 2) * TILE * 2.6;
      plaque(x, j.company, j.period.replace(" — ", "\n"), def.accent);
      hotspot(x, floorY(0.7), { id: "chronicles", label: `Experience · ${j.company}`, action: "Read" });
    });
    label("WORK HISTORY", cx, 18);
    table(cx + TILE * 2.6, floorY(2.6), TILE * 2.2);
    npc(sliceFrames(getTex(`${U}/pawn_red_idle.png`), 192, 192), `${U}/pawn_red_idle.png`, cx - TILE * 2.4, floorY(2.4));
    barrel(TILE * 0.8, floorY(3.4));
    barrel(TILE * 1.4, floorY(3.7));
    prop(props.crate(), TILE * 0.9, floorY(2.5), 32);
    bookshelf(W - TILE * 0.9, 11);
    prop(props.plant(), W - TILE * 0.7, floorY(3.6), 22);
  } else if (id === "relics") {
    const list = projects as { id: string; title: string; image?: string }[];
    list.forEach((p, i) => {
      const n = list.length;
      const x = TILE * 1.6 + i * ((W - TILE * 3.2) / (n - 1));
      const arc = Math.abs(i - (n - 1) / 2);
      const y = floorY(1.2 + (2 - arc) * 0.25);
      if (p.image) sorted(picture(getTex(p.image), x, y, 84, 52, true), y + 24);
      block(x - 46, y - 4, 92, 26);
      label(p.title.toUpperCase(), x, y - 64);
      hotspot(x, y + 36, { id: `relic:${p.id}`, label: `Project · ${p.title}`, action: "Inspect" });
    });
    banner(TILE * 3.2, def.accent);
    banner(W - TILE * 3.2, def.accent);
    npc(sliceFrames(getTex(`${U}/monk_idle.png`), 192, 192), `${U}/monk_idle.png`, TILE * 1.2, floorY(3.3));
    prop(props.chest(), W - TILE * 1.5, floorY(3.2), 36);
    prop(props.crate(new Graphics(), 26, 22), W - TILE * 0.7, floorY(2.4), 26);
    const coin = getTex("/pixel/ui/icon_coin.png");
    for (const [x, y] of [[W - TILE * 1.2, floorY(3.3)], [W - TILE * 1.6, floorY(3.6)]]) {
      const s = new Sprite(coin);
      s.anchor.set(0.5, 1);
      s.width = s.height = 26;
      s.x = x; s.y = y;
      sorted(s, y);
    }
  } else if (id === "armory") {
    const cats = (skills as { category: string }[]).map((s) => s.category);
    const short = (c: string) => (c.startsWith("Gen AI") ? "AI & Infra" : c);
    cats.forEach((c, i) => rack(TILE * 1.5 + i * ((W - TILE * 3) / (cats.length - 1)), short(c)));
    label("THE STACK", cx, 18);
    npc(sliceFrames(getTex(`${U}/blue_archer_idle.png`), 192, 192), `${U}/blue_archer_idle.png`, cx + TILE * 2.6, floorY(2.6), true);
    barrel(TILE * 0.8, floorY(3.5));
    barrel(W - TILE * 0.8, floorY(3.5));
    table(cx - TILE * 2.4, floorY(2.8), TILE * 2, false);
    prop(props.shieldStand(new Graphics(), 0x3b6fb6), TILE * 1.1, floorY(2.2), 26);
    prop(props.shieldStand(new Graphics(), 0xb5473a), W - TILE * 1.1, floorY(2.2), 26);
    prop(props.crate(), cx + TILE * 1.2, floorY(3.6), 32);
  } else if (id === "testimonies") {
    // Hearth on the back wall.
    const hg = new Graphics();
    box(hg, cx - 50, 28, 100, wallH - 28, 0x3a3634);
    for (let row = 0; row * 12 + 30 < wallH - 4; row++) {
      for (let k = -1; k < 6; k++) {
        const x0 = cx - 48 + k * 20 + (row % 2) * 10;
        const x1 = Math.min(x0 + 18, cx + 48);
        if (x1 <= cx - 48) continue;
        const xa = Math.max(x0, cx - 48);
        const tone = [0x7d7976, 0x8a8682, 0x726e6b][Math.floor(hash(k + 9, row) * 3)];
        box(hg, xa, 30 + row * 12, x1 - xa, 10, tone);
        box(hg, xa, 30 + row * 12, x1 - xa, 2, 0x9e9a96);
      }
    }
    box(hg, cx - 56, 26, 112, 8, 0x5e3d22); // mantle
    box(hg, cx - 56, 26, 112, 2, 0x8a5a34);
    box(hg, cx - 32, wallH - 58, 64, 56, 0x140c08); // firebox
    box(hg, cx - 32, wallH - 58, 64, 4, 0x3a3634);
    box(hg, cx - 22, wallH - 12, 44, 6, 0x6b4426); // logs
    box(hg, cx - 16, wallH - 16, 32, 4, 0x8a5a34);
    container.addChildAt(hg, 2);
    const fire = new Sprite(fireFrames[0]);
    fire.anchor.set(0.5, 1);
    fire.width = fire.height = 72;
    fire.x = cx; fire.y = wallH - 6;
    container.addChildAt(fire, 3);
    anims.push({ s: fire, frames: fireFrames, fps: 12, phase: 0 });
    for (let i = 0; i < 2; i++) {
      const x = cx + (i === 0 ? -1 : 1) * TILE * 2.4;
      const g = new Graphics();
      box(g, x - 24, 30, 48, 58, 0xb8862a);
      box(g, x - 20, 34, 40, 50, 0xeadcc0);
      for (let l = 0; l < 6; l++) box(g, x - 14, 42 + l * 7, l === 5 ? 16 : 28, 2, 0x8a7a60);
      container.addChildAt(g, 2);
      hotspot(x, floorY(0.7), { id: "testimonies", label: "Letters of praise", action: "Read" });
    }
    hotspot(cx, floorY(0.7), { id: "testimonies", label: "Letters of praise", action: "Read" });
    label("KIND WORDS", cx, 18);
    table(cx + TILE * 2.6, floorY(2.4), TILE * 2);
    barrel(TILE * 0.9, floorY(3.4));
    prop(props.plant(), TILE * 0.7, floorY(1.2), 22);
    prop(props.plant(), W - TILE * 0.7, floorY(3.6), 22);
  } else if (id === "contact") {
    windowPane(cx);
    table(cx, floorY(1.6), TILE * 2.2);
    const ravenFrames = sliceFrames(getTex("/pixel/knight/Raven_Idle.png"), 192, 192);
    const raven = new Sprite(ravenFrames[0]);
    const rt = SPRITE_TRIM["/pixel/knight/Raven_Idle.png"];
    raven.anchor.set(rt.ax, rt.ay);
    raven.width = raven.height = 64;
    raven.x = cx + TILE * 0.7;
    raven.y = floorY(1.6) - 26;
    sorted(raven, floorY(1.6) + 15);
    anims.push({ s: raven, frames: ravenFrames, fps: 6, phase: 0 });
    label("SEND WORD", cx, floorY(1.6) - 40);
    hotspot(cx, floorY(2.1), { id: "contact", label: "Contact Spire · Write", action: "Write" });
    bookshelf(W - TILE * 1.1, 19);
    barrel(TILE * 0.8, floorY(3.4));
    prop(props.crate(new Graphics(), 26, 22), TILE * 1.4, floorY(3.6), 26);
    prop(props.plant(), W - TILE * 0.7, floorY(3.6), 22);
  }

  // The door: walkable gap in the front wall, a step outside counts as leaving.
  const doorX0 = W / 2 - doorHalf;
  const doorX1 = W / 2 + doorHalf;
  const canWalk = (x: number, y: number) => {
    if (x < 6 || x > W - 6) return false;
    if (y < wallH + 10) return false;
    if (y > H - 4 && !(x > doorX0 + 4 && x < doorX1 - 4 && y < H + 40)) return false;
    return !blockers.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
  };

  return {
    id,
    container,
    entities,
    width: W,
    height: H,
    spawn: { x: W / 2, y: H - 20 },
    canWalk,
    isExit: (x, y) => y > H + 12,
    hotspots,
    update: (t) => {
      for (const a of anims) a.s.texture = a.frames[Math.floor((t + a.phase) * a.fps) % a.frames.length];
      for (const gl of glows) gl.g.alpha = 0.75 + 0.25 * Math.sin(t * 6 + gl.phase);
    },
  };
}
