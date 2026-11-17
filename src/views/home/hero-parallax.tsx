"use client";

// Hero parallax: once the page scrolls, the hero copy moves with it (1×) while
// a `HeroParallax` layer lags behind by `lag` of the distance scrolled — the
// dashboard 0.15, the halftone 0.35. The hero sits at the top of the page, so
// that distance is `scrollY`. Writes the CSS `translate` property only (it
// composes with the entrance transform). Every width; at ≤768 the cap is halved (the
// next section sits closer). Motion off: nothing.

import { useEffect, useRef, type ReactNode } from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { useMedia, useScrollFrame } from "@/hooks/use-scroll-frame";

export interface HeroParallaxProps {
  /** Share of the scrolled distance the layer falls behind (0.15 → it moves at 0.85×). */
  lag: number;
  /** Cap on the lag in rem, approached smoothly (the lag eases out instead of growing on):
   *  keeps the dashboard clear of the next section's heading. */
  max?: number;
  className?: string;
  children: ReactNode;
}

export const HeroParallax = ({ lag, max, className, children }: HeroParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const motionOn = !useMotionOffMarkup();
  const active = motionOn;
  // The cap keeps the lagging dashboard clear of the next section's dashed rule (110px at 1440,
  // 80px at 1024/768, 56px at 390): while scrolling the gap stays at ~80% of its size at rest.
  const laptop = useMedia("(width <= 1024px)", motionOn);
  const phone = useMedia("(width <= 560px)", motionOn);
  const last = useRef(-1);
  const rem = useRef({ width: -1, px: 16 });

  useScrollFrame(
    ref,
    () => {
      const el = ref.current;
      if (!el) return;
      const raw = Math.max(0, window.scrollY) * lag;
      // Same slope at the start; with a cap the lag saturates (m·(1 − e^(−raw/m))).
      if (max && rem.current.width !== window.innerWidth) {
        rem.current = { width: window.innerWidth, px: parseFloat(getComputedStyle(document.documentElement).fontSize) };
      }
      const m = max ? max * rem.current.px * (phone ? 0.1 : laptop ? 0.15 : 0.25) : 0;
      const y = Math.round((m ? m * (1 - Math.exp(-raw / m)) : raw) * 100) / 100;
      if (y === last.current) return;
      last.current = y;
      el.style.translate = y > 0 ? `0 ${y}px` : "";
    },
    { active },
  );

  useEffect(() => {
    const el = ref.current;
    return () => {
      last.current = -1;
      el?.style.removeProperty("translate");
    };
  }, [active]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
