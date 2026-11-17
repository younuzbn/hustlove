import Image from "next/image";

import { Pill } from "@/components/ui/pill";
import { OpenUp } from "@/components/ui/open-up";
import { Reveal } from "@/components/ui/reveal";
import type { gettingStarted as gettingStartedData } from "@/data/mocks/home";

import { LineFlow, type LineFlowProps } from "./line-flow";
import { StepsLine, StepsPlate, StepsTrack, StepTile } from "./steps-timeline";

export interface GettingStartedSectionProps {
  content: typeof gettingStartedData;
}

// Timeline markers, Figma 5628:8633–8636 (tops 68 / 246 / 422 / 585 px, line from 77 px);
// 1024 (5934:6948): last marker at 609 px, line 528 px; 768 (5969:4127–4130): 99 / 317 / 533 / 737 px.
const markers = [
  "top-[15.375rem] to-laptop:top-[16.0625rem] to-tablet:top-[19.8125rem]",
  "top-[26.375rem] to-laptop:top-[27.0625rem] to-tablet:top-[33.3125rem]",
  "top-[36.5625rem] to-laptop:top-[38.0625rem] to-tablet:top-[46.0625rem]",
];

/** Two tall, twisting line flows pinned to the block in rem (its width follows the screen, its
 *  height doesn't): one weaves down the left side from the top edge to the bottom-left corner,
 *  beside the title and the left column; the other drops down the right edge past the right
 *  column and out the bottom. With the scroll the left one draws itself in from the top down,
 *  the right one from the bottom up; both are kept sparse (22 strands). */
const flowLeft: Pick<LineFlowProps, "spine" | "spread" | "twist"> = {
  spine: [
    [0, 18.7, 0, -1.5],
    [0, 17.1, 0, 4.8],
    [0, 9.2, 0, 13.2],
    [0, 5.5, 0, 23.3],
    [0, 8.5, 0, 37.4],
    [0, 5.2, 0, 48.5],
    [0, -0.5, 0, 57.3],
    [0, -3, 0, 62],
  ],
  spread: { from: 1.4, to: 5.5, unit: "rem" },
  twist: 3.5,
};
const flowRight: Pick<LineFlowProps, "spine" | "spread" | "twist" | "fan"> = {
  spine: [
    [1, 0.5, 0, 20.5],
    [1, -3.9, 0, 33.9],
    [1, -4.8, 0, 38.3],
    [1, -7.9, 0, 44.9],
    [1, -12.7, 0, 50.2],
    [1, -15.2, 0, 57.3],
    [1, -15.5, 0, 62],
  ],
  spread: { from: 1.6, to: 5, unit: "rem" },
  // a soft silk twist: crossings spread along it rather than pinched into knots
  twist: 1.6,
  fan: 0.9,
};

/** Figma 5628:8576 "Getting started" — four steps on a centre timeline; 1024 frame 5934:6948
 *  (360/56/360 columns, timeline at 452px); 768 frame 5934:14268 (232/56/232, timeline at 324px);
 *  390 frame 5934:21580 swaps the timeline for a stacked list (Figma "Steps" 5974:179). */
