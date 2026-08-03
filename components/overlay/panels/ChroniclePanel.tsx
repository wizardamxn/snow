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
  background: "#0a0800",
  border: "2px solid #2a1800",
  boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
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
          <p className="font-pixel text-[7px] text-center" style={{ color: "#a7773b" }}>
            READING THE LEDGER...
          </p>
        )}

        {stats && !stats.available && (
          <p className="font-mono text-sm text-center leading-relaxed" style={{ color: "#a18555" }}>
            The ledger is empty — no travelers have been recorded yet.
          </p>
        )}

        {stats && stats.available && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "#f0c050" }}>
                  {stats.visitors ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "#a7773b" }}>
                  TRAVELERS
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "#f0c050" }}>
                  {stats.bossKills ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "#a7773b" }}>
                  CHIEFTAINS SLAIN
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "#f0c050" }}>
                  {stats.gameSessions ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "#a7773b" }}>
                  ENTERED THE FRONTIER
                </p>
              </div>
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "#f0c050" }}>
                  {stats.resumeDownloads ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "#a7773b" }}>
                  RESUMES CLAIMED
                </p>
              </div>
              <div className="p-3 text-center col-span-2" style={row}>
                <p className="font-pixel text-[14px]" style={{ color: "#f0c050" }}>
                  {stats.tourStarts ?? 0}
                </p>
                <p className="font-pixel text-[7px] mt-2" style={{ color: "#a7773b" }}>
                  RECRUITER TOURS TAKEN
                </p>
              </div>
            </div>

            {stats.mostVisited && (
              <div className="p-3 text-center" style={row}>
                <p className="font-pixel text-[7px]" style={{ color: "#a7773b" }}>
                  MOST VISITED HALL
                </p>
                <p className="font-pixel text-[9px] mt-2" style={{ color: "#f0c050" }}>
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
