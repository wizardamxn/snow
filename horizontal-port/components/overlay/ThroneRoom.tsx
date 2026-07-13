"use client";

import Image from "next/image";
import { useState } from "react";
import { worldState } from "@/lib/world/worldState";
import experienceData from "@/lib/data/experience.json";
import skillsData from "@/lib/data/skills.json";
import testimonialsData from "@/lib/data/testimonials.json";

type Tab = "about" | "experience" | "skills" | "testimonials" | "contact";

export default function ThroneRoom() {
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [copiedItem, setCopiedItem] = useState<"email" | "discord" | null>(null);

  const EMAIL = "amank225566@gmail.com";
  const DISCORD = "wizardamxn";

  const copyText = async (text: string, type: "email" | "discord") => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleExit = () => {
    worldState.scene = "overworld";
    // Reset knight worldX slightly away from castle so they don't immediately re-trigger prompt
    worldState.worldX = 15300;
  };

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-between bg-black/40 p-6 font-mono text-stone-100">
      
      {/* Top Banner: Navigation and Exit */}
      <div className="flex w-full max-w-4xl items-center justify-between border-b border-amber-500/40 pb-4">
        <button
          onClick={handleExit}
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all active:scale-95"
        >
          ⇠ Exit Castle
        </button>

        <h1 className="hidden sm:block text-sm font-bold uppercase tracking-widest text-amber-400">
          Throne Room
        </h1>

        <div className="flex gap-1.5 sm:gap-2">
          {(["about", "experience", "skills", "testimonials", "contact"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                activeTab === tab
                  ? "bg-amber-500 text-black font-black"
                  : "border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="my-6 flex w-full max-w-4xl flex-1 flex-col overflow-y-auto rounded-xl border-2 border-amber-500/60 bg-stone-900/90 p-6 shadow-2xl backdrop-blur-md">
        
        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start flex-1 justify-center">
            <div className="relative h-44 w-44 overflow-hidden rounded-xl border-2 border-amber-500/50 bg-stone-950 p-1 shadow-lg shrink-0">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <Image
                  src="/avatar.png"
                  alt="Aman Ahmad"
                  fill
                  sizes="11rem"
                  className="object-cover pixelated"
                />
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-2xl font-bold text-amber-300">Aman Ahmad</h2>
                <p className="text-xs text-amber-500/70 font-semibold tracking-wider mt-0.5">
                  FULL STACK DEVELOPER
                </p>
              </div>

              <p className="text-sm leading-relaxed text-stone-300 max-w-xl">
                I build clean, end-to-end web and mobile applications with high-performance architectures (Next.js, FastAPI, React Native, MERN stack, Redis caching). I focus on provisioning production infrastructure on AWS/EC2, streamlining API performance, and building interactive client solutions.
              </p>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                <a
                  href="https://github.com/Valtryek"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                >
                  GitHub ↗
                </a>
                <a
                  href="https://linkedin.com/in/amanahmad1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                >
                  LinkedIn ↗
                </a>
                <a
                  href="https://instagram.com/aman_ahmad04"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-stone-950 border border-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition"
                >
                  Instagram ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            {experienceData.map((exp) => (
              <div key={exp.id} className="relative pl-6 border-l-2 border-amber-500/40">
                <div className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h3 className="text-lg font-bold text-amber-300">{exp.role}</h3>
                    <p className="text-sm font-semibold text-stone-400">{exp.company} — {exp.location}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded sm:self-start">
                    {exp.period}
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-stone-400 italic">
                  {exp.summary}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {exp.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2 text-xs text-stone-300">
                      <span className="text-amber-500">▸</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {exp.technologies.map((t) => (
                    <span key={t} className="rounded bg-stone-950 border border-stone-850 px-2 py-0.5 text-[10px] text-stone-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SKILLS TAB */}
        {activeTab === "skills" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {skillsData.map((cat) => (
              <div key={cat.category} className="rounded-lg bg-stone-950 border border-stone-850 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-stone-850 pb-1.5">
                  {cat.category}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-stone-800 bg-stone-900 px-2.5 py-1 text-xs text-stone-300 hover:border-amber-500/40 hover:text-amber-300 transition duration-150"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {activeTab === "testimonials" && (
          <div className="flex flex-col gap-6 items-center justify-center h-full max-w-xl mx-auto">
            {testimonialsData.map((t, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-amber-500/30 bg-stone-950 p-5 pt-7 text-center w-full"
              >
                <span className="absolute top-2 left-4 text-5xl font-serif text-amber-500/20 leading-none select-none">
                  “
                </span>
                <p className="text-sm italic text-stone-300 leading-relaxed font-sans">
                  {t.quote}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="h-[2px] w-4 bg-amber-500/40" />
                  <span className="text-xs font-bold text-amber-300">{t.name}</span>
                  <span className="text-[10px] text-stone-500">({t.role} · {t.company})</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === "contact" && (
          <div className="flex flex-col gap-4 max-w-md mx-auto w-full items-center justify-center h-full">
            <h3 className="text-base font-bold text-amber-300 text-center mb-2">
              Let&apos;s build something together!
            </h3>

            {/* Email Copy Card */}
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-stone-950 px-4 py-3">
              <span className="text-xs text-stone-400 uppercase tracking-widest font-black">Email</span>
              <span className="text-xs text-stone-300 font-mono truncate">{EMAIL}</span>
              <button
                onClick={() => copyText(EMAIL, "email")}
                className="rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2 py-1 text-xs text-amber-300 transition"
              >
                {copiedItem === "email" ? "Copied ✓" : "Copy"}
              </button>
            </div>

            {/* Discord Copy Card */}
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-stone-950 px-4 py-3">
              <span className="text-xs text-stone-400 uppercase tracking-widest font-black">Discord</span>
              <span className="text-xs text-stone-300 font-mono truncate">{DISCORD}</span>
              <button
                onClick={() => copyText(DISCORD, "discord")}
                className="rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2 py-1 text-xs text-amber-300 transition"
              >
                {copiedItem === "discord" ? "Copied ✓" : "Copy"}
              </button>
            </div>

            {/* Resume button */}
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full text-center rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-black hover:bg-amber-400 transition"
            >
              📄 Download Resume
            </a>
          </div>
        )}

      </div>

      {/* Footer / Tip */}
      <div className="text-center text-[10px] text-stone-500">
        ⚔ Tiny Swords Portfolio · press Escape to close panel
      </div>

    </div>
  );
}
