"use client";

// Numbers count up from ~55% of their value the first time they scroll into
// view — the digits roll in place (`RollingNumber`): each digit keeps the box
// of its final glyph and separators / currency / units never move, so the
// number's position and width are constant from the first paint.
// Robot form: the plain value. Reduced motion: the final digits, no roll.

import { easings } from "@react-spring/web";
import { useRef } from "react";

import { usePlayOnce } from "@/components/common/play-once";
import { useRobot } from "@/components/common/robot-view";
import { RollingNumber, parseNumber } from "@/components/ui/rolling-number";
import { useMotionOff } from "@/hooks/use-motion-off";

export interface CountUpProps {
  value: string;
  /** In the first screen: hold until the preloader has lifted, then roll. */
  waitPreloader?: boolean;
  /** How far into the viewport it must be before it plays (IntersectionObserver rootMargin). */
  margin?: string;
}

const config = { duration: 1100, easing: easings.easeOutCubic };

export const CountUp = ({ value, waitPreloader = false, margin }: CountUpProps) => {
  const parsed = parseNumber(value);
  const robot = useRobot();
  const motionOff = useMotionOff();
  const ref = useRef<HTMLSpanElement>(null);
  const play = usePlayOnce(ref, { active: !robot && parsed !== null, waitPreloader, margin });

  if (robot || !parsed) return <>{value}</>;
  return (
    <span ref={ref}>
      <RollingNumber value={value} from={Math.floor(parsed.total * 0.55)} play={play} config={motionOff ? { duration: 0 } : config} />
    </span>
  );
};
