"use client";

import { useEffect, useRef, useState } from "react";
import { worldState } from "@/lib/world/worldState";
import { COLS, ROWS, WORLD_W, WORLD_H, TILE, BUILDINGS, CAVE, RIVER, POND } from "../world/world.config";

export default function Minimap() {
  const markerRef = useRef<HTMLDivElement>(null);
  
  // Minimap size logic
  const mapW = 120;
  const scale = mapW / WORLD_W;
  const mapH = WORLD_H * scale;

  useEffect(() => {
    let frame: number;
    const update = () => {
      if (markerRef.current) {
        // Position player marker based on worldState.playerX/Y
        const px = worldState.playerX * scale;
        const py = worldState.playerY * scale;
        markerRef.current.style.transform = `translate(${px}px, ${py}px)`;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [scale]);

  return (
    <div
      className="absolute right-4 top-4 pointer-events-auto"
      style={{
        width: `${mapW}px`,
        height: `${mapH}px`,
        background: "#1a2010",
        border: "2px solid #3a5020",
        boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
        opacity: 0.85,
      }}
    >
      {/* ── River ────────────────────────────────────────────────────────── */}
      <div
        className="absolute left-0 w-full"
        style={{
          top: `${RIVER.row * TILE * scale}px`,
          height: `${RIVER.rows * TILE * scale}px`,
          background: "#205080",
        }}
      />

      {/* ── Pond ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: `${POND.col * TILE * scale}px`,
          top: `${POND.row * TILE * scale}px`,
          width: `${POND.w * TILE * scale}px`,
          height: `${POND.h * TILE * scale}px`,
          background: "#205080",
        }}
      />

      {/* ── Buildings ────────────────────────────────────────────────────── */}
      {BUILDINGS.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.col * TILE * scale}px`,
            top: `${b.row * TILE * scale}px`,
            width: `${b.w * TILE * scale}px`,
            height: `${b.h * TILE * scale}px`,
            background: "#a07030",
            border: "1px solid #000",
          }}
        />
      ))}

      {/* ── Cave ─────────────────────────────────────────────────────────── */}
      <div
        className="absolute"
        style={{
          left: `${CAVE.col * TILE * scale}px`,
          top: `${CAVE.row * TILE * scale}px`,
          width: `${CAVE.w * TILE * scale}px`,
          height: `${CAVE.h * TILE * scale}px`,
          background: "#302020",
          border: "1px solid #000",
        }}
      />

      {/* ── Player Marker ────────────────────────────────────────────────── */}
      <div
        ref={markerRef}
        className="absolute"
        style={{
          width: "4px",
          height: "4px",
          background: "#f0c050",
          border: "1px solid #000",
          borderRadius: "50%",
          // center the dot on the exact coordinate
          marginLeft: "-2px",
          marginTop: "-2px",
          zIndex: 10,
        }}
      />
    </div>
  );
}
