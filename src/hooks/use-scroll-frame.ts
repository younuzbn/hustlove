"use client";

// 📖 Docs: obsidian/frontend/animation-system.md → "This site's motion (Kelder)"

import { useEffect, useRef, useState, type RefObject } from "react";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { createFrameClock } from "@/lib/scene/per-frame";

/** Called every frame with the frame's duration in seconds (0 on the first / snapping call). */
export type ScrollFrame = (dt: number) => void;

export interface ScrollFrameOptions {
  /** Off: nothing runs (motion off, a breakpoint the effect skips). */
  active?: boolean;
  /** How far outside the viewport the element still counts as near (IntersectionObserver rootMargin). */
  margin?: string;
}

/**
 * Scroll-scrubbed work through the shared ticker: `frame` runs every frame
 * while `ref` is near the viewport, and once more (with `dt` 0) when it
 * leaves, so a fast scroll past still lands the final state. Read layout and
 * write transforms / opacity / clip only, and only when the value changed.
 */
export const useScrollFrame = (
  ref: RefObject<Element | null>,
  frame: ScrollFrame,
  { active = true, margin = "25% 0px 25% 0px" }: ScrollFrameOptions = {},
) => {
  const latest = useRef(frame);
  useEffect(() => {
    latest.current = frame;
  });

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const clock = createFrameClock();
    let unsub: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (unsub) return;
          clock.reset();
          unsub = subscribeToTicker((time) => latest.current(clock.tick(time).dt), () => 0);
        } else if (unsub) {
          latest.current(0);
          unsub();
          unsub = null;
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    latest.current(0);
    return () => {
      io.disconnect();
      unsub?.();
    };
  }, [ref, active, margin]);
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smoothstep — a scrubbed value eases in and out of its range. */
export const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/** A `matchMedia` flag; false on the server, before mount and while inactive. */
export const useMedia = (query: string, active = true): boolean => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) return;
    const mq = window.matchMedia(query);
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query, active]);
  return active && on;
};
