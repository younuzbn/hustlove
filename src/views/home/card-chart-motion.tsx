"use client";

// Charts inside cards (floor bars, ladder / seasonal bars, the reserve timeline,
// the sweep day tiles, allocation and fee-split bars, instrument and recall dot
// art): bars grow from the bottom (or the left) one after another, art fades in,
// tiles rise in turn. While the card is hovered (`CardHover`) the bars stretch
// a touch in a ripple, markers swell, tiles step up and art leans in.
// Motion off: the plain elements.

import { animated, to, useSpring } from "@react-spring/web";
import { createElement, useRef, type CSSProperties, type ReactNode } from "react";

import { PlayGroup, usePlayGroup, usePlayOnce } from "@/components/common/play-once";
import { useCardHover } from "@/components/ui/card-hover";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export interface CardStageProps {
  tag?: "div" | "ol";
  className?: string;
  children: ReactNode;
  "aria-hidden"?: boolean;
}

/** A chart block: one in-view trigger for its bars. */
export const CardStage = ({ tag = "div", className, children, "aria-hidden": ariaHidden }: CardStageProps) => (
  <PlayGroup active={!useMotionOffMarkup()} tag={tag} className={className} aria-hidden={ariaHidden}>
    {children}
  </PlayGroup>
);

export interface GrowBarProps {
  index: number;
  /** "y": grows up from the bottom. "x": grows from the left (a line or a split bar). */
  axis?: "x" | "y";
  tag?: "div" | "span";
  className?: string;
  style?: CSSProperties;
  /** Extra ms before this bar (e.g. a label after the bars). */
  after?: number;
  /** Fade instead of grow (labels, markers). */
  fade?: boolean;
  children?: ReactNode;
}

/** Hover reaction: a short ripple through the bars, 30ms apart. */
const useHoverNudge = (index: number) => {
  const hovered = useCardHover();
  return useSpring({ h: hovered ? 1 : 0, delay: hovered ? index * 30 : 0, config: SPRING.quick }).h;
};

export const GrowBar = ({ index, axis = "y", tag = "span", className, style, after = 0, fade = false, children }: GrowBarProps) => {
  const { play, active } = usePlayGroup();
  const h = useHoverNudge(index);
  const s = useSpring({
    from: { g: 0 },
    to: { g: play ? 1 : 0 },
    immediate: !play,
    delay: play ? after + index * 80 : 0,
    config: SPRING.calm,
  });
  if (!active) return createElement(tag, { className, style }, children);
  const Tag = animated[tag];
  return (
    <Tag
      className={className}
      style={{
        ...style,
        opacity: fade ? s.g : 1,
        transformOrigin: axis === "y" ? "50% 100%" : "0% 50%",
        transform: fade
          ? to([s.g, h], (g, hv) => `translateY(${(1 - g) * 6}px) scale(${1 + hv * 0.12})`)
          : to([s.g, h], (g, hv) => (axis === "y" ? `scaleY(${Math.max(0, g) * (1 + hv * 0.06)})` : `scaleX(${Math.max(0, g)})`)),
      }}
    >
      {children}
    </Tag>
  );
};

/** Dot / pixel art: fades in from a slight zoom. */
export const FadeInArt = ({ children, className }: { children: ReactNode; className: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const active = !useMotionOffMarkup();
  const play = usePlayOnce(ref, { active });
  const h = useHoverNudge(0);
  const s = useSpring({
    from: { p: 0 },
    to: { p: play ? 1 : 0 },
    immediate: !play,
    delay: play ? 120 : 0,
    config: SPRING.slow,
  });
  if (!active) return <>{children}</>;
  return (
    <animated.div
      ref={ref}
      aria-hidden
      className={className}
      style={{ opacity: s.p, transform: to([s.p, h], (p, hv) => `scale(${1.03 - p * 0.03 + hv * 0.025})`) }}
    >
      {children}
    </animated.div>
  );
};

/** A tile in a row (sweep days): rises in turn. */
export const StaggerTile = ({ index, className, children }: { index: number; className: string; children: ReactNode }) => {
  const { play, active } = usePlayGroup();
  const h = useHoverNudge(index);
  const s = useSpring({
    from: { g: 0 },
    to: { g: play ? 1 : 0 },
    immediate: !play,
    delay: play ? 100 + index * 70 : 0,
    config: SPRING.calm,
  });
  if (!active) return <li className={className}>{children}</li>;
  return (
    <animated.li
      className={className}
      style={{
        opacity: s.g.to((g) => Math.min(1, Math.max(0, g))),
        transform: to([s.g, h], (g, hv) => `translateY(${(1 - g) * 12 - hv * 3}px)`),
      }}
    >
      {children}
    </animated.li>
  );
};
