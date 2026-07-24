"use client";

import Image from "next/image";
import CharacterSprite from "./CharacterSprite";
import { track } from "@/lib/analytics/track";

const LINKS = [
  { label: "amank225566@gmail.com", href: "mailto:amank225566@gmail.com" },
  { label: "GITHUB", href: "https://github.com/wizardamxn" },
  { label: "LINKEDIN", href: "https://linkedin.com/in/amanahmad1" },
  { label: "RESUME (PDF)", href: "/resume.pdf" },
];

export default function HeroBanner() {
  return (
    <section className="pixel-panel relative overflow-hidden">
      <div
        className="relative flex flex-col sm:flex-row items-center gap-6 px-6 py-8"
        style={{ background: "linear-gradient(180deg, #120e06 0%, #0a0700 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
          }}
        />

        {/* Portrait — the real photo, framed as the hero's character portrait */}
        <div
          className="relative z-10 shrink-0"
          style={{ background: "#050300", border: "3px solid #c8861e", boxShadow: "0 0 0 3px #000, 4px 4px 0 #000" }}
        >
          <div className="relative" style={{ width: 104, height: 104 }}>
            <Image src="/avatar.webp" alt="Aman Ahmad" fill sizes="104px" className="object-cover object-top" priority />
          </div>
        </div>

        <div className="relative z-10 min-w-0 flex-1 text-center sm:text-left">
          <p className="font-pixel text-[6px] mb-2" style={{ color: "#8a6820", letterSpacing: "0.2em" }}>
            ✦ THE ADVENTURER'S QUEST LOG ✦
          </p>
          <h1 className="font-pixel text-[16px]" style={{ color: "#f0c050" }}>
            AMAN AHMAD
          </h1>
          <p className="font-pixel text-[7px] mt-2" style={{ color: "#c8861e", letterSpacing: "0.1em" }}>
            CLASS: FULL-STACK DEVELOPER
          </p>
          <p className="mt-3 max-w-xl font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
            B.Tech &apos;27 · two production internships shipping web and mobile apps end-to-end —
            React, Next.js, Node, React Native, AWS EC2.
          </p>

          <div className="mt-3 flex justify-center sm:justify-start">
            <span
              className="font-pixel text-[6px] inline-flex items-center gap-1.5 px-2.5 py-1.5"
              style={{ background: "#0a2000", border: "2px solid #2a5a10", color: "#8ad060" }}
            >
              <span style={{ width: 5, height: 5, background: "#8ad060", display: "inline-block" }} />
              OPEN TO NEW QUESTS
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                download={l.label.includes("PDF") ? true : undefined}
                onClick={l.label.includes("PDF") ? () => track("resume_download") : undefined}
                className="font-pixel text-[6px] px-2.5 py-2 transition-colors"
                style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e", boxShadow: "2px 2px 0 #000" }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* In-game avatar — the animated Warrior the player controls, standing
            as a companion facing the résumé. Flipped to face inward; desktop
            only so the mobile stack stays photo + text. */}
        <div className="relative z-10 hidden lg:flex shrink-0 self-end items-end" style={{ height: 104 }}>
          <CharacterSprite who="knight" flip />
        </div>
      </div>
    </section>
  );
}
