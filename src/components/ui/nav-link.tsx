"use client";

// Text-link hover shared by the header, the scroll bar, the footer and the
// mobile menu: the label rises through its mask like a section heading line
// (`RollLabel`). Pointer hover only (`(hover: hover)`); keyboard focus plays it
// too, and on touch the mobile sheet rows play it on press.
//
//   "nav"   header nav, "menu" mobile sheet rows, "text" Log in and footer links —
//           all the same rise (no extra marks); nav/menu also set aria-current.
//
// The arrow is a transform: the link keeps its size.
// A trailing arrow ("Back to top ↑") is split off and nudges its way instead.
// Motion off: plain text.

import { animated, useSpring } from "@react-spring/web";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

import { RollLabel } from "./roll-label";

export type NavLinkVariant = "nav" | "text" | "menu";

export interface NavLinkProps {
  /** Empty: the label renders as plain text, no link. */
  href: string;
  label: string;
  variant?: NavLinkVariant;
  className?: string;
}

/** "Back to top ↑" → ["Back to top", "↑"]. */
const splitArrow = (label: string): [string, string | null] => {
  const m = /^(.*\S)\s+([↑→])$/.exec(label);
  return m ? [m[1], m[2]] : [label, null];
};

export const NavLink = ({
  href,
  label,
  variant = "text",
  className = "",
}: NavLinkProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const motion = !useMotionOffMarkup();
  const on = useHoverFocus(ref, { active: motion, press: variant === "menu" });
  const pathname = usePathname();
  const current = variant !== "text" && pathname === href;
  const [text, arrow] = splitArrow(label);

  // The arrow's spring exists only from the first hover / focus on (pass 1,
  // 2026-11-12, TBT): same markup at rest until then.
  const [armed, setArmed] = useState(false);
  if (on && !armed) setArmed(true);

  if (!href) return <span className={`relative ${className}`}>{label}</span>;

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={current ? "page" : undefined}
      className={`relative ${className}`}
    >
      <RollLabel text={text} on={on} />
      {arrow && (
        <>
          {" "}
          {armed ? (
            <LiveArrow arrow={arrow} on={on} />
          ) : (
            <span
              aria-hidden
              className="inline-block"
              style={{ transform: arrowAt(arrow, 0) }}
            >
              {arrow}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

const arrowAt = (arrow: string, n: number) =>
  arrow === "↑" ? `translateY(${-n * 3}px)` : `translateX(${n * 4}px)`;

const LiveArrow = ({ arrow, on }: { arrow: string; on: boolean }) => {
  const nudge = useSpring({
    from: { n: 0 },
    n: on ? 1 : 0,
    config: SPRING.quick,
  });
  return (
    <animated.span
      aria-hidden
      className="inline-block"
      style={{ transform: nudge.n.to((n) => arrowAt(arrow, n)) }}
    >
      {arrow}
    </animated.span>
  );
};
