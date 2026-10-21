// Performance baseline: opens the game in headless Chrome, plays to a scene, and measures 10 s of it.
//
// Usage (the dev server must be running, e.g. wrangler dev --port 8796):
//   node tools/perf.mjs [--port 8796] [--out <dir>] [--only wedding,wedding-bare,bank,phone-wedding,phone-bank] [--wait 45] [--measure 10]
// Scenes: wedding = /play/?chapter=1&debug, Enter, Begin, then the wedding film at its busiest (--wait seconds after Begin);
//         bank = the same with &nointro: the river bank in play, a few seconds after Begin.
//         -bare adds &bare (Thea as the bare MakeHuman body). phone- runs it as an emulated mid-range phone: 390x844 at 3x,
//         touch (so the game picks its LITE mode), CPU slowed 4x. It is an emulation: the GPU is still this machine's.
// Each run is a fresh browser profile with the service worker bypassed, so the bytes are a first visit's.
// Measured: fps (mean, and the 5th percentile: 1000 / the 95th-percentile frame time) from requestAnimationFrame;
// draw calls and triangles per frame summed over every pass (renderer.info, reset each frame); textures, geometries;
// JS heap; bytes downloaded (Network domain, cross-checked with performance resource entries). Writes perf.json and perf.md.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "./cdp.mjs";

const argv = process.argv.slice(2), opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const PORT = opt("port", 8796), OUT = path.resolve(opt("out", path.join(os.tmpdir(), "elpis-perf"))), WAIT = +opt("wait", 45), MEASURE = +opt("measure", 10);
const RUNS = {
  "wedding": {scene: "wedding"}, "wedding-bare": {scene: "wedding", bare: true}, "bank": {scene: "bank"},
  "phone-wedding": {scene: "wedding", phone: true}, "phone-bank": {scene: "bank", phone: true}
};
const ONLY = opt("only", Object.keys(RUNS).join(",")).split(",");
fs.mkdirSync(OUT, {recursive: true});

// the real GPU of this machine, as the system reports it
let systemGpu = "unknown";
try { systemGpu = execFileSync("system_profiler", ["SPDisplaysDataType"], {encoding: "utf8", timeout: 20000}).split("\n").filter(l => /Chipset Model|Total Number of Cores|Metal Support/.test(l)).map(l => l.trim()).join("; "); } catch {}

// in the page: frame times and renderer.info per frame for ms milliseconds
function sample(ms) {
  const g = window.__game, info = g.renderer.info; info.autoReset = false; info.reset();
  const dt = [], calls = [], tris = []; let last = performance.now(); const t0 = last;
  return new Promise(res => { const f = now => { dt.push(now - last); last = now; calls.push(info.render.calls); tris.push(info.render.triangles); info.reset();
    if (now - t0 < ms) requestAnimationFrame(f); else { info.autoReset = true; res(); } }; requestAnimationFrame(f); }).then(() => {
    dt.shift(); calls.shift(); tris.shift(); /* (the first callback has no frame before it) */
    const sorted = [...dt].sort((a, b) => a - b), q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))], avg = a => a.reduce((s, x) => s + x, 0) / a.length;
    let objects = 0, people = 0; g.scene.traverse(o => { objects++; if (o.isSkinnedMesh) people++; });
    return {frames: dt.length, seconds: +(dt.reduce((s, x) => s + x, 0) / 1000).toFixed(2), fpsAvg: +(dt.length / (dt.reduce((s, x) => s + x, 0) / 1000)).toFixed(1),
      fpsP5: +(1000 / q(.95)).toFixed(1), frameMsMedian: +q(.5).toFixed(2), frameMsP95: +q(.95).toFixed(2), frameMsMax: +sorted[sorted.length - 1].toFixed(1),
      drawCalls: Math.round(avg(calls)), drawCallsMax: Math.max(...calls), triangles: Math.round(avg(tris)), trianglesMax: Math.max(...tris),
      textures: info.memory.textures, geometries: info.memory.geometries, programs: info.programs?.length, sceneObjects: objects, skinnedMeshes: people,
      lite: !g.renderer.shadowMap.enabled, pixelRatio: g.renderer.getPixelRatio(), canvas: [g.renderer.domElement.width, g.renderer.domElement.height],
      resourceBytes: performance.getEntriesByType("resource").reduce((s, e) => s + (e.transferSize || 0), 0)};
  });
}

