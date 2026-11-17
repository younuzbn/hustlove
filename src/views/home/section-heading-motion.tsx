"use client";

// Section heading reveal: one in-view trigger for the heading; the H2 lines rise
// from masks (the heading column itself fades — `Reveal kind="heading"`).

import { useRef, type ReactNode } from "react";

import { MaskLines } from "@/components/common/mask-lines";
import { PlayGroupProvider, usePlayGroup, usePlayOnce } from "@/components/common/play-once";
import { useRobot } from "@/components/common/robot-view";

export interface HeadingFrameProps {
  className: string;
  children: ReactNode;
}

/** The `SectionHeading` root. The robot form renders the lines as plain text. */
export const HeadingFrame = ({ className, children }: HeadingFrameProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const active = !useRobot();
  const play = usePlayOnce(ref, { active });
  return (
    <div ref={ref} className={className}>
      <PlayGroupProvider value={{ play, active }}>{children}</PlayGroupProvider>
    </div>
  );
};

/** The H2 copy: lines rise from masks. */
export const HeadingLines = ({ text }: { text: string }) => {
  const { play, active } = usePlayGroup();
  return <MaskLines text={text} active={active} play={play} delay={60} stagger={90} />;
};
