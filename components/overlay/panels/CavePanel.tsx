"use client";

import InfoPanel from "../InfoPanel";

type Props = { onClose: () => void };

const INSCRIPTIONS = [
  "The shadows breathe here. Stone older than the town below.",
  "Torchlight catches words carved deep — initials, dates, warnings.",
  "A cold draught flows outward, as if the mountain itself exhales.",
];

// Edit these to your actual favorites — this is the "off the clock" side of the portfolio.
const FAVORITE_GAMES = ["Skyrim", "The Witcher 3", "Valorant"];
const HOBBIES = ["Playing recorder", "Gym"];
const VALORANT = { rank: "Ascendant 1", role: "" };

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
            background: "var(--card-bg)",
            border: "2px solid var(--card-bg)",
            boxShadow: "0 0 0 2px var(--px-black), 4px 4px 0 var(--px-black)",
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
              style={{ color: "var(--ink-body)" }}
            >
              <span
                className="font-pixel text-[7px] flex-shrink-0 mt-1"
                style={{ color: "var(--ink-muted)" }}
              >
                {i + 1}.
              </span>
              {line}
            </p>
          ))}
        </div>

        {/* Inscription block — the off-the-clock side of the portfolio */}
        <div
          className="p-4 text-left"
          style={{
            background: "var(--card-bg)",
            border: "2px solid var(--card-bg)",
            boxShadow: "0 0 0 2px var(--px-black), inset 0 0 0 2px var(--px-black)",
          }}
        >
          <p
            className="font-pixel text-[7px] mb-3"
            style={{ color: "var(--ink-muted)" }}
          >
            ❝ CAVE INSCRIPTION
          </p>
          <div className="space-y-2 font-mono text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            <p>
              <span style={{ color: "var(--ink-muted)" }}>Favorite games — </span>
              {FAVORITE_GAMES.join(", ")}
            </p>
            <p>
              <span style={{ color: "var(--ink-muted)" }}>Hobbies — </span>
              {HOBBIES.join(", ")}
            </p>
            <p>
              <span style={{ color: "var(--ink-muted)" }}>Valorant — </span>
              {VALORANT.role ? `${VALORANT.rank} · ${VALORANT.role}` : VALORANT.rank}
            </p>
          </div>
        </div>

        <p
          className="font-pixel text-[7px]"
          style={{ color: "var(--ink-accent)" }}
        >
          ✦ NOTHING VENTURED, NOTHING SHIPPED ✦
        </p>
      </div>
    </InfoPanel>
  );
}
