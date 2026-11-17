import Image from "next/image";

import { ChartPart, ChartStage, EndPulse } from "./dashboard-chart-motion";
import { TiltPart } from "./hero-dashboard-tilt";

export interface DashboardChartProps {
  /** Top to bottom: one label per gridline. */
  axis: readonly string[];
  tooltip: { date: string; text: string };
}

// Gridline offsets (Figma 5628:6200: 0 / 80 / 160 / 240 px); the last is solid.
// 1440: 784px plot and lines, labels at 799px.
// 1024 frame (5934:4086): 848px plot, 856px lines, labels at 871px.
// 768 frame (5934:11406): 592px plot, 616px lines, labels at 607px.
// 390 frame (5934:18718): 246px plot, 254px lines, labels at 261px.
const lines = ["top-0", "top-20", "top-40", "top-60"];
const labels = ["-top-2.75", "top-17.25", "top-37.25", "top-57.25"];

/** Figma 5628:6199 — balance chart, positions taken 1:1 from the 784px plot. */
export const DashboardChart = ({ axis, tooltip }: DashboardChartProps) => (
  <div className="pt-8 pr-14">
    <ChartStage className="relative h-60">
      {lines.map((top, i) => (
        <span
          key={top}
          className={`absolute left-0 h-px w-196 border-t to-laptop:w-214 to-tablet:w-154 to-phone:w-[15.875rem] ${top} ${
            i === lines.length - 1 ? "border-on-dark/25" : "dashes-x dash-on-dark/16"
          }`}
        />
      ))}
      {axis.map((label, i) => (
        <span
          key={label}
          className={`absolute left-[49.9375rem] text-body-s to-laptop:left-[53.9375rem] to-tablet:left-[37.9375rem] to-phone:left-[16.3125rem] whitespace-nowrap text-on-dark-muted ${labels[i]}`}
        >
          {label}
        </span>
      ))}

      <TiltPart part="area" className="pointer-events-none absolute inset-0">
        <ChartPart part="area" className="absolute inset-x-0 top-[5.42%] bottom-0">
          <Image src="/assets/hero/chart-area.svg" alt="" fill sizes="52rem" className="to-laptop:hidden" />
          <Image src="/assets/hero/chart-area-1024.svg" alt="" fill sizes="53rem" className="hidden to-laptop:block to-tablet:hidden" />
          <Image src="/assets/hero/chart-area-768.svg" alt="" fill sizes="38rem" className="hidden to-tablet:block to-phone:hidden" />
          <Image src="/assets/hero/chart-area-390.svg" alt="" fill sizes="16rem" className="hidden to-phone:block" />
        </ChartPart>
      </TiltPart>
      <ChartPart part="line" className="absolute inset-x-0 top-[5.42%] bottom-[40%]">
        <div className="absolute inset-x-0 -inset-y-[0.59%] to-laptop:-bottom-[0.6%] to-tablet:-inset-y-[0.58%] to-phone:-top-[0.47%] to-phone:-right-[0.2%] to-phone:-bottom-[0.49%] to-phone:-left-[0.19%]">
          <Image src="/assets/hero/chart-line.svg" alt="" fill sizes="52rem" className="to-laptop:hidden" />
          <Image src="/assets/hero/chart-line-1024.svg" alt="" fill sizes="53rem" className="hidden to-laptop:block to-tablet:hidden" />
          <Image src="/assets/hero/chart-line-768.svg" alt="" fill sizes="38rem" className="hidden to-tablet:block to-phone:hidden" />
          <Image src="/assets/hero/chart-line-390.svg" alt="" fill sizes="16rem" className="hidden to-phone:block" />
        </div>
      </ChartPart>

      <ChartPart part="guide" tag="span" className="absolute top-25 left-[34.8125rem] h-35 to-laptop:left-152.5 to-tablet:left-109.25 to-phone:left-[11.0625rem] w-px border-l dashes-y dash-on-dark/50" />
      <ChartPart part="point" tag="span" className="absolute top-23.5 left-[34.4375rem] size-3 to-laptop:left-151 to-tablet:left-107.75 to-phone:left-[10.6875rem] rounded-full bg-surface" />
      <ChartPart part="tooltip" className="absolute top-29.5 left-[22.5625rem] w-45 to-laptop:left-103.5 to-tablet:left-60.25 to-phone:left-[5.625rem] rounded-control bg-surface px-4 py-3 text-body-s">
        <p className="text-muted">{tooltip.date}</p>
        <p className="-mt-0.5 h-[1.180625rem] whitespace-nowrap text-ink">{tooltip.text}</p>
      </ChartPart>
      <TiltPart part="end" className="pointer-events-none absolute inset-0">
        <EndPulse className="absolute top-1.75 left-[48.625rem] size-3 to-laptop:left-211 to-tablet:left-[36.625rem] to-phone:left-[15rem] rounded-full bg-highlight" />
        <ChartPart part="end" tag="span" className="absolute top-1.75 left-[48.625rem] size-3 to-laptop:left-211 to-tablet:left-[36.625rem] to-phone:left-[15rem] rounded-full bg-highlight" />
      </TiltPart>
    </ChartStage>
  </div>
);
