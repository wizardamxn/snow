"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import projectsData from "@/lib/data/projects.json";
import ProjectPanel from "@/components/overlay/ProjectPanel";
import { PanelThemeContext } from "@/components/overlay/InfoPanel";

type Project = { id: string; title: string; image: string; livePrivate?: boolean; repoPrivate?: boolean };

const projects = projectsData as Project[];

/**
 * Projects as a wall of posters (picture + name). Tapping one opens the same
 * trimmed detail scroll the game uses, as a full-screen modal over the page.
 */
export default function ProjectScroll() {
  const [openId, setOpenId] = useState<string | null>(null);

  // The page behind shouldn't scroll while the detail scroll is open (phones especially).
  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId]);

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpenId(p.id)}
              aria-label={`Open ${p.title}`}
              className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0c050]"
            >
              <span
                className="relative block aspect-[16/10] w-full overflow-hidden"
                style={{ border: "2px solid #2a1800", boxShadow: "0 0 0 2px #000" }}
              >
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 260px"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </span>
              <span className="mt-2 flex items-center justify-center gap-1.5">
                <span className="font-pixel text-[8px] text-center group-hover:underline" style={{ color: "#f0c050" }}>
                  {p.title.toUpperCase()}
                </span>
                {(p.livePrivate || p.repoPrivate) && (
                  <span className="font-pixel text-[6px] px-1 py-0.5" style={{ background: "#3a2a1a", color: "#c8a878" }}>
                    PRIVATE
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openId &&
        // Portal to <body>: animated (transformed) ancestors would otherwise trap `fixed`
        // inside the section and the sticky header would cover it. The scroll theme gives
        // the parchment the panel's ink colours are written for.
        createPortal(
          <PanelThemeContext.Provider value={{ frame: "scroll", ribbon: "purple" }}>
            <div className="fixed inset-0 z-[100]">
              <ProjectPanel projectId={openId} onClose={() => setOpenId(null)} />
            </div>
          </PanelThemeContext.Provider>,
          document.body,
        )}
    </>
  );
}
