"use client";

// Instrument tiles (Figma 5628:6400 / 7126 / 7852): a 32 × 22 grid of 2px dots
// at 40% (the `-grid.svg` image) with the pixel picture drawn over it as 10px
// dots sitting on grid cells. On reveal the picture assembles out of the grid —
// each pixel grows from a grid dot into place, in its own order per tile: the
// bill traces round clockwise from twelve like a radar hand, the fund's pie
// spreads out from its centre in rings, and the overnight moon lights up dot by
// dot in a scattered twinkle, like stars.
// On card hover (fine pointers) a gentle ripple runs through the pixels from
// the cursor. Motion off: the finished picture.

import { animated, easings, to, useSpring } from "@react-spring/web";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { usePlayOnce } from "@/components/common/play-once";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";

import { instrumentPixels } from "./instrument-pixels";

export type InstrumentKind = keyof typeof instrumentPixels;

const W = 448;
const H = 308;
const PITCH = 14;
const ORIGIN = 7;
/** A grid dot's radius, a pixel's radius, the grid dots' opacity (Figma: 0.4). */
const DOT_R = 1;
const PIXEL_R = 5;
const DOT_OPACITY = 0.4;
/** Figma centres the funds and overnight pictures half a cell (7px) lower than the grid. */
const SHIFT_Y: Record<string, number> = { bills: 0, funds: 7, overnight: 7 };

/** Of the sweep's 0–1, how long one pixel takes to grow (the rest staggers the columns). */
const GROW = 0.4;
/** Ripple: how far (in cells) the wave travels, and how wide it is. */
const REACH = 26;
const WIDTH = 1.6;

/** The assembly runs at an even pace across the tile (a spring would front-load the sweep). */
const sweep = { duration: 1400, easing: easings.easeInOutCubic };

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Deterministic 0…1 noise per cell, so the twinkle is the same on every visit. */
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Each tile's assembly order: a 0…1 key per pixel (0 grows first). */
const order: Record<InstrumentKind, (c: number, r: number, cx: number, cy: number, i: number) => number> = {
  // clockwise from twelve o'clock
  bills: (c, r, cx, cy) => ((Math.atan2(c - cx, -(r - cy)) / (2 * Math.PI)) + 1) % 1,
  // out from the centre
  funds: (c, r, cx, cy) => Math.hypot(c - cx, r - cy),
  // scattered
  overnight: (c, r) => hash(c * 31 + r * 17),
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const art = "absolute h-77 w-112 max-w-none";

export interface InstrumentArtProps {
  kind: InstrumentKind;
}

export const InstrumentArt = ({ kind }: InstrumentArtProps) => {
  const cells = instrumentPixels[kind];
  const ref = useRef<SVGSVGElement>(null);
  const active = !useMotionOffMarkup();
  const play = usePlayOnce(ref, { active });

  // the picture's centre, and each pixel's place in this tile's assembly order, normalised
  const cx = cells.reduce((sum, [c]) => sum + c, 0) / cells.length;
  const cy = cells.reduce((sum, [, r]) => sum + r, 0) / cells.length;
  const keys = cells.map(([c, r], i) => order[kind](c, r, cx, cy, i));
  const lo = Math.min(...keys);
  const range = Math.max(1e-6, Math.max(...keys) - lo);

  const { a } = useSpring({ from: { a: 0 }, a: play ? 1 : 0, immediate: !play, delay: play ? 250 : 0, config: sweep });
  // w: the ripple's 0–1 run; oc / or: the cell it starts from.
  const [{ w, oc, or }, ripple] = useSpring(() => ({ w: 1, oc: 0, or: 0 }));

  // Ripple from the cursor when a fine pointer enters the card, again after it has run its course.
  useEffect(() => {
    const svg = ref.current;
    const card = svg?.closest("article");
    if (!active || !svg || !card || !window.matchMedia("(hover: hover) and (min-width: 1025px)").matches) return;
    let last = 0;
    const fire = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 1100) return;
      last = now;
      const box = svg.getBoundingClientRect();
      ripple.set({
        oc: (((e.clientX - box.left) / box.width) * W - ORIGIN) / PITCH,
        or: (((e.clientY - box.top) / box.height) * H - ORIGIN - SHIFT_Y[kind]) / PITCH,
      });
      ripple.start({ from: { w: 0 }, to: { w: 1 }, config: { tension: 40, friction: 18 } });
    };
    card.addEventListener("mouseenter", fire);
    card.addEventListener("mousemove", fire);
    return () => {
      card.removeEventListener("mouseenter", fire);
      card.removeEventListener("mousemove", fire);
    };
  }, [active, kind, ripple]);

  return (
    <>
      <Image src={`/assets/instruments/instrument-${kind}-grid.svg`} alt="" width={W} height={H} className={art} />
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} aria-hidden className={art} fill="white">
        {cells.map(([c, r], i) => {
          const px = ORIGIN + c * PITCH;
          const py = ORIGIN + r * PITCH + SHIFT_Y[kind];
          if (!active) return <circle key={`${c}-${r}`} cx={px} cy={py} r={PIXEL_R} />;
          const start = ((keys[i] - lo) / range) * (1 - GROW);
          const grow = (v: number) => smooth(clamp01((v - start) / GROW));
          return (
            <animated.circle
              key={`${c}-${r}`}
              cx={px}
              cy={py}
              r={to([a, w, oc, or], (av, wv, oc0, or0) => {
                const base = DOT_R + (PIXEL_R - DOT_R) * grow(av);
                if (wv >= 1) return base;
                const d = Math.hypot(c - oc0, r - or0);
                const bump = Math.exp(-((d - wv * REACH) ** 2) / (2 * WIDTH * WIDTH)) * (1 - wv);
                return base * (1 - 0.38 * bump);
              })}
              fillOpacity={a.to((av) => DOT_OPACITY + (1 - DOT_OPACITY) * grow(av))}
            />
          );
        })}
      </svg>
    </>
  );
};
