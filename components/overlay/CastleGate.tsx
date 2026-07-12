"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/world/bus";

export default function CastleGate() {
  const [atGate, setAtGate] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    const off = bus.onGate((v) => setAtGate(v));
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF" && atGate) setEntering(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, [atGate]);

  // Placeholder "entering" transition — Phase 7 swaps this for the interior scene.
  if (entering) {
    return (
      <div
        className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-center text-stone-200"
        onClick={() => setEntering(false)}
      >
        <p className="font-mono text-2xl text-amber-300">⚔ The gates open…</p>
        <p className="max-w-sm font-mono text-sm text-stone-400">
          Chapter II — the castle interior (About · Experience · Skills · Contact)
          arrives in Phase 7.
        </p>
        <p className="mt-2 font-mono text-xs text-stone-500">click to go back</p>
      </div>
    );
  }

  if (!atGate) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center">
      <button
        onClick={() => setEntering(true)}
        className="pointer-events-auto animate-pulse rounded-lg border-2 border-amber-300 bg-amber-500/90 px-6 py-3 font-mono text-base font-bold text-black shadow-xl active:scale-95"
      >
        ⚔ Enter the Castle — press F / tap
      </button>
    </div>
  );
}
