import Image from "next/image";

import { ButtonLink } from "@/components/ui/button-link";
import { Pill } from "@/components/ui/pill";
import type { dashboard as dashboardData, header as headerData, hero as heroData } from "@/data/mocks/home";

import { HeroDashboard } from "./hero-dashboard";
import { HeroItem, HeroTitle } from "./hero-entrance";
import { HeroHalftone } from "./hero-halftone";
import { HeroParallax } from "./hero-parallax";
import { SiteHeader } from "./site-header";

export interface HeroSectionProps {
  header: typeof headerData;
  content: typeof heroData;
  dashboard: typeof dashboardData;
}

/** Figma 5628:5221 — first screen. The entrance (`hero-entrance.tsx`) keeps the LCP copy server-rendered. */
export const HeroSection = ({ header, content, dashboard }: HeroSectionProps) => (
  <section id="top" className="relative overflow-x-clip bg-(image:--gradient-hero) px-page to-laptop:px-5">
    {/* >1920: the halftone stays centred on the content column. No translate — the canvas copies
        the image's offsetLeft, which a transform would not move. */}
    <HeroHalftone
      variants={[
        {
          src: "/assets/hero/hero-halftone-1440.svg",
          width: 1440,
          height: 940,
          className: "pointer-events-none absolute top-0 left-[max(0px,calc(50%-45rem))] h-235 w-full max-w-360 to-laptop:hidden",
        },
        {
          src: "/assets/hero/hero-halftone-1024.svg",
          width: 1024,
          height: 756,
          className:
            "pointer-events-none absolute inset-x-0 top-0 hidden h-[47.25rem] w-full to-laptop:block to-tablet:hidden",
        },
        /* 768 (5946:2746) and 390: the halftone is hidden. */
      ]}
    />
    <div className="relative">
      <SiteHeader content={header} />
      <div className="flex flex-col items-center pt-27.5 pb-47.5 text-center to-laptop:pt-20 to-laptop:pb-32.5 to-tablet:pb-20 to-phone:pt-14 to-phone:pb-14 text-on-dark">
        <HeroItem part="pill" className="flex" bare>
          <Pill label={content.label} icon="/assets/hero/icon-bank.svg" tone="glass" />
        </HeroItem>
        <HeroItem part="title" tag="h1" className="w-225 pt-10 text-h1 to-laptop:w-180 to-laptop:text-h1-md to-tablet:w-full">
          <HeroTitle text={content.title} />
        </HeroItem>
        <HeroItem part="lead" tag="p" className="w-155 pt-8 text-body-l to-phone:w-full">{content.lead}</HeroItem>
        <HeroItem part="actions" className="flex justify-center gap-3 pt-10 to-phone:w-full to-phone:flex-col">
          <ButtonLink href={content.primary.href} variant="primary" size="l" className="to-phone:justify-center">
            {content.primary.label}
            <Image src="/assets/hero/icon-arrow-right.svg" alt="" width={16} height={16} className="size-4" />
          </ButtonLink>
          <ButtonLink href={content.secondary.href} variant="outline" size="l" className="to-phone:justify-center">
            {content.secondary.label}
          </ButtonLink>
        </HeroItem>
      </div>
      {/* Figma: the 1349px content fills the 1349px section; so do 1024 (5934:3135) and 768; at 390 it runs 3px past the 1595px section. */}
      {/* Parallax: the dashboard lags the scroll by 0.15 (≥769px), easing out at 80px so it
          never reaches the next section's heading (110px below it). */}
      <HeroParallax lag={0.15} max={5} className="to-phone:-mb-[0.1875rem]">
        <HeroItem part="dashboard">
          <HeroDashboard content={dashboard} />
        </HeroItem>
      </HeroParallax>
    </div>
  </section>
);
