"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bus, type NearInfo } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";
import { playBlip, setMuted, getAudioState } from "@/lib/audio/ambient";
import SanctumPanel from "./panels/SanctumPanel";
import ChroniclesPanel from "./panels/ChroniclesPanel";
import RelicsPanel from "./panels/RelicsPanel";
import ArmoryPanel from "./panels/ArmoryPanel";
import TestimoniesPanel from "./panels/TestimoniesPanel";
import ContactPanel from "./panels/ContactPanel";
import CavePanel from "./panels/CavePanel";
import RavenBubble from "./panels/RavenBubble";
import BardBubble from "./panels/BardBubble";
import TerminalPanel from "./panels/TerminalPanel";
import TutorialOverlay from "./TutorialOverlay";
import Minimap from "./Minimap";
import TouchControls from "./TouchControls";
import AchievementTracker from "./AchievementTracker";

/**
 * Routes the bus `emitOpen` id to the correct content panel.
 */
function PanelRouter({
  openId,
  onClose,
}: {
  openId: string;
  onClose: () => void;
}) {
  switch (openId) {
    case "sanctum":
      return <SanctumPanel onClose={onClose} />;
    case "chronicles":
      return <ChroniclesPanel onClose={onClose} />;
    case "relics":
      return <RelicsPanel onClose={onClose} />;
    case "armory":
      return <ArmoryPanel onClose={onClose} />;
    case "testimonies":
      return <TestimoniesPanel onClose={onClose} />;
    case "contact":
      return <ContactPanel onClose={onClose} />;
    case "cave":
      return <CavePanel onClose={onClose} />;
    case "raven":
      return <RavenBubble onClose={onClose} />;
    case "terminal":
      return <TerminalPanel onClose={onClose} />;
    default:
      return null;
  }
}

/** Pixel RPG box-shadow border style */
const pixelBox: React.CSSProperties = {
  background: "#0d0b08",
  border: "2px solid #c8861e",
  boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
};

/**
 * [T] cycles through these — a null hour means "keep auto-advancing".
 * DAWN/DUSK are deliberately offset from the exact 6h/18h sunrise/sunset
 * instants (where sampleDayNight's night-alpha is exactly 0, so the tint
 * would look identical to full DAY) so they actually show a dim, warm-tinted
 * transitional sky instead of reading as plain daylight. DUSK also has to stay
 * OUT of the 20:00–04:00 band where night-alpha is fully saturated at 1 (any
 * hour in there looks identical to true NIGHT), so it sits at 19h, not 20h.
 */
const TIME_PRESETS: { label: string; hour: number | null }[] = [
  { label: "DYNAMIC", hour: null },
  { label: "DAWN", hour: 5 },
  { label: "DAY", hour: 12 },
  { label: "DUSK", hour: 19 },
  { label: "NIGHT", hour: 0 },
];

export default function Overlay() {
  const [near, setNear] = useState<NearInfo>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [timePresetIdx, setTimePresetIdx] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    // Initial audio state sync
    setIsMuted(getAudioState().muted);

    setNear(worldState.near);
    const offNear = bus.onNear((info) => setNear(info));
    const offOpen = bus.onOpen((id) => {
      playBlip();
      setOpenId(id);
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") {
        const current = getAudioState().muted;
        setMuted(!current);
        setIsMuted(!current);
      }
      if (e.key.toLowerCase() === "t") {
        setTimePresetIdx((prev) => {
          const next = (prev + 1) % TIME_PRESETS.length;
          const preset = TIME_PRESETS[next];
          if (preset.hour === null) {
            worldState.cycleRunning = true;
          } else {
            worldState.cycleRunning = false;
            worldState.timeOfDay = preset.hour;
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      offNear();
      offOpen();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const closePanel = () => {
    playBlip();
    setOpenId(null);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <TutorialOverlay />
      
      {/* ── Minimap (top-right) ─────────────────────────────────────────── */}
      {!openId && <Minimap />}

      {/* ── Achievement tracker (below minimap) + completion banner ──────── */}
      <AchievementTracker />

      {/* ── Bard's now-playing speech bubble (floats above him always) ──── */}
      {!openId && <BardBubble />}

      {/* ── On-screen D-pad + action buttons (touch devices only) ────────── */}
      {!openId && <TouchControls />}

      {/* ── Classic (non-game) view link (bottom-left, above the controls legend) ── */}
      <Link
        href="/resume"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto absolute left-4 font-pixel px-2.5 py-2 transition-colors"
        style={{
          bottom: "210px",
          fontSize: "6px",
          color: "#c8861e",
          background: "#0d0b08",
          border: "2px solid #5a4020",
          boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
        }}
      >
        CLASSIC VIEW &gt;
      </Link>

      {/* ── Pixel title bar (top-centre) ────────────────────────────────── */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
        <p
          className="font-pixel text-[8px]"
          style={{ color: "#f0c050", letterSpacing: "0.1em" }}
        >
          AMAN AHMAD
        </p>
        <p
          className="font-pixel text-[6px] mt-1.5"
          style={{ color: "#5a4020" }}
        >
          THE FRONTIER PORTFOLIO
        </p>
      </div>

      {/* ── Pixel HUD (bottom-left) — keyboard legend, hidden on touch ────── */}
      {!isTouch && (
      <div
        className="absolute bottom-4 left-4 px-3 py-2.5"
        style={pixelBox}
      >
        <div
          className="font-pixel text-[8px] mb-2"
          style={{ color: "#8a6820" }}
        >
          CONTROLS
        </div>
        <div
          className="font-pixel text-[7px] leading-loose"
          style={{ color: "#c8861e" }}
        >
          <div>
            <span style={{ color: "#f0c050" }}>WASD</span>
            <span style={{ color: "#5a4020" }}> / ARROWS</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>SHIFT</span>
            <span style={{ color: "#5a4020" }}> SPRINT</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[E]</span>
            <span style={{ color: "#5a4020" }}> INTERACT</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[M]</span>
            <span style={{ color: "#5a4020" }}> {isMuted ? "UNMUTE" : "MUTE"}</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[T]</span>
            <span style={{ color: "#5a4020" }}> TIME: {TIME_PRESETS[timePresetIdx].label}</span>
          </div>
        </div>
      </div>
      )}

      {/* ── Pixel proximity prompt (bottom-centre) ──────────────────────── */}
      {near && !openId && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 text-center"
          style={{
            ...pixelBox,
            animation: "none",
          }}
        >
          {/* Animated cursor blink */}
          <p
            className="font-pixel text-[8px] leading-loose"
            style={{ color: "#f0c050" }}
          >
            <span
              className="inline-block px-2 py-0.5 mr-2"
              style={{
                background: "#f0c050",
                color: "#000",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "8px",
                boxShadow: "2px 2px 0 #7a5010",
              }}
            >
              E
            </span>
            {near.action.toUpperCase()}
          </p>
          <p
            className="font-pixel text-[7px] mt-1.5"
            style={{ color: "#c8861e" }}
          >
            {near.label.toUpperCase()}
          </p>
        </div>
      )}

      {/* ── Content panels ──────────────────────────────────────────────── */}
      {openId && <PanelRouter openId={openId} onClose={closePanel} />}
    </div>
  );
}
