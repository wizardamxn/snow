import { Graphics } from "pixi.js";

/**
 * Hand-pixelled props shared by the town and the interiors. Every shape is
 * snapped to 2px "art pixels" so props match the painted roads and floors.
 * Each function draws with its feet (bottom-centre) at (0,0); the caller
 * positions it and sets zIndex = feet y for depth sorting.
 */

const PX = 2;
const snap = (v: number) => Math.round(v / PX) * PX;
export const px = (g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1) =>
  g.rect(snap(x), snap(y), Math.max(PX, snap(w)), Math.max(PX, snap(h))).fill({ color, alpha });

const OUTLINE = 0x2a1a10;
const shadow = (g: Graphics, w: number) => g.ellipse(0, -1, w / 2, w / 7).fill({ color: 0, alpha: 0.22 });

export function barrel(g = new Graphics()) {
  shadow(g, 32);
  px(g, -14, -36, 28, 36, OUTLINE);
  px(g, -12, -34, 24, 32, 0x8a5a34);
  for (const x of [-8, -2, 4]) px(g, x, -34, 2, 32, 0x744a2a); // staves
  px(g, -12, -34, 4, 32, 0xa87444); // highlight
  for (const y of [-30, -12]) {
    px(g, -14, y, 28, 4, 0x4b4b55);
    px(g, -12, y, 8, 2, 0x8d8d99);
  }
  px(g, -10, -38, 20, 4, OUTLINE);
  px(g, -8, -38, 16, 2, 0xb88850); // lid
  return g;
}

export function crate(g = new Graphics(), w = 32, h = 28) {
  shadow(g, w + 4);
  px(g, -w / 2, -h, w, h, OUTLINE);
  px(g, -w / 2 + 2, -h + 2, w - 4, h - 4, 0x9a6a3e);
  px(g, -w / 2 + 2, -h + 2, w - 4, 4, 0xb8854e);
  px(g, -w / 2 + 2, -6, w - 4, 4, 0x7a4f2c);
  // diagonal brace, stair-stepped
  const steps = Math.floor((w - 8) / 4);
  for (let i = 0; i < steps; i++) px(g, -w / 2 + 4 + i * 4, -h + 6 + i * ((h - 12) / steps), 4, 4, 0x6b4426);
  for (const [x, y] of [[-w / 2 + 4, -h + 4], [w / 2 - 6, -h + 4], [-w / 2 + 4, -6], [w / 2 - 6, -6]]) px(g, x, y, 2, 2, 0x3a3a40);
  return g;
}

/** A plank table seen from the front; `items` puts a book, candle, paper and mug on it. */
export function table(g = new Graphics(), w = 96, items = true) {
  shadow(g, w + 8);
  // legs
  for (const x of [-w / 2 + 6, w / 2 - 12]) {
    px(g, x, -22, 6, 22, OUTLINE);
    px(g, x + 2, -22, 2, 20, 0x6b4426);
  }
  // top, with plank seams and grain
  px(g, -w / 2, -34, w, 14, OUTLINE);
  px(g, -w / 2 + 2, -32, w - 4, 10, 0x9a6a3e);
  px(g, -w / 2 + 2, -32, w - 4, 2, 0xc08a52);
  for (let x = -w / 2 + 24; x < w / 2 - 8; x += 22) px(g, x, -32, 2, 10, 0x7a4f2c);
  px(g, -w / 2 + 2, -22, w - 4, 2, 0x5e3d22);
  if (items) {
    // book
    px(g, -w / 2 + 8, -40, 20, 8, OUTLINE);
    px(g, -w / 2 + 10, -40, 16, 6, 0xa33b32);
    px(g, -w / 2 + 10, -36, 16, 2, 0xe8dcc0);
    // paper + quill
    px(g, -6, -38, 18, 6, 0xf2e6cc);
    px(g, -2, -36, 10, 2, 0x8a7a60);
    px(g, 10, -46, 2, 10, 0xe8e0d0);
    // candle
    px(g, w / 2 - 24, -48, 6, 16, 0xe8e0d0);
    px(g, w / 2 - 24, -52, 6, 4, 0xffc040);
    px(g, w / 2 - 22, -54, 2, 2, 0xfff0a0);
    // mug
    px(g, w / 2 - 14, -42, 8, 10, 0x8d8d99);
    px(g, w / 2 - 6, -40, 2, 6, 0x8d8d99);
  }
  return g;
}

