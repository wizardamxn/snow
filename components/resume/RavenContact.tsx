import Link from "next/link";
import QuestPanel from "./QuestPanel";
import PixelSprite from "./PixelSprite";

export default function RavenContact() {
  return (
    <QuestPanel title="SEND A RAVEN" subtitle="OPEN A CORRESPONDENCE" icon="🐦">
      <div className="flex flex-col items-center text-center gap-4">
        <PixelSprite src="/pixel/knight/Raven_Idle.png" frames={8} frameW={124} frameH={124} fps={6} scale={1} />
        <p className="font-mono text-sm leading-relaxed max-w-md" style={{ color: "#9a8560" }}>
          Open to new opportunities — the fastest way to reach me:
        </p>
        <a
          href="mailto:amank225566@gmail.com"
          className="font-pixel text-[9px] px-4 py-3"
          style={{ background: "#c8861e", color: "#000", border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
        >
          amank225566@gmail.com
        </a>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <a
            href="https://github.com/wizardamxn"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-[6px] px-2.5 py-2"
            style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
          >
            GITHUB ↗
          </a>
          <a
            href="https://linkedin.com/in/amanahmad1"
            target="_blank"
            rel="noopener noreferrer"
            className="font-pixel text-[6px] px-2.5 py-2"
            style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
          >
            LINKEDIN ↗
          </a>
          <a
            href="/resume.pdf"
            download
            className="font-pixel text-[6px] px-2.5 py-2"
            style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
          >
            RESUME (PDF)
          </a>
          <Link
            href="/?play=1"
            className="font-pixel text-[6px] px-2.5 py-2"
            style={{ background: "#0a2000", color: "#8ad060", border: "2px solid #2a5a10" }}
          >
            PLAY THE GAME →
          </Link>
        </div>
      </div>
    </QuestPanel>
  );
}
