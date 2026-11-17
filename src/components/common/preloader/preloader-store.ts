import { create } from "zustand";

interface PreloaderStore {
  /** True while the preloader covers the page — the hero entrance waits for it. */
  active: boolean;
  setActive: (active: boolean) => void;
}

export const usePreloaderStore = create<PreloaderStore>((set) => ({
  active: false,
  setActive: (active) => set({ active }),
}));
