/**
 * Occasional shooting stars streaking across the night backdrop. Pure CSS (see
 * .shooting-star / shooting-star keyframe in globals.css), so it stays a server
 * component and costs no JS. Long, staggered durations keep them rare enough to
 * feel like a lucky glimpse rather than a screensaver. Reduced-motion hides
 * them entirely — a static diagonal line isn't worth anything.
 *
 * `--sx/--sy` is the travel vector; `--angle` tilts the streak to match it.
 */
const STARS = [
  { top: "12%", left: "8%", len: 90, dur: 14, delay: 2, sx: "300px", sy: "150px", angle: "27deg" },
  { top: "6%", left: "62%", len: 72, dur: 19, delay: 9, sx: "240px", sy: "104px", angle: "23deg" },
  { top: "24%", left: "40%", len: 104, dur: 23, delay: 15, sx: "340px", sy: "128px", angle: "20deg" },
];

export default function ShootingStars() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="shooting-star absolute"
          style={{
            top: s.top,
            left: s.left,
            width: s.len,
            ["--sx" as string]: s.sx,
            ["--sy" as string]: s.sy,
            ["--angle" as string]: s.angle,
            ["--dur" as string]: `${s.dur}s`,
            ["--delay" as string]: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
