"use client";

import Image from "next/image";
import InfoPanel from "../InfoPanel";

type Props = { onClose: () => void };

const STATS = [
  { label: "EXP", value: "9+ MO" },
  { label: "INTERNS", value: "2" },
  { label: "PROJ", value: "5" },
  { label: "STACK", value: "FULL" },
];

const LINKS = [
  { label: "GITHUB", handle: "@wizardamxn", href: "https://github.com/wizardamxn" },
  { label: "LINKEDIN", handle: "amanahmad1", href: "https://linkedin.com/in/amanahmad1" },
  { label: "EMAIL", handle: "amank225566", href: "mailto:amank225566@gmail.com" },
  { label: "RESUME", handle: "DOWNLOAD PDF", href: "/resume.pdf" },
];

/** Shared inline pixel box style */
const box = (color = "#c8861e"): React.CSSProperties => ({
  border: `2px solid ${color}`,
  boxShadow: `0 0 0 2px #000, inset 0 0 0 2px #000`,
  background: "#0a0800",
});

export default function SanctumPanel({ onClose }: Props) {
  return (
    <InfoPanel
      title="THE SANCTUM"
      subtitle="HERO PROFILE"
      icon="⚔"
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* ── Avatar + intro ─────────────────────────────────────────────── */}
        <div className="flex gap-4 items-start">
          <div
            className="relative flex-shrink-0 h-20 w-20 overflow-hidden pixel-img"
            style={box()}
          >
            <Image
              src="/avatar.png"
              alt="Aman Ahmad"
              fill
              sizes="80px"
              className="object-cover object-top pixel-img"
              priority
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <div className="min-w-0">
            <h3
              className="font-pixel text-[11px] leading-snug"
              style={{ color: "#f0c050" }}
            >
              AMAN AHMAD
            </h3>
            <p
              className="font-pixel text-[7px] mt-2"
              style={{ color: "#8a6820" }}
            >
              FULL STACK DEV
            </p>
            <p
              className="font-mono text-xs mt-2 leading-relaxed"
              style={{ color: "#a09070" }}
            >
              Shipping production-grade apps — React, Next.js, Node,
              React Native, AWS EC2 — while finishing a B.Tech in ECE (2027).
            </p>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="p-3 text-center"
              style={box()}
            >
              <div
                className="font-pixel text-[9px] leading-none"
                style={{ color: "#f0c050" }}
              >
                {s.value}
              </div>
              <div
                className="font-pixel text-[6px] mt-2"
                style={{ color: "#4a3210" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bio ────────────────────────────────────────────────────────── */}
        <div className="p-4 space-y-3" style={box("#3a2808")}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: "#c0a878" }}>
            Interning at{" "}
            <span className="font-pixel text-[8px]" style={{ color: "#f0c050" }}>CEROPE</span>
            {" "}— Next.js + MERN stack + React Native mobile, Redis caching that cut API
            latency from ~10s to under 200ms.
          </p>
          <p className="font-mono text-xs leading-relaxed" style={{ color: "#6a5838" }}>
            Previously interned at{" "}
            <span className="font-pixel text-[8px]" style={{ color: "#8a6820" }}>KODECOMPILER</span>
            {" "}— built a sandboxed LeetCode-style code execution engine from scratch. Freelance
            projects include AI media converter AVMG, RAG chat platform ProjectTeams,
            agri-marketplace KropiGo, and CRM SolarVistar.
          </p>
        </div>

        {/* ── Links ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("mailto") || l.href.startsWith("/") ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 font-pixel text-[7px] transition-colors"
              style={box()}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1a1000";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0a0800";
              }}
            >
              <span style={{ color: "#f0c050" }}>{l.label}</span>
              <span style={{ color: "#4a3210" }}>{l.handle}</span>
            </a>
          ))}
        </div>
      </div>
    </InfoPanel>
  );
}
