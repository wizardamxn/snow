"use client";

import { useState } from "react";
import Image from "next/image";
import InfoPanel from "../InfoPanel";
import ProjectPanel from "../ProjectPanel";
import projectsData from "@/lib/data/projects.json";

type Project = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  image: string;
  liveUrl?: string;
  livePrivate?: boolean;
  repoPrivate?: boolean;
  technologies: string[];
};

const projects = projectsData as Project[];

type Props = { onClose: () => void };

export default function RelicsPanel({ onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Level 2: project detail ──────────────────────────────────────────────
  if (selectedId) {
    return (
      <ProjectPanel
        projectId={selectedId}
        onClose={onClose}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  // ── Level 1: gallery grid ────────────────────────────────────────────────
  return (
    <InfoPanel
      title="VAULT OF RELICS"
      subtitle="PROJECTS & WORKS"
      icon="🏺"
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedId(project.id)}
            className="group text-left focus:outline-none"
            style={{
              background: "#050400",
              border: "2px solid #1e1600",
              boxShadow: "0 0 0 2px #000",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#c8861e";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 0 2px #000, 4px 4px 0 #000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1e1600";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #000";
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative overflow-hidden"
              style={{ height: "120px", borderBottom: "2px solid #000" }}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover pixel-img"
                style={{
                  imageRendering: "pixelated",
                  filter: "contrast(1.1) saturate(0.9)",
                }}
              />
              {/* Dark overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(5,4,0,0.9) 0%, rgba(5,4,0,0.2) 50%, transparent 100%)",
                }}
              />
              {/* Private badge */}
              {(project.livePrivate || project.repoPrivate) && (
                <span
                  className="absolute top-1.5 right-1.5 font-pixel text-[6px] px-1.5 py-1"
                  style={{
                    background: "#000",
                    border: "2px solid #3a2808",
                    color: "#4a3820",
                  }}
                >
                  PRIVATE
                </span>
              )}
              {/* Title over image */}
              <div className="absolute bottom-2 left-2 right-2">
                <h3
                  className="font-pixel text-[8px] leading-tight"
                  style={{ color: "#f0c050" }}
                >
                  {project.title.toUpperCase()}
                </h3>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p
                className="font-mono text-xs leading-relaxed"
                style={{
                  color: "#5a4828",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {project.description}
              </p>

              {/* Tech tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {project.technologies.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="font-pixel text-[5px] px-1.5 py-0.5"
                    style={{
                      background: "#0a0800",
                      border: "1px solid #2a1e00",
                      color: "#3a2e10",
                    }}
                  >
                    {t}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span
                    className="font-pixel text-[5px] px-1.5 py-0.5"
                    style={{ color: "#2a1e00" }}
                  >
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* View prompt */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: "2px solid #0a0800" }}
            >
              <span
                className="font-pixel text-[6px]"
                style={{ color: "#2a1e00" }}
              >
                INSPECT RELIC
              </span>
              <span
                className="font-pixel text-[7px]"
                style={{ color: "#4a3210" }}
              >
                ▸
              </span>
            </div>
          </button>
        ))}
      </div>
    </InfoPanel>
  );
}
