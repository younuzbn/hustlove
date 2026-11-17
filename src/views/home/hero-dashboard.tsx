import Image from "next/image";

import type { dashboard as dashboardData } from "@/data/mocks/home";

import { CardStage, GrowBar } from "./card-chart-motion";
import { CountUp } from "./count-up";
import { DashboardChart } from "./dashboard-chart";
import { DashboardTilt } from "./hero-dashboard-tilt";
import { RangeSwitch } from "./range-switch";

export interface HeroDashboardProps {
  content: typeof dashboardData;
}

const allocationTone = {
  surface: "bg-surface",
  "chart-300": "bg-chart-300",
  "chart-400": "bg-chart-400",
} as const;

/** Figma 5628:6160 — the demo account card under the hero copy. */
export const HeroDashboard = ({ content }: HeroDashboardProps) => (
  <DashboardTilt className="flex gap-10 overflow-hidden rounded-card bg-(image:--gradient-dashboard) p-10 text-on-dark to-laptop:flex-col to-laptop:gap-10 to-phone:gap-8 to-phone:p-6">
    {/* 1440: one column beside the chart. 1024: a row above it (5934:4047). */}
    <div className="flex w-100 shrink-0 flex-col justify-between to-laptop:w-full to-laptop:flex-row to-laptop:items-start to-tablet:gap-10 to-phone:flex-col to-phone:gap-8 to-phone:items-stretch">
      <div className="to-laptop:flex-1 to-tablet:flex-none to-phone:flex-1">
        <p className="text-body-s text-on-dark-soft">{content.balanceLabel}</p>
        <p className="pt-3 text-number-l font-light whitespace-nowrap to-laptop:text-number-l-md"><CountUp value={content.balance} waitPreloader /></p>
        <div className="h-12 pt-4">
          <p className="inline-flex h-8 items-center gap-2 rounded-full bg-on-dark/12 px-3 text-body-s">
            <Image src="/assets/hero/icon-arrow-up-right.svg" alt="" width={14} height={14} className="size-3.5" />
            <span className="to-phone:hidden">{content.earned}</span>
            <span className="hidden to-phone:inline">{content.earnedShort}</span>
          </p>
        </div>
      </div>
      {/* 1440: the last row drops its bottom padding (Figma 5628:6183). */}
      <dl className="to-laptop:flex-1">
        {/* 768 (5934:11379): the first row loses its top rule and top padding. */}
        {content.rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-t dashes-x dash-on-dark/25 py-4 text-body-m last:pb-0 to-laptop:last:pb-4 first:to-tablet:border-t-0 first:to-tablet:pt-0 first:to-phone:border-t first:to-phone:pt-4"
          >
            <dt className="text-on-dark-soft">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>

    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between to-laptop:items-center to-phone:flex-col to-phone:items-start to-phone:gap-4">
        <p className="text-body-s text-on-dark-soft">{content.caption}</p>
        <RangeSwitch ranges={content.ranges} active={content.activeRange} label={content.rangesLabel} />
      </div>

      <DashboardChart axis={content.axis} tooltip={content.tooltip} />

      <div className="flex justify-between pt-4 pr-14 text-body-s text-on-dark-muted">
        {/* 390 (5934:18667): every other month. */}
        {content.months.map((month, i) => (
          <span key={month} className={i % 2 ? "to-phone:hidden" : undefined}>
            {month}
          </span>
        ))}
      </div>

      <CardStage className="flex h-8 gap-1 pt-6 to-laptop:h-10 to-laptop:pt-8">
        {content.allocation.map((item, i) => (
          <GrowBar
            key={item.label}
            index={i}
            axis="x"
            className={`h-full min-w-px rounded-xs ${allocationTone[item.tone]}`}
            style={{ flexGrow: item.weight, flexBasis: 0 }}
          />
        ))}
      </CardStage>
      <ul className="flex gap-6 pt-3 text-body-s text-on-dark-soft to-phone:flex-col to-phone:gap-2">
        {content.allocation.map((item) => (
          <li key={item.label} className="flex items-center gap-2 to-phone:h-5.5">
            <span className={`size-2 rounded-full ${allocationTone[item.tone]}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  </DashboardTilt>
);
