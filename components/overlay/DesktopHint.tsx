"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "desktopHintDismissed";

/**
 * Touch devices land on the themed resume (see HomeGate) — the real pixel-RPG
 * needs a keyboard to shine. This card tells them the full experience exists
 * and lives on a laptop, with a one-tap "copy link" so they can send it to
 * themselves. Pinned to the bottom so it never fights the sticky nav at the
 * top; dismissal is remembered for the session.
 */
export default function DesktopHint() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    // Small delay so it arrives after the page settles rather than on first paint.
    if (!isTouch || dismissed) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setShow(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (!show) return null;

  return (
    <div
      role="status"
      className="panel-pop-in fixed inset-x-3 z-50 mx-auto max-w-md"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className="relative flex items-start gap-3 p-3 pr-9"
        style={{
          background: "#0d0b08",
          border: "3px solid #c8861e",
          boxShadow: "0 0 0 3px #000, inset 0 0 0 2px #000, 4px 6px 0 3px rgba(0,0,0,0.6)",
        }}
      >
        <span aria-hidden style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>
          💻
        </span>
        <div className="min-w-0">
          <p className="font-pixel" style={{ fontSize: "8px", color: "#f0c050", lineHeight: 1.6 }}>
            BEST ON A LAPTOP
          </p>
          <p className="font-mono mt-1" style={{ fontSize: "11px", color: "#a98d6a", lineHeight: 1.6 }}>
            You&apos;re seeing the quick version. Open this site on a laptop to
            walk the full pixel-RPG world.
          </p>
          <button
            onClick={copyLink}
            className="font-pixel mt-2 px-2 py-1.5"
            style={{
              fontSize: "7px",
              color: copied ? "#8ad060" : "#f0c050",
              background: "#1a1000",
              border: "2px solid #c8861e",
              boxShadow: "2px 2px 0 #000",
            }}
          >
            {copied ? "✓ LINK COPIED" : "COPY LINK"}
          </button>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="font-pixel absolute top-1.5 right-1.5 flex items-center justify-center"
          style={{ width: 26, height: 26, fontSize: "9px", color: "#ac824e" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