export const GettingStartedSection = ({ content }: GettingStartedSectionProps) => (
  <section id="getting-started" className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
    <div className="relative flex flex-col overflow-hidden rounded-card bg-(image:--gradient-steps) px-10 pt-14 pb-6 text-on-dark to-laptop:pt-12 to-laptop:pb-4 to-phone:p-6">
      <OpenUp />
      {/* Figma "Dot texture": two dot clusters pinned to the card's top-left and bottom-right
          corners at every frame; the 390 frame hides it. 1440 (5639:3) has its own dots and fade. */}
      <Image
        src="/assets/getting-started/steps-dots-tl-1440.svg"
        alt=""
        width={428}
        height={390}
        className="pointer-events-none absolute top-0 left-0 h-[24.375rem] w-[26.75rem] max-w-none to-laptop:hidden"
      />
      <Image
        src="/assets/getting-started/steps-dots-br-1440.svg"
        alt=""
        width={400}
        height={376}
        className="pointer-events-none absolute right-0 bottom-0 h-[23.5rem] w-[25rem] max-w-none to-laptop:hidden"
      />
      <Image
        src="/assets/getting-started/steps-dots-tl.svg"
        alt=""
        width={440}
        height={392}
        className="pointer-events-none absolute top-0 left-0 hidden h-[24.125rem] w-[27.5rem] max-w-none to-laptop:block to-tablet:h-[24.5rem] to-phone:hidden"
      />
      <Image
        src="/assets/getting-started/steps-dots-br.svg"
        alt=""
        width={368}
        height={328}
        className="pointer-events-none absolute right-0 bottom-[3.375rem] hidden h-[20.1875rem] w-[23rem] max-w-none to-laptop:block to-tablet:bottom-0 to-tablet:h-[20.5rem] to-phone:hidden"
      />
      <LineFlow {...flowLeft} avoid="left" reveal="down" strands={22} className="to-phone:hidden" />
      <LineFlow {...flowRight} avoid="right" reveal="up" strands={22} className="to-phone:hidden" />
      <Reveal className="relative flex flex-col items-center pb-12 to-laptop:pb-10 to-phone:pt-4 to-phone:pb-8">
        <Pill label={content.label} icon="/assets/getting-started/icon-getting-started.svg" tone="glass" />
        <h2 className="w-200 pt-6 text-center text-h2 to-laptop:w-164 to-laptop:text-h2-md to-tablet:w-143 to-phone:w-full to-phone:pt-4">{content.title}</h2>
      </Reveal>

      <StepsTrack className="relative mx-auto w-260 to-laptop:w-full to-phone:hidden">
        <StepsPlate className="rounded-panel bg-on-dark/7 backdrop-blur-md" />
        {content.steps.map((step, i) => {
          const textLeft = i % 2 === 1;
          return (
            <Reveal
              key={step.number}
              tag="li"
              delay={60}
              className={`grid grid-cols-[26.75rem_3.5rem_26.75rem] gap-x-8 to-laptop:grid-cols-[22.5rem_3.5rem_22.5rem] to-tablet:grid-cols-[14.5rem_3.5rem_14.5rem] relative rounded-panel p-8 ${i === 0 ? "bg-on-dark/7 backdrop-blur-md [[data-plate]_&]:bg-transparent [[data-plate]_&]:backdrop-blur-none" : ""}`}
            >
              <div
                className={`col-start-1 row-start-1 self-center justify-self-end ${textLeft ? "w-100 text-right to-laptop:w-full" : "flex items-center gap-4"}`}
              >
                {textLeft ? (
                  <>
                    <h3 className="text-title-m font-medium">{step.title}</h3>
                    <p className="pt-2 text-body-m text-on-dark-muted">{step.text}</p>
                  </>
                ) : (
                  <>
                    <span className="text-body-s text-on-dark-muted">{step.duration}</span>
                    <StepTile first={i === 0} className="flex size-16 items-center justify-center rounded-panel text-title-m font-medium">
                      {step.number}
                    </StepTile>
                  </>
                )}
              </div>
              <div className={`col-start-3 row-start-1 self-center ${textLeft ? "flex items-center gap-4" : ""}`}>
                {textLeft ? (
                  <>
                    <StepTile first={i === 0} className="flex size-16 items-center justify-center rounded-panel text-title-m font-medium">
                      {step.number}
                    </StepTile>
                    <span className="text-body-s text-on-dark-muted">{step.duration}</span>
                  </>
                ) : (
                  <>
                    <h3 className="text-title-m font-medium">{step.title}</h3>
                    <p className="w-100 pt-2 text-body-m text-on-dark-muted to-laptop:w-full">{step.text}</p>
                  </>
                )}
              </div>
            </Reveal>
          );
        })}
        <StepsLine className="absolute top-[4.8125rem] left-[32.46875rem] to-laptop:top-22 to-laptop:left-[28.25rem] h-[32.1875rem] to-laptop:h-[33rem] to-tablet:top-27 to-tablet:left-[20.25rem] to-tablet:h-[39.75rem] w-px border-l dashes-y dash-on-dark-muted/50" />
        <span aria-hidden className="absolute top-[4.25rem] left-[31.9375rem] to-laptop:top-[4.9375rem] to-laptop:left-[27.6875rem] to-tablet:top-[6.1875rem] to-tablet:left-[19.6875rem] size-4.5 rounded-full bg-accent-strong" />
        {markers.map((top) => (
          <span
            key={top}
            aria-hidden
            className={`absolute left-[32.0625rem] size-3.5 to-laptop:left-[27.8125rem] to-tablet:left-[19.8125rem] rounded-full border border-on-dark-muted bg-marker ${top}`}
          />
        ))}
      </StepsTrack>

      <StepsTrack className="relative hidden flex-col gap-2 to-phone:flex">
        <StepsPlate className="rounded-panel bg-on-dark/7 backdrop-blur-md" />
        {content.steps.map((step, i) => (
          <li key={step.number} className={`relative flex gap-4 overflow-hidden rounded-panel px-4 py-5 ${i === 0 ? "bg-on-dark/7 backdrop-blur-md [[data-plate]_&]:bg-transparent [[data-plate]_&]:backdrop-blur-none" : ""}`}>
            <StepTile first={i === 0} className="flex size-10 shrink-0 items-center justify-center rounded-control text-body-m font-medium">
              {step.number}
            </StepTile>
            <div className="min-w-0 flex-1 pt-2">
              {/* Figma's baseline row (5975:1057) is 25px — one more than the 24px title line. */}
              <div className="flex h-[1.5625rem] items-baseline gap-2 whitespace-nowrap">
                <h3 className="text-title-m font-medium">{step.title}</h3>
                <span className="text-body-s text-on-dark-muted">{step.duration}</span>
              </div>
              <p className="pt-2 text-body-m text-on-dark-muted">{step.text}</p>
            </div>
          </li>
        ))}
        {/* Connectors between the tiles, Figma 5975:1061–1063 (left 35.5, tops 68 / 277 / 486, 153 tall). */}
        {["top-17", "top-[17.3125rem]", "top-[30.375rem]"].map((top) => (
          <StepsLine key={top} className={`absolute left-[2.21875rem] h-[9.5625rem] w-px border-l dashes-y dash-on-dark-muted/50 ${top}`} />
        ))}
      </StepsTrack>
    </div>
  </section>
);
