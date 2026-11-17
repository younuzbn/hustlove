interface Window {
  /** The robot form of the page — no intro, no motion, no consent banner. */
  __robotView?: boolean;
}

interface Window {
  /** Lifts the server-painted preloader cover if React never takes it over (`preloader-flag.ts`). */
  __preloaderTimer?: number;
}
