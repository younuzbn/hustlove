"use client";

// Balance chart entrance: the line draws left→right (a clip-path wipe over the
// line art), the area fades in under it, then the guide, the point, the
// "18 Jun" tooltip and the end dot pop. Picking another range on the
// dashboard (`REDRAW_EVENT`) draws the line again and re-lands the end dot.
// Motion off: the plain elements.

import { animated, to, useSpring } from "@react-spring/web";
import { createElement, useEffect, useRef, type ReactNode } from "react";

import { PlayGroup, usePlayGroup } from "@/components/common/play-once";
import { useInViewFlag } from "@/hooks/use-in-view-flag";
import { useMotionOff, useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

/** Fired on `window` by the dashboard's range switch. */
export const REDRAW_EVENT = "kelder:chart-redraw";

const redraw: Partial<Record<ChartPartName, { from: Partial<Values>; delay: number }>> = {
  line: { from: { clip: 100 }, delay: 0 },
  area: { from: { opacity: 0.35 }, delay: 200 },
  end: { from: { scale: 0 }, delay: 650 },
};

export type ChartPartName = "area" | "line" | "guide" | "point" | "tooltip" | "end";

/** The chart plot: one in-view trigger for all its parts. */
export const ChartStage = ({ className, children }: { className: string; children: ReactNode }) => (
  <PlayGroup active={!useMotionOffMarkup()} className={className}>
    {children}
  </PlayGroup>
);

type Values = { clip: number; opacity: number; sy: number; scale: number; y: number };
const rest: Values = { clip: 0, opacity: 1, sy: 1, scale: 1, y: 0 };

const plan: Record<ChartPartName, { from: Partial<Values>; delay: number; config: object; origin?: string }> = {
  line: { from: { clip: 100 }, delay: 0, config: { tension: 60, friction: 20 } },
  area: { from: { opacity: 0 }, delay: 450, config: SPRING.slow },
  guide: { from: { sy: 0 }, delay: 800, config: SPRING.calm, origin: "50% 100%" },
  point: { from: { scale: 0 }, delay: 900, config: SPRING.calm },
  tooltip: { from: { opacity: 0, y: 8, scale: 0.96 }, delay: 960, config: SPRING.calm },
  end: { from: { scale: 0 }, delay: 1000, config: SPRING.calm },
};

export interface ChartPartProps {
  part: ChartPartName;
  tag?: "div" | "span";
  className: string;
  children?: ReactNode;
}

export const ChartPart = ({ part, tag = "div", className, children }: ChartPartProps) => {
  const { play, active } = usePlayGroup();
  const p = plan[part];
  const from = { ...rest, ...p.from };
  const [s, api] = useSpring(
    {
      from,
      to: play ? rest : from,
      immediate: !play,
      delay: play ? p.delay : 0,
      config: p.config,
    },
    [play],
  );
  useEffect(() => {
    const again = redraw[part];
    if (!active || !play || !again) return;
    const run = () => api.start({ from: { ...rest, ...again.from }, to: rest, delay: again.delay, config: p.config });
    window.addEventListener(REDRAW_EVENT, run);
    return () => window.removeEventListener(REDRAW_EVENT, run);
  }, [active, play, part, api, p.config]);
  if (!active) return createElement(tag, { className }, children);
  const Tag = animated[tag];
  return (
    <Tag
      className={className}
      style={{
        opacity: s.opacity,
        clipPath: s.clip.to((c) => (c > 0.05 ? `inset(-10% ${c}% -10% 0)` : "none")),
        transformOrigin: p.origin ?? "50% 50%",
        transform: to([s.y, s.scale, s.sy], (y, sc, sy) => `translateY(${y}px) scale(${sc}) scaleY(${sy})`),
      }}
    >
      {children}
    </Tag>
  );
};

const PULSE_EVERY = 2800;

/**
 * A calm ring that breathes out of the lime end dot every few seconds once the
 * chart has drawn. Runs only while the chart is on screen; none under motion off.
 */
export const EndPulse = ({ className }: { className: string }) => {
  const { play, active } = usePlayGroup();
  const ref = useRef<HTMLSpanElement>(null);
  const motionOff = useMotionOff();
  const live = active && !motionOff;
  const inView = useInViewFlag(ref, live);
  const [s, api] = useSpring(() => ({ r: 1 }));

  useEffect(() => {
    if (!inView || !play) return;
    const ring = () => api.start({ from: { r: 0 }, to: { r: 1 }, config: { tension: 30, friction: 16 } });
    const first = window.setTimeout(ring, 1600);
    const timer = window.setInterval(ring, PULSE_EVERY);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [inView, play, api]);

  if (!active) return null;
  return (
    <animated.span
      ref={ref}
      aria-hidden
      className={className}
      style={{
        opacity: s.r.to((r) => 0.5 * Math.max(0, 1 - r) * Math.min(1, r * 10)),
        transform: s.r.to((r) => `scale(${1 + r * 1.8})`),
      }}
    />
  );
};
