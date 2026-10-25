"use client";

import { useEffect, useState, type ReactNode } from "react";
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
        style={{ fontSize: "7px", color: "#ac824e", lineHeight: 1.6 }}
      >
        {desc}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-pixel"
      style={{ fontSize: "7px", color: "#ad7525", letterSpacing: "0.1em", marginBottom: "10px" }}
    >
      {children}
    </p>
  );
}

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("tutorialShown")) setVisible(true);
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const dismiss = () => {
    ensureStarted();
    sessionStorage.setItem("tutorialShown", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.93)" }}
    >
      {/* Header + footer are pinned; only the middle scrolls, and only when the
          screen is too short for it. The CTAs used to sit at the end of one long
          scroll box, which on a ~720px-tall laptop pushed them below the fold. */}
      <div
        className="flex w-full max-w-3xl max-h-[94dvh] flex-col overflow-hidden"
        style={{
          background: "#0d0b08",
          border: "3px solid #c8861e",
          boxShadow:
            "0 0 0 3px #000, inset 0 0 0 3px #000, 0 0 60px rgba(200,134,30,0.2)",
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div
          className="relative shrink-0 overflow-hidden px-6 py-4"
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
            style={{ fontSize: "7px", color: "#ad7525", letterSpacing: "0.25em", marginBottom: "8px" }}
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
            style={{ fontSize: "7px", color: "#b28123", marginTop: "8px", letterSpacing: "0.1em" }}
          >
            A PIXEL RPG PORTFOLIO · AMAN AHMAD
          </p>
        </div>

        {/* ── Body — the only region that scrolls ──────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto pixel-scroll px-6 py-4 flex flex-col gap-4">
          {/* Pitch */}
          <p
            className="font-mono"
            style={{ color: "#a98d6a", fontSize: "12px", lineHeight: 1.8 }}
          >
            This is an interactive portfolio. Walk your hero around a pixel world,
            approach buildings, and press{" "}
            <strong style={{ color: "#f0c050" }}>E</strong> to step inside and
            read about my work.
          </p>

          {/* Phone players (reached via ?play=1) — the touch controls work, but
              this world was built for a keyboard. */}
          {isTouch && (
            <div
              style={{
                padding: "10px 14px",
                background: "#1a1000",
                border: "2px solid #c8861e",
                boxShadow: "0 0 0 1px #000",
              }}
            >
              <p className="font-pixel" style={{ fontSize: "7px", color: "#f0c050", lineHeight: 2 }}>
                💻 BEST ON A LAPTOP — OPEN THIS SITE ON A COMPUTER FOR THE FULL
                EXPERIENCE. ON-SCREEN CONTROLS WORK HERE TOO.
              </p>
            </div>
          )}

          {/* Controls | building legend — side by side on wide screens, which is
              what keeps the whole card inside one laptop viewport. */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <SectionLabel>&gt; HOW TO PLAY</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Row keys={["W", "A", "S", "D"]} desc="MOVE (OR ARROW KEYS)" />
                  <Row keys={["SHIFT"]} desc="SPRINT (HOLD)" />
                  <Row keys={["E"]} desc="ENTER BUILDING (WHEN PROMPT SHOWS)" />
                  <Row keys={["ESC"]} desc="CLOSE ANY PANEL" />
                </div>
              </div>

              {/* Tip banner — the first thing dropped on very short screens */}
              <div
                className="[@media(max-height:640px)]:hidden"
                style={{
                  padding: "10px 14px",
                  background: "#050a00",
                  border: "2px solid #1a3000",
                  boxShadow: "0 0 0 1px #000",
                }}
              >
                <p
                  className="font-pixel"
                  style={{ fontSize: "7px", color: "#5b8e32", lineHeight: 2 }}
                >
                  💡 NO NEED TO EXPLORE: CLICK A PLACE IN
                  &quot;WHERE TO?&quot; (OR PRESS 1–6) AND YOUR HERO WALKS THERE.
                  THE GOLD ARROW POINTS TO WHAT YOU HAVEN&apos;T SEEN.
                </p>
              </div>
            </div>

            {/* Building legend */}
            <div>
              <SectionLabel>&gt; WHAT EACH BUILDING HOLDS</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
                {BUILDINGS_LEGEND.map((b) => (
                  <div
                    key={b.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "6px 10px",
                      background: "#050400",
                      border: "2px solid #1e1600",
                      boxShadow: "0 0 0 1px #000",
                    }}
                  >
                    <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>
                      {b.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p
                        className="font-pixel"
                        style={{ fontSize: "7px", color: "#c8861e", marginBottom: "4px", lineHeight: 1.5 }}
                      >
                        {b.name}
                      </p>
                      <p
                        className="font-mono"
                        style={{ fontSize: "10px", color: "#9b7c45" }}
                      >
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer (pinned) — play, or skip straight to the plain resume.
            Side by side so a recruiter short on time sees the escape hatch. ── */}
        <div
          className="shrink-0 px-6 pt-4 pb-3 flex flex-col gap-3"
          style={{ background: "#0a0800", borderTop: "3px solid #000" }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
            <button
              onClick={dismiss}
              className="font-pixel py-4"
              style={{
                flex: "1 1 58%",
                background: "#c8861e",
                border: "3px solid #000",
                boxShadow: "4px 4px 0 #000",
                color: "#000",
                fontSize: "10px",
                letterSpacing: "0.1em",
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

            <a
              href="/resume"
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="font-pixel py-3 flex flex-col items-center justify-center text-center"
              style={{
                flex: "1 1 42%",
                background: "#0d0b08",
                border: "3px solid #c8861e",
                boxShadow: "4px 4px 0 #000",
                color: "#f0c050",
                fontSize: "8px",
                lineHeight: 1.8,
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1a1000";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0d0b08";
              }}
            >
              <span>📄 IN A HURRY?</span>
              <span style={{ color: "#ac824e", fontSize: "7px" }}>PLAIN RESUME →</span>
            </a>
          </div>

          <p
            className="font-pixel text-center"
            style={{ fontSize: "6px", color: "#b26622" }}
          >
            THIS MESSAGE WON&apos;T SHOW AGAIN THIS SESSION
          </p>
        </div>
      </div>
    </div>
  );
}
