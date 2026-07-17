const STATS = [
  { label: "EXPERIENCE", value: "9+ MO", fill: 0.4 },
  { label: "GUILDS JOINED", value: "2", fill: 0.55 },
  { label: "RELICS FORGED", value: "5", fill: 0.7 },
  { label: "CLASS", value: "FULL-STACK", fill: 1 },
];

function MeterBar({ fill }: { fill: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "8px",
        background: "#0d0b08",
        border: "2px solid #000",
        boxShadow: "inset 0 0 0 1px #3a2800",
      }}
    >
      <div style={{ width: `${fill * 100}%`, height: "100%", background: "#c8861e" }} />
    </div>
  );
}

export default function StatBlock() {
  return (
    <section className="pixel-panel grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
      {STATS.map((s) => (
        <div key={s.label} className="min-w-0">
          <div className="font-pixel text-[9px] mb-2" style={{ color: "#f0c050" }}>
            {s.value}
          </div>
          <MeterBar fill={s.fill} />
          <div className="font-pixel text-[5px] mt-2" style={{ color: "#7a6020", letterSpacing: "0.1em" }}>
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}
