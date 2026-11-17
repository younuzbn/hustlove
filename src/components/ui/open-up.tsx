"use client";

// Framed blocks rise like the hero dashboard: drop `<OpenUp />` as the first child
// of a large framed block (the block must be its parent). As the block's top
// travels from the viewport bottom to 30% from the top it flattens from a tilt
// (perspective on its parent, rotateX and scale — the hero dashboard's tokens
// `--tilt-perspective` / `--tilt-angle` / `--tilt-scale`, gentler at ≤560) anchored
// top-centre, and its corners ease from `--corner-card-closed` (32px) to its own
// design radius — scrubbed both ways.
// Only `rotate` / `scale` / `border-radius` are written (individual transform
// properties compose with the block's Reveal transform), and at rest the inline
// style is removed, so the block is exactly the static design. Motion off: nothing.
//
// The perspective lives on the parent, so its vanishing point is put at the block's centre
// while it tilts (`perspective-origin`, per frame). Left at the parent's default — the middle
// of a page-tall `<main>` — it sat far above blocks low on the page and squashed and sheared
// them instead of tilting them back.

import { useEffect, useLayoutEffect, useRef } from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { smooth, useMedia, useScrollFrame } from "@/hooks/use-scroll-frame";

/** The scrub runs while the block's top moves through this share of the viewport. */
const RANGE = 0.7;

export interface OpenUpProps {
  /** The block's own rounded-* radius token (Tier 3 name). */
  radius?: "card";
}

export const OpenUp = ({ radius = "card" }: OpenUpProps) => {
  const probe = useRef<HTMLSpanElement>(null);
  const active = !useMotionOffMarkup();
  const phone = useMedia("(width <= 560px)", active);
  // The tilt tokens, read once per breakpoint (they change at ≤560).
  const pose = useRef({ tilt: 0, from: 1 });
  const last = useRef("");
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    pose.current = {
      tilt: parseFloat(css.getPropertyValue("--tilt-angle")) || 0,
      from: parseFloat(css.getPropertyValue("--tilt-scale")) || 1,
    };
    last.current = "";
  }, [phone, active]);
  // The block itself is what is watched (the hidden probe never intersects); set before the
  // scroll-frame effect reads it.
  const block = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    block.current = probe.current?.parentElement ?? null;
  }, []);

  useScrollFrame(
    block,
    () => {
      const el = block.current;
      if (!el) return;
      const vh = window.innerHeight;
      const p = Math.round(smooth((vh - el.getBoundingClientRect().top) / (vh * RANGE)) * 1e4) / 1e4;
      const { tilt, from } = pose.current;
      const key = `${p}/${from}/${tilt}`;
      if (key === last.current) return;
      last.current = key;
      if (p >= 1) {
        el.style.removeProperty("rotate");
        el.parentElement?.style.removeProperty("perspective");
        el.parentElement?.style.removeProperty("perspective-origin");
        el.style.removeProperty("scale");
        el.style.removeProperty("border-radius");
        el.style.removeProperty("transform-origin");
        return;
      }
      el.style.transformOrigin = "50% 0";
      el.style.scale = String(from + (1 - from) * p);
      el.style.rotate = `x ${tilt * (1 - p)}deg`;
      const parent = el.parentElement;
      if (parent) {
        // the block's top-centre stays put while it tilts about it, so its on-screen box is a
        // fair anchor; the vanishing point goes to the block's middle
        const pb = parent.getBoundingClientRect();
        const bb = el.getBoundingClientRect();
        parent.style.setProperty("perspective", "var(--tilt-perspective)");
        parent.style.setProperty(
          "perspective-origin",
          `${(bb.left + bb.right) / 2 - pb.left}px ${bb.top - pb.top + el.offsetHeight / 2}px`,
        );
      }
      el.style.borderRadius = `calc(var(--corner-${radius}) + (var(--corner-${radius}-closed) - var(--corner-${radius})) * ${1 - p})`;
    },
    { active },
  );

  // Leaving (unmount, motion turning off): back to the static design.
  useEffect(() => {
    const el = block.current;
    return () => {
      last.current = "";
      el?.style.removeProperty("scale");
      el?.style.removeProperty("rotate");
      el?.parentElement?.style.removeProperty("perspective");
      el?.parentElement?.style.removeProperty("perspective-origin");
      el?.style.removeProperty("border-radius");
      el?.style.removeProperty("transform-origin");
    };
  }, [active]);

  return <span ref={probe} hidden />;
};
