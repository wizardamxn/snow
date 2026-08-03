"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + lifts its children into place the first time they scroll into view —
 * the quest log's answer to the game's "panel-pop", so sections arrive as you
 * reach them instead of all being present in one dead scroll.
 *
 * The hidden start-state is gated behind a `.reveal-ready` class that this
 * component adds to <html> on mount, so with JS disabled (or before hydration)
 * everything is simply visible — the content is never JS-dependent. Honours
 * `prefers-reduced-motion` by revealing immediately with no transition.
 */
export default function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Anchor id — forwarded so nav links (#relics …) and QuestProgress still resolve. */
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    document.documentElement.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={className} data-reveal={shown ? "in" : "out"}>
      {children}
    </div>
  );
}
