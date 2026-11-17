import Image from "next/image";

import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import type { newsletter as newsletterData } from "@/data/mocks/home";

import { NewsletterEnvelope } from "./newsletter-envelope";
import { NewsletterForm } from "./newsletter-form";

export interface NewsletterSectionProps {
  content: typeof newsletterData;
}

/** Figma 5628:8812 "Monthly note" — sign-up card with the envelope visual; 1024 frame 5934:8792
 *  keeps the 1440 rhythm (28px inset, form at the foot) in a 502px column; 768 frame 5934:16112
 *  narrows the visual to a 240px column with the envelope at 0.4325; 390 frame 5934:23420 puts a
 *  160px visual on top with the envelope at 0.34. */
export const NewsletterSection = ({ content }: NewsletterSectionProps) => (
  <section className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
    <Reveal className="flex gap-3 overflow-hidden rounded-card bg-surface p-3 to-phone:flex-col">
      <div className="flex flex-1 flex-col justify-between gap-8 p-7 to-laptop:w-[31.375rem] to-laptop:flex-none to-tablet:w-auto to-tablet:flex-1 to-tablet:justify-start to-phone:p-3">
        <div>
          <Pill label={content.label} icon="/assets/newsletter/icon-monthly-note.svg" tone="soft" />
          {/* Figma 5628:8819 / 5934:8799 / 5975:1992: Monthly note is an H3 (482px wide at 1440). */}
          <h2 className="w-120.5 pt-5 text-h3 text-ink to-laptop:w-full to-laptop:text-h3-md">{content.title}</h2>
          <p className="w-110 pt-4 text-body-m text-muted to-laptop:w-full">{content.text}</p>
        </div>
        <div>
          <NewsletterForm placeholder={content.placeholder} submit={content.submit} />
          <p className="pt-4 text-body-s text-muted">{content.note}</p>
        </div>
      </div>

      <div className="relative min-h-120 flex-1 overflow-hidden rounded-tile to-laptop:h-[29.3125rem] to-laptop:min-h-0 to-laptop:self-start to-tablet:h-auto to-tablet:w-60 to-tablet:flex-none to-tablet:self-stretch to-phone:order-first to-phone:h-40 to-phone:w-full bg-(image:--gradient-newsletter)" aria-hidden data-envelope-panel>
        <Image
          src="/assets/newsletter/newsletter-dots.svg"
          alt=""
          width={700}
          height={520}
          className="absolute top-0 -left-7.75 h-130 w-175 max-w-none to-laptop:-top-[1.5625rem] to-laptop:-left-[8.3125rem] to-tablet:-top-16 to-tablet:-left-[14.375rem] to-tablet:h-130 to-tablet:w-175 to-phone:-top-45 to-phone:-left-[11.6875rem] to-phone:h-130 to-phone:w-175"
        />
        {/* 1024 (5934:9718): the same envelope, centred and scaled to 0.84.
            768 (5934:16112): scaled to 0.4325 from its top-left at 30 / 134.95px.
            390 (5975:1977): centred again and scaled to 0.34. */}
        <div className="absolute top-[6.375625rem] left-[6.9375rem] flex h-[18.16025rem] w-[25.848875rem] items-center justify-center to-laptop:top-1/2 to-laptop:left-1/2 to-laptop:-translate-x-1/2 to-laptop:-translate-y-1/2 to-laptop:scale-[0.84] to-tablet:top-[8.434125rem] to-tablet:left-[1.875rem] to-tablet:translate-x-0 to-tablet:translate-y-0 to-tablet:origin-top-left to-tablet:scale-[0.4325] to-phone:top-1/2 to-phone:left-1/2 to-phone:-translate-x-1/2 to-phone:-translate-y-1/2 to-phone:origin-center to-phone:scale-[0.34]">
          <NewsletterEnvelope caption={content.envelope} />
        </div>
      </div>
    </Reveal>
  </section>
);
