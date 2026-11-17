"use client";

import type { ReactNode } from "react";

import { Inview } from "@/components/common/robot-inview";
import { useRobot } from "@/components/common/robot-view";
import { SPRING } from "@/lib/springs/presets";
import type { Tags } from "@/types/springs";

export type RevealKind = "block" | "heading";

export interface RevealProps {
  children: ReactNode;
  tag?: Tags;
  className?: string;
  id?: string;
  /** ms — staggers siblings. */
  delay?: number;
  /** A section heading only fades (its lines rise inside it); a block rises 48px. */
  kind?: RevealKind;
}

const motion = {
  heading: { from: { opacity: 0 }, to: { opacity: 1 }, config: SPRING.calm },
  block: { from: { opacity: 0, y: 48 }, to: { opacity: 1, y: 0 }, config: SPRING.slow },
} as const;

/** The robot form's plain fade-up (it renders at its `to` state there). */
const plain = { from: { opacity: 0, y: 32 }, to: { opacity: 1, y: 0 }, config: SPRING.calm } as const;

/** Reveal the first time a block scrolls into view. */
export const Reveal = ({ children, tag = "div", className, id, delay = 0, kind = "block" }: RevealProps) => {
  const m = useRobot() ? plain : motion[kind];
  return (
    <Inview tag={tag} from={m.from} to={m.to} mode="once" config={m.config} delayIn={delay} className={className} id={id}>
      {children}
    </Inview>
  );
};
