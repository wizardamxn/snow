"use client";

import { createContext, useContext, useEffect, useId, useRef } from "react";

/**
 * Grace period, in ms, before the backdrop will act on a click. Opening a
 * panel (e.g. tapping the on-screen [E] button) unmounts that button mid-tap,
 * so the same tap's synthesized `click` lands on the freshly-mounted backdrop
 * that now sits under the finger — without this, that phantom click closes
 * the panel the instant it opens.
 */
const BACKDROP_CLOSE_GRACE_MS = 300;

/**
 * Each building dresses its panels in its own Tiny Swords frame (slate, wood or
 * parchment) with a title ribbon in its colour. Set by the panel router.
 */
export type PanelTheme = { frame: "slate" | "wood" | "paper" | "scroll"; ribbon: "blue" | "red" | "yellow" | "purple" | "black" };
export const PanelThemeContext = createContext<PanelTheme | null>(null);

const FRAMES = {
  slate: { src: "/pixel/ui/frame_slate.png", slice: 64, width: 26 },
  paper: { src: "/pixel/ui/frame_paper.png", slice: 64, width: 26 },
  wood: { src: "/pixel/ui/frame_wood.png", slice: 128, width: 44 },
  scroll: { src: "/pixel/ui/frame_scroll.png", slice: "40 20", width: "40px 20px" },
} as const;

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Pixel RPG modal shell.
 * Aesthetic: Press Start 2P font for chrome, no border-radius, classic
 * black→gold→black pixel border, scanline header, solid dark background.
 */
