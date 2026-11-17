import type { ReactNode } from "react";

import { CardRail } from "@/components/ui/card-rail";
import { CardHover, cardHoverShadow } from "@/components/ui/card-hover";
import { Reveal } from "@/components/ui/reveal";
import type { situations as situationsData } from "@/data/mocks/home";

import { SectionHeading } from "./section-heading";
import { LadderChart, ReserveTimeline, SeasonalChart } from "./situation-charts";

export interface SituationsSectionProps {
  content: typeof situationsData;
}

interface SituationCardProps {
  caption: string;
  value: string;
  eyebrow: string;
  title: string;
  text: string;
  panelClassName?: string;
  delay: number;
  children: ReactNode;
}

const SituationCard = ({ caption, value, eyebrow, title, text, panelClassName = "", delay, children }: SituationCardProps) => (
  <Reveal tag="article" delay={delay} className={`flex flex-col overflow-hidden rounded-card bg-surface p-8 to-phone:p-6 ${cardHoverShadow}`}>
    <CardHover>
    <div className={`flex flex-col rounded-panel bg-surface-soft p-6 to-laptop:p-4 ${panelClassName}`}>
      <div className="flex h-6.5 items-center justify-between whitespace-nowrap to-laptop:items-baseline to-tablet:h-6 to-phone:h-auto to-phone:flex-col to-phone:items-start to-phone:whitespace-normal">
        {/* 390 (5934:23254): caption above the value. */}
        <span className="text-body-s text-muted">{caption}</span>
        <span className="text-body-m font-medium text-ink to-phone:whitespace-nowrap">{value}</span>
      </div>
      {children}
    </div>
    <p className="pt-10 text-body-s text-accent">{eyebrow}</p>
    <h3 className="pt-3 text-title-l text-ink to-laptop:text-title-l-md">{title}</h3>
    <p className="pt-4 text-body-m text-muted">{text}</p>
    </CardHover>
  </Reveal>
);

/** Figma 5628:8637 "When it makes sense" — three situation cards. */
export const SituationsSection = ({ content }: SituationsSectionProps) => {
  const { ladder, seasonal, reserve } = content;
  return (
    <section className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
      <SectionHeading label={content.label} icon="/assets/situations/icon-when-it-makes-sense.svg" title={content.title} />
      {/* 768 frame 5934:15946: the cards become a sideways rail. */}
      <CardRail className="grid grid-cols-3 grid-rows-[33.125rem] gap-5 to-laptop:grid-rows-none">
        <SituationCard {...ladder} delay={0}>
          <LadderChart bars={ladder.bars} />
        </SituationCard>
        <SituationCard {...seasonal} delay={90}>
          <SeasonalChart bars={seasonal.bars} />
        </SituationCard>
        <SituationCard {...reserve} delay={180} panelClassName="h-[14.8125rem] to-laptop:h-[13.8125rem] to-phone:h-auto">
          <ReserveTimeline points={reserve.points} />
        </SituationCard>
      </CardRail>
    </section>
  );
};
