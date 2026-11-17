// Adaptive sweep: every width × every page, layout + states + menu + console/network,
// plus the one-off checks (hover gate, landscape, short screens, Windows scrollbar, anchors, focus).
//   node .claude/skills/adaptive-check/scripts/sweep.mjs [--url http://localhost:3000] [--out dir] [--widths 1440,390x844] [--skip motion,states]
// Prints one line per check; "!!" marks a finding. Exit 1 when anything is flagged.
import fs from "node:fs";
import { launch, sleep } from "./cdp.mjs";
import { LAYOUT, STATE_TOGGLES, quickOverflow } from "./probes.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg("url", "http://localhost:3000");
const OUT = arg("out", null);
const skip = new Set((arg("skip", "") || "").split(",").filter(Boolean));

// Reference frames (Figma), borders, in-betweens, tablets, browser zoom 200% (1440 → 720, 1024 → 512), big screens.
const WIDTHS = (arg("widths", null)?.split(",") ?? [
  "1440", "1024", "768", "390",
  "1025", "769", "391",
  "1280", "900", "600", "430", "414", "375", "360", "320",
  "820", "834", "1180", "720", "512",
  "1920", "2560", "3440", "3840",
]).map((s) => (s.includes("x") ? s.split("x").map(Number) : [Number(s), 900]));
const PAGES = ["/", "/pricing", "/company", "/privacy-policy", "/no-such-page"];
const REFS = new Set([1440, 1024, 768, 390]);

let flagged = 0;
const lines = [];
const log = (tag, ok, msg) => { if (!ok) flagged++; const l = `${ok ? "ok" : "!!"} ${tag} ${msg}`; lines.push(l); console.log(l); };
const j = (s) => { try { return JSON.parse(s); } catch { return { err: String(s).slice(0, 200) }; } };

async function page(b, path, wait = 4500) {
  b.logs.length = 0; b.failed.length = 0;
  await b.go(URL + path, wait);
  await b.ev(`document.querySelectorAll('[class*=consent],nextjs-portal').forEach(e=>e.remove())`);
}

const consoleIssues = (b) => [...b.logs.filter((l) => !/cz-shortcut-listen|Download the React DevTools|\[HMR\]/.test(l)), ...b.failed.filter((f) => !/no-such-page/.test(f))];

// 1. Layout + states + menu at every width.
for (const [w, h] of WIDTHS) {
  const b = await launch(w, h, { reduced: true, mobile: w < 768 });
  for (const p of PAGES) {
    await page(b, p);
    const r = j(await b.ev(LAYOUT));
    const bad = r.sw > 0 || r.out?.length || r.broken?.length || r.multi?.length || r.err;
    log(`layout ${w}x${h} ${p}`, !bad, JSON.stringify({ sw: r.sw, out: r.out, broken: r.broken, multi: r.multi, err: r.err }));
    if (w <= 768 && r.btn?.length) {
      const narrow = r.btn.filter((x) => x.w < x.cw - 2);
      if (narrow.length) log(`buttons ${w} ${p}`, REFS.has(w) || !narrow.length, "not full width in card: " + narrow.map((x) => `${x.t} ${x.w}/${x.cw}`).join(", ") + (REFS.has(w) ? " (reference frame — compare with Figma)" : ""));
    }
    const ci = consoleIssues(b);
    log(`console ${w} ${p}`, !ci.length, ci.slice(0, 4).join(" | ") || "clean");
    if (!skip.has("states") && ["/", "/pricing", "/company"].includes(p)) {
      const s = j(await b.ev(STATE_TOGGLES));
      log(`states ${w} ${p}`, !s.issues?.length, `${s.clicked ?? 0} toggles, ${s.issues?.length ? s.issues.join("; ") : "no overflow"}`);
    }
  }
  // Mobile menu: opens, fits or scrolls, Tab stays inside, Esc closes.
  if (!skip.has("menu")) {
    await page(b, "/");
    const has = await b.ev(`(()=>{const x=document.querySelector('button[aria-controls="mobile-menu"]');return !!(x&&x.offsetParent)})()`);
    if (has) {
      await b.ev(`document.querySelector('button[aria-controls="mobile-menu"]').click()`); await sleep(1300);
      const fit = j(await b.ev(`(()=>{const m=document.querySelector('#mobile-menu');const p=m.lastElementChild;const r=p.getBoundingClientRect();return JSON.stringify({h:Math.round(r.height),vh:innerHeight,scroll:p.scrollHeight>p.clientHeight+1?getComputedStyle(p).overflowY:'fits',sw:document.documentElement.scrollWidth-document.documentElement.clientWidth})})()`));
      log(`menu ${w}x${h}`, fit.h <= h + 1 && fit.sw <= 0, JSON.stringify(fit));
      let escaped = 0;
      for (let i = 0; i < 12; i++) { await b.key("Tab", "Tab", 9); if (!(await b.ev(`!!document.activeElement.closest('#mobile-menu')`))) escaped++; }
      await b.key("Escape", "Escape", 27); await sleep(900);
      const closed = await b.ev(`(()=>{const m=document.querySelector('#mobile-menu');return !m||m.inert||m.hasAttribute('inert')})()`);
      log(`menu-keys ${w}x${h}`, !escaped && closed, `Tab left the menu ${escaped}/12 times, Esc closed: ${closed}`);
    }
  }
  b.close(); await sleep(200);
}

