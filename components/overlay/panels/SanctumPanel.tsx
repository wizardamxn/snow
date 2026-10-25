"use client";

import Image from "next/image";
import InfoPanel from "../InfoPanel";
import { track } from "@/lib/analytics/track";

type Props = { onClose: () => void };

const STATS = [
  { label: "EXP", value: "1 YR" },
  { label: "INTERNS", value: "3" },
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
const box = (color = "var(--ink-accent)"): React.CSSProperties => ({
  border: `2px solid ${color}`,
  boxShadow: `0 0 0 2px var(--px-black), inset 0 0 0 2px var(--px-black)`,
  background: "var(--card-bg)",
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
              src="/avatar.webp"
              alt="Aman Ahmad"
              fill
              sizes="80px"
              className="object-cover"
              priority
              style={{ objectPosition: "50% 30%" }}
            />
          </div>
          <div className="min-w-0">
            <h3
              className="font-pixel text-[11px] leading-snug"
              style={{ color: "var(--ink-strong)" }}
            >
              AMAN AHMAD
            </h3>
            <p
              className="font-pixel text-[7px] mt-2"
              style={{ color: "var(--ink-muted)" }}
            >
              FULL STACK DEV
            </p>
            <p
              className="font-mono text-xs mt-2 leading-relaxed"
              style={{ color: "var(--ink-body)" }}
            >
              Shipping production-grade apps and AI agents — React, Next.js,
              Node, React Native, Claude API — while finishing a B.Tech in ECE (2027).
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
                style={{ color: "var(--ink-strong)" }}
              >
                {s.value}
              </div>
              <div
                className="font-pixel text-[7px] mt-2"
                style={{ color: "var(--ink-muted)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bio ────────────────────────────────────────────────────────── */}
        <div className="p-4 space-y-3" style={box("var(--card-line)")}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--ink-body)" }}>
            Interning at{" "}
            <span className="font-pixel text-[8px]" style={{ color: "var(--ink-strong)" }}>10EX.AI</span>
            {" "}— building AI agents that do marketing on their own: a website chatbot that talks
            to visitors, a blog agent that writes and publishes posts, and agents that run on a
            schedule set in plain English.
          </p>
          <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--ink-body)" }}>
            Previously interned at{" "}
            <span className="font-pixel text-[8px]" style={{ color: "var(--ink-muted)" }}>CEROPE</span>
            {" "}— Redis caching that cut API latency from ~10s to under 200ms — and at{" "}
            <span className="font-pixel text-[8px]" style={{ color: "var(--ink-muted)" }}>KODECOMPILER</span>
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
              onClick={l.href === "/resume.pdf" ? () => track("resume_download") : undefined}
              className="group flex items-center gap-2 px-3 py-2 font-pixel text-[7px] transition-colors"
              style={box()}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
              }}
            >
              <span style={{ color: "var(--ink-strong)" }}>{l.label}</span>
              <span style={{ color: "var(--ink-muted)" }}>{l.handle}</span>
            </a>
          ))}
        </div>
      </div>
    </InfoPanel>
  );
}
