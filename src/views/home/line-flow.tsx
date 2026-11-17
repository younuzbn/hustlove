"use client";

// Line flow: a ribbon of hair-thin blue strands sweeping along a curved spine across a dark
// block — the T+1 card and the Getting started block. The spine is a smooth spline through
// the given points; the ribbon widens along it and twists (`twist` half-turns), so strands
// cross and part like silk; each strand also ripples on its own. Strands add up where they
// overlap (`lighter`) at even strength end to end (no fades at the block's edges), a few light
// pulses run along it and soft specks drift beside it.
// Colours are the site's chart blues read from the tokens. Drawn under the block's copy.
//
// It keeps off the copy by placement alone: the block's text lines are measured (a Range, so
// tight to the glyphs) and the whole ribbon slides sideways (`avoid`) until its widest reach
// clears every line beside it — nothing is cut out of it. Re-measured on resize and now and
// then while running (count-ups, fonts) — but not while the block is still tilting in
// (OpenUp) or its copy rising, when the measures jump; the slide eases to a new value instead
// of snapping, so the ribbon never twitches sideways while the page scrolls.
//
// `reveal` ("down" from the spine's start, "up" from its end): the ribbon draws itself in with
// the scroll as a front at 80% of the viewport passes down its span (soft lag, recedes on
// scroll-up). The growing tip is neither cut nor dimmed to nothing: the strands narrow a little,
// thin out to half-transparent over the last stretch (never to dark), and each strand leads or
// trails the others, so the end is light and wispy. Fully drawn once the front has passed — the
// spine must run downward.
//
// Drop it inside the positioned block (it fills it, `absolute inset-0`) before the copy.
// Per-frame work runs on the shared ticker, scaled by dt, only while it is on screen.
// Motion off: one still frame, fully drawn. Robot form: nothing.

import { useEffect, useRef } from "react";

import { useRobot } from "@/components/common/robot-view";
import { useMotionOff } from "@/hooks/use-motion-off";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { createFrameClock, perFrame } from "@/lib/scene/per-frame";

/** A spine point from the block's top-left: `[share of width, + rem, share of height, + rem]`. */
export type SpinePoint = readonly [number, number, number, number];

export interface LineFlowProps {
  /** Points the ribbon's spine passes through, in order (a Catmull-Rom spline, two or more). */
  spine: readonly SpinePoint[];
  /** How many half-turns the ribbon twists along the spine. */
  twist?: number;
  /** Spreads the twist's crossings along the ribbon (0: every strand crosses at one knot;
   *  ~1: each strand crosses at its own place, a soft silk-like twist). */
  fan?: number;
  /** Ribbon width at the start and the end of the spine, in shares of the block width or rem. */
  spread: { from: number; to: number; unit: "w" | "rem" };
  /** Which way the ribbon slides to keep clear of the copy. */
  avoid: "left" | "right";
  /** Draw the ribbon in with the scroll: from the spine's start down, or from its end up. */
  reveal?: "down" | "up";
  strands?: number;
  className?: string;
}

/** Samples per spine segment — longer spines get more. */
const PER_SEGMENT = 28;
const PULSES = 3;
const SPECKS = 14;
/** The reveal front sits this far down the viewport; it follows the scroll with this lag. */
const REVEAL_LINE = 0.8;
const REVEAL_FOLLOW = 0.08;
/** The drawing tip, in shares of the spine: where strands narrow, thin out, and lead/trail. */
const TIP_GATHER = 0.14;
/** How narrow the ribbon gets at the tip (share of its width) and how faint (share of alpha). */
const TIP_WIDTH = 0.7;
const TIP_FADE = 0.18;
const TIP_ALPHA = 0.45;
const TIP_STAGGER = 0.16;

/** Deterministic 0…1 noise per index, so the layout is the same on every visit. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** `#rrggbb` → `rgb(r g b / a)` — the tip fades a token colour to part-transparent. */
const withAlpha = (hex: string, a: number) => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  return `rgb(${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)} / ${a})`;
};
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

