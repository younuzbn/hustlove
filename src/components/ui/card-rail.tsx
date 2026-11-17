"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface CardRailProps {
  children: ReactNode;
  /** Grid classes for the wide layouts; the rail turns it into a 3 × 320px row at 768
   *  and 3 × 258px (12px gaps) at 390. */
  className?: string;
  /** "gutter" (default): the rail bleeds over the 20px page gutter. "panel": it sits inside a
   *  40px-padded panel at 768 (Pricing "Worked examples") and bleeds over that padding. */
  bleed?: "gutter" | "panel";
  /** Scroll-indicator colours: "light" page (default) or "dark" panel (white 12% / 32%). */
  tone?: "light" | "dark";
}

const tones = {
  light: { track: "bg-chart-100", thumb: "bg-chart-300" },
  dark: { track: "bg-on-dark/10", thumb: "bg-on-dark" },
};

const bleeds = {
  gutter: { outer: "to-tablet:-mr-5", inner: "to-tablet:pr-5" },
  panel: { outer: "to-tablet:-mr-10 to-phone:mr-0", inner: "to-tablet:pr-10 to-phone:pr-0" },
};

// 768 frame: a 748px window (gutter to frame edge) over 1000px of cards + 20px end
// padding — the Figma thumb is 534 of 728px, i.e. 748 / 1020 of the track.
const FIGMA_RATIO = 748 / 1020;

/**
 * Figma "Cards — scroll" + "Scroll indicator" (768 frame). Above 768px it is just
 * the card grid; at 768 and below the cards scroll sideways and the thumb tracks it.
 */
export const CardRail = ({ children, className = "", bleed = "gutter", tone = "light" }: CardRailProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ ratio: FIGMA_RATIO, progress: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setThumb({
        ratio: el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : FIGMA_RATIO,
        progress: max > 0 ? el.scrollLeft / max : 0,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={ref} className={`${bleeds[bleed].outer} to-tablet:overflow-x-auto to-tablet:scrollbar-none`}>
        <div className={`${className} to-tablet:w-max to-tablet:grid-cols-[repeat(3,20rem)] ${bleeds[bleed].inner} to-phone:grid-cols-[repeat(3,16.125rem)] to-phone:gap-x-3`}>{children}</div>
      </div>
      <div aria-hidden className="hidden pt-6 to-tablet:block">
        <div className={`h-1 overflow-hidden rounded-full ${tones[tone].track}`}>
          <div
            className={`h-full rounded-full ${tones[tone].thumb}`}
            style={{ width: `${thumb.ratio * 100}%`, marginLeft: `${thumb.progress * (1 - thumb.ratio) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
};
