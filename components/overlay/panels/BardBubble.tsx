"use client";

import { useEffect, useState } from "react";
import { worldState } from "@/lib/world/worldState";
import { WORLD_W, WORLD_H } from "@/components/world/world.config";
import type { NowPlaying } from "@/lib/data/lastfm";

/** Mirrors Town.ts's `applyCamera` scale/clamp so the bubble tracks the bard through camera pans. */
const CAM_SCALE_MIN = 1.2;
const CAM_SCALE_MAX = 2.6;

export default function BardBubble() {
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [pos, setPos] = useState({ x: -999, y: -999 });

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/now-playing");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTrack(data);
          // Cached for the [E] interact handler, which needs it synchronously
          // (see worldState.bardTrack for why).
          worldState.bardTrack = data;
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Follow the bard in world space (fixed position, but the camera still pans/zooms).
  useEffect(() => {
    let handle: number;
    const updatePos = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.max(CAM_SCALE_MIN, Math.min(Math.max(vw / 1000, vh / 620), CAM_SCALE_MAX));
      const camX = Math.max(vw - WORLD_W * scale, Math.min(0, vw / 2 - worldState.playerX * scale));
      const camY = Math.max(vh - WORLD_H * scale, Math.min(0, vh / 2 - worldState.playerY * scale));
      setPos({ x: worldState.bardX * scale + camX, y: worldState.bardY * scale + camY });
      handle = requestAnimationFrame(updatePos);
    };
    handle = requestAnimationFrame(updatePos);
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!track) return null;

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: "translate(-50%, calc(-100% - 4px))",
      }}
    >
      <div className="float-bob relative">
        <div
          className="font-pixel flex items-center gap-2 p-2"
          style={{
            background: "rgba(20,16,10,0.92)",
            border: "2px solid #5a4828",
            borderRadius: "10px",
            boxShadow: "3px 3px 0 #000",
            minWidth: "150px",
            maxWidth: "220px",
          }}
        >
          {/* Cover art */}
          <div
            className="pixel-img"
            style={{
              width: "28px",
              height: "28px",
              flexShrink: 0,
              border: "2px solid #5a4828",
              borderRadius: "4px",
              overflow: "hidden",
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {track.albumArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.albumArt}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#c8861e", fontSize: "12px" }}>♪</span>
            )}
          </div>

          {/* Track info */}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#c8861e", fontSize: "6px", letterSpacing: "0.06em" }}>
              {track.isPlaying ? "NOW PLAYING" : "LAST PLAYED"}
            </div>
            <div
              style={{
                color: "#f0c050",
                fontSize: "7px",
                marginTop: "3px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track.title}
            </div>
            <div
              style={{
                color: "#e8d8b8",
                fontSize: "6px",
                marginTop: "2px",
                opacity: 0.85,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {track.artist}
            </div>
          </div>
        </div>

        {/* Speech-bubble tail pointing down at the bard's head */}
        <div
          className="absolute left-1/2"
          style={{
            bottom: "-9px",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "9px solid #5a4828",
          }}
        />
        <div
          className="absolute left-1/2"
          style={{
            bottom: "-6px",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "7px solid rgba(20,16,10,0.92)",
          }}
        />
      </div>
    </div>
  );
}
