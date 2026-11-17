"use client";

// Hero entrance: plays on load, after the preloader lifts. The H1 lines rise
// from masks, the lead fades, the buttons and pill rise a little, the dashboard
// lifts in from 0.98. Motion off: the plain elements, no inline style.

import { animated, to, useSpring } from "@react-spring/web";
import { createElement, useEffect, useState, type ReactNode } from "react";

import { MaskLines } from "@/components/common/mask-lines";
import { usePlayOnce } from "@/components/common/play-once";
import { usePreloaderStore } from "@/components/common/preloader/preloader-store";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export type HeroPart = "pill" | "title" | "lead" | "actions" | "dashboard";

type Values = { opacity: number; y: number; scale: number };
type Motion = { from: Values; delay: number; config: object };

const rest: Values = { opacity: 1, y: 0, scale: 1 };
const fadeUp = (delay: number, y: number): Motion => ({ from: { opacity: 0, y, scale: 1 }, delay, config: SPRING.calm });

const motions: Record<HeroPart, Motion> = {
  pill: fadeUp(0, 12),
  // The title wrapper holds still; its lines rise inside it (`HeroTitle`).
  title: { from: rest, delay: 0, config: SPRING.calm },
  lead: fadeUp(420, 0),
  actions: fadeUp(520, 12),
  dashboard: { from: { opacity: 0, y: 40, scale: 0.98 }, delay: 600, config: SPRING.slow },
};

/** Every hero part starts together, once the preloader (if any) has lifted. */
const useHeroPlay = () => {
  const active = !useMotionOffMarkup();
  const play = usePlayOnce(null, { active, inView: false, waitPreloader: true });
  return { active, play };
};

/** How long to wait for a reported paint before releasing the hold anyway. */
const PAINT_WAIT_MS = 1500;

/** Set once the first hero part has hydrated: later mounts (client-side
 *  navigation back to `/`) have no server HTML to keep and start hidden. */
let hydrated = false;

const coverUp = () =>
  usePreloaderStore.getState().active || document.documentElement.hasAttribute("data-preloader");

/**
 * LCP at first paint (pass 1, 2026-11-12 — Fix Catalog "Serve the LCP text at
 * rest under an opaque curtain"): the server HTML and the first client render
 * show the hero **at rest**, painted under the preloader's opaque cover. Once a
 * paint has been reported — still under the cover — the parts drop to their
 * start state, and the entrance plays exactly as before when the cover lifts.
 * Without a cover (it never came up) the parts simply stay at rest: no flash.
 * Returns true while the parts must stay at rest.
 */
const useHoldAtRest = (active: boolean): boolean => {
  const [hold, setHold] = useState(() => !hydrated);
  useEffect(() => {
    hydrated = true;
    if (!hold || !active) return;
    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      if (coverUp()) setHold(false);
    };
    if (performance.getEntriesByType("paint").length > 0) {
      release();
      return;
    }
    let po: PerformanceObserver | undefined;
    try {
      po = new PerformanceObserver(release);
      po.observe({ type: "paint", buffered: true });
    } catch {
      // No paint timing: the fallback below releases.
    }
    const t = window.setTimeout(release, PAINT_WAIT_MS);
    return () => {
      po?.disconnect();
      window.clearTimeout(t);
    };
  }, [hold, active]);
  return hold;
};

export interface HeroItemProps {
  part: HeroPart;
  tag?: "div" | "h1" | "p";
  className?: string;
  /** Motion off: render the children only (no wrapper element), for a part that needs one to animate. */
  bare?: boolean;
  children: ReactNode;
}

export const HeroItem = ({ part, tag = "div", className, bare = false, children }: HeroItemProps) => {
  const { active, play } = useHeroPlay();
  const hold = useHoldAtRest(active);
  const m = motions[part];
  const start = hold ? rest : m.from;
  const s = useSpring({
    from: start,
    to: play ? rest : start,
    immediate: !play,
    delay: play ? m.delay : 0,
    config: m.config,
  });
  if (!active) return bare ? <>{children}</> : createElement(tag, { className }, children);
  const Tag = animated[tag];
  return (
    <Tag
      className={className}
      style={{
        opacity: s.opacity,
        transform: to([s.y, s.scale], (y, sc) => `translateY(${y}px) scale(${sc})`),
      }}
    >
      {children}
    </Tag>
  );
};

/** The H1 copy: lines rise from masks. */
export const HeroTitle = ({ text }: { text: string }) => {
  const { active, play } = useHeroPlay();
  return <MaskLines text={text} active={active} play={play} delay={60} stagger={90} />;
};
