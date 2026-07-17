/**
 * Static section chrome mirroring InfoPanel.tsx's window recipe (scanline
 * header, framed icon badge, gold-on-black title) — but inline in a
 * scrolling page rather than a modal, so no backdrop/close button/focus trap.
 */
export default function QuestPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pixel-panel relative">
      <div
        className="relative flex items-center gap-3 px-5 py-4 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #1a1000 0%, #100c00 100%)", borderBottom: "3px solid #000" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
          }}
        />
        {icon && (
          <span
            className="relative z-10 shrink-0 flex items-center justify-center text-lg leading-none select-none"
            style={{
              width: "34px",
              height: "34px",
              background: "#0a0600",
              border: "2px solid #5a4020",
              boxShadow: "0 0 0 1px #000, inset 0 0 8px rgba(200,134,30,0.2)",
              color: "#f0c050",
            }}
          >
            {icon}
          </span>
        )}
        <div className="relative z-10 min-w-0">
          {subtitle && (
            <p className="font-pixel text-[6px] mb-1.5" style={{ color: "#8a6820", letterSpacing: "0.15em" }}>
              {subtitle}
            </p>
          )}
          <h2 className="font-pixel text-[10px] leading-tight" style={{ color: "#f0c050" }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ height: "2px", background: "#1a0f00" }} />
      <div
        className="p-5"
        style={{
          backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(60,40,10,0.12) 0%, rgba(0,0,0,0) 60%)",
          backgroundColor: "#0a0800",
        }}
      >
        {children}
      </div>
    </div>
  );
}
