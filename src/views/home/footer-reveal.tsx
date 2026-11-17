"use client";

// Footer from under the page. The page content (`children`, the view's
// `<main>`) sits on an opaque page-coloured cover that also holds the gap
// before the footer (110 / 80 / 56px — moved here from the footer, so the
// height is unchanged). When the footer fits in the viewport, the footer is
// `position: sticky; bottom: 0` under the cover (z 0 vs 10) and the cover gets
// rounded bottom corners: scrolling to the end slides the page up off the
// footer. Everything stays in normal flow — page heights don't change, and
// nothing overlaps the footer once it is uncovered (it stays clickable; the
// cookie banner, z-50, stays on top). The share of the footer uncovered is
// published to the wordmark (`useFooterReveal`), whose letters rise with it.
// Footer taller than the viewport, motion off, robot form: a plain footer.
//
// In every mode the cover's bottom corners are rounded and the footer tucks up under
// them by the corner radius (its wrapper carries the footer gradient in that strip), so
// the corners show the footer's blue — at the end of the scroll too, where the cover's
// bottom meets the footer's top and plain page colour used to fill them.

import { SpringValue } from "@react-spring/web";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { clamp01, useScrollFrame } from "@/hooks/use-scroll-frame";

const RevealContext = createContext<SpringValue<number> | null>(null);

/** 0 → 1: how much of the footer is uncovered; null when the footer is a plain one. */
export const useFooterReveal = () => useContext(RevealContext);

export interface FooterRevealProps {
  /** The page content (the view's `<main>`). */
  children: ReactNode;
  /** `<SiteFooter />`. */
  footer: ReactNode;
}

export const FooterReveal = ({ children, footer }: FooterRevealProps) => {
  const cover = useRef<HTMLDivElement>(null);
  const under = useRef<HTMLDivElement>(null);
  // The end of the content: the reveal is tracked only while it is near the viewport (the
  // sticky footer itself always intersects it).
  const end = useRef<HTMLSpanElement>(null);
  const active = !useMotionOffMarkup();
  const [fits, setFits] = useState(false);
  // The strip of the wrapper tucked under the cover's corners (px), not part of the footer.
  const tuck = useRef(0);
  const [shown] = useState(() => new SpringValue(0));
  const on = active && fits;

  // Only when the whole footer fits in the viewport.
  useEffect(() => {
    const el = under.current;
    if (!active || !el) return;
    const check = () => {
      tuck.current = parseFloat(getComputedStyle(el).paddingTop) || 0;
      setFits(el.offsetHeight - tuck.current <= window.innerHeight);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [active]);

  useScrollFrame(
    end,
    () => {
      const c = cover.current;
      const u = under.current;
      const h = (u?.offsetHeight ?? 0) - tuck.current;
      if (!c || !u || h <= 0) return;
      const v = Math.round(clamp01((window.innerHeight - c.getBoundingClientRect().bottom) / h) * 1e4) / 1e4;
      if (v !== shown.get()) shown.set(v);
    },
    { active: on, margin: "0px 0px 25% 0px" },
  );

  return (
    <RevealContext.Provider value={on ? shown : null}>
      <div
        ref={cover}
        className="relative z-10 rounded-b-[var(--corner-card-closed)] bg-page pb-27.5 to-laptop:pb-20 to-phone:pb-14"
      >
        {children}
        <span ref={end} aria-hidden className="block h-px -mb-px" />
      </div>
      <div
        ref={under}
        className={`-mt-[var(--corner-card-closed)] bg-(image:--gradient-footer) pt-[var(--corner-card-closed)] ${on ? "sticky bottom-0 z-0" : ""}`}
      >
        {footer}
      </div>
    </RevealContext.Provider>
  );
};
