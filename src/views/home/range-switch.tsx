"use client";

// The dashboard's 3M / YTD / 1Y control: a white pill slides to the picked
// range on a spring and the balance line draws again (the demo keeps one
// series). Before hydration the active range paints its own pill.

import { animated } from "@react-spring/web";
import { useRef, useState } from "react";

import { useSlidingPill } from "@/hooks/use-sliding-pill";

import { REDRAW_EVENT } from "./dashboard-chart-motion";

export interface RangeSwitchProps {
  ranges: readonly string[];
  active: string;
  label: string;
}

export const RangeSwitch = ({ ranges, active, label }: RangeSwitchProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(Math.max(0, ranges.indexOf(active)));
  const pill = useSlidingPill(ref, index);

  const pick = (i: number) => {
    if (i === index) return;
    setIndex(i);
    window.dispatchEvent(new Event(REDRAW_EVENT));
  };

  return (
    <div ref={ref} role="group" aria-label={label} className="relative flex rounded-full bg-on-dark/10 p-1 text-body-s">
      {pill.measured && <animated.span aria-hidden className="absolute top-0 left-0 rounded-full bg-surface" style={pill.style} />}
      {ranges.map((range, i) => {
        const on = i === index;
        const lit = pill.measured ? on && pill.landed === i : on;
        return (
          <button
            key={range}
            ref={pill.item(i)}
            type="button"
            aria-pressed={on}
            onClick={() => pick(i)}
            className={`relative flex h-8 items-center rounded-full px-4 transition-colors duration-[var(--duration-fast)] ease-entrance ${
              lit ? "text-ink" : "text-on-dark-soft hover:text-on-dark"
            } ${on && !pill.measured ? "bg-surface" : ""}`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};
