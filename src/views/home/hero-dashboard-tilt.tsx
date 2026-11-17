"use client";

// Hero dashboard on scroll (≥769px, motion on): at scrollY 0 the card rests
// tilted back (perspective, rotateX 20°, scale 0.9 — `--tilt-*` tokens, anchored top-centre)
// under the hero copy; scrubbed by the scroll it flattens to the static design
// as its centre reaches the middle of the viewport, while inside it the chart
// area brightens (0.65 → 1) and the lime end dot glides onto the line's end.
//
// The tilt is the resting look at scrollY 0 — the server paints it from CSS
// (`[data-tilt]` + `--tilt-k` in globals.css, under a no-reduced-motion,
// >768px media query), so neither hydration nor the hero entrance jumps. The
// script only writes `--tilt-k` (a non-inherited registered property) on the
// three tilt elements, and `none` once flat, so the rest is the static design
// pixel for pixel. The robot form never gets the attributes.

import { easings, useSpring } from "@react-spring/web";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { usePreloaderStore } from "@/components/common/preloader/preloader-store";

import { useRobot } from "@/components/common/robot-view";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { smooth, useMedia, useScrollFrame } from "@/hooks/use-scroll-frame";

type Part = "area" | "end";

const PartsContext = createContext<((part: Part, el: HTMLElement | null) => void) | null>(null);

/** Offset of `el` from the top of the document, ignoring transforms on the way. */
export const docTop = (el: HTMLElement) => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
};

/** Whole block on screen at the top of the page (taller screens): its motion plays by itself once,
 *  after the preloader, instead of waiting for a scroll. */
export const visibleOnLoad = (el: HTMLElement) => docTop(el) + el.offsetHeight <= window.innerHeight;

/** Scroll at which `el`'s top reaches the bottom of the viewport — scrubbing starts there, not at 0. */
export const enterAt = (el: HTMLElement) => Math.max(0, docTop(el) - window.innerHeight);

/** The hero parallax holds the card back by this share of the scroll (see hero-section). */
const LAG = 0.15;

/** k on the element; once flat, `none` for its transform-like property (no stacking context left). */
const write = (el: HTMLElement, k: number, flat?: "transform" | "translate") => {
  el.style.setProperty("--tilt-k", String(k));
  if (!flat) return;
  if (k <= 0) el.style.setProperty(flat, "none");
  else el.style.removeProperty(flat);
};

export interface DashboardTiltProps {
  className?: string;
  /** Share of the scroll a parallax holds the card back by (0 when it scrolls with the page). */
  lag?: number;
  /** "scroll": flattens with the scroll, from when the card comes into view. "load" (pricing): flattens
   *  by itself on load, once the preloader has lifted. "auto" (home, company): "load" when the whole card
   *  is on screen at the top of the page, otherwise "scroll". */
  flatten?: "scroll" | "load" | "auto";
  children: ReactNode;
}

export const DashboardTilt = ({ className, lag = LAG, flatten: wanted = "auto", children }: DashboardTiltProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const parts = useRef(new Map<Part, HTMLElement>());
  const robot = useRobot();
  const motionOn = !useMotionOffMarkup();
  const active = motionOn;
  const last = useRef(-1);
  // "auto" resolves on mount, from where the card sits; until then the CSS start pose holds.
  const [flatten, setFlatten] = useState<"scroll" | "load" | null>(wanted === "auto" ? null : wanted);
  useEffect(() => {
    if (wanted !== "auto" || !ref.current) return;
    setFlatten(visibleOnLoad(ref.current) ? "load" : "scroll");
  }, [wanted]);

  const apply = (k: number) => {
    const card = ref.current;
    if (!card || k === last.current) return;
    last.current = k;
    write(card, k, "transform");
    const area = parts.current.get("area");
    const end = parts.current.get("end");
    if (area) write(area, k);
    if (end) write(end, k, "translate");
  };

  // "load": hold the tilt while the preloader covers the page, then settle flat by itself.
  const preloading = usePreloaderStore((st) => st.active);
  const [settle, setSettle] = useState(false);
  useEffect(() => {
    if (!active || flatten !== "load" || preloading || settle) return;
    const t = setTimeout(() => setSettle(true), 700);
    return () => clearTimeout(t);
  }, [active, flatten, preloading, settle]);
  useSpring({
    k: settle ? 0 : 1,
    pause: !active || flatten !== "load",
    config: { duration: 1400, easing: easings.easeInOutCubic },
    onChange: ({ value }: { value: { k: number } }) => apply(Math.round(value.k * 1e4) / 1e4),
  });

  useScrollFrame(
    ref,
    () => {
      const card = ref.current;
      if (!card) return;
      const vh = window.innerHeight;
      // From the moment the card shows at the bottom of the viewport to the scroll at which its
      // centre (held back by the parallax) meets the viewport middle.
      const from = enterAt(card);
      const flatAt = Math.max(from + vh * 0.25, (docTop(card) + card.offsetHeight / 2 - vh / 2) / (1 - lag));
      const k = Math.round((1 - smooth((Math.max(0, window.scrollY) - from) / (flatAt - from))) * 1e4) / 1e4;
      if (k === last.current) return;
      last.current = k;
      write(card, k, "transform");
      const area = parts.current.get("area");
      const end = parts.current.get("end");
      if (area) write(area, k);
      if (end) write(end, k, "translate");
    },
    { active: active && flatten === "scroll" },
  );

  useEffect(() => {
    const card = ref.current;
    const map = parts.current;
    return () => {
      last.current = -1;
      for (const el of [card, ...map.values()]) {
        if (!el) continue;
        for (const prop of ["--tilt-k", "transform", "opacity", "translate"]) el.style.removeProperty(prop);
      }
    };
  }, [active]);

  const register = (part: Part, el: HTMLElement | null) => {
    if (el) parts.current.set(part, el);
    else parts.current.delete(part);
  };

  return (
    <PartsContext.Provider value={register}>
      <div ref={ref} data-tilt={robot ? undefined : "card"} className={className}>
        {children}
      </div>
    </PartsContext.Provider>
  );
};

/** A layer inside the card that follows the tilt: `area` brightens, `end` glides in. */
export const TiltPart = ({ part, className, children }: { part: Part; className: string; children: ReactNode }) => {
  const register = useContext(PartsContext);
  const robot = useRobot();
  return (
    <div ref={(el) => register?.(part, el)} data-tilt={robot ? undefined : part} className={className}>
      {children}
    </div>
  );
};
