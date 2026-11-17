---
tags: [frontend, animation, stable, do-not-modify]
updated: 2026-10-13
---

# Animation System

The core of this starter. **Every motion is spring-based** via `@react-spring/web`.
CSS keyframes and `framer-motion` are **banned**. ADR: [[decisions-log]] ADR-0002.

> [!note] One narrow CSS exception (ADR-0014)
> CSS `transition-*` is allowed for **simple, discrete state changes only** —
> hover/focus colour, opacity, border, underline, small decorative nudges — with
> token-backed timing (`duration-[var(--duration-fast)] ease-entrance`). Anything
> scroll-driven, revealing, layout-affecting, staggered, or interruptible is a
> spring. `@keyframes` stay banned. Rules and examples: [[design-system#Motion: springs first, CSS for trivial state]].

> [!warning] #do-not-modify
> `src/components/animation/springs/` and `src/hooks/animation/` are the animation
> engine. Treat them as a vendored library — **consume them, don't edit them
> without explicit sign-off**. One authorized performance refactor has been made;
> see [[decisions-log]] ADR-0009.

## Shared render loop (ticker)

Every per-frame animation hook subscribes to **one** app-wide
`requestAnimationFrame` loop — `src/lib/animation/ticker.ts` (`subscribeToTicker`).
A page with N scroll-driven components runs **one** rAF, not N. The loop is
reference-counted: it starts on the first subscriber and stops when the last one
unmounts, so an idle page costs nothing.

- `useLoop` (and everything built on it — `useLoopInView`, `useResizeLoop`,
  `useSpringTrigger`, `useProgressTrigger`, `<AdaptiveGrid>`) goes through the
  ticker. Each subscriber keeps its own `framerate` throttle.
- Window dimensions (`useWindowWidth` / `useWindowHeight` / `useWindowSize`)
  share **one** debounced `resize` listener via a `useSyncExternalStore` store.

`src/lib/animation/ticker.ts` is **not** `#do-not-modify` — it is the supported
extension point for loop-based animation.

## The components

All live in `src/components/animation/springs/` and accept a `tag` prop so they
render the semantically correct HTML element. Full catalog:
[[components/animation-springs]].

| Component | Trigger | Use for |
|-----------|---------|---------|
| `<Inview>` | element enters viewport | fade/slide-in reveals |
| `<Spring>` | mount / enabled flag | unconditional spring animation |
| `<SpringTrigger>` | scroll progress | parallax, scrub, scroll-toggled motion |
| `<ProgressTrigger>` | scroll progress | raw 0–1 progress callback (no animation) |
| `<Hover>` | mouse enter/leave | hover effects (off on mobile) |
| `<Handle>` | content change | smooth enter/exit on children swap |
| `<AnimatedVarTextTag>` | — | low-level `animated[tag]` primitive |

For **text**, do not use these — use [[text-engine]].

## Choosing the right primitive

| Need | Component |
|------|-----------|
| Element fades/slides in when scrolled into view | `<Inview from={} to={} mode="once">` |
| Element moves continuously with scroll (parallax) | `<SpringTrigger mode="scrub">` |
| Element snaps to a state at a scroll point | `<SpringTrigger mode="toggle">` |
| Mouse hover animation — physical, or animating transforms | `<Hover from={} to={}>` |
| Hover/focus **colour, opacity or border** change only | plain CSS `transition-*` (ADR-0014) — no component |
| Just a 0–1 scroll progress value | `<ProgressTrigger onChange={}>` |
| Heading / copy reveal | `<TextEngine>` → [[text-engine]] |

## Common props

| Prop | Meaning |
|------|---------|
| `tag` | HTML element to render (`section`, `h1`, `div`…) — use the semantic one |
| `from` / `to` | spring start / end states — animatable CSS values only |
| `config` | `@react-spring/web` `SpringConfig` (`tension`, `friction`, …) |
| `mode` | trigger behaviour — varies per component (see below) |
| `delayIn` / `delayOut` | ms delay before enter / exit |
| `disableOnMobile` | respect the global mobile-disable config |
| `className` / `innerClassName` | Tailwind classes (kept separate from spring `style`) |

> Never pass Tailwind class names into `from`/`to`. Spring values are numbers or
> unit strings; classes go on `className`.

## Modes

- **`<Inview>` / `<Spring>`:** `"once"` (play once, stay), `"always"` (reverse on
  leave), `"forward"` (only on downward scroll).
- **`<SpringTrigger>`:** `"scrub"` (interpolate with scroll), `"toggle"` (snap at
  trigger point).

## Trigger positions (`start` / `end`)

Scroll components use a GSAP-style `TriggerPos` string:
`"<element-edge> <viewport-edge>"`, e.g. `"top bottom"`, `"center center"`,
`"bottom top-=100"`. Full grammar in [[text-engine]] (shared format).

## Global config

`src/lib/springs/config.ts`:

```ts
export const springsConfig = {
  mobileWidth: 768,
  disableOnMobile: {
    hover: true,        // always — no hover on mobile
    inview: false,
    spring: false,
    springtrigger: false,
  },
};
```

`isMobileDisabled(value, viewportWidth?)` checks the viewport against `mobileWidth`.
Pass a React-tracked width (e.g. from `useWindowWidth()`) as the second argument so
the check re-evaluates on resize; it falls back to `window.innerWidth` when omitted.
A tracked width of **0** (the server snapshot `useWindowWidth()` returns during
hydration) answers `false`, like the server — it used to fall back to
`window.innerWidth`, so on a phone a render that hid an element differed from
the server HTML (React #418, the whole root re-rendered: a 453 ms task on a
production site). The real width arrives on the next render. In your own
components, only let `isMobileDisabled` decide **markup** with a tracked width;
in effects and handlers either form is fine.
Components opt in per-instance via `disableOnMobile`. **Never disable animation
globally** — toggle per component when an animation hurts mobile UX.

## Loops and motion off — the freeze

Reduced motion (`<ReducedMotion>`) and the robot form ([[robot-form]]) both
switch on react-spring's global `skipAnimation`. Under it a **looping spring**
finishes each lap in 0 ms and starts the next in the same tick, forever — the
page hangs. Seen live on 6+ production sites (frozen on load or on hover for
reduced-motion visitors; Lighthouse `PAGE_HUNG` on the robot form; at best
~300 ms of main thread per load). *Rule.*

```tsx
import { useMotionOff } from "@/hooks/use-motion-off";

const motionOff = useMotionOff();
const pulse = useSpring({ from: { o: 0.4 }, to: { o: 1 }, loop: !motionOff });
```

- `useMotionOff()` is correct on the **first** render (it reads the media
  query in a state initialiser) — react-spring's `useReducedMotion()` alone is a
  render too late: the loop has already started.
- The same applies to `while (alive) { await api.start(…) }` loops — stop the
  loop when `motionOff`, and wait on a timer between laps.
- Test with reduced motion emulated and on the robot form: the page must stay
  responsive (`page.evaluate(() => 1)` returns).

## `<Spring mode="once">` fed by an in-view flag replays

`Spring`'s `active` returns `false` on `!enabled` **before** it checks `once`,
so `<Spring mode="once" enabled={inView}>` hides again when it leaves the
viewport and replays on return. Latch in the caller (never in the engine):

```tsx
const [seen, setSeen] = useState(false);
useEffect(() => { if (inView) setSeen(true); }, [inView]);
<Spring mode="once" enabled={seen} …>
```

`<Inview mode="once">` tracks its own observer and is fine.

## Per-frame work outside the engine

Hand-written rAF loops, canvas and WebGL: scale every step by the frame's
duration in seconds (`src/lib/scene/per-frame.ts`), never a fixed phone frame
cap, write per-frame styles only on change and on the smallest element (a CSS
variable on `<html>` written every frame restyled 571 elements, 10–22 ms per
frame on a phone). See [[webgl-scenes]].

The ticker's per-subscriber `framerate` is a **minimum gap** between calls — a
budget throttle. A `framerate` of `1000 / 30` draws ~20 fps on a 60 Hz screen;
don't use it to cap a visible scene.

## Underlying hooks

The components are built on `src/hooks/animation/` — also `#do-not-modify`. See
[[hooks]] for the catalog.

## This site's motion (Kelder)

Where each piece lives. Springs share `SPRING` (`src/lib/springs/presets.ts`:
calm / slow / quick, no bounce).

| Motion | File |
|--------|------|
| Preloader — every full page load or refresh (not client-side navigation), never for robots or reduced motion; the server paints the cover (`PreloaderCover` + `PRELOADER_FLAG_SCRIPT`) so nothing flashes; the sweep build counts to the real balance, then the mark flies into the header logo as the cover dissolves; skippable | `src/components/common/preloader/` |
| One-shot in-view trigger (`usePlayOnce`, `PlayGroup`) · lines rising from masks (`MaskLines`) | `src/components/common/play-once.tsx` · `mask-lines.tsx` |
| Hero entrance (waits for the preloader) | `src/views/home/hero-entrance.tsx` |
| Section reveal — heading lines rise, blocks rise 48px | `src/components/ui/reveal.tsx` · `src/views/home/section-heading-motion.tsx` |
| Dashboard chart draw · in-card bars / art / tiles · count-up numbers · Getting started line | `src/views/home/dashboard-chart-motion.tsx` · `card-chart-motion.tsx` · `count-up.tsx` · `steps-timeline.tsx` |
| Button hover — the logo's lime square fills the button (ink on the lime primary) | `src/components/ui/button-hover-fill.tsx` |
| Header on scroll — compact solid bar past the hero (`#top`), portalled | `src/views/home/header-scroll-bar.tsx` |
| Text-link hover (header nav, Log in, footer links, mobile sheet rows) — the label rises through its line-box mask like a heading line (140% → 0, `SPRING.slow`), reverses on leave; header nav + sheet rows add the logo's small lime square (current page keeps it); a trailing ↑/→ nudges | `src/components/ui/nav-link.tsx` · `roll-label.tsx` |
| Logo hover — lime square hops and settles, top square nudges out; the preloader lands on `[data-logo-mark]` | `src/components/ui/logo-link.tsx` |
| Section label icon — springs in on reveal, small turn on hover | `src/components/ui/pill-icon.tsx` |
| Numbers — odometer digits in fixed glyph boxes (count-up, calculator): positions never move. `parseNumber` allows a prefix of up to 4 non-digits so `AED 2,418,300` rolls; a longer prefix stays static | `src/components/ui/rolling-number.tsx` · `src/views/home/count-up.tsx` |
| Card hover — 3px spring lift + `shadow-card-hover` (not on ≤768 rails); charts inside react via `useCardHover()` (dark chart bars — floor, ladder, seasonal — paint `bg-(image:--gradient-bar)`, a lighter-top → deep-bottom blue; bars stretch in a ripple, markers swell, tiles step up, art leans in) | `src/components/ui/card-hover.tsx` · `card-chart-motion.tsx` |
| Instrument tiles — on deep site-blue tiles (`--gradient-bills/funds/overnight`: the security card's #3F8DE8 → blue-500 → blue-700 base with blue-300/400 sheens, replacing the pale washes so the white art reads), pixel art assembles out of the 40% dot grid, each tile in its own order — bills clockwise from twelve (radar hand), funds outward from the centre in rings, overnight a scattered twinkle; hover ripples from the cursor | `src/views/home/instrument-art.tsx` (+ `instrument-pixels.ts`, `*-grid.svg`) |
| Line flow — a sparse ribbon of hair-thin strands (default 30, alpha 0.24–0.48, every 7th brighter at 0.85; chart-200/300/400, `lighter` blend) along a spine that is a uniform Catmull-Rom spline through the given points, each `[share of width, + rem, share of height, + rem]` from the block's top-left (corner-pinned in rem where the block's width follows the screen but its height doesn't); it widens along the spine and twists `twist` half-turns (default 0.83; strands cross and part like silk) — `fan` spreads the crossings along the ribbon (each strand's twist phase offset by its place across it), so a strong twist reads as soft silk instead of pinching into knots, each strand ripples; even strength end to end — no fades at the ends/edges (they read as darkening); three light pulses and soft specks. Keeps off the copy by placement only — no mask (an erase-mask read as boxes under the text): the block's text lines (Range rects, mapped into the block's own px since it may be mid open-up) are measured and the whole ribbon slides `avoid` left/right until its widest reach clears every line on that side by 1.5rem; re-placed on resize and every 90 frames — but not while the block still tilts in (OpenUp's `rotate` is set) or its copy rises, when the measures jump (the right flow twitched sideways on scroll); the slide eases to the new value (perFrame 0.06), snapping only on a resize. `reveal: "down" | "up"`: drawn in with the scroll as a front at 80% of the viewport passes the ribbon's vertical span (damped, recedes on scroll-up) — from the spine's start down, or from its end up. The growing tip is never cut and never dimmed to nothing (a hard cut read as a chopped bundle; fading to transparent and gathering to a point read as a dark tail): the ribbon narrows to 70% over the last 14% of the spine, each strand thins to 45% alpha over the last 18% (per-strand linear gradient to the token colour at 0.45), and strands lead/trail each other by up to ±8% (the stagger shrinks to 0 as the reveal completes); the narrowing and thinning ease away over the last 15% of the reveal so the ribbon settles into its finished look instead of snapping to it (that snap read as a jerk on the bottom-up flow). Canvas sized from offsetWidth/Height (not the tilted on-screen box). Uses: T+1 card (top right → out the right edge above the copy, avoid right, reveal down); Getting started — a tall S down the left side (twist 3.5, avoid left, reveal down) and a near-vertical drop down the right edge (twist 1.6, fan 0.9 — at twist 3 with no fan it pinched into knots and was disliked — avoid right, reveal up), 22 strands each, hidden ≤560. 0 strand pixels within 4px of text at 1440/1024 (and 375 for T+1). Shared ticker + dt, only on screen; motion off: one still frame, fully drawn; robot: none. Modelled on the Relay demo's hero line flow | `src/views/home/line-flow.tsx` · `controls-recall-card.tsx` · `getting-started-section.tsx` |
| Recall card — white dot, a lime pulse runs down the rule, the lime dot lands with a ring; hover replays | `src/views/home/recall-timeline.tsx` |
| Company question tabs — the navy pill glides to the picked question on a soft overshoot-free spring (tension 150 / friction 28), each label's colour follows the pill (`color-mix` of `--color-on-dark` into `--color-muted` by how much of the tab the pill covers; the picked one stays muted until the pill arrives), the answer eases across (±10px) and the panel springs to its height. Trap fixed: the effect re-created its ResizeObserver on every switch and the observer's immediate first report snapped the pill — its first callback is skipped | `src/views/company/question-tabs.tsx` |
| Dashboard — sliding range pill (redraws the line), calm pulse ring on the end dot (in view only) | `src/views/home/range-switch.tsx` · `dashboard-chart-motion.tsx` |
| Security cube "vault lid" — the white cell lifts every 3.2s (in view only), up while hovered | `src/views/home/security-cube.tsx` |
| Newsletter envelope — blue envelope in the site palette only (body = the security card's gradient #3F8DE8 → blue-700 → #073A82, flap blue-300 → blue-400 with a blue-200 edge, thin white lines, thickness `--envelope-edge` = navy-800, a blue-700 seal; a brighter off-palette version read as foreign and was reverted with the Kelder mark — logo-link's paths, white + lime — on the flap tip) in 3D perspective (perspective on a static outer box; rest: -3° roll, 14° pitch, -20° yaw, five stacked `bg-envelope-edge` layers behind for thickness, no ground shadow). Fine pointers >1024: the face turns toward the cursor anywhere over the section (±28° yaw, ±20° pitch, ±4° roll at 520px from its centre, spring), back to rest on leave. No float or hover lift (removed on request — it stays in place); input focus rule draws; Subscribe has the button fill | `src/views/home/newsletter-envelope.tsx` · `newsletter-form.tsx` |
| Footer wordmark — letters rise in turn (each at its kerned x, on the paragraph's line top); under the footer reveal the rise is scrubbed by how much footer is uncovered — letter i rises over 0.02 + i·turn → +0.45 of the reveal, turns spread so the last letter lands exactly at the bottom of the scroll (it used to finish at ~69%). Type is `0.734` of `--text-mega` / `--text-mega-md` (same leading and tracking) so "Hustlove" fills the width the tokens were drawn for "Kelder"; the crop box is unchanged | `src/views/home/wordmark-rise.tsx` · `site-footer.tsx` |
| Scroll-scrubbed work — `useScrollFrame` (shared ticker, dt in s, runs only while the element is within 25% of the viewport, one last call on leaving) · `smooth` · `useMedia` | `src/hooks/use-scroll-frame.ts` |
| Hero halftone (canvas over the static SVG, motion on, hero in view) — faint diagonal shimmer; wave pulse: wobbly concentric rings leave a point behind the headline (`PULSE_*` constants: 150 u/s, a ring every 280 u, fading by 1100 u), dots swell and brighten as a crest passes, a softer echo trails it; cursor lens (fine pointers); click ripple with a lime crest. Above 1920 the frame no longer reaches the screen edges, so `continueRing()` carries the ring past both sides (each cut row's outer slope mirrors its inner slope about the row's crest) and the canvas widens by as much as fits; the static SVG (motion off) stays cut at the frame | `src/views/home/hero-halftone.tsx` |
| Hero parallax (≥769px) — copy 1×, dashboard lags 0.15× (eases out at 5rem so it never reaches the next heading), halftone img + canvas 0.35× inside a hero clip (the canvas' own rect carries the translate, so lens/ripples still map) | `src/views/home/hero-parallax.tsx` · `hero-halftone.tsx` |
| Hero dashboard tilt (≥769px) — rests tilted (perspective 62.5rem, rotateX 20°, scale 0.9, top-centre — the `--tilt-*` tokens, 7° / 0.94 at ≤560; strengthened 2026-10-27 from 87.5rem / 10° / 0.95) at scrollY 0, flattens as its centre reaches mid-viewport; chart area 0.65 → 1, end dot glides in. Server paints the tilt from CSS (`[data-tilt]` + registered non-inherited `--tilt-k`, `prefers-reduced-motion: no-preference` and >768px), JS writes only `--tilt-k`, `none` once flat | `src/views/home/hero-dashboard-tilt.tsx` · globals.css |
| "Where it goes" allocation bar (>768px) — 55/35/10 fills segment by segment, legend fades in; card hover (`CardHover`) or segment hover dims the others to 28%; hangs absolutely in the gap before Getting started (height unchanged) | `src/views/home/shares-bar.tsx` |
| Getting started — the plate behind the current step (and step 01's static one) is `bg-on-dark/7 backdrop-blur-md`, blurring the line flows and dots behind; damped front (dt-scaled), line scrubs to it, tiles crossfade to lime over 0.6 row, plate glides row to row (smoothstep between tile centres); geometry measured on resize | `src/views/home/steps-timeline.tsx` |
| Dark blocks open up — `<OpenUp />` probe as the block's first child: the hero dashboard's tilt tokens (`--tilt-perspective` on the parent, rotateX `--tilt-angle` → 0, scale `--tilt-scale` → 1, read once per breakpoint; the parent's `perspective-origin` is set per frame to the block's middle — left at the default, the vanishing point sat in the middle of a page-tall `<main>`, far above low blocks like Security + Pricing, and squashed/sheared them once the tilt was 20°) top-centre + corners `--corner-card-closed` (32px) → design radius, scrubbed while the top runs viewport bottom → 30%; on Getting started, security card, booking CTA, pricing worked examples, company team. Not the live-desk panel (it sits in the first screen, so its rest look on load would be half-open) | `src/components/ui/open-up.tsx` |
| Cursor dot trail (fine pointers >1024, motion on) — on the light page background a dot grid (1.25rem pitch, `--accent-strong`, ≤40% opacity, small dots — low contrast on purpose) lights up only along the cursor's recent path: points laid every 0.5rem of travel, each fading over 0.8s, the trail widest (3.5rem) at the cursor and tapering to the tail. No blob around a resting cursor (points are laid only on movement; an earlier circular wave with ripples was replaced on request); the shared-ticker loop stops once the tail fades. `<CursorDots />` is the first child of each page's `<main className="isolate …">`: a viewport-tall **sticky** canvas (`-mb-[100vh]`, `-z-10`) — not `fixed`, because OpenUp puts `perspective` on main, which makes main the containing block for fixed children; sections cover it, drawing is clipped to main's box (never over the revealed footer) | `src/components/ui/cursor-dots.tsx` · `src/views/{home,pricing,company}.tsx` |
| Footer from under the page — page content on an opaque `bg-page` cover that holds the 110/80/56px gap; when the footer fits the viewport it is `sticky bottom-0` under it (z 0 vs 10). The cover always has `--corner-card-closed` bottom corners (z 10) and the footer's wrapper tucks up under them (`-mt`/`pt` of the corner radius, footer gradient in that strip; the reveal share subtracts it), so the corners show the footer's blue — at the end of the scroll they used to show page colour and vanish; normal flow, heights unchanged | `src/views/home/footer-reveal.tsx` (wraps `<main>` in each view) |
| Sliding highlights (yield chips, booking day / time, dashboard range): labels light only once the pill has landed | `src/hooks/use-sliding-pill.ts` |
| Pricing — FAQ + turns into − on the answer's spring; fee split springs | `src/views/pricing/faq-list.tsx` · `fee-calculator.tsx` |
| Company — "Live" dot and "Now" tag pulse (in view only); arrows nudge on hover | `src/components/ui/pulse-ring.tsx` · `arrow-nudge.tsx` |

Hover is `(hover: hover)` only and keyboard `:focus-visible` plays the same
state (`src/hooks/use-hover-focus.ts`); idle loops run only on screen
(`src/hooks/use-in-view-flag.ts`) and never under motion off.

Motion off: reduced motion renders the final states (no preloader, hover,
count-up, chart or bar motion; reveals jump to rest); the robot form keeps the
plain fade-up `Reveal`, a closed menu and no header bar. Markup that depends on
reduced motion reads `useMotionOffMarkup()` — `useMotionOff()` answers before
hydration, which mismatched the server HTML.

## Related

[[text-engine]] · [[components/animation-springs]] · [[robot-form]] · [[webgl-scenes]] · [[data-flow]] · [[new-page]]
