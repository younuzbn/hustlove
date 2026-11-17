"use client";

// 📖 Docs: obsidian/frontend/animation-system.md → "Preloader"

import { animated, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { isRobotView } from "@/components/common/robot-view";
import { useScrollLock } from "@/hooks/use-scroll-lock";

import { COVER, PreloaderScene } from "./preloader-scene";
import { usePreloaderStore } from "./preloader-store";

/** Painted by the server; shown before the first paint only under `<html data-preloader>`. */
export const PreloaderCover = () => (
  <div aria-hidden className={`pointer-events-none fixed inset-0 z-[200] hidden ${COVER} [html[data-preloader]_&]:block`} />
);

export interface PreloaderProps {
  /** The figure the counter runs to, e.g. "AED 2,418,300". */
  balance: string;
  balanceLabel: string;
}

interface OverlayProps extends PreloaderProps {
  onReveal: () => void;
  onDone: () => void;
}

const Overlay = ({ onReveal, onDone, ...scene }: OverlayProps) => {
  const [skipped, setSkipped] = useState(false);
  useScrollLock(true);

  // Take over from the server cover in the same frame.
  useLayoutEffect(() => {
    document.documentElement.removeAttribute("data-preloader");
  }, []);

  const out = useSpring({
    o: skipped ? 0 : 1,
    config: { tension: 300, friction: 32 },
    onRest: () => {
      if (skipped) onDone();
    },
  });

  useEffect(() => {
    if (skipped) onReveal();
  }, [skipped, onReveal]);

  useEffect(() => {
    const skip = () => setSkipped(true);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", skip, { passive: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, []);

  return (
    <animated.div
      aria-hidden
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ opacity: out.o }}
      onPointerDown={() => setSkipped(true)}
    >
      <PreloaderScene {...scene} onReveal={onReveal} onDone={onDone} />
    </animated.div>
  );
};

/**
 * First page view of the session (`PRELOADER_FLAG_SCRIPT` decides — never for
 * robots or under reduced motion): the overlay plays over the already-rendered
 * page (nothing waits for it). Skippable with a click, a key, the wheel or a touch.
 */
export const Preloader = (props: PreloaderProps) => {
  const [running, setRunning] = useState(false);
  const setActive = usePreloaderStore((s) => s.setActive);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-preloader")) return;
    clearTimeout(window.__preloaderTimer);
    if (isRobotView()) {
      html.removeAttribute("data-preloader");
      return;
    }
    setActive(true);
    setRunning(true);
  }, [setActive]);

  const onReveal = useCallback(() => setActive(false), [setActive]);
  const onDone = useCallback(() => {
    setActive(false);
    setRunning(false);
  }, [setActive]);

  if (!running) return null;
  return <Overlay {...props} onReveal={onReveal} onDone={onDone} />;
};
