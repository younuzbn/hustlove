import { ButtonLink } from "@/components/ui/button-link";
import { NavLink } from "@/components/ui/nav-link";

import { WordmarkRise } from "./wordmark-rise";
import type { footer as footerData } from "@/data/mocks/home";

export interface SiteFooterProps {
  content: typeof footerData;
}

/** Figma 5628:9697 / 5728:863 "Footer"; 1024 frame "Footer / 1024" (5934:9729);
 *  768 frame "Footer / 768" (5934:17049) — links under the tagline, badge + compact legal row;
 *  390 frame "Footer / 390" (5934:24357) — two link columns, legal links move under the rule. */
/** Soft footer copy brightens to white on hover / focus (ADR-0014 colour transition). */
const brighten = "transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-on-dark focus-visible:text-on-dark";

export const SiteFooter = ({ content }: SiteFooterProps) => {
  const legalColumn = content.columns[content.columns.length - 1];
  return (
  // The 110 / 80 / 56px gap above the footer lives on the page cover (`FooterReveal`).
  <div id="footer">
    <footer className="bg-(image:--gradient-footer) text-on-dark">
      <div className="px-page to-laptop:px-5">
        <div className="grid grid-cols-[41.875rem_13.125rem_13.125rem_13.125rem] gap-5 pt-10 pb-14 to-phone:pt-8 to-laptop:grid-cols-[19.6875rem_1fr_1fr_1fr] to-tablet:grid-cols-3 to-tablet:gap-y-10 to-phone:grid-cols-2 to-phone:gap-y-8">
          <div className="to-tablet:col-span-3 to-phone:col-span-2">
            <p className="w-85 text-title-l to-laptop:text-title-l-md">{content.tagline}</p>
            <div className="flex gap-3 pt-8 to-phone:pt-5">
              {content.social.map((link) => (
                <ButtonLink
                  key={link.label}
                  href={link.href}
                  variant="outline"
                  size="l"
                  className="to-tablet:w-30 to-tablet:justify-center to-tablet:text-body-m to-phone:w-auto to-phone:justify-start"
                >
                  {link.label}
                </ButtonLink>
              ))}
            </div>
          </div>
          {content.columns.map((column, i) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className={i === content.columns.length - 1 ? "to-phone:hidden" : undefined}
            >
              <p className="text-body-s text-on-dark-soft">{column.title}</p>
              <ul className="flex flex-col gap-3 pt-4 text-ui to-tablet:text-body-m">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <NavLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex justify-between border-t dashes-x dash-on-dark py-8 text-body-s text-on-dark-soft to-laptop:justify-start to-laptop:gap-5 to-tablet:hidden">
          <p className="w-[34.6875rem] to-laptop:w-[30.125rem]">{content.disclaimer}</p>
          {/* items-end: like Figma, a line wider than the column grows leftwards. */}
          <div className="flex w-[34.6875rem] flex-col items-end text-right to-laptop:w-[30.125rem]">
            <p className="whitespace-nowrap">{content.legal}</p>
            <p className="flex justify-end gap-6">
              <span>{content.copyright}</span>
              <NavLink href="#top" label={content.backToTop} className={brighten} />
            </p>
          </div>
        </div>
        <div className="hidden flex-col gap-6 border-t dashes-x dash-on-dark py-8 text-body-s to-tablet:flex to-phone:hidden">
          <div className="flex max-w-150 flex-col items-start gap-4">
            <p className="text-on-dark-muted">{content.disclaimer}</p>
            <p className="flex h-8 items-center rounded-full border border-on-dark px-3 font-medium whitespace-nowrap text-on-dark-soft">
              {content.badge}
            </p>
          </div>
          <div className="flex h-[2.625rem] items-center justify-between text-on-dark-soft">
            <p className="whitespace-nowrap">{content.legalCompact}</p>
            <NavLink href="#top" label={content.backToTop} className={brighten} />
          </div>
        </div>
        <div className="hidden flex-col gap-6 border-t dashes-x dash-on-dark py-8 text-body-s text-on-dark-soft to-phone:flex">
          <nav aria-label={legalColumn.title} className="flex flex-wrap gap-x-4 gap-y-2 whitespace-nowrap">
            {legalColumn.links.map((link) => (
              <NavLink key={link.label} href={link.href} label={link.label} className={brighten} />
            ))}
          </nav>
          <div className="flex flex-col items-start gap-4">
            <p>{content.disclaimer}</p>
            <p className="flex h-8 items-center rounded-full border border-on-dark px-3 font-medium whitespace-nowrap">{content.badge}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p>{content.entity}</p>
            <p className="flex justify-between gap-6">
              <span>{content.copyright}</span>
              <NavLink href="#top" label={content.backToTop} className={brighten} />
            </p>
          </div>
        </div>
      </div>
      <div className="px-page to-laptop:px-5" aria-hidden>
        {/* Figma wordmark blocks: 345.97 / 243.42 / 180.30 / 87.04px tall; the "Kelder" text box sits
            at x −39.91 / −28.05 / −20.76 / −9.98px and y 23 / 16 / 12 / 6px inside them (5728:863,
            5934:9729, 5934:17049, 5934:24357), so the K starts at the gutter. */}
        <div className="relative h-[21.623125rem] overflow-hidden to-laptop:h-[15.213906rem] to-tablet:h-[11.268813rem] to-phone:h-[5.4401rem]">
          {/* Wordmark type is sized for a 6-letter name. Scale it so "Hustlove" fills the same width. */}
          <p className="absolute top-5.75 left-[-2.494375rem] text-[length:calc(var(--text-mega)*0.734)] leading-[0.816] font-medium tracking-[-0.051em] to-laptop:top-4 to-laptop:left-[-1.753125rem] to-laptop:text-[length:calc(var(--text-mega-md)*0.734)] to-tablet:top-3 to-tablet:left-[-1.2975rem] to-phone:top-1.5 to-phone:left-[-0.62375rem] whitespace-nowrap text-wordmark"><WordmarkRise text={content.wordmark} /></p>
          <span className="absolute inset-0 bg-(image:--gradient-wordmark-fade)" />
        </div>
      </div>
    </footer>
  </div>
  );
};
