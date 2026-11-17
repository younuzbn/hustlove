import { ButtonLink } from "@/components/ui/button-link";
import { Pill } from "@/components/ui/pill";
import { OpenUp } from "@/components/ui/open-up";
import { Reveal } from "@/components/ui/reveal";
import { TextBreaks } from "@/components/ui/text-breaks";
import type { pricing as pricingData, security as securityData } from "@/data/mocks/home";

import { CardStage, GrowBar } from "./card-chart-motion";
import { CountUp } from "./count-up";
import { SecurityCube } from "./security-cube";

export interface SecurityPricingSectionProps {
  security: typeof securityData;
  pricing: typeof pricingData;
}

/** Figma 5628:8750 — security card + pricing card, 460px row; 1024 frame 5934:8751 — 497px row,
 *  no cube, pricing stacked; 768 frame 5934:16071 — 506px row, 32px padding; 390 frame
 *  5934:23379 — one column, cards size to their content. */
export const SecurityPricingSection = ({ security, pricing }: SecurityPricingSectionProps) => (
  <section className="grid grid-cols-2 grid-rows-[28.75rem] gap-5 px-page pt-27.5 to-laptop:grid-rows-[31.0625rem] to-laptop:px-5 to-laptop:pt-20 to-tablet:grid-rows-[31.625rem] to-phone:grid-cols-1 to-phone:grid-rows-none to-phone:pt-14">
    {/* The security and pricing cards tilt back and flatten together, as one row. */}
    <OpenUp />
    <Reveal
      tag="article"
      id="security"
      className="relative flex flex-col items-start justify-between overflow-hidden rounded-card bg-(image:--gradient-security) p-10 text-on-dark to-tablet:p-8 to-phone:justify-start to-phone:gap-8 to-phone:p-6"
    >
      {/* Figma 5634:735: the 690×460 cube art keeps its size and is clipped by the 670px card. */}
      <SecurityCube className="pointer-events-none absolute top-0 left-0 h-115 w-[43.125rem] max-w-none to-laptop:hidden" />
      <Pill label={security.label} icon="/assets/security-pricing/icon-security.svg" tone="glass" className="relative" />
      <div className="relative w-77.5 to-tablet:w-full to-tablet:max-w-77.5">
        <h3 className="text-h3 to-laptop:text-h3-md">
          <TextBreaks text={security.title} />
        </h3>
        <p className="pt-4 pb-8 text-body-m">{security.text}</p>
        <div className="h-14">
          <ButtonLink href={security.cta.href} variant="light" size="l" className="to-tablet:w-full to-tablet:justify-center">
            {security.cta.label}
          </ButtonLink>
        </div>
      </div>
    </Reveal>

    <Reveal tag="article" id="pricing" delay={90} className="flex flex-col items-start justify-start gap-6 overflow-hidden rounded-card bg-surface p-10 to-tablet:p-8 to-phone:p-6">
      <Pill label={pricing.label} icon="/assets/security-pricing/icon-pricing.svg" tone="soft" />
      <div className="flex w-full items-end justify-between to-laptop:flex-col to-laptop:items-start to-laptop:gap-8 to-phone:h-[10.125rem]">
        <p className="text-number-xl font-light whitespace-nowrap text-ink to-laptop:text-number-xl-md"><CountUp value={pricing.fee} /></p>
        <p className="w-62.5 text-body-m text-muted to-laptop:w-full">
          <TextBreaks text={pricing.text} />
        </p>
      </div>
      <div className="h-27 w-full to-laptop:h-[5.4375rem] to-tablet:h-[6.625rem] to-phone:h-auto">
        <p className="text-body-s whitespace-nowrap text-muted to-tablet:whitespace-normal">{pricing.example}</p>
        <CardStage className="mt-3 flex h-2 gap-1 to-tablet:w-[17.125rem] to-phone:w-full" aria-hidden>
          <GrowBar index={0} axis="x" className="min-w-px rounded-full bg-accent" style={{ flexGrow: pricing.split.kept, flexBasis: 0 }} />
          <GrowBar index={1} axis="x" className="min-w-px rounded-full bg-highlight" style={{ flexGrow: pricing.split.fee, flexBasis: 0 }} />
        </CardStage>
        <div className="flex h-[2.34375rem] justify-between pt-3 text-body-m whitespace-nowrap to-laptop:h-auto to-phone:h-9">
          <p className="text-ink">
            <CountUp value={pricing.kept.value} /> <span className="text-muted">{pricing.kept.label}</span>
          </p>
          <p className="text-muted">
            {pricing.feeLabel.label} <span className="text-ink"><CountUp value={pricing.feeLabel.value} /></span>
          </p>
        </div>
      </div>
      <ButtonLink href={pricing.cta.href} variant="dark" size="l" className="to-tablet:w-full to-tablet:justify-center">
        {pricing.cta.label}
      </ButtonLink>
    </Reveal>
  </section>
);
