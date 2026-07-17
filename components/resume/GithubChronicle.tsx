"use client";

import { useState } from "react";
import QuestPanel from "./QuestPanel";

const USER = "wizardamxn";

// External stat-card services, colour-tuned to the gold/navy theme with a
// transparent background so they sit directly on the panel body. Plain <img>
// (not next/image) so no remotePatterns config is needed.
const STATS_CARD = `https://github-readme-stats.vercel.app/api?username=${USER}&show_icons=true&hide_border=true&include_all_commits=true&count_private=true&bg_color=00000000&title_color=f0c050&text_color=e0d0a0&icon_color=c8861e&ring_color=c8861e`;
const ACTIVITY_GRAPH = `https://github-readme-activity-graph.vercel.app/graph?username=${USER}&bg_color=00000000&hide_border=true&color=f0c050&line=c8861e&point=ffde8a&area=true&area_color=402400&title_color=f0c050`;
// Contribution calendar heatmap, tinted gold to match. ghchart renders empty
// cells light, so it sits on a lighter parchment card (see HEATMAP_FRAME) to
// read like a real calendar rather than glowing against the dark panel.
const HEATMAP = `https://ghchart.rshah.org/c8861e/${USER}`;

const frame: React.CSSProperties = {
  background: "#050400",
  border: "2px solid #2a1800",
  boxShadow: "0 0 0 2px #000",
  padding: "8px",
};

/**
 * An external stat image that gracefully vanishes if its service is down or
 * rate-limited (github-readme-stats' public instance often is) — so a bad day
 * upstream leaves a clean gap, never a broken-image box.
 */
function StatImage({
  src,
  alt,
  minHeight,
  frameStyle,
}: {
  src: string;
  alt: string;
  minHeight: number;
  frameStyle?: React.CSSProperties;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <div style={{ ...frame, ...frameStyle }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full"
        style={{ minHeight }}
        onError={() => setOk(false)}
        onLoad={(e) => {
          // Some services 200 with a 0x0 / error payload rather than erroring.
          if (e.currentTarget.naturalWidth === 0) setOk(false);
        }}
      />
    </div>
  );
}

export default function GithubChronicle() {
  return (
    <QuestPanel title="THE CONTRIBUTION LEDGER" subtitle="GITHUB ACTIVITY" icon="📈">
      <div className="space-y-4">
        <StatImage src={STATS_CARD} alt={`GitHub statistics for ${USER}`} minHeight={130} />

        {/* Contribution heatmap calendar — on a warm parchment card so ghchart's
            light empty cells read as a calendar rather than glowing on the dark. */}
        <div>
          <p className="font-pixel text-[6px] mb-2" style={{ color: "#8a6820" }}>
            &gt; CONTRIBUTION HEATMAP
          </p>
          <StatImage
            src={HEATMAP}
            alt={`Contribution heatmap for ${USER}`}
            minHeight={110}
            frameStyle={{ background: "#e8d9b8", border: "2px solid #c8861e", padding: "10px" }}
          />
        </div>

        {/* The contribution trail — the actual "contributions over time" graph */}
        <StatImage src={ACTIVITY_GRAPH} alt={`Contribution activity graph for ${USER}`} minHeight={160} />

        <div className="text-center">
          <a
            href={`https://github.com/${USER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-[6px] inline-block px-3 py-2"
            style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e", boxShadow: "2px 2px 0 #000" }}
          >
            VIEW FULL CHRONICLE ON GITHUB ↗
          </a>
        </div>
      </div>
    </QuestPanel>
  );
}
