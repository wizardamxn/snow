"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/world/bus";
import { getVisited } from "@/lib/world/achievements";
import { playBlip } from "@/lib/audio/ambient";

/** Every place a visitor can be walked to; the first six are the portfolio sections (keys 1–6). */
const PLACES: { id: string; title: string; sub: string }[] = [
  { id: "sanctum", title: "ABOUT", sub: "The Sanctum" },
  { id: "chronicles", title: "EXPERIENCE", sub: "Hall of Chronicles" },
  { id: "relics", title: "PROJECTS", sub: "Vault of Relics" },
  { id: "armory", title: "SKILLS", sub: "The Armory" },
  { id: "testimonies", title: "TESTIMONIALS", sub: "Hall of Testimonies" },
  { id: "contact", title: "CONTACT", sub: "Contact Spire" },
];
const EXTRAS: { id: string; title: string }[] = [
  { id: "terminal", title: "TERMINAL" },
  { id: "bard", title: "BARD" },
  { id: "raven", title: "RAVEN" },
  { id: "cave", title: "CAVE" },
  { id: "knight", title: "BOSS" },
];

/**
 * "Where to?" — a clickable list of every section. Picking one walks the hero
 * there and opens it on arrival, so nobody has to learn the map to use the site.
 */
export default function PlacesMenu() {
  // Mounted client-side only (HomeGate decides game vs résumé in the browser), so localStorage is safe here.
  const [visited, setVisited] = useState<Set<string>>(() => new Set(getVisited()));
  // Phones in landscape are ~390px tall: the full menu covered the ATK/E buttons and ran off
  // screen, so on touch it's a toggle under the music button that opens a scrollable list.
  const [isTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    playBlip();
    setOpen(false);
    bus.emitTravel(id);
  };

  useEffect(() => {
    const off = bus.onVisit((id) => setVisited((prev) => new Set(prev).add(id)));
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= PLACES.length && !e.ctrlKey && !e.metaKey && !e.altKey) go(PLACES[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (isTouch && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="pointer-events-auto absolute left-4 font-pixel px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6c75a]"
        style={{ top: "64px", minHeight: 40, fontSize: "8px", color: "#f6c75a", background: "#0d0b08", border: "2px solid #c8861e", boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000" }}
      >
        WHERE TO?
      </button>
    );
  }

  return (
    <nav
      aria-label="Where to"
      className={`pointer-events-auto absolute font-pixel ${isTouch ? "left-4 z-40 overflow-y-auto" : "right-4"}`}
      style={{
        top: isTouch ? "64px" : "150px",
        maxHeight: isTouch ? "calc(100dvh - 76px)" : undefined,
        width: "200px",
        background: "#0d0b08",
        border: "2px solid #c8861e",
        boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
        padding: "8px 8px 9px",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p style={{ color: "#f6c75a", fontSize: "10px", letterSpacing: "0.08em" }}>WHERE TO?</p>
        {isTouch && (
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="-mt-1 -mr-1 flex h-9 w-9 items-center justify-center" style={{ color: "#c8861e", fontSize: "9px" }}>
            X
          </button>
        )}
      </div>
      <p style={{ color: "#a7773b", fontSize: "7px", marginTop: "6px", lineHeight: 1.6 }}>
        {isTouch ? "TAP A PLACE TO WALK THERE" : "CLICK, OR PRESS 1–6"}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {PLACES.map((p, i) => {
          const done = visited.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => go(p.id)}
                className="group flex w-full items-center gap-2 px-1.5 py-1 text-left min-h-[36px] transition-colors hover:bg-[#2a1d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6c75a]"
                style={{ border: "1px solid #3a2808" }}
              >
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ background: done ? "#3a5020" : "#c8861e", color: done ? "#9be36a" : "#000", fontSize: "8px" }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block" style={{ color: done ? "#9a8560" : "#f6c75a", fontSize: "8px" }}>
                    {p.title}
                  </span>
                  <span className="block truncate" style={{ color: "#8f7a56", fontSize: "6px", marginTop: "4px" }}>
                    {p.sub.toUpperCase()}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap gap-1">
        {EXTRAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => go(p.id)}
            className={`px-1.5 py-1 hover:bg-[#2a1d0c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6c75a] ${isTouch ? "min-h-[36px]" : ""}`}
            style={{ border: "1px solid #3a2808", color: visited.has(p.id) ? "#7d6a4a" : "#c8861e", fontSize: "7px" }}
          >
            {p.title}
          </button>
        ))}
      </div>
    </nav>
  );
}
