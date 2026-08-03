"use client";

import { useState, type ReactNode } from "react";

/**
 * Progressive disclosure, but only where it's needed: on phones.
 *
 * The quest log's detail blocks (job objectives, project highlights) are the
 * "walls of text" on a small screen — great for a recruiter who's decided to
 * dig in, dead weight for one who's still scanning. So on mobile we hide them
 * behind a tap and lead with the summary + tech chips; on `md+` there's room to
 * just show everything, so the toggle disappears and the block is always open.
 *
 * `children` stays server-rendered — this client wrapper only owns the open
 * state, so the content itself costs no extra JS and remains in the DOM (and
 * therefore indexable / findable-in-page) even while visually collapsed.
 */
export default function MobileCollapse({
  summary,
  desktopHeading,
  children,
}: {
  /** Mobile toggle label, e.g. "5 OBJECTIVES" */
  summary: string;
  /** Static heading shown instead of the toggle on md+ (optional) */
  desktopHeading?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="md:hidden flex items-center gap-1.5 font-pixel text-[7px] py-1 -ml-0.5"
        style={{ color: "#ac824e" }}
      >
        <span aria-hidden style={{ color: "#c8861e", display: "inline-block", width: 8 }}>
          {open ? "▾" : "▸"}
        </span>
        {open ? "HIDE" : summary}
      </button>

      {desktopHeading && (
        <p className="hidden md:block font-pixel text-[7px] mb-2" style={{ color: "#ac824e" }}>
          {desktopHeading}
        </p>
      )}

      <div className={open ? "block" : "hidden md:block"}>{children}</div>
    </div>
  );
}
