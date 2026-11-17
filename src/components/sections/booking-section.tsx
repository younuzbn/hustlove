import Image from "next/image";

import { ButtonLink } from "@/components/ui/button-link";
import { Pill } from "@/components/ui/pill";
import { OpenUp } from "@/components/ui/open-up";
import { Reveal } from "@/components/ui/reveal";
import { TextBreaks } from "@/components/ui/text-breaks";
import type { NavLink } from "@/data/mocks/home";
import { HeadingFrame, HeadingLines } from "@/views/home/section-heading-motion";

import { BookingWidget } from "./booking-widget";

export interface BookingDay {
  /** "Mon" */
  weekday: string;
  /** "13" */
  date: string;
}

export interface BookingSlots {
  /** "Treasury desk · 30 min" */
  title: string;
  /** "Oct 13–17" */
  range: string;
  days: BookingDay[];
  /** "09:30" … — laid out three to a row. */
  times: string[];
  /** Index into `days` selected on load. */
  defaultDay: number;
  /** Index into `times` selected on load. */
  defaultTime: number;
  note: string;
}

export interface BookingContent {
  /** Chip text ("Next step"). */
  label: string;
  /** H2 — "\n" forces a line break (TextBreaks markers work too). */
  title: string;
  /** Lead — TextBreaks markers work here too. */
  text: string;
  primary: NavLink;
  secondary: NavLink;
  booking: BookingSlots;
}

export interface BookingSectionProps {
  content: BookingContent;
}

/**
 * "Next step" CTA + booking widget — Figma 5842:2923 (Pricing) and 5874:2982
 * (Company): same block, different copy. Anchored at `#book`. The title lines
 * rise from masks like the home section headings.
 */
export const BookingSection = ({ content }: BookingSectionProps) => (
  <section id="book" className="px-page pt-27.5 to-laptop:px-5 to-laptop:pt-20 to-phone:pt-14">
    <Reveal className="flex gap-10 rounded-card bg-(image:--gradient-booking) p-10 text-on-dark to-laptop:grid to-laptop:grid-cols-2 to-laptop:gap-10 to-tablet:flex to-tablet:flex-col to-tablet:gap-10 to-phone:gap-8 to-phone:p-6">
      <OpenUp />
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-10 to-laptop:gap-4 to-tablet:items-center to-tablet:gap-8 to-tablet:text-center to-phone:items-stretch to-phone:gap-8">
        <HeadingFrame className="flex w-full flex-col items-start gap-6 to-tablet:items-center to-tablet:gap-8">
          <Pill label={content.label} icon="/assets/getting-started/icon-getting-started.svg" tone="glass" />
          <h2 className="w-155 max-w-full text-h3 to-laptop:w-150 to-laptop:text-h3-md">
            <HeadingLines text={content.title} />
          </h2>
          <p className="-mt-2 w-155 max-w-full text-body-m text-on-dark-soft to-laptop:w-140 to-tablet:mt-0">
            <TextBreaks text={content.text} />
          </p>
        </HeadingFrame>
        <div className="flex flex-wrap gap-3 to-tablet:justify-center to-phone:flex-col">
          <ButtonLink href={content.primary.href} variant="primary" size="l" className="to-phone:justify-center">
            {content.primary.label}
            <Image src="/assets/hero/icon-arrow-right.svg" alt="" width={16} height={16} className="size-4" />
          </ButtonLink>
          <ButtonLink href={content.secondary.href} variant="outline" size="l" className="to-phone:justify-center">
            {content.secondary.label}
          </ButtonLink>
        </div>
      </div>
      <BookingWidget content={content.booking} />
    </Reveal>
  </section>
);
