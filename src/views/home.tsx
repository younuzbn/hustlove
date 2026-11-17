import { RobotProvider, RobotView } from "@/components/common/robot-view";
import { CursorDots } from "@/components/ui/cursor-dots";
import * as home from "@/data/mocks/home";

import { ControlsSection } from "./home/controls-section";
import { GettingStartedSection } from "./home/getting-started-section";
import { HeroSection } from "./home/hero-section";
import { InstrumentsSection } from "./home/instruments-section";
import { NewsletterSection } from "./home/newsletter-section";
import { SecurityPricingSection } from "./home/security-pricing-section";
import { FooterReveal } from "./home/footer-reveal";
import { SiteFooter } from "./home/site-footer";
import { SituationsSection } from "./home/situations-section";

/**
 * Home view — Hustlove Communications landing page, built on the existing layout
 * WINXFW2nTM7zYwd5dGgm1T frame 5628:5219 (1440 wide). The whole page is in rem
 * and the root font-size scales with the viewport, so the 1440 composition
 * keeps its proportions at any desktop width.
 *
 * `robot` is the robot form (obsidian/frontend/robot-form.md). Never read
 * `headers()` here: `/` must stay static.
 */
export const HomeView = ({ robot = false }: { robot?: boolean }) => {
  return (
    <RobotProvider robot={robot}>
      {robot && <RobotView />}
      <FooterReveal footer={<SiteFooter content={home.footer} />}>
        <main className="isolate w-full bg-page">
          <CursorDots />
          <HeroSection header={home.header} content={home.hero} dashboard={home.dashboard} />
          <ControlsSection content={home.controls} />
          <InstrumentsSection content={home.instruments} />
          <GettingStartedSection content={home.gettingStarted} />
          <SituationsSection content={home.situations} />
          <SecurityPricingSection security={home.security} pricing={home.pricing} />
          <NewsletterSection content={home.newsletter} />
        </main>
      </FooterReveal>
    </RobotProvider>
  );
};
