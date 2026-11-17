"use client";

// Cursor dot trail — on the light page background a soft blue trail of dots follows the cursor.
// Drop `<CursorDots />` as the first child of a page's `<main>` and give `<main>` `isolate`:
// the viewport-tall canvas sticks to the top of the viewport (sticky, with a -100vh margin
// so it takes no room; not `fixed` — OpenUp puts `perspective` on main, which would make
// main the containing block) at `-z-10` inside main's stacking context, so it paints
// over main's own `bg-page` but under every section — the cards, the hero and the dark
// blocks cover it, and the dots show only where the light page background does. Drawing is
// clipped to `<main>`'s on-screen box, so the dots never spill over the revealed footer.
//
// The trail: a dot grid (1.25rem pitch) where dots light up along the cursor's recent path —
// widest and strongest at the cursor, narrowing and fading toward the tail over 0.8s. A
// resting cursor leaves nothing behind once the tail has faded. Low contrast on purpose (dots
// at most ~40% opaque and small). Fine pointers above 1024px only; per-frame work runs on the
// shared ticker only while a trail is alive, then stops.
// Motion off / robot form: nothing.

import { useEffect, useRef } from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { createFrameClock, perFrame } from "@/lib/scene/per-frame";

/** Grid pitch, dot size and trail half-width at the cursor, in rem (they scale with the root). */
const PITCH = 1.25;
const DOT = 0.22;
const WIDTH = 3.5;
/** Strongest dot opacity — kept low so the trail stays a soft tint. */
const ALPHA = 0.4;
/** Trail: a point every TRAIL_STEP rem of travel, each fading over TRAIL_LIFE seconds. */
const TRAIL_LIFE = 0.8;
const TRAIL_STEP = 0.5;
const TRAIL_MAX = 140;
/** Head lag — the share of the gap to the pointer it closes per 60 Hz frame. */
const FOLLOW = 0.35;

export const CursorDots = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const motionOff = useMotionOffMarkup();

  useEffect(() => {
    const canvas = ref.current;
    const main = canvas?.closest("main");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !main || !ctx || motionOff) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)");

    let rem = 16;
    let dpr = 1;
    let color = "#2f74d0";
    const measure = () => {
      rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      color = getComputedStyle(document.documentElement).getPropertyValue("--accent-strong").trim() || color;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    measure();

    const pointer = { x: 0, y: 0, in: false };
    const head = { x: 0, y: 0 };
    // where the last trail point was laid — kept after the trail fades, so a resting cursor lays none
    const anchor = { x: 0, y: 0 };
    const trail: { x: number; y: number; t: number }[] = [];
    const clock = createFrameClock();
    let now = 0;
    let unsubscribe: (() => void) | null = null;

    const clear = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    const draw = (dt: number) => {
      const k = perFrame(FOLLOW, dt);
      head.x += (pointer.x - head.x) * k;
      head.y += (pointer.y - head.y) * k;

      // lay points along the head's path, evenly spaced, so a fast move leaves no gaps
      const step = TRAIL_STEP * rem;
      if (pointer.in) {
        const gap = Math.hypot(head.x - anchor.x, head.y - anchor.y);
        const n = Math.floor(gap / step);
        if (n > 0) {
          const sx = anchor.x;
          const sy = anchor.y;
          for (let i = 1; i <= n; i++) {
            const f = (i * step) / gap;
            trail.push({ x: sx + (head.x - sx) * f, y: sy + (head.y - sy) * f, t: now });
          }
          const tip = trail[trail.length - 1];
          anchor.x = tip.x;
          anchor.y = tip.y;
          while (trail.length > TRAIL_MAX) trail.shift();
        }
      }
      while (trail.length && now - trail[0].t > TRAIL_LIFE) trail.shift();

      clear();
      if (!trail.length) {
        if (!pointer.in || Math.hypot(pointer.x - head.x, pointer.y - head.y) < 0.5) {
          unsubscribe?.();
          unsubscribe = null;
        }
        return;
      }

      const W = WIDTH * rem;
      const pitch = PITCH * rem;
      const box = main.getBoundingClientRect();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const p of trail) {
        x0 = Math.min(x0, p.x - 2 * W);
        x1 = Math.max(x1, p.x + 2 * W);
        y0 = Math.min(y0, p.y - 2 * W);
        y1 = Math.max(y1, p.y + 2 * W);
      }
      x0 = Math.max(x0, box.left, 0);
      x1 = Math.min(x1, box.right, window.innerWidth);
      y0 = Math.max(y0, box.top, 0);
      y1 = Math.min(y1, box.bottom, window.innerHeight);
      if (x1 <= x0 || y1 <= y0) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      // drawing is in viewport coordinates; the sticky canvas may sit off the viewport top
      const at = canvas.getBoundingClientRect();
      ctx.translate(-at.left, -at.top);
      ctx.fillStyle = color;
      // The grid is pinned to the page, so the dots scroll with it.
      const ox = box.left;
      const oy = box.top;
      for (let gy = Math.ceil((y0 - oy) / pitch) * pitch + oy; gy <= y1; gy += pitch) {
        for (let gx = Math.ceil((x0 - ox) / pitch) * pitch + ox; gx <= x1; gx += pitch) {
          let v = 0;
          // newer points are wider and stronger: the trail tapers and fades toward its tail
          for (const p of trail) {
            const life = 1 - (now - p.t) / TRAIL_LIFE;
            const r = W * (0.3 + 0.7 * life);
            const d = Math.hypot(gx - p.x, gy - p.y);
            if (d > 2 * r) continue;
            v = Math.max(v, Math.pow(life, 1.3) * Math.exp(-((d / r) ** 2)));
          }
          if (v < 0.05) continue;
          ctx.globalAlpha = ALPHA * v;
          ctx.beginPath();
          ctx.arc(gx, gy, DOT * rem * (0.4 + 0.6 * v), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const run = () => {
      if (unsubscribe) return;
      clock.reset();
      unsubscribe = subscribeToTicker((time) => {
        const { dt } = clock.tick(time);
        now += dt;
        draw(dt);
      }, () => 0);
    };

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType !== "mouse") return;
      if (!pointer.in) {
        head.x = anchor.x = e.clientX;
        head.y = anchor.y = e.clientY;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.in = true;
      run();
    };
    const onLeave = () => {
      pointer.in = false;
    };
    const onResize = () => {
      measure();
      clear();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      unsubscribe?.();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      clear();
    };
  }, [motionOff]);

  if (motionOff) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none sticky top-0 -z-10 -mb-[100vh] block h-screen w-full" />;
};
