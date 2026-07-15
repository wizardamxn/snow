"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { input } from "@/components/world/input";

/**
 * On-screen D-pad + action buttons for touch devices. Feeds the exact same
 * key codes as keyboard/mouse input (`input.setVirtualKey`), so Player.ts and
 * Town.ts need zero changes to also respond to these.
 */

const btnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(20,16,10,0.82)",
  border: "2px solid #5a4828",
  boxShadow: "2px 2px 0 #000",
  color: "#f0c050",
  userSelect: "none",
  touchAction: "none",
  WebkitTapHighlightColor: "transparent",
};

function TouchButton({
  codes,
  children,
  style,
  label,
}: {
  codes: string[];
  children: React.ReactNode;
  style?: React.CSSProperties;
  label: string;
}) {
  const [pressed, setPressed] = useState(false);
  // Which finger is currently holding this button — a plain per-instance
  // `pressed` boolean isn't enough with multiple simultaneous touches: an
  // unrelated finger's pointerup/pointerleave over this element (e.g. while
  // holding SPRINT and also tapping a D-pad button) would otherwise release
  // a press it never made, leaving the code's "held" state and the button's
  // visual out of sync ("toggling" instead of tracking the actual finger).
  const pointerIdRef = useRef<number | null>(null);

  const release = useCallback(() => {
    if (pointerIdRef.current === null) return;
    pointerIdRef.current = null;
    setPressed(false);
    codes.forEach((c) => input.setVirtualKey(c, false));
  }, [codes]);

  const press = (e: React.PointerEvent) => {
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    setPressed(true);
    codes.forEach((c) => input.setVirtualKey(c, true));
  };

  useEffect(() => {
    // Safety net: tapping [E] can open a panel that unmounts this whole
    // touch-control layer mid-tap (Overlay hides <TouchControls /> while any
    // panel is open) — when that happens, this button's own onPointerUp
    // never gets a chance to fire, so the key would stay "held" forever and
    // every future tap would silently do nothing. Force the release here.
    return () => release();
  }, [release]);

  return (
    <div
      className="font-pixel"
      role="button"
      aria-label={label}
      style={{
        ...btnBase,
        ...style,
        background: pressed ? "rgba(200,134,30,0.55)" : btnBase.background,
      }}
      onPointerDown={press}
      onPointerUp={(e) => {
        e.preventDefault();
        if (e.pointerId === pointerIdRef.current) release();
      }}
      onPointerLeave={(e) => {
        if (e.pointerId === pointerIdRef.current) release();
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === pointerIdRef.current) release();
      }}
    >
      {children}
    </div>
  );
}

/**
 * A CSS-drawn triangle rather than a Unicode arrow glyph — "Press Start 2P"
 * doesn't cover the full arrow block, and a missing glyph silently falls back
 * to a wrong-looking substitute character instead of erroring.
 */
function Arrow({ dir }: { dir: "up" | "down" | "left" | "right" }) {
  const base: React.CSSProperties = { width: 0, height: 0 };
  const bySide: Record<typeof dir, React.CSSProperties> = {
    up: { borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderBottom: "13px solid #f0c050" },
    down: { borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "13px solid #f0c050" },
    left: { borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: "13px solid #f0c050" },
    right: { borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "13px solid #f0c050" },
  };
  return <div style={{ ...base, ...bySide[dir] }} />;
}

export default function TouchControls() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  if (!isTouch) return null;

  const dpadKey: React.CSSProperties = {
    width: "48px",
    height: "48px",
    fontSize: "14px",
    borderRadius: "6px",
  };
  const actionKey: React.CSSProperties = {
    width: "62px",
    height: "62px",
    fontSize: "10px",
    borderRadius: "50%",
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-4"
      style={{ paddingBottom: "calc(14px + env(safe-area-inset-bottom))" }}
    >
      {/* ── D-pad + sprint (bottom-left) ─────────────────────────────────── */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <TouchButton codes={["ShiftLeft"]} label="Sprint" style={{ width: "108px", height: "22px", fontSize: "6px", borderRadius: "4px" }}>
          SPRINT
        </TouchButton>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "48px 48px 48px",
            gridTemplateRows: "48px 48px",
            gap: "4px",
          }}
        >
          <div />
          <TouchButton codes={["KeyW"]} label="Move up" style={{ ...dpadKey, gridColumn: 2, gridRow: 1 }}><Arrow dir="up" /></TouchButton>
          <div />
          <TouchButton codes={["KeyA"]} label="Move left" style={{ ...dpadKey, gridColumn: 1, gridRow: 2 }}><Arrow dir="left" /></TouchButton>
          <TouchButton codes={["KeyS"]} label="Move down" style={{ ...dpadKey, gridColumn: 2, gridRow: 2 }}><Arrow dir="down" /></TouchButton>
          <TouchButton codes={["KeyD"]} label="Move right" style={{ ...dpadKey, gridColumn: 3, gridRow: 2 }}><Arrow dir="right" /></TouchButton>
        </div>
      </div>

      {/* ── Attack + interact (bottom-right) ─────────────────────────────── */}
      <div className="pointer-events-auto flex items-end gap-3">
        <TouchButton codes={["Mouse0"]} label="Attack" style={actionKey}>ATK</TouchButton>
        <TouchButton codes={["KeyE"]} label="Interact" style={actionKey}>E</TouchButton>
      </div>
    </div>
  );
}
