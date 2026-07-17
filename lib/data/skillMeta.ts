/** Shared between the in-game Armory panel and the themed resume's Armory section. */
export const SKILL_CATEGORY_META: Record<string, { icon: string; accent: string; chipColor: string }> = {
  "Languages": {
    icon: "📖",
    accent: "#1a1a40",
    chipColor: "#2a2a70",
  },
  "Frontend": {
    icon: "⚔",
    accent: "#0a3060",
    chipColor: "#1a5090",
  },
  "Backend": {
    icon: "🛡",
    accent: "#0a3010",
    chipColor: "#1a5020",
  },
  "Databases": {
    icon: "📦",
    accent: "#300a50",
    chipColor: "#501a80",
  },
  "Gen AI & Infra": {
    icon: "⚙",
    accent: "#3a2000",
    chipColor: "#6a4010",
  },
};

export const DEFAULT_SKILL_META = { icon: "⚡", accent: "#1e1600", chipColor: "#3a2800" };
