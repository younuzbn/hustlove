"use client";

// The footer's big "Hustlove": when the footer comes into view the letters rise
// one after another (fading up from 40% of their height). Each letter is drawn
// at the x the browser gave it in the kerned word (measured once), so the
// resting word is exactly the static one — after the rise the plain text
// takes over again. Motion off: the plain word.
//
// Under the footer reveal (`FooterReveal`, when the footer fits the viewport)
// the rise is scrubbed instead: each letter rises from below the wordmark's
// mask as the share of the footer uncovered passes its turn, and sinks back
// when the page scrolls up. The turns spread over the whole reveal, so the last
// letter lands exactly at the bottom of the scroll.

import { animated, useSprings } from "@react-spring/web";
import { useLayoutEffect, useRef, useState } from "react";

import { usePlayOnce } from "@/components/common/play-once";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { smooth } from "@/hooks/use-scroll-frame";
import { SPRING } from "@/lib/springs/presets";

import { useFooterReveal } from "./footer-reveal";

const STAGGER = 70;

/** Scrubbed: letter i rises while the uncovered share runs START + i·turn → + SPAN; the turn is
 *  spaced so the last letter ends at 1 (the bottom of the scroll). */
const START = 0.02;
const SPAN = 0.45;

export const WordmarkRise = ({ text }: { text: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const active = !useMotionOffMarkup();
  const reveal = useFooterReveal();
  const play = usePlayOnce(ref, { active: active && !reveal });
  const chars = [...text];
  const turn = chars.length > 1 ? (1 - START - SPAN) / (chars.length - 1) : 0;
  const [xs, setXs] = useState<number[] | null>(null);
  // The letters are blocks of the word's line-height, placed against the inline span's content
  // area — which overhangs the 0.816 line box. Shift them to the paragraph's line top, where the
  // static word's glyphs sit.
  const [top, setTop] = useState(0);
  const [done, setDone] = useState(false);

  // Where each letter sits in the kerned word (re-measured on resize while it can still play).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || (done && !reveal) || !el) return;
    const measure = () => {
      const node = el.firstElementChild?.firstChild;
      if (!node) return;
      const box = el.getBoundingClientRect();
      const left = box.left;
      setTop((el.parentElement?.getBoundingClientRect().top ?? box.top) - box.top);
      const range = document.createRange();
      let i = 0;
      const out = chars.map((ch) => {
        range.setStart(node, i);
        range.setEnd(node, i + ch.length);
        i += ch.length;
        return range.getBoundingClientRect().left - left;
      });
      setXs(out);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `chars` is derived from `text`
  }, [active, done, reveal, text]);

  const [letters] = useSprings(
    chars.length,
    (i) => ({
      from: { p: 0 },
      p: play ? 1 : 0,
      immediate: !play,
      delay: play ? 150 + i * STAGGER : 0,
      config: SPRING.slow,
      onRest: () => {
        if (play && i === chars.length - 1) setDone(true);
      },
    }),
    [play],
  );

  const split = active && (reveal !== null || !done) && xs !== null;
  return (
    <span ref={ref} className="relative">
      <span style={active && (reveal !== null || !done) ? { opacity: 0 } : undefined}>{text}</span>
      {split &&
        chars.map((ch, i) => (
          <animated.span
            key={i}
            aria-hidden
            className="absolute"
            style={
              reveal
                ? {
                    left: xs[i],
                    top,
                    transform: reveal.to((v) => `translateY(${(1 - smooth((v - START - i * turn) / SPAN)) * 105}%)`),
                  }
                : {
                    left: xs[i],
                    top,
                    opacity: letters[i].p,
                    transform: letters[i].p.to((p) => `translateY(${(1 - p) * 40}%)`),
                  }
            }
          >
            {ch}
          </animated.span>
        ))}
    </span>
  );
};
