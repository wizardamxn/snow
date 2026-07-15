"use client";

import { useEffect, useState } from "react";
import { worldState } from "@/lib/world/worldState";
import { playBlip } from "@/lib/audio/ambient";
import { WORLD_W, WORLD_H } from "@/components/world/world.config";

/** Mirrors Town.ts's `applyCamera` scale/clamp so the bubble tracks the raven through camera pans. */
const CAM_SCALE_MIN = 1.2;
const CAM_SCALE_MAX = 2.6;

const DIALOGUE_PAGES = [
  "Caw! Welcome to the Frontier, traveler.",
  "The buildings ahead hold the master's knowledge...",
  "Walk up to their doors and press [E] to step inside. Caw!",
];

export default function RavenBubble({ onClose }: { onClose: () => void }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [pos, setPos] = useState({ x: -999, y: -999 });

  const fullText = DIALOGUE_PAGES[pageIdx];

  // ── Follow the Raven in world space (fixed position, camera still pans/zooms) ──
  useEffect(() => {
    let handle: number;
    const updatePos = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(CAM_SCALE_MIN, Math.min(Math.max(vw / 1000, vh / 620), CAM_SCALE_MAX));
      const camX = Math.max(vw - WORLD_W * scale, Math.min(0, vw / 2 - worldState.playerX * scale));
      const camY = Math.max(vh - WORLD_H * scale, Math.min(0, vh / 2 - worldState.playerY * scale));
      setPos({ x: worldState.ravenX * scale + camX, y: worldState.ravenY * scale + camY });
      handle = requestAnimationFrame(updatePos);
    };
    handle = requestAnimationFrame(updatePos);
    return () => cancelAnimationFrame(handle);
  }, []);

  // ── Typewriter Effect ────────────────────────────────────────────────────
  useEffect(() => {
    setDisplayedText("");
    let charIdx = 0;
    
    // Play blips slightly offset to text speed to sound retro
    const blipInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        // 50% chance to blip on a letter to not overwhelm audio
        if (Math.random() > 0.5) playBlip();
      } else {
        clearInterval(blipInterval);
      }
    }, 40);

    const typeInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        setDisplayedText(fullText.substring(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);

    return () => {
      clearInterval(blipInterval);
      clearInterval(typeInterval);
    };
  }, [fullText]);

  // ── Global Input to Advance ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        e.stopPropagation();
        if (displayedText.length < fullText.length) {
          // Skip typing
          setDisplayedText(fullText);
        } else if (pageIdx < DIALOGUE_PAGES.length - 1) {
          // Next page
          setPageIdx((p) => p + 1);
        } else {
          // Close dialogue
          onClose();
        }
      }
    };
    
    // Add listener after a tiny delay so we don't catch the 'E' press that opened it
    const timer = setTimeout(() => {
      window.addEventListener("keydown", handleKey, { capture: true });
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey, { capture: true });
    };
  }, [displayedText, fullText, pageIdx]);

  return (
    <div
      className="pointer-events-auto absolute flex items-center justify-center p-2 z-50"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: "translate(-50%, -100%)", // Anchor bottom-center above head
      }}
      onClick={(e) => e.stopPropagation()} // don't close immediately on click
    >
      <div
        className="font-pixel relative p-3 text-center"
        style={{
          background: "rgba(0,0,0,0.88)", // Consistent panel backdrop
          border: "2px solid #5a4828",
          boxShadow: "4px 4px 0 #000, 0 0 0 2px #000",
          color: "#e8d8b8",
          fontSize: "8px",
          lineHeight: "1.6",
          minWidth: "180px",
          maxWidth: "240px",
          minHeight: "48px", // Prevent jumping when text is short
        }}
      >
        <p>{displayedText}</p>

        {/* Blinking prompt when done typing */}
        {displayedText.length === fullText.length && (
          <div
            className="absolute -bottom-2 -right-2 animate-pulse"
            style={{
              background: "#c8861e",
              border: "2px solid #000",
              color: "#000",
              padding: "2px 4px",
              fontSize: "6px",
            }}
          >
            [E]
          </div>
        )}
      </div>
    </div>
  );
}
