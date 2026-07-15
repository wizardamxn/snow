"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCaseStudy } from "@/lib/actions/caseStudies";
import projectsData from "@/lib/data/projects.json";

/**
 * Explicit type so TypeScript doesn't complain about optional fields that only
 * appear on some entries in the JSON array.
 */
type Project = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  image: string;
  liveUrl?: string;
  livePrivate?: boolean;
  repoUrl?: string;
  repoUrls?: { label: string; url: string }[];
  repoPrivate?: boolean;
  technologies: string[];
};

const projects = projectsData as Project[];

type Props = {
  /** ID from projects.json */
  projectId: string;
  /** Close the entire panel stack (Esc / ✕) */
  onClose: () => void;
  /** If provided, shows a "← Back" button that returns to the caller (e.g. RelicsPanel grid) */
  onBack?: () => void;
};

/**
 * Full-screen project detail panel. Now prop-driven (no longer self-subscribing
 * to bus.onOpen) so it can be embedded inside RelicsPanel's gallery flow.
 */
export default function ProjectPanel({ projectId, onClose, onBack }: Props) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Esc closes the whole stack
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  // Fetch case study when project changes
  useEffect(() => {
    setMarkdown(null);
    setLoading(true);
    getCaseStudy(projectId)
      .then((content) => setMarkdown(content))
      .catch(() => setMarkdown(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const repoLinks =
    project.repoUrls ??
    (project.repoUrl ? [{ label: "Repository", url: project.repoUrl }] : []);

  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[86vh] w-full max-w-3xl overflow-y-auto pixel-scroll text-stone-100"
        style={{
          background: "#0d0b08",
          border: "3px solid #c8861e",
          boxShadow: "0 0 0 3px #000, inset 0 0 0 3px #000, 0 0 0 8px rgba(200,134,30,0.15)",
          imageRendering: "pixelated",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top action bar ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "3px solid #000", background: "#0a0800" }}
        >
          {onBack && (
            <button
              onClick={onBack}
              className="font-pixel text-[7px] px-3 py-2"
              style={{
                background: "#0a0600",
                border: "2px solid #4a3010",
                boxShadow: "2px 2px 0 #000",
                color: "#c8861e",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#c8861e"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#4a3010"; }}
            >
              ◄ BACK TO VAULT
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="font-pixel text-[7px] px-3 py-2"
              style={{
                background: "#1a0a00",
                border: "2px solid #c8861e",
                boxShadow: "2px 2px 0 #000",
                color: "#c8861e",
              }}
              aria-label="Close project panel"
            >
              [X] CLOSE
            </button>
          </div>
        </div>

        {/* ── Hero image ─────────────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "200px", borderBottom: "3px solid #000" }}
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 48rem"
            className="object-cover pixel-img"
            style={{ imageRendering: "pixelated", filter: "contrast(1.05) saturate(0.95)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(13,11,8,0.95) 0%, rgba(13,11,8,0.3) 50%, transparent 100%)",
            }}
          />
          {/* Title over image */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2
              className="font-pixel text-[11px] leading-snug"
              style={{ color: "#f0c050" }}
            >
              {project.title.toUpperCase()}
            </h2>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="space-y-5 p-5">
          {/* Description */}
          <p
            className="font-mono text-sm leading-relaxed"
            style={{ color: "#a09070" }}
          >
            {project.description}
          </p>

          {/* Key highlights */}
          <div
            style={{
              background: "#050400",
              border: "2px solid #1e1600",
              boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
            }}
          >
            <div
              className="px-4 py-2.5"
              style={{ borderBottom: "2px solid #000", background: "#0a0800" }}
            >
              <h3 className="font-pixel text-[7px]" style={{ color: "#c8861e" }}>
                &gt; KEY HIGHLIGHTS
              </h3>
            </div>
            <ul className="p-4 space-y-2">
              {project.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="font-pixel text-[7px] flex-shrink-0 mt-0.5" style={{ color: "#c8861e" }}>&gt;</span>
                  <span className="font-mono text-xs leading-relaxed" style={{ color: "#a09070" }}>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="font-pixel text-[7px] mb-2" style={{ color: "#4a3210" }}>
              &gt; TECHNOLOGIES
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((t) => (
                <span
                  key={t}
                  className="font-pixel text-[6px] px-2 py-1"
                  style={{
                    background: "#050400",
                    border: "2px solid #1e1600",
                    boxShadow: "1px 1px 0 #000",
                    color: "#6a5030",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div
            className="flex flex-wrap gap-2 pt-4"
            style={{ borderTop: "2px solid #000" }}
          >
            {project.liveUrl && !project.livePrivate && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pixel text-[7px] px-4 py-2"
                style={{
                  background: "#c8861e",
                  border: "2px solid #000",
                  boxShadow: "3px 3px 0 #000",
                  color: "#000",
                }}
              >
                ▶ LIVE DEMO
              </a>
            )}
            {project.livePrivate && (
              <span
                className="font-pixel text-[6px] px-3 py-2"
                style={{ background: "#050400", border: "2px solid #1e1600", color: "#2a2010" }}
              >
                LIVE — CLIENT PRIVATE
              </span>
            )}
            {!project.repoPrivate &&
              repoLinks.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-pixel text-[7px] px-4 py-2"
                  style={{
                    background: "#0a0800",
                    border: "2px solid #c8861e",
                    boxShadow: "3px 3px 0 #000",
                    color: "#c8861e",
                  }}
                >
                  ◈ {r.label}
                </a>
              ))}
            {project.repoPrivate && (
              <span
                className="font-pixel text-[6px] px-3 py-2"
                style={{ background: "#050400", border: "2px solid #1e1600", color: "#2a2010" }}
              >
                REPO — PRIVATE
              </span>
            )}
          </div>

          {/* Case study markdown */}
          {loading ? (
            <div
              className="py-8 text-center font-pixel text-[7px]"
              style={{ borderTop: "2px solid #000", color: "#3a2808" }}
            >
              LOADING CASE STUDY...
            </div>
          ) : markdown ? (
            <div style={{ borderTop: "2px solid #000", paddingTop: "20px" }}>
              <h3 className="font-pixel text-[7px] mb-4" style={{ color: "#4a3210" }}>
                &gt; CASE STUDY
              </h3>
              <article className="prose prose-stone prose-invert max-w-none text-stone-300 text-sm leading-relaxed prose-headings:font-mono prose-headings:text-amber-400/90 prose-a:text-amber-300 prose-strong:text-stone-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              </article>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
