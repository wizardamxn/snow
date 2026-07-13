"use client";

import InfoPanel from "../InfoPanel";
import experience from "@/lib/data/experience.json";

type Props = { onClose: () => void };

const box = (accent = "#2a1a00"): React.CSSProperties => ({
  border: `2px solid ${accent}`,
  boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
  background: "#080600",
});

const TECH_COLOR: Record<string, string> = {
  "Next.js": "#a0a0a0",
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
              ...box(exp.current ? "#6a3800" : "#1e1600"),
              borderLeftWidth: "4px",
              borderLeftColor: exp.current ? "#c8861e" : "#2a2010",
            }}
          >
            <div className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3
                    className="font-pixel text-[9px] leading-snug"
                    style={{ color: "#f0c050" }}
                  >
                    {exp.role.toUpperCase()}
                  </h3>
                  <p
                    className="font-pixel text-[7px] mt-2"
                    style={{ color: exp.current ? "#c8861e" : "#4a3210" }}
                  >
                    {exp.company.toUpperCase()}
                  </p>
                  <p
                    className="font-pixel text-[6px] mt-1.5"
                    style={{ color: "#2a2010" }}
                  >
                    {exp.period} · {exp.location.toUpperCase()}
                  </p>
                </div>
                {exp.current && (
                  <span
                    className="flex-shrink-0 font-pixel text-[6px] px-2 py-1"
                    style={{
                      background: "#0a2000",
                      border: "2px solid #40a020",
                      boxShadow: "0 0 0 2px #000",
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
                style={{ color: "#8a7050" }}
              >
                {exp.summary}
              </p>

              {/* Highlights */}
              <ul className="space-y-1.5 mb-3">
                {exp.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span
                      className="font-pixel text-[7px] flex-shrink-0 mt-0.5"
                      style={{ color: "#c8861e" }}
                    >
                      ▸
                    </span>
                    <span
                      className="font-mono text-xs leading-relaxed"
                      style={{ color: "#a09070" }}
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
                    className="font-pixel text-[6px] px-2 py-1"
                    style={{
                      background: "#050400",
                      border: "2px solid #1e1600",
                      boxShadow: "0 0 0 1px #000",
                      color: TECH_COLOR[t] ?? "#6a5030",
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
