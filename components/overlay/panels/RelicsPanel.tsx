"use client";

import { useState } from "react";
import Image from "next/image";
import InfoPanel from "../InfoPanel";
import ProjectPanel, { INK, SEAL } from "../ProjectPanel";
import projectsData from "@/lib/data/projects.json";

type Project = {
  id: string;
  title: string;
  description: string;
  image: string;
  liveUrl?: string;
  livePrivate?: boolean;
  repoPrivate?: boolean;
  technologies: string[];
};

const projects = projectsData as Project[];

type Props = { onClose: () => void };

/** The vault's ledger: one entry per project, picture on the left, the tale on the right. */
export default function RelicsPanel({ onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <ProjectPanel projectId={selectedId} onClose={onClose} onBack={() => setSelectedId(null)} />;
  }

  return (
    <InfoPanel title="VAULT OF RELICS" subtitle="PROJECTS & WORKS" icon="🏺" onClose={onClose} maxWidth="max-w-3xl">
      <p className="font-scroll italic text-[15px] mb-4" style={{ color: INK.muted }}>
        Five works, each with its full tale. Choose one to read it.
      </p>
      <ul className="flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="group grid w-full grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 p-3 text-left transition-colors hover:bg-[rgba(122,85,48,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8e2f1c]"
              style={{ border: `2px solid ${INK.rule}`, background: "rgba(255,248,226,0.45)" }}
            >
              <span
                className="relative block aspect-[16/10] w-full overflow-hidden"
                style={{ border: "4px solid #b8862a", boxShadow: `0 0 0 2px ${INK.rule}, 3px 3px 0 2px rgba(74,48,26,0.35)` }}
              >
                <Image src={p.image} alt="" fill sizes="(max-width: 640px) 100vw, 200px" className="object-cover object-top" />
              </span>
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-pixel text-[11px]" style={{ color: INK.heading }}>
                    {p.title.toUpperCase()}
                  </span>
                  {(p.livePrivate || p.repoPrivate) && (
                    <span className="font-pixel text-[7px] px-1.5 py-1" style={{ ...SEAL, background: "#5b4a3a" }}>
                      PRIVATE
                    </span>
                  )}
                </span>
                <span className="font-scroll text-[15px] leading-snug" style={{ color: INK.body }}>
                  {p.description}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {p.technologies.slice(0, 5).map((t) => (
                    <span key={t} className="font-scroll text-[13px] px-1.5" style={{ color: INK.body, border: `1px solid ${INK.rule}` }}>
                      {t}
                    </span>
                  ))}
                  {p.technologies.length > 5 && (
                    <span className="font-scroll text-[13px]" style={{ color: INK.muted }}>
                      +{p.technologies.length - 5} more
                    </span>
                  )}
                </span>
                <span className="font-pixel text-[8px] mt-auto group-hover:underline" style={{ color: INK.accent }}>
                  READ THE FULL TALE ›
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </InfoPanel>
  );
}
