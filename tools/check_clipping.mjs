// Clipping check: how much of a character's clothing goes inside the body, clip by clip, frame by frame.
//
// Usage (the dev server must be running, e.g. wrangler dev --port 8796):
//   node tools/check_clipping.mjs <id> [--bare] [--toon] [--frames 12] [--clips idle,walk,...] [--port 8796]
//                                 [--out <dir>] [--no-shots] [--raw]
//   node tools/check_clipping.mjs thea --bare --out /tmp/clip      (Thea as the bare MakeHuman body)
//   node tools/check_clipping.mjs mikon --out /tmp/clip            (Mikon, Rocketbox)
// Writes <out>/<id>[-bare|-toon].json and .txt, and with shots, <out>/<id>-<clip>.png: the worst frame of each clip on
// the look-dev page (public/play/lookdev.html), the offending cloth marked in red (orange: only inside skin that isn't drawn).
//
// How it measures. The character is built by the game's own code on the look-dev page and each clip is held at N evenly
// spaced times. At each, every garment vertex (meshes with userData.garment) is skinned to its world position
// (SkinnedMesh.getVertexPosition) and so is every vertex of the body; the body gets fresh normals from its posed surface.
// A garment vertex is inside the body by d when its nearest body vertex (within 6 cm) has it d behind its surface
// plane, d = -dot(cloth - skin, skin normal), and a ray from it along that normal first meets the body from behind
// (it is leaving the body: inside, not just behind a neighbouring curve). The reverse, skin poking out through cloth:
// drawn body vertices with cloth over them at rest (within 1.5 cm, straight out along the normal, on the same bones),
// each paired with that cloth vertex, measured by how far the skin passes it in later frames.
// What counts: the game does not draw some of the skin (people.js discards the body under the clothes, by bind-pose
// region, and garments can be trimmed by a GLSL test the same way). Those rules are evaluated here per vertex, so the
// verdict is about what can be seen: cloth inside skin that is drawn. --raw judges by all skin instead. Both are reported.
// Verdict per clip: FAIL when, at any sampled frame, more than 0.5% of the drawn garment vertices are more than 5 mm inside.
// Seated clips (sit*) are checked on the seated build, as the game dresses a seated person differently.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { launch, sleep } from "./cdp.mjs";

const argv = process.argv.slice(2), flag = n => argv.includes("--" + n), opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const VALUED = ["frames", "clips", "port", "out"], ID = argv.find((a, i) => !a.startsWith("--") && !VALUED.includes(argv[i - 1]?.slice(2)));
if (!ID || ID.startsWith("--")) { console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(0, 12).join("\n")); process.exit(1); }
const BARE = flag("bare"), TOON = flag("toon"), FRAMES = +opt("frames", 12), PORT = opt("port", 8796), RAW = flag("raw"), SHOTS = !flag("no-shots");
const OUT = path.resolve(opt("out", path.join(os.tmpdir(), "elpis-clipping"))), TAG = ID + (BARE ? "-bare" : TOON ? "-toon" : "");
const ONLY = opt("clips", "") ? opt("clips").split(",") : null;
const LIMIT = {depth: .005, share: .005, report: .003}; // FAIL: more than 0.5% of garment vertices over 5 mm inside
fs.mkdirSync(OUT, {recursive: true});