// 2. Hover gate: 1025 mouse → hover; 1024 mouse, 1024 touch, iPad Pro 1366 touch → none.
if (!skip.has("hover")) {
  for (const [w, h, touch, expect] of [[1025, 900, false, true], [1024, 900, false, false], [1024, 900, true, false], [1366, 1024, true, false]]) {
    const b = await launch(w, h);
    // setEmulatedMedia ignores hover/pointer; touch emulation is what flips (hover: hover) off.
    if (touch) await b.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page(b, "/");
    const c = j(await b.ev(`(()=>{const el=document.querySelector('main article');el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})})()`));
    await sleep(500); await b.move(c.x, c.y); await sleep(700);
    const on = await b.ev(`document.elementFromPoint(${c.x},${c.y})?.closest('article')?.getAttribute('data-hover')==='on'`);
    log(`hover ${w}x${h} ${touch ? "touch" : "mouse"}`, on === expect, `card hover ${on ? "on" : "off"} (expected ${expect ? "on" : "off"})`);
    b.close(); await sleep(200);
  }
}

// 3. Landscape phone, short laptops: header/hero don't own the screen, footer reachable, sticky bar size.
if (!skip.has("short")) {
  for (const [w, h, mobile] of [[844, 390, true], [1280, 720, false], [1440, 800, false]]) {
    const b = await launch(w, h, { mobile });
    for (const p of ["/", "/pricing", "/company"]) {
      await page(b, p);
      const top = j(await b.ev(`(()=>{const hd=document.querySelector('header').getBoundingClientRect();return JSON.stringify({header:Math.round(hd.height),pos:getComputedStyle(document.querySelector('header')).position})})()`));
      await b.ev(`window.lenis?window.lenis.scrollTo(document.documentElement.scrollHeight,{immediate:true}):scrollTo(0,1e6)`); await sleep(1500);
      const end = j(await b.ev(`(()=>{const f=document.querySelector('footer').getBoundingClientRect();const bars=[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).position==='fixed'&&e.getBoundingClientRect().height>0&&e.getBoundingClientRect().top>=0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0').map(e=>Math.round(e.getBoundingClientRect().height));return JSON.stringify({footerBottom:Math.round(f.bottom),vh:innerHeight,fixed:bars})})()`));
      const ok = top.header < h * 0.35 && Math.abs(end.footerBottom - end.vh) <= 2 && end.fixed.every((x) => x < h * 0.25);
      log(`short ${w}x${h} ${p}`, ok, JSON.stringify({ ...top, ...end }));
    }
    b.close(); await sleep(200);
  }
}

// 4. Classic (Windows) 15px scrollbar: still no sideways scroll.
if (!skip.has("scrollbar")) {
  for (const w of [1440, 1280, 1024, 768, 390]) {
    const b = await launch(w, 900, { reduced: true, scrollbars: true, mobile: false });
    for (const p of ["/", "/pricing", "/company"]) {
      await page(b, p);
      await b.ev(`(()=>{const s=document.createElement('style');s.textContent='::-webkit-scrollbar{width:15px;height:15px;background:#ddd}';document.head.appendChild(s);document.documentElement.style.overflowY='scroll'})()`);
      await sleep(400);
      const sw = await b.ev(`document.documentElement.scrollWidth-document.documentElement.clientWidth`);
      log(`scrollbar ${w} ${p}`, sw <= 0, `scrollWidth − clientWidth = ${sw}`);
    }
    b.close(); await sleep(200);
  }
}

// 5. Anchors land below the sticky bar; keyboard focus is visible.
if (!skip.has("anchors")) {
  for (const w of [1440, 768, 390]) {
    const b = await launch(w, 900, { mobile: w < 768 });
    await page(b, "/#getting-started", 6000);
    const a = j(await b.ev(`(()=>{const s=document.getElementById('getting-started');const t=s.querySelector('h2')||s;const r=t.getBoundingClientRect();const bars=[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).position==='fixed'&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0'&&e.getBoundingClientRect().top<=0&&e.getBoundingClientRect().bottom>0&&e.getBoundingClientRect().height<300).map(e=>Math.round(e.getBoundingClientRect().bottom));return JSON.stringify({titleTop:Math.round(r.top),barBottom:Math.max(0,...bars),vh:innerHeight})})()`));
    log(`anchor ${w} /#getting-started`, a.titleTop >= a.barBottom && a.titleTop < a.vh * 0.8, JSON.stringify(a));
    await page(b, "/");
    await b.key("Tab", "Tab", 9); await sleep(200);
    const f = j(await b.ev(`(()=>{const e=document.activeElement;const s=getComputedStyle(e);return JSON.stringify({el:e.tagName+' '+(e.textContent||'').trim().slice(0,20),outline:s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0,ring:s.boxShadow!=='none'})})()`));
    log(`focus ${w}`, f.outline || f.ring, JSON.stringify(f));
    b.close(); await sleep(200);
  }
}

// 6. Motion on: scroll each page top → bottom; no sideways scroll at any step, no errors.
if (!skip.has("motion")) {
  for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
    const b = await launch(w, h, { mobile: w < 768 });
    for (const p of ["/", "/pricing", "/company"]) {
      await page(b, p, 5000);
      const H = await b.ev("document.documentElement.scrollHeight");
      let worst = 0;
      for (let y = 0; y < H; y += Math.round(h * 0.6)) {
        await b.ev(`window.lenis?window.lenis.scrollTo(${y},{immediate:true}):scrollTo(0,${y})`); await sleep(250);
        worst = Math.max(worst, await b.ev(quickOverflow));
      }
      const ci = consoleIssues(b);
      log(`motion ${w}x${h} ${p}`, worst <= 0 && !ci.length, `max overflow ${worst}px; ${ci.slice(0, 3).join(" | ") || "console clean"}`);
    }
    b.close(); await sleep(200);
  }
}

console.log(`\n${flagged ? `!! ${flagged} flagged` : "all checks passed"}`);
if (OUT) fs.writeFileSync(OUT, lines.join("\n") + "\n");
process.exit(flagged ? 1 : 0);
