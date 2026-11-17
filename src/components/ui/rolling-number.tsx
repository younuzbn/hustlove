"use client";

// A number whose digits roll like an odometer while its glyph positions stay
// put. The final string is always laid out: every digit sits in its own box
// sized by the final glyph (the real digit, hidden while rolling), and the
// rolling digits are drawn over that box, clipped just outside it. Separators,
// currency and units never move, so the line's width and alignment are the
// final ones from the first paint. When the value changes (a calculator), the
// new layout lands at once and the digits roll from the old figure to the new.

import { animated, type Interpolation, type SpringConfig, useSpring } from "@react-spring/web";
import { useEffect, useState } from "react";

/** Exactly one numeric group ("AED 2,418,300", "47 days", "0.25%", "T+1"); anything else stays static. */
export const parseNumber = (value: string) => {
  const m = /^(\D{0,4})(\d[\d.,]*\d|\d)(\D{0,6})$/.exec(value);
  if (!m) return null;
  const [, prefix, group, suffix] = m;
  const digits = group.replace(/\D/g, "");
  return { prefix, group, suffix, total: Number.parseInt(digits, 10), length: digits.length };
};

/** The digit shown at place `j` (10^j) for a running value, plus how far it has rolled on to the next one. */
const digitAt = (v: number, j: number) => {
  const p = 10 ** j;
  const base = Math.floor(v / p);
  const lower = v - base * p;
  const frac = j === 0 ? lower : Math.max(0, lower - (p - 1));
  return { base, digit: base % 10, frac };
};

/** Rows sit one box height + a gap apart; the clip reaches a little past the box. */
const ROW = (f: number) => `translateY(calc(${f} * (-100% - 0.2em)))`;
const ROW_NEXT = (f: number) => `translateY(calc(${1 - f} * (100% + 0.2em)))`;
const CLIP = "inset(-0.1em -0.4em)";

/**
 * Binds a value to the running figure — or, while the roll has not started,
 * computes it once from the held figure. Pass 1 (2026-11-12, TBT): every
 * `n.to()` is an Interpolation object subscribed to the spring, and the page's
 * ~10 count-ups created ~250 of them in the hydration commit, long before any
 * of them could move (react-spring `to` ~56 ms of a 593 ms task at 4× CPU).
 * Same markup, same values; the interpolations exist only once `play` is true.
 */
type Bind = <T>(f: (v: number) => T) => T | Interpolation<number, T>;

interface DigitProps {
  final: string;
  place: number;
  /** A leading digit hides while the running value is too small for it (unless a "." follows). */
  leading: boolean;
  bind: Bind;
  running: boolean;
}

const Digit = ({ final, place, leading, bind, running }: DigitProps) => (
  <span className="relative inline-block">
    <span style={running ? { opacity: 0 } : undefined}>{final}</span>
    {running && (
      <animated.span
        aria-hidden
        className="absolute inset-0"
        style={{ clipPath: CLIP, opacity: leading ? bind((v) => (digitAt(v, place).base > 0 ? 1 : 0)) : 1 }}
      >
        <animated.span className="absolute inset-0 text-center" style={{ transform: bind((v) => ROW(digitAt(v, place).frac)) }}>
          {bind((v) => String(digitAt(v, place).digit))}
        </animated.span>
        <animated.span className="absolute inset-0 text-center" style={{ transform: bind((v) => ROW_NEXT(digitAt(v, place).frac)) }}>
          {bind((v) => String((digitAt(v, place).digit + 1) % 10))}
        </animated.span>
      </animated.span>
    )}
  </span>
);

export interface RollingNumberProps {
  value: string;
  /** Where the roll starts on mount (count-up); defaults to the value itself. */
  from?: number;
  /** False holds the digits at `from`; true rolls them to the value. */
  play?: boolean;
  config?: SpringConfig;
  /** Fired once the digits rest on the value. */
  onDone?: () => void;
}

export const RollingNumber = ({ value, from, play = true, config, onDone }: RollingNumberProps) => {
  const parsed = parseNumber(value);
  const total = parsed?.total ?? 0;
  const start = from ?? total;
  const [running, setRunning] = useState(start !== total);
  const { n } = useSpring({
    from: { n: start },
    to: { n: play ? total : start },
    immediate: !play,
    config,
    onStart: () => setRunning(true),
    onRest: (r) => {
      if (Math.round(r.value.n) === total && play) {
        setRunning(false);
        onDone?.();
      }
    },
  });
  // Settled without a run (e.g. `immediate`): show the real digits.
  useEffect(() => {
    if (play && n.get() === total && !n.isAnimating) setRunning(false);
  }, [play, total, n]);

  if (!parsed) return <>{value}</>;
  // Held (not yet playing, not moving): plain values from the held figure.
  const live = play || n.isAnimating;
  const held = n.get();
  const bind = ((f: (v: number) => unknown) => (live ? n.to(f) : f(held))) as Bind;
  const { prefix, group, suffix, length } = parsed;
  const chars = [...group];
  let d = 0;
  return (
    <span className="whitespace-nowrap">
      {prefix}
      {chars.map((c, i) => {
        if (!/\d/.test(c)) {
          // A separator hides with the leading digit before it.
          const prevPlace = length - d;
          const hideable = c === "," && prevPlace > 0;
          return hideable && running ? (
            <animated.span key={i} style={{ opacity: bind((v) => (Math.floor(v / 10 ** prevPlace) > 0 ? 1 : 0)) }}>
              {c}
            </animated.span>
          ) : (
            <span key={i}>{c}</span>
          );
        }
        const place = length - 1 - d;
        d += 1;
        const leading = place > 0 && chars[i + 1] !== ".";
        return <Digit key={i} final={c} place={place} leading={leading} bind={bind} running={running} />;
      })}
      {suffix}
    </span>
  );
};
