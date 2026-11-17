import { CardStage, GrowBar } from "./card-chart-motion";

export interface FloorChartProps {
  /** Height (px at the 1440 frame) of the light block above each 112px dark block. */
  bars: readonly number[];
  marker: string;
}

const toRem = (px: number) => `${px / 16}rem`;

/** Figma 5630:12 — stacked bars with the dashed floor line at 186.5px. */
export const FloorChart = ({ bars, marker }: FloorChartProps) => (
  <CardStage className="relative flex h-75 items-end gap-2" aria-hidden>
    {bars.map((height, i) => (
      <GrowBar key={i} index={i} tag="div" className="flex min-w-px flex-1 flex-col gap-1">
        <span className="w-full rounded-xs bg-chart-200" style={{ height: toRem(height) }} />
        <span className="h-28 w-full rounded-xs bg-(image:--gradient-bar)" />
      </GrowBar>
    ))}
    <GrowBar index={0} axis="x" after={bars.length * 80} className="absolute inset-x-0 top-[11.65625rem] h-px border-t dashes-x dash-ink to-laptop:-right-[8.625rem] to-tablet:right-0" />
    <GrowBar index={0} fade after={bars.length * 80 + 200} className="absolute top-38 left-0 flex h-8 items-center rounded-xs bg-ink px-2 text-body-s whitespace-nowrap text-on-dark">
      {marker}
    </GrowBar>
  </CardStage>
);
