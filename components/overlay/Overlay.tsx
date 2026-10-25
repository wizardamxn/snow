"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bus, type NearInfo, type TourInfo } from "@/lib/world/bus";
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
import AnalyticsBridge from "./AnalyticsBridge";
import ChroniclePanel from "./panels/ChroniclePanel";
import RecruiterTourPrompt from "./panels/RecruiterTourPrompt";
import RecruiterTourHUD from "./RecruiterTourHUD";
import ColorGrade from "./ColorGrade";
import SpeedrunHUD from "./SpeedrunHUD";
import PlacesMenu from "./PlacesMenu";
import ProjectPanel from "./ProjectPanel";
import { PanelThemeContext, type PanelTheme } from "./InfoPanel";

/** Which Tiny Swords frame and ribbon each place's panels wear. */
const PANEL_THEMES: Record<string, PanelTheme> = {
  sanctum: { frame: "scroll", ribbon: "blue" },
  chronicles: { frame: "scroll", ribbon: "red" },
  relics: { frame: "scroll", ribbon: "purple" },
  armory: { frame: "scroll", ribbon: "yellow" },
  testimonies: { frame: "scroll", ribbon: "yellow" },
  contact: { frame: "scroll", ribbon: "blue" },
  cave: { frame: "scroll", ribbon: "black" },
  chronicle: { frame: "scroll", ribbon: "yellow" },
  recruiterSignpost: { frame: "scroll", ribbon: "red" },
  // The CRT keeps its green screen — a machine pinned to a medieval scroll is the joke.
  terminal: { frame: "scroll", ribbon: "black" },
};

/**
 * Routes the bus `emitOpen` id to the correct content panel.
 */
function PanelRouter(props: { openId: string; onClose: () => void; onOpen: (id: string) => void }) {
  const key = props.openId.startsWith("relic:") ? "relics" : props.openId;
  return (
    <PanelThemeContext.Provider value={PANEL_THEMES[key] ?? null}>
      <PanelSwitch {...props} />
    </PanelThemeContext.Provider>
  );
}

function PanelSwitch({
  openId,
  onClose,
  onOpen,
}: {
  openId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  // A display in the Vault of Relics opens that one project; "back" shows the whole gallery.
  if (openId.startsWith("relic:")) {
    return <ProjectPanel projectId={openId.slice(6)} onClose={onClose} onBack={() => onOpen("relics")} />;
  }
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
    case "chronicle":
      return <ChroniclePanel onClose={onClose} />;
    case "recruiterSignpost":
      return <RecruiterTourPrompt onClose={onClose} />;
    default:
      return null;
  }
}

