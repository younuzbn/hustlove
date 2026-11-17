// Full-page screenshots for a human recheck (motion off, live counters hidden).
//   node .claude/skills/adaptive-check/scripts/shots.mjs <outdir> [widths] [pages]
//   widths: comma list, "WxH" for a custom height; pages: home,pricing,company
// Use the same command before and after a change on 1440,1024,768,390 and compare with diff.py —
// the reference frames must come out pixel-identical.
import fs from "node:fs";
import { launch, sleep } from "./cdp.mjs";

const out = process.argv[2];
const widths = (process.argv[3] || "1440,1024,768,390").split(",").map((s) => (s.includes("x") ? s.split("x").map(Number) : [Number(s), 900]));
const all = [["home", "/"], ["pricing", "/pricing"], ["company", "/company"]];
const pages = all.filter(([n]) => !process.argv[4] || process.argv[4].split(",").includes(n));
fs.mkdirSync(out, { recursive: true });
for (const [w, h] of widths) {
  const b = await launch(w, h, { reduced: true, mobile: w < 768 });
  for (const [name, path] of pages) {
    await b.go("http://localhost:3000" + path, 5000);
    await b.ev(`(()=>{for(const s of ['[class*=consent]','[aria-label*=ookie]','nextjs-portal']) document.querySelectorAll(s).forEach(e=>e.remove()); document.querySelectorAll('time').forEach(t=>t.style.visibility='hidden'); const c=document.querySelector('[data-rise] .text-number-l'); if(c) c.style.visibility='hidden'; return 1})()`);
    const H = await b.full(`${out}/${name}-${w}${h !== 900 ? "x" + h : ""}.png`);
    console.log(name, `${w}x${h}`, H);
  }
  b.close(); await sleep(300);
}
