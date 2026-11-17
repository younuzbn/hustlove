"use client";

// Text-link hover — the section heading's line rise (`MaskLines`) played on a
// label: on hover the line slides up out of its clipped line box while an
// identical copy rises into place from below through the same mask (140% →
// 0, `SPRING.slow`, the heading's travel and spring); it reverses on leave.
// The clip is the label's own line box and the copy is absolutely placed, so
// the link never changes size. Motion off: the plain text.

import { animated, type Interpolation, useSpring } from "@react-spring/web";
import { useState } from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export interface RollLabelProps {
  text: string;
  /** Hovered / focused: the copy has risen into place. */
  on: boolean;
}

/** The heading lines start 140% below their mask (`MaskLines`). */
const TRAVEL = 140;

type Bind = (
  f: (p: number) => string,
) => string | Interpolation<number, string>;

const Label = ({ text, bind }: { text: string; bind: Bind }) => (
  <span className="relative inline-block whitespace-nowrap [clip-path:inset(0_-0.2em)]">
    <animated.span
      className="inline-block"
      style={{ transform: bind((p) => `translateY(${-p * TRAVEL}%)`) }}
    >
      {text}
    </animated.span>
    <animated.span
      aria-hidden
      className="absolute top-0 left-0 inline-block"
      style={{ transform: bind((p) => `translateY(${(1 - p) * TRAVEL}%)`) }}
    >
      {text}
    </animated.span>
  </span>
);

/** The live label: its spring exists only from the first hover / focus on. */
const LiveLabel = ({ text, on }: RollLabelProps) => {
  const s = useSpring({ from: { p: 0 }, p: on ? 1 : 0, config: SPRING.slow });
  return <Label text={text} bind={(f) => s.p.to(f)} />;
};

/**
 * Pass 1 (2026-11-12, TBT — Fix Catalog "Hover springs only where a mouse can
 * hover"): ~25 labels built a spring each in the hydration commit, on phones
 * where they never play. Until the first hover / focus the label is the same
 * markup at rest with no spring; then the live one mounts from rest, so even
 * the first hover plays in full.
 */
export const RollLabel = ({ text, on }: RollLabelProps) => {
  const active = !useMotionOffMarkup();
  const [armed, setArmed] = useState(false);
  if (on && !armed) setArmed(true);

  if (!active) return <>{text}</>;
  if (armed) return <LiveLabel text={text} on={on} />;
  return <Label text={text} bind={(f) => f(0)} />;
};
