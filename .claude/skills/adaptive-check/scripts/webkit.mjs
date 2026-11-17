// The same layout probe in Playwright's WebKit (the engine of every iOS browser) with iPhone/iPad profiles.
// Not a real Safari, but it catches WebKit-only line breaks, overflow and console errors.
//   node .claude/skills/adaptive-check/scripts/webkit.mjs [--url http://localhost:3000]
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { LAYOUT } from "./probes.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg("url", "http://localhost:3000");
const req = createRequire(join(process.env.NEXT16_QA_CACHE || join(homedir(), ".cache", "next16-qa"), "package.json"));
const { webkit, devices } = req("playwright");
const UA_PATCH = (ua) => ua.replace(/HeadlessChrome/g, "Chrome");

let flagged = 0;
const browser = await webkit.launch();
for (const name of ["iPhone SE", "iPhone 13", "iPhone 13 landscape", "iPad Mini", "iPad Pro 11 landscape"]) {
  const d = devices[name];
  const ctx = await browser.newContext({ ...d, userAgent: UA_PATCH(d.userAgent), reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  for (const p of ["/", "/pricing", "/company"]) {
    errors.length = 0;
    await page.goto(URL + p, { waitUntil: "load" });
    await page.waitForTimeout(3500);
    const r = JSON.parse(await page.evaluate(LAYOUT));
    const bad = r.sw > 0 || r.out.length || r.broken.length || r.multi.length || errors.length;
    if (bad) flagged++;
    console.log(`${bad ? "!!" : "ok"} webkit ${name} (${d.viewport.width}x${d.viewport.height}) ${p}`, JSON.stringify({ sw: r.sw, out: r.out, broken: r.broken, multi: r.multi, errors }));
  }
  await ctx.close();
}
await browser.close();
console.log(flagged ? `!! ${flagged} flagged` : "webkit: all passed");
process.exit(flagged ? 1 : 0);
