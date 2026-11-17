import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { TextBreaks } from "@/components/ui/text-breaks";

import { HeadingFrame, HeadingLines } from "./section-heading-motion";

export interface SectionHeadingProps {
  label: string;
  icon: string;
  /** Optional label icon for ≤1024px (see `Pill`). */
  iconCompact?: string;
  title: string;
  lead?: string;
  /** Extra classes for the H2 (e.g. a narrower measure in one frame). */
  titleClassName?: string;
}

/** Shared section head: dashed rule, label in column 1, H2 across columns 2–3; 768 (5934:11459)
 *  stacks label and H2 centred in a 560px measure; 390 (5934:18771) keeps
 *  them centred with a 16px gap. */
export const SectionHeading = ({ label, icon, iconCompact, title, lead, titleClassName = "" }: SectionHeadingProps) => (
  <HeadingFrame className="grid grid-cols-3 gap-5 border-t dashes-x dash-line-dashed pt-8 pb-12 to-laptop:pt-6 to-laptop:pb-10 to-tablet:flex to-tablet:flex-col to-tablet:items-center to-tablet:gap-6 to-tablet:text-center to-phone:gap-4 to-phone:pt-4 to-phone:pb-8">
    <div>
      <Pill label={label} icon={icon} iconCompact={iconCompact} />
    </div>
    <Reveal kind="heading" className="col-span-2 to-tablet:col-span-1">
      <h2 className={`text-h2 text-ink to-laptop:text-h2-md to-tablet:w-140 to-phone:w-full ${titleClassName}`}>
        <HeadingLines text={title} />
      </h2>
      {lead && (
        <p className="w-195 pt-6 text-body-m text-muted to-laptop:w-full to-tablet:w-140 to-phone:w-full">
          <TextBreaks text={lead} />
        </p>
      )}
    </Reveal>
  </HeadingFrame>
);
