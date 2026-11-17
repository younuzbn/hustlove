import Image from "next/image";

import { PillIcon } from "./pill-icon";

export type PillTone = "glass" | "outline" | "soft";

export interface PillProps {
  label: string;
  icon: string;
  /** Optional icon for ≤1024px (some frames swap the glyph below 1440); `icon` stays above. */
  iconCompact?: string;
  tone?: PillTone;
  className?: string;
}

const tones: Record<PillTone, string> = {
  glass: "bg-on-dark/14 pr-4 pl-3 text-on-dark",
  outline: "border border-line bg-surface pr-4 pl-3 text-ink",
  soft: "bg-surface-soft pr-4 pl-3 text-ink",
};

/** Section label — "Kelder / Label" in Figma (32px pill, 16px icon). */
export const Pill = ({ label, icon, iconCompact, tone = "outline", className = "" }: PillProps) => (
  <span
    data-pill=""
    className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full text-body-s font-medium whitespace-nowrap ${tones[tone]} ${className}`}
  >
    <PillIcon>
      <Image src={icon} alt="" width={16} height={16} className={`size-4 ${iconCompact ? "to-laptop:hidden" : ""}`} />
      {iconCompact && <Image src={iconCompact} alt="" width={16} height={16} className="hidden size-4 to-laptop:block" />}
    </PillIcon>
    {label}
  </span>
);
