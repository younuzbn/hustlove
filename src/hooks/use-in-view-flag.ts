"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the element is on screen — gate idle loops on it so they stop off-screen. */
export const useInViewFlag = (ref: RefObject<Element | null>, active = true): boolean => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref, active]);
  return active && inView;
};
