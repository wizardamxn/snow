"use client";

import InfoPanel from "../InfoPanel";
import { bus } from "@/lib/world/bus";

type Props = { onClose: () => void };

export default function RecruiterTourPrompt({ onClose }: Props) {
  const start = () => {
    bus.emitTourCommand("start");
    onClose();
  };

  return (
    <InfoPanel
      title="RECRUITER'S TRAIL"
      subtitle="A GUIDED TOUR"
      icon="🧭"
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-center">
        <p className="font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
          Short on time? Let the hero walk itself — a quick guided tour through
          all six halls, ending at Contact.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={start}
            className="font-pixel text-[8px] px-4 py-3 transition-colors"
            style={{ background: "#c8861e", color: "#000", border: "3px solid #000", boxShadow: "4px 4px 0 #000" }}
          >
            ▶ START TOUR
          </button>
          <button
            onClick={onClose}
            className="font-pixel text-[8px] px-4 py-3 transition-colors"
            style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
          >
            NO THANKS
          </button>
        </div>
      </div>
    </InfoPanel>
  );
}
