"use client";

import { animated } from "@react-spring/web";
import { useRef, useState } from "react";

import { useSlidingPill } from "@/hooks/use-sliding-pill";

import type { BookingSlots } from "./booking-section";

export interface BookingWidgetProps {
  content: BookingSlots;
}

const cell = "rounded-control bg-surface transition-colors duration-[var(--duration-fast)] ease-entrance";
const cellIdle = "text-ink hover:text-accent";
const cellOn = "text-on-dark";
/** The navy highlight: painted by the cell itself until the sliding pill is measured. */
const cellOnStatic = "bg-marker";
const pillClass = "pointer-events-none absolute top-0 left-0 rounded-control bg-marker";

/** Figma "Booking" card (5856:4597): pick a day, then a time. The navy highlight slides
 *  between the cells on a spring (labels sit above it). */
export const BookingWidget = ({ content }: BookingWidgetProps) => {
  const [day, setDay] = useState(content.defaultDay);
  const [time, setTime] = useState(content.defaultTime);
  const daysRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const dayPill = useSlidingPill(daysRef, day);
  const timePill = useSlidingPill(timesRef, time);

  return (
    <div className="flex w-155 max-w-full shrink-0 flex-col gap-6 rounded-panel bg-surface-soft p-8 text-ink to-laptop:w-auto to-tablet:w-full to-phone:gap-5 to-phone:p-5">
      <div className="flex h-7 items-center justify-between gap-4 to-laptop:h-6.5 to-laptop:items-baseline to-tablet:h-7 to-tablet:items-center to-phone:h-auto to-phone:flex-col to-phone:items-start to-phone:gap-1">
        <p className="text-title-m font-medium whitespace-nowrap">{content.title}</p>
        <p className="text-body-s whitespace-nowrap text-muted">{content.range}</p>
      </div>
      <div ref={daysRef} role="group" aria-label={content.title} className="relative flex gap-2">
        {dayPill.measured && <animated.span aria-hidden className={pillClass} style={dayPill.style} />}
        {content.days.map((d, i) => {
          const on = i === day;
          const lit = dayPill.measured ? on && dayPill.landed === i : on;
          return (
            <button
              key={`${d.weekday}${d.date}`}
              ref={dayPill.item(i)}
              type="button"
              aria-pressed={on}
              onClick={() => setDay(i)}
              className={`flex h-17 min-w-0 flex-1 flex-col to-tablet:w-auto to-tablet:flex-1 items-center justify-center ${cell} ${lit ? cellOn : cellIdle} ${on && !dayPill.measured ? cellOnStatic : ""}`}
            >
              <span className={`relative flex h-5 items-center text-body-s transition-colors duration-[var(--duration-fast)] ease-entrance ${lit ? "text-on-dark-soft" : "text-muted"}`}>{d.weekday}</span>
              <span className="relative flex h-7 items-center text-day font-medium">{d.date}</span>
            </button>
          );
        })}
      </div>
      <div role="group" aria-label={content.days[day] ? `${content.days[day].weekday} ${content.days[day].date}` : undefined} ref={timesRef} className="relative -mt-3 grid grid-cols-3 gap-2 to-tablet:mt-0">
        {timePill.measured && <animated.span aria-hidden className={pillClass} style={timePill.style} />}
        {content.times.map((t, i) => {
          const on = i === time;
          const lit = timePill.measured ? on && timePill.landed === i : on;
          return (
            <button
              key={t}
              ref={timePill.item(i)}
              type="button"
              aria-pressed={on}
              onClick={() => setTime(i)}
              className={`flex h-11 items-center justify-center text-body-s font-medium ${cell} ${lit ? cellOn : cellIdle} ${on && !timePill.measured ? cellOnStatic : ""}`}
            >
              <span className="relative">{t}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 flex h-5.5 items-center text-body-s text-muted to-laptop:h-auto to-phone:mt-1">{content.note}</p>
    </div>
  );
};
