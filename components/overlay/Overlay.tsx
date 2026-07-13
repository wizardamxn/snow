"use client";

import { useEffect, useState } from "react";
import { bus, type NearInfo } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";

export default function Overlay() {
  const [near, setNear] = useState<NearInfo>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setNear(worldState.near);
    const offNear = bus.onNear((info) => setNear(info));
    const offOpen = bus.onOpen((id) => setOpenId(id));
    return () => {
      offNear();
      offOpen();
    };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Title */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">
          Aman Ahmad
        </p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-amber-100/40">
          the frontier portfolio
        </p>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 rounded-md border border-amber-200/15 bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-100/70 backdrop-blur-sm">
        <div>
          <span className="text-amber-200">WASD</span> / Arrows — move
        </div>
        <div>
          <span className="text-amber-200">Shift</span> — sprint ·{" "}
          <span className="text-amber-200">E</span> — interact
        </div>
      </div>

      {/* Proximity prompt */}
      {near && !openId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-pulse rounded-lg border border-amber-300/40 bg-black/60 px-5 py-2.5 text-center backdrop-blur-sm">
          <p className="font-mono text-sm text-amber-100">
            <span className="rounded bg-amber-300/90 px-1.5 py-0.5 text-xs font-bold text-black">
              E
            </span>{" "}
            {near.action}{" "}
            <span className="font-semibold text-amber-200">{near.label}</span>
          </p>
        </div>
      )}

      {/* Placeholder panel (Phase 2 replaces this with real content) */}
      {openId && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-[min(90vw,440px)] rounded-xl border border-amber-300/30 bg-[#1a1206] p-8 text-center shadow-2xl">
            <button
              onClick={() => setOpenId(null)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md border border-amber-200/20 text-amber-200/70 hover:bg-amber-200/10"
              aria-label="Close"
            >
              ✕
            </button>
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-amber-200/50">
              You have arrived at
            </p>
            <h2 className="mb-4 text-2xl font-bold text-amber-100">
              {labelFor(openId)}
            </h2>
            <p className="text-sm text-amber-100/60">
              The doors are being furnished. Interiors &amp; content arrive next.
            </p>
            <p className="mt-6 text-xs text-amber-100/40">
              Press <span className="text-amber-200">Esc</span> to step back out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function labelFor(id: string): string {
  const map: Record<string, string> = {
    sanctum: "The Sanctum",
    chronicles: "Hall of Chronicles",
    relics: "Vault of Relics",
    armory: "The Armory",
    testimonies: "Hall of Testimonies",
    contact: "Contact Spire",
    cave: "The Hollow Cave",
  };
  return map[id] ?? id;
}
