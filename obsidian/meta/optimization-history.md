# Optimization history

What the optimization pipeline changed in this project, why, what it measured, and what must not be undone. Read this before touching performance-, motion- or loading-related code (AGENTS.md rule 19).

## Current state — `optimize/pass-1` (2026-11-12)

Hosted on a temporary Vercel copy (`opt-kelder`), 3 runs each:

| | baseline (`main`) | after (pass 1) |
|---|---|---|
| Lighthouse phone | 80 / 79 / 80 · LCP 3.19 s · TBT 437 ms | 87–89 · LCP 1.76 s · TBT 356 ms |
| Lighthouse desktop | 93–96 · TBT 41 ms | 95–96 · TBT 21 ms |
| A11y / BP / SEO | 100 | 100 |
| Scroll, PC + phone (real Chrome) | ideal | ideal |
| PageSpeed (served the robot form) | — | 94 / 94 |

The remaining phone TBT is the framework (Next RSC decode and module init, ~160 ms at 4×) plus react-spring set-up spread over many small leaves. No project function is over 10 ms.

## Invariants — do not undo

- **Hero parts render at rest until a paint is reported under the preloader cover** (`src/views/home/hero-entrance.tsx`, `useHoldAtRest`).
  - The server HTML must keep the hero at `opacity: 1`; the parts drop to their start state only while the cover is up. That is what puts the LCP at first paint (observed 3.3 s → 75 ms).
  - Don't make the server render the entrance's start state again. Don't drop the `coverUp()` check, or a load without a cover would flash.
- **`RollingNumber` creates no `n.to()` interpolations while held** (`src/components/ui/rolling-number.tsx`, `bind`). There were ~250 in the hydration commit.
- **`LineFlow` sets up a screen ahead of the viewport**, not at hydration (`src/views/home/line-flow.tsx`, the `near` observer). The first frame is drawn before it can be seen, and the scroll test stays ideal.
- **Hover springs exist only from the first hover / focus** (`roll-label.tsx`, `button-hover-fill.tsx`, `card-hover.tsx`, `nav-link.tsx`): the same markup at rest, then a live part that mounts `from` rest. Don't build these springs at mount: ~50 of them were in the phone's hydration commit, where they never play.
- **`MaskLines` renders plain held spans until `play`** (`src/components/common/mask-lines.tsx`, `HeldLines` / `LiveLines`). No spring and no `offsetTop` read per word at hydration. The live lines rise only once measured (`go`), or the stagger is lost.
- **No `toLocaleString` / `Intl` in the preloader counter** (`preloader-mark.tsx`, `aed`). Its first call loads ICU data, ~30 ms at 4× CPU. The formatter is `AED ` plus grouped digits; don't switch it back to `Intl`.

## Owner decisions

- 2026-11-12: kelder joined the pipeline before it is published; optimize as usual. Measurements run one at a time.

## History by pass

### Pass 1 — 2026-11-12, `optimize/pass-1`

| change | blamed by | before → after |
|---|---|---|
| Hero at rest under the cover | Lighthouse LCP element = hero lead, 86 % Render Delay | observed LCP 3.3 s → 75 ms; Lighthouse LCP 3.29 → 2.78–3.04 s |
| `RollingNumber` static bind while held | CPU profile: react-spring `to` ~56 ms in the load task | busiest task 593 → 442 ms (with the next two); TBT 395–491 → 345–370 ms |
| `LineFlow` set-up on approach | profile: `line-flow` ~50 ms at hydration | in the row above |
| Counter without `toLocaleString` | profile: 30 ms self in `euro` (now `aed`) | in the row above |
| Hover springs from first hover | Fix Catalog rule; ~50 springs at hydration | local mobile 85–87 → 88–93, TBT 345–367 → 260–318 ms |
| `MaskLines` held until play | profile: a spring and an `offsetTop` per heading word | local mobile → 89–91, TBT 246–284 ms |

## Tried and reverted / didn't help

- **Per-section idle hydration (`HydrateWhenIdle`)**: TBT 400 → 215 ms, but Next 16.3.7 outlined every section into `<div hidden id="S:n">` and CLS went to 0.928 (perf 67). Reverted. Don't wrap prerendered sections in `Suspense` boundaries that suspend on the client.

## Open items / leads

- Lighthouse's mobile LCP is now the async chunk queue (~230 KB of framework, motion and scroll code requested in `<head>`), not the page.
- TBT is one hydration commit spread over many components.

## How to measure

From the optimization pipeline (`optimization-pipeline/`):

```sh
node tools/measure.mjs kelder --only lighthouse --devices mobile --runs 3   # local
node tools/measure.mjs kelder --only scroll --runs 2                        # real-Chrome scroll, PC + phone
node tools/profile.mjs kelder                                                # who is in the long task
```
