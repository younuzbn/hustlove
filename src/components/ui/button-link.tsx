import Link from "next/link";
import type { ReactNode } from "react";

import { ButtonHoverFill } from "./button-hover-fill";

export type ButtonVariant = "primary" | "outline-soft" | "outline" | "outline-ink" | "dark" | "light";

export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  /** "l" = 56px (hero), "m" = 48px. */
  size?: "l" | "m";
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-highlight px-6 text-ink font-medium",
  "outline-soft": "border border-on-dark/40 px-6 text-on-dark",
  outline: "border border-on-dark px-6 text-on-dark",
  /** "Button / Outline on light" — ink outline on the page background. */
  "outline-ink": "border border-ink px-6 text-ink",
  dark: "bg-ink px-6 text-on-dark font-medium",
  light: "bg-surface px-6 text-ink font-medium",
};

/** "Button / *" components from the Kelder Figma file, rendered as links. */
export const ButtonLink = ({
  href,
  children,
  variant = "dark",
  size = "m",
  className = "",
}: ButtonLinkProps) => (
  <Link
    href={href}
    className={`inline-flex shrink-0 items-center gap-3 rounded-control text-ui whitespace-nowrap ${
      size === "l" ? "h-14" : "h-12"
    } ${variants[variant]} ${className}`}
  >
    <ButtonHoverFill variant={variant}>{children}</ButtonHoverFill>
  </Link>
);
