import { ACHIEVEMENT_IDS } from "@/lib/world/achievements";

/** Every trackable event, validated server-side before touching Redis. */
export const TRACK_EVENTS = [
  "visit",
  "mode:game",
  "mode:resume",
  "boss_kill",
  "resume_download",
  "tour_start",
  "tour_complete",
  ...ACHIEVEMENT_IDS.map((id) => `landmark:${id}` as const),
] as const;

export type TrackEvent = (typeof TRACK_EVENTS)[number];

export function isTrackEvent(value: unknown): value is TrackEvent {
  return typeof value === "string" && (TRACK_EVENTS as readonly string[]).includes(value);
}
