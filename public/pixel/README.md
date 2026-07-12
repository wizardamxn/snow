# SIGMA — pixel art drop zones

Download free pixel-art packs and drop the files at the paths below. The code
already loads by these names, so a matching file swaps the placeholder instantly.
**Verify each pack's license allows portfolio/commercial use (many need credit).**

---

## 1. Parallax forest background → `public/pixel/bg/`  (highest impact)

Separate transparent PNG layers, ideally **tileable horizontally** (left edge
matches right edge). Back-to-front:

| File            | What it is                    |
| --------------- | ----------------------------- |
| `bg/sky.png`    | sky / gradient (can be opaque)|
| `bg/far.png`    | distant mountains / hills     |
| `bg/mid.png`    | mid tree-line                 |
| `bg/near.png`   | foreground trees / bushes     |
| `bg/ground.png` | the ground/path strip (tileable) |

**Recommended (itch.io, free):**
- edermunizz — "Free Pixel Art Forest" / "Free Pixel Art Hill" (classic layered parallax)
- Brullov — "Free Pixel Art forest background"
- ansimuz — "Sunny Land" / "Parallax Forest"

Layers can be any size — the code tiles + scales them. More layers is better; if a
pack has 6 layers, drop the extras as `bg/far2.png` etc. and tell me.

## 2. Knight character → `public/pixel/knight/`

Best case: a **spritesheet + JSON** (Aseprite / TexturePacker export) — Pixi loads
it natively with named animations. Otherwise a **horizontal strip** of equal-size
frames works; just tell me frame width/height and frame count.

| File                              | What it is            |
| --------------------------------- | --------------------- |
| `knight/knight.json` + `.png`     | spritesheet (preferred) |
| or `knight/idle.png`              | idle strip            |
| and `knight/run.png`              | run/walk strip        |

**Recommended:** Pixel Frog "Tiny Swords" · "Hero Knight" by Sven ·
"Fantasy Knight — Free" (aamatnieks) · any "knight run cycle" sprite.

## 3. Station props → `public/pixel/props/`

Individual transparent PNGs. We need one landmark per project + a few extras:
`props/signpost.png`, `props/shrine.png`, `props/well.png`, `props/campfire.png`,
`props/banner.png`, `props/chest.png`.

**Recommended:** Kenney "Medieval RTS" / "Tiny Dungeon" · any "medieval pixel props" pack.

## 4. Castle → `public/pixel/castle/`  (needed at Phase 6–7)
`castle/exterior.png` (approach silhouette) · `castle/interior.png` (throne room bg).

---

When you've dropped files, just tell me which ones — I'll wire them into the loader
and tune sizes/anchors.
