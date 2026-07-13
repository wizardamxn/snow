"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";

export default function CastleGate() {
  const [atGate, setAtGate] = useState(false);

  useEffect(() => {
    const off = bus.onGate((v) => setAtGate(v));
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF" && atGate) {
        worldState.scene = "interior";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, [atGate]);

  const handleEnter = () => {
    worldState.scene = "interior";
  };

  if (!atGate) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center">
      <button
        onClick={handleEnter}
        className="pointer-events-auto animate-pulse rounded-lg border-2 border-amber-300 bg-amber-500/90 px-6 py-3 font-mono text-base font-bold text-black shadow-xl active:scale-95"
      >
        ⚔ Enter the Castle — press F / tap
      </button>
    </div>
  );
}
