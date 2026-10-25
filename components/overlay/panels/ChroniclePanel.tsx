"use client";

import { useEffect, useState } from "react";
import InfoPanel from "../InfoPanel";

type Props = { onClose: () => void };

type Stats = {
  available: boolean;
  visitors?: number;
  gameSessions?: number;
  resumeSessions?: number;
  bossKills?: number;
  resumeDownloads?: number;
  tourStarts?: number;
  mostVisited?: { label: string; count: number } | null;
};

const row: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "2px solid var(--card-bg)",
  boxShadow: "0 0 0 2px var(--px-black), inset 0 0 0 2px var(--px-black)",
};

export default function ChroniclePanel({ onClose }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ available: false }));
  }, []);

  return (
    <InfoPanel
      title="THE TOWN CHRONICLE"
      subtitle="A LEDGER OF TRAVELERS"
      icon="📜"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {!stats && (
          <p className="font-pixel text-[7px] text-center" style={{ color: "var(--ink-muted)" }}>
            READING THE LEDGER...
          </p>
        )}

        {stats && !stats.available && (
          <p className="font-mono text-sm text-center leading-relaxed" style={{ color: "var(--ink-body)" }}>
            The ledger is empty — no travelers have been recorded yet.
          </p>
        )}

        {stats && stats.available && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "var(--ink-strong)" }}>
                  {stats.visitors ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "var(--ink-muted)" }}>
                  TRAVELERS
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "var(--ink-strong)" }}>
                  {stats.bossKills ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "var(--ink-muted)" }}>
                  CHIEFTAINS SLAIN
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "var(--ink-strong)" }}>
                  {stats.gameSessions ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "var(--ink-muted)" }}>
                  ENTERED THE FRONTIER
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "var(--ink-strong)" }}>
                  {stats.resumeDownloads ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "var(--ink-muted)" }}>
                  RESUMES CLAIMED
                </p>
              </div>
              <div className="p-3 text-center col-span-2" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "var(--ink-strong)" }}>
                  {stats.tourStarts ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "var(--ink-muted)" }}>
                  RECRUITER TOURS TAKEN
                </p>
              </div>
            </div>

            {stats.mostVisited && (
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[7px]" style={{ color: "var(--ink-muted)" }}>
                  MOST VISITED HALL
                </p>
                <p className="font-pixel text-[9px] mt-2" style={{ color: "var(--ink-strong)" }}>
                  {stats.mostVisited.label.toUpperCase()} · {stats.mostVisited.count}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </InfoPanel>
  );
}