/** Parchment strip for world prompts — matches the scroll panels. */
const parchment: React.CSSProperties = {
  background: "#f1e0b8",
  border: "2px solid #4a2e17",
  boxShadow: "3px 3px 0 rgba(30,18,8,0.55), inset 0 0 0 2px #e2c995",
};

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
  const [tour, setTour] = useState<TourInfo>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [timePresetIdx, setTimePresetIdx] = useState(0);
  const [isTouch, setIsTouch] = useState(false);
  const [inside, setInside] = useState(false);

  // The classic-resume escape hatch is the single most important affordance for
  // a recruiter who doesn't want to play a game. Show it loudly for the first
  // few seconds, then let it settle into the quiet HUD styling.
  const [highlightClassic, setHighlightClassic] = useState(true);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    const t = setTimeout(() => setHighlightClassic(false), 10000);
    return () => clearTimeout(t);
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
    const offTour = bus.onTour(setTour);
    const offScene = bus.onScene((scene) => setInside(scene !== "town"));

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

    // Swap in the sword cursor while an attackable is in range. Polled via rAF
    // and applied as a <body> class so it never re-renders the overlay tree.
    let frame = 0;
    let wasInRange = false;
    const pollCursor = () => {
      if (worldState.attackInRange !== wasInRange) {
        wasInRange = worldState.attackInRange;
        document.body.classList.toggle("attack-ready", wasInRange);
      }
      frame = requestAnimationFrame(pollCursor);
    };
    frame = requestAnimationFrame(pollCursor);

    return () => {
      offNear();
      offOpen();
      offTour();
      offScene();
      cancelAnimationFrame(frame);
      document.body.classList.remove("attack-ready");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const closePanel = () => {
    playBlip();
    setOpenId(null);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <AnalyticsBridge />
      {/* First child: screen-space grade + vignette paint under every other
          HUD element and panel (later siblings win in the same stacking context). */}
      <ColorGrade />
      <TutorialOverlay />
      
      {/* ── Minimap (top-right) ─────────────────────────────────────────── */}
      {!openId && !inside && <Minimap />}

      {/* ── Inside a building: how to get back out ─────────────────────────── */}
      {inside && !openId && !near && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 font-pixel text-[7px]" style={{ ...parchment, color: "#6b4d2c" }}>
          WALK OUT THE DOOR (BOTTOM) TO LEAVE
        </div>
      )}

      {/* ── Achievement tracker (below minimap) + completion banner ──────── */}
      <AchievementTracker />

      {/* ── "Where to?" — click a section and the hero walks there ─────────── */}
      {!openId && !tour && <PlacesMenu />}

      {/* ── Speedrun timer (terminal easter egg; hidden unless a run is on) ─ */}
      {!openId && <SpeedrunHUD />}

      {/* ── Bard's now-playing speech bubble (floats above him always) ──── */}
      {!openId && !inside && <BardBubble />}

      {/* ── On-screen D-pad + action buttons (touch devices only) ────────── */}
      {!openId && !tour && <TouchControls />}

      {/* ── Recruiter Mode: caption card + progress dots (bottom-centre) ─── */}
      {!openId && <RecruiterTourHUD />}

      {/* ── Classic (non-game) view link (bottom-left, above the controls legend) ── */}
      <Link
        href="/resume"
        target="_blank"
        rel="noopener noreferrer"
        className={`pointer-events-auto absolute left-4 font-pixel transition-all ${highlightClassic ? "classic-cta-pulse" : ""}`}
        style={
          highlightClassic
            ? {
                bottom: "210px",
                fontSize: "9px",
                padding: "12px 14px",
                color: "#000",
                background: "#c8861e",
                border: "3px solid #000",
                boxShadow: "4px 4px 0 #000",
                letterSpacing: "0.06em",
              }
            : {
                bottom: "210px",
                fontSize: "7px",
                padding: "8px 10px",
                color: "#c8861e",
                background: "#0d0b08",
                border: "2px solid #5a4020",
                boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
              }
        }
      >
        {highlightClassic ? "📄 JUST THE RESUME →" : "CLASSIC VIEW >"}
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
          className="font-pixel text-[7px] mt-1.5"
          style={{ color: "#a7773b" }}
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
          style={{ color: "#b78a2a" }}
        >
          CONTROLS
        </div>
        <div
          className="font-pixel text-[7px] leading-loose"
          style={{ color: "#c8861e" }}
        >
          <div>
            <span style={{ color: "#f0c050" }}>WASD</span>
            <span style={{ color: "#a7773b" }}> / ARROWS</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>SHIFT</span>
            <span style={{ color: "#a7773b" }}> SPRINT</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[E]</span>
            <span style={{ color: "#a7773b" }}> INTERACT</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[M]</span>
            <span style={{ color: "#a7773b" }}> {isMuted ? "UNMUTE" : "MUTE"}</span>
          </div>
          <div>
            <span style={{ color: "#f0c050" }}>[T]</span>
            <span style={{ color: "#a7773b" }}> TIME: {TIME_PRESETS[timePresetIdx].label}</span>
          </div>
        </div>
      </div>
      )}

      {/* ── Pixel proximity prompt (bottom-centre) ──────────────────────── */}
      {near && !openId && !tour && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 text-center"
          style={{
            ...parchment,
            animation: "none",
          }}
        >
          <p
            className="font-pixel text-[8px] leading-loose"
            style={{ color: "#2e1f10" }}
          >
            <span
              className="inline-block px-2 py-0.5 mr-2"
              style={{
                background: "#8e2f1c",
                color: "#fbeccd",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "8px",
                border: "2px solid #4e150c",
              }}
            >
              E
            </span>
            {near.action.toUpperCase()}
          </p>
          <p
            className="font-pixel text-[7px] mt-1.5"
            style={{ color: "#8e2f1c" }}
          >
            {near.label.toUpperCase()}
          </p>
        </div>
      )}

      {/* ── Content panels ──────────────────────────────────────────────── */}
      {openId && <PanelRouter openId={openId} onClose={closePanel} onOpen={setOpenId} />}
    </div>
  );
}
