import testimonials from "@/lib/data/testimonials.json";
import QuestPanel from "./QuestPanel";
import CharacterSprite, { CHARACTER_H } from "./CharacterSprite";

const PORTRAITS = ["tavern", "wizard"] as const;
const PORTRAIT_BOX = CHARACTER_H + 14; // small margin around the uniform-height character

export default function AllyWords() {
  return (
    <QuestPanel title="WORDS OF ALLIES" subtitle="TESTIMONIALS FROM THE GUILD" icon="📣">
      <div className="grid sm:grid-cols-2 gap-4">
        {testimonials.map((t, i) => {
          const who = PORTRAITS[i % PORTRAITS.length];
          return (
            <div
              key={t.name}
              className="flex gap-3 items-start"
              style={{ background: "#050400", border: "2px solid #2a1800", boxShadow: "0 0 0 2px #000", padding: "16px" }}
            >
              <div
                className="shrink-0 flex items-end justify-center overflow-hidden"
                style={{ width: PORTRAIT_BOX, height: PORTRAIT_BOX, background: "#0a0600", border: "2px solid #5a4020" }}
              >
                <CharacterSprite who={who} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm leading-relaxed italic" style={{ color: "#9a8560" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-pixel text-[6px] mt-3" style={{ color: "#f0c050" }}>
                  {t.name.toUpperCase()}
                </p>
                <p className="font-pixel text-[5px] mt-1" style={{ color: "#6a5030" }}>
                  {t.role.toUpperCase()} · {t.company.toUpperCase()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </QuestPanel>
  );
}
