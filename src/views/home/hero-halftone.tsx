"use client";

// Hero halftone (Figma "Hero dots" 6110:173 / 6110:6272). The static SVG per breakpoint is
// what the server, robots and reduced motion get. With motion on (any device), a canvas
// redraws the same dots over it and they move:
// - a slow, barely-there shimmer drifts across the field, and waves pulse out from behind
//   the headline in slightly wobbly rings — the dots swell and brighten as a crest passes;
// - under the cursor (fine pointers only) the dots swell, brighten and part a little, the
//   nearest turn lime;
// - a click or tap on the hero background sends a ripple through the field, its crest lime.
// Per-frame work goes through the shared ticker, only while the hero is on screen.

import Image from "next/image";
import { useEffect, useRef } from "react";

import { useMotionOff } from "@/hooks/use-motion-off";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { createFrameClock, perFrame } from "@/lib/scene/per-frame";

import { HeroParallax } from "./hero-parallax";

export interface HalftoneVariant {
  src: string;
  width: number;
  height: number;
  className: string;
}

interface Dots {
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
  o: Float32Array;
  /** How far (SVG units) the ring's continuation reaches past each side of the frame. */
  reach: number;
}

const cache = new Map<string, Promise<Dots>>();

/**
 * The frame cuts the ring at its side edges, which shows on screens wider than the frame
 * (>1920, where the root stops growing). The ring's outer slope mirrors its inner one about
 * the row's crest (the SVG is symmetric that way to a rounding step), so every row the edge
 * cuts goes on outward — inner values read back in mirror order — until it fades out.
 */
const continueRing = (x: number[], y: number[], r: number[], o: number[]) => {
  const rows = new Map<number, number[]>();
  y.forEach((v, i) => rows.set(v, [...(rows.get(v) ?? []), i]));
  const minX = Math.min(...x);
  const maxX = Math.max(...x);
  const mid = (minX + maxX) / 2;
  let step = Infinity;
  for (const row of rows.values()) {
    row.sort((a, b) => x[a] - x[b]);
    for (let j = 1; j < row.length; j++) step = Math.min(step, x[row[j]] - x[row[j - 1]] || Infinity);
  }
  let reach = 0;
  for (const [rowY, row] of rows) {
    for (const side of [-1, 1]) {
      const half = row.filter((i) => (x[i] - mid) * side > 0);
      const edge = side < 0 ? minX : maxX;
      const outer = side < 0 ? half[0] : half[half.length - 1];
      // a row that fades out before the edge isn't cut
      if (outer === undefined || Math.abs(x[outer] - edge) > step / 2) continue;
      const top = Math.max(...half.map((i) => r[i]));
      const crestDots = half.filter((i) => r[i] > top - 0.01);
      const crest = crestDots.reduce((s, i) => s + x[i], 0) / crestDots.length;
      for (let px = edge + side * step; ; px += side * step) {
        const mirror = 2 * crest - px;
        const src = half.find((i) => Math.abs(x[i] - mirror) <= step / 2);
        if (src === undefined) break;
        x.push(px);
        y.push(rowY);
        r.push(r[src]);
        o.push(o[src]);
        reach = Math.max(reach, Math.abs(px - edge) + step);
      }
    }
  }
  return reach;
};

/** The dots straight from the SVG the page already shows — one source of truth. */
const loadDots = (src: string) => {
  let p = cache.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => r.text())
      .then((svg) => {
        const found = [...svg.matchAll(/cx="([\d.]+)" cy="([\d.-]+)" r="([\d.]+)" fill-opacity="([\d.]+)"/g)];
        const x = found.map((m) => +m[1]);
        const y = found.map((m) => +m[2]);
        const r = found.map((m) => +m[3]);
        const o = found.map((m) => +m[4]);
        const reach = continueRing(x, y, r, o);
        return {
          x: Float32Array.from(x),
          y: Float32Array.from(y),
          r: Float32Array.from(r),
          o: Float32Array.from(o),
          reach,
        };
      });
    cache.set(src, p);
  }
  return p;
};