export const LineFlow = ({
  spine,
  spread,
  avoid,
  reveal,
  twist = 0.83,
  fan = 0,
  strands: count = 30,
  className = "",
}: LineFlowProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const robot = useRobot();
  const motionOff = useMotionOff();

  useEffect(() => {
    const target = ref.current;
    if (!target || robot) return;
    // Set up (layout, style reads, the first frame, observers) only once the
    // canvas is within a screen of the viewport — pass 1, 2026-11-12, TBT: both
    // ribbons sit below the first screen, and building them at hydration was
    // ~50 ms of the page's one long task on a 4× phone. A screen ahead, the
    // first frame is drawn before it can be seen.
    let teardown: (() => void) | undefined;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || teardown) return;
        near.disconnect();
        teardown = setup();
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(target);
    return () => {
      near.disconnect();
      teardown?.();
    };

    function setup(): () => void {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      // the positioned block the canvas fills — its copy is what the ribbon keeps off
      const block = canvas?.offsetParent ?? canvas?.parentElement;
      if (!canvas || !ctx || !block) return () => {};

      let w = 0;
      let h = 0;
      let rem = 16;
      let dpr = 1;
      let clockNow = 0;
      let shiftX = 0;
      // where the slide is heading; `shiftX` eases toward it (snaps on a resize)
      let shiftTo = 0;
      // The spine points in px: x0 y0 x1 y1 …
      const n = spine.length;
      const P = new Float32Array(n * 2);
      const SAMPLES = Math.max(56, (n - 1) * PER_SEGMENT);
      const fallback = ["#bfd6f6", "#8dbaf0", "#5c9be6"];
      const css = getComputedStyle(document.documentElement);
      const colors = ["--chart-200", "--chart-300", "--chart-400"].map(
        (v, i) => css.getPropertyValue(v).trim() || fallback[i],
      );

      /** The spine at t (0…1): a uniform Catmull-Rom spline through the points, ends extrapolated. */
      const at = (t: number, i: 0 | 1) => {
        const f = clamp01(t) * (n - 1);
        const seg = Math.min(n - 2, Math.floor(f));
        const u = f - seg;
        const p1 = P[seg * 2 + i];
        const p2 = P[(seg + 1) * 2 + i];
        const p0 = seg > 0 ? P[(seg - 1) * 2 + i] : 2 * p1 - p2;
        const p3 = seg < n - 2 ? P[(seg + 2) * 2 + i] : 2 * p2 - p1;
        return (
          0.5 *
          (2 * p1 +
            (p2 - p0) * u +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u +
            (3 * p1 - p0 - 3 * p2 + p3) * u * u * u)
        );
      };
      /** The t where the (downward) spine reaches y. */
      const tAtY = (y: number) => {
        let lo = 0;
        let hi = 1;
        for (let k = 0; k < 20; k++) {
          const mid = (lo + hi) / 2;
          if (at(mid, 1) < y) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };
      const width = (t: number) =>
        (spread.from + (spread.to - spread.from) * t) *
        (spread.unit === "w" ? w : rem);
      const rippleOf = (t: number) => (0.35 + 0.55 * t) * rem;

      // Each strand: its place across the ribbon, colour, strength, ripple phase and how far it
      // leads (+) or trails (−) the others at the drawing tip.
      const strands = Array.from({ length: count }, (_, j) => ({
        u: j / (count - 1) - 0.5,
        color: j % 7 === 3 ? 0 : j % 3 === 0 ? 1 : 2,
        alpha: j % 7 === 3 ? 0.85 : 0.24 + 0.24 * hash(j),
        phase: hash(j + 50) * Math.PI * 2,
        width: j % 7 === 3 ? 1.1 : 0.8,
        lead: (hash(j + 800) - 0.5) * TIP_STAGGER,
      }));
      const pulses = Array.from({ length: PULSES }, (_, k) => ({
        strand: Math.floor(((k + 0.5) * count) / PULSES),
        p: hash(k + 90),
        speed: 0.22 + 0.08 * hash(k + 9),
      }));
      const specks = Array.from({ length: SPECKS }, (_, k) => ({
        t: hash(k + 200),
        off: (hash(k + 300) - 0.5) * 1.6,
        r: 0.8 + 2.4 * hash(k + 400),
        a: 0.16 + 0.26 * hash(k + 500),
        speed: 0.02 + 0.03 * hash(k + 600),
        tw: hash(k + 700) * Math.PI * 2,
      }));

      const pts = new Float32Array(SAMPLES * 2);

      /** Slide the ribbon until its widest reach (full twist, peak ripple) clears the copy. */
      const place = () => {
        // on-screen rects → the block's own px (it may still be mid open-up: scaled and tilted)
        const origin = canvas.getBoundingClientRect();
        const kx = origin.width ? w / origin.width : 1;
        const ky = origin.height ? h / origin.height : 1;
        const lines: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        }[] = [];
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            if (!r.width || !r.height) continue;
            lines.push({
              top: (r.top - origin.top) * ky,
              bottom: (r.bottom - origin.top) * ky,
              left: (r.left - origin.left) * kx,
              right: (r.right - origin.left) * kx,
            });
          }
        }
        const gap = 1.5 * rem;
        let need = 0;
        for (let k = 0; k <= SAMPLES; k++) {
          const t = k / SAMPLES;
          const x = at(t, 0);
          const y = at(t, 1);
          const reach = width(t) / 2 + rippleOf(t);
          for (const l of lines) {
            if (y + reach < l.top || y - reach > l.bottom) continue;
            // only the copy on the side the ribbon would have to cross
            if (avoid === "right" && l.left < x)
              need = Math.max(need, l.right + gap - (x - reach));
            if (avoid === "left" && l.right > x)
              need = Math.max(need, x + reach - (l.left - gap));
          }
        }
        shiftTo = avoid === "right" ? need : -need;
      };

      /** The spine in px and the ribbon's sideways slide — no canvas resize. */
      const refresh = (snap = false) => {
        rem = parseFloat(css.fontSize) || 16;
        spine.forEach(([sx, rx, sy, ry], i) => {
          P[i * 2] = sx * w + rx * rem;
          P[i * 2 + 1] = sy * h + ry * rem;
        });
        // a tilting block (OpenUp writes `rotate` on it) or copy mid-reveal reads wrong: keep the
        // last slide unless this is a resize
        if (snap || !(block instanceof HTMLElement && block.style.rotate))
          place();
        if (snap) shiftX = shiftTo;
      };

      const layout = () => {
        // layout size, not the on-screen box — a block mid open-up is scaled and tilted
        w = canvas.offsetWidth;
        h = canvas.offsetHeight;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        refresh(true);
      };

      // Reveal state: the front (block px, down from its top) → how much of the spine is drawn.
      let front = Number.NaN;
      let progress = 1;
      let edge = reveal === "up" ? 1 : 0;
      const advance = (dt: number) => {
        progress = 1;
        if (!reveal || motionOff) return;
        const box = canvas.getBoundingClientRect();
        const target =
          (window.innerHeight * REVEAL_LINE - box.top) *
          (box.height ? h / box.height : 1);
        front = Number.isNaN(front)
          ? target
          : front + (target - front) * perFrame(REVEAL_FOLLOW, dt);
        const y0 = at(0, 1);
        const y1 = at(1, 1);
        progress = y1 > y0 ? clamp01((front - y0) / (y1 - y0)) : 1;
        // the tip, in spine t: drawn from the start down, or from the end up
        edge =
          reveal === "down"
            ? tAtY(y0 + progress * (y1 - y0))
            : tAtY(y1 - progress * (y1 - y0));
      };
      /** The part of the spine a strand shows now, and whether it ends in a drawing tip. */
      // How much the drawing tip shows (0…1): it eases away over the last 15% of the reveal, so
      // the ribbon settles into its finished look instead of snapping to it.
      let tipK = 0;
      const span = (lead: number) => {
        tipK = reveal ? smooth((1 - progress) / 0.15) : 0;
        if (!reveal || progress >= 1) return { a: 0, b: 1, tip: false };
        // the stagger fades out as the ribbon completes, so it lands whole
        const off = lead * (1 - progress);
        return reveal === "down"
          ? { a: 0, b: clamp01(edge + off), tip: true }
          : { a: clamp01(edge - off), b: 1, tip: true };
      };

      /** A strand's points between spine t `a` and `b` at time `now`, gathered toward a tip. */
      const trace = (
        s: (typeof strands)[number],
        now: number,
        a: number,
        b: number,
        tip: boolean,
      ) => {
        for (let k = 0; k < SAMPLES; k++) {
          const t = a + ((b - a) * k) / (SAMPLES - 1);
          const x = at(t, 0) + shiftX;
          const y = at(t, 1);
          // spine normal from the tangent
          const d = 0.001;
          const tx = at(Math.min(1, t + d), 0) - at(Math.max(0, t - d), 0);
          const ty = at(Math.min(1, t + d), 1) - at(Math.max(0, t - d), 1);
          const len = Math.hypot(tx, ty) || 1;
          // the ribbon widens along the spine and twists; each strand ripples on its own
          const turn = Math.cos(
            t * twist * Math.PI - now * 0.35 + s.u * fan * Math.PI,
          );
          const ripple = rippleOf(t) * Math.sin(t * 7 + now * 0.9 + s.phase);
          // at a drawing tip the ribbon narrows a little
          const gather = tip
            ? 1 -
              (1 - TIP_WIDTH) *
                tipK *
                (1 - smooth((reveal === "down" ? b - t : t - a) / TIP_GATHER))
            : 1;
          const off = (width(t) * s.u * turn + ripple) * gather;
          pts[k * 2] = x + (-ty / len) * off;
          pts[k * 2 + 1] = y + (tx / len) * off;
        }
      };

      /** The stroke for a strand: plain, or thinning to half-transparent over the last stretch. */
      const paint = (color: string, a: number, b: number, tip: boolean) => {
        if (!tip) return color;
        const f = Math.min(1, TIP_FADE / Math.max(b - a, 1e-4));
        const last = SAMPLES - 1;
        const k = Math.round((reveal === "down" ? 1 - f : f) * last);
        const [from, to] = reveal === "down" ? [k, last] : [k, 0];
        const g = ctx.createLinearGradient(
          pts[from * 2],
          pts[from * 2 + 1],
          pts[to * 2],
          pts[to * 2 + 1],
        );
        g.addColorStop(0, color);
        g.addColorStop(1, withAlpha(color, 1 - (1 - TIP_ALPHA) * tipK));
        return g;
      };

      const stroke = (from = 0, to = SAMPLES - 1) => {
        ctx.beginPath();
        ctx.moveTo(pts[from * 2], pts[from * 2 + 1]);
        for (let k = from + 1; k <= to; k++) {
          const mx = (pts[(k - 1) * 2] + pts[k * 2]) / 2;
          const my = (pts[(k - 1) * 2 + 1] + pts[k * 2 + 1]) / 2;
          ctx.quadraticCurveTo(pts[(k - 1) * 2], pts[(k - 1) * 2 + 1], mx, my);
        }
        ctx.lineTo(pts[to * 2], pts[to * 2 + 1]);
        ctx.stroke();
      };

      const draw = (now: number, dt: number) => {
        advance(dt);
        shiftX += (shiftTo - shiftX) * perFrame(0.06, dt);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (progress <= 0) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";

        for (const s of strands) {
          const { a, b, tip } = span(s.lead);
          if (b - a < 0.004) continue;
          trace(s, now, a, b, tip);
          ctx.strokeStyle = paint(colors[s.color], a, b, tip);
          // a soft glow under the brighter strands
          if (s.color === 0) {
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 5;
            stroke();
          }
          ctx.globalAlpha = s.alpha;
          ctx.lineWidth = s.width;
          stroke();
        }

        // light pulses running along a few strands (over what is drawn)
        ctx.lineWidth = 1.5;
        for (const p of pulses) {
          p.p = (p.p + p.speed * dt) % 1.25;
          const s = strands[p.strand];
          const { a, b, tip } = span(s.lead);
          if (b - a < 0.05) continue;
          trace(s, now, a, b, tip);
          ctx.strokeStyle = paint(colors[0], a, b, tip);
          const head = Math.round(p.p * (SAMPLES - 1));
          for (let k = 1; k <= 8; k++) {
            const lo = head - k;
            const hi = head - k + 1;
            if (hi < 1 || lo > SAMPLES - 2) continue;
            ctx.globalAlpha = 0.6 * (1 - k / 9);
            stroke(Math.max(0, lo), Math.min(SAMPLES - 1, hi));
          }
        }

        // soft specks drifting beside what is drawn
        ctx.fillStyle = colors[1];
        for (const sp of specks) {
          sp.t = (sp.t + sp.speed * dt) % 1;
          const t = sp.t;
          if (
            reveal &&
            progress < 1 &&
            (reveal === "down" ? t > edge : t < edge)
          )
            continue;
          const x = at(t, 0) + shiftX + sp.off * width(t) * 0.5;
          const y = at(t, 1);
          const fade = Math.min(1, t / 0.15, (1 - t) / 0.15);
          ctx.globalAlpha =
            sp.a * fade * (0.6 + 0.4 * Math.sin(now * 1.3 + sp.tw));
          ctx.beginPath();
          ctx.arc(x, y, sp.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      };

      layout();
      draw(0, 0);
      const ro = new ResizeObserver(() => {
        layout();
        draw(clockNow, 0);
      });
      ro.observe(canvas);

      if (motionOff) return () => ro.disconnect();

      const clock = createFrameClock();
      let frames = 0;
      let unsubscribe: (() => void) | null = null;
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !unsubscribe) {
          clock.reset();
          unsubscribe = subscribeToTicker(
            (time) => {
              const { dt } = clock.tick(time);
              clockNow += dt;
              // count-ups and fonts can still move the copy for a while: re-place now and then
              if (++frames % 90 === 0) refresh();
              draw(clockNow, dt);
            },
            () => 0,
          );
        } else if (!entry.isIntersecting && unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      });
      io.observe(canvas);
      return () => {
        unsubscribe?.();
        io.disconnect();
        ro.disconnect();
      };
    }
  }, [robot, motionOff, spine, spread, avoid, reveal, twist, fan, count]);

  if (robot) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
    />
  );
};
