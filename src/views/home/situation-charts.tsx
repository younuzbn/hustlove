import type { situations as situationsData } from "@/data/mocks/home";

import { CardStage, GrowBar } from "./card-chart-motion";

type Data = typeof situationsData;

const toRem = (px: number) => `${px / 16}rem`;

const ladderTone = {
  accent: "bg-(image:--gradient-bar)",
  "accent-strong": "bg-accent-strong",
  "chart-400": "bg-chart-400",
  "chart-300": "bg-chart-300",
  "chart-200": "bg-chart-200",
  "chart-100": "bg-chart-100",
} as const;

const Months = ({ labels }: { labels: readonly string[] }) => (
  <div className="flex pt-3 text-body-s text-muted to-laptop:gap-2 to-tablet:gap-0">
    {labels.map((label, i) => (
      <span key={i} className="flex-1 text-center">
        {label}
      </span>
    ))}
  </div>
);

/** Figma 5650:10 — six bills, one maturing each month. */
export const LadderChart = ({ bars }: { bars: Data["ladder"]["bars"] }) => (
  <div aria-hidden>
    <CardStage className="mt-5 flex h-27.5 items-end gap-2">
      {bars.map((bar, i) => (
        <GrowBar key={bar.month} index={i} className={`min-w-px flex-1 rounded-xs ${ladderTone[bar.tone]}`} style={{ height: toRem(bar.height) }} />
      ))}
    </CardStage>
    <Months labels={bars.map((bar) => bar.month)} />
  </div>
);

/** Figma 5651:10 — surplus placed in the four busy months. */
export const SeasonalChart = ({ bars }: { bars: Data["seasonal"]["bars"] }) => (
  <div aria-hidden>
    <CardStage className="mt-5 flex h-27.5 items-end gap-2">
      {bars.map((bar, i) => (
        <GrowBar
          key={i}
          index={i}
          className={`min-w-px flex-1 rounded-xs ${bar.placed ? "bg-(image:--gradient-bar)" : "bg-chart-100"}`}
          style={{ height: toRem(bar.height) }}
        />
      ))}
    </CardStage>
    <Months labels={bars.map((bar) => bar.month)} />
  </div>
);

/** Figma 5652:10 — bill bought → matures → VAT due. Coordinates are Figma's:
 *  the 361px track runs ~4px past the panel padding, as in the design.
 *  1024 frame (5934:8724): a 219px track, dates in 14px; 768 (5934:16044): 224px;
 *  390 (5934:23346): 178px. */
export const ReserveTimeline = ({ points }: { points: Data["reserve"]["points"] }) => {
  const [start, middle, end] = points;
  return (
    <CardStage className="relative mt-5 to-tablet:mt-4.5 to-phone:mt-5 h-[8.9375rem] w-[20.5rem] whitespace-nowrap to-laptop:w-full">
      <GrowBar index={0} axis="x" className="absolute top-19 to-phone:top-15 left-2 w-[19.5rem] border-t-2 border-chart-200 to-laptop:w-[12.6875rem] to-tablet:w-52 to-phone:w-[10.125rem]" />
      <GrowBar index={0} axis="x" after={360} className="absolute top-19 to-phone:top-15 left-[12.3125rem] w-[7.6875rem] border-t-2 border-accent to-laptop:left-[7.5rem] to-laptop:w-[5.6875rem] to-tablet:left-30 to-tablet:w-24 to-phone:left-[5.5625rem] to-phone:w-[5.0625rem]" />
      <GrowBar index={0} fade className="absolute top-17.25 to-phone:top-13.25 left-0 size-4 rounded-tile border-2 border-accent bg-surface-soft" />
      <GrowBar index={0} fade after={300} className="absolute top-17.25 to-phone:top-13.25 left-[11.8125rem] size-4 to-laptop:left-[7rem] to-tablet:left-28 to-phone:left-[5.0625rem] rounded-tile border-2 border-accent bg-accent" />
      <GrowBar index={0} fade after={600} className="absolute top-17.25 to-phone:top-13.25 left-[19.5rem] size-4 to-laptop:left-[12.6875rem] to-tablet:left-52 to-phone:left-[10.125rem] rounded-tile border-2 border-ink bg-ink" />
      {/* Labels never wrap: each column is as wide as its longest line — the first sits left on
          its dot, the middle centres on its dot, the last ends on the right edge of the last dot. */}
      <p className="absolute top-24 to-phone:top-20 left-0">
        <span className="block text-body-m font-medium text-ink">{start.date}</span>
        <span className="block text-body-s text-muted to-phone:hidden">{start.label}</span>
        {/* 390 (5934:23347) shortens the first label. */}
        <span className="hidden text-body-s text-muted to-phone:block">{start.labelShort}</span>
      </p>
      <p className="absolute top-24 to-phone:top-20 left-[12.3125rem] -translate-x-1/2 text-center to-laptop:left-[7.5rem] to-tablet:left-30 to-phone:left-[5.5625rem]">
        <span className="block text-body-m font-medium text-ink">{middle.date}</span>
        <span className="block text-body-s text-muted">{middle.label}</span>
      </p>
      <p className="absolute top-24 to-phone:top-20 left-[20.5rem] -translate-x-full text-right to-laptop:left-[13.6875rem] to-tablet:left-56 to-phone:left-[11.125rem]">
        <span className="block text-body-m font-medium text-ink">{end.date}</span>
        <span className="block text-body-s text-muted">{end.label}</span>
      </p>
    </CardStage>
  );
};
