import Hud from "./Hud";
import ProjectPanel from "./ProjectPanel";
import CastleGate from "./CastleGate";

export default function Overlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <p className="absolute left-1/2 top-4 -translate-x-1/2 rounded bg-black/40 px-4 py-2 font-mono text-sm text-white">
        SIGMA — Tiny Swords art pass
      </p>
      <Hud />
      <ProjectPanel />
      <CastleGate />
    </div>
  );
}
