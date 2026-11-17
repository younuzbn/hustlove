"use client";

// The header logo. The mark is inline so its squares can move: on hover (fine
// pointers) or keyboard focus the lime square hops and settles, the top square
// nudges outwards. The preloader's flying mark lands on `[data-logo-mark]`.
// Motion off: the static mark.

import { animated, useSpring } from "@react-spring/web";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export interface LogoLinkProps {
  brand: string;
  /** Ink bars (light header / white sheet) instead of white ones. */
  ink?: boolean;
  className?: string;
}

const BAR = "M7 1H3C1.89543 1 1 1.89543 1 3V19C1 20.1046 1.89543 21 3 21H7C8.10457 21 9 20.1046 9 19V3C9 1.89543 8.10457 1 7 1Z";
const TOP = "M19 1H15C13.8954 1 13 1.89543 13 3V7C13 8.10457 13.8954 9 15 9H19C20.1046 9 21 8.10457 21 7V3C21 1.89543 20.1046 1 19 1Z";
const LIME = "M19 13H15C13.8954 13 13 13.8954 13 15V19C13 20.1046 13.8954 21 15 21H19C20.1046 21 21 20.1046 21 19V15C21 13.8954 20.1046 13 19 13Z";

export const LogoLink = ({ brand, ink = false, className = "" }: LogoLinkProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const motion = !useMotionOffMarkup();
  const on = useHoverFocus(ref, { active: motion });
  const top = useSpring({ x: on ? 1.25 : 0, config: SPRING.quick });
  const [lime, limeApi] = useSpring(() => ({ y: 0 }));

  useEffect(() => {
    if (!on) return;
    // A hop: up, then back with the one tiny overshoot this site allows itself.
    limeApi.start({
      to: [
        { y: -3.5, config: { tension: 520, friction: 26 } },
        { y: 0, config: { tension: 320, friction: 16 } },
      ],
    });
  }, [on, limeApi]);

  const fill = ink ? "fill-ink" : "fill-on-dark";
  return (
    <Link ref={ref} href="/" className={`flex min-h-11 items-center gap-3 text-logo font-medium ${className}`}>
      <svg
        data-logo-mark=""
        data-ink={ink ? "" : undefined}
        viewBox="0 0 22 22"
        aria-hidden
        className="size-5.5 shrink-0 overflow-visible"
      >
        <path d={BAR} className={fill} />
        <animated.path d={TOP} className={fill} style={{ transform: motion ? top.x.to((x) => `translate(${x}px, ${-x}px)`) : undefined }} />
        <animated.path d={LIME} className="fill-highlight" style={{ transform: motion ? lime.y.to((y) => `translateY(${y}px)`) : undefined }} />
      </svg>
      {brand}
    </Link>
  );
};