async function run(name, {scene, bare = false, phone = false}) {
  const b = phone ? await launch({width: 390, height: 844, scale: 3, mobile: true}) : await launch({width: 1440, height: 900, scale: 2});
  const res = {name, scene, bare, phone};
  try {
    let bytes = 0, requests = 0; const big = new Map();
    b.on("Network.responseReceived", p => big.set(p.requestId, p.response.url));
    b.on("Network.loadingFinished", p => { bytes += p.encodedDataLength; requests++; const u = big.get(p.requestId); if (u) big.set(p.requestId, [u, p.encodedDataLength]); });
    await b.send("Network.enable"); await b.send("Network.setBypassServiceWorker", {bypass: true});
    if (phone) {
      await b.send("Emulation.setTouchEmulationEnabled", {enabled: true, maxTouchPoints: 5});
      await b.send("Emulation.setUserAgentOverride", {userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36", platform: "Android"});
      await b.send("Emulation.setHardwareConcurrencyOverride", {hardwareConcurrency: 8}).catch(() => {}); /* (a mid-range phone has 8 cores; the game's LITE test then rests on touch, as on a real phone) */
      await b.send("Emulation.setCPUThrottlingRate", {rate: 4});
    }
    const t0 = Date.now();
    await b.goto(`http://localhost:${PORT}/play/?chapter=1&debug${bare ? "&bare" : ""}${scene === "bank" ? "&nointro" : ""}`, {timeout: 120000});
    await b.until(`!document.querySelector("#go").disabled`, {timeout: phone ? 300000 : 120000, every: 500});
    res.loadSeconds = +((Date.now() - t0) / 1000).toFixed(1); res.bytesAtReady = bytes; res.requestsAtReady = requests;
    res.gpu = await b.eval(`(() => { const c = document.createElement("canvas").getContext("webgl2"), e = c.getExtension("WEBGL_debug_renderer_info"); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; })()`);
    res.liteMedia = await b.eval(`matchMedia("(pointer: coarse)").matches`);
    await b.eval(`document.querySelector("#go").click()`); await sleep(800);
    await b.eval(`document.querySelector("#begin").click()`); const begun = Date.now();
    const wait = scene === "wedding" ? WAIT : 6;
    await sleep(wait * 1000 - (Date.now() - begun));
    res.secondsAfterBegin = +((Date.now() - begun) / 1000).toFixed(1);
    const half = b.eval(`(${sample})(${MEASURE * 1000})`, {timeout: (MEASURE + 60) * 1000});
    await sleep(MEASURE * 500); res.shot = await b.shot(path.join(OUT, `${name}.jpg`));
    Object.assign(res, await half);
    res.heapMB = +((await b.send("Runtime.getHeapUsage")).usedSize / 1048576).toFixed(1);
    res.bytesTotal = bytes; res.requestsTotal = requests;
    res.film = await b.eval(`(() => { const s = document.querySelector("#sub"); return s && s.classList.contains("on") ? s.textContent.trim().slice(0, 90) : ""; })()`);
    res.biggest = [...big.values()].filter(Array.isArray).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([u, n]) => [u.replace(/^https?:\/\/[^/]+/, ""), n]);
    res.pageErrors = b.errors.slice(0, 5);
  } catch (e) { res.error = String(e.message || e); }
  finally { await b.close(); }
  return res;
}

const results = {when: new Date().toISOString(), systemGpu, node: process.version, runs: []};
for (const name of ONLY) {
  if (!RUNS[name]) { console.error("unknown run", name); continue; }
  console.log("run", name, "..."); const r = await run(name, RUNS[name]); results.runs.push(r);
  console.log(r.error ? "  error: " + r.error : `  ${r.fpsAvg} fps avg, ${r.fpsP5} fps 5th pct, ${r.drawCalls} calls, ${r.triangles} tris, ${(r.bytesTotal / 1048576).toFixed(1)} MB, heap ${r.heapMB} MB, lite ${r.lite}`);
  await sleep(3000); // (a breather between runs: one browser at a time, and a cooler machine)
}
fs.writeFileSync(path.join(OUT, "perf.json"), JSON.stringify(results, null, 1));
const MB = n => (n / 1048576).toFixed(1), md = [`Measured ${results.when.slice(0, 10)} in headless Chrome on: ${results.runs[0]?.gpu || "?"} (system: ${systemGpu})`, "",
  "| run | fps mean | fps 5th pct | frame ms p95 | draw calls | triangles | textures | geometries | JS heap MB | MB downloaded (ready / total) | load s | LITE | canvas px |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|"];
for (const r of results.runs) md.push(r.error ? `| ${r.name} | error: ${r.error} |` : `| ${r.name} | ${r.fpsAvg} | ${r.fpsP5} | ${r.frameMsP95} | ${r.drawCalls} | ${r.triangles.toLocaleString("en")} | ${r.textures} | ${r.geometries} | ${r.heapMB} | ${MB(r.bytesAtReady)} / ${MB(r.bytesTotal)} | ${r.loadSeconds} | ${r.lite ? "yes" : "no"} | ${r.canvas.join("x")} |`);
fs.writeFileSync(path.join(OUT, "perf.md"), md.join("\n") + "\n");
console.log("\n" + md.join("\n") + "\n\nwrote " + path.join(OUT, "perf.json"));
