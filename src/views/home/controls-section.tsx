import { CardHover, cardHoverShadow } from "@/components/ui/card-hover";
import { Reveal } from "@/components/ui/reveal";
import { TextBreaks } from "@/components/ui/text-breaks";
import type { controls as controlsData } from "@/data/mocks/home";

import { CardStage, StaggerTile } from "./card-chart-motion";
import { ControlsRecallCard } from "./controls-recall-card";
import { CountUp } from "./count-up";
import { FloorChart } from "./floor-chart";
import { SectionHeading } from "./section-heading";

export interface ControlsSectionProps {
  content: typeof controlsData;
}

const card = `flex flex-col justify-between overflow-hidden rounded-card bg-surface p-8 ${cardHoverShadow}`;

const dayCell = {
  done: "bg-accent text-on-dark",
  today: "bg-highlight text-ink",
  next: "border border-accent text-accent",
  off: "text-faint",
} as const;

/** Figma 5628:6252 "What you control" — bento grid, rows 217 / 340 / 146;
 *  1024 frame 5934:4138 — rows 269 / 358 / 218; 768 frame 5934:11458 — two columns,
 *  rows 302 / 544 / 212 (sweep + maturity, floor + recall, approvers); 390 frame 5934:18770 —
 *  one column: floor, sweep, maturity, recall, approvers. */
export const ControlsSection = ({ content }: ControlsSectionProps) => {
  const { floor, sweep, maturity, recall, approvers } = content;
  return (
    <section className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
      <SectionHeading
        label={content.label}
        icon="/assets/controls/icon-what-you-control.svg"
        title={content.title}
        titleClassName="to-laptop:w-[37.1875rem]"
      />
      <Reveal className="grid grid-cols-3 grid-rows-[13.5625rem_21.25rem_9.125rem] gap-5 to-laptop:grid-rows-[16.8125rem_22.375rem_13.625rem] to-tablet:grid-cols-2 to-tablet:grid-rows-[18.875rem_34rem_13.25rem] to-phone:grid-cols-1 to-phone:grid-rows-none">
        <article className={`${card} row-span-3 min-h-140 to-tablet:col-start-1 to-tablet:row-span-1 to-tablet:row-start-2 to-tablet:min-h-0 to-phone:row-start-1 to-phone:justify-start to-phone:gap-8 to-phone:p-6`}>
          <CardHover>
          <div>
            <h3 className="w-41.25 text-title-m font-medium text-ink">{floor.title}</h3>
            <p className="pt-3 text-body-m text-muted">{floor.text}</p>
          </div>
          <FloorChart bars={floor.bars} marker={floor.marker} />
          </CardHover>
        </article>

        <article className={`${card} to-tablet:col-start-1 to-tablet:row-start-1 to-phone:row-start-2 to-phone:justify-start to-phone:gap-6 to-phone:p-6`}>
          <CardHover>
          <div>
            <h3 className="text-title-m font-medium whitespace-nowrap text-ink to-laptop:whitespace-normal">{sweep.title}</h3>
            <p className="h-8.5 pt-2 text-body-m whitespace-nowrap text-muted to-laptop:h-auto to-laptop:whitespace-normal to-tablet:h-8 to-tablet:pt-2 to-tablet:whitespace-nowrap">
              {sweep.text}
            </p>
          </div>
          {/* 1440: the seven days fill 360 of the 376px row (Figma 5684:678). */}
          <CardStage tag="ol" className="flex gap-2 pr-4 to-laptop:pr-0">
            {sweep.days.map((d, i) => (
              <StaggerTile key={d.date} index={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-body-s text-muted">{d.day}</span>
                <span className={`flex h-10 w-full items-center justify-center rounded-control text-body-m ${dayCell[d.state]}`}>
                  {d.date}
                </span>
              </StaggerTile>
            ))}
          </CardStage>
          </CardHover>
        </article>

        <ControlsRecallCard
          content={recall}
          className="col-start-3 row-span-2 row-start-1 to-tablet:col-start-2 to-tablet:row-span-1 to-tablet:row-start-2 to-phone:col-start-1 to-phone:row-start-4"
        />

        <article
          className={`${card} col-start-2 row-start-2 min-h-85 to-tablet:row-start-1 to-tablet:min-h-0 to-tablet:justify-start to-tablet:gap-8 to-phone:col-start-1 to-phone:row-start-3 to-phone:gap-6 to-phone:p-6`}
        >
          <CardHover />
          <div>
            <h3 className="text-title-m font-medium text-ink">{maturity.title}</h3>
            <p className="h-7.5 pt-1 text-body-m whitespace-nowrap text-muted">{maturity.text}</p>
          </div>
          {/* 1440: the unit is placed absolutely; 1024 sets both on one baseline (5934:4222). */}
          <p className="relative h-[6.974625rem] font-light whitespace-nowrap text-ink to-laptop:flex to-laptop:h-auto to-laptop:items-baseline to-laptop:gap-2">
            {/* mr: Figma leaves the trailing -0.05em tracking out of the box, the browser doesn't. */}
            <span className="absolute top-0 left-0 text-number-xl to-laptop:static to-laptop:mr-[0.05em] to-laptop:text-number-xl-md">
              <CountUp value={maturity.value} />
            </span>
            <span className="absolute top-17.25 left-36.75 text-number-m to-laptop:static to-laptop:text-number-m-md">
              {maturity.unit}
            </span>
          </p>
          <p className="text-body-m text-muted">
            <TextBreaks text={maturity.note} />
          </p>
        </article>

        <article className={`col-span-2 col-start-2 row-start-3 to-tablet:col-start-1 to-phone:col-span-1 to-phone:row-start-5 to-phone:justify-start to-phone:gap-6 to-phone:p-6 flex items-center justify-between overflow-hidden rounded-card bg-surface p-8 to-laptop:flex-col to-laptop:items-start ${cardHoverShadow}`}>
          <CardHover />
          <div className="w-111.5 to-phone:w-full">
            <h3 className="text-title-m font-medium whitespace-nowrap text-ink to-phone:whitespace-normal">{approvers.title}</h3>
            <p className="pt-1 text-body-m text-muted">{approvers.text}</p>
          </div>
          <div className="flex items-center gap-3 text-body-m to-phone:gap-1">
            <span className="flex h-12 items-center rounded-control bg-surface-soft px-4 text-ink to-phone:h-10 to-phone:px-3 to-phone:text-body-s to-phone:font-medium">{approvers.roles[0]}</span>
            <span className="text-muted">+</span>
            <span className="flex h-12 items-center rounded-control bg-surface-soft px-4 text-ink to-phone:h-10 to-phone:px-3 to-phone:text-body-s to-phone:font-medium">{approvers.roles[1]}</span>
          </div>
        </article>
      </Reveal>
    </section>
  );
};
