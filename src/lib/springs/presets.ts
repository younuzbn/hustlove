/** Calm, critically damped springs shared by the site's motion — no bounce. */
export const SPRING = {
  calm: { tension: 170, friction: 26 },
  slow: { tension: 90, friction: 19 },
  quick: { tension: 260, friction: 30 },
} as const;
