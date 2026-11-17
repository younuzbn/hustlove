"use client";

// Card hover: drop `<CardHover />` inside a card (`<article>`). While a fine
// pointer hovers the card — or keyboard focus is inside it — the card lifts
// 3px on a spring and gets `data-hover="on"` (pair it with a shadow / border
// transition in the card's className), and the charts inside can react through
// `useCardHover()`. Not on ≤768 rails, whose scroll box would clip the lift.
// Motion off: nothing.

import { useSpring } from "@react-spring/web";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { useHoverFocus } from "@/hooks/use-hover-focus";
import { useMotionOffMarkup } from "@/hooks/use-motion-off";
import { SPRING } from "@/lib/springs/presets";

const CardHoverContext = createContext(false);

/** True while the enclosing `CardHover` card is hovered. */
export const useCardHover = () => useContext(CardHoverContext);

/** Classes for the card itself: the soft shadow that comes with the lift. */
/** Kit: no shadows anywhere — the lift alone marks the hover. Kept as a hook for the card class lists. */
export const cardHoverShadow = "";

const LIFT = 3;

export const CardHover = ({ children }: { children?: ReactNode }) => {
  const probe = useRef<HTMLSpanElement>(null);
  const active = !useMotionOffMarkup();
  const hovered = useHoverFocus(probe, { active, closest: "article" });
  const [wide, setWide] = useState(true);
  const on = hovered && wide;

  useEffect(() => {
    if (!active) return;
    const mq = window.matchMedia("(hover: hover) and (min-width: 1025px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [active]);

  // The lift's spring exists only from the first hover on (pass 1, 2026-11-12,
  // TBT — Fix Catalog "Hover springs only where a mouse can hover"): every
  // card built one in the hydration commit, on phones where it never plays.
  const [armed, setArmed] = useState(false);
  if (on && !armed) setArmed(true);

  useEffect(() => {
    const card = probe.current?.closest("article");
    if (!card) return;
    if (on) card.dataset.hover = "on";
    else delete card.dataset.hover;
  }, [on]);

  return (
    <>
      <span ref={probe} hidden />
      {armed && <CardLift probe={probe} on={on} />}
      <CardHoverContext.Provider value={on}>
        {children}
      </CardHoverContext.Provider>
    </>
  );
};

/** The card's lift: written straight to the `<article>`'s `translate`. */
const CardLift = ({
  probe,
  on,
}: {
  probe: RefObject<HTMLSpanElement | null>;
  on: boolean;
}) => {
  useSpring({
    from: { y: 0 },
    y: on ? -LIFT : 0,
    config: SPRING.calm,
    onChange: ({ value }) => {
      const card = probe.current?.closest("article");
      if (card)
        card.style.translate = Math.abs(value.y) < 0.01 ? "" : `0 ${value.y}px`;
    },
  });
  return null;
};
