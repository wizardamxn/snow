"use client";

import { useEffect, useState } from "react";

type Section = { href: string; label: string };

/**
 * A slim "quest progress" HUD that lives in the sticky header: an XP-style bar
 * that fills as you scroll the whole page, notched with one pip per section
 * that lights up as you pass it, plus the current section name as a live
 * "objective" readout. It turns an aimless vertical scroll into a completion
 * loop — and because the desktop nav is hidden on mobile, it doubles as the
 * only on-screen "where am I" signal there.
 *
 * Reads the document scroll (ThemedResume scrolls the page, not an inner box)
 * on a passive listener; the section index comes from each anchor div's live
 * position, so it stays correct through the collapse/expand toggles below it.
 */
export default function QuestProgress({ sections }: { sections: Section[] }) {
  const [progress, setProgress] = useState(0); // 0..1 over the whole page
  const [active, setActive] = useState(-1); // -1 = before the first section

  useEffect(() => {
    const ids = sections.map((s) => s.href.replace("#", ""));

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);

      // Current section = the last one whose top has crossed ~a third down the
      // viewport, so a panel counts as "reached" a beat after it appears.
      const mark = window.innerHeight * 0.35;
      let cur = -1;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= mark) cur = i;
      });
      setActive(cur);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const label = active >= 0 ? sections[active].label.toUpperCase() : "PROLOGUE";

  return (
    <div className="px-6 pb-2 pt-0.5">
      <div className="mx-auto flex max-w-4xl items-center gap-2.5">
        <span className="shrink-0 font-pixel text-[6px] tabular-nums" style={{ color: "#f0c050" }}>
          {active + 1}/{sections.length}
        </span>

        <div
          className="relative h-[7px] flex-1"
          style={{ background: "#0a0700", border: "1px solid #000", boxShadow: "inset 0 0 0 1px #1a1000" }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #a86a12 0%, #f0c050 100%)",
              boxShadow: "0 0 6px rgba(240,192,80,0.5)",
              transition: "width 0.12s linear",
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[3px]">
            {sections.map((s, i) => (
              <span
                key={s.href}
                style={{
                  width: 3,
                  height: 3,
                  background: i <= active ? "#fff2c0" : "#3a2808",
                  boxShadow: i <= active ? "0 0 4px #f0c050" : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <span
          className="shrink-0 truncate font-pixel text-[6px]"
          style={{ color: "#b78a2a", maxWidth: "34%", letterSpacing: "0.08em" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
