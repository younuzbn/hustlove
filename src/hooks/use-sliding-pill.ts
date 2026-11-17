"use client";

import { useSpring } from "@react-spring/web";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * A highlight that slides between the cells of a segmented control or a grid
 * of options (the Company question tabs pattern). Returns the spring style for
 * an absolutely placed pill in `container` and whether it has been measured —
 * before that (server render, first paint) the selected cell paints its own
 * highlight, so nothing flashes. Re-placed without motion on resize.
 * `landed` is the option the pill has reached (past half its travel): light a
 * label when it is selected *and* landed, so it turns light only once the pill
 * is under it, while the label it left turns back at once.
 */
export const useSlidingPill = (
  container: RefObject<HTMLElement | null>,
  index: number,
  config = { tension: 240, friction: 30 },
) => {
  const items = useRef<(HTMLElement | null)[]>([]);
  const [measured, setMeasured] = useState(false);
  const [landed, setLanded] = useState(index);
  const [style, api] = useSpring(() => ({ x: 0, y: 0, width: 0, height: 0, config }));

  useLayoutEffect(() => {
    const place = (immediate: boolean) => {
      const el = items.current[index];
      if (!el) return;
      const from = { x: style.x.get(), y: style.y.get() };
      const to = { x: el.offsetLeft, y: el.offsetTop };
      const span = Math.hypot(to.x - from.x, to.y - from.y);
      if (immediate || span < 1) setLanded(index);
      api.start({
        ...to,
        width: el.offsetWidth,
        height: el.offsetHeight,
        immediate,
        onChange: ({ value }) => {
          if (Math.hypot(to.x - value.x, to.y - value.y) < span / 2) setLanded(index);
        },
      });
    };
    place(!measured);
    if (!measured) setMeasured(true);
    const box = container.current;
    if (!box) return;
    // The observer reports once on observe: skip that, or it would snap a slide in flight.
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) first = false;
      else place(true);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [index, measured, api, container, style]);

  /** `ref={item(i)}` on each option. */
  const item = (i: number) => (el: HTMLElement | null) => {
    items.current[i] = el;
  };

  return { measured, style, item, landed };
};
