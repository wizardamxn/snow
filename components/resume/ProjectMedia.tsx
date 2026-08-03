"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * A project thumbnail that plays a short auto-scroll demo of the live site when
 * one exists, and otherwise falls back to the static screenshot.
 *
 * Two play modes:
 *  - `autoplay` (project detail view — one on screen at a time): loops muted on
 *    its own from mount.
 *  - `inViewPlay` (resume grid — several cards, and crucially *touch* devices):
 *    an IntersectionObserver plays the loop while the card is on screen and
 *    pauses it when it scrolls away. This is what makes the demos move on a
 *    phone — hover never fires there, so the old hover-to-play left every demo
 *    frozen on the exact device recruiters actually use.
 *
 * Both modes honour `prefers-reduced-motion`: the poster frame simply holds.
 *
 * `imageStyle`/`className` are forwarded so each surface keeps its own framing.
 */
export default function ProjectMedia({
  video,
  poster,
  image,
  alt,
  autoplay = false,
  inViewPlay = false,
  imageStyle,
  className,
  sizes,
}: {
  video?: string;
  poster?: string;
  image: string;
  alt: string;
  autoplay?: boolean;
  inViewPlay?: boolean;
  imageStyle?: React.CSSProperties;
  className?: string;
  sizes?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!video || !el) return;

    // Reduced-motion: never auto-drive the video — leave the poster showing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.pause();
      return;
    }

    // Detail view: one demo, play it outright (belt-and-braces alongside the
    // autoPlay attribute, since some browsers block the attribute but allow a
    // muted play() call).
    if (autoplay) {
      el.play().catch(() => {});
      return;
    }

    if (!inViewPlay || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.play().catch(() => {});
          else el.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [video, autoplay, inViewPlay]);

  if (!video) {
    return (
      <Image src={image} alt={alt} fill sizes={sizes} className={className} style={imageStyle} priority={autoplay} />
    );
  }

  return (
    <video
      ref={ref}
      src={video}
      poster={poster ?? image}
      muted
      loop
      playsInline
      autoPlay={autoplay}
      // Detail view eagerly loads; the grid stays light until a card nears the
      // viewport, then play() pulls the rest.
      preload={autoplay ? "auto" : inViewPlay ? "metadata" : "none"}
      aria-label={alt}
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...imageStyle }}
    />
  );
}
