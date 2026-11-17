"use client";

import { useEffect, useState, type RefObject } from "react";

export interface HoverFocusOptions {
  /** Off: no listeners, always false (motion off, robot form). */
  active?: boolean;
  /** Listen on an ancestor instead (`closest(selector)` from the ref). */
  closest?: string;
  /** Touch: a press counts too (pointerdown → pointerup / cancel). */
  press?: boolean;
}

/**
 * True while a fine pointer hovers the element — `(hover: hover)` only, so a tap
 * on a phone never sticks — or while it holds keyboard focus (`:focus-visible`),
 * so the keyboard gets the same feedback as the mouse.
 */
export const useHoverFocus = (
  ref: RefObject<Element | null>,
  { active = true, closest, press = false }: HoverFocusOptions = {},
): boolean => {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const self = ref.current;
    const el = closest ? self?.closest(closest) : self;
    if (!active || !el) return;
    const fine = window.matchMedia("(hover: hover) and (min-width: 1025px)").matches;
    const enter = () => setOn(true);
    const leave = () => setOn(false);
    const focus = () => {
      if (el.matches(":focus-visible") || el.querySelector(":focus-visible")) setOn(true);
    };
    if (fine) {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    } else if (press) {
      el.addEventListener("pointerdown", enter);
      el.addEventListener("pointerup", leave);
      el.addEventListener("pointercancel", leave);
      el.addEventListener("pointerleave", leave);
    }
    el.addEventListener("focusin", focus);
    el.addEventListener("focusout", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
      el.removeEventListener("pointerdown", enter);
      el.removeEventListener("pointerup", leave);
      el.removeEventListener("pointercancel", leave);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", focus);
      el.removeEventListener("focusout", leave);
      setOn(false);
    };
  }, [ref, active, closest, press]);

  return active && on;
};
