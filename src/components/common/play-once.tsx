"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { usePreloaderStore } from "@/components/common/preloader/preloader-store";
import { useMotionOff } from "@/hooks/use-motion-off";

interface PlayOnceOptions {
  /** Off: the caller renders its static markup; `play` is always true. */
  active: boolean;
  /** Start when the element scrolls into view (default) or straight away. */
  inView?: boolean;
  /** Hold until the preloader has lifted (the hero). */
  waitPreloader?: boolean;
  /** IntersectionObserver rootMargin — how far into the viewport "in view" starts. */
  margin?: string;
}

/**
 * `play` flips to true once: the first time the element is in view (latched),
 * two frames after mount so the springs paint their `from` state first. Under
 * reduced motion it is true at once (the springs jump to rest).
 */
export const usePlayOnce = (
  ref: RefObject<Element | null> | null,
  { active, inView = true, waitPreloader = false, margin = "0px 0px -4% 0px" }: PlayOnceOptions,
): boolean => {
  const preloaderActive = usePreloaderStore((s) => s.active);
  const motionOff = useMotionOff();
  const [play, setPlay] = useState(false);
  const [seen, setSeen] = useState(!inView);

  useEffect(() => {
    if (!active || !inView) return;
    const el = ref?.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, inView, ref, margin]);

  const blocked = waitPreloader && preloaderActive;
  useEffect(() => {
    if (!active) return;
    if (motionOff) {
      setPlay(true);
      return;
    }
    if (!seen || blocked) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPlay(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [active, seen, blocked, motionOff]);

  return active ? play : true;
};

interface PlayGroupValue {
  play: boolean;
  /** False: every part renders its static markup. */
  active: boolean;
}

const PlayGroupContext = createContext<PlayGroupValue>({ play: true, active: false });

export const usePlayGroup = () => useContext(PlayGroupContext);

export const PlayGroupProvider = PlayGroupContext.Provider;

export interface PlayGroupProps {
  active: boolean;
  tag?: "div" | "ol" | "ul" | "span";
  className?: string;
  children: ReactNode;
  "aria-hidden"?: boolean;
}

/**
 * Wraps a block that holds several animated parts (a chart, a row of bars):
 * one in-view trigger, shared by every part through context.
 */
export const PlayGroup = ({ active, tag = "div", className, children, ...rest }: PlayGroupProps) => {
  const ref = useRef<HTMLElement>(null);
  const play = usePlayOnce(ref, { active });
  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} className={className} {...rest}>
      <PlayGroupContext.Provider value={{ play, active }}>{children}</PlayGroupContext.Provider>
    </Tag>
  );
};
