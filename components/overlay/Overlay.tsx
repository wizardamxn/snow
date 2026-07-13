"use client";

import { useEffect, useState } from "react";
import { bus, type NearInfo } from "@/lib/world/bus";
import { worldState } from "@/lib/world/worldState";
import SanctumPanel from "./panels/SanctumPanel";
import ChroniclesPanel from "./panels/ChroniclesPanel";
import RelicsPanel from "./panels/RelicsPanel";
import ArmoryPanel from "./panels/ArmoryPanel";
import TestimoniesPanel from "./panels/TestimoniesPanel";
import ContactPanel from "./panels/ContactPanel";
import CavePanel from "./panels/CavePanel";

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

  const closePanel = () => setOpenId(null);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">

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

      {/* ── Pixel HUD (bottom-left) ──────────────────────────────────────── */}
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
        </div>
      </div>

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
