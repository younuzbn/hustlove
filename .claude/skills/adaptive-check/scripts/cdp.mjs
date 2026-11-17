// Headless Chrome over CDP with a normal Chrome UA (the site's proxy serves a static robot form to HeadlessChrome).
// launch(w, h, { reduced, mobile, scrollbars }) → { send, ev, shot, full, go, move, click, key, close, logs, failed }
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export async function launch(w, h, { reduced = false, mobile = false, scrollbars = false } = {}) {
  const port = 9400 + Math.floor(Math.random() * 500);
  const dir = path.join(os.tmpdir(), `adaptive-check-chrome-${port}`);
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
    ...(scrollbars ? [] : ["--hide-scrollbars"]), `--window-size=${w},${h}`, "about:blank"], { stdio: "ignore" });
  let target;
  for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {} }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const pending = new Map(); const logs = []; const failed = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) { pending.get(m.id)(m.result ?? m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description ?? "").slice(0, 200));
    if (m.method === "Network.responseReceived" && m.params.response.status >= 400) failed.push(m.params.response.status + " " + m.params.response.url.slice(0, 160));
    if (m.method === "Network.loadingFailed" && !m.params.canceled) failed.push("FAIL " + m.params.errorText);
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) logs.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200));
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Network.setUserAgentOverride", { userAgent: UA });
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return "ERR " + JSON.stringify(r.exceptionDetails).slice(0, 300); return r.result?.value; };
  const shot = async (out, clip) => { const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!clip, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); if (s.data) fs.writeFileSync(out, Buffer.from(s.data, "base64")); };
  const full = async (out) => { const H = await ev("document.documentElement.scrollHeight"); await send("Emulation.setDeviceMetricsOverride", { width: w, height: H, deviceScaleFactor: 1, mobile }); await sleep(1200); await shot(out); await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile }); return H; };
  const go = async (url, wait = 3500) => { await send("Page.navigate", { url }); await sleep(wait); };
  const move = async (x, y) => send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  const click = async (x, y) => { await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }); };
  const key = async (k, code = k, keyCode = 0, mods = 0) => { for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: keyCode, modifiers: mods }); };
  const close = () => { ws.close(); chrome.kill(); setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }, 1500); };
  return { send, ev, shot, full, go, move, click, key, close, logs, failed };
}
