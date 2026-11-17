"use client";

// Security card art (Figma 5628:8750, was cube.svg) inline, so the white top
// cell can move: a "vault lid" — every ~3.2s it lifts ~10 units and settles
// back, a faint navy cell showing under it in proportion to the lift; while
// the card is hovered (or focused into) it rises to ~22 and stays up. The loop
// runs only while the card is on screen. Motion off: the static art, identical
// to cube.svg.

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useId, useRef, useState } from "react";

import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useInViewFlag } from "@/hooks/use-in-view-flag";
import { useMotionOff, useMotionOffMarkup } from "@/hooks/use-motion-off";

const LID = "M613.501 132.355L678.971 170.16L613.501 207.964L548.031 170.16L613.501 132.355Z";
const BEAT = 3200;
const lidSpring = { tension: 120, friction: 18 };

export const SecurityCube = ({ className }: { className: string }) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const animate = !useMotionOffMarkup();
  const motionOff = useMotionOff();
  const live = animate && !motionOff;
  const inView = useInViewFlag(ref, live);
  const hover = useHoverFocus(ref, { active: live, closest: "article" });
  const [up, setUp] = useState(false);

  useEffect(() => {
    if (!inView || hover) return;
    const timer = window.setInterval(() => setUp((u) => !u), BEAT);
    return () => {
      window.clearInterval(timer);
      setUp(false);
    };
  }, [inView, hover]);

  const { l } = useSpring({ l: hover ? 22 : up ? 10 : 0, config: lidSpring });

  return (
    <svg ref={ref} viewBox="0 0 690 460" fill="none" aria-hidden className={className}>
      <defs>
        <radialGradient id={`${id}g`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(614.1 170.2) scale(289.8 289.8)">
          <stop offset="0.35" />
          <stop offset="1" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="690" height="460" style={{ maskType: "alpha" }}>
          <rect width="690" height="460" fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <path d="M417.091 170.16L613.5 283.572V510.397L417.091 396.985V170.16Z" className="fill-accent-strong stroke-accent-strong" strokeWidth="17.1837" strokeLinejoin="round" />
        <path d="M809.909 170.16L613.5 283.572V510.397L809.909 396.985V170.16Z" className="fill-accent stroke-cube-side-edge" strokeWidth="17.1837" strokeLinejoin="round" />
        <path d="M613.5 56.7461L809.91 170.158L613.5 283.571L417.091 170.158L613.5 56.7461Z" className="fill-chart-400 stroke-cube-top-edge" strokeWidth="17.1837" strokeLinejoin="round" />
        {animate && <animated.path d={LID} className="fill-accent" style={{ opacity: l.to((v) => Math.min(0.5, v / 20)) }} />}
        <animated.path d={LID} className="fill-surface" style={animate ? { transform: l.to((v) => `translateY(${-v}px)`) } : undefined} />
        <path
          d="M678.97 94.5508L482.561 207.963V434.788M548.03 94.5508L744.44 207.963V434.788M417.091 245.767L613.5 359.179L809.91 245.767M744.44 132.355L548.03 245.767V472.592M482.561 132.355L678.97 245.767V472.592M417.091 321.375L613.5 434.788L809.91 321.375"
          className="stroke-surface"
          strokeOpacity="0.3"
          strokeWidth="1.71837"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