// --- runs in the page: window.__look from lookdev.html ---
function install({first, keep}) {
  const L = window.__look, {THREE, person} = L, root = person.root, seated = L.opts.seated;
  root.updateMatrixWorld(true);
  const glsl = (src, args) => new Function(...args, `with (Math) { return !!(${src}); }`); // the GLSL tests are plain arithmetic: they read as JS
  const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const body = [], cloth = [];
  root.traverse(o => { if (!o.isMesh || !vis(o)) return; const name = [].concat(o.material)[0]?.name || "";
    if (o.userData.garment) cloth.push(o); else if (o.isSkinnedMesh && /_body|_head/i.test(name) && !/opacity/i.test(name)) body.push(o); });
  // which body vertices are drawn: the skin shader's discards in people.js (makeRealPerson), per vertex
  const hide = person.bare && person.hide ? glsl(person.hide, ["vB", "vT"]) : null, low = seated ? .58 : .1, wrist = person.wrist, cover = person.cover?.value || {x: 9, y: -9};
  const drawnSkin = (b, h, t) => {
    if (person.bare && hide && h < .6 && hide(b, t)) return false;
    if (!person.toon && h < .6 && Math.abs(b.x) < .72 && b.y > low && b.y < 1.5 && (b.y > .95 || Math.abs(b.x) > .28)) return false;
    if (!person.toon && b.y > 1.46 && Math.abs(b.x) < .22) return false;
    if (h < .6 && Math.abs(b.x) < .2 && b.y > cover.x && b.y < cover.y) return false;
    if (!person.toon && Math.abs(b.x) < wrist - .004 && b.y > low && b.y < 1.5) return false;
    return true; };
  const B = {meshes: body, n: 0}, C = {meshes: cloth, n: 0};
  for (const set of [B, C]) set.n = set.meshes.reduce((s, o) => s + o.geometry.attributes.position.count, 0);
  B.pos = new Float32Array(B.n * 3); B.nrm = new Float32Array(B.n * 3); B.drawn = new Uint8Array(B.n);
  C.pos = new Float32Array(C.n * 3); C.drawn = new Uint8Array(C.n);
  { let i = 0; const b = {x: 0, y: 0, z: 0};
    for (const o of body) { const g = o.geometry, ab = g.attributes.aBind, ah = g.attributes.aHand, at = g.attributes.aTorso, cut = /_body/i.test([].concat(o.material)[0].name) && ab;
      for (let k = 0; k < g.attributes.position.count; k++, i++) { if (!cut) { B.drawn[i] = 1; continue; } b.x = ab.getX(k); b.y = ab.getY(k); b.z = ab.getZ(k); B.drawn[i] = drawnSkin(b, ah ? ah.getX(k) : 0, at ? at.getX(k) : 0) ? 1 : 0; } } }
  // which cloth vertices are drawn: a trimmed garment's own test, on its bind-pose position in the tailor's space
  { let i = 0; const toNorm = new THREE.Matrix4().makeScale(1, 1 / person.norm.k, 1).multiply(new THREE.Matrix4().makeRotationY(-person.norm.turn)), v = new THREE.Vector3();
    for (const o of cloth) { const key = !Array.isArray(o.material) && o.material.customProgramCacheKey?.(), test = typeof key === "string" && key.startsWith("clip") ? glsl(key.slice(4), ["b"]) : null, pos = o.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++, i++) { if (!test) { C.drawn[i] = 1; continue; } v.fromBufferAttribute(pos, k).applyMatrix4(toNorm); C.drawn[i] = test(v) ? 1 : 0; } } }
  const v = new THREE.Vector3();
  const skin = set => { let i = 0; for (const o of set.meshes) { const n = o.geometry.attributes.position.count;
    for (let k = 0; k < n; k++, i++) { if (o.isSkinnedMesh) o.getVertexPosition(k, v); else v.fromBufferAttribute(o.geometry.attributes.position, k); v.applyMatrix4(o.matrixWorld); set.pos[i * 3] = v.x; set.pos[i * 3 + 1] = v.y; set.pos[i * 3 + 2] = v.z; } } };
  const normals = () => { const N = B.nrm; N.fill(0); let off = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), P = B.pos;
    for (const o of body) { const g = o.geometry, n = g.attributes.position.count, ix = g.index ? g.index.array : null, m = ix ? ix.length : n;
      for (let t = 0; t < m; t += 3) { const i0 = off + (ix ? ix[t] : t), i1 = off + (ix ? ix[t + 1] : t + 1), i2 = off + (ix ? ix[t + 2] : t + 2);
        a.set(P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]); b.set(P[i2 * 3] - P[i0 * 3], P[i2 * 3 + 1] - P[i0 * 3 + 1], P[i2 * 3 + 2] - P[i0 * 3 + 2]); c.crossVectors(a, b);
        for (const j of [i0, i1, i2]) { N[j * 3] += c.x; N[j * 3 + 1] += c.y; N[j * 3 + 2] += c.z; } }
      off += n; }
    for (let i = 0; i < B.n; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; } };
  // a grid of 3 cm cells for nearest-vertex queries
  const H = .03, cell = (x, y, z) => ((Math.floor(x / H) + 512) * 1024 + (Math.floor(y / H) + 512)) * 1024 + (Math.floor(z / H) + 512);
  const grid = (P, n, use) => { const g = new Map(); for (let i = 0; i < n; i++) { if (use && !use[i]) continue; const k = cell(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); let l = g.get(k); if (!l) g.set(k, l = []); l.push(i); } return g; };
  const nearest = (g, P, x, y, z, R) => { let best = -1, bd = R * R; const cx = Math.floor(x / H), cy = Math.floor(y / H), cz = Math.floor(z / H);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) { const l = g.get(((cx + dx + 512) * 1024 + (cy + dy + 512)) * 1024 + (cz + dz + 512)); if (!l) continue;
      for (const i of l) { const d = (P[i * 3] - x) ** 2 + (P[i * 3 + 1] - y) ** 2 + (P[i * 3 + 2] - z) ** 2; if (d < bd) { bd = d; best = i; } } }
    return best; };
  // each vertex's bones (for pairing skin with the cloth cut from it) and the body's triangles (for the ray test)
  const bonesOf = set => { set.bone = new Array(set.n * 4); set.wt = new Float32Array(set.n * 4); let i = 0;
    for (const o of set.meshes) { const g = o.geometry, n = g.attributes.position.count, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (let k = 0; k < n; k++, i++) if (o.isSkinnedMesh && si) for (let c = 0; c < 4; c++) { set.bone[i * 4 + c] = o.skeleton.bones[si.getComponent(k, c)]; set.wt[i * 4 + c] = sw.getComponent(k, c); } } };
  bonesOf(B); bonesOf(C);
  const share = (i, j) => { let w = 0; for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) if (B.bone[i * 4 + a] && B.bone[i * 4 + a] === C.bone[j * 4 + c]) w += Math.min(B.wt[i * 4 + a], C.wt[j * 4 + c]); return w; };
  const TRI = []; { let off = 0; for (const o of body) { const g = o.geometry, n = g.attributes.position.count, ix = g.index ? g.index.array : null, m = ix ? ix.length : n;
    for (let t = 0; t < m; t += 3) TRI.push(off + (ix ? ix[t] : t), off + (ix ? ix[t + 1] : t + 1), off + (ix ? ix[t + 2] : t + 2)); off += n; } }
  // the first surface a ray from inside meets is one it leaves by: hit from behind (the triangle faces the way the ray goes)
  const leaves = (tg, x, y, z, dx, dy, dz, far) => { const P = B.pos; let best = far, back = false; const cx = Math.floor(x / H), cy = Math.floor(y / H), cz = Math.floor(z / H), seen = new Set();
    for (let ex = -2; ex <= 2; ex++) for (let ey = -2; ey <= 2; ey++) for (let ez = -2; ez <= 2; ez++) { const l = tg.get(((cx + ex + 512) * 1024 + (cy + ey + 512)) * 1024 + (cz + ez + 512)); if (!l) continue;
      for (const t of l) { if (seen.has(t)) continue; seen.add(t); const a = TRI[t] * 3, b = TRI[t + 1] * 3, c = TRI[t + 2] * 3;
        const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2], e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) continue;
        const sx = x - P[a], sy = y - P[a + 1], sz = z - P[a + 2], u = (sx * px + sy * py + sz * pz) / det; if (u < 0 || u > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, w = (dx * qx + dy * qy + dz * qz) / det; if (w < 0 || u + w > 1) continue;
        const d = (e2x * qx + e2y * qy + e2z * qz) / det; if (d > 0 && d < best) { best = d; back = det < 0; } } } /* (det < 0: the ray meets the triangle's back, as it would leaving the body) */
    return back; };
  // one frame: depth of every cloth vertex inside the skin, and skin poking out through the cloth cut from it
  const measure = pairs => {
    skin(B); skin(C); normals(); const gb = grid(B.pos, B.n), tg = new Map();
    for (let t = 0; t < TRI.length; t += 3) { const a = TRI[t] * 3, k = cell(B.pos[a], B.pos[a + 1], B.pos[a + 2]); let l = tg.get(k); if (!l) tg.set(k, l = []); l.push(t); }
    const depth = new Float32Array(C.n), seen = new Uint8Array(C.n); // seen: inside skin that is drawn
    for (let i = 0; i < C.n; i++) { if (!C.drawn[i]) continue; const x = C.pos[i * 3], y = C.pos[i * 3 + 1], z = C.pos[i * 3 + 2], j = nearest(gb, B.pos, x, y, z, .06); if (j < 0) continue;
      const nx = B.nrm[j * 3], ny = B.nrm[j * 3 + 1], nz = B.nrm[j * 3 + 2], d = -((x - B.pos[j * 3]) * nx + (y - B.pos[j * 3 + 1]) * ny + (z - B.pos[j * 3 + 2]) * nz);
      if (d > .001 && leaves(tg, x, y, z, nx, ny, nz, .06)) { depth[i] = d; seen[i] = B.drawn[j]; } } /* (behind the nearest skin's plane, and a ray outward leaves the body: inside) */
    const poke = new Float32Array(B.n);
    if (pairs) for (let i = 0; i < B.n; i++) { const j = pairs[i]; if (j < 0) continue;
      const s = (C.pos[j * 3] - B.pos[i * 3]) * B.nrm[i * 3] + (C.pos[j * 3 + 1] - B.pos[i * 3 + 1]) * B.nrm[i * 3 + 1] + (C.pos[j * 3 + 2] - B.pos[i * 3 + 2]) * B.nrm[i * 3 + 2]; if (s < 0) poke[i] = -s; }
    return {depth, seen, poke};
  };
  // the skin the clothes cover at rest (the first frame of the first clip): drawn skin with cloth over it within 1.5 cm, straight out
  // along its normal, moved by the same bones; each such skin vertex is paired with that cloth vertex for every frame after
  L.pose(first, 0); root.updateMatrixWorld(true); skin(B); skin(C); normals();
  const pairs = new Int32Array(B.n).fill(-1); { const gc = grid(C.pos, C.n, C.drawn);
    for (let i = 0; i < B.n; i++) { if (!B.drawn[i]) continue; const x = B.pos[i * 3], y = B.pos[i * 3 + 1], z = B.pos[i * 3 + 2], j = nearest(gc, C.pos, x, y, z, .015); if (j < 0) continue;
      const vx = C.pos[j * 3] - x, vy = C.pos[j * 3 + 1] - y, vz = C.pos[j * 3 + 2] - z, l = Math.hypot(vx, vy, vz) || 1;
      if ((vx * B.nrm[i * 3] + vy * B.nrm[i * 3 + 1] + vz * B.nrm[i * 3 + 2]) / l > .7 && share(i, j) > .5) pairs[i] = j; } }
  const covered = pairs.map(j => j >= 0 ? 1 : 0);
  const sum = a => a.reduce((s, x) => s + x, 0);
  const at = (clip, t) => { L.pose(clip, t); root.updateMatrixWorld(true); return measure(pairs); };
  window.__clipcheck = {
    counts: {bodyVerts: B.n, drawnBodyVerts: sum(B.drawn), clothVerts: C.n, drawnClothVerts: sum(C.drawn), coveredSkinVerts: sum(covered), clothMeshes: cloth.length},
    // a clip sampled at evenly spaced times: per frame, how deep and how much
    sample(name, frames) {
      const clip = person.clips?.[name]; if (!clip) return {clip: name, missing: true};
      const r = {clip: name, seated, duration: +clip.duration.toFixed(3), frames: []};
      for (let f = 0; f < frames; f++) {
        const t = clip.duration * f / frames, {depth, seen, poke} = at(name, t);
        let max = 0, maxRaw = 0, n3 = 0, n5 = 0, r3 = 0, r5 = 0, pmax = 0, p3 = 0;
        for (let i = 0; i < C.n; i++) { const d = depth[i]; if (!d) continue; if (d > maxRaw) maxRaw = d; if (d > keep.report) r3++; if (d > keep.depth) r5++;
          if (seen[i]) { if (d > max) max = d; if (d > keep.report) n3++; if (d > keep.depth) n5++; } }
        for (let i = 0; i < B.n; i++) { if (poke[i] > pmax) pmax = poke[i]; if (poke[i] > keep.report) p3++; }
        r.frames.push({t: +t.toFixed(3), maxMm: +(max * 1000).toFixed(1), over3: n3, over5: n5, rawMaxMm: +(maxRaw * 1000).toFixed(1), rawOver3: r3, rawOver5: r5, pokeMaxMm: +(pmax * 1000).toFixed(1), pokeOver3: p3});
      }
      return r;
    },
    // for a closer look: the skin under each vertex more than 5 mm inside, in the tailor's bind-pose metres
    explain(clip, t) { const {depth, seen} = at(clip, t), gb = grid(B.pos, B.n), out = []; let off = 0; const where = [];
      for (const o of body) { where.push([off, o]); off += o.geometry.attributes.position.count; }
      for (let i = 0; i < C.n; i++) if (depth[i] > .005 && seen[i]) { const j = nearest(gb, B.pos, C.pos[i * 3], C.pos[i * 3 + 1], C.pos[i * 3 + 2], .06), [o0, o] = where.filter(w => w[0] <= j).pop(), k = j - o0, g = o.geometry;
        out.push({d: +(depth[i] * 1000).toFixed(1), bind: [g.attributes.aBind?.getX(k), g.attributes.aBind?.getY(k), g.attributes.aBind?.getZ(k)].map(v => +(v ?? 0).toFixed(3)), hand: +(g.attributes.aHand?.getX(k) ?? -1).toFixed(2), torso: +(g.attributes.aTorso?.getX(k) ?? -1).toFixed(2), mat: o.material.name}); }
      return out; },
    // one frame held, the offending cloth marked (red: inside drawn skin; orange: only inside skin that isn't drawn), turned to face the camera
    mark(clip, t, raw) {
      L.turn("front"); const {depth, seen} = at(clip, t), pts = [], pelvis = person.root.getObjectByName("Bip01_Pelvis").getWorldPosition(new THREE.Vector3());
      let sx = 0, sz = 0;
      for (let i = 0; i < C.n; i++) if (depth[i] > keep.report && (raw || seen[i])) { pts.push(C.pos[i * 3], C.pos[i * 3 + 1], C.pos[i * 3 + 2]); sx += C.pos[i * 3] - pelvis.x; sz += C.pos[i * 3 + 2] - pelvis.z; }
      L.turn(pts.length ? String(Math.round(THREE.MathUtils.radToDeg(Math.atan2(sx, sz)))) : "front");
      L.mark(pts, raw ? 0xff8a00 : 0xff1010); L.render();
      return pts.length / 3;
    }
  };
  return window.__clipcheck.counts;
}

