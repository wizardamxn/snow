import skills from "@/lib/data/skills.json";
import { SKILL_CATEGORY_META, DEFAULT_SKILL_META } from "@/lib/data/skillMeta";
import QuestPanel from "./QuestPanel";

// Proficiency per skill, 0–1 — drives the "progression" meter bars. These are
// hand-set relative levels (edit freely); anything not listed falls back to
// DEFAULT_LEVEL so new skills still render a sensible bar.
const DEFAULT_LEVEL = 0.72;
const LEVEL: Record<string, number> = {
  // Languages
  TypeScript: 0.9, JavaScript: 0.95, Python: 0.8, SQL: 0.75,
  // Frontend
  React: 0.95, "Next.js": 0.92, "React Native": 0.8, "Tailwind CSS": 0.9, "Redux Toolkit / RTK Query": 0.85,
  // Backend
  "Node.js": 0.9, "Express.js": 0.9, FastAPI: 0.8, "Socket.io": 0.82, BullMQ: 0.75,
  // Databases
  "MongoDB (Atlas Vector Search)": 0.88, PostgreSQL: 0.8, Redis: 0.85, Firebase: 0.8, Supabase: 0.8,
  // Gen AI & Infra
  "Vercel AI SDK": 0.82, "Google Gemini API": 0.8, "RAG Pipelines": 0.8, "AWS EC2": 0.75, Nginx: 0.7, Cloudflare: 0.72, Prisma: 0.82, FFmpeg: 0.7,
};

function SkillMeter({ skill, fill }: { skill: string; fill: number }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="font-pixel text-[6px] truncate" style={{ color: "#e0d0a0" }}>
          {skill}
        </span>
        <span className="font-pixel text-[5px] shrink-0" style={{ color: "#7a6020" }}>
          LV {Math.round(fill * 99)}
        </span>
      </div>
      <div style={{ height: 6, background: "#0d0b08", border: "2px solid #000", boxShadow: "inset 0 0 0 1px #3a2800" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", background: "#c8861e" }} />
      </div>
    </div>
  );
}

export default function ArmorySkills() {
  return (
    <QuestPanel title="THE ARMORY" subtitle="SKILLS & ARSENAL" icon="🗡">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((category) => {
          const meta = SKILL_CATEGORY_META[category.category] ?? DEFAULT_SKILL_META;
          return (
            <div
              key={category.category}
              style={{ background: "#050400", border: `2px solid ${meta.accent}`, boxShadow: "0 0 0 2px #000" }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: meta.accent, borderBottom: "2px solid #000" }}>
                <span className="text-base leading-none select-none">{meta.icon}</span>
                <h3 className="font-pixel text-[7px]" style={{ color: "#f0c050" }}>
                  {category.category.toUpperCase()}
                </h3>
              </div>
              <div className="p-3 space-y-3">
                {category.skills.map((skill) => (
                  <SkillMeter key={skill} skill={skill} fill={LEVEL[skill] ?? DEFAULT_LEVEL} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </QuestPanel>
  );
}
