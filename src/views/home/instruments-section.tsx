import { CardRail } from "@/components/ui/card-rail";
import { CardHover, cardHoverShadow } from "@/components/ui/card-hover";
import { Reveal } from "@/components/ui/reveal";
import type { instruments as instrumentsData } from "@/data/mocks/home";

import { CountUp } from "./count-up";
import { InstrumentArt } from "./instrument-art";
import { SectionHeading } from "./section-heading";

export interface InstrumentsSectionProps {
  content: typeof instrumentsData;
}

const gradient = {
  bills: "bg-(image:--gradient-bills)",
  funds: "bg-(image:--gradient-funds)",
  overnight: "bg-(image:--gradient-overnight)",
} as const;

/** Figma 5628:6388 "Where it goes" — three instrument cards; 1024 frame 5934:4760;
 *  768 frame 5934:12080 — the cards become a sideways rail. */
export const InstrumentsSection = ({ content }: InstrumentsSectionProps) => (
  <section id="instruments" className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
    <SectionHeading
      label={content.label}
      icon="/assets/instruments/icon-where-it-goes.svg"
      title={content.title}
      lead={content.lead}
    />
      <CardRail className="grid grid-cols-3 grid-rows-[35.5rem] gap-5 to-laptop:grid-rows-none">
        {content.items.map((item, i) => (
          <Reveal key={item.name} tag="article" delay={i * 90} className={`flex flex-col overflow-hidden rounded-card bg-surface px-3 pt-3 pb-6 ${cardHoverShadow}`}>
            <CardHover />
            <div className={`relative flex h-77 shrink-0 items-center justify-center overflow-hidden rounded-tile ${gradient[item.gradient]}`}>
              <InstrumentArt kind={item.gradient} />
            </div>
            <div className="px-5 pt-6">
              {/* 1440: name ↔ share on one row, note below. 1024: share, then name + note (5934:5479). */}
              <div className="grid grid-cols-[1fr_auto] grid-rows-[2.75rem_2.125rem] whitespace-nowrap text-ink to-laptop:h-[8.375rem] to-tablet:h-[7.75rem] to-laptop:grid-cols-1 to-laptop:grid-rows-none to-laptop:content-start">
                <h3 className="col-start-1 row-start-1 pt-2.25 text-title-m font-medium to-laptop:row-start-2 to-laptop:pt-4">
                  {item.name}
                </h3>
                <p className="col-start-2 row-start-1 text-number-m font-light to-laptop:col-start-1 to-laptop:text-number-m-md">
                  <CountUp value={item.share} />
                </p>
                <p className="col-span-2 row-start-2 pt-2 text-body-m text-muted to-laptop:col-span-1 to-laptop:pt-1 to-laptop:row-start-3 to-laptop:w-52.5 to-laptop:whitespace-normal to-phone:w-full">
                  {item.note}
                </p>
              </div>
              <dl className="mt-5 border-t dashes-x dash-line-dashed text-body-m">
                {item.rows.map((row, r) => (
                  <div
                    key={row.label}
                    className={`flex justify-between to-laptop:flex-col to-laptop:gap-1 ${r === 0 ? "border-b dashes-x dash-line-dashed py-4" : "pt-4"}`}
                  >
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        ))}
      </CardRail>
  </section>
);
