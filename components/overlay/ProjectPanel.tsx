"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCaseStudy } from "@/lib/actions/caseStudies";
import projectsData from "@/lib/data/projects.json";
import ProjectMedia from "@/components/resume/ProjectMedia";
import InfoPanel from "./InfoPanel";

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
  tldr?: { problem: string; build: string; result: string };
  video?: string;
  poster?: string;
};

const projects = projectsData as Project[];

/** Ink colours for text written straight on the parchment. */
export const INK = {
  heading: "#7a2614",
  accent: "#8e2f1c",
  body: "#2e1f10",
  muted: "#6b4d2c",
  rule: "#b8925e",
};

/** A red wax seal — used for the main actions and stamps. */
export const SEAL: React.CSSProperties = {
  background: "#8e2f1c",
  color: "#fbeccd",
  border: "2px solid #4e150c",
  boxShadow: "2px 2px 0 rgba(78,21,12,0.45)",
};

type Props = {
  /** ID from projects.json */
  projectId: string;
  /** Close the entire panel stack (Esc / ✕) */
  onClose: () => void;
  /** If provided, shows a "Back to the vault" link that returns to the gallery */
  onBack?: () => void;
};

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-pixel text-[9px] mb-3 flex items-center gap-2" style={{ color: INK.heading }}>
    <span aria-hidden>❦</span>
    {children}
    <span aria-hidden className="h-px flex-1" style={{ background: INK.rule }} />
  </h3>
);

/** One project, written up as a scroll: picture, the story in three lines, deeds, tools, and the full chronicle. */
export default function ProjectPanel({ projectId, onClose, onBack }: Props) {
  const [markdown, setMarkdown] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getCaseStudy(projectId)
      .then((content) => live && setMarkdown(content))
      .catch(() => live && setMarkdown(null));
    return () => {
      live = false;
    };
  }, [projectId]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const repoLinks = project.repoUrls ?? (project.repoUrl ? [{ label: "Code", url: project.repoUrl }] : []);

  return (
    <InfoPanel title={project.title.toUpperCase()} subtitle="A RELIC OF THE VAULT" icon="🏺" onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex flex-col gap-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="font-pixel text-[8px] self-start hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8e2f1c]"
            style={{ color: INK.accent }}
          >
            ‹ BACK TO THE VAULT
          </button>
        )}

        {/* Picture in a gilded frame, with the one-line story beside the actions. */}
        <div
          className="relative w-full overflow-hidden aspect-[16/8]"
          style={{ border: "6px solid #b8862a", boxShadow: `0 0 0 2px ${INK.rule}, 4px 4px 0 2px rgba(74,48,26,0.35)` }}
        >
          <ProjectMedia
            video={project.video}
            poster={project.poster}
            image={project.image}
            alt={`${project.title} screenshot`}
            autoplay
            sizes="(max-width: 768px) 100vw, 46rem"
            className="object-cover object-top"
          />
        </div>

        <p className="font-scroll text-[18px] leading-relaxed" style={{ color: INK.body }}>
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.liveUrl && !project.livePrivate && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="font-pixel text-[8px] px-4 py-2.5 hover:brightness-110" style={SEAL}>
              ▶ VISIT IT LIVE
            </a>
          )}
          {!project.repoPrivate &&
            repoLinks.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pixel text-[8px] px-4 py-2.5 hover:bg-[rgba(142,47,28,0.08)]"
                style={{ color: INK.accent, border: `2px solid ${INK.accent}` }}
              >
                ◈ {r.label.toUpperCase()}
              </a>
            ))}
          {(project.livePrivate || project.repoPrivate) && (
            <span className="font-scroll italic text-[15px] self-center" style={{ color: INK.muted }}>
              {project.livePrivate && project.repoPrivate
                ? "Built for a client; the site and code are private."
                : project.livePrivate
                  ? "The live site is private to the client."
                  : "The code is private."}
            </span>
          )}
        </div>

        {project.tldr && (
          <section>
            <Heading>THE TALE IN BRIEF</Heading>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  ["THE PROBLEM", project.tldr.problem],
                  ["WHAT I BUILT", project.tldr.build],
                  ["THE RESULT", project.tldr.result],
                ] as const
              ).map(([label, text]) => (
                <div key={label} className="p-3" style={{ border: `2px solid ${INK.rule}`, background: "rgba(255,248,226,0.5)" }}>
                  <p className="font-pixel text-[7px] mb-2" style={{ color: INK.accent }}>
                    {label}
                  </p>
                  <p className="font-scroll text-[15px] leading-snug" style={{ color: INK.body }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <Heading>DEEDS</Heading>
          <ul className="flex flex-col gap-2">
            {project.highlights.map((h) => (
              <li key={h} className="flex gap-2.5 font-scroll text-[16px] leading-snug" style={{ color: INK.body }}>
                <span aria-hidden style={{ color: INK.accent }}>
                  ✦
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Heading>TOOLS OF THE CRAFT</Heading>
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span key={t} className="font-scroll text-[14px] px-2 py-0.5" style={{ color: INK.body, border: `1px solid ${INK.rule}`, background: "rgba(255,248,226,0.5)" }}>
                {t}
              </span>
            ))}
          </div>
        </section>

        {markdown && (
          <details className="group" style={{ borderTop: `2px dashed ${INK.rule}`, paddingTop: "16px" }}>
            <summary className="font-pixel text-[9px] cursor-pointer select-none list-none flex items-center gap-2" style={{ color: INK.heading }}>
              <span className="transition-transform group-open:rotate-90" aria-hidden>
                ▶
              </span>
              READ THE FULL CHRONICLE
            </summary>
            <article
              className="font-scroll mt-4 prose max-w-none text-[16px] leading-relaxed prose-headings:font-scroll prose-headings:font-bold prose-h1:text-[24px] prose-h2:text-[20px] prose-h3:text-[17px] prose-li:my-0.5 prose-pre:bg-[#2e1f10] prose-pre:text-[#f6e6c4] prose-code:before:content-none prose-code:after:content-none"
              style={
                {
                  "--tw-prose-body": INK.body,
                  "--tw-prose-headings": INK.heading,
                  "--tw-prose-links": INK.accent,
                  "--tw-prose-bold": INK.body,
                  "--tw-prose-bullets": INK.accent,
                  "--tw-prose-counters": INK.accent,
                  "--tw-prose-hr": INK.rule,
                  "--tw-prose-quotes": INK.muted,
                  "--tw-prose-quote-borders": INK.rule,
                  "--tw-prose-code": INK.heading,
                  "--tw-prose-th-borders": INK.rule,
                  "--tw-prose-td-borders": INK.rule,
                } as React.CSSProperties
              }
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </article>
          </details>
        )}
      </div>
    </InfoPanel>
  );
}
