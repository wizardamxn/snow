"use client";

import { useEffect } from "react";
import { bus } from "@/lib/world/bus";
import { ACHIEVEMENT_IDS, type AchievementId } from "@/lib/world/achievements";
import { track } from "@/lib/analytics/track";

function isAchievementId(id: string): id is AchievementId {
  return (ACHIEVEMENT_IDS as readonly string[]).includes(id);
}

/** Renders nothing — mirrors every landmark visit (bus.onVisit) into the stats counters. */
export default function AnalyticsBridge() {
  useEffect(() => {
    return bus.onVisit((id) => {
      if (isAchievementId(id)) {
        track(`landmark:${id}`);
      }
    });
  }, []);

  return null;
}
