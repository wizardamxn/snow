"use client";

import { useEffect, useState } from "react";
import Hud from "./Hud";
import ProjectPanel from "./ProjectPanel";
import CastleGate from "./CastleGate";
import ThroneRoom from "./ThroneRoom";
import { bus } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";

export default function Overlay() {
  const [scene, setScene] = useState<"overworld" | "interior">("overworld");

  useEffect(() => {
    setScene(worldState.scene);
    const off = bus.onScene((next) => setScene(next));
    return () => off();
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {scene === "overworld" ? (
        <>
          <Hud />
          <ProjectPanel />
          <CastleGate />
        </>
      ) : (
        <>
          <ThroneRoom />
        </>
      )}
    </div>
  );
}
