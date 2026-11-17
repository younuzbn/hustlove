"use client";

// A section label's icon: when the label first scrolls into view (after the
// preloader) the icon springs in from a small turn and scale; hovering the
// label gives it a little turn again. Motion off: the plain icon.

import { animated, to, useSpring } from "@react-spring/web";
import { useRef, type ReactNode } from "react";

import { usePlayOnce } from "@/components/common/play-once";
import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";

/** The one place a touch of overshoot reads as charm: a small icon settling. */
const settle = { tension: 300, friction: 17 };

export const PillIcon = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const active = !useMotionOffMarkup();
  const play = usePlayOnce(ref, { active, waitPreloader: true });
  const hover = useHoverFocus(ref, { active, closest: "[data-pill]" });
  const s = useSpring({
    from: { p: 0 },
    p: play ? 1 : 0,
    h: hover ? 1 : 0,
    immediate: !play,
    delay: (key: string) => (key === "p" && play ? 120 : 0),
    config: settle,
  });
  if (!active) return <>{children}</>;
  return (
    <animated.span
      ref={ref}
      className="inline-flex shrink-0"
      style={{
        opacity: s.p.to((p) => Math.min(1, Math.max(0, p * 1.5))),
        transform: to([s.p, s.h], (p, h) => `rotate(${(1 - p) * -60 + h * 14}deg) scale(${(0.5 + 0.5 * p) * (1 + h * 0.08)})`),
      }}
    >
      {children}
    </animated.span>
  );
};
