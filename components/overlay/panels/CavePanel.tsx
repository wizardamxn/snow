"use client";

import InfoPanel from "../InfoPanel";

type Props = { onClose: () => void };

const INSCRIPTIONS = [
  "The shadows breathe here. Stone older than the town below.",
  "Torchlight catches words carved deep — initials, dates, warnings.",
  "A cold draught flows outward, as if the mountain itself exhales.",
];

export default function CavePanel({ onClose }: Props) {
  return (
    <InfoPanel
      title="THE HOLLOW CAVE"
      subtitle="UNCHARTED TERRITORY"
      icon="🕯"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-center">
        {/* Pixel art cave icon */}
        <div
          className="mx-auto w-16 h-16 flex items-center justify-center text-4xl"
          style={{
            background: "#050300",
            border: "2px solid #1a1000",
            boxShadow: "0 0 0 2px #000, 4px 4px 0 #000",
          }}
        >
          ⛰
        </div>

        {/* Lore lines */}
        <div className="space-y-3 text-left">
          {INSCRIPTIONS.map((line, i) => (
            <p
              key={i}
              className="flex gap-2 font-mono text-sm leading-relaxed italic"
              style={{ color: "#6a5838" }}
            >
              <span
                className="font-pixel text-[7px] flex-shrink-0 mt-1"
                style={{ color: "#3a2808" }}
              >
                {i + 1}.
              </span>
              {line}
            </p>
          ))}
        </div>

        {/* Inscription block */}
        <div
          className="p-4 text-left"
          style={{
            background: "#030200",
            border: "2px solid #2a1800",
            boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
          }}
        >
          <p
            className="font-pixel text-[6px] mb-2"
            style={{ color: "#3a2808" }}
          >
            ❝ CAVE INSCRIPTION
          </p>
          <p
            className="font-mono text-sm italic leading-relaxed"
            style={{ color: "#5a4828" }}
          >
            Beyond the frontier, beyond the code —{" "}
            <span style={{ color: "#8a6830" }}>
              the work speaks for itself.
            </span>
          </p>
        </div>

        <p
          className="font-pixel text-[6px]"
          style={{ color: "#2a1a08" }}
        >
          ✦ NOTHING VENTURED, NOTHING SHIPPED ✦
        </p>
      </div>
    </InfoPanel>
  );
}
