/**
 * Home page copy for Hustlove Communications — a mobile app studio.
 * Same sections and fields as the original layout. Placeholder data until a CMS exists.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface KeyValue {
  label: string;
  value: string;
}

export const header = {
  brand: "Hustlove",
  // Plain text: the pages they named were removed.
  nav: [
    { label: "Services", href: "#instruments" },
    { label: "Studio", href: "#getting-started" },
  ] satisfies NavLink[],
  login: { label: "Log in", href: "#" } satisfies NavLink,
  cta: { label: "Book a call", href: "#getting-started" } satisfies NavLink,
  menuLabel: "Menu",
};

export const hero = {
  label: "App development and management",
  title: "Mobile apps we build and look after",
  lead: "Hustlove Communications designs, builds and runs iOS and Android apps. You get a product team, a release cadence, and someone on the hook after launch.",
  primary: { label: "Book a call", href: "#getting-started" } satisfies NavLink,
  secondary: { label: "See pricing", href: "#pricing" } satisfies NavLink,
};

export const dashboard = {
  balanceLabel: "Revenue we look after, AED",
  balance: "2,418,300",
  earned: "AED 31,940 added since January, after fees",
  /** 390 frame (5934:18667) shortens the month. */
  earnedShort: "AED 31,940 added since Jan, after fees",
  rows: [
    { label: "Live on both stores", value: "iOS · Android" },
    { label: "Next release", value: "13 Nov · v2.4" },
    { label: "Crash-free rate", value: "99.4%" },
  ] satisfies KeyValue[],
  caption: "Sample product · illustrative figures",
  ranges: ["3M", "YTD", "1Y"],
  activeRange: "YTD",
  rangesLabel: "Chart range",
  axis: ["2.5m", "2.0m", "1.5m", "1.0m"],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  tooltip: { date: "18 Jun", text: "v2.4 shipped to 400k" },
  allocation: [
    { label: "iOS 55%", weight: 479.594, tone: "surface" },
    { label: "Android 35%", weight: 305.203, tone: "chart-300" },
    { label: "Web 10%", weight: 87.203, tone: "chart-400" },
  ] as const,
};

export const controls = {
  label: "What you decide",
  // "[d]" pins the 1440 line break (the browser fits one more word at 927px).
  title: "Set the brief once.\u00a0[s]After that the [d]team ships without a chase.",
  floor: {
    title: "You set the scope",
    text: "Tell us what the first release has to do, and what can wait. We build that, and we don't add a screen because it looked good in a deck.",
    marker: "Scope · v2.4",
    // [light block, dark block] heights in px at the 1440 frame
    bars: [64, 112, 90, 154, 48, 102, 176],
  },
  sweep: {
    title: "Shipped every Thursday",
    text: "A morning build, in the stores by evening",
    days: [
      { day: "M", date: "5", state: "done" },
      { day: "T", date: "6", state: "done" },
      { day: "W", date: "7", state: "done" },
      { day: "T", date: "8", state: "today" },
      { day: "F", date: "9", state: "next" },
      { day: "S", date: "10", state: "off" },
      { day: "S", date: "11", state: "off" },
    ] as const,
  },
  maturity: {
    title: "Time to first build",
    text: "A typical app",
    value: "47",
    unit: "days",
    note: "Average time to a first build. [s]A full product runs about twelve weeks.",
  },
  recall: {
    value: "24h",
    steps: [
      { time: "Today 11:42", text: "Crash reported · checkout" },
      { time: "Tomorrow 09:00", text: "Fix is in review" },
    ],
    title: "Answered inside a day",
    text: "A critical bug filed before 13:00 is in review the next morning. You hear from a person, not a ticket queue.",
  },
  approvers: {
    title: "Two leads on every release",
    text: "A product lead and an engineer both sign the build before it goes to the stores. We can't skip that.",
    roles: ["Product lead", "Engineering lead"],
  },
};

export const instruments = {
  label: "What we build",
  title: "Nothing vague. Three ways we take a product to the stores.",
  // "[t]": the 1024 frame breaks this line by hand.
  lead: "No throwaway prototypes and no mystery vendors. Nothing ships without [t]your name on the accounts. The work is done in your company's repos. The split below is an example; yours depends on the product.",
  items: [
    {
      name: "Native iOS",
      share: "55%",
      note: "Swift, for the App Store",
      gradient: "bills",
      rows: [
        { label: "First build", value: "6–10 weeks" },
        { label: "You own", value: "Repo and stores" },
      ],
    },
    {
      name: "Native Android",
      share: "35%",
      note: "Kotlin, for Google Play",
      gradient: "funds",
      rows: [
        { label: "First build", value: "6–10 weeks" },
        { label: "You own", value: "Repo and stores" },
      ],
    },
    {
      name: "After launch",
      share: "10%",
      note: "Releases, fixes, the stores",
      gradient: "overnight",
      rows: [
        { label: "Cadence", value: "Every other week" },
        { label: "On call", value: "A named engineer" },
      ],
    },
  ] as const,
};