export default function InfoPanel({
  title,
  subtitle,
  icon,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: Props) {
  const titleId = useId();
  const theme = useContext(PanelThemeContext);
  const frame = theme ? FRAMES[theme.frame] : null;
  const scroll = theme?.frame === "scroll";
  const panelRef = useRef<HTMLDivElement>(null);
  const canCloseOnBackdropRef = useRef(false);

  useEffect(() => {
    canCloseOnBackdropRef.current = false;
    const timer = setTimeout(() => {
      canCloseOnBackdropRef.current = true;
    }, BACKDROP_CLOSE_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Simple focus trap: keep Tab cycling within the panel.
      if (e.key === "Tab" && panelRef.current) {
        const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  // Move focus into the panel on open, and back to whatever triggered it on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  return (
    /* Backdrop — solid dark, no blur (blur = not pixel art) */
    <div
      className="backdrop-fade-in pointer-events-auto absolute inset-0 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={() => {
        if (canCloseOnBackdropRef.current) onClose();
      }}
    >
      {/*
        Pixel RPG window
        Layered box-shadow:  outer black(3px) → gold border(3px) → inner black(3px)
        No border-radius anywhere — pixel art uses sharp corners.
      */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`panel-pop-in relative ${maxWidth} w-full max-h-[88vh] flex flex-col outline-none ${scroll ? "ink-scroll" : ""}`}
        style={
          frame
            ? {
                borderStyle: "solid",
                borderWidth: typeof frame.width === "number" ? `${frame.width}px` : frame.width,
                borderImage: `url(${frame.src}) ${frame.slice} fill / ${typeof frame.width === "number" ? `${frame.width}px` : frame.width} / 0 ${scroll ? "repeat" : "stretch"}`,
                imageRendering: "pixelated",
                filter: "drop-shadow(0 10px 0 rgba(0,0,0,0.45))",
              }
            : {
                background: "#0d0b08",
                border: "3px solid #c8861e",
                boxShadow:
                  "0 0 0 3px #000, inset 0 0 0 3px #000, 0 0 0 8px rgba(200,134,30,0.15)",
                imageRendering: "pixelated",
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments — a framed-dialog flourish, common RPG-window treatment */}
        {!frame && (["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => {
          const isTop = corner.startsWith("top");
          const isLeft = corner.endsWith("left");
          return (
            <div
              key={corner}
              className="pointer-events-none absolute z-20"
              style={{
                width: "10px",
                height: "10px",
                [isTop ? "top" : "bottom"]: "-5px",
                [isLeft ? "left" : "right"]: "-5px",
                borderTop: isTop ? "3px solid #f0c050" : undefined,
                borderBottom: !isTop ? "3px solid #f0c050" : undefined,
                borderLeft: isLeft ? "3px solid #f0c050" : undefined,
                borderRight: !isLeft ? "3px solid #f0c050" : undefined,
              }}
            />
          );
        })}

        {/* ── RPG header (scanline texture) ─────────────────────────────── */}
        <div
          className="relative flex-shrink-0 flex items-center gap-3 px-5 py-4 overflow-hidden"
          style={{
            background: scroll
              ? "transparent"
              : frame
                ? "rgba(14,10,6,0.82)"
                : "linear-gradient(180deg, #1a1000 0%, #100c00 100%)",
            borderBottom: scroll ? "2px dashed rgba(122,85,48,0.55)" : "3px solid #000",
          }}
        >
          {/* Scanline overlay on header (dark theme only — parchment has no scanlines) */}
          <div
            hidden={scroll}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
              zIndex: 0,
            }}
          />

          {/* Icon — framed in its own badge rather than floating bare */}
          {icon && (
            <span
              className="relative z-10 shrink-0 flex items-center justify-center text-lg leading-none select-none"
              style={{
                width: "34px",
                height: "34px",
                background: scroll ? "rgba(255,246,220,0.5)" : "#0a0600",
                border: scroll ? "2px solid #b8925e" : "2px solid #5a4020",
                boxShadow: "0 0 0 1px #000, inset 0 0 8px rgba(200,134,30,0.2)",
                color: "#f0c050",
                imageRendering: "pixelated",
              }}
            >
              {icon}
            </span>
          )}

          {/* Title block */}
          <div className="relative z-10 flex-1 min-w-0">
            {subtitle && (
              <p
                className="font-pixel text-[7px] mb-1.5 truncate"
                style={{ color: scroll ? "var(--ink-muted)" : "#b78a2a", letterSpacing: "0.15em" }}
              >
                {subtitle}
              </p>
            )}
            {theme ? (
              <h2
                id={titleId}
                className="font-pixel text-[11px] leading-none truncate inline-flex items-center"
                style={{
                  color: "#fffaf0",
                  textShadow: "2px 2px 0 rgba(0,0,0,0.55)",
                  height: "34px",
                  maxWidth: "100%",
                  padding: "0 4px",
                  borderStyle: "solid",
                  borderWidth: "0 22px",
                  borderImage: `url(/pixel/ui/ribbon_${theme.ribbon}.png) 0 64 fill / 0 22px / 0 stretch`,
                  imageRendering: "pixelated",
                }}
              >
                {title}
              </h2>
            ) : (
              <h2
                id={titleId}
                className="font-pixel text-[11px] leading-tight truncate"
                style={{ color: "#f0c050" }}
              >
                {title}
              </h2>
            )}
          </div>

          {/* Close button — pixel style */}
          <button
            onClick={onClose}
            className="relative z-10 flex-shrink-0 font-pixel text-[9px] px-3 py-2 transition-colors"
            style={
              scroll
                ? { background: "#8e2f1c", color: "#fbe9c8", border: "2px solid #4e150c", boxShadow: "2px 2px 0 rgba(78,21,12,0.6)" }
                : { background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e", boxShadow: "2px 2px 0 #000" }
            }
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = scroll ? "#a8402a" : "#3a1a00";
              (e.currentTarget as HTMLElement).style.color = scroll ? "#fff4dc" : "#f0c050";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = scroll ? "#8e2f1c" : "#1a0a00";
              (e.currentTarget as HTMLElement).style.color = scroll ? "#fbe9c8" : "#c8861e";
            }}
            aria-label="Close panel"
          >
            [X]
          </button>
        </div>

        {/* ── Gold top-of-content separator (inner border line) ─────────── */}
        <div
          style={{ height: "2px", background: "#1a0f00", flexShrink: 0 }}
        />

        {/* ── Scrollable content body ───────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto pixel-scroll p-5 panel-stagger"
          style={{
            backgroundColor: scroll ? "transparent" : frame ? "rgba(10,8,4,0.86)" : "#0a0800",
            backgroundImage: scroll ? "none" : "radial-gradient(ellipse at 50% 0%, rgba(60,40,10,0.12) 0%, rgba(0,0,0,0) 60%)",
          }}
        >
          {children}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
          style={{
            borderTop: scroll ? "2px dashed rgba(122,85,48,0.55)" : "3px solid #000",
            background: scroll ? "transparent" : frame ? "rgba(10,8,4,0.86)" : "#0a0800",
          }}
        >
          {/* Flicker cursor decoration */}
          <span
            className="font-pixel text-[7px]"
            style={{ color: "var(--ink-muted)" }}
          >
            ▼
          </span>
          <p
            className="font-pixel text-[7px]"
            style={{ color: "var(--ink-muted)", letterSpacing: "0.1em" }}
          >
            [ESC] CLOSE
          </p>
          <span
            className="font-pixel text-[7px]"
            style={{ color: "var(--ink-muted)" }}
          >
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
