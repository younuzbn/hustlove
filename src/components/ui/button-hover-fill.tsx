"use client";

// Button hover: the logo's lime square appears at the left edge and grows to
// fill the button (on the lime primary the square is ink); on outlined buttons
// the fill covers the outline. Past ~60% the label and icons flip to the colour
// that reads on the fill, and the arrow icon nudges right. Pointer hover only;
// keyboard focus plays it too.
// Motion off: the children as they are — no wrapper, no listeners.

import { animated, type Interpolation, useSpring } from "@react-spring/web";
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

import type { ButtonVariant } from "./button-link";

/** Buttons whose label is light (dark or outline-on-dark surfaces). */
const lightLabel = new Set<ButtonVariant>(["outline", "outline-soft", "dark"]);

/** Buttons drawn with a 1px outline — the fill reaches over it so a filled button has no ring. */
const outlined = new Set<ButtonVariant>([
  "outline",
  "outline-soft",
  "outline-ink",
]);

export interface ButtonHoverFillProps {
  variant: ButtonVariant;
  children: ReactNode;
}

export const ButtonHoverFill = ({
  variant,
  children,
}: ButtonHoverFillProps) => {
  const active = !useMotionOffMarkup();
  const probe = useRef<HTMLSpanElement>(null);
  const [radius, setRadius] = useState(16);
  const [on, setOn] = useState(false);

  // Listen on the link itself (the probe's parent).
  useEffect(() => {
    const link = probe.current?.parentElement;
    if (!active || !link) return;
    setRadius(parseFloat(getComputedStyle(link).borderTopLeftRadius) || 16);
    const fine = window.matchMedia(
      "(hover: hover) and (min-width: 1025px)",
    ).matches;
    const enter = () => setOn(true);
    const leave = () => setOn(false);
    const focus = () => link.matches(":focus-visible") && setOn(true);
    if (fine) {
      link.addEventListener("mouseenter", enter);
      link.addEventListener("mouseleave", leave);
    }
    link.addEventListener("focus", focus);
    link.addEventListener("blur", leave);
    // The fill is clipped with clip-path and reaches under the outline: no overflow clip here.
    link.style.position = "relative";
    link.style.isolation = "isolate";
    return () => {
      link.removeEventListener("mouseenter", enter);
      link.removeEventListener("mouseleave", leave);
      link.removeEventListener("focus", focus);
      link.removeEventListener("blur", leave);
      link.style.removeProperty("position");
      link.style.removeProperty("isolation");
    };
  }, [active]);

  // Pass 1 (2026-11-12, TBT — Fix Catalog "Hover springs only where a mouse
  // can hover"): 21 buttons built this spring in the hydration commit, on
  // phones where it never plays. Until the first hover / focus the fill is the
  // same markup at rest (h = 0) with no spring; then `LiveFill` mounts from 0.
  const [armed, setArmed] = useState(false);
  if (on && !armed) setArmed(true);

  if (!active) return <>{children}</>;

  return (
    <>
      <span ref={probe} hidden />
      {armed ? (
        <LiveFill variant={variant} radius={radius} on={on}>
          {children}
        </LiveFill>
      ) : (
        <Fill variant={variant} radius={radius} bind={(f) => f(0)}>
          {children}
        </Fill>
      )}
    </>
  );
};

type Bind = <T>(f: (h: number) => T) => T | Interpolation<number, T>;

interface FillProps {
  variant: ButtonVariant;
  radius: number;
  children: ReactNode;
}

const LiveFill = ({ on, ...props }: FillProps & { on: boolean }) => {
  const s = useSpring({ from: { h: 0 }, h: on ? 1 : 0, config: SPRING.quick });
  return <Fill {...props} bind={(f) => s.h.to(f)} />;
};

const Fill = ({
  variant,
  radius,
  bind,
  children,
}: FillProps & { bind: Bind }) => {
  const primary = variant === "primary";
  return (
    <>
      <animated.span
        aria-hidden
        className={`pointer-events-none absolute -z-10 ${outlined.has(variant) ? "-inset-px" : "inset-0"} ${primary ? "bg-ink" : "bg-highlight"}`}
        style={{
          clipPath: bind(
            (h) =>
              `inset(calc(${(1 - h) * 50}% - ${(1 - h) * 4}px) calc(${(1 - h) * 100}% - ${(1 - h) * 32}px) calc(${(1 - h) * 50}% - ${(1 - h) * 4}px) ${(1 - h) * 24}px round ${2 + h * (radius - 2)}px)`,
          ),
          opacity: bind((h) => (h < 0.01 ? 0 : 1)),
        }}
      />
      <animated.span
        className="inline-flex items-center gap-3"
        style={{
          // On the ink fill the label turns light; on lime it turns ink.
          color: bind((h) =>
            h > 0.6 ? (primary ? "var(--on-dark)" : "var(--ink)") : "inherit",
          ),
        }}
      >
        {Children.map(children, (child) =>
          isValidElement(child) ? (
            <animated.span
              className="inline-flex"
              style={{
                filter: bind((h) =>
                  h > 0.6
                    ? primary
                      ? "brightness(0) invert(1)"
                      : lightLabel.has(variant)
                        ? "brightness(0)"
                        : "none"
                    : "none",
                ),
                // The button's icon is its arrow (→): it nudges along as the fill grows.
                transform: bind((h) => `translateX(${h * 3}px)`),
              }}
            >
              {child}
            </animated.span>
          ) : (
            child
          ),
        )}
      </animated.span>
    </>
  );
};
