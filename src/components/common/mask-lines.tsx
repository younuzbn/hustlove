"use client";

import { animated, useSprings } from "@react-spring/web";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { breakClass, splitBreaks, TextBreaks } from "@/components/ui/text-breaks";

import { SPRING } from "@/lib/springs/presets";

type Token = { kind: "br"; cls?: string } | { kind: "space"; text: string } | { kind: "word"; text: string; index: number };

const tokenize = (text: string): Token[] => {
  const out: Token[] = [];
  let index = 0;
  for (const part of splitBreaks(text)) {
    if (part in breakClass) {
      out.push({ kind: "br", cls: breakClass[part] });
      continue;
    }
    for (const bit of part.split(/(\s+)/)) {
      if (!bit) continue;
      if (/^\s+$/.test(bit)) out.push({ kind: "space", text: bit });
      else out.push({ kind: "word", text: bit, index: index++ });
    }
  }
  return out;
};

export interface MaskLinesProps {
  /** Copy in the `TextBreaks` format. */
  text: string;
  /** Off: the plain `TextBreaks` output (the live markup). */
  active: boolean;
  play: boolean;
  /** ms before the first line. */
  delay?: number;
  /** ms between rendered lines. */
  stagger?: number;
}

/**
 * Lines rise from a mask: each word sits in a clipped inline-block, words are
 * grouped by the line they render on and every line rises together. Once the
 * last line has landed the plain text is rendered again, so the resting
 * markup is exactly the static design.
 */
/** The masked words at their start (140% below the mask) — no springs, no measuring. */
const HeldLines = ({ tokens }: { tokens: Token[] }) => (
  <>
    {tokens.map((t, k) => {
      if (t.kind === "br") return <br key={k} className={t.cls} />;
      if (t.kind === "space") return <Fragment key={k}>{t.text}</Fragment>;
      return (
        <span key={k} className="inline-block [clip-path:inset(-0.2em_-0.3em_-0.3em_-0.3em)]">
          <span className="inline-block" style={{ transform: "translateY(140%)" }}>
            {t.text}
          </span>
        </span>
      );
    })}
  </>
);

/**
 * Pass 1 (2026-11-12, TBT — Fix Catalog "Per-letter headings: plain spans
 * until they first play"): every heading built a spring per word and measured
 * every word's `offsetTop` (a forced layout) in the hydration commit, long
 * before it could play. Until `play` first turns true the words are the same
 * markup at their start, with neither; then the live lines mount, measure and
 * rise exactly as before (the measure is a layout effect: same frame, before
 * paint).
 */
export const MaskLines = (props: MaskLinesProps) => {
  const [armed, setArmed] = useState(false);
  if (props.play && !armed) setArmed(true);
  const tokens = useMemo(() => tokenize(props.text), [props.text]);
  if (!props.active) return <TextBreaks text={props.text} />;
  if (!armed) return <HeldLines tokens={tokens} />;
  return <LiveLines {...props} />;
};

const LiveLines = ({ text, active, play, delay = 0, stagger = 80 }: MaskLinesProps) => {
  const tokens = useMemo(() => tokenize(text), [text]);
  const count = tokens.filter((t) => t.kind === "word").length;
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!play) setDone(false);
  }, [play]);

  const split = active && !done;

  useLayoutEffect(() => {
    if (!split) return;
    const tops: number[] = [];
    const out = words.current.slice(0, count).map((el) => {
      const top = el ? Math.round(el.offsetTop) : 0;
      let line = tops.findIndex((t) => Math.abs(t - top) < 4);
      if (line < 0) line = tops.push(top) - 1;
      return line;
    });
    setLines(out);
  }, [split, count, text]);

  const last = lines.length ? Math.max(...lines) : 0;
  // Mounted already playing: rise only once the lines are measured (the layout
  // effect above, same frame), or every line would start with no stagger.
  const go = play && lines.length > 0;
  const [springs] = useSprings(
    count,
    (i: number) => ({
      from: { y: 140 },
      to: { y: go ? 0 : 140 },
      immediate: !go,
      delay: go ? delay + (lines[i] ?? 0) * stagger : 0,
      config: SPRING.slow,
      onRest: (r: { finished?: boolean }) => {
        if (go && r.finished && (lines[i] ?? 0) === last && i === count - 1) setDone(true);
      },
    }),
    [go, lines, delay, stagger, last],
  );

  if (!split) return <TextBreaks text={text} />;

  return (
    <>
      {tokens.map((t, k) => {
        if (t.kind === "br") return <br key={k} className={t.cls} />;
        if (t.kind === "space") return <Fragment key={k}>{t.text}</Fragment>;
        const s = springs[t.index];
        return (
          <span
            key={k}
            ref={(el) => {
              words.current[t.index] = el;
            }}
            className="inline-block [clip-path:inset(-0.2em_-0.3em_-0.3em_-0.3em)]"
          >
            <animated.span className="inline-block" style={{ transform: s.y.to((v) => `translateY(${v}%)`) }}>
              {t.text}
            </animated.span>
          </span>
        );
      })}
    </>
  );
};
