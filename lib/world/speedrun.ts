/**
 * The terminal's `speedrun` easter egg: a run timer that starts on command and
 * stops automatically once every landmark has been discovered.
 *
 * Kept as a module singleton (matching `worldState`) rather than React state so
 * the HUD can poll it via requestAnimationFrame at 60fps without re-rendering
 * the overlay tree every frame.
 */

import { ACHIEVEMENT_IDS, getVisited } from "@/lib/world/achievements";

const BEST_KEY = "sigma_speedrun_best_ms";

type Listener = () => void;
const listeners = new Set<Listener>();

let startedAt: number | null = null;
let finishedMs: number | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function readBest(): number | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeBest(ms: number) {
  try {
    localStorage.setItem(BEST_KEY, String(ms));
  } catch {
    // Storage disabled — the run still works, it just won't persist.
  }
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 100) / 10); // seconds, 1dp
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export const speedrun = {
  get running() {
    return startedAt !== null;
  },
  get elapsedMs() {
    if (startedAt === null) return finishedMs ?? 0;
    return Date.now() - startedAt;
  },
  get best() {
    return readBest();
  },
  /** Landmarks still missing — the run ends when this hits zero. */
  get remaining() {
    const visited = getVisited();
    return ACHIEVEMENT_IDS.filter((id) => !visited.has(id)).length;
  },
  start(): { ok: boolean; reason?: string } {
    if (startedAt !== null) return { ok: false, reason: "already running" };
    startedAt = Date.now();
    finishedMs = null;
    emit();
    return { ok: true };
  },
  stop(): number {
    const ms = speedrun.elapsedMs;
    startedAt = null;
    finishedMs = ms;
    emit();
    return ms;
  },
  /** Called when the last landmark is found; records a personal best. */
  finish(): { ms: number; isBest: boolean } {
    const ms = speedrun.stop();
    const prev = readBest();
    const isBest = prev === null || ms < prev;
    if (isBest) writeBest(ms);
    return { ms, isBest };
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
