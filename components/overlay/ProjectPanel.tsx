"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { bus } from "@/lib/world/bus";
import projects from "@/lib/data/projects.json";

type Project = (typeof projects)[number];

export default function ProjectPanel() {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Open when the world (or the E key) asks; close on Escape.
  useEffect(() => {
    const off = bus.onOpen((id) => setActiveId(id));
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!activeId) return null;
  const project = projects.find((p) => p.id === activeId) as Project | undefined;
  if (!project) return null;

  const repoLinks =
    project.repoUrls ??
    (project.repoUrl ? [{ label: "Repository", url: project.repoUrl }] : []);

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => setActiveId(null)}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border-2 border-amber-500/60 bg-stone-900 text-stone-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setActiveId(null)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 font-mono text-sm hover:bg-black/70"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-stone-800">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 42rem"
            className="object-cover"
          />
        </div>

        <div className="space-y-4 p-6">
          <h2 className="font-mono text-2xl font-bold text-amber-300">
            {project.title}
          </h2>
          <p className="text-sm leading-relaxed text-stone-300">
            {project.description}
          </p>

          <ul className="space-y-1.5">
            {project.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-sm text-stone-300">
                <span className="text-amber-400">▸</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span
                key={t}
                className="rounded border border-stone-700 bg-stone-800 px-2 py-0.5 font-mono text-xs text-stone-300"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {project.liveUrl && !project.livePrivate && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-black hover:bg-amber-400"
              >
                Live ↗
              </a>
            )}
            {project.livePrivate && (
              <span className="rounded-lg border border-stone-700 px-4 py-2 font-mono text-sm text-stone-500">
                Live — private (client-owned)
              </span>
            )}
            {!project.repoPrivate &&
              repoLinks.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-amber-500/60 px-4 py-2 font-mono text-sm text-amber-300 hover:bg-amber-500/10"
                >
                  {r.label} ↗
                </a>
              ))}
            {project.repoPrivate && (
              <span className="rounded-lg border border-stone-700 px-4 py-2 font-mono text-sm text-stone-500">
                Repo — private
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
