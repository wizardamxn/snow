"use client";

import { useEffect } from "react";
import { trackOncePerSession } from "@/lib/analytics/track";

/** Renders nothing — fires the once-per-session visit + mode counters on mount. */
export default function VisitPing({ mode }: { mode: "game" | "resume" }) {
  useEffect(() => {
    trackOncePerSession("visit");
    trackOncePerSession(mode === "game" ? "mode:game" : "mode:resume");
  }, [mode]);

  return null;
}
