import PixelSprite from "./PixelSprite";

/**
 * Renders a game character sprite at a uniform *character* height, regardless
 * of how much empty padding its source frame carries. Each sprite's content
 * box (the alpha bounding box of frame 0) was measured once — e.g. the tavern
 * NPC fills only 30 of its 64px frame, the wizard fills all 32 of its — so
 * scaling by frame size alone made them look wildly different. We instead crop
 * to the content box and scale that to CHARACTER_H, so every character reads
 * the same size. Animation still runs (PixelSprite steps the strip underneath).
 */
export const CHARACTERS = {
  knight: { src: "/pixel/knight/Warrior_Idle.png", frames: 8, frameW: 192, frameH: 192, fps: 7, x: 62, y: 48, w: 79, h: 89 },
  tavern: { src: "/pixel/npcs/tavern_idle.png", frames: 4, frameW: 64, frameH: 64, fps: 5, x: 24, y: 18, w: 16, h: 30 },
  wizard: { src: "/pixel/npcs/wizard_idle.png", frames: 4, frameW: 32, frameH: 32, fps: 5, x: 4, y: 0, w: 25, h: 32 },
} as const;

/** One canonical on-screen character height across the whole résumé. */
export const CHARACTER_H = 72;

export default function CharacterSprite({
  who,
  flip,
  height = CHARACTER_H,
}: {
  who: keyof typeof CHARACTERS;
  flip?: boolean;
  height?: number;
}) {
  const c = CHARACTERS[who];
  const scale = height / c.h;
  const clipW = c.w * scale;
  const clipH = c.h * scale;
  return (
    <div
      aria-hidden
      style={{
        width: clipW,
        height: clipH,
        overflow: "hidden",
        position: "relative",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      {/* Shift the (larger) animated frame so its content box aligns to the clip. */}
      <div style={{ position: "absolute", left: -c.x * scale, top: -c.y * scale }}>
        <PixelSprite src={c.src} frames={c.frames} frameW={c.frameW} frameH={c.frameH} fps={c.fps} scale={scale} />
      </div>
    </div>
  );
}
