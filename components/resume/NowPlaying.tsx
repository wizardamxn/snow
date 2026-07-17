"use client";

import { useEffect, useState } from "react";
import type { NowPlaying as Track } from "@/lib/data/lastfm";

/**
 * "The Bard's Tune" — the same Last.fm now-playing feed the in-game bard sings,
 * surfaced on the resume as a themed card. Reuses /api/now-playing (which has a
 * static fallback track, so this always renders something). Polls every 20s,
 * matching BardBubble.
 */
export default function NowPlaying() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/now-playing");
        if (res.ok && !cancelled) setTrack(await res.json());
      } catch {}
    };
    poll();
    const id = setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!track) return null;

  const label = track.isPlaying ? "NOW PLAYING" : "LAST PLAYED";
  const inner = (
    <div className="pixel-panel flex items-center gap-4 p-4">
      {/* Album art */}
      <div
        className="pixel-img shrink-0 flex items-center justify-center"
        style={{ width: 64, height: 64, background: "#000", border: "2px solid #5a4020", boxShadow: "0 0 0 2px #000" }}
      >
        {track.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.albumArt} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: "#c8861e", fontSize: 24 }}>♪</span>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[6px]" style={{ color: track.isPlaying ? "#8ad060" : "#8a6820", letterSpacing: "0.12em" }}>
            🎵 THE BARD&apos;S TUNE · {label}
          </span>
          {track.isPlaying && (
            <span className="flex items-end gap-[2px]" style={{ height: 10 }} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar"
                  style={{ width: 2, height: 10, background: "#8ad060", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>
        <div
          className="font-pixel text-[9px] mt-2"
          style={{ color: "#f0c050", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {track.title}
        </div>
        <div
          className="font-mono text-sm mt-1"
          style={{ color: "#9a8560", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {track.artist}
          {track.album ? <span style={{ color: "#5a4020" }}> · {track.album}</span> : null}
        </div>
      </div>

      {/* Open on Last.fm */}
      {track.songUrl && (
        <span
          className="font-pixel text-[6px] px-2.5 py-2 shrink-0 hidden sm:inline-block"
          style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
        >
          OPEN ↗
        </span>
      )}
    </div>
  );

  return track.songUrl ? (
    <a href={track.songUrl} target="_blank" rel="noopener noreferrer" className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
