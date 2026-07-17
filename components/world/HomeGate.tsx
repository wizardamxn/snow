"use client";

import { useEffect, useState } from "react";
import World from "./World";
import Overlay from "@/components/overlay/Overlay";
import RotatePrompt from "@/components/overlay/RotatePrompt";
import ThemedResume from "@/components/resume/ThemedResume";

/**
 * The D-pad/attack/interact touch controls work, but a full top-down RPG
 * squeezed into a phone screen is genuinely hard to actually play — so
 * touch devices land on the themed resume instead of the game by default.
 * `?play=1` (the target of every "PLAY →" link in the resume) always
 * bypasses this and shows the real game, on any device.
 *
 * Touch detection needs the client (no reliable server-side signal), so this
 * briefly renders nothing on first paint — consistent with PixiCanvas's own
 * loading screen already covering the same beat once it takes over.
 */
export default function HomeGate() {
  const [decided, setDecided] = useState<"game" | "resume" | null>(null);

  useEffect(() => {
    const forcePlay = new URLSearchParams(window.location.search).get("play") === "1";
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    setDecided(isTouch && !forcePlay ? "resume" : "game");
  }, []);

  if (decided === null) return <div className="fixed inset-0" style={{ background: "#0a1026" }} />;

  // Unconstrained — ThemedResume brings its own min-h-dvh <main> and needs to
  // scroll normally, unlike the game's fixed one-viewport canvas below.
  if (decided === "resume") return <ThemedResume />;

  return (
    <main className="relative h-dvh w-full overflow-hidden" style={{ background: "#0a1026" }}>
      <World />
      <Overlay />
      <RotatePrompt />
    </main>
  );
}
