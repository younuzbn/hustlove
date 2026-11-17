---
name: adaptive-check
description: Full responsive sweep of the Kelder site against the four Figma reference frames (1440/1024/768/390) — every width from 320 to 3840, landscape phone, short laptops, tablets, browser zoom, Windows scrollbar, WebKit; layout, line breaks, card buttons, hover gate, menu, open states, anchors, focus, console/network, motion-on scroll, big-screen column. Reference frames are frozen and must stay pixel-identical. Use when the user says "проверь адаптив", "чекни все ширины", "adaptive check", before a push or a client handoff, and after any change that touches layout, type, spacing or breakpoints.
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Adaptive check

Run against the dev server (`yarn dev`, http://localhost:3000) or a build. Scripts live in
`scripts/`; they drive headless Chrome with a person's UA (the proxy serves a robot form to
HeadlessChrome — a probe with the default UA "proves" nothing). Look at every screenshot you
cite. Report only what you actually ran.

## The rules being checked

- **Reference frames 1440 / 1024 / 768 / 390 match Figma and are frozen.** Never change how they
  look. A fix for another width that moves a reference pixel is not made — it goes in the report.
- **In-between widths = the nearest reference, scaled** (root font-size is `vw`-based):
  1025+ → 1440, 769–1024 → 1024, 561–768 → 768, ≤560 → 390. Nothing new is invented.
- **Big screens (>1440):** the 1440 frame scales with the screen up to 1920 (root
  `100vw × 16 / 1440`); above 1920 the root holds at 21.333px (ADR-0028) — the content column
  (`px-page`, 85rem) centres, backgrounds stay full width and widen on each side, the hero
  halftone stays on the content; the footer wordmark is clipped at the column edge exactly as at 1440; raster images 2×.
- **Hover only at `(hover: hover) and (min-width: 1025px)`** — Tailwind `hover:` is redefined in
  `globals.css`; JS hovers use the same media query. ≤1024 and any touch device: no hover.
- **Text:** no sideways page scroll; no word split mid-word (a break after a hyphen is allowed — it
  is where Figma breaks); amounts, dates and times on one line; carousels may run past the edge,
  the page may not.
- **Kit button rule:** at 768 a button in a card that would be half width is full width; at 390
  buttons in cards and panels are full width. A reference frame that differs from this rule is
  reported, not changed (Figma wins on references).
- **844×390:** the header and hero must not own the screen (no `vh`-sized hero; header < 35% of
  the height; sticky bar < 25%).

## Steps

1. **Baseline the references** (before touching anything):
   `node .claude/skills/adaptive-check/scripts/shots.mjs <tmp>/ref0 1440,1024,768,390`
2. **Sweep** (≈ 15 min; run in the background):
   `node .claude/skills/adaptive-check/scripts/sweep.mjs --out <tmp>/sweep.txt`
   Widths: references, borders 1025/769/391, in-betweens 1280/900/600/430/414/375/360/320,
   tablets 820/834/1180, zoom 200% (720/512), big 1920/2560/3440/3840. Pages: `/`, `/pricing`,
   `/company`, `/privacy-policy`, a 404. Per width × page: layout probe, card buttons, console
   errors + failed requests (hydration warnings included), every toggle opened (Story years, FAQ,
   tabs) with an overflow/clipped-text check after each, mobile menu (fits or scrolls, Tab stays
   inside, Esc closes). Then: hover gate (1025 mouse on; 1024 mouse, 1024 touch, iPad Pro 1366
   touch off), 844×390 + 1280×720 + 1440×800 (header, footer reachable, fixed bars), a classic 15px
   scrollbar at 1440/1280/1024/768/390, the `/#getting-started` anchor below the sticky bar,
   visible keyboard focus, and a motion-on scroll through each page at the four references.
   `--widths 600,390x844` and `--skip states,motion,…` narrow a rerun.
3. **WebKit:** `node .claude/skills/adaptive-check/scripts/webkit.mjs` — iPhone SE / 13 /
   13 landscape, iPad Mini, iPad Pro 11 landscape. Needs the QA cache (`yarn qa:setup` once).
4. **Big screens by eye:** shots at 1920 and 2560 (`shots.mjs <tmp>/big 1920,2560`), crop the hero
   and the footer, Read them: column centred, backgrounds unbroken, halftone around the content.
   Raster 2×: compare each `<img>` rendered width with its largest srcset candidate and the source
   file size (`sips -g pixelWidth`) — a source narrower than 2× the rendered width needs a new asset.
5. **Fix** only in-between / big-screen issues. After every fix rerun the affected checks.
6. **Prove references unchanged:** `shots.mjs <tmp>/ref1 1440,1024,768,390` then
   `python3 .claude/skills/adaptive-check/scripts/diff.py <tmp>/ref0 <tmp>/ref1` — every file `OK`.
   Then `npx tsc --noEmit`, `yarn lint`, `yarn build`.

## Report (Russian, short)

Per width: **ок** / what is broken — `file:line`, what is visible, how to fix — and whether it
was fixed. Then: what the scripts cannot see and still needs a person (real Safari on an iPhone,
iOS toolbar resizes, a real touch laptop). Finish with the reference diff result. List the widths
for the user to recheck by hand with what to look at on each.

## Known limits

- Headless Chrome is not Safari; WebKit here is Playwright's build, not iOS. Real-device checks
  stay manual.
- `Emulation.setEmulatedMedia` ignores `hover`/`pointer`; touch emulation is what turns
  `(hover: hover)` off — `sweep.mjs` does that.
- Safe area: the viewport has no `viewport-fit=cover`, so iOS keeps content out of the notch by
  itself. If that ever changes, fixed bars need `env(safe-area-inset-*)` padding — check it.
