"use client";

import InfoPanel from "../InfoPanel";
import skills from "@/lib/data/skills.json";

type Props = { onClose: () => void };

const CATEGORY_META: Record<string, { icon: string; accent: string; chipColor: string }> = {
  "Languages": {
    icon: "📖",
    accent: "#1a1a40",
    chipColor: "#2a2a70",
  },
  "Frontend": {
    icon: "⚔",
    accent: "#0a3060",
    chipColor: "#1a5090",
  },
  "Backend": {
    icon: "🛡",
    accent: "#0a3010",
    chipColor: "#1a5020",
  },
  "Databases": {
    icon: "📦",
    accent: "#300a50",
    chipColor: "#501a80",
  },
  "Gen AI & Infra": {
    icon: "⚙",
    accent: "#3a2000",
    chipColor: "#6a4010",
  },
};

const DEFAULT_META = { icon: "⚡", accent: "#1e1600", chipColor: "#3a2800" };

export default function ArmoryPanel({ onClose }: Props) {
  return (
    <InfoPanel
      title="THE ARMORY"
      subtitle="SKILLS & ARSENAL"
      icon="🗡"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((category) => {
          const meta = CATEGORY_META[category.category] ?? DEFAULT_META;
          return (
            <div
              key={category.category}
              style={{
                background: "#050400",
                border: `2px solid ${meta.accent}`,
                boxShadow: `0 0 0 2px #000, inset 0 0 0 2px #000`,
              }}
            >
              {/* Category header */}
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{
                  background: meta.accent,
                  borderBottom: "2px solid #000",
                }}
              >
                <span className="text-base leading-none select-none">
                  {meta.icon}
                </span>
                <h3
                  className="font-pixel text-[7px]"
                  style={{ color: "#f0c050" }}
                >
                  {category.category.toUpperCase()}
                </h3>
              </div>

              {/* Skill chips */}
              <div className="p-3 flex flex-wrap gap-1.5">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="font-pixel text-[6px] px-2 py-1.5"
                    style={{
                      background: meta.chipColor,
                      border: "2px solid #000",
                      boxShadow: "2px 2px 0 #000",
                      color: "#e0d0a0",
                      cursor: "default",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p
        className="font-pixel text-[6px] text-center mt-4"
        style={{ color: "#2a2010" }}
      >
        ✦ ALWAYS LEARNING · ALWAYS SHIPPING ✦
      </p>
    </InfoPanel>
  );
}
