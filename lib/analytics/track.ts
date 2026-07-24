import type { TrackEvent } from "@/lib/analytics/events";

function fire(event: TrackEvent) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics must never break the game.
  }
}

/** Fires unconditionally — for repeatable events (landmark visits, boss kill, downloads). */
export function track(event: TrackEvent): void {
  fire(event);
}

/** Fires at most once per browser session (sessionStorage-deduped) — for visit/mode counters. */
export function trackOncePerSession(event: TrackEvent): void {
  const key = "sigma_tracked_" + event;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage unavailable — fall through and track anyway.
  }
  fire(event);
}
