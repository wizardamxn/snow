"use client";

import { useEffect, useState } from "react";
import { bus } from "@/lib/world/bus";
import { getVisited, markVisited, ACHIEVEMENT_IDS } from "@/lib/world/achievements";

export default function AchievementTracker() {
  const [count, setCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setCount(getVisited().size);
    const off = bus.onVisit((id) => {
      const { visited, justCompleted } = markVisited(id);
      setCount(visited.size);
      if (justCompleted) {
        setShowBanner(true);
        const timer = setTimeout(() => setShowBanner(false), 5000);
        return () => clearTimeout(timer);
      }
    });
    return off;
  }, []);

  const total = ACHIEVEMENT_IDS.length;
  const complete = count >= total;

  return (
    <>
      <div
        className="pointer-events-none absolute right-4 font-pixel px-2.5 py-2"
        style={{
          top: "112px",
          background: "#0d0b08",
          border: "2px solid #5a4020",
          boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
          fontSize: "7px",
          color: complete ? "#40d020" : "#c8861e",
          textAlign: "right",
        }}
      >
        {complete ? "★ ALL DISCOVERED ★" : `★ ${count}/${total} DISCOVERED`}
      </div>

      {showBanner && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-40 flex justify-center">
          <div
            className="font-pixel text-center px-6 py-4"
            style={{
              background: "rgba(13,11,8,0.95)",
              border: "3px solid #c8861e",
              boxShadow: "0 0 0 3px #000, 0 0 30px rgba(200,134,30,0.4)",
            }}
          >
            <p style={{ color: "#f0c050", fontSize: "12px", marginBottom: "10px" }}>
              ★ THE FRONTIER, FULLY EXPLORED ★
            </p>
            <p style={{ color: "#8a6820", fontSize: "7px", lineHeight: 1.8 }}>
              You&apos;ve found everything this world has to offer.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
