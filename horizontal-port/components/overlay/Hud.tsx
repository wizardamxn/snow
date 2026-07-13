"use client";

import { useEffect, useRef, useState } from "react";
import { worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";
import projects from "@/lib/data/projects.json";
import {
  ensureStarted,
  getAudioState,
  setMuted,
  setVolume,
} from "@/lib/audio/ambient";

const RUN_KEYS = new Set(["ArrowRight", "KeyD"]);

export default function Hud() {
  const keyHeld = useRef(false);
  const btnHeld = useRef(false);
  const [volume, setVol] = useState(0.4);
  const [muted, setMute] = useState(false);

  // Combine keyboard + button into the single source of truth.
  const applyRunning = () => {
    worldState.running = keyHeld.current || btnHeld.current;
  };

  // Keyboard: hold arrow-right / D to run.
  useEffect(() => {
    const pressed = new Set<string>();
    const down = (e: KeyboardEvent) => {
      worldState.sprint = e.shiftKey;
      if (!RUN_KEYS.has(e.code)) return;
      pressed.add(e.code);
      keyHeld.current = true;
      applyRunning();
      ensureStarted();
    };
    const up = (e: KeyboardEvent) => {
      worldState.sprint = e.shiftKey;
      if (!RUN_KEYS.has(e.code)) return;
      pressed.delete(e.code);
      keyHeld.current = pressed.size > 0;
      applyRunning();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      worldState.running = false;
    };
  }, []);

  // Track the nearest station; press E to open its panel.
  const nearId = useRef<string | null>(null);
  const [nearTitle, setNearTitle] = useState<string | null>(null);
  useEffect(() => {
    const off = bus.onNear((id) => {
      nearId.current = id;
      setNearTitle(id);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && nearId.current) bus.emitOpen(nearId.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      off();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Load persisted audio prefs and apply them to the engine.
  useEffect(() => {
    const saved = getAudioState();
    const v = Number(localStorage.getItem("sigma.vol") ?? saved.volume);
    const m = localStorage.getItem("sigma.muted") === "true";
    setVol(v);
    setMute(m);
    setVolume(v);
    setMuted(m);
  }, []);

  const onVolume = (v: number) => {
    setVol(v);
    setVolume(v);
    localStorage.setItem("sigma.vol", String(v));
    ensureStarted();
  };

  const toggleMute = () => {
    const next = !muted;
    setMute(next);
    setMuted(next);
    localStorage.setItem("sigma.muted", String(next));
    ensureStarted();
  };

  const pressRun = () => {
    btnHeld.current = true;
    applyRunning();
    ensureStarted();
  };
  const releaseRun = () => {
    btnHeld.current = false;
    applyRunning();
  };

  return (
    <>
      {/* Audio controls, top-right */}
      <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 backdrop-blur-sm">
        <button
          onClick={toggleMute}
          className="text-lg leading-none"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          className="w-24 accent-amber-400"
          aria-label="Volume"
        />
      </div>

      {/* "Near a station" hint (tap to open on mobile) */}
      {nearTitle && (
        <button
          onClick={() => bus.emitOpen(nearTitle)}
          className="pointer-events-auto absolute left-1/2 top-20 -translate-x-1/2 rounded-lg border-2 border-amber-400 bg-black/70 px-4 py-2 font-mono text-sm text-amber-200 shadow-lg active:scale-95"
        >
          ▸ inspect{" "}
          {projects.find((p) => p.id === nearTitle)?.title ?? nearTitle} — press{" "}
          <kbd className="rounded bg-white/20 px-1">E</kbd> / tap
        </button>
      )}

      {/* Hold-to-run button, bottom-right so it doesn't sit on the world */}
      <div className="pointer-events-none absolute bottom-6 right-6 flex flex-col items-end gap-2">
        <button
          onPointerDown={pressRun}
          onPointerUp={releaseRun}
          onPointerLeave={releaseRun}
          onPointerCancel={releaseRun}
          className="pointer-events-auto touch-none select-none rounded-full bg-amber-500/90 px-8 py-4 font-mono text-sm font-bold text-black shadow-lg active:scale-95"
        >
          HOLD TO RUN ▶
        </button>
        <p className="font-mono text-xs text-white/70">
          hold <kbd className="rounded bg-white/20 px-1">→</kbd> or{" "}
          <kbd className="rounded bg-white/20 px-1">D</kbd> to run
        </p>
      </div>
    </>
  );
}
