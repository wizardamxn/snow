"use client";

import { useState } from "react";
import Image from "next/image";
import InfoPanel from "../InfoPanel";
import ProjectPanel, { INK } from "../ProjectPanel";
import projectsData from "@/lib/data/projects.json";

type Project = { id: string; title: string; image: string; livePrivate?: boolean; repoPrivate?: boolean };

const projects = projectsData as Project[];

type Props = { onClose: () => void };

/** The vault as a scroll of posters: picture and name only. Pick one to open its full page. */
export default function RelicsPanel({ onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <ProjectPanel projectId={selectedId} onClose={onClose} onBack={() => setSelectedId(null)} />;
  }

  return (
    <InfoPanel title="VAULT OF RELICS" subtitle="PROJECTS & WORKS" icon="🏺" onClose={onClose} maxWidth="max-w-3xl">
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setSelectedId(p.id)}
              aria-label={`Open ${p.title}`}
              className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8e2f1c]"
            >
              <span
                className="relative block aspect-[16/10] w-full overflow-hidden transition-transform group-hover:-translate-y-0.5"
                style={{ border: "4px solid #b8862a", boxShadow: `0 0 0 2px ${INK.rule}, 3px 3px 0 2px rgba(74,48,26,0.35)` }}
              >
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 240px"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </span>
              <span className="mt-2 flex items-center justify-center gap-1.5">
                <span className="font-pixel text-[9px] text-center group-hover:underline" style={{ color: INK.heading }}>
                  {p.title.toUpperCase()}
                </span>
                {(p.livePrivate || p.repoPrivate) && (
                  <span className="font-pixel text-[6px] px-1 py-0.5" style={{ background: "#5b4a3a", color: "#fbeccd" }}>
                    PRIVATE
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </InfoPanel>
  );
}
