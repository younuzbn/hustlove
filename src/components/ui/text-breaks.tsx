import { Fragment } from "react";

export interface TextBreaksProps {
  /**
   * Copy with Figma's forced line breaks: "\n" breaks at every width, "[d]"
   * only in the 1440 layout, "[t]" only in the 1024 layout (769–1024px), "[m]"
   * only in the 768 layout (561–768px), "[s]" in the 768 and 390 layouts
   * (≤768px) and "[p]" only in the 390 layout (`to-phone`, ≤560px). "[n]" breaks only at
   * 769–1023px (between the 1024 and 768 frames) and "[T]" only at 1024 itself, for copy whose
   * in-between break reads better than the 1024 frame's.
   */
  text: string;
}

export const breakClass: Record<string, string | undefined> = {
  "\n": undefined,
  "[d]": "to-laptop:hidden",
  "[t]": "hidden to-laptop:inline to-tablet:hidden",
  "[m]": "hidden to-tablet:inline to-phone:hidden",
  "[s]": "hidden to-tablet:inline",
  "[p]": "hidden to-phone:inline",
  "[n]": "hidden min-[769px]:max-[1024px]:inline",
  "[T]": "hidden min-[1024px]:max-[1025px]:inline",
};

/** Splits copy into text runs and break tokens ("\n", "[d]" …). */
export const splitBreaks = (text: string) => text.split(/(\n|\[[dtmspnT]\])/);

/** Renders copy with per-breakpoint line breaks pinned to the Figma frames. */
export const TextBreaks = ({ text }: TextBreaksProps) => (
  <>
    {splitBreaks(text).map((part, i) =>
      part in breakClass ? <br key={i} className={breakClass[part]} /> : <Fragment key={i}>{part}</Fragment>,
    )}
  </>
);