/** Lens radius, ripple speed and width — in SVG units (≈ px of the 1440/1024/768 frames). */
const LENS = 130;
const RIPPLE_SPEED = 520;
const RIPPLE_WIDTH = 36;
const RIPPLE_LIFE = 1.5;
const LIME = "#ddf545";
/** Idle pulse: rings leave the wave centre (share of the frame) every SPACING / SPEED seconds. */
const PULSE_CENTER_Y = 0.52;
const PULSE_SPEED = 150;
const PULSE_SPACING = 280;
const PULSE_FALLOFF = 1100;

export const HeroHalftone = ({ variants }: { variants: HalftoneVariant[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionOff = useMotionOff();

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    if (!canvas || !section || motionOff) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let alive = true;
    let dots: Dots | null = null;
    let img: HTMLImageElement | null = null;
    let sx = 1;
    let sy = 1;
    let cx = 0;
    let cy = 0;
    // the ring's continuation drawn past each side, SVG units; the frame spans [-margin, vw + margin]
    let margin = 0;
    let xMax = 0;
    let scale = new Float32Array(0);
    let boost = new Float32Array(0);
    let lime = new Float32Array(0);
    let pushX = new Float32Array(0);
    let pushY = new Float32Array(0);
    let pointer: { x: number; y: number } | null = null;
    const ripples: { x: number; y: number; t: number }[] = [];
    const clock = createFrameClock();
    let now = 0;

    const imgs = [...section.querySelectorAll<HTMLImageElement>("img[data-halftone]")];

    const layout = async () => {
      const visible = imgs.find((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none") ?? null;
      if (img && img !== visible) img.style.removeProperty("opacity");
      img = visible;
      if (!visible) {
        dots = null;
        canvas.style.display = "none";
        return;
      }
      const src = visible.dataset.halftone ?? "";
      const vw = Number(visible.dataset.w);
      const vh = Number(visible.dataset.h);
      const loaded = await loadDots(src);
      if (!alive || img !== visible) return;
      dots = loaded;
      const n = loaded.x.length;
      if (scale.length !== n) {
        scale = new Float32Array(n).fill(1);
        boost = new Float32Array(n);
        lime = new Float32Array(n);
        pushX = new Float32Array(n);
        pushY = new Float32Array(n);
      }
      const w = visible.offsetWidth;
      const h = visible.offsetHeight;
      sx = w / vw;
      sy = h / vh;
      cx = vw / 2;
      cy = vh * PULSE_CENTER_Y;
      // only as much of the continuation as the screen has room for beside the frame
      margin = Math.min(loaded.reach, Math.max(0, visible.offsetLeft) / sx);
      xMax = vw + margin;
      const cw = w + 2 * margin * sx;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      Object.assign(canvas.style, {
        display: "block",
        left: `${visible.offsetLeft - margin * sx}px`,
        top: `${visible.offsetTop}px`,
        width: `${cw}px`,
        height: `${h}px`,
      });
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr * sx, 0, 0, dpr * sy, dpr * margin * sx, 0);
      draw(0);
      visible.style.opacity = "0";
    };

    const draw = (dt: number) => {
      if (!dots) return;
      const { x, y, r, o } = dots;
      const k = perFrame(0.16, dt);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t > RIPPLE_LIFE) ripples.splice(i, 1);
      for (let i = 0; i < x.length; i++) {
        if (x[i] < -margin || x[i] > xMax) continue;
        // idle shimmer: a slow diagonal swell of ±10% opacity
        const shimmer = 0.9 + 0.1 * Math.sin(now * 0.8 - x[i] * 0.006 - y[i] * 0.004);
        let tScale = 1;
        let tBoost = 0;
        {
          // Waves pulse out from behind the headline: concentric rings travel outward, their
          // front wobbles with the angle (so no ring is a perfect circle), a softer echo
          // trails each crest, and the pulse fades as it spreads.
          const dx = x[i] - cx;
          const dy = y[i] - cy;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const wobble = 16 * Math.sin(angle * 3 + now * 0.6) + 9 * Math.sin(angle * 5 - now * 0.9);
          const phase = ((dist + wobble - now * PULSE_SPEED) / PULSE_SPACING) * Math.PI * 2;
          const crest = Math.pow((Math.cos(phase) + 1) / 2, 10);
          const echo = Math.pow((Math.cos(phase + 0.9) + 1) / 2, 14);
          const fade = Math.max(0, 1 - dist / PULSE_FALLOFF);
          const b = Math.min(1, (crest + 0.4 * echo) * (0.35 + 0.65 * fade));
          tScale += 0.9 * b;
          tBoost += 0.4 * b;
        }
        let tLime = 0;
        let tx = 0;
        let ty = 0;
        if (pointer) {
          const dx = x[i] - pointer.x;
          const dy = y[i] - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < LENS * 2) {
            const f = Math.exp(-((d / LENS) ** 2));
            tScale += 1.1 * f;
            tBoost += 0.4 * f;
            tLime = f > 0.72 ? (f - 0.72) / 0.28 : 0;
            const push = (7 * f) / Math.max(d, 1);
            tx = dx * push;
            ty = dy * push;
          }
        }
        for (const rp of ripples) {
          const age = now - rp.t;
          const d = Math.hypot(x[i] - rp.x, y[i] - rp.y);
          const band = Math.exp(-(((d - age * RIPPLE_SPEED) / RIPPLE_WIDTH) ** 2)) * (1 - age / RIPPLE_LIFE);
          tScale += 1.3 * band;
          tBoost += 0.5 * band;
          if (band > 0.6) tLime = Math.max(tLime, (band - 0.6) / 0.4);
        }
        scale[i] += (tScale - scale[i]) * k;
        boost[i] += (tBoost - boost[i]) * k;
        lime[i] += (tLime - lime[i]) * k;
        pushX[i] += (tx - pushX[i]) * k;
        pushY[i] += (ty - pushY[i]) * k;
        const a = Math.min(1, o[i] * shimmer + boost[i] * Math.max(o[i] * 2.2, 0.25));
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = lime[i] > 0.5 ? LIME : "#fff";
        ctx.beginPath();
        ctx.arc(x[i] + pushX[i], y[i] + pushY[i], r[i] * scale[i], 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / sx - margin, y: (e.clientY - rect.top) / sy };
    };
    const onMove = (e: PointerEvent) => {
      pointer = toLocal(e);
    };
    const onLeave = () => {
      pointer = null;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, input")) return;
      ripples.push({ ...toLocal(e), t: now });
    };
    if (fine) {
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
    }
    section.addEventListener("pointerdown", onDown);

    let unsubscribe: (() => void) | null = null;
    const run = (on: boolean) => {
      if (on && !unsubscribe) {
        clock.reset();
        unsubscribe = subscribeToTicker((time) => {
          const { dt, t } = clock.tick(time);
          now = t;
          draw(dt);
        }, () => 0);
      } else if (!on && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
    const io = new IntersectionObserver(([entry]) => run(entry.isIntersecting));
    io.observe(section);
    const ro = new ResizeObserver(() => void layout());
    ro.observe(section);
    // The canvas copies the image's offsetLeft: on screens wider than 1440 a window resize moves the
    // centred image without resizing it, which the observer may not report — re-place on resize too.
    const onResize = () => void layout();
    window.addEventListener("resize", onResize);
    void layout();

    return () => {
      alive = false;
      run(false);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      img?.style.removeProperty("opacity");
      canvas.style.display = "none";
    };
  }, [motionOff]);

  // The dots lag the scroll (hero parallax, 0.35×) inside a hero-sized clip, so they never sink
  // below the hero. The canvas moves with its image, and `toLocal` reads the canvas' on-screen
  // rect — the translate is already in it, so the lens and ripples still land under the cursor.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <HeroParallax lag={0.35} className="absolute inset-0">
        {variants.map((v) => (
          <Image
            key={v.src}
            src={v.src}
            alt=""
            width={v.width}
            height={v.height}
            loading="eager"
            data-halftone={v.src}
            data-w={v.width}
            data-h={v.height}
            className={v.className}
          />
        ))}
        <canvas ref={canvasRef} className="pointer-events-none absolute hidden" />
      </HeroParallax>
    </div>
  );
};
