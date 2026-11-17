import Image from "next/image";

import { CardHover, cardHoverShadow } from "@/components/ui/card-hover";
import type { controls as controlsData } from "@/data/mocks/home";

import { FadeInArt } from "./card-chart-motion";
import { CountUp } from "./count-up";
import { LineFlow, type LineFlowProps } from "./line-flow";
import { RecallTimeline } from "./recall-timeline";

/** The flow enters at the top right of "T+1", bows in and leaves through the right edge above the
 *  copy; it draws itself in from the top as the card scrolls up. */
const flow: Pick<LineFlowProps, "spine" | "spread"> = {
  spine: [
    [0.76, 0, -0.04, 0],
    [0.66, 0, 0.28, 0],
    [0.8, 0, 0.5, 0],
    [1.18, 0, 0.68, 0],
  ],
  spread: { from: 0.06, to: 0.32, unit: "w" },
};

export interface ControlsRecallCardProps {
  content: (typeof controlsData)["recall"];
  className?: string;
}

/** Figma 5628:6367 — the dark "T+1" card with the recall timeline; a blue line flow (`LineFlow`) runs under the copy. */
export const ControlsRecallCard = ({ content, className = "" }: ControlsRecallCardProps) => (
  <article
    className={`relative flex flex-col justify-between overflow-hidden rounded-card bg-(image:--gradient-recall) p-8 text-on-dark to-phone:justify-start to-phone:gap-8 to-phone:p-6 ${cardHoverShadow} ${className}`}
  >
    <CardHover>
    <FadeInArt className="pointer-events-none absolute inset-0">
      <Image
        src="/assets/controls/controls-dots.svg"
        alt=""
        width={360}
        height={300}
        className="pointer-events-none absolute top-0 left-[5.83375rem] h-75 w-90 to-laptop:-left-[2.8125rem] to-laptop:max-w-none to-tablet:left-[5.83375rem] to-tablet:max-w-full"
      />
    </FadeInArt>
    <LineFlow spine={flow.spine} spread={flow.spread} avoid="right" reveal="down" />
    <p className="relative h-28 text-number-xl font-light to-laptop:h-[5.375rem] to-laptop:text-number-xl-md to-tablet:h-18 to-phone:h-[3.625rem]"><CountUp value={content.value} /></p>
    <RecallTimeline steps={content.steps} />
    <div className="relative">
      <h3 className="w-77 text-title-m font-medium to-laptop:w-auto">{content.title}</h3>
      <p className="pt-3 text-body-m text-on-dark-muted">{content.text}</p>
    </div>
    </CardHover>
  </article>
);
