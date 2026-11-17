"use client";

// 📖 Docs: obsidian/frontend/mobile-menus.md
// The ≤768 menu: a white sheet drops down from the top, links between dashed
// rules, Log in + Book a call below; the page behind dims. Portal under <body>,
// focus moves in and is trapped, Esc / the backdrop / a link close it.

import { animated, useSpring, useSprings } from "@react-spring/web";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { ButtonLink } from "@/components/ui/button-link";
import { LogoLink } from "@/components/ui/logo-link";
import { NavLink } from "@/components/ui/nav-link";
import type { header as headerData } from "@/data/mocks/home";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { SPRING } from "@/lib/springs/presets";

type Content = typeof headerData;

export interface MobileMenuPanelProps {
  content: Content;
  open: boolean;
  onClose: () => void;
  /** The exit motion has finished: unmount. */
  onExited: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Burger → ✕: the two bars of the menu icon rotate into a cross. */
const CloseButton = ({ label, open, onClose }: { label: string; open: boolean; onClose: () => void }) => {
  const s = useSpring({ from: { t: 0 }, t: open ? 1 : 0, delay: open ? 120 : 0, config: SPRING.calm });
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls="mobile-menu"
      onClick={onClose}
      className="flex size-14 shrink-0 items-center justify-center rounded-control border border-ink"
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5 overflow-visible">
        <animated.path
          d="M0 6.5H20"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          transform={s.t.to((t) => `translate(0 ${3.5 * t}) rotate(${45 * t} 10 6.5) scale(1)`)}
        />
        <animated.path
          d="M0 13.5H20"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          transform={s.t.to((t) => `translate(0 ${-3.5 * t}) rotate(${-45 * t} 10 13.5)`)}
        />
      </svg>
    </button>
  );
};

/** Focus in on open, Tab trapped, Esc / backdrop / any link closes; in-page links scroll once unlocked. */
const useDialog = (ref: React.RefObject<HTMLDivElement | null>, open: boolean, onClose: () => void) => {
  // Show, then focus: the panel is visible in the render that mounts it.
  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLElement>("nav a") ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });
  }, [open, ref]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!root.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-menu-backdrop]")) {
        onClose();
        return;
      }
      const a = target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("#")) {
        e.preventDefault();
        onClose();
        if (href.length > 1)
          setTimeout(() => {
            const el = document.querySelector<HTMLElement>(href);
            if (!el) return;
            const lenis = useScroll.getState().lenis;
            if (lenis) lenis.scrollTo(el);
            else el.scrollIntoView({ behavior: "smooth" });
          }, 80);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    root.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.removeEventListener("click", onClick);
    };
  }, [open, onClose, ref]);
};

const Panel = ({ content, open, onClose, onExited }: MobileMenuPanelProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, open, onClose);
  const s = useSpring({
    from: { p: 0 },
    p: open ? 1 : 0,
    config: open ? SPRING.calm : SPRING.quick,
    onRest: () => {
      if (!open) onExited();
    },
  });
  const [rows] = useSprings(
    content.nav.length,
    (i: number) => ({ from: { o: 0 }, o: open ? 1 : 0, delay: open ? 160 + i * 70 : 0, config: SPRING.calm }),
    [open],
  );
  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={content.menuLabel}
      inert={!open}
      data-lenis-prevent
      className="fixed inset-x-0 top-0 z-[100] h-dvh"
    >
      <animated.div data-menu-backdrop aria-hidden className="absolute inset-x-0 inset-y-0 bg-ink/40" style={{ opacity: s.p }} />
      <animated.div
        className="relative flex max-h-dvh flex-col overflow-y-auto overscroll-contain rounded-b-card bg-surface px-5 pb-6 text-ink"
        style={{ transform: s.p.to((p) => `translateY(${(p - 1) * 100}%)`) }}
      >
        <div className="flex items-center justify-between py-5 to-phone:pt-3">
          <LogoLink brand={content.brand} ink />
          <CloseButton label={content.menuLabel} open={open} onClose={onClose} />
        </div>
        <nav aria-label="Main" className="flex flex-col">
          {content.nav.map((link, i) => (
            <animated.div key={link.label} style={{ opacity: rows[i].o, transform: rows[i].o.to((o) => `translateY(${(1 - o) * 8}px)`) }}>
              <NavLink
                href={link.href}
                label={link.label}
                variant="menu"
                className="flex h-16 items-center border-t dashes-x dash-line-dashed text-title-l"
              />
            </animated.div>
          ))}
        </nav>
        <div className="flex gap-3 border-t dashes-x dash-line-dashed pt-10">
          <ButtonLink href={content.login.href} variant="outline-ink" size="l" className="flex-1 justify-center">
            {content.login.label}
          </ButtonLink>
          <ButtonLink href={content.cta.href} variant="primary" size="l" className="flex-1 justify-center">
            {content.cta.label}
          </ButtonLink>
        </div>
      </animated.div>
    </div>
  );
};

/** Portalled under <body> from inside the panel component (never from a transition callback). */
export const MobileMenuPanel = (props: MobileMenuPanelProps) => createPortal(<Panel {...props} />, document.body);
