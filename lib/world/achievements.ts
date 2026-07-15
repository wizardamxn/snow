/**
 * Tracks which landmarks the player has discovered, persisted in localStorage
 * so it survives reloads. Purely a "have you seen everything" completionist
 * counter — separate from any single feature's own state.
 */

const STORAGE_KEY = "sigma_achievements_v1";

export const ACHIEVEMENT_IDS = [
  "sanctum",
  "chronicles",
  "relics",
  "armory",
  "testimonies",
  "contact",
  "cave",
  "raven",
  "bard",
  "terminal",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

function load(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function save(visited: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
  } catch {
    // Storage disabled/full — achievements just won't persist this session.
  }
}

export function getVisited(): Set<string> {
  return load();
}

/** Marks a landmark visited. Returns whether this was a new discovery and whether it just completed the set. */
export function markVisited(id: string): { isNew: boolean; visited: Set<string>; justCompleted: boolean } {
  if (!(ACHIEVEMENT_IDS as readonly string[]).includes(id)) {
    return { isNew: false, visited: load(), justCompleted: false };
  }
  const visited = load();
  const isNew = !visited.has(id);
  visited.add(id);
  if (isNew) save(visited);
  const justCompleted = isNew && visited.size === ACHIEVEMENT_IDS.length;
  return { isNew, visited, justCompleted };
}
