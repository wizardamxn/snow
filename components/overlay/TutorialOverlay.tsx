"use client";

import { useEffect, useState } from "react";
import { ensureStarted } from "@/lib/audio/ambient";

/**
 * First-load tutorial screen. Shown once per session (sessionStorage flag).
 * Explains: what this site is, how to move, how to interact, what each building holds.
 */

const BUILDINGS_LEGEND = [
  { icon: "⚔", name: "THE SANCTUM", desc: "About & Bio" },
  { icon: "📜", name: "HALL OF CHRONICLES", desc: "Work Experience" },
  { icon: "🏺", name: "VAULT OF RELICS", desc: "5 Projects" },
  { icon: "🗡", name: "THE ARMORY", desc: "Skills & Stack" },
  { icon: "📣", name: "HALL OF TESTIMONIES", desc: "Testimonials" },
  { icon: "✉", name: "CONTACT SPIRE", desc: "Get in Touch" },
];

/** Pixel-key chip */
function Key({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <span
      className="font-pixel inline-flex items-center justify-center"
      style={{
        fontSize: "8px",
        minWidth: wide ? "54px" : "26px",
        height: "26px",
        padding: "0 6px",
        background: "#1a1000",
        border: "2px solid #c8861e",
        boxShadow: "2px 2px 0 #000",
        color: "#f0c050",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function Row({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        {keys.map((k) => (
          <Key key={k} label={k} wide={k.length > 2} />
        ))}
      </div>
      <span
        className="font-pixel"
        style={{ fontSize: "6px", color: "#6a5030" }}
      >
        {desc}
      </span>
    </div>
  );
}

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("tutorialShown")) setVisible(true);
  }, []);

  const dismiss = () => {
    ensureStarted();
    sessionStorage.setItem("tutorialShown", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.93)" }}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto pixel-scroll"
        style={{
          background: "#0d0b08",
          border: "3px solid #c8861e",
          boxShadow:
            "0 0 0 3px #000, inset 0 0 0 3px #000, 0 0 60px rgba(200,134,30,0.2)",
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden px-6 py-5"
          style={{
            background: "#0a0800",
            borderBottom: "3px solid #000",
          }}
        >
          {/* scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
              pointerEvents: "none",
            }}
          />
          <p
            className="font-pixel relative"
            style={{ fontSize: "6px", color: "#4a3210", letterSpacing: "0.25em", marginBottom: "8px" }}
          >
            ✦ WELCOME TO ✦
          </p>
          <h1
            className="font-pixel relative"
            style={{ fontSize: "16px", color: "#f0c050", lineHeight: 1.4 }}
          >
            THE FRONTIER
          </h1>
          <p
            className="font-pixel relative"
            style={{ fontSize: "6px", color: "#7a5818", marginTop: "8px", letterSpacing: "0.1em" }}
          >
            A PIXEL RPG PORTFOLIO · AMAN AHMAD
          </p>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Pitch */}
          <p
            className="font-mono"
            style={{ color: "#8a7050", fontSize: "12px", lineHeight: 1.8 }}
          >
            This is an interactive portfolio. Walk your hero around a pixel world,
            approach buildings, and press{" "}
            <strong style={{ color: "#f0c050" }}>E</strong> to step inside and
            read about my work.
          </p>

          {/* Controls */}
          <div>
            <p
              className="font-pixel"
              style={{
                fontSize: "7px",
                color: "#4a3210",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              ▸ HOW TO PLAY
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Row keys={["W", "A", "S", "D"]} desc="MOVE YOUR HERO" />
              <Row keys={["↑","↓","←","→"]} desc="ALSO WORKS" />
              <Row keys={["SHIFT"]} desc="SPRINT (HOLD)" />
              <Row keys={["E"]} desc="ENTER BUILDING (WHEN PROMPT SHOWS)" />
              <Row keys={["ESC"]} desc="CLOSE ANY PANEL" />
            </div>
          </div>

          {/* Building legend */}
          <div>
            <p
              className="font-pixel"
              style={{
                fontSize: "7px",
                color: "#4a3210",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              ▸ WHAT EACH BUILDING HOLDS
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              {BUILDINGS_LEGEND.map((b) => (
                <div
                  key={b.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    background: "#050400",
                    border: "2px solid #1e1600",
                    boxShadow: "0 0 0 1px #000",
                  }}
                >
                  <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>
                    {b.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="font-pixel"
                      style={{ fontSize: "5px", color: "#c8861e", marginBottom: "4px" }}
                    >
                      {b.name}
                    </p>
                    <p
                      className="font-mono"
                      style={{ fontSize: "10px", color: "#5a4828" }}
                    >
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip banner */}
          <div
            style={{
              padding: "10px 14px",
              background: "#050a00",
              border: "2px solid #1a3000",
              boxShadow: "0 0 0 1px #000",
            }}
          >
            <p
              className="font-pixel"
              style={{ fontSize: "6px", color: "#3a5a20", lineHeight: 2 }}
            >
              💡 NAME LABELS FLOAT ABOVE EVERY BUILDING.
              WALK TOWARD ONE — THE [E] PROMPT WILL APPEAR.
            </p>
          </div>

          {/* CTA button */}
          <button
            onClick={dismiss}
            className="font-pixel w-full py-4"
            style={{
              background: "#c8861e",
              border: "3px solid #000",
              boxShadow: "4px 4px 0 #000",
              color: "#000",
              fontSize: "11px",
              letterSpacing: "0.12em",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#f0c050";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#c8861e";
            }}
          >
            ▶ START EXPLORING
          </button>

          <p
            className="font-pixel text-center"
            style={{ fontSize: "5px", color: "#2a1808" }}
          >
            THIS MESSAGE WON'T SHOW AGAIN THIS SESSION
          </p>
        </div>
      </div>
    </div>
  );
}
