/**
 * A drifting swarm of warm fireflies over the night backdrop — the thing that
 * makes the static scene feel alive. Pure CSS (see .firefly / firefly-drift in
 * globals.css), so it stays a server component and costs no JS. Positions are a
 * hardcoded deterministic set rather than Math.random() to avoid a
 * server/client hydration mismatch. Reduced-motion freezes them to a soft glow.
 */
const FIREFLIES = [
  { top: "18%", left: "6%", size: 4, dur: 7, delay: 0, fx: "16px", fy: "-22px" },
  { top: "32%", left: "14%", size: 3, dur: 9, delay: 1.4, fx: "-14px", fy: "-18px" },
  { top: "58%", left: "9%", size: 5, dur: 8, delay: 0.6, fx: "20px", fy: "-26px" },
  { top: "74%", left: "18%", size: 3, dur: 10, delay: 2.1, fx: "-12px", fy: "-20px" },
  { top: "44%", left: "4%", size: 4, dur: 11, delay: 3.2, fx: "18px", fy: "-14px" },
  { top: "22%", left: "88%", size: 4, dur: 8, delay: 0.9, fx: "-18px", fy: "-24px" },
  { top: "40%", left: "94%", size: 3, dur: 10, delay: 2.6, fx: "-14px", fy: "-16px" },
  { top: "62%", left: "90%", size: 5, dur: 7.5, delay: 1.1, fx: "-22px", fy: "-22px" },
  { top: "78%", left: "82%", size: 3, dur: 9.5, delay: 3.5, fx: "16px", fy: "-18px" },
  { top: "52%", left: "96%", size: 4, dur: 12, delay: 0.3, fx: "-20px", fy: "-12px" },
  { top: "30%", left: "50%", size: 2, dur: 13, delay: 4.0, fx: "24px", fy: "-30px" },
  { top: "85%", left: "40%", size: 3, dur: 9, delay: 1.8, fx: "-16px", fy: "-24px" },
  { top: "88%", left: "62%", size: 4, dur: 8.5, delay: 2.9, fx: "14px", fy: "-20px" },
  { top: "68%", left: "72%", size: 2, dur: 11, delay: 0.5, fx: "18px", fy: "-16px" },
  { top: "12%", left: "72%", size: 3, dur: 10.5, delay: 3.8, fx: "-14px", fy: "-22px" },
  { top: "50%", left: "28%", size: 3, dur: 12.5, delay: 2.2, fx: "20px", fy: "-14px" },
];

export default function Fireflies() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly absolute rounded-full"
          style={{
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size,
            background: "#ffde8a",
            boxShadow: "0 0 6px 2px rgba(255,200,90,0.7), 0 0 12px 4px rgba(240,192,80,0.35)",
            // Consumed by the firefly-drift keyframe in globals.css
            ["--fx" as string]: f.fx,
            ["--fy" as string]: f.fy,
            ["--dur" as string]: `${f.dur}s`,
            ["--delay" as string]: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
