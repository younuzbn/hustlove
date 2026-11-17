"use client";

// 📖 Docs: obsidian/frontend/mobile-menus.md

import Image from "next/image";
import { useEffect, useState } from "react";
import { create } from "zustand";

import type { header as headerData } from "@/data/mocks/home";
import { useScrollLock } from "@/hooks/use-scroll-lock";

import { MobileMenuPanel } from "./mobile-menu-panel";

interface MenuStore {
  open: boolean;
  /** The toggle that opened it — focus goes back there on close. */
  opener: HTMLElement | null;
  show: (opener: HTMLElement | null) => void;
  hide: () => void;
}

export const useMenuStore = create<MenuStore>((set) => ({
  open: false,
  opener: null,
  show: (opener) => set({ open: true, opener }),
  hide: () => set({ open: false }),
}));

export interface MenuToggleProps {
  label: string;
  icon: string;
  className: string;
}

/** Figma 5919:803 "Button / Menu" — opens the mobile menu (`#mobile-menu`). */
export const MenuToggle = ({ label, icon, className }: MenuToggleProps) => {
  const open = useMenuStore((s) => s.open);
  const show = useMenuStore((s) => s.show);
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls="mobile-menu"
      className={className}
      onClick={(e) => show(e.currentTarget)}
    >
      <Image src={icon} alt="" width={20} height={20} className="size-5" />
    </button>
  );
};

export interface MobileMenuProps extends MenuToggleProps {
  content: typeof headerData;
}

/**
 * The header's menu button plus the panel it opens (`MobileMenuPanel`,
 * portalled under <body>). Scroll is locked while it is open.
 */
export const MobileMenu = ({ content, ...toggle }: MobileMenuProps) => {
  const open = useMenuStore((s) => s.open);
  const hide = useMenuStore((s) => s.hide);
  const [mounted, setMounted] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // The menu exists at ≤768 only.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (wide.matches) hide();
    };
    wide.addEventListener("change", onChange);
    return () => {
      wide.removeEventListener("change", onChange);
      hide();
    };
  }, [hide]);

  return (
    <>
      <MenuToggle {...toggle} />
      {mounted && (
        <MobileMenuPanel
          content={content}
          open={open}
          onClose={hide}
          onExited={() => {
            setMounted(false);
            const opener = useMenuStore.getState().opener;
            if (opener && opener.offsetParent !== null) opener.focus();
          }}
        />
      )}
    </>
  );
};
