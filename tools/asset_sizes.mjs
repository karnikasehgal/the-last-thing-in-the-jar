// Character asset sizes: for each character file, its size on disk, triangles and vertices as stored, and its textures
// (count, largest side in pixels, bytes). Reads the GLB's own JSON and image headers; nothing is decoded.
//
// Usage:
//   node tools/asset_sizes.mjs                     a markdown table of public/play/assets/{rb,bare,toon,crowd,cloth}
//   node tools/asset_sizes.mjs --runtime [--port 8796]
//                                                  also the triangles as the game dresses each main character (the clothes are
//                                                  built in code at load time), read from the look-dev page; needs the dev server
//   node tools/asset_sizes.mjs --json              the same as JSON
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../public/play/assets");
const argv = process.argv.slice(2), PORT = argv.includes("--port") ? argv[argv.indexOf("--port") + 1] : 8796;
const DIRS = ["rb", "bare", "toon", "crowd", "cloth"];

// width and height from an image's header (WebP, PNG, JPEG)
function dims(b) {
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (kind === "VP8L") { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
    if (kind === "VP8X") return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  }
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; }
  return [0, 0];
}
export function glbInfo(file) {
  const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.toString("utf8", 20, 20 + jl)), bin = 20 + jl + 8;
  let tris = 0, verts = 0;
  for (const m of j.meshes || []) for (const p of m.primitives) { verts += j.accessors[p.attributes.POSITION].count; tris += (p.indices != null ? j.accessors[p.indices].count : j.accessors[p.attributes.POSITION].count) / 3; }
  const tex = (j.images || []).map(im => { if (im.bufferView == null) return {w: 0, h: 0, bytes: 0, uri: im.uri}; const v = j.bufferViews[im.bufferView], s = bin + (v.byteOffset || 0), data = b.subarray(s, s + v.byteLength), [w, h] = dims(data); return {w, h, bytes: v.byteLength, mime: im.mimeType}; });
  return {file: path.relative(ROOT, file), bytes: b.length, tris, verts, textures: tex.length, maxTex: Math.max(0, ...tex.map(t => Math.max(t.w, t.h))), texBytes: tex.reduce((s, t) => s + t.bytes, 0),
    texGpu: tex.reduce((s, t) => s + t.w * t.h * 4 * 4 / 3, 0), /* (uncompressed RGBA with mipmaps: what it takes in GPU memory once loaded) */
    texSizes: [...new Set(tex.map(t => `${t.w}x${t.h}`))].join(" "), animations: (j.animations || []).length, skinned: (j.skins || []).length > 0};
}
export function allAssets() {
  const out = [];
  for (const d of DIRS) { const dir = path.join(ROOT, d); if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".glb")).sort((a, b) => a.localeCompare(b, "en", {numeric: true}))) out.push({dir: d, ...glbInfo(path.join(dir, f))}); }
  return out;
}

// the dressed character as the game builds it, from the look-dev page (body and clothes, triangles)
export async function runtimeTris(ids, port = PORT) {
  const { launch } = await import("./cdp.mjs");
  const b = await launch({width: 640, height: 360, log: false}), out = {};
  try { for (const id of ids) { const [who, bare] = id.split(":");
      await b.goto(`http://localhost:${port}/play/lookdev.html?id=${who}${bare ? "&bare=1" : ""}&t=0`); await b.until("window.__look?.ready", {timeout: 60000});
      out[id] = await b.eval("(() => { const s = window.__look.stats(); return {tris: s.tris, body: s.body, clothes: s.garment, meshes: s.meshes, textures: s.textures.length, maxTex: Math.max(0, ...s.textures.map(t => Math.max(t[0], t[1])))}; })()"); } }
  finally { await b.close(); }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = allAssets(), MB = n => (n / 1048576).toFixed(2);
  let rt = null;
  if (argv.includes("--runtime")) rt = await runtimeTris([...rows.filter(r => r.dir === "rb" && !/^anims/.test(path.basename(r.file))).map(r => path.basename(r.file, ".glb")), "thea:bare",
    ...rows.filter(r => r.dir === "crowd").map(r => r.file.replace(/\.glb$/, ""))]);
  if (argv.includes("--json")) { console.log(JSON.stringify({rows, runtime: rt}, null, 1)); process.exit(0); }
  console.log("| file | MB | tris in file | verts | textures | largest texture px | texture MB (file) | texture MB (GPU) |" + (rt ? " dressed tris (body + clothes) |" : ""));
  console.log("|---|---:|---:|---:|---:|---:|---:|---:|" + (rt ? "---:|" : ""));
  for (const r of rows) { const k = r.dir === "bare" ? "thea:bare" : r.dir === "rb" ? path.basename(r.file, ".glb") : r.dir === "crowd" ? r.file.replace(/\.glb$/, "") : null, d = rt && k && rt[k];
    console.log(`| ${r.file} | ${MB(r.bytes)} | ${r.tris.toLocaleString("en")} | ${r.verts.toLocaleString("en")} | ${r.textures} | ${r.maxTex || "-"} | ${MB(r.texBytes)} | ${MB(r.texGpu)} |` + (rt ? ` ${d ? `${d.tris.toLocaleString("en")} (${d.body.toLocaleString("en")} + ${d.clothes.toLocaleString("en")})` : "-"} |` : "")); }
}
