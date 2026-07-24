"use client";

import { useState } from "react";
import InfoPanel from "../InfoPanel";
import { track } from "@/lib/analytics/track";

type Props = { onClose: () => void };

const LINKS = [
  {
    label: "GITHUB",
    handle: "@wizardamxn",
    href: "https://github.com/wizardamxn",
    icon: "⌥",
    external: true,
  },
  {
    label: "LINKEDIN",
    handle: "amanahmad1",
    href: "https://linkedin.com/in/amanahmad1",
    icon: "in",
    external: true,
  },
  {
    label: "RESUME",
    handle: "DOWNLOAD PDF",
    href: "/resume.pdf",
    icon: "📄",
    external: false,
    download: true,
  },
];

const pixelBtn: React.CSSProperties = {
  background: "#0a0600",
  border: "2px solid #4a3010",
  boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
};

export default function ContactPanel({ onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText("amank225566@gmail.com").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <InfoPanel
      title="CONTACT SPIRE"
      subtitle="SEND A RAVEN"
      icon="✉"
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* ── Email ──────────────────────────────────────────────────────── */}
        <div
          className="p-4"
          style={{
            background: "#0d0800",
            border: "2px solid #6a3800",
            boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
          }}
        >
          <p
            className="font-pixel text-[7px] mb-3"
            style={{ color: "#4a3210" }}
          >
            &gt; EMAIL ADDRESS
          </p>
          <div className="flex items-center gap-3">
            <code
              className="font-mono text-xs flex-1 truncate"
              style={{ color: "#f0c050" }}
            >
              amank225566@gmail.com
            </code>
            <button
              onClick={copyEmail}
              className="flex-shrink-0 font-pixel text-[7px] px-3 py-2 transition-colors"
              style={
                copied
                  ? {
                      background: "#003000",
                      border: "2px solid #40a020",
                      boxShadow: "0 0 0 2px #000",
                      color: "#60d040",
                    }
                  : {
                      background: "#1a0a00",
                      border: "2px solid #c8861e",
                      boxShadow: "2px 2px 0 #000",
                      color: "#c8861e",
                    }
              }
            >
              {copied ? "COPIED!" : "[ COPY ]"}
            </button>
          </div>
        </div>

        {/* ── Links ──────────────────────────────────────────────────────── */}
        <div>
          <p
            className="font-pixel text-[7px] mb-2"
            style={{ color: "#2a1a00" }}
          >
            &gt; LINKS
          </p>
          <div className="space-y-2">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : "_self"}
                rel={link.external ? "noopener noreferrer" : undefined}
                download={link.download}
                onClick={link.download ? () => track("resume_download") : undefined}
                className="flex items-center gap-3 px-4 py-3 group transition-colors"
                style={pixelBtn}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#1a0e00";
                  (e.currentTarget as HTMLElement).style.borderColor = "#c8861e";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#0a0600";
                  (e.currentTarget as HTMLElement).style.borderColor = "#4a3010";
                }}
              >
                <span className="text-lg w-8 text-center select-none leading-none">
                  {link.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className="font-pixel text-[8px]"
                    style={{ color: "#f0c050" }}
                  >
                    {link.label}
                  </p>
                  <p
                    className="font-pixel text-[6px] mt-1.5 truncate"
                    style={{ color: "#3a2808" }}
                  >
                    {link.handle}
                  </p>
                </div>
                <span
                  className="ml-auto font-pixel text-[8px]"
                  style={{ color: "#3a2808" }}
                >
                  &gt;
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Status ─────────────────────────────────────────────────────── */}
        <div
          className="py-3 px-4 flex items-center justify-center gap-3"
          style={{
            background: "#001500",
            border: "2px solid #1a4010",
            boxShadow: "0 0 0 2px #000",
          }}
        >
          <span
            className="inline-block h-2 w-2"
            style={{
              background: "#40d020",
              boxShadow: "0 0 6px #40d020, 2px 2px 0 #000",
            }}
          />
          <p
            className="font-pixel text-[8px]"
            style={{ color: "#40d020" }}
          >
            OPEN TO OPPORTUNITIES
          </p>
        </div>
      </div>
    </InfoPanel>
  );
}
