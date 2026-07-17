import QuestPanel from "./QuestPanel";
import PixelSprite from "./PixelSprite";

/** gold_trophy.png is a 128x128 canvas but the actual art is a ~24x26 nugget
 * near its center (checked via an alpha-bbox scan) — crop to that instead of
 * displaying mostly transparent padding at icon size. */
function TrophyIcon() {
  const scale = 3;
  return (
    <div style={{ width: 24 * scale, height: 26 * scale, overflow: "hidden" }}>
      <div
        style={{
          width: 24,
          height: 26,
          backgroundImage: "url(/pixel/props/gold_trophy.png)",
          backgroundPosition: "-51px -49px",
          imageRendering: "pixelated",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

const TROPHIES = [
  {
    title: "WINNER, HACKJEC 4.0 HACKATHON",
    detail: "1st place among 50+ teams for a full-stack health application built in 24 hours.",
  },
  {
    title: "TECHNICAL TEAM, KARWAAN JEC",
    detail: "Deployed event platforms and hosted engineering workshops for college-wide tech initiatives.",
  },
];

export default function TrophyHall() {
  return (
    <QuestPanel title="THE HALL OF VALOR" subtitle="ACHIEVEMENTS & LEADERSHIP" icon="🏆">
      <div className="flex items-center justify-center gap-6 mb-5">
        <div className="torch-flicker">
          <PixelSprite src="/pixel/fx/fire_01.png" frames={8} frameW={64} frameH={64} fps={12} scale={0.9} />
        </div>
        <div
          className="flex items-center justify-center"
          style={{ width: 90, height: 90, background: "#050300", border: "2px solid #c8861e", boxShadow: "0 0 0 2px #000, 4px 4px 0 #000" }}
        >
          <TrophyIcon />
        </div>
        <div className="torch-flicker" style={{ transform: "scaleX(-1)" }}>
          <PixelSprite src="/pixel/fx/fire_01.png" frames={8} frameW={64} frameH={64} fps={12} scale={0.9} />
        </div>
      </div>
      <div className="space-y-3">
        {TROPHIES.map((t) => (
          <div
            key={t.title}
            className="flex gap-3 items-start"
            style={{ background: "#050400", border: "2px solid #3a2800", boxShadow: "0 0 0 2px #000", padding: "14px" }}
          >
            <span className="text-lg leading-none select-none shrink-0">🏅</span>
            <div>
              <h3 className="font-pixel text-[7px] mb-2" style={{ color: "#f0c050" }}>
                {t.title}
              </h3>
              <p className="font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
                {t.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </QuestPanel>
  );
}