export const gettingStarted = {
  label: "Getting started",
  title: "About six weeks from the first call to a build in TestFlight.",
  steps: [
    {
      number: "01",
      title: "A call",
      text: "We go through the product, the users and the date. If we are the wrong studio, we will say so.",
      duration: "30 min",
    },
    {
      number: "02",
      title: "The brief",
      text: "Scope, screens and the first release, written down. The slow part is the decisions, not the document.",
      duration: "1 week",
    },
    {
      number: "03",
      title: "The build",
      text: "A working app in your accounts, on both stores' test tracks. You review it every week.",
      duration: "4–6 wks",
    },
    {
      number: "04",
      title: "First release",
      text: "You approve the build, we submit it, and the first real users are on it the week it clears.",
      duration: "Store week",
    },
  ],
};

export const situations = {
  label: "When it fits",
  title: "The three products\nwe build most often.",
  ladder: {
    caption: "Six releases, one app",
    value: "v1–v6",
    bars: [
      { month: "Jan", height: 110, tone: "accent" },
      { month: "Feb", height: 92.391, tone: "accent-strong" },
      { month: "Mar", height: 74.797, tone: "chart-400" },
      { month: "Apr", height: 57.188, tone: "chart-300" },
      { month: "May", height: 39.594, tone: "chart-200" },
      { month: "Jun", height: 22, tone: "chart-100" },
    ] as const,
    eyebrow: "A new product",
    title: "One app, shipped in slices your team can review",
    text: "The first slice is the thing users came for. The next five land on a date you already have in the plan.",
  },
  seasonal: {
    caption: "Launch window",
    value: "Oct – Jan",
    bars: [
      { month: "J", height: 99, placed: true },
      { month: "F", height: 33, placed: false },
      { month: "M", height: 26.391, placed: false },
      { month: "A", height: 24.188, placed: false },
      { month: "M", height: 22, placed: false },
      { month: "J", height: 19.797, placed: false },
      { month: "J", height: 22, placed: false },
      { month: "A", height: 26.391, placed: false },
      { month: "S", height: 37.391, placed: false },
      { month: "O", height: 79.188, placed: true },
      { month: "N", height: 96.797, placed: true },
      { month: "D", height: 110, placed: true },
    ],
    eyebrow: "A seasonal app",
    title: "Four busy months, then a quieter year of care",
    text: "The launch build goes out as the season starts, and the rest of the year is fixes, content and the next season.",
  },
  reserve: {
    caption: "Pinned to launch day",
    value: "v2.4",
    points: [
      { date: "2 Sep", label: "Kickoff", labelShort: "Start" },
      { date: "13 Nov", label: "In review" },
      { date: "20 Nov", label: "Ships" },
    ],
    eyebrow: "A dated release",
    title: "You know the date and you know the feature",
    text: "So we start from that day and work back. The build is in review with a few days to spare.",
  },
};

export const security = {
  label: "Security",
  title: "Built in your name, [p]not ours",
  text: "The repos, the store accounts and the keys sit in your company's name. If Hustlove stopped tomorrow, the product would still be yours.",
  cta: { label: "Read how we work", href: "#getting-started" } satisfies NavLink,
};

export const pricing = {
  label: "Pricing",
  fee: "AED 60k",
  text: "For a first release, both stores. [m]Care after that is monthly, [m]and you can pause it.",
  example: "Example · AED 60,000 for a first release, iOS and Android",
  split: { kept: 555.5, fee: 50.5 },
  kept: { value: "AED 55,000", label: "the build" },
  feeLabel: { label: "Care", value: "AED 5,000" },
  cta: { label: "See a sample squad", href: "#getting-started" } satisfies NavLink,
};

export const newsletter = {
  label: "Monthly note",
  title: "One short note on shipping, once a month",
  text: "One page on what shipped, what broke, and what is next. Written by the people on the apps, not by marketing.",
  placeholder: "Work email",
  submit: "Subscribe",
  note: "Unsubscribe any time.",
  envelope: "From the product desk → to yours",
};

export const footer = {
  tagline: "Apps we build and look after",
  social: [
    { label: "LinkedIn", href: "#" },
    { label: "X", href: "#" },
  ] satisfies NavLink[],
  columns: [
    {
      title: "Services",
      links: [
        { label: "Overview", href: "/" },
        { label: "How we work", href: "/#getting-started" },
        { label: "What we build", href: "/#instruments" },
      ],
    },
    {
      title: "Studio",
      links: [
        { label: "Security", href: "/#security" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms", href: "#" },
        { label: "Privacy", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ] satisfies { title: string; links: NavLink[] }[],
  disclaimer:
    "Figures on this page are examples. A timeline and a price depend on the product, and the only way to pin them down is a call.",
  legal: "Hustlove Communications · Mobile app studio",
  // "Footer / 768" splits the legal line into a badge and the copyright row.
  badge: "iOS · Android · Product care",
  legalCompact: "© 2026 Hustlove Communications",
  // "Footer / 390" splits it again: the entity line, then copyright + back to top.
  entity: "Hustlove Communications",
  copyright: "© 2026 Hustlove",
  backToTop: "Back to top ↑",
  wordmark: "Hustlove",
};
