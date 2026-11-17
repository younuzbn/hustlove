"use client";

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

import { SPRING } from "@/lib/springs/presets";

import { SweepCounter, SweepMark, useSweepBuild } from "./preloader-mark";

/** The navy cover — the same paint as the server cover, so the hand-over is seamless. */
export const COVER = "bg-(image:--gradient-hero) bg-[length:100%_400%]";

const HEADER_LOGO = 'header a[href="/"] [data-logo-mark]';

export interface PreloaderSceneProps {
  /** The figure the counter runs to, e.g. "AED 2,418,300". */
  balance: string;
  balanceLabel: string;
  /** The page starts to show (the hero entrance may start). */
  onReveal: () => void;
  /** Fully gone: unmount. */
  onDone: () => void;
}

interface Flight {
  dx: number;
  dy: number;
  s: number;
  /** The header logo is the ink one (light header): the mark turns from these colours to ink as it lands. */
  ink: [string, string] | null;
}

/** A token's resolved colour, so the spring can interpolate it. */
const tokenColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * The sweep build over the real balance counter; then the mark flies into the
 * header logo's place while the cover dissolves. The real logo is hidden under
 * the flying mark and takes over when it lands.
 */
export const PreloaderScene = ({ balance, balanceLabel, onReveal, onDone }: PreloaderSceneProps) => {
  const markRef = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const build = useSweepBuild(Number(balance.replace(/\D/g, "")), () => {
    const mark = markRef.current?.getBoundingClientRect();
    const logoImg = document.querySelector<SVGSVGElement>(HEADER_LOGO);
    const logo = logoImg?.getBoundingClientRect();
    const ink: Flight["ink"] = logoImg?.hasAttribute("data-ink") ? [tokenColor("--on-dark"), tokenColor("--ink")] : null;
    if (!mark || !logo || logo.width === 0) return setFlight({ dx: 0, dy: 0, s: 1, ink: null });
    if (logoImg) logoImg.style.visibility = "hidden";
    setFlight({ dx: logo.left - mark.left, dy: logo.top - mark.top, s: logo.width / mark.width, ink });
  });
  const fly = useSpring({
    p: flight ? 1 : 0,
    config: { tension: 140, friction: 24 },
    onRest: () => {
      if (!flight) return;
      const logoImg = document.querySelector<SVGSVGElement>(HEADER_LOGO);
      if (logoImg) logoImg.style.visibility = "";
    },
  });
  useEffect(
    () => () => {
      const logoImg = document.querySelector<SVGSVGElement>(HEADER_LOGO);
      if (logoImg) logoImg.style.visibility = "";
    },
    [],
  );
  const cover = useSpring({
    o: flight ? 0 : 1,
    delay: flight ? 260 : 0,
    config: SPRING.slow,
    onRest: () => {
      if (flight) onDone();
    },
  });
  useEffect(() => {
    if (flight) onReveal();
  }, [flight, onReveal]);
  const f: Flight = flight ?? { dx: 0, dy: 0, s: 1, ink: null };
  return (
    <div className="absolute inset-0 text-on-dark">
      <animated.div className={`absolute inset-0 ${COVER}`} style={{ opacity: cover.o }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <animated.div
          ref={markRef}
          className="size-16"
          style={{
            transformOrigin: "0 0",
            transform: fly.p.to((p) => `translate(${f.dx * p}px, ${f.dy * p}px) scale(${1 + (f.s - 1) * p})`),
            color: f.ink ? fly.p.to([0, 1], f.ink) : "var(--on-dark)",
          }}
        >
          <SweepMark build={build} className="size-full" />
        </animated.div>
        <SweepCounter
          build={build}
          label={balanceLabel}
          style={{ opacity: fly.p.to((p) => 1 - Math.min(1, p * 3)), transform: fly.p.to((p) => `translateY(${p * 12}px)`) }}
        />
      </div>
    </div>
  );
};