/** A market stall: posts, a striped canopy with a scalloped hem, and a counter of goods. */
export function stall(g = new Graphics(), stripe = 0xb5473a, goods: "fruit" | "bread" | "pots" = "fruit") {
  const w = 104;
  shadow(g, w + 10);
  // back posts
  for (const x of [-w / 2 + 4, w / 2 - 10]) px(g, x, -84, 6, 84, 0x5e3d22);
  // counter
  px(g, -w / 2, -34, w, 34, OUTLINE);
  px(g, -w / 2 + 2, -32, w - 4, 30, 0x8a5a34);
  for (let x = -w / 2 + 14; x < w / 2 - 6; x += 16) px(g, x, -30, 2, 26, 0x6b4426);
  px(g, -w / 2 - 2, -38, w + 4, 6, OUTLINE);
  px(g, -w / 2, -38, w, 4, 0xb8854e);
  // goods on the counter
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 10 + i * 15;
    if (goods === "fruit") {
      px(g, x, -46, 10, 8, i % 2 ? 0xd94a3a : 0x5aa83a);
      px(g, x + 2, -46, 4, 2, 0xffffff, 0.35);
    } else if (goods === "bread") {
      px(g, x, -44, 12, 6, 0xc98a3e);
      px(g, x + 2, -46, 8, 2, 0xe0ab62);
    } else {
      px(g, x, -48, 10, 10, i % 2 ? 0x8a6a9a : 0x5a7fa8);
      px(g, x + 2, -50, 6, 2, OUTLINE);
    }
  }
  // canopy: alternating stripes, scalloped hem
  px(g, -w / 2 - 6, -100, w + 12, 20, OUTLINE);
  for (let i = 0; i < (w + 8) / 12; i++) {
    const x = -w / 2 - 4 + i * 12;
    px(g, x, -98, 12, 16, i % 2 ? 0xf0e2c0 : stripe);
    px(g, x + 2, -82, 8, 4, i % 2 ? 0xf0e2c0 : stripe);
  }
  px(g, -w / 2 - 4, -98, w + 8, 2, 0xffffff, 0.25);
  return g;
}

/** A stone well with a little shingled roof and a bucket on its rope. */
export function well(g = new Graphics()) {
  shadow(g, 70);
  const w = 60;
  // stone drum: rows of offset blocks
  px(g, -w / 2, -34, w, 34, OUTLINE);
  for (let row = 0; row < 3; row++) {
    const y = -32 + row * 10;
    for (let x = -w / 2 + 2 - (row % 2) * 6; x < w / 2 - 2; x += 12) {
      const x0 = Math.max(x, -w / 2 + 2);
      const x1 = Math.min(x + 10, w / 2 - 2);
      px(g, x0, y, x1 - x0, 8, row === 0 ? 0xa0a6b0 : 0x8a909c);
      px(g, x0, y, x1 - x0, 2, 0xbfc4cc);
    }
  }
  px(g, -w / 2 + 6, -40, w - 12, 8, OUTLINE);
  px(g, -w / 2 + 8, -38, w - 16, 4, 0x2c5470); // water
  // posts and roof
  for (const x of [-w / 2 + 4, w / 2 - 10]) px(g, x, -84, 6, 50, 0x6b4426);
  px(g, -w / 2 - 6, -92, w + 12, 12, OUTLINE);
  for (let x = -w / 2 - 4; x < w / 2 + 4; x += 8) px(g, x, -90, 6, 8, (x / 8) % 2 ? 0x8e2f1c : 0xa8402a);
  px(g, -4, -80, 8, 2, 0x6b4426); // crank
  px(g, 0, -78, 2, 22, 0xd9c79a); // rope
  px(g, -4, -56, 10, 8, OUTLINE);
  px(g, -2, -54, 6, 4, 0x8a5a34); // bucket
  return g;
}

/** A lamp post; the caller adds the flame and glow at (0, LAMP_TOP). */
export const LAMP_TOP = -66;
export function lampPost(g = new Graphics()) {
  shadow(g, 18);
  px(g, -6, -6, 12, 6, OUTLINE);
  px(g, -2, -64, 4, 60, 0x3a3a40);
  px(g, -2, -64, 2, 60, 0x5a5a64);
  px(g, -8, -70, 16, 4, 0x3a3a40);
  return g;
}

/** A small iron-bound chest (the vault's treasure). */
export function chest(g = new Graphics()) {
  shadow(g, 40);
  px(g, -18, -26, 36, 26, OUTLINE);
  px(g, -16, -24, 32, 22, 0x8a5a34);
  px(g, -16, -24, 32, 8, 0xa87444);
  px(g, -16, -16, 32, 2, OUTLINE);
  for (const x of [-12, 8]) px(g, x, -24, 4, 22, 0xc79a2e);
  px(g, -3, -16, 6, 6, 0xe0c060);
  return g;
}

/** A potted plant for room corners. */
export function plant(g = new Graphics()) {
  shadow(g, 24);
  px(g, -10, -16, 20, 16, OUTLINE);
  px(g, -8, -14, 16, 12, 0xa8553a);
  px(g, -8, -14, 16, 2, 0xc06a48);
  for (const [x, y, w, h] of [[-12, -30, 8, 14], [-4, -38, 8, 22], [4, -32, 8, 16], [-8, -24, 16, 8]]) px(g, x, y, w, h, 0x3f7a34);
  for (const [x, y] of [[-10, -28], [-2, -36], [6, -30]]) px(g, x, y, 2, 4, 0x6fae4a);
  return g;
}

/** A shield on a stand (armory dressing), in the given heraldic colour. */
export function shieldStand(g = new Graphics(), color = 0x3b6fb6) {
  shadow(g, 30);
  px(g, -2, -48, 4, 48, 0x5e3d22);
  px(g, -12, -4, 24, 4, 0x5e3d22);
  px(g, -14, -50, 28, 30, OUTLINE);
  px(g, -12, -48, 24, 22, color);
  px(g, -8, -26, 16, 4, color);
  px(g, -4, -22, 8, 2, color);
  px(g, -2, -46, 4, 20, 0xd9b45a);
  px(g, -10, -40, 20, 4, 0xd9b45a);
  return g;
}
