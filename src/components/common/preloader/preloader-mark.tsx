"use client";

import { animated, easings, useSpring } from "@react-spring/web";
import type { ComponentProps } from "react";

import { SPRING } from "@/lib/springs/presets";

const BAR = "M7 1H3C1.89543 1 1 1.89543 1 3V19C1 20.1046 1.89543 21 3 21H7C8.10457 21 9 20.1046 9 19V3C9 1.89543 8.10457 1 7 1Z";
const SQUARE = "M19 1H15C13.8954 1 13 1.89543 13 3V7C13 8.10457 13.8954 9 15 9H19C20.1046 9 21 8.10457 21 7V3C21 1.89543 20.1046 1 19 1Z";
const LIME = "M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z";
/** "AED 2,418,300". Not `toLocaleString`: its first call loads ICU number data —
 *  ~30 ms in the hydration task on a 4× phone (pass 1, 2026-11-12). Same grouping. */
const aed = (n: number) => `AED ${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

/**
 * The logomark built as the product story: the tall bar fills like the current
 * account, the white square splits off it to the right (the surplus swept out),
 * the lime square lands last (the placed cash earning). The counter runs to
 * `total` (the dashboard's real balance). `onBuilt` fires shortly after it lands.
 */
export const useSweepBuild = (total: number, onBuilt: () => void) => {
  const bar = useSpring({ from: { v: 0 }, to: { v: 1 }, delay: 80, config: { duration: 520, easing: easings.easeOutCubic } });
  const split = useSpring({ from: { v: 0 }, to: { v: 1 }, delay: 520, config: SPRING.calm });
  const lime = useSpring({ from: { v: 0 }, to: { v: 1 }, delay: 860, config: SPRING.calm });
  const count = useSpring({
    from: { n: 0 },
    to: { n: total },
    delay: 80,
    config: { duration: 1200, easing: easings.easeOutCubic },
    onRest: () => setTimeout(onBuilt, 180),
  });
  return { bar, split, lime, count };
};

export type SweepBuild = ReturnType<typeof useSweepBuild>;

export interface SweepMarkProps {
  build: SweepBuild;
  className?: string;
}

export const SweepMark = ({ build, className = "" }: SweepMarkProps) => (
  <animated.svg viewBox="0 0 22 22" fill="none" aria-hidden className={`overflow-visible ${className}`}>
    <animated.path
      d={BAR}
      fill="currentColor"
      style={{ transformBox: "fill-box", transformOrigin: "50% 100%", transform: build.bar.v.to((v) => `scaleY(${v})`) }}
    />
    <animated.path
      d={SQUARE}
      fill="currentColor"
      style={{
        opacity: build.split.v.to((v) => (v > 0.02 ? 1 : 0)),
        transform: build.split.v.to((v) => `translateX(${(1 - v) * -12}px)`),
      }}
    />
    <animated.path
      d={LIME}
      className="fill-highlight"
      style={{ opacity: build.lime.v, transform: build.lime.v.to((v) => `translateY(${(1 - v) * -9}px)`) }}
    />
  </animated.svg>
);

export interface SweepCounterProps {
  build: SweepBuild;
  label: string;
  style?: ComponentProps<typeof animated.div>["style"];
}

/** "Placed balance today" over the counting figure. */
export const SweepCounter = ({ build, label, style }: SweepCounterProps) => (
  <animated.div className="flex flex-col items-center gap-2" style={style}>
    <p className="text-body-s text-on-dark-soft">{label}</p>
    <animated.p className="min-w-[14ch] text-center text-number-m font-light tabular-nums">{build.count.n.to(aed)}</animated.p>
  </animated.div>
);
