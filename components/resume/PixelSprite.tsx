type Props = {
  src: string;
  frames: number;
  frameW: number;
  frameH: number;
  fps: number;
  scale?: number;
  flip?: boolean;
  className?: string;
};

/**
 * Plays one row of a game sprite-sheet (the same strips Town.ts/Player.ts use
 * in-game) as a CSS animation — steps() through background-position so each
 * tick lands exactly on a frame boundary, no easing/blur between frames.
 */
export default function PixelSprite({
  src,
  frames,
  frameW,
  frameH,
  fps,
  scale = 1,
  flip = false,
  className,
}: Props) {
  const totalW = frameW * frames;
  const duration = frames / fps;

  return (
    <div
      className={className}
      aria-hidden
      style={{
        width: frameW * scale,
        height: frameH * scale,
        overflow: "hidden",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <div
        className="pixel-sprite-anim"
        style={{
          width: frameW,
          height: frameH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${totalW}px ${frameH}px`,
          imageRendering: "pixelated",
          animationDuration: `${duration}s`,
          animationTimingFunction: `steps(${frames})`,
          ["--sprite-w" as string]: `${totalW}px`,
        }}
      />
    </div>
  );
}
