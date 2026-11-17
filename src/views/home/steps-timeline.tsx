"use client";

// Getting started timeline, scroll-linked and eased all the way: "the front"
// is where the viewport centre crosses the track, damped per frame (dt-scaled,
// so Lenis' steps and the frame rate don't show). The connector draws down to
// the front, each step tile crossfades to lime over ~0.6 of a row around its
// centre, and the translucent plate glides between rows — its y and height
// interpolate (smoothstep) from one row to the next as the front runs from one
// tile centre to the next, so it settles on each row without snapping. The
// same at 390 (the stacked list). Per-frame work runs through the shared
// ticker only while the track is near the viewport; geometry is measured on
// resize, not per frame. Motion off: the static line and tiles (only 01 lime).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { clamp01, smooth, useScrollFrame } from "@/hooks/use-scroll-frame";
import { damp } from "@/lib/scene/per-frame";

/** `front` in px from the track's top; `version` changes whenever the layout was re-measured. */
type Listener = (front: number, ol: HTMLElement, version: number) => void;

interface TrackValue {
  active: boolean;
  subscribe: (fn: Listener) => () => void;
}

const TrackContext = createContext<TrackValue>({ active: false, subscribe: () => () => {} });

/** Damping rate of the front, 1/s — calm, catches up in ~0.3s. */
const FOLLOW = 12;

/** Offset of `el`'s box from `ol`'s top, in px, ignoring transforms on the way. */
const offsetIn = (el: HTMLElement, ol: HTMLElement) => {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ol) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
};

/** The timeline `<ol>`: tracks where the viewport centre crosses it ("the front"). */
export const StepsTrack = ({ className, children }: { className: string; children: ReactNode }) => {
  const active = !useMotionOffMarkup();
  const ref = useRef<HTMLOListElement>(null);
  const listeners = useRef(new Set<Listener>());
  const front = useRef(-1);
  const version = useRef(0);

  const emit = useCallback(() => {
    const ol = ref.current;
    if (!ol || front.current < 0) return;
    for (const fn of listeners.current) fn(front.current, ol, version.current);
  }, []);

  const subscribe = useCallback(
    (fn: Listener) => {
      listeners.current.add(fn);
      const ol = ref.current;
      if (ol && front.current >= 0) fn(front.current, ol, version.current);
      return () => {
        listeners.current.delete(fn);
      };
    },
    [],
  );

  const value = useMemo(() => ({ active, subscribe }), [active, subscribe]);

  // Layout changes (resize, fonts) → everyone re-measures.
  useEffect(() => {
    const ol = ref.current;
    if (!active || !ol) return;
    const ro = new ResizeObserver(() => {
      version.current += 1;
      emit();
    });
    ro.observe(ol);
    return () => ro.disconnect();
  }, [active, emit]);

  useScrollFrame(
    ref,
    (dt) => {
      const ol = ref.current;
      if (!ol) return;
      const target = Math.min(ol.offsetHeight, Math.max(0, window.innerHeight / 2 - ol.getBoundingClientRect().top));
      // First frame (or a snap when the track leaves the viewport): jump; otherwise follow.
      const next = front.current < 0 || dt === 0 ? target : damp(front.current, target, FOLLOW, dt);
      const settled = Math.abs(next - target) < 0.05 ? target : next;
      if (settled === front.current) return;
      front.current = settled;
      emit();
    },
    { active },
  );

  return (
    <ol ref={ref} className={className}>
      <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
    </ol>
  );
};

/** A connector line, drawn down to the front. */
export const StepsLine = ({ className }: { className: string }) => {
  const { active, subscribe } = useContext(TrackContext);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    el.style.transformOrigin = "50% 0%";
    el.style.transform = "scaleY(0)";
    let prev = -1;
    let measured = -1;
    let top = 0;
    let height = 1;
    const off = subscribe((front, ol, version) => {
      if (version !== measured) {
        measured = version;
        top = offsetIn(el, ol);
        height = el.offsetHeight || 1;
      }
      const r = Math.round(clamp01((front - top) / height) * 10000) / 10000;
      if (r !== prev) {
        prev = r;
        el.style.transform = `scaleY(${r})`;
      }
    });
    return () => {
      off();
      el.style.removeProperty("transform");
      el.style.removeProperty("transform-origin");
    };
  }, [active, subscribe]);
  return <span ref={ref} aria-hidden className={className} />;
};

