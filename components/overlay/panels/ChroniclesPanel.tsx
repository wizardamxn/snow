"use client";

import InfoPanel from "../InfoPanel";
import experience from "@/lib/data/experience.json";

type Props = { onClose: () => void };

const box = (accent = "var(--card-bg)"): React.CSSProperties => ({
  border: `2px solid ${accent}`,
  boxShadow: "0 0 0 2px var(--px-black), inset 0 0 0 2px var(--px-black)",
  background: "var(--card-bg)",
});

const TECH_COLOR: Record<string, string> = {
  "Next.js": "var(--ink-body)",
  React: "#60c8f0",
  "React Native": "#40d0e0",
  "Node.js": "#60d060",
  Express: "#50c050",
  MongoDB: "#50d050",
  Redis: "#e04040",
  Python: "#6090e0",
  FastAPI: "#40c0b0",
  "AWS EC2": "#e07030",
};

export default function ChroniclesPanel({ onClose }: Props) {
  return (
    <InfoPanel
      title="HALL OF CHRONICLES"
      subtitle="WORK EXPERIENCE"
      icon="📜"
      onClose={onClose}
    >
      <div className="space-y-4">
        {experience.map((exp) => (
          <div
            key={exp.id}
            className="relative overflow-hidden"
            style={{
              ...box(exp.current ? "var(--card-line)" : "var(--card-bg)"),
              borderLeftWidth: "4px",
              borderLeftColor: exp.current ? "var(--ink-accent)" : "var(--card-line)",
            }}
          >
            <div className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3
                    className="font-pixel text-[9px] leading-snug"
                    style={{ color: "var(--ink-strong)" }}
                  >
                    {exp.role.toUpperCase()}
                  </h3>
                  <p
                    className="font-pixel text-[7px] mt-2"
                    style={{ color: exp.current ? "var(--ink-accent)" : "var(--ink-muted)" }}
                  >
                    {exp.company.toUpperCase()}
                  </p>
                  <p
                    className="font-pixel text-[7px] mt-1.5"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {exp.period} · {exp.location.toUpperCase()}
                  </p>
                </div>
                {exp.current && (
                  <span
                    className="flex-shrink-0 font-pixel text-[7px] px-2 py-1"
                    style={{
                      background: "#0a2000",
                      border: "2px solid #40a020",
                      boxShadow: "0 0 0 2px var(--px-black)",
                      color: "#60d040",
                    }}
                  >
                    ● ACTIVE
                  </span>
                )}
              </div>

              {/* Summary */}
              <p
                className="font-mono text-xs leading-relaxed mb-3"
                style={{ color: "var(--ink-body)" }}
              >
                {exp.summary}
              </p>

              {/* Highlights */}
              <ul className="space-y-1.5 mb-3">
                {exp.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span
                      className="font-pixel text-[7px] flex-shrink-0 mt-0.5"
                      style={{ color: "var(--ink-accent)" }}
                    >
                      &gt;
                    </span>
                    <span
                      className="font-mono text-xs leading-relaxed"
                      style={{ color: "var(--ink-body)" }}
                    >
                      {h}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-1.5">
                {exp.technologies.map((t) => (
                  <span
                    key={t}
                    className="font-pixel text-[7px] px-2 py-1"
                    style={{
                      background: "var(--card-bg)",
                      border: "2px solid var(--card-bg)",
                      boxShadow: "0 0 0 1px var(--px-black)",
                      color: `var(--chip-ink, ${TECH_COLOR[t] ?? "var(--ink-muted)"})`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </InfoPanel>
  );
}
