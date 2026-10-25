"use client";

import InfoPanel from "../InfoPanel";
import testimonials from "@/lib/data/testimonials.json";

type Props = { onClose: () => void };

const AVATAR_BG = ["#4a2800", "#001840"];

export default function TestimoniesPanel({ onClose }: Props) {
  return (
    <InfoPanel
      title="HALL OF TESTIMONIES"
      subtitle="GUILD RECORDS"
      icon="📣"
      onClose={onClose}
    >
      <div className="space-y-4">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className="relative"
            style={{
              background: "var(--card-bg)",
              border: "2px solid var(--card-bg)",
              boxShadow: "0 0 0 2px var(--px-black), inset 0 0 0 2px var(--px-black)",
            }}
          >
            {/* Quote mark decoration */}
            <div
              className="px-4 pt-4"
              style={{
                borderBottom: "2px solid var(--card-bg)",
              }}
            >
              <p
                className="font-pixel text-[7px] mb-2"
                style={{ color: "var(--ink-muted)" }}
              >
                ❝ TESTIMONY
              </p>
              <p
                className="font-mono text-sm leading-relaxed italic pb-4"
                style={{ color: "var(--ink-body)" }}
              >
                {t.quote}
              </p>
            </div>

            {/* Attribution */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Pixel avatar square */}
              <div
                className="h-10 w-10 flex items-center justify-center flex-shrink-0 font-pixel text-[10px]"
                style={{
                  background: AVATAR_BG[i % AVATAR_BG.length],
                  border: "2px solid var(--px-black)",
                  boxShadow: "2px 2px 0 var(--px-black)",
                  color: "var(--ink-strong)",
                }}
              >
                {t.name.charAt(0)}
              </div>
              <div>
                <p
                  className="font-pixel text-[8px]"
                  style={{ color: "var(--ink-strong)" }}
                >
                  {t.name.toUpperCase()}
                </p>
                <p
                  className="font-pixel text-[7px] mt-1.5"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {t.role.toUpperCase()} · {t.company.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </InfoPanel>
  );
}
