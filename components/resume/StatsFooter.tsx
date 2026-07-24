"use client";

import { useEffect, useState } from "react";

type Stats = {
  available: boolean;
  visitors?: number;
  gameSessions?: number;
  resumeDownloads?: number;
  mostVisited?: { label: string; count: number } | null;
};

/** A small footer strip surfacing live site stats — pixel-styled for the themed resume, plain for the classic/ATS one. */
export default function StatsFooter({ variant }: { variant: "pixel" | "plain" }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ available: false }));
  }, []);

  if (!stats || !stats.available) return null;

  const parts = [
    `${stats.visitors ?? 0} travelers`,
    `${stats.gameSessions ?? 0} played the game`,
    `${stats.resumeDownloads ?? 0} resumes downloaded`,
    stats.mostVisited ? `${stats.mostVisited.label} visited most` : null,
  ].filter(Boolean);

  if (variant === "plain") {
    return (
      <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
        {parts.join(" · ")}
      </p>
    );
  }

  return (
    <p className="mt-6 text-center font-pixel text-[6px] leading-loose" style={{ color: "#5a4020" }}>
      {parts.join("  ·  ")}
    </p>
  );
}
