"use client";

import { useEffect, useRef } from "react";
import { worldState } from "@/lib/world/worldState";
import { COLS, ROWS, WORLD_W, WORLD_H, TILE, BUILDINGS, CAVE, buildTileGrid } from "../world/world.config";

const COLORS: Record<string, string> = {
  water: "#205a78",
  ground: "#4f7a2c",
  high: "#6f9a3a",
  cliff: "#3d4f4a",
  rampL: "#6f9a3a",
  rampR: "#6f9a3a",
  bridge: "#8a5a2c",
};

export default function Minimap() {
  const markerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Minimap size logic
  const mapW = 120;
  const scale = mapW / WORLD_W;
  const mapH = WORLD_H * scale;

  // Terrain is static, so it's painted once from the same grid the world uses.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const grid = buildTileGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = COLORS[grid[r][c]];
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }, []);

  useEffect(() => {
    let frame: number;
    const update = () => {
      if (markerRef.current) {
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
        background: "#205a78",
        border: "2px solid #3a5020",
        boxShadow: "0 0 0 2px #000, inset 0 0 0 2px #000",
        opacity: 0.9,
      }}
    >
      <canvas
        ref={canvasRef}
        width={COLS}
        height={ROWS}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
      />

      {/* ── Buildings ────────────────────────────────────────────────────── */}
      {BUILDINGS.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            left: `${b.col * TILE * scale}px`,
            top: `${(b.row + b.h - 2) * TILE * scale}px`,
            width: `${b.w * TILE * scale}px`,
            height: `${2 * TILE * scale}px`,
            background: "#e0a040",
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