/** Share of a row's height over which a tile crossfades to lime, centred on the tile. */
const FADE = 0.6;

/** The rows' tile centres and boxes, measured against the track. */
const measureRows = (ol: HTMLElement) =>
  [...ol.querySelectorAll<HTMLElement>(":scope > li")].map((row) => {
    const tile = row.querySelector<HTMLElement>("[data-step-tile]");
    return {
      y: row.offsetTop,
      h: row.offsetHeight,
      mark: tile ? offsetIn(tile, ol) + tile.offsetHeight / 2 : row.offsetTop + row.offsetHeight / 2,
    };
  });

/** A step number tile: crossfades to lime as the front passes its centre. */
export const StepTile = ({ first, className, children }: { first: boolean; className: string; children: ReactNode }) => {
  const { active, subscribe } = useContext(TrackContext);
  const ref = useRef<HTMLSpanElement>(null);
  const lime = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    const fill = lime.current;
    if (!el || !fill) return;
    let measured = -1;
    let mark = 0;
    let range = 1;
    let prev = -1;
    const off = subscribe((front, ol, version) => {
      if (version !== measured) {
        measured = version;
        mark = offsetIn(el, ol) + el.offsetHeight / 2;
        const row = el.closest("li");
        range = (row?.offsetHeight ?? el.offsetHeight) * FADE;
      }
      const o = Math.round(smooth((front - (mark - range / 2)) / range) * 1000) / 1000;
      if (o === prev) return;
      prev = o;
      fill.style.opacity = String(o);
      fill.style.transform = `scale(${0.92 + o * 0.08})`;
    });
    return off;
  }, [active, subscribe]);
  if (!active) return <span className={`${className} ${first ? "bg-highlight text-ink" : "bg-on-dark/10"}`}>{children}</span>;
  return (
    <span ref={ref} data-step-tile="" className={`relative ${className} bg-on-dark/10`}>
      {children}
      <span
        ref={lime}
        aria-hidden
        className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-highlight text-ink"
        style={{ opacity: 0, transform: "scale(0.92)" }}
      >
        {children}
      </span>
    </span>
  );
};

/**
 * The translucent plate behind the current step: it starts on step 01 (as in
 * Figma) and, as the front runs from one tile centre to the next, glides from
 * that row to the next (y and height, smoothstepped). While it runs it marks
 * the track `data-plate`, which hides the rows' static plate.
 */
export const StepsPlate = ({ className }: { className: string }) => {
  const { active, subscribe } = useContext(TrackContext);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    const ol = el?.parentElement;
    if (!el || !ol) return;
    ol.dataset.plate = "";
    let measured = -1;
    let rows: ReturnType<typeof measureRows> = [];
    let prev = "";
    const place = (y: number, h: number) => {
      const key = `${y.toFixed(2)}/${h.toFixed(2)}`;
      if (key === prev) return;
      prev = key;
      el.style.transform = `translateY(${y.toFixed(2)}px)`;
      el.style.height = `${h.toFixed(2)}px`;
      el.style.opacity = "1";
    };
    const first = ol.querySelector<HTMLElement>(":scope > li");
    if (first) place(first.offsetTop, first.offsetHeight);
    const off = subscribe((front, track, version) => {
      if (version !== measured) {
        measured = version;
        rows = measureRows(track);
      }
      if (!rows.length) return;
      let k = 0;
      while (k < rows.length - 1 && front >= rows[k + 1].mark) k++;
      const a = rows[k];
      const b = rows[Math.min(k + 1, rows.length - 1)];
      const t = b === a || front <= a.mark ? 0 : smooth((front - a.mark) / (b.mark - a.mark));
      place(a.y + (b.y - a.y) * t, a.h + (b.h - a.h) * t);
    });
    return () => {
      off();
      delete ol.dataset.plate;
    };
  }, [active, subscribe]);
  if (!active) return null;
  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 ${className}`}
      style={{ opacity: 0 }}
    />
  );
};
