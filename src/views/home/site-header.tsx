import { ButtonLink } from "@/components/ui/button-link";
import { LogoLink } from "@/components/ui/logo-link";
import { NavLink } from "@/components/ui/nav-link";
import type { header as headerData } from "@/data/mocks/home";

import { HeaderScrollBar } from "./header-scroll-bar";
import { MobileMenu } from "./mobile-menu";

export type SiteHeaderTone = "dark" | "light";

export interface SiteHeaderProps {
  content: typeof headerData;
  /** "dark" (default): light copy on the blue hero gradient (home, pricing).
   *  "light": ink copy on the page background (Company, 5874:2779). */
  tone?: SiteHeaderTone;
}

const tones = {
  dark: {
    text: "text-on-dark",
    ink: false,
    cta: "outline",
    menuBorder: "border-on-dark",
    menuIcon: "/assets/header/icon-menu.svg",
  },
  light: {
    text: "text-ink",
    ink: true,
    cta: "outline-ink",
    menuBorder: "border-ink",
    menuIcon: "/assets/header/icon-menu-dark.svg",
  },
} as const;

/** Figma 5728:782 "Header" — sits on the hero gradient; "Header / 768" swaps nav + log in for a menu button. */
export const SiteHeader = ({ content, tone = "dark" }: SiteHeaderProps) => {
  const t = tones[tone];
  return (
    <header className={`flex items-center gap-8 py-5 to-phone:py-3 ${t.text}`}>
      <div className="flex flex-1 items-center">
        <LogoLink brand={content.brand} ink={t.ink} />
      </div>
      <nav aria-label="Main" className="flex gap-8 text-ui to-tablet:hidden">
        {content.nav.map((link) => (
          <NavLink key={link.label} href={link.href} label={link.label} variant="nav" />
        ))}
      </nav>
      <div className="flex flex-1 items-center justify-end gap-6 text-ui to-tablet:gap-3">
        <NavLink href={content.login.href} label={content.login.label} className="flex h-12 items-center to-tablet:hidden" />
        <ButtonLink href={content.cta.href} variant={t.cta} size="l" className="to-tablet:text-body-m to-phone:hidden">
          {content.cta.label}
        </ButtonLink>
        {/* Figma 5919:803 "Button / Menu". No menu panel is designed: it opens `MobileMenuPanel`. */}
        <MobileMenu
          content={content}
          label={content.menuLabel}
          icon={t.menuIcon}
          className={`hidden size-14 shrink-0 items-center justify-center rounded-control border ${t.menuBorder} to-tablet:flex`}
        />
      </div>
      {/* Past the hero: a compact fixed bar portalled under <body>. */}
      <HeaderScrollBar content={content} tone={tone} />
    </header>
  );
};
