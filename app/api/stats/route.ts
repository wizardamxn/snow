import { NextResponse } from "next/server";
import { getRedis } from "@/lib/analytics/redis";
import { ACHIEVEMENT_IDS } from "@/lib/world/achievements";

const LANDMARK_LABELS: Record<string, string> = {
  sanctum: "The Sanctum",
  chronicles: "Hall of Chronicles",
  relics: "Vault of Relics",
  armory: "The Armory",
  testimonies: "Hall of Testimonies",
  contact: "Contact Spire",
  cave: "The Hollow Cave",
  raven: "The Raven",
  bard: "The Wandering Bard",
  terminal: "The Terminal",
};

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ available: false });
  }

  const keys = [
    "stats:visit",
    "stats:mode:game",
    "stats:mode:resume",
    "stats:boss_kill",
    "stats:resume_download",
    "stats:tour_start",
    "stats:tour_complete",
    ...ACHIEVEMENT_IDS.map((id) => `stats:landmark:${id}`),
  ];
  const values = await redis.mget<number[]>(...keys);
  const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

  const landmarks = ACHIEVEMENT_IDS.map((id, i) => ({
    id,
    label: LANDMARK_LABELS[id] ?? id,
    count: n(values[7 + i]),
  }));
  const mostVisited = landmarks.reduce<{ id: string; label: string; count: number } | null>(
    (best, l) => (l.count > 0 && (!best || l.count > best.count) ? l : best),
    null
  );

  return NextResponse.json(
    {
      available: true,
      visitors: n(values[0]),
      gameSessions: n(values[1]),
      resumeSessions: n(values[2]),
      bossKills: n(values[3]),
      resumeDownloads: n(values[4]),
      tourStarts: n(values[5]),
      tourCompletions: n(values[6]),
      landmarks,
      mostVisited,
    },
    { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } }
  );
}
