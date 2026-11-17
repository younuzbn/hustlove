"use client";

// Header on scroll: once past the hero (`#top`), a compact solid bar stays
// pinned to the top. It is a fixed copy portalled under <body>, so the in-flow
// header and the page layout never change. Not on the robot form.

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRobot } from "@/components/common/robot-view";
import { ButtonLink } from "@/components/ui/button-link";
import { LogoLink } from "@/components/ui/logo-link";
import { NavLink } from "@/components/ui/nav-link";
import type { header as headerData } from "@/data/mocks/home";
import { SPRING } from "@/lib/springs/presets";

import { MenuToggle } from "./mobile-menu";
import type { SiteHeaderTone } from "./site-header";

const look = {
  dark: {
    bar: "bg-ink text-on-dark",
    ink: false,
    cta: "outline",
    border: "border-on-dark",
    icon: "/assets/header/icon-menu.svg",
  },
  light: {
    bar: "bg-surface text-ink",
    ink: true,
    cta: "outline-ink",
    border: "border-ink",
    icon: "/assets/header/icon-menu-dark.svg",
  },
} as const;

const heroBottom = () => {
  const hero = document.getElementById("top");
  return hero ? hero.getBoundingClientRect().bottom + window.scrollY : window.innerHeight;
};

export interface HeaderScrollBarProps {
  content: typeof headerData;
  tone: SiteHeaderTone;
}

export const HeaderScrollBar = ({ content, tone }: HeaderScrollBarProps) => {
  const active = !useRobot();
  const [shown, setShown] = useState(false);
  // A portal into <body>: render it only after mount (no `document` on the server).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setShown(window.scrollY > heroBottom() - 80);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      setShown(false);
    };
  }, [active]);

  const s = useSpring({ p: shown ? 1 : 0, config: SPRING.calm });

  if (!active || !mounted) return null;
  const t = look[tone];
  return createPortal(
    <animated.div
      aria-hidden={!shown}
      inert={!shown}
      className={`fixed inset-x-0 top-0 z-[80] ${t.bar}`}
      style={{ transform: s.p.to((p) => `translateY(${(p - 1) * 105}%)`) }}
    >
      <div className="flex items-center gap-8 px-page-bar py-2 text-ui to-laptop:px-5">
        <div className="flex flex-1 items-center">
          <LogoLink brand={content.brand} ink={t.ink} />
        </div>
        <nav aria-label="Main" className="flex gap-8 to-tablet:hidden">
          {content.nav.map((link) => (
            <NavLink key={link.label} href={link.href} label={link.label} variant="nav" />
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-6 to-tablet:gap-3">
          <NavLink href={content.login.href} label={content.login.label} className="flex h-12 items-center to-tablet:hidden" />
          <ButtonLink href={content.cta.href} variant={t.cta} size="m" className="to-phone:hidden">
            {content.cta.label}
          </ButtonLink>
          <MenuToggle
            label={content.menuLabel}
            icon={t.icon}
            className={`hidden size-12 shrink-0 items-center justify-center rounded-control border ${t.border} to-tablet:flex`}
          />
        </div>
      </div>
    </animated.div>,
    document.body,
  );
};
