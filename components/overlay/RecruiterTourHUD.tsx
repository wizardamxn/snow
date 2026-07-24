"use client";

import { useEffect, useState } from "react";
import { bus, type TourInfo } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";
import { playBlip } from "@/lib/audio/ambient";

const pixelBox: React.CSSProperties = {
  background: "#0d0b08",
  border: "2px solid #c8861e",
  boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
};

export default function RecruiterTourHUD() {
  const [tour, setTour] = useState<TourInfo>(null);

  useEffect(() => {
    setTour(worldState.tour);
    return bus.onTour(setTour);
  }, []);

  if (!tour) return null;

  const skip = () => {
    playBlip();
    bus.emitTourCommand("skip");
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-4 text-center pointer-events-auto" style={pixelBox}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {Array.from({ length: tour.total }, (_, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              width: 6,
              height: 6,
              background: i <= tour.index ? "#f0c050" : "#3a2808",
              boxShadow: "1px 1px 0 #000",
            }}
          />
        ))}
      </div>
      <p className="font-pixel text-[8px]" style={{ color: "#f0c050" }}>
        {tour.index + 1}/{tour.total} · {tour.label.toUpperCase()}
      </p>
      <p className="font-mono text-sm mt-2 max-w-sm mx-auto leading-relaxed" style={{ color: "#c8a878" }}>
        {tour.caption}
      </p>
      <button
        onClick={skip}
        className="mt-3 font-pixel text-[6px] px-3 py-2 transition-colors"
        style={{ background: "#1a0a00", color: "#8a6820", border: "2px solid #4a3010" }}
      >
        SKIP TOUR ✕
      </button>
    </div>
  );
}
