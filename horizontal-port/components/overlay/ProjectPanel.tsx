"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { bus } from "@/lib/world/bus";
import { getCaseStudy } from "@/lib/actions/caseStudies";
import projects from "@/lib/data/projects.json";

type Project = (typeof projects)[number];

export default function ProjectPanel() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Fetch the case study markdown dynamically when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMarkdown(null);
      return;
    }
    setLoading(true);
    getCaseStudy(activeId)
      .then((content) => {
        setMarkdown(content);
      })
      .catch((err) => {
        console.error("Failed to load case study:", err);
        setMarkdown(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeId]);

  if (!activeId) return null;
  const project = projects.find((p) => p.id === activeId) as Project | undefined;
  if (!project) return null;

  const repoLinks =
    project.repoUrls ??
    (project.repoUrl ? [{ label: "Repository", url: project.repoUrl }] : []);

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => setActiveId(null)}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border-2 border-amber-500/60 bg-stone-900 text-stone-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setActiveId(null)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-3 py-1 font-mono text-sm hover:bg-black/70"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="relative h-60 w-full overflow-hidden rounded-t-xl bg-stone-800">
          <Image
            src={project.image}
            alt={project.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 48rem"
            className="object-cover"
          />
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h2 className="font-mono text-2xl font-bold text-amber-300">
              {project.title}
            </h2>
            <p className="mt-2 text-stone-300">
              {project.description}
            </p>
          </div>

          <div className="rounded-lg bg-stone-950 p-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-2">
              Key Highlights
            </h3>
            <ul className="space-y-2">
              {project.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-stone-300">
                  <span className="text-amber-400">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-2">
              Technologies Used
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((t) => (
                <span
                  key={t}
                  className="rounded border border-stone-800 bg-stone-950 px-2 py-0.5 font-mono text-xs text-stone-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stone-800 pt-4">
            {project.liveUrl && !project.livePrivate && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-amber-500 px-4 py-2 font-mono text-sm font-bold text-black hover:bg-amber-400 transitions"
              >
                Live Demo ↗
              </a>
            )}
            {project.livePrivate && (
              <span className="rounded-lg border border-stone-850 bg-stone-950 px-4 py-2 font-mono text-sm text-stone-500">
                Live — Client Private
              </span>
            )}
            {!project.repoPrivate &&
              repoLinks.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-amber-500/60 px-4 py-2 font-mono text-sm text-amber-300 hover:bg-amber-500/10 transitions"
                >
                  {r.label} ↗
                </a>
              ))}
            {project.repoPrivate && (
              <span className="rounded-lg border border-stone-850 bg-stone-950 px-4 py-2 font-mono text-sm text-stone-500">
                Repo — Private
              </span>
            )}
          </div>

          {/* Case Study Details Render */}
          {loading ? (
            <div className="py-8 text-center font-mono text-stone-500 border-t border-stone-800">
              Loading case study details...
            </div>
          ) : markdown ? (
            <div className="border-t border-stone-800 pt-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500/70 mb-4">
                Detailed Case Study
              </h3>
              <article className="prose prose-stone prose-invert max-w-none text-stone-300 text-sm leading-relaxed prose-headings:font-mono prose-headings:text-amber-400/90 prose-a:text-amber-300 prose-strong:text-stone-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