const url = (seated) => `http://localhost:${PORT}/play/lookdev.html?id=${ID}${BARE ? "&bare=1" : ""}${TOON ? "&toon=1" : ""}${seated ? "&seated=1" : ""}&t=0&light=neutral&view=front`;
const b = await launch({width: 1280, height: 720});
const report = {id: ID, build: BARE ? "bare" : TOON ? "toon" : "rocketbox", frames: FRAMES, thresholds: {failDepthMm: 5, failShare: "0.5% of drawn garment vertices", reportDepthMm: 3}, verdictBy: RAW ? "all skin (--raw)" : "drawn skin", builds: {}, clips: []};
try {
  for (const seated of [false, true]) {
    await b.goto(url(seated)); await b.until("window.__look?.ready", {timeout: 90000});
    const all = await b.eval("Object.keys(window.__look.person.clips || {})");
    const mine = all.filter(c => /^sit/.test(c) === seated && (!ONLY || ONLY.includes(c)));
    if (!mine.length) continue;
    const order = [seated ? (mine.includes("sit") ? "sit" : mine[0]) : (mine.includes("idle") ? "idle" : mine[0]), ...mine].filter((c, i, a) => a.indexOf(c) === i);
    console.log(`${TAG}${seated ? " seated" : ""}: ${order.length} clips x ${FRAMES} frames`);
    const t0 = Date.now(), counts = await b.eval(`(${install})(${JSON.stringify({first: order[0], keep: LIMIT})})`, {timeout: 300000}), clips = [];
    for (const c of order) clips.push(await b.eval(`window.__clipcheck.sample(${JSON.stringify(c)}, ${FRAMES})`, {timeout: 300000}));
    console.log(`  measured in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    report.builds[seated ? "seated" : "standing"] = counts;
    for (const c of clips) {
      if (c.missing) { report.clips.push(c); continue; }
      const den = counts.drawnClothVerts || 1, key = RAW ? "rawOver5" : "over5";
      const worst = c.frames.reduce((w, f) => (f[key] > w[key] || (f[key] === w[key] && (RAW ? f.rawMaxMm : f.maxMm) > (RAW ? w.rawMaxMm : w.maxMm))) ? f : w, c.frames[0]);
      const share = worst[key] / den, max = Math.max(...c.frames.map(f => f.maxMm)), rawMax = Math.max(...c.frames.map(f => f.rawMaxMm)), pokeMax = Math.max(...c.frames.map(f => f.pokeMaxMm));
      const pct3 = Math.max(...c.frames.map(f => f.over3)) / den * 100, rawPct3 = Math.max(...c.frames.map(f => f.rawOver3)) / den * 100, pokePct3 = Math.max(...c.frames.map(f => f.pokeOver3)) / (counts.coveredSkinVerts || 1) * 100;
      report.clips.push({clip: c.clip, seated: c.seated, duration: c.duration, maxPenetrationMm: max, pctOver3mm: +pct3.toFixed(2), pctOver5mmWorst: +(share * 100).toFixed(2),
        worstFrame: {t: worst.t, over5: worst[key], maxMm: RAW ? worst.rawMaxMm : worst.maxMm},
        raw: {maxPenetrationMm: rawMax, pctOver3mm: +rawPct3.toFixed(2)}, skinPokeThrough: {maxMm: pokeMax, pctOfCoveredSkinOver3mm: +pokePct3.toFixed(2)},
        verdict: share > LIMIT.share ? "FAIL" : "PASS", frames: c.frames});
    }
    if (SHOTS) {
      for (const c of report.clips.filter(c => !c.missing && c.seated === seated)) {
        const raw = RAW || !c.worstFrame.over5 && !c.pctOver3mm; // (nothing drawn is inside: show where it is inside skin that isn't drawn)
        const n = await b.eval(`window.__clipcheck.mark(${JSON.stringify(c.clip)}, ${c.worstFrame.t}, ${raw})`);
        await sleep(150); c.shot = await b.shot(path.join(OUT, `${TAG}-${c.clip}.png`)); c.markedVerts = n; c.marked = raw ? "orange: inside skin that is not drawn" : "red: inside drawn skin";
      }
      await b.eval("window.__look.mark(null)");
    }
  }
} finally { await b.close(); }

const fails = report.clips.filter(c => c.verdict === "FAIL").length;
report.summary = {clips: report.clips.filter(c => !c.missing).length, fail: fails, verdict: fails ? "FAIL" : "PASS"};
fs.writeFileSync(path.join(OUT, TAG + ".json"), JSON.stringify(report, null, 1));
const pad = (s, n) => String(s).padEnd(n), lines = [`Clipping check: ${ID} (${report.build}), ${FRAMES} frames per clip, verdict by ${report.verdictBy}`,
  `FAIL when more than 0.5% of drawn garment vertices are over 5 mm inside the body at any frame.`,
  ...Object.entries(report.builds).map(([k, c]) => `${k}: ${c.clothVerts} garment verts (${c.drawnClothVerts} drawn) in ${c.clothMeshes} meshes; ${c.bodyVerts} body verts (${c.drawnBodyVerts} drawn, ${c.coveredSkinVerts} covered by cloth at rest)`), "",
  pad("clip", 16) + pad("verdict", 8) + pad("max mm", 8) + pad("%>3mm", 8) + pad("%>5mm", 8) + pad("worst t", 9) + pad("raw max", 9) + pad("raw %>3", 9) + pad("poke mm", 9) + "poke %>3"];
for (const c of report.clips) lines.push(c.missing ? pad(c.clip, 16) + "missing" : pad(c.clip + (c.seated ? "*" : ""), 16) + pad(c.verdict, 8) + pad(c.maxPenetrationMm, 8) + pad(c.pctOver3mm, 8) + pad(c.pctOver5mmWorst, 8) + pad(c.worstFrame.t, 9) + pad(c.raw.maxPenetrationMm, 9) + pad(c.raw.pctOver3mm, 9) + pad(c.skinPokeThrough.maxMm, 9) + c.skinPokeThrough.pctOfCoveredSkinOver3mm);
lines.push("", "* seated build. raw: against all skin, drawn or not. poke: drawn skin that passed out through the cloth over it at rest.", `Overall: ${report.summary.verdict} (${fails} of ${report.summary.clips} clips fail)`);
fs.writeFileSync(path.join(OUT, TAG + ".txt"), lines.join("\n") + "\n");
console.log(lines.join("\n")); console.log("\nwrote", path.join(OUT, TAG + ".json"));
