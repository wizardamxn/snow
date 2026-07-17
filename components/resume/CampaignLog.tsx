import experience from "@/lib/data/experience.json";
import QuestPanel from "./QuestPanel";
import Chip from "./Chip";

export default function CampaignLog() {
  return (
    <QuestPanel title="THE CAMPAIGN LOG" subtitle="QUESTS UNDERTAKEN" icon="📜">
      <div className="space-y-6">
        {experience.map((job, i) => (
          <div
            key={job.id}
            style={{
              background: "#050400",
              border: "2px solid #2a1800",
              boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
              padding: "16px",
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="font-pixel text-[8px]" style={{ color: "#f0c050" }}>
                ◆ QUEST {i + 1}: {job.role.toUpperCase()}
              </h3>
              {job.current && (
                <span
                  className="font-pixel text-[5px] px-2 py-1"
                  style={{ background: "#0a2000", border: "2px solid #2a5a10", color: "#8ad060" }}
                >
                  IN PROGRESS
                </span>
              )}
            </div>
            <p className="mt-2 font-mono text-sm" style={{ color: "#c8861e" }}>
              {job.company} <span style={{ color: "#5a4020" }}>· {job.location}</span>
            </p>
            <p className="font-pixel text-[6px] mt-1" style={{ color: "#5a4020" }}>
              {job.period.toUpperCase()}
            </p>
            <p className="mt-3 font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
              {job.summary}
            </p>
            <p className="font-pixel text-[6px] mt-4 mb-2" style={{ color: "#6a5030" }}>
              &gt; OBJECTIVES COMPLETE
            </p>
            <ul className="space-y-1.5">
              {job.highlights.map((h) => (
                <li key={h} className="flex gap-2 font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
                  <span style={{ color: "#c8861e" }} className="select-none">
                    ✓
                  </span>
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.technologies.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </QuestPanel>
  );
}
