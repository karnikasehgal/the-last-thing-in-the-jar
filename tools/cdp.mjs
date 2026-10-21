// A small headless Chrome driver over the DevTools protocol, for the measuring tools (check_clipping.mjs, perf.mjs).
// No dependencies: Node 22's own WebSocket. One browser at a time; it is always killed on exit, error or Ctrl-C.
//   const b = await launch({width: 1280, height: 720, scale: 1}); await b.goto(url); await b.eval("1 + 1"); await b.shot(file); await b.close();
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const live = new Set();
const killAll = () => { for (const b of live) b.kill(); };
process.on("exit", killAll);
for (const s of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(s, () => { killAll(); process.exit(130); });
process.on("uncaughtException", e => { console.error(e); killAll(); process.exit(1); });

export async function launch({width = 1280, height = 720, scale = 1, mobile = false, args = [], log = true} = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elpis-cdp-"));
  // the real GPU through Metal where headless allows it (otherwise Chrome falls back to its software renderer)
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, `--window-size=${width},${height}`,
    "--no-first-run", "--no-default-browser-check", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", ...args, "about:blank"], {stdio: ["ignore", "ignore", "pipe"]});
  const b = {proc, kill() { try { proc.kill("SIGKILL"); } catch {} try { fs.rmSync(dir, {recursive: true, force: true}); } catch {} live.delete(b); }};
  live.add(b);
  let err = ""; const wsUrl = await within(new Promise((res, rej) => {
    proc.stderr.on("data", d => { err += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(err); if (m) res(m[1]); }); proc.on("exit", c => rej(new Error("Chrome exited " + c + ": " + err.slice(-400)))); }), 20000, "Chrome start");
  proc.stderr.resume();
  const port = new URL(wsUrl).port;
  const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const wait = new Map(), handlers = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data);
    if (m.id && wait.has(m.id)) { const [res, rej] = wait.get(m.id); wait.delete(m.id); m.error ? rej(new Error(m.error.message + " " + (m.error.data || ""))) : res(m.result); }
    else if (m.method) for (const f of handlers.get(m.method) || []) f(m.params); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; wait.set(i, [res, rej]); ws.send(JSON.stringify({id: i, method, params})); });
  const on = (method, f) => { if (!handlers.has(method)) handlers.set(method, []); handlers.get(method).push(f); };
  b.errors = [];
  on("Runtime.exceptionThrown", p => { const d = p.exceptionDetails, msg = d.exception?.description || d.text; b.errors.push(msg); if (log) console.error("[page exception]", msg.split("\n").slice(0, 3).join(" | ")); });
  on("Runtime.consoleAPICalled", p => { if (p.type === "error" && log) console.error("[page console.error]", p.args.map(a => a.value ?? a.description).join(" ").slice(0, 300)); });
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: scale, mobile});
  Object.assign(b, {send, on, port,
    async goto(url, {timeout = 60000} = {}) {
      const loaded = new Promise(res => on("Page.loadEventFired", res));
      await send("Page.navigate", {url}); await within(loaded, timeout, "load " + url).catch(e => console.error(e.message));
    },
    async eval(expression, {timeout = 120000} = {}) {
      const r = await within(send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true}), timeout, "eval " + expression.slice(0, 80));
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    // wait until an expression in the page is truthy
    async until(expression, {timeout = 90000, every = 250} = {}) {
      const t0 = Date.now(); for (;;) { const v = await b.eval(`(() => { try { return ${expression}; } catch { return false; } })()`).catch(() => false); if (v) return v;
        if (Date.now() - t0 > timeout) throw new Error("timed out waiting for " + expression); await new Promise(r => setTimeout(r, every)); }
    },
    async shot(file) { const {data} = await send("Page.captureScreenshot", {format: file.endsWith(".jpg") ? "jpeg" : "png", quality: file.endsWith(".jpg") ? 85 : undefined});
      fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, Buffer.from(data, "base64")); return file; },
    async close() { try { ws.close(); } catch {} b.kill(); }
  });
  return b;
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
// a promise that gives up after ms, without its timer keeping node alive afterwards
function within(p, ms, what) { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timed out: " + what)), ms); })]).finally(() => clearTimeout(t)); }
