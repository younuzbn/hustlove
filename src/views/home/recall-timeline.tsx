"use client";

// The "T+1" card's timeline. When it scrolls into view the white "requested"
// dot appears, a small lime pulse runs down the dashed line (the money moving
// overnight) and the lime "in your bank" dot settles as it arrives, with one
// soft ring. Hovering the card (or focusing into it) sends the pulse again.
// Motion off: the static timeline.

import { animated, to, useSpring } from "@react-spring/web";
import { useEffect, useRef } from "react";

import { usePlayOnce } from "@/components/common/play-once";
import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

export interface RecallStep {
  time: string;
  text: string;
}

export interface RecallTimelineProps {
  steps: readonly RecallStep[];
}

const dotTone = ["bg-surface", "bg-highlight"];
// Figma: the dots sit 4px below each step's top and hang 5px left of the rule, 30px left of
// the text, at every width (5628:5219 / 5934:3133 / 5934:10453 / 5934:17765).
const dot = "absolute top-1 -left-7.5 size-3 rounded-full";
/** A dot's centre below its step's top: 4px offset + half of 12px. */
const DOT_CENTER = 10;

const travel = { tension: 70, friction: 20 };

export const RecallTimeline = ({ steps }: RecallTimelineProps) => {
  const ref = useRef<HTMLOListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const active = !useMotionOffMarkup();
  const play = usePlayOnce(ref, { active });
  const hover = useHoverFocus(ref, { active, closest: "article" });

  // y0 / y1: where the pulse starts and lands (the two dots' centres), measured on play.
  const [s, api] = useSpring(() => ({ white: 0, lime: 0, pulse: 0, ring: 1, y0: 0, y1: 0 }));

  useEffect(() => {
    if (!active || !play) return;
    const [first, last] = [items.current[0], items.current[items.current.length - 1]];
    if (first && last) api.set({ y0: first.offsetTop + DOT_CENTER, y1: last.offsetTop + DOT_CENTER });
    api.start({ white: 1, delay: 150, config: SPRING.calm });
    api.start({ from: { pulse: 0 }, to: { pulse: 1 }, delay: 450, config: travel });
    api.start({ lime: 1, delay: 1050, config: SPRING.calm });
    api.start({ from: { ring: 0 }, to: { ring: 1 }, delay: 1050, config: SPRING.slow });
  }, [active, play, api]);

  // Hover: the pulse runs again; the lime dot dips and settles as it lands.
  useEffect(() => {
    if (!hover || !play) return;
    api.start({ from: { pulse: 0 }, to: { pulse: 1 }, config: travel });
    api.start({ to: [{ lime: 0.7 }, { lime: 1 }], delay: 480, config: SPRING.quick });
    api.start({ from: { ring: 0 }, to: { ring: 1 }, delay: 600, config: SPRING.slow });
  }, [hover, play, api]);

  const last = steps.length - 1;
  return (
    <ol ref={ref} className="relative flex flex-col gap-4 border-l dashes-y dash-on-dark/45 pl-6">
      {active && (
        <animated.span
          aria-hidden
          className="absolute top-0 -left-[0.21875rem] h-3 w-1.5 rounded-full bg-highlight"
          style={{
            opacity: s.pulse.to((p) => Math.max(0, Math.min(1, p * 8, (1 - p) * 5))),
            transform: to([s.pulse, s.y0, s.y1], (p, y0, y1) => `translateY(${y0 + (y1 - y0) * p - 6}px)`),
          }}
        />
      )}
      {steps.map((step, i) => (
        <li
          key={step.time}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="relative"
        >
          {active ? (
            <>
              {i === last && (
                <animated.span
                  aria-hidden
                  className={`${dot} bg-highlight`}
                  style={{
                    opacity: s.ring.to((r) => 0.45 * Math.max(0, 1 - r) * Math.min(1, r * 12)),
                    transform: s.ring.to((r) => `scale(${1 + r * 1.6})`),
                  }}
                />
              )}
              <animated.span
                className={`${dot} ${dotTone[i]}`}
                style={{ transform: (i === last ? s.lime : s.white).to((v) => `scale(${v})`) }}
              />
            </>
          ) : (
            <span className={`${dot} ${dotTone[i]}`} />
          )}
          <p className="text-body-s text-on-dark-soft">{step.time}</p>
          <p className="text-body-m">{step.text}</p>
        </li>
      ))}
    </ol>
  );
};
