// The cast, dressed the way the ancient sources describe them.
// Everyone is the same full human body (Quaternius, CC0) with clothes built here in code:
// garments that follow the body are cut from its own surface and pushed out a little, skirts and
// cloaks are drawn around it ring by ring, and every vertex borrows its skinning from the body
// so the clothes move with the animations. Hats, beards, props and jewellery ride on the bones.
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { toonClips, hairSprings, toonFace, tintToon, toonLook, skinShader } from "./toon.js";

const TORSO = /^(pelvis|spine_0[123]|neck_01|clavicle_[lr])$/;
const LEGS = /^(thigh|calf|foot|ball)_/;
const ARMS = /^(upperarm|lowerarm)_/;

/* ---------- cloth: a woven texture and fold normals, drawn once ---------- */
function canvasTex(size, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const WEAVE = canvasTex(256, (g, S) => {
  g.fillStyle = "#bdbdbd"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { const v = 150 + Math.random() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 3, 1); }
  for (let y = 0; y < S; y += 2) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(0, y, S, 1); }
  for (let i = 0; i < 26; i++) { // grime and wear
    const x = Math.random() * S, y = Math.random() * S, r = 10 + Math.random() * 40, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(60,50,40,.07)"); gr.addColorStop(1, "rgba(60,50,40,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
});
// Folds hanging straight down: a normal map that ripples across u.
const FOLDS = canvasTex(256, (g, S) => {
  const img = g.createImageData(S, S), h = [];
  const waves = Array.from({length: 7}, (_, k) => ({f: 2 + k + (Math.random() * 2 | 0), a: Math.random() * .7 + .3, p: Math.random() * 6.3}));
  for (let x = 0; x < S; x++) { let v = 0; for (const w of waves) v += w.a / w.f * Math.sin(x / S * Math.PI * 2 * w.f + w.p); h.push(v); }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (h[(x + 1) % S] - h[(x + S - 1) % S]) * 40 + (Math.random() - .5) * .25, i = (y * S + x) * 4;
    const n = new THREE.Vector3(-dx, (Math.random() - .5) * .2, 1).normalize();
    img.data[i] = (n.x * .5 + .5) * 255; img.data[i + 1] = (n.y * .5 + .5) * 255; img.data[i + 2] = (n.z * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}, false);
// Hair: fine strands running down.
const STRANDS = canvasTex(128, (g, S) => {
  g.fillStyle = "#c8c8c8"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 500; i++) { const v = 110 + Math.random() * 145 | 0, x = Math.random() * S; g.strokeStyle = `rgba(${v},${v},${v},.55)`; g.lineWidth = .6 + Math.random(); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + Math.random() * 6 - 3, S * .3, x + Math.random() * 6 - 3, S * .7, x + Math.random() * 4 - 2, S); g.stroke(); }
});
const clothCache = {};
function cloth(hex, {folds = false, rough = .92, sheen = 0} = {}) {
  const k = hex + "|" + folds + "|" + sheen;
  return clothCache[k] ||= new THREE.MeshStandardMaterial({
    color: hex, map: WEAVE, roughness: rough, metalness: sheen, side: THREE.DoubleSide,
    normalMap: folds ? FOLDS : null, normalScale: new THREE.Vector2(.1, .1)
  });
}
// The same cloth, trimmed to a clean edge: anything outside the GLSL test (in bind-pose metres) is cut away.
const clipCache = {};
function clipped(mat, test, B) {
  const k = mat.uuid + test + (B?.id || "");
  if (clipCache[k]) return clipCache[k];
  const m = mat.clone(), toNorm = B?.toNorm || new THREE.Matrix4();
  m.onBeforeCompile = sh => {
    sh.uniforms.uToNorm = {value: toNorm};
    sh.vertexShader = "varying vec3 vBind; uniform mat4 uToNorm;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = (uToNorm * vec4(position, 1.)).xyz;");
    sh.fragmentShader = "varying vec3 vBind;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n vec3 b = vBind; if (!(" + test + ")) discard;");
  };
  m.customProgramCacheKey = () => "clip" + test;
  return clipCache[k] = m;
}
const gold = new THREE.MeshStandardMaterial({color: 0xc9a14a, roughness: .35, metalness: .9});
// Silk: a soft sheen that catches the light along the folds
const silkCache = {};
function silk(hex, {folds = false, sheer = 0} = {}) {
  const k = hex + "|" + folds + "|" + sheer;
  return silkCache[k] ||= new THREE.MeshPhysicalMaterial({
    color: hex, roughness: .5, sheen: .6, sheenRoughness: .4, sheenColor: new THREE.Color(hex).lerp(new THREE.Color(0xffffff), .3),
    side: THREE.DoubleSide, normalMap: folds ? FOLDS : null, normalScale: new THREE.Vector2(.14, .14),
    transparent: sheer > 0, opacity: 1 - sheer, depthWrite: !sheer
  });
}
const leather = new THREE.MeshStandardMaterial({color: 0x4a3020, roughness: .8});
const wood = new THREE.MeshStandardMaterial({color: 0x5b4330, roughness: .85});
const bronze = new THREE.MeshStandardMaterial({color: 0x8a6a3a, roughness: .45, metalness: .8});
const feather = new THREE.MeshStandardMaterial({color: 0xf1ece0, roughness: .7, side: THREE.DoubleSide});

/* ---------- reading the body ---------- */
const GET = ["getX", "getY", "getZ", "getW"];
const comp = (attr, i, k) => attr[GET[k]](i);
// Everything the tailor needs, computed once from the body in its bind pose.
const STUDIED = new WeakMap();
// Rocketbox (3ds Max Biped) bone names, and the names the tailor uses.
const ALIAS = {pelvis: "Bip01_Pelvis", spine_01: "Bip01_Spine", spine_02: "Bip01_Spine1", spine_03: "Bip01_Spine2", neck_01: "Bip01_Neck", Head: "Bip01_Head"};
for (const [s, S] of [["l", "L"], ["r", "R"]]) Object.assign(ALIAS, {[`clavicle_${s}`]: `Bip01_${S}_Clavicle`, [`upperarm_${s}`]: `Bip01_${S}_UpperArm`, [`lowerarm_${s}`]: `Bip01_${S}_Forearm`, [`hand_${s}`]: `Bip01_${S}_Hand`, [`thigh_${s}`]: `Bip01_${S}_Thigh`, [`calf_${s}`]: `Bip01_${S}_Calf`, [`foot_${s}`]: `Bip01_${S}_Foot`, [`ball_${s}`]: `Bip01_${S}_Toe0`});
const UNALIAS = Object.fromEntries(Object.entries(ALIAS).map(([a, b]) => [b, a]));
function study(bodyMesh) {
  if (STUDIED.has(bodyMesh.geometry)) return STUDIED.get(bodyMesh.geometry);
  const g = bodyMesh.geometry, pos = g.attributes.position, nrm = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const tailorName = b => { if (UNALIAS[b.name] || !b.name.startsWith("DEF-")) return UNALIAS[b.name] || b.name; // (an animated-film character's extra bones,
    for (let p = b.parent; p?.isBone; p = p.parent) if (UNALIAS[p.name]) return UNALIAS[p.name]; return b.name; }; // twists, fingers, face, count as the bone they hang from)
  const names = bodyMesh.skeleton.bones.map(tailorName), idx = {}; names.forEach((n, i) => { if (!(n in idx)) idx[n] = i; });
  const N = pos.count, P = new Float32Array(N * 3), dom = [];
  for (let i = 0; i < N; i++) {
    P[i * 3] = pos.getX(i); P[i * 3 + 1] = pos.getY(i); P[i * 3 + 2] = pos.getZ(i);
    let best = 0; for (let k = 1; k < 4; k++) if (comp(sw, i, k) > comp(sw, i, best)) best = k;
    dom.push(names[comp(si, i, best)]);
  }
  const B = {g, pos, nrm, si, sw, names, idx, N, P, dom, id: bodyMesh.uuid, toNorm: bodyMesh.userData.toNorm};
  STUDIED.set(bodyMesh.geometry, B);
  return B;
}
// Skin weights for a point, blended from the nearest body vertices that pass a filter.
function borrowWeights(B, x, y, z, ok, K = 6) {
  const best = []; // [d, i]
  for (let i = 0; i < B.N; i++) {
    if (!ok(i)) continue;
    const dx = B.P[i * 3] - x, dy = B.P[i * 3 + 1] - y, dz = B.P[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz;
    if (best.length < K) { best.push([d, i]); best.sort((a, b) => a[0] - b[0]); }
    else if (d < best[K - 1][0]) { best[K - 1] = [d, i]; best.sort((a, b) => a[0] - b[0]); }
  }
  const acc = new Map();
  for (const [d, i] of best) {
    const w = 1 / (Math.sqrt(d) + .01);
    for (let k = 0; k < 4; k++) { const b = comp(B.si, i, k), v = comp(B.sw, i, k) * w; if (v > 0) acc.set(b, (acc.get(b) || 0) + v); }
  }
  return acc;
}
function packWeights(acc) {
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const s = top.reduce((t, e) => t + e[1], 0) || 1;
  const I = [0, 0, 0, 0], W = [0, 0, 0, 0];
  top.forEach(([b, w], k) => { I[k] = b; W[k] = w / s; });
  return [I, W];
}
function mixWeights(a, b, t) { // a*(1-t) + b*t, both Maps
  const m = new Map();
  for (const [k, v] of a) m.set(k, v * (1 - t));
  for (const [k, v] of b) m.set(k, (m.get(k) || 0) + v * t);
  return m;
}
function skinned(geo, mat, body) {
  geo.computeBoundingBox(); const top = geo.boundingBox.max.y;
  if (body.userData.fromNorm) { geo.applyMatrix4(body.userData.fromNorm); geo.computeVertexNormals(); }
  const m = new THREE.SkinnedMesh(geo, mat);
  if (body.userData.home) m.userData.home = body.userData.home;
  m.userData.garment = true; m.userData.top = top; m.userData.own = mat.userData?.own;
  m.bind(body.skeleton, body.bindMatrix);
  m.frustumCulled = false; m.castShadow = false;
  return m;
}

/* ---------- garments ---------- */
// Cut part of the body's own surface, push it out along the normals, and keep its skinning.
function wrap(body, keep, {off = LONG ? .02 : .016, mat, bulge = () => 0, clip, smooth = LONG ? 16 : 3, exact = false}) { // realistic bodies: smoothed enough that the jacket underneath (lapels, seams) doesn't show
  const B = study(body), ix = B.g.index.array, tri = [];
  if (LONG && clip && !exact && !/1\.65/.test(clip)) clip = `${NECKLINE} && abs(b.x) < ${WRIST.toFixed(3)} && (b.y > .95 || abs(b.x) > .3)`; // (hands hang below the waist line: keep the sleeves whole) // cover everything modern (the hood keeps its own shape)
  if (clip) { mat = clipped(mat, clip, B); mat.userData.own = true; } // (a clipped material belongs to this one body)
  const ok = new Uint8Array(B.N); for (let i = 0; i < B.N; i++) ok[i] = keep(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2], B.dom[i]) ? 1 : 0;
  for (let t = 0; t < ix.length; t += 3) if (ok[ix[t]] && ok[ix[t + 1]] && ok[ix[t + 2]]) tri.push(ix[t], ix[t + 1], ix[t + 2]);
  const map = new Map(), P = [], UV = [], SI = [], SW = [], I = [], BP = []; // BP: the body point under each cloth vertex, its normal, its offset
  const uv = B.g.attributes.uv;
  // Vertices that share a position share a push direction, so the seams in the body don't split the cloth.
  const avg = new Map(), key = i => `${B.P[i * 3].toFixed(4)},${B.P[i * 3 + 1].toFixed(4)},${B.P[i * 3 + 2].toFixed(4)}`;
  for (const i of tri) { const k = key(i), a = avg.get(k) || [0, 0, 0]; a[0] += B.nrm.getX(i); a[1] += B.nrm.getY(i); a[2] += B.nrm.getZ(i); avg.set(k, a); }
  for (const i of tri) {
    if (!map.has(i)) {
      const a = avg.get(key(i)), l = Math.hypot(...a) || 1, x = B.P[i * 3], y = B.P[i * 3 + 1], z = B.P[i * 3 + 2], o = off + bulge(x, y, z);
      P.push(x + a[0] / l * o, y + a[1] / l * o, z + a[2] / l * o); BP.push(x, y, z, a[0] / l, a[1] / l, a[2] / l, ARMS.test(B.dom[i]) || /^hand_/.test(B.dom[i]) ? o : -1);
      UV.push(uv.getX(i) * 3, uv.getY(i) * 3);
      for (let k = 0; k < 4; k++) { SI.push(comp(B.si, i, k)); SW.push(comp(B.sw, i, k)); }
      map.set(i, P.length / 3 - 1);
    }
    I.push(map.get(i));
  }
  // cloth doesn't follow every bump of the body: relax the surface a little (seams welded by position first)
  const nV = P.length / 3, weld = new Map(), rep = new Int32Array(nV);
  for (let i = 0; i < nV; i++) { const k = `${P[i * 3].toFixed(3)},${P[i * 3 + 1].toFixed(3)},${P[i * 3 + 2].toFixed(3)}`; if (!weld.has(k)) weld.set(k, i); rep[i] = weld.get(k); }
  const nb = Array.from({length: nV}, () => new Set());
  for (let t = 0; t < I.length; t += 3) for (let a = 0; a < 3; a++) { const u = rep[I[t + a]], w = rep[I[t + (a + 1) % 3]]; nb[u].add(w); nb[w].add(u); }
  // Taubin smoothing: a smoothing pass, then a slightly stronger pass the other way, so bumps go but the volume stays
  // (plain smoothing shrinks anything thin: arms came out like sticks)
  for (let it = 0; it < smooth * 2; it++) {
    const Q = P.slice(), f = it % 2 ? -.53 : .5;
    for (let i = 0; i < nV; i++) { if (rep[i] !== i || nb[i].size < 3) continue; let x = 0, y = 0, z = 0; for (const j of nb[i]) { x += P[j * 3]; y += P[j * 3 + 1]; z += P[j * 3 + 2]; } const n = nb[i].size; Q[i * 3] = P[i * 3] + (x / n - P[i * 3]) * f; Q[i * 3 + 1] = P[i * 3 + 1] + (y / n - P[i * 3 + 1]) * f; Q[i * 3 + 2] = P[i * 3 + 2] + (z / n - P[i * 3 + 2]) * f; }
    for (let i = 0; i < nV; i++) { const r = rep[i]; P[i * 3] = Q[r * 3]; P[i * 3 + 1] = Q[r * 3 + 1]; P[i * 3 + 2] = Q[r * 3 + 2]; }
  }
  // and sleeves never sink into the arms they cover (the torso is left free, so a jacket's lapels underneath don't show through)
  for (let i = 0; i < nV; i++) { const k = i * 7; if (BP[k + 6] < 0) continue; const d = (P[i * 3] - BP[k]) * BP[k + 3] + (P[i * 3 + 1] - BP[k + 1]) * BP[k + 4] + (P[i * 3 + 2] - BP[k + 2]) * BP[k + 5], want = BP[k + 6] * .8;
    if (d < want) for (let a = 0; a < 3; a++) P[i * 3 + a] += BP[k + 3 + a] * (want - d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(SI, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(SW, 4));
  geo.setIndex(I.map(i => rep[i])); geo.computeVertexNormals();
  return skinned(geo, mat, body);
}

// The body's outline at one height, as a radius for each direction around the middle.
function outline(B, y, band, SEG, include) {
  const r = new Array(SEG).fill(0); let cz = 0, n = 0;
  for (let i = 0; i < B.N; i++) { const vy = B.P[i * 3 + 1]; if (Math.abs(vy - y) < band && include(B.dom[i])) { cz += B.P[i * 3 + 2]; n++; } }
  cz = n ? cz / n : 0;
  for (let i = 0; i < B.N; i++) {
    const vy = B.P[i * 3 + 1]; if (Math.abs(vy - y) > band || !include(B.dom[i])) continue;
    const x = B.P[i * 3], z = B.P[i * 3 + 2] - cz, a = (Math.atan2(z, x) + Math.PI * 2) % (Math.PI * 2), s = Math.floor(a / (Math.PI * 2) * SEG) % SEG;
    r[s] = Math.max(r[s], Math.hypot(x, z));
  }
  // fill gaps, then smooth around the ring without ever cutting into the body
  for (let pass = 0; pass < SEG; pass++) for (let s = 0; s < SEG; s++) if (!r[s]) r[s] = Math.max(r[(s + 1) % SEG], r[(s + SEG - 1) % SEG]) * .98;
  const sm = r.map((_, s) => { let t = 0; for (let k = -3; k <= 3; k++) t += r[(s + k + SEG) % SEG]; return t / 7; });
  return {cz, r: r.map((v, s) => Math.max(v, sm[s]))};
}

// A skirt, robe or cloak that hangs around the body, drawn ring by ring from top to hem.
//   from/to: heights; arc: which part of the circle (radians, 0 = the person's left, PI/2 = front);
//   flare: extra width gained toward the hem; folds: depth of the hanging folds;
//   hem: optional function(angle) -> extra drop for a ragged or slanted hem.
let LONG = false; // set while dressing a realistic body: sleeves to the wrist, hems to the ankle
function drape(body, {from, to, mat, off = .02, flare = .06, folds = .012, arc = [0, Math.PI * 2], hem = () => 0, include, weightsAt, SEG = 56, step = .035, free = false, cling = true}) {
  const B = study(body);
  if (LONG && !free && to < .8 && from < 1.1) to = SEATED ? .46 : Math.min(to, .1);
  if (LONG && from > 1.1 && from - to > .1) off += .022;
  else if (LONG && from - to <= .1) off += .014; // belts and bands sit on top of the tunic, not half inside it // cloaks and capes from the shoulders sit clear of the tunic underneath, which is fuller on a real body
  include ||= d => TORSO.test(d) || LEGS.test(d);
  const rows = Math.max(2, Math.ceil((from - to) / step) + 1), full = arc[1] - arc[0] >= Math.PI * 2 - 1e-6;
  const cols = full ? SEG : Math.round(SEG * (arc[1] - arc[0]) / (Math.PI * 2)) + 1;
  const P = [], UV = [], SI = [], SW = [], I = [];
  let prev = null, cz0 = null;
  const seed = Math.random() * 10;
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1), y0 = from - (from - to) * t;
    const o = outline(B, y0, step * .8, SEG, include); if (cz0 === null) cz0 = o.cz;
    const cur = [];
    for (let c = 0; c < cols; c++) {
      const a = full ? c / cols * Math.PI * 2 : arc[0] + (arc[1] - arc[0]) * c / (cols - 1);
      const s = Math.floor(((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * SEG) % SEG;
      let rad = o.r[s] + off;
      if (prev && cling) rad = Math.max(rad, prev[c] * .985); // cloth hangs from the widest point, it doesn't cling (unless it's cut to fit)
      cur.push(rad);
      const fold = folds * .6 * t * (Math.sin(a * 7 + seed) * .7 + Math.sin(a * 13 + seed * 2) * .3);
      const R = rad + flare * t * t + fold;
      const y = y0 - (t > .999 ? hem(a) : hem(a) * t * t);
      const x = Math.cos(a) * R, z = cz0 * (1 - t) + o.cz * t + Math.sin(a) * R;
      P.push(x, y, z); UV.push(c / (full ? cols : cols - 1) * (arc[1] - arc[0]) / Math.PI * 2, y * 4);
      const [Ii, Ww] = packWeights(weightsAt(x, y, z, t, a));
      SI.push(...Ii); SW.push(...Ww);
    }
    prev = cur;
  }
  const wrapC = full ? cols : cols - 1;
  for (let j = 0; j < rows - 1; j++) for (let c = 0; c < wrapC; c++) {
    const a = j * cols + c, b = j * cols + (c + 1) % cols, d = (j + 1) * cols + c, e = (j + 1) * cols + (c + 1) % cols;
    I.push(a, d, b, b, d, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(SI, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(SW, 4));
  geo.setIndex(I); geo.computeVertexNormals();
  return skinned(geo, mat, body);
}

// How a skirt follows the legs: near the waist it moves with the hips, lower down it shares
// the hips with whichever thigh is closer, so walking and sitting don't tear it.
let SEATED = false; // dressing someone who sits: the skirt follows the legs all the way down
function skirtWeights(B, legShare = .55) {
  const hipOnly = new Map([[B.idx.pelvis, 1]]);
  if (SEATED) return (x, y, z, t) => mixWeights(hipOnly, borrowWeights(B, x, y, z, i => TORSO.test(B.dom[i]) || /^(thigh|calf)_/.test(B.dom[i])), Math.min(1, t * 3));
  return (x, y, z, t) => {
    const near = borrowWeights(B, x, Math.max(y, .62), z, i => TORSO.test(B.dom[i]) || /^thigh_/.test(B.dom[i]));
    return mixWeights(hipOnly, near, Math.min(1, t * 1.6) * legShare);
  };
}
function boneWeights(B, list) { // e.g. [["spine_03", 1]] or a function of height
  return (x, y, z, t, a) => new Map((typeof list === "function" ? list(x, y, z, t, a) : list).map(([n, w]) => [B.idx[n], w]));
}

/* ---------- things that ride on bones ---------- */
// Put a mesh where it should be in the bind pose, then hand it to a bone so it moves with it.
function mount(person, boneName, obj, at, rot = [0, 0, 0]) {
  person.root.updateMatrixWorld(true);
  obj.position.copy(at); obj.rotation.set(...rot);
  if (person.hat && boneName === "Head" && !obj.userData.fitted) { obj.position.y += person.hat.dy; obj.scale.multiplyScalar(person.hat.s); }
  if (person.norm) { obj.position.y *= person.norm.k; obj.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), person.norm.turn); obj.rotation.y += person.norm.turn; }
  person.root.add(obj); obj.updateMatrixWorld(true);
  person.bones[boneName].attach(obj);
  return obj;
}
// Put something in someone's hand: the point 'grip' of the object goes into the palm, measured from this person's own
// skeleton (hands sit in different places on different bodies). It hangs from the fist along the forearm's line.
export function hold(person, side, obj, grip = new THREE.Vector3()) {
  person.root.updateMatrixWorld(true);
  const hw = new THREE.Vector3(), fw = new THREE.Vector3(); person.bones["hand_" + side].getWorldPosition(hw); person.bones["lowerarm_" + side].getWorldPosition(fw);
  const fingers = hw.clone().sub(fw).normalize(), palm = hw.clone().addScaledVector(fingers, .075 * person.root.scale.x);
  const rq = new THREE.Quaternion(); person.root.getWorldQuaternion(rq);
  const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), person.norm?.turn || 0).applyQuaternion(rq);
  const y = fingers.clone().negate(), x = new THREE.Vector3().crossVectors(y, fwd).normalize(), z = new THREE.Vector3().crossVectors(x, y);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  obj.position.copy(palm).sub(grip.clone().multiplyScalar(obj.scale.x).applyQuaternion(obj.quaternion));
  obj.removeFromParent(); obj.updateMatrixWorld(true);
  person.bones["hand_" + side].attach(obj);
  return obj;
}
function petasos() { // a traveller's felt hat with a wide brim and two small wings
  const g = new THREE.Group();
  const prof = [[0, .085], [.05, .083], [.085, .066], [.105, .03], [.11, .006], [.15, .0], [.21, -.012], [.235, -.026], [.236, -.034], [.21, -.022], [.14, -.01], [.1, -.006], [0, -.006]].map(([x, y]) => new THREE.Vector2(x, y));
  const felt = new THREE.MeshStandardMaterial({color: 0x7a5a3a, map: WEAVE, roughness: .95, side: THREE.DoubleSide});
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 40), felt));
  const band = new THREE.Mesh(new THREE.TorusGeometry(.104, .006, 6, 40), gold); band.rotation.x = Math.PI / 2; band.position.y = .02; g.add(band);
  for (const s of [-1, 1]) g.add(wing(s, .1, .06, -.02, 1.5));
  return g;
}
function wing(side, x, y, z, size = 1) { // a small feathered wing
  const w = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const sh = new THREE.Shape(); const L = (.07 + k * .018) * size, H = .018 * size;
    sh.moveTo(0, 0); sh.quadraticCurveTo(L * .5, H * 1.4, L, H * .3); sh.quadraticCurveTo(L * .55, -H * .2, 0, 0);
    const f = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), feather);
    f.rotation.z = .25 + k * .17; f.position.y = -k * .004 * size; w.add(f);
  }
  w.position.set(side * x, y, z); w.rotation.y = side > 0 ? -.35 : Math.PI + .35;
  return w;
}
function caduceus() { // the herald's staff: two snakes winding up to a pair of wings
  const g = new THREE.Group();
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(.011, .013, 1.05, 10), gold); g.add(staff);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), gold); tip.position.y = .54; g.add(tip);
  const snakeMat = new THREE.MeshStandardMaterial({color: 0x3c4a2a, roughness: .5, metalness: .4});
  for (const ph of [0, Math.PI]) {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = ph + t * Math.PI * 4.5; pts.push(new THREE.Vector3(Math.cos(a) * .03 * (1 - t * .3), -.25 + t * .72, Math.sin(a) * .03 * (1 - t * .3))); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .008, 6), snakeMat); g.add(tube);
  }
  for (const s of [-1, 1]) { const w = wing(s, .02, .5, 0, .8); w.rotation.y = s > 0 ? 0 : Math.PI; w.rotation.z = .2; g.add(w); }
  return g;
}
function pole(len = 3.2) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.022, .03, len, 8), wood); g.add(p);
  return g;
}
function oar() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, 2.3, 8), wood); g.add(shaft);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.17, .62, .025), wood); blade.position.y = -1.3; g.add(blade);
  return g;
}
function sword() { // a short Greek sword in a leather scabbard
  const g = new THREE.Group();
  const sc = new THREE.Mesh(new THREE.BoxGeometry(.055, .5, .025), leather); sc.position.y = -.25; g.add(sc);
  const chape = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 6), bronze); chape.scale.set(1, .6, .5); chape.position.y = -.5; g.add(chape);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.12, .02, .035), bronze); guard.position.y = .01; g.add(guard);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .1, 8), leather); grip.position.y = .07; g.add(grip);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), bronze); pommel.position.y = .13; g.add(pommel);
  return g;
}
function longBeard(color) { // Charon's: unkempt, white, down to the chest
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(.075 * Math.sin(Math.PI * Math.min(1, t * 1.15 + .12)) * (1 - t * .55) + .004, -t * .3)); }
  const geo = new THREE.LatheGeometry(pts, 22, -Math.PI * .55, Math.PI * 1.1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { // tangle it
    const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i));
    const k = 1 + .25 * Math.sin(a * 11 + y * 30) * Math.min(1, -y * 6);
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k * .7);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({color, map: STRANDS, roughness: .95, side: THREE.DoubleSide});
  return new THREE.Mesh(geo, mat);
}

/* ---------- the body itself ---------- */
// Tint the skin, and paint leather sandal straps onto the feet.
function skinMaterial(base, {tone = 0xffffff, sandals = true, ash = 0, ghost: under = false}) {
  const m = base.clone();
  const tint = new THREE.Color(tone);
  m.onBeforeCompile = sh => {
    sh.uniforms.uTone = {value: tint}; sh.uniforms.uAsh = {value: ash}; sh.uniforms.uSandals = {value: sandals ? 1 : 0}; sh.uniforms.uHead = m.userData.head;
    sh.vertexShader = "varying vec3 vBind;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
    sh.fragmentShader = "varying vec3 vBind; uniform vec3 uTone; uniform float uAsh; uniform float uSandals; uniform float uHead;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n if (uHead < .5 && vBind.y > 1.49) discard;" + (under ? "\n if (vBind.y > .07 && vBind.y < 1.44 && abs(vBind.x) < .2) discard;" : "")).replace("#include <map_fragment>", `#include <map_fragment>
      diffuseColor.rgb *= uTone;
      float l = dot(diffuseColor.rgb, vec3(.299,.587,.114));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l) * vec3(.92,.95,1.0), uAsh);
      if (uSandals > .5 && vBind.y < .2) {
        float y = vBind.y, ax = abs(vBind.x);
        float strap = step(abs(y - .045), .011) + step(abs(y - .09), .01) + step(abs(y - .135), .012)
                    + step(abs(vBind.z - .02 - (y - .03) * 1.6), .01) * step(y, .1)
                    + step(abs(fract(y * 22. + ax * 9.) - .5), .12) * step(.1, y) * step(y, .2);
        float sole = step(y, .018);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2,.12,.07), clamp(strap, 0., 1.) * .92);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.13,.08,.05), sole);
      }`);
  };
  m.userData.head = {value: 1};
  m.customProgramCacheKey = () => `skin${tone}|${ash}|${sandals}|${under}`;
  return m;
}

/* ---------- the cast ---------- */
// Edges, as GLSL tests on the bind-pose position b: a rounded neckline, short sleeves, and so on.
const NECKLINE_LOW = "b.y < 1.535 && !(b.z > -.02 && pow(b.x / .12, 2.) + pow((b.y - 1.535) / .085, 2.) < 1.)";
const NECKLINE_HIGH = "b.y < 1.585 && !(b.z > .0 && pow(b.x / .085, 2.) + pow((b.y - 1.585) / .05, 2.) < 1.)";
let NECKLINE = NECKLINE_LOW;
// sleeves stop just short of this person's own wrists (measured from their skeleton), so their hands always show
let WRIST = .675;
const SLEEVE = w => `abs(b.x) < ${LONG ? WRIST.toFixed(3) : w}`;
let TOONDRESS = false; // dressing an animated-film body: its neck is partly weighted to the head
const UPPER = (x, y, z, d) => y < 1.6 && (ARMS.test(d) || (LONG && /^hand_/.test(d) && Math.abs(x) < WRIST + .01) || (y > .96 && (TORSO.test(d) || d === "neck_01" || (TOONDRESS && d === "Head" && y < 1.51)))); // arms whole, wherever the hands hang, to just past the wrist
const put = (p, m) => { const h = m.userData.home; delete m.userData.home; (h || p.root).add(m); };
// A beard for an animated-film face, grown from the face itself: the jaw, chin and (optionally) upper lip, pushed out
// into a soft shell, fuller toward the chin. In the tailor's space the head's pivot sits at 1.6, level with the mouth.
function beard(p, body, color, {thick = .012, chin = .25, moustache = true, stubble = false} = {}) {
  if (!p.toon) return;
  const H = 1.6, lips = (x, y, z) => Math.abs(x) < .036 && y > H - .028 && y < H + .028 && z > .1;
  const keep = (x, y, z, d) => d === "Head" && z > -.005 && y > H - .09 && !lips(x, y, z) &&
    (y < H + .012 || (moustache && y < H + .042 && Math.abs(x) < .048 && z > .12));
  const mat = new THREE.MeshStandardMaterial({color: new THREE.Color(color), map: STRANDS, roughness: .9, side: THREE.DoubleSide}); // (both sides: through the gap left for the lips, its inside showed as a black stripe)
  if (stubble) Object.assign(mat, {transparent: true, opacity: .2, depthWrite: false}); // (a few days of it: a shadow on the skin, not a beard)
  put(p, wrap(body, keep, {mat, off: thick, smooth: 5, bulge: (x, y) => Math.max(0, H - .01 - y) * chin}));
}
const LOOKS = {
  // Hermes: young and beardless as the classical painters show him, in a traveller's hat with
  // wings, a short pinned cloak over a short tunic, winged sandals, and the herald's staff.
  hermes: {tone: 0xfff0e2, hair: ["hair_simpleparted"], hairColor: 0x4a321c, dress(p, B, body) {
    if (p.toon) return epicHermes(p, B, body);
    const tunic = cloth(0xe9e0cc);
    put(p, wrap(body, UPPER, {mat: tunic, clip: `${NECKLINE} && ${SLEEVE(.33)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xe9e0cc, {folds: true}), flare: .05, weightsAt: skirtWeights(B)}));
    put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .026, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.5, to: .72, arc: [Math.PI * 1.08, Math.PI * 1.92], mat: cloth(0x8c2f24, {folds: true}), off: .04, flare: .1, folds: .02,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
    mount(p, "clavicle_r", new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), gold), new THREE.Vector3(-.13, 1.47, .06));
    mount(p, "Head", petasos(), new THREE.Vector3(0, p.norm ? 1.805 : 1.755, -.02));
    mount(p, "spine_03", caduceus(), new THREE.Vector3(.05, 1.25, -.17), [0, 0, -.5]);
    for (const s of ["l", "r"]) { const g = new THREE.Group(), x = s === "l" ? .114 : -.114; g.add(wing(Math.sign(x), Math.abs(x) + .05, .1, -.07, .7)); mount(p, `foot_${s}`, g, new THREE.Vector3()); }
  }},
  // Charon, after Virgil: a frightening old ferryman in filth, a mass of white unkempt beard,
  // eyes of fixed flame, a dirty cloak knotted at the shoulder. He poles the boat.
  charon: {tone: 0xe0d8d0, ash: .4, hair: ["hair_beard"], hairColor: 0xcfcac0, sandals: false, eyes: 0xff6a1a, dress(p, B, body) {
    const robe = cloth(0x2b2622, {folds: true}), dark = cloth(0x221e1b);
    put(p, wrap(body, UPPER, {mat: dark, off: .02, clip: `${NECKLINE} && ${SLEEVE(.6)} && b.y > .96`}));
    put(p, drape(body, {from: 1.0, to: .07, mat: robe, flare: .14, folds: .025, hem: a => .04 * Math.abs(Math.sin(a * 7)) + .03 * Math.abs(Math.sin(a * 13 + 1)), weightsAt: skirtWeights(B, .35)}));
    put(p, drape(body, {from: 1.035, to: .99, mat: cloth(0x3a2c20), off: .028, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    // a hood over the head and shoulders, open at the face
    put(p, wrap(body, (x, y, z, d) => d === "Head" || d === "neck_01", {clip: "!(b.z > -.045 && pow(b.x / .112, 2.) + pow((b.y - 1.65) / .165, 2.) < 1.)", mat: dark, off: .03, smooth: 3, bulge: (x, y, z) => Math.max(0, -z) * .22 + Math.max(0, y - 1.7) * .2}));
    put(p, drape(body, {from: 1.56, to: .5, arc: [Math.PI * 1.02, Math.PI * 1.98], mat: robe, off: .05, flare: .1, folds: .03, hem: a => .06 * Math.abs(Math.sin(a * 5)),
      include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .5], ["spine_02", .3], ["pelvis", .2]])}));
    if (!p.norm) mount(p, "Head", longBeard(0xd8d3c8), new THREE.Vector3(0, 1.62, .075)); // a real face has its own beard; the stiff false one looked pasted on
    if (p.toon) { beard(p, body, 0xcfcac0, {thick: .016, chin: .5}); mount(p, "Head", longBeard(0xd8d3c8), new THREE.Vector3(0, 1.5, .1)); } // a cartoon face has none: a full one, and the long fall below
    // his pole, held in the raised hand
    if (!p.norm) mount(p, "hand_r", pole(), new THREE.Vector3(-.75, 1.42, -.02), [Math.PI / 2, 0, 0]);
  }},
  // Elpenor: the youngest of Odysseus' crew, a sailor in a work tunic fastened on one shoulder.
  elpenor: {tone: 0xf2dcc4, hair: ["hair_buzzed"], hairColor: 0x2a1d14, dress(p, B, body) {
    if (p.toon) return mensDrape(p, B, body, {color: 0x5b6b78, style: "plain"});
    const t = cloth(0x5b6b78);
    // fastened on the left shoulder; the right shoulder and chest are bare
    put(p, wrap(body, UPPER, {mat: t, clip: `${NECKLINE} && b.x < .3 && b.y > .97 && b.y < max(1.24, 1.31 + 1.5 * b.x)`}));
    put(p, drape(body, {from: 1.0, to: .66, mat: cloth(0x5b6b78, {folds: true}), flare: .04, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x3b2a1c), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  }},
  // Theseus: the hero of Athens, older now and bearded, in a red cloak with his father's sword.
  theseus: {tone: 0xf6dfc6, hair: ["hair_simpleparted", "hair_beard"], hairColor: 0x3a2516, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x3a2516); mensDrape(p, B, body, {color: 0xe2d6bc, accent: 0x8f2f22}); mount(p, "pelvis", sword(), new THREE.Vector3(.2, .99, .02), [0, 0, .35]); return; }
    beard(p, body, 0x3a2516);
    put(p, wrap(body, UPPER, {mat: cloth(0xd8cdb6), clip: `${NECKLINE} && ${SLEEVE(.31)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .68, mat: cloth(0xd8cdb6, {folds: true}), flare: .04, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.5, to: .95, arc: [Math.PI * 1.08, Math.PI * 1.92], mat: cloth(0x8f2f22, {folds: true}), off: .04, flare: .06, folds: .02,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, [["spine_03", 1]])}));
    mount(p, "clavicle_r", new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), gold), new THREE.Vector3(-.13, 1.47, .06));
    mount(p, "pelvis", sword(), new THREE.Vector3(.2, .99, .02), [0, 0, .35]);
  }},
  // Pirithous: king of the Lapiths, long-haired and bearded, a gold band on his head.
  pirithous: {tone: 0xe9cdb0, hair: ["hair_long", "hair_beard"], hairColor: 0x1d140d, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x1d140d, {chin: .4}); mensDrape(p, B, body, {style: "bare", accent: 0x3e2050}); return; }
    beard(p, body, 0x1d140d, {chin: .4});
    put(p, wrap(body, UPPER, {mat: cloth(0x6b4a7a), clip: `${NECKLINE} && ${SLEEVE(.31)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .68, mat: cloth(0x6b4a7a, {folds: true}), flare: .04, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.035, to: .985, mat: gold, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.48, to: .95, arc: [Math.PI * 1.1, Math.PI * 1.9], mat: cloth(0xa9823a, {folds: true}), off: .04, flare: .05, folds: .02,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, [["spine_03", 1]])}));
    const band = new THREE.Mesh(new THREE.TorusGeometry(.112, .008, 6, 40), gold); band.scale.set(1, 1.12, 1);
    mount(p, "Head", band, new THREE.Vector3(0, 1.735, -.01), [Math.PI / 2 - .12, 0, 0]);
  }},
  // Mikon: nobody in particular. A plain undyed tunic, a few days of beard, an olive pit's worth of bad luck.
  mikon: {tone: 0xf3dcc2, hair: ["hair_buzzed", "hair_beard"], hairColor: 0x3b2a1c, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x2a1d14, {thick: .003, chin: 0, moustache: false, stubble: true}); return mensDrape(p, B, body, {color: 0xb0a284, style: "plain"}); }
    beard(p, body, 0x3b2a1c, {thick: .004, chin: 0, moustache: false}); // a few days of it
    put(p, wrap(body, UPPER, {mat: cloth(0xa89a80), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xa89a80, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x4a3a2a), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  }},  // Mikon a year on, sitting on the bank: the same clothes, long enough to cover him seated
  mikon_bank: {as: "mikon", tone: 0xf3dcc2, hair: ["hair_buzzed", "hair_beard"], hairColor: 0x3b2a1c, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x3b2a1c, {thick: .006, chin: .05}); return mensDrape(p, B, body, {color: 0xb0a284, style: "plain"}); }
    beard(p, body, 0x3b2a1c, {thick: .006, chin: .05}); // a year of it
    put(p, wrap(body, UPPER, {mat: cloth(0xa89a80), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xa89a80, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x4a3a2a), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    seatedFall(p, B, body, cloth(0xa89a80, {folds: true}));
  }},
  // Orpheus: young and clean-shaven, as the vase painters show him singing; a white tunic, a blue cloak.
  orpheus: {tone: 0xf6dcc0, hair: ["hair_simpleparted"], hairColor: 0x2e1c10, dress(p, B, body) {
    if (p.toon) return mensDrape(p, B, body, {color: 0xf0e8d8, accent: 0x2c3f6e, style: "cowl"});
    put(p, wrap(body, UPPER, {mat: cloth(0xeee6d4), clip: `${NECKLINE} && ${SLEEVE(.33)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xeee6d4, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: LONG ? .15 : .64, to: LONG ? .11 : .6, free: true, mat: cloth(0x2c3f6e), off: .055, flare: 0, folds: 0, weightsAt: skirtWeights(B, .8)})); // (a trim at the hem, wherever the hem is)
    put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.5, to: .78, arc: [Math.PI * 1.08, Math.PI * 1.92], mat: cloth(0x2c3f6e, {folds: true}), off: .04, flare: .1, folds: .02,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
    mount(p, "clavicle_r", new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), gold), new THREE.Vector3(-.13, 1.47, .06));
  }},
  // The wedding at Corinth. Demeas, the uncle who gives the toast.
  demeas: {dress(p, B, body) { if (p.toon) beard(p, body, 0xe8e2d8, {thick: .018, chin: .6}); greek(p, B, body, 0xd9cdb0, 0x6b2a5a); }}, // a bushy white beard
  // Kleio, the aunt who runs everything.
  aunt: {body: "female", dress(p, B, body) { if (p.toon) weddingDrape(p, B, body, {color: 0x1f3a6a, fabric: "jersey", armband: true}); else gown(p, B, body, 0x1f3a6a, 0x9ab0d8, {veil: 0x26385f}); }},
  // Lykon, Mikon's friend, who has heard the goat joke before.
  lykon: {dress(p, B, body) { greek(p, B, body, 0x6b7a4a, 0x4a3a2a); }},
  // Nikias, the groom, in white with a myrtle wreath.
  nikias: {dress(p, B, body) { greek(p, B, body, 0xf2ede2, 0xf2ede2, {wreath: true}); }},
  // Thea, the bride: saffron, a veil, a wreath.
  thea: {body: "female", dress(p, B, body) { if (p.toon) weddingDrape(p, B, body, {color: 0xe8b04a, wreath: true}); else gown(p, B, body, 0xe8a83a, 0xf6e2b0, {wreath: true}); }}, // a bride too: the same liquid silk, in saffron
  // Eurydice on her wedding day: alive, in saffron, with a myrtle wreath
  eurydice_alive: {as: "eurydice", body: "female", dress(p, B, body) { if (p.toon) weddingDrape(p, B, body, {wreath: true}); else gown(p, B, body, 0xf2ead8, 0xe8c87a, {wreath: true}); }},
  // the same, standing, for the meadow: a full-length chiton, and a skirt for when she falls
  eurydice_meadow: {as: "eurydice", body: "female", dress(p, B, body) { if (p.toon) weddingDrape(p, B, body, {wreath: true, kneel: true}); else gown(p, B, body, 0xf2ead8, 0xe8c87a, {wreath: true, kneel: true}); }},
  // the piper, who does not stop playing for anything
  piper: {dress(p, B, body) { greek(p, B, body, 0x8a2a20, 0x5a1a14); mount(p, "Head", aulos(), new THREE.Vector3(0, 1.6, .2), [1.15, 0, 0]); }},
  dancer: {body: "female", dress(p, B, body) { if (p.toon) weddingDrape(p, B, body, {color: 0xb5562e, fabric: "jersey", armband: true}); else gown(p, B, body, 0xc84a6a, 0xf0b8c8); }},
  // A shade on the meadow: anyone at all, faded.
  shade: {tone: 0xffffff, hair: ["hair_simpleparted"], hairColor: 0x3a3028, sandals: false, ghost: true, dress(p, B, body) {
    put(p, wrap(body, UPPER, {mat: cloth(0xd8d4ca), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .3, mat: cloth(0xd8d4ca, {folds: true}), flare: .08, weightsAt: skirtWeights(B, .6)}));
  }},
  // Hades: the vase painters' Plouton, a grave bearded king in a dark cloak over one shoulder, an iron crown,
  // and a sceptre (left by his throne).
  hades: {tone: 0xead2bc, hair: ["hair_long", "hair_beard"], hairColor: 0x15100c, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x15100c, {thick: .016, chin: .6}); mensDrape(p, B, body, {style: "bare", accent: 0x141018}); mount(p, "Head", crown(0x2b2622, true), new THREE.Vector3(0, 1.8, -.012)); return; }
    beard(p, body, 0x15100c, {thick: .016, chin: .6});
    const black = cloth(0x1c1622, {folds: true});
    put(p, wrap(body, UPPER, {mat: cloth(0x2a2030), clip: `b.y > .97 && b.x < .3 && b.y < max(1.2, 1.32 + 1.5 * b.x) && ${NECKLINE}`}));
    put(p, drape(body, {from: 1.02, to: .08, mat: black, flare: .12, folds: .025, weightsAt: skirtWeights(B, .8)}));
    if (SEATED) seatedFall(p, B, body, black);
    put(p, drape(body, {from: 1.05, to: 1.0, mat: gold, off: .03, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.52, to: .7, arc: [Math.PI * 1.05, Math.PI * 1.95], mat: black, off: .045, flare: .08, folds: .03,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
    mount(p, "Head", crown(0x2b2622, true), new THREE.Vector3(0, p.norm ? 1.8 : 1.755, -.012));
  }},
  // Sisyphus: dust, a work tunic gone brown, and a boulder that comes back down.
  sisyphus: {tone: 0xd8bfa4, ash: .15, hair: ["hair_long", "hair_beard"], hairColor: 0x6a5c4c, dress(p, B, body) {
    if (p.toon) { beard(p, body, 0x6a5c4c, {chin: .35}); return mensDrape(p, B, body, {style: "bare", accent: 0x6b5440, gilt: false}); }
    beard(p, body, 0x6a5c4c, {chin: .35});
    put(p, wrap(body, UPPER, {mat: cloth(0x6b5440), clip: `${NECKLINE} && b.x < .3 && b.y > .97 && b.y < max(1.24, 1.31 + 1.5 * b.x)`}));
    put(p, drape(body, {from: 1.0, to: .66, mat: cloth(0x6b5440, {folds: true}), flare: .03, hem: a => .03 * Math.abs(Math.sin(a * 6)), weightsAt: skirtWeights(B, .8)}));
  }},
  // Persephone: queen of the dead, in a pomegranate-red peplos with an overfold, a gold crown, a pomegranate.
  persephone: {body: "female", tone: 0xfbe4d0, hair: ["hair_buns"], hairColor: 0x2a160e, dress(p, B, body) {
    if (p.toon) weddingDrape(p, B, body, {color: 0x6e1424}); else gown(p, B, body, 0x5e0f1c, 0x1a0a12); // pomegranate-red liquid silk
    mount(p, "Head", crown(0xc9a14a, false), new THREE.Vector3(0, p.norm ? 1.735 : 1.675, -.012));
    const pom = pomegranate(); if (p.norm) hold(p, "l", pom, new THREE.Vector3(0, .03, -.03)); else mount(p, "hand_l", pom, new THREE.Vector3(.7, 1.38, .01));
  }},
  // Eurydice: a shade, so she's pale and not quite there, still in her wedding gown.
  eurydice: {body: "female", tone: 0xffffff, hair: ["hair_long"], hairColor: 0x3a2a1c, sandals: false, ghost: true, dress(p, B, body) {
    if (p.toon) weddingDrape(p, B, body, {wreath: true}); else gown(p, B, body, 0xeeeae0, 0xf6f2ea, {wreath: true}); // her wedding dress, and the wreath she died in
  }}
};
// Plain Greek dress for anyone: a chiton, a belt, a cloak behind (not when seated: it stood off the back like a board); a veil or a myrtle wreath if they want one.
function greek(p, B, body, color, cloak, {veil, wreath, kneel} = {}) { // cloak: a colour, or null for none
  if (p.toon && !p.female) return mensDrape(p, B, body, {color, accent: cloak ?? color, wreath});
  put(p, wrap(body, UPPER, {mat: cloth(color), clip: `${NECKLINE} && ${SLEEVE(.33)} && b.y > .97`, smooth: 12, off: .022}));
  const skirt = drape(body, {from: 1.0, to: .6, mat: cloth(color, {folds: true}), flare: .06, weightsAt: skirtWeights(B, .8)}); put(p, skirt);
  if (SEATED) seatedFall(p, B, body, cloth(color, {folds: true}));
  if (kneel) { // a second skirt that hangs from the hips alone: when she kneels it pools on the ground instead of folding through itself
    const k = drape(body, {from: 1.0, to: .6, mat: cloth(color), flare: .2, folds: .01, weightsAt: boneWeights(B, [["pelvis", 1]])}); put(p, k); k.visible = false;
    p.kneel = on => { skirt.visible = !on; k.visible = on; }; }
  put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  if (cloak !== null && !SEATED) put(p, drape(body, {from: 1.5, to: .9, arc: [Math.PI * 1.1, Math.PI * 1.9], mat: cloth(cloak, {folds: true}), off: .045, flare: .06, folds: .02, include: d => TORSO.test(d), weightsAt: boneWeights(B, [["spine_03", 1]])}));
  if (veil) put(p, wrap(body, (x, y, z, d) => (d === "Head" || d === "neck_01") && z < .02, {clip: "!(b.z > -.03 && pow(b.x / .09, 2.) + pow((b.y - 1.65) / .14, 2.) < 1.)", mat: cloth(veil), off: .018, smooth: 3, bulge: (x, y, z) => Math.max(0, -z) * .1}));
  if (wreath) wreathOn(p, {flowers: p.female, lift: p.female ? -.03 : 0});
}
// The fall of a seated gown: a panel of cloth that hangs from the knees to the floor in front of the shins,
// each side carried by its own leg, so it sits right in any seated pose.
function lapFall(B, body, mat) {
  const cols = 14, rows = 10, P = [], UV = [], SI = [], SW = [], I = [];
  let zKnee = 0, n = 0; for (let i = 0; i < B.N; i++) { const y = B.P[i * 3 + 1]; if (y > .4 && y < .56 && /^(calf|thigh)_/.test(B.dom[i])) { zKnee = Math.max(zKnee, B.P[i * 3 + 2]); n++; } }
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const t = r / rows, u = c / cols, x = (u - .5) * .4 * (1 + t * .25), y = .56 - t * .55, z = zKnee + .035 + t * .05 + Math.sin(u * Math.PI * 5) * .012 * t;
    P.push(x, y, z); UV.push(u * 2, t * 3);
    const l = THREE.MathUtils.clamp(.5 + x / .08, 0, 1), top = Math.max(0, 1 - t * 4); // left/right share; the top edge rides the knee
    const w = [["calf_l", l * (1 - top * .5)], ["calf_r", (1 - l) * (1 - top * .5)], ["thigh_l", l * top * .5], ["thigh_r", (1 - l) * top * .5]];
    for (let k = 0; k < 4; k++) { SI.push(B.idx[w[k][0]] ?? 0); SW.push(w[k][1]); }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1; I.push(a, d, b, b, d, e); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(SW, 4));
  geo.setIndex(I); geo.computeVertexNormals();
  return skinned(geo, mat, body);
}
// Seated, a long robe carries on over the shins to the floor: cloth that follows each leg, and a fall from the knees.
function seatedFall(p, B, body, mat) {
  put(p, wrap(body, (x, y, z, d) => (/^calf_/.test(d) && y > .1) || (/^thigh_/.test(d) && y < .62), {mat, off: .03, smooth: 6, bulge: (x, y) => Math.max(0, .5 - y) * .08}));
  put(p, lapFall(B, body, mat));
}
// A woman's gown: a fitted silk bodice with a jewelled collar, a gold band under the bust, a skirt that falls from there
// to the floor with a little train, a sheer cape from the shoulders, gold at the wrists and ears.
function gown(p, B, body, color, cape, {wreath, kneel, veil} = {}) {
  // sleeves from the arms' own surface; the bodice from smooth rings, so nothing of the clothes underneath shows through its shape
  // bodice and sleeves in one piece (no seam at the shoulder), smoothed hard so nothing of the jacket underneath shows
  // in its shape; the sleeves open into bells over the last of the forearm, and the hand comes out of the bell
  const w0 = (p.wrist || .6) - .14;
  put(p, wrap(body, UPPER, {mat: silk(color), clip: `${NECKLINE} && ${SLEEVE(.33)}`, smooth: 18, off: .02, bulge: x => Math.max(0, Math.abs(x) - w0) * .3}));
  const skirtMat = silk(color, {folds: true});
  // seated, the skirt has to follow the thighs forward, so it stays close; standing, it flares and trails a little behind
  const skirt = SEATED ? drape(body, {from: 1.0, to: .6, mat: skirtMat, flare: .06, weightsAt: skirtWeights(B, .8)})
    : drape(body, {from: 1.2, to: .6, mat: skirtMat, off: .03, flare: .2, folds: .016, weightsAt: skirtWeights(B, .45), hem: a => Math.max(0, -Math.sin(a)) * .06});
  put(p, skirt);
  // seated, the gown carries on over the shins to the floor (following each leg, opening out toward the hem)
  if (SEATED) seatedFall(p, B, body, skirtMat);
  if (kneel) { const k = drape(body, {from: 1.2, to: .6, mat: silk(color), off: .03, flare: .3, folds: .015, weightsAt: boneWeights(B, [["pelvis", 1]])}); put(p, k); k.visible = false; p.kneel = on => { skirt.visible = !on; k.visible = on; }; }
  put(p, drape(body, {from: 1.235, to: 1.195, mat: gold, off: .062, flare: 0, folds: 0, weightsAt: boneWeights(B, [["spine_02", 1]])}));
  if (cape && !SEATED) put(p, drape(body, {from: 1.3, to: .12, arc: [Math.PI * 1.25, Math.PI * 1.75], mat: silk(cape, {folds: true, sheer: .25}), off: .045, flare: .1, folds: .025, include: d => TORSO.test(d), weightsAt: boneWeights(B, [["spine_03", 1]])}));
  if (veil) put(p, wrap(body, (x, y, z, d) => (d === "Head" || d === "neck_01") && z < .02, {clip: "!(b.z > -.03 && pow(b.x / .09, 2.) + pow((b.y - 1.65) / .14, 2.) < 1.)", mat: cloth(veil), off: .018, smooth: 3, bulge: (x, y, z) => Math.max(0, -z) * .1}));
  // a broad collar of gold at the neckline, and drops at the ears
  const collar = new THREE.Group(); for (let i = 0; i < 26; i++) { const a = Math.PI * (.08 + .84 * i / 25), b = new THREE.Mesh(new THREE.SphereGeometry(i % 2 ? .0045 : .006, 8, 6), gold); b.position.set(Math.cos(a) * .078, -Math.sin(a) * .022 * (i % 2 ? 1.4 : 1), Math.sin(a) * .07); collar.add(b); }
  mount(p, "neck_01", collar, new THREE.Vector3(0, p.norm ? 1.565 : 1.5, .005));
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.006, 8, 6), gold), d = new THREE.Mesh(new THREE.SphereGeometry(.0045, 8, 6), gold); d.scale.y = 1.5; d.position.y = -.011; e.add(d); mount(p, "Head", e, new THREE.Vector3(sx * .072, p.norm ? 1.66 : 1.6, -.005)); }
  // gold cuffs where the sleeves end
  if (p.wrist) for (const side of ["l", "r"]) { const c = new THREE.Mesh(new THREE.TorusGeometry(.04, .008, 8, 24), gold), lw = new THREE.Vector3(), hw = new THREE.Vector3(); p.root.updateMatrixWorld(true); p.bones["lowerarm_" + side].getWorldPosition(lw); p.bones["hand_" + side].getWorldPosition(hw);
    const dir = hw.clone().sub(lw).normalize(); c.position.copy(hw).addScaledVector(dir, .03); /* a gold edge on the bell of the sleeve */ c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); c.updateMatrixWorld(true); p.bones["hand_" + side].attach(c); }
  if (wreath) wreathOn(p, {flowers: true});
}
// Eurydice's wedding dress: ivory silk in fine pleats with a liquid sheen, draped like a sari over one shoulder.
// A one-shoulder bodice; a pleated sash crossing from the left shoulder to the right hip; the midriff bare; a skirt slung
// low on the hips, gathered into a knot at one side; and the end of the cloth falling from the shoulder down the back.
// (Heights are the tailor's, for the animated women: shoulders 1.44, chest 1.33, waist 1.17, hips .94.)
const PLEATS = canvasTex(256, (g, S) => { // fine vertical pleats, as a normal map
  const d = g.createImageData(S, S);
  for (let x = 0; x < S; x++) { const a = x / S * Math.PI * 2 * 24, w = Math.sin(a) + .35 * Math.sin(a * 2.3 + 1), n = Math.max(-1, Math.min(1, w * .8));
    for (let y = 0; y < S; y++) { const i = (y * S + x) * 4; d.data[i] = 128 + n * 110; d.data[i + 1] = 128; d.data[i + 2] = 230; d.data[i + 3] = 255; } }
  g.putImageData(d, 0, 0);
}, false);
// two cloths: the brides' liquid silk in fine pleats, and the guests' soft silk jersey that falls in loose folds
const DRAPES = {};
function drapeCloth(color, fabric) {
  return DRAPES[color + fabric] ||= fabric === "liquid"
    ? new THREE.MeshPhysicalMaterial({color, roughness: .3, metalness: .12, sheen: 1, sheenRoughness: .3, sheenColor: new THREE.Color(0xffffff),
        clearcoat: .35, clearcoatRoughness: .4, normalMap: PLEATS, normalScale: new THREE.Vector2(.55, .55), side: THREE.DoubleSide})
    : new THREE.MeshPhysicalMaterial({color, roughness: .5, sheen: .9, sheenRoughness: .35, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .45),
        normalMap: FOLDS, normalScale: new THREE.Vector2(.25, .25), side: THREE.DoubleSide});
}
// a gold armlet coiled like a snake around the upper arm
function armlet() {
  const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 2 * 3.2; pts.push(new THREE.Vector3(Math.cos(a) * .042, t * .075 - .037, Math.sin(a) * .042)); }
  const g = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .0042, 6), gold);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.008, 8, 6), gold); head.scale.set(1, .7, 1.6); head.position.copy(pts[120]); g.add(head);
  return g;
}
function weddingDrape(p, B, body, {color = 0xf3ead9, fabric = "liquid", wreath, kneel, armband = false} = {}) {
  const liquidSilk = drapeCloth(color, fabric);
  const line = "(1.47 + 1.55 * (b.x - .12))"; // the sash: from the left shoulder down across to the right hip
  // the bodice: over the left shoulder and the bust, the right shoulder and the midriff left bare
  put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || d === "neck_01" || (d === "upperarm_l" && x < .19)) && y > 1.17 && y < 1.58,
    {mat: liquidSilk, exact: true, off: .014, smooth: 10, clip: `b.y > 1.2 && b.y < max(1.31, 1.43 + 1.2 * b.x) && b.y < 1.53`}));
  // the sash, a little proud of the bodice, crossing the front and the back
  put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || (d === "upperarm_l" && x < .19)) && y > .98 && y < 1.56,
    {mat: liquidSilk, exact: true, off: .03, smooth: 10, clip: `abs(b.y - ${line}) < .075 && b.y > 1.0 && b.y < 1.53`, bulge: (x, y) => .008 * Math.sin(y * 60)}));
  // the skirt, slung low and pleated, to the floor
  const skirt = SEATED ? drape(body, {from: 1.07, to: .6, mat: liquidSilk, flare: .06, folds: .02, weightsAt: skirtWeights(B, .8)})
    : drape(body, {from: 1.07, to: .6, mat: liquidSilk, off: .018, flare: .06, folds: .03, weightsAt: skirtWeights(B, .55), hem: a => Math.max(0, -Math.sin(a)) * .05 - .02});
  put(p, skirt);
  if (SEATED) seatedFall(p, B, body, liquidSilk);
  if (kneel) { const k = drape(body, {from: 1.07, to: .6, mat: liquidSilk, off: .03, flare: .3, folds: .02, weightsAt: boneWeights(B, [["pelvis", 1]])}); put(p, k); k.visible = false; p.kneel = on => { skirt.visible = !on; k.visible = on; }; }
  // the knot where the skirt is gathered, at the right hip
  const knot = new THREE.Group();
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(.019 - i * .002, .009, 8, 16), liquidSilk); m.rotation.set(i * .7, i * 1.3, i * .4); m.position.set((i - 1.5) * .005, (i % 2) * .006, 0); knot.add(m); }
  mount(p, "pelvis", knot, new THREE.Vector3(-.135, 1.06, .075));
  // the end of the cloth, from the left shoulder down the back
  put(p, drape(body, {from: 1.49, to: SEATED ? .75 : .2, arc: [Math.PI * 1.5, Math.PI * 2.02], mat: liquidSilk, off: .05, flare: .1, folds: .03, free: true,
    include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.006, 8, 6), gold), d = new THREE.Mesh(new THREE.SphereGeometry(.0045, 8, 6), gold); d.scale.y = 1.5; d.position.y = -.011; e.add(d); mount(p, "Head", e, new THREE.Vector3(sx * .072, p.norm ? 1.66 : 1.6, -.005)); }
  if (armband && p.bones.upperarm_r) { const s = p.bones.upperarm_r.getWorldPosition(new THREE.Vector3()), e = p.bones.lowerarm_r.getWorldPosition(new THREE.Vector3());
    const a = armlet(); p.root.add(a); a.position.copy(s).lerp(e, .4); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), e.clone().sub(s).normalize()); a.scale.setScalar(p.toon ? .85 : 1); a.updateMatrixWorld(true); p.bones.upperarm_r.attach(a); }
  if (wreath) wreathOn(p, {flowers: true});
}
// A crown of the wedding: a twisted vine of myrtle with proper leaves (pointed, a vein down the middle, tilted out like
// they grew there) and, for the women, five-petalled blossoms clustered toward the front.
const LEAF = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.007, .006, .008, .016, 0, .026); sh.bezierCurveTo(-.008, .016, -.007, .006, 0, 0);
  const g = new THREE.ShapeGeometry(sh, 6); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, -Math.abs(pos.getX(i)) * .5); g.computeVertexNormals(); return g; })();
const PETAL = (() => { const g = new THREE.SphereGeometry(.0065, 10, 6); g.scale(1, .32, 1.35); g.translate(0, 0, .0072); return g; })();
const leafMat = new THREE.MeshStandardMaterial({color: 0x4f7a34, roughness: .55, side: THREE.DoubleSide});
const leafDark = new THREE.MeshStandardMaterial({color: 0x34552a, roughness: .6, side: THREE.DoubleSide});
const vineMat = new THREE.MeshStandardMaterial({color: 0x5a4a2a, roughness: .8});
const petalMats = [0xfffaf2, 0xf7d9d4, 0xfbe6c8].map(c => new THREE.MeshPhysicalMaterial({color: c, roughness: .45, sheen: .8, sheenColor: new THREE.Color(0xffffff)}));
const heart = new THREE.MeshStandardMaterial({color: 0xe6b23a, roughness: .5, emissive: 0x3a2400});
function flowerWreath({flowers = true, r = .1} = {}) {
  const w = new THREE.Group(), rnd = (a => () => (a = (a * 9301 + 49297) % 233280) / 233280)(7);
  const vine = new THREE.Mesh(new THREE.TorusGeometry(r, .0035, 6, 64), vineMat); vine.rotation.x = Math.PI / 2; w.add(vine);
  const N = 72;
  for (let i = 0; i < N; i++) { // leaves in pairs along the vine, all leaning the same way round
    const a = i / N * Math.PI * 2, l = new THREE.Mesh(LEAF, i % 3 ? leafMat : leafDark);
    l.position.set(Math.cos(a) * r, (rnd() - .5) * .006, Math.sin(a) * r);
    l.rotation.set(0, -a + Math.PI / 2, 0); l.rotateZ((i % 2 ? 1 : -1) * (.9 + rnd() * .4)); l.rotateX(-.5 - rnd() * .3); l.scale.setScalar(1.15 + rnd() * .45); w.add(l);
  }
  if (flowers) for (let i = 0; i < 11; i++) { // blossoms, most of them over the brow
    const a = Math.PI / 2 + (i - 5) * .26 + (rnd() - .5) * .08, f = new THREE.Group(), m = petalMats[i % 3];
    for (let k = 0; k < 5; k++) { const pt = new THREE.Mesh(PETAL, m); pt.rotation.y = k / 5 * Math.PI * 2; pt.rotateX(-.25); f.add(pt); }
    const c = new THREE.Mesh(new THREE.SphereGeometry(.003, 8, 6), heart); c.position.y = .002; f.add(c);
    const s = (i === 5 ? 1.35 : .8 + rnd() * .4) * (Math.abs(i - 5) < 3 ? 1.1 : .85);
    f.scale.setScalar(s); f.position.set(Math.cos(a) * (r + .004), .006 + rnd() * .004, Math.sin(a) * (r + .004));
    f.lookAt(f.position.clone().multiplyScalar(3).add(new THREE.Vector3(0, .25, 0))); f.rotateX(Math.PI / 2); w.add(f);
  }
  return w;
}
function wreathOn(p, {flowers = true, lift = 0} = {}) {
  if (p.headPts) { // an animated head: measure the hair where a crown sits (a little below its top) and ring it exactly there
    const P = p.headPts; let ty = -9; for (let i = 1; i < P.length; i += 3) ty = Math.max(ty, P[i]);
    const y = ty - .065; let cx = 0, cz = 0, n = 0, r = 0;
    for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < .012) { cx += P[i]; cz += P[i + 2]; n++; }
    cx /= n || 1; cz /= n || 1;
    // an oval: as wide as the hair at the sides, as deep as the hair in front (a quiff stands proud of the brow)
    const xs = [], zs = []; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < .012) { xs.push(Math.abs(P[i] - cx)); if (P[i + 2] > cz) zs.push(P[i + 2] - cz); }
    const pct = (a, q) => (a.sort((m, n) => m - n), a[Math.floor(a.length * q)] || .1);
    const rx = Math.max(.09, pct(xs, .96) + .006), rz = Math.max(.09, pct(zs, .97) + .006);
    const w = flowerWreath({flowers, r: 1}); w.userData.fitted = true;
    for (const c of [...w.children]) { if (c.geometry?.type === "TorusGeometry") { w.remove(c); continue; } c.position.x *= rx; c.position.z *= rz; } // (the leaves and flowers move out onto the oval)
    const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; ring.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz)); }
    w.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 96, .0035, 6, true), vineMat));
    mount(p, "Head", w, new THREE.Vector3(cx, y, cz), [-.12, 0, 0]);
    return;
  }
  mount(p, "Head", flowerWreath({flowers, r: p.female ? .1 : .108}), new THREE.Vector3(0, (p.norm ? 1.8 : 1.74) - .036 + lift, -.02), [.12, 0, 0]);
}
// Menswear for the animated men, after the references: long loose drapes to the ankle in soft jersey, and one of
//   "himation": a sleeveless top, a wide sash over the left shoulder falling down the back, a broad gold belt, a brooch;
//   "cowl":     a sleeveless top with a high round neck, a long panel of cloth falling from the left shoulder;
//   "bare":     bare-chested, a dark wrap skirt slung low and rolled at the waist, a broad gold collar, a medallion, armbands;
//   "plain":    an ordinary man: a sleeveless top, the long skirt, a leather belt.
// (Heights are the tailor's, for the animated men: neck 1.46, shoulders 1.42, chest 1.2-1.3, waist 1.07, hips .9.)
function frontZ(B, y, x0 = 0) { let z = -1; for (let i = 0; i < B.N; i++) if (Math.abs(B.P[i * 3] - x0) < .04 && Math.abs(B.P[i * 3 + 1] - y) < .02 && TORSO.test(B.dom[i])) z = Math.max(z, B.P[i * 3 + 2]); return z; }
function goldBand(p, side, at, r) { // a gold band around a limb, at a fraction of the way from one joint to the next
  const [a, b] = at, s = p.bones[a + "_" + side].getWorldPosition(new THREE.Vector3()), e = p.bones[b + "_" + side].getWorldPosition(new THREE.Vector3());
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, .007, 8, 28), gold); p.root.add(m); m.position.copy(s).lerp(e, at[2]);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), e.clone().sub(s).normalize()); m.updateMatrixWorld(true); p.bones[a + "_" + side].attach(m);
}
function sleeveless(p, B, body, mat) {
  // a short mantle round the shoulders and down the upper back, as the references drape them (it also covers where the
  // body was cut away under a modern shirt collar)
  let mm = p.mantle || mat; if (mm.normalMap) { mm = mm.clone(); mm.normalMap = null; } // (the fold texture runs across it in stripes)
  // (laid on the body's own surface, like a shawl: hung off it as a curved sheet, it stood out from the back like a board)
  put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || d === "neck_01") && y > 1.12 && y < 1.6 && z < .05,
    {mat: mm, exact: true, off: .03, smooth: 8, clip: `b.y > 1.19 + .025 * sin(b.x * 23.) && b.z < .03 && b.y < 1.56`}));
  // the front follows the body (cut from its own surface, to just past the shoulders)
  return wrap(body, (x, y, z, d) => (TORSO.test(d) || d === "neck_01" || ARMS.test(d)) && y > .95 && y < 1.5,
    {mat, exact: true, off: .02, smooth: 12, clip: `b.y < 1.45 && abs(b.x) < .25 && b.y > .97`});
}
function mensDrape(p, B, body, {color = 0xefe7d6, accent, style = "himation", gilt = true, wreath} = {}) {
  p.noNeckband = true; if (style !== "bare") p.mantle = drapeCloth(accent ?? (style === "plain" ? 0x6b5a44 : color), "jersey");
  // a tunic sewn and settled in Blender (tools/blender/garments.py), when there is one: real linen, real folds
  if (p.clothAsset && style !== "bare") p.cloth = {asset: p.clothAsset, color};
  const cl = drapeCloth(color, "jersey"), ac = drapeCloth(accent ?? color, "jersey"), low = style === "bare";
  // below: long and loose to the ankle
  if (p.cover) p.cover.value.set(p.cloth ? .58 : .66, p.cloth ? 1.33 : low ? .92 : .99); // the robe covers the thighs (the tunic, the torso too): not drawn, they can't push through it
  if (!p.cloth) { const skirt = drape(body, {from: low ? .95 : 1.07, to: .6, mat: low ? ac : cl, off: .03, flare: .1, folds: .035, weightsAt: skirtWeights(B, .6), hem: a => Math.max(0, -Math.sin(a)) * .03});
    put(p, skirt); if (SEATED) seatedFall(p, B, body, low ? ac : cl); }
  if (low) {
    put(p, drape(body, {from: .99, to: .92, mat: ac, off: .045, flare: 0, folds: .03, weightsAt: boneWeights(B, [["pelvis", 1]])})); // rolled at the waist
    if (gilt) {
      // a broad collar lying on the shoulders and chest (over the edge where the body meets the head)
      put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || d === "neck_01" || (d === "Head" && y < 1.51)) && y > 1.3 && y < 1.53,
        {mat: gold, exact: true, off: .01, smooth: 8, clip: `b.y > 1.355 + .25 * b.x * b.x * 6. && b.y < 1.5`}));
      const med = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .008, 28), gold); med.rotation.x = Math.PI / 2;
      const g = new THREE.Group(); g.add(med); mount(p, "spine_03", g, new THREE.Vector3(0, 1.31, frontZ(B, 1.31) + .012));
      for (const sd of ["l", "r"]) { goldBand(p, sd, ["upperarm", "lowerarm", .35], .05); goldBand(p, sd, ["lowerarm", "hand", .85], .036); }
    } else put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || d === "neck_01" || (d === "Head" && y < 1.51)) && y > 1.3 && y < 1.53,
        {mat: ac, exact: true, off: .012, smooth: 8, clip: `b.y > 1.38 + .25 * b.x * b.x * 6. && b.y < 1.5`})); // a rag knotted round the neck
  } else {
    // above: sleeveless with a boat neck, drawn in rings around the torso (so it never copies the body's holes)
    if (!p.cloth) put(p, sleeveless(p, B, body, cl));
    if (style === "himation") {
      const line = "(1.47 + 1.7 * (b.x - .13))"; // the sash: from the left shoulder down across to the right hip
      put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || (ARMS.test(d) && x > 0 && x < .3)) && y > .95 && y < 1.56,
        {mat: ac, exact: true, off: .036, smooth: 10, clip: `abs(b.y - ${line}) < .1 && b.y > .97 && b.y < 1.53`, bulge: (x, y) => .008 * Math.sin(y * 55)}));
      put(p, drape(body, {from: 1.48, to: SEATED ? .75 : .32, arc: [Math.PI * 1.48, Math.PI * 2.04], mat: ac, off: .05, flare: .1, folds: .035, free: true,
        include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
      if (gilt) put(p, drape(body, {from: 1.11, to: 1.01, mat: gold, off: .04, flare: 0, folds: 0, step: .025, weightsAt: boneWeights(B, [["spine_02", .5], ["pelvis", .5]])}));
      const brooch = new THREE.Mesh(new THREE.SphereGeometry(.024, 14, 10), gold); brooch.scale.z = .5; mount(p, "clavicle_l", brooch, new THREE.Vector3(.13, 1.46, frontZ(B, 1.42, .1) + .03));
    } else if (style === "cowl") {
      put(p, drape(body, {from: 1.47, to: SEATED ? .75 : .38, arc: [-Math.PI * .18, Math.PI * .3], mat: ac, off: .05, flare: .14, folds: .05, free: true,
        include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
      if (gilt) { const brooch = new THREE.Mesh(new THREE.SphereGeometry(.022, 14, 10), gold); brooch.scale.z = .5; mount(p, "clavicle_l", brooch, new THREE.Vector3(.12, 1.47, frontZ(B, 1.42, .1) + .03)); }
    } else put(p, drape(body, {from: 1.08, to: 1.03, mat: leather, off: .03, flare: 0, folds: 0, step: .025, weightsAt: boneWeights(B, [["pelvis", 1]])})); // plain: a belt
  }
  if (wreath) wreathOn(p, {flowers: false});
}
// Hermes after the EPIC musical's: the trickster god, grinning. Wings in his curls (no hat), round dark glasses, gold
// earrings; a short cream chiton to the knee, trimmed in gold at the neck and hem; a leather strap across him to a satchel;
// a dark cloak behind; leather bracers banded in gold; sandal laces wound up the calves, wings at the ankles; the caduceus.
function trimmed(mesh, test, base, trim = new THREE.Color(0xc9a24a)) { // colour the cloth's edge gold (by height in the tailor's space)
  const g = mesh.geometry, P = g.attributes.position, k = mesh.userData.k || 1, C = [];
  for (let i = 0; i < P.count; i++) { const c = test(P.getY(i) / k) ? trim : base; C.push(c.r, c.g, c.b); }
  g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  if (!mesh.material.userData.own) mesh.material = mesh.material.clone(); // (a cut garment's material is its own already, and a copy would lose the cut)
  mesh.material.vertexColors = true; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true; return mesh;
}
function headFit(p) { // from the measured hair: its top, its middle, its half-width just under the top
  const P = p.headPts; let ty = -9; for (let i = 1; i < P.length; i += 3) ty = Math.max(ty, P[i]);
  let cx = 0, cz = 0, n = 0, rx = 0; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - (ty - .07)) < .012) { cx += P[i]; cz += P[i + 2]; n++; rx = Math.max(rx, Math.abs(P[i])); }
  return {ty, cx: cx / (n || 1), cz: cz / (n || 1), rx};
}
function epicHermes(p, B, body) {
  const cream = new THREE.Color(0xefe6d2), cloth2 = drapeCloth(0xffffff, "jersey"), hide = new THREE.MeshStandardMaterial({color: 0x5e3c22, roughness: .55});
  const k = p.norm.k;
  // the chiton: sleeveless, gold at the neck; the skirt to the knee, gold at the hem
  const top = sleeveless(p, B, body, cloth2);
  top.userData.k = k; put(p, trimmed(top, y => y > 1.415, cream));
  const skirt = drape(body, {from: 1.04, to: .5, free: true, mat: cloth2, off: .024, flare: .13, folds: .035, step: .03, weightsAt: skirtWeights(B, .7), hem: a => Math.sin(a * 3) * .015});
  skirt.userData.k = k; put(p, trimmed(skirt, y => y < .555, cream));
  put(p, drape(body, {from: 1.075, to: 1.035, mat: hide, off: .032, flare: 0, folds: 0, step: .02, weightsAt: boneWeights(B, [["pelvis", 1]])})); // belt
  // the strap from the right shoulder to the left hip, and the satchel on it
  put(p, wrap(body, (x, y, z, d) => (TORSO.test(d) || (ARMS.test(d) && x < 0 && x > -.3)) && y > .95 && y < 1.56,
    {mat: hide, exact: true, off: .034, smooth: 8, clip: `abs(b.y - (1.47 - 1.69 * (b.x + .13))) < .022 && b.y > .98`}));
  const bag = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(.15, .12, .05), hide), flap = new THREE.Mesh(new THREE.BoxGeometry(.152, .06, .054), new THREE.MeshStandardMaterial({color: 0x4a2e1a, roughness: .5}));
  flap.position.y = .035; bag.add(box, flap); const clasp = new THREE.Mesh(new THREE.SphereGeometry(.009, 8, 6), gold); clasp.position.set(0, .01, .03); bag.add(clasp);
  mount(p, "pelvis", bag, new THREE.Vector3(.2, .93, frontZ(B, .98) - .03), [0, -.5, 0]);
  // the cloak, dark, hanging behind from the shoulders
  put(p, drape(body, {from: 1.47, to: SEATED ? .75 : .42, arc: [Math.PI * 1.1, Math.PI * 1.9], mat: drapeCloth(0x3a2a20, "jersey"), off: .05, flare: .12, folds: .04, free: true,
    include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
  // bracers on the forearms, banded in gold
  for (const sd of ["l", "r"]) {
    const s0 = p.bones["lowerarm_" + sd].getWorldPosition(new THREE.Vector3()), e0 = p.bones["hand_" + sd].getWorldPosition(new THREE.Vector3()), dir = e0.clone().sub(s0).normalize();
    const br = new THREE.Mesh(new THREE.CylinderGeometry(.044, .04, .13, 18, 1, true), hide); p.root.add(br); br.position.copy(s0).lerp(e0, .62); br.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); br.updateMatrixWorld(true); p.bones["lowerarm_" + sd].attach(br);
    goldBand(p, sd, ["lowerarm", "hand", .4], .045); goldBand(p, sd, ["lowerarm", "hand", .86], .041);
    for (const f of [.25, .45, .65, .85]) goldBand(p, sd, ["calf", "foot", f], .05 - f * .012); // sandal laces up the calf (gold-brown)
    const g = new THREE.Group(), x = sd === "l" ? .114 : -.114; g.add(wing(Math.sign(x), Math.abs(x) + .05, .1, -.07, .7)); mount(p, `foot_${sd}`, g, new THREE.Vector3());
  }
  // wings in his hair, dark glasses, gold earrings
  if (p.headPts) { const h = headFit(p);
    for (const sd of [-1, 1]) { const w = wing(sd, h.rx - .02, 0, 0, 1.5); w.rotation.z = .35; const g = new THREE.Group(); g.add(w); g.userData.fitted = true; mount(p, "Head", g, new THREE.Vector3(h.cx, h.ty - .07, h.cz - .02)); } }
  if (p.eyes) { const e = p.eyes, r = (e.max.y - e.min.y) / 2 + .006, ex = e.max.x - r + .004, ey = (e.max.y + e.min.y) / 2, ez = e.max.z + .012;
    const glass = new THREE.Group(), frame = new THREE.MeshStandardMaterial({color: 0xc9a24a, metalness: .9, roughness: .3}), lens = new THREE.MeshPhysicalMaterial({color: 0x1a1210, roughness: .05, metalness: .2, clearcoat: 1, transparent: true, opacity: .88});
    for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .0035, 8, 32), frame), disc = new THREE.Mesh(new THREE.CircleGeometry(r, 32), lens); ring.position.set(sx * ex, 0, 0); disc.position.copy(ring.position); glass.add(ring, disc);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, .12, 6), frame); arm.rotation.x = Math.PI / 2; arm.position.set(sx * (ex + r), 0, -.06); glass.add(arm); }
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(ex - r, .003, 6, 16, Math.PI), frame); bridge.position.set(0, .004, 0); glass.add(bridge);
    glass.userData.fitted = true; mount(p, "Head", glass, new THREE.Vector3(0, ey, ez)); // (pieces placed around its middle: mount converts that one point)
    for (const sx of [-1, 1]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(.011, .0025, 6, 16), gold); hoop.userData.fitted = true; const ear = (p.headPts ? headFit(p).rx : .14) - .012;
      mount(p, "Head", hoop, new THREE.Vector3(sx * ear, ey - .07, e.min.z - .04), [0, Math.PI / 2, 0]); } }
  const cad = caduceus(); p.root.add(cad); hold(p, "l", cad, new THREE.Vector3(0, -.08, 0));
}
function aulos() { // the double pipes
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({color: 0x6a4a2a, roughness: .5});
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.007, .011, .45, 8), m); t.position.set(s * .05, -.2, 0); t.rotation.z = s * .18; g.add(t); }
  return g;
}
// The female body sits a little lower: its own neckline and garment region.
let FNECK = "b.y < 1.47 && !(b.z > -.02 && pow(b.x / .11, 2.) + pow((b.y - 1.47) / .07, 2.) < 1.)";
let FUPPER = (x, y, z, d) => y > .92 && y < 1.55 && (TORSO.test(d) || ARMS.test(d) || d === "neck_01");
function crown(color, spikes) {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({color, roughness: .35, metalness: .9});
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.112, .108, .045, 32, 1, true), mat); band.material.side = THREE.DoubleSide; g.add(band);
  for (let i = 0; i < (spikes ? 9 : 14); i++) {
    const a = i / (spikes ? 9 : 14) * Math.PI * 2;
    const t = spikes ? new THREE.Mesh(new THREE.ConeGeometry(.014, .07, 5), mat) : new THREE.Mesh(new THREE.SphereGeometry(.009, 6, 4), mat);
    t.position.set(Math.cos(a) * .11, spikes ? .055 : .028, Math.sin(a) * .11); g.add(t);
  }
  return g;
}
function pomegranate() {
  const g = new THREE.Group(), red = new THREE.MeshStandardMaterial({color: 0x8a1420, roughness: .45});
  const f = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), red); f.scale.y = .9; g.add(f);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .018, .025, 6), red); c.position.y = .045; g.add(c);
  return g;
}
// A shade: pale, faintly lit from inside, see-through at the edges.
function ghostly(mat, opacity = .62) {
  const m = mat.clone();
  m.transparent = true; m.opacity = opacity; m.depthWrite = opacity > .8;
  m.emissive = new THREE.Color(0x9fc8e8); m.emissiveIntensity = .35;
  const prev = mat.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev?.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>
      float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(.75,.88,1.0), rim * .55);
      gl_FragColor.a *= .55 + rim * .45;`);
  };
  m.customProgramCacheKey = () => (mat.customProgramCacheKey?.() || "") + "ghost";
  return m;
}

// A person is a dozen skinned pieces; give pieces with the same bones one shared skeleton,
// so the graphics card animates each person once, not a dozen times.
function shareSkeletons(root) {
  const skins = []; root.traverse(o => { if (o.isSkinnedMesh) skins.push(o); });
  const shared = [];
  for (const o of skins) {
    const hit = shared.find(sk => sk.bones.length === o.skeleton.bones.length && sk.bones.every((b, i) => b === o.skeleton.bones[i]) && sk.boneInverses.every((m, i) => m.equals(o.skeleton.boneInverses[i])));
    if (hit) { if (o.skeleton !== hit) { o.skeleton.dispose?.(); o.skeleton = hit; } } else shared.push(o.skeleton);
  }
}

/* ---------- the realistic cast (Microsoft Rocketbox, MIT) ----------
   Each person is a scanned-quality human with a facial rig. They keep their own face, hair and hands;
   everything else is covered by the Greek clothes, cut in the tailor's space (the body stood upright,
   facing +z, scaled to the height the tailor works at) and mapped back onto the real body. */
const FEMALE = new Set(["persephone", "eurydice", "aunt", "thea", "dancer"]);
const CLIPMAP = {Idle_Loop: "idle", Idle_Talking_Loop: "talk", Sitting_Idle_Loop: "sit", Sitting_Talking_Loop: "sittalk", Walk_Loop: "walk", Walk_Formal_Loop: "walk",
  Jog_Fwd_Loop: "run", Sprint_Loop: "run", Crouch_Idle_Loop: "crouch", Push_Loop: "walk", Idle_Torch_Loop: "idle", listen: "listen"};
const RBCLIPS = {};
function rbClips(ASSETS, female) {
  const key = female ? "f" : "m";
  if (RBCLIPS[key]) return RBCLIPS[key];
  const out = {};
  for (const c of [...ASSETS["rb_anims_" + key].animations, ...(ASSETS["rb_anims_" + key + "x"]?.animations || [])]) {
    const k = c.clone(); k.tracks = k.tracks.filter(t => !t.name.endsWith(".position") || t.name.startsWith("Bip01."));
    // walks and runs carry the body forward inside the clip, then snap back when the loop restarts: the person
    // seems to step back and walk the same two steps again. Take that travel out (keep the bob); the film moves them.
    if (c.name !== "crouchin") for (const t of k.tracks) if (t.name === "Bip01.position") {
      const v = t.values, n = v.length / 3, T = t.times, d = T[n - 1] - T[0] || 1;
      const drift = [v[(n - 1) * 3] - v[0], v[(n - 1) * 3 + 1] - v[1], v[(n - 1) * 3 + 2] - v[2]];
      for (let i = 0; i < n; i++) { const f = (T[i] - T[0]) / d; for (let a = 0; a < 3; a++) v[i * 3 + a] -= drift[a] * f; }
    }
    out[c.name] = k;
  }
  // Calmer talk. The only seated motion with gestures in the library is a "thoughtful" one, a hand raised to the chin
  // and held there: every seated character talked with a hand at their face or in their hair, for most of the loop.
  // Seated on a bench, they now breathe as they sit and gesture with the arms of the standing talk; at a table, the
  // hands stay on the table and only the head and neck move with the talk. The standing talk is cut before its one
  // hand-to-head moment. Every cut is eased back to its first pose over the last second, so the loop never jumps.
  const ARMS = n => /^Bip01_[LR]_(Clavicle|UpperArm|Forearm|Hand|Finger)/.test(n), HEADS = n => /^Bip01_(Neck|Head)\./.test(n);
  const ease = (t, D) => { if (!t.name.endsWith(".quaternion")) return t; const v = t.values, T = t.times, n = T.length;
    for (let i = 0; i < n; i++) { const u = (T[i] - (D - 1)) / 1; if (u <= 0) continue; const w = Math.min(1, u); THREE.Quaternion.slerpFlat(v, i * 4, v, i * 4, v, 0, w * w * (3 - 2 * w)); }
    return t; };
  const cut = (t, D) => { const c = t.clone(); c.trim(0, D); return c; };
  const overlay = (name, base, from, take, D = Math.min(base.duration, from.duration)) => {
    if (!base || !from) return; const k = base.clone(); k.name = name; k.duration = D;
    k.tracks = [...base.tracks.filter(t => !take(t.name)).map(t => ease(cut(t, D), D)), ...from.tracks.filter(t => take(t.name)).map(t => ease(cut(t, D), D))];
    out[name] = k; };
  const talk = out.talk, sit = out.sit, table = out.sittable;
  overlay("sittalk", sit, talk, ARMS);
  overlay("sittabletalk", table, talk, HEADS);
  overlay("sittablethink", table, talk, HEADS);
  if (talk && talk.duration > 21) { const k = talk.clone(); k.duration = 20.5; k.tracks = k.tracks.map(t => ease(cut(t, 20.5), 20.5)); out.talk = k; }
  return RBCLIPS[key] = out;
}
const VISEMES = ["AA_VI_10_aa", "AA_VI_11_E", "AA_VI_13_O", "AA_VI_12_I", "AA_VI_14_U", "AA_VI_01_PP", "AA_VI_07_SS", "AA_VI_02_FF"];
function makeFace(root) {
  const meshes = []; root.traverse(o => { if (o.isSkinnedMesh && o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).length) meshes.push(o); });
  const toon = meshes.some(m => "face_blink" in m.morphTargetDictionary);
  const put = (n, v) => { for (const m of meshes) { const i = m.morphTargetDictionary[n]; if (i !== undefined) m.morphTargetInfluences[i] = v; } };
  const w = {}, set = (n, v) => { w[n] = v; if (!toon) put(n, v); };
  let nextBlink = performance.now() + 1500 + Math.random() * 3000, blinkAt = 0, vis = VISEMES[0], visT = 0;
  return {
    ok: meshes.length > 0, set,
    update(now, speaking, level) {
      // blink every few seconds, sometimes twice
      if (now > nextBlink) { blinkAt = now; nextBlink = now + (Math.random() < .2 ? 260 : 2200 + Math.random() * 4200); }
      const b = Math.max(0, 1 - Math.abs(now - blinkAt - 70) / 70);
      set("AK_09_EyeBlinkLeft", b); set("AK_10_EyeBlinkRight", b);
      // speech: the mouth follows the loudness of the voice, moving between vowel and consonant shapes
      // if the voice can't be measured (a muted phone, say), the mouth still moves in the rhythm of speech
      const lv = level > .012 ? level : speaking ? (.06 + .1 * Math.abs(Math.sin(now / 95))) * (Math.sin(now / 430) > -.35 ? 1 : .2) : 0;
      const target = speaking ? Math.min(1, lv * 5) : 0;
      if (now > visT) { vis = target > .55 ? VISEMES[Math.random() * 5 | 0] : VISEMES[5 + (Math.random() * 3 | 0)]; visT = now + 70 + Math.random() * 90; }
      for (const v of VISEMES) set(v, (w[v] || 0) + (((v === vis ? target : 0) * .85) - (w[v] || 0)) * .45);
      set("AK_25_JawOpen", (w.AK_25_JawOpen || 0) + (target * .25 - (w.AK_25_JawOpen || 0)) * .4);
      // a small, steady expression of their own
      set("AK_03_BrowInnerUp", speaking ? .15 + Math.sin(now / 900) * .1 : .05);
      for (const [n, v] of Object.entries(this.hold || {})) set(n, v);
      if (toon) for (const [n, v] of Object.entries(toonFace(w))) put(n, v);
    }
  };
}
function makeRealPerson(id, look, {ASSETS, scene, scale, seated = false, asset, female: fem}) {
  const female = fem ?? (FEMALE.has(id) || look.body === "female");
  const src = asset || ASSETS["rb_" + id], toon = !!src.scene.userData.toon;
  const root = SkeletonUtils.clone(src.scene);
  if (toon) tintToon(root, toonLook(look.id || id));
  root.updateMatrixWorld(true);
  const bones = {}; root.traverse(o => { if (o.isBone) { bones[o.name] = o; if (UNALIAS[o.name]) bones[UNALIAS[o.name]] = o; } });
  // stand them up in the tailor's space: facing +z, scaled so the head sits where the tailor expects it
  const w = n => new THREE.Vector3().setFromMatrixPosition(bones[n].matrixWorld);
  const head = w("Bip01_Head"), toe = w("Bip01_L_Toe0"), foot = w("Bip01_L_Foot");
  const turn = Math.atan2(toe.x - foot.x, toe.z - foot.z); // which way the feet point
  const k = head.y / 1.6;
  const norm = new THREE.Matrix4().makeScale(1, 1 / k, 1).multiply(new THREE.Matrix4().makeRotationY(-turn));
  const skins = []; root.traverse(o => { if (o.isSkinnedMesh) { o.frustumCulled = false; skins.push(o); } });
  const bodyParts = skins.filter(o => !/opacity/i.test([].concat(o.material)[0].name));
  // one merged body for the tailor, read exactly as it is drawn at rest (skinning applied), in the tailor's space
  const common = bodyParts[0].skeleton.bones, P = [], UV = [], SI = [], SW = [], I = []; let base = 0;
  const v = new THREE.Vector3();
  for (const o of bodyParts) {
    const g = o.geometry, pos = g.attributes.position, uv = g.attributes.uv, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const remap = o.skeleton.bones.map(bn => common.indexOf(bn));
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld).applyMatrix4(norm); P.push(v.x, v.y, v.z);
      UV.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
      for (let c = 0; c < 4; c++) { SI.push(Math.max(0, remap[comp(si, i, c)])); SW.push(comp(sw, i, c)); }
    }
    const ix = g.index.array; for (let t = 0; t < ix.length; t++) I.push(ix[t] + base);
    base += pos.count;
  }
  // remember where each vertex of the real body sits in the tailor's space, so its material can hide what the clothes cover
  { let off = 0; for (const o of bodyParts) { const g = o.geometry, n = g.attributes.position.count; if (!g.attributes.aBind) g.setAttribute("aBind", new THREE.Float32BufferAttribute(P.slice(off * 3, (off + n) * 3), 3));
      // how much each vertex belongs to a hand: hands are always drawn, whatever the sleeves do
      if (!g.attributes.aHand) { const hb = o.skeleton.bones.map(b => /Hand|Finger|^DEF-(Thumb|Index|Middle|Ring|Pinky)\d/.test(b.name)), si = g.attributes.skinIndex, sw = g.attributes.skinWeight, h = new Float32Array(n);
        for (let i = 0; i < n; i++) for (let c = 0; c < 4; c++) if (hb[comp(si, i, c)]) h[i] += comp(sw, i, c);
        g.setAttribute("aHand", new THREE.BufferAttribute(h, 1)); }
      off += n; } }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2)); merged.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(SI, 4));
  merged.setAttribute("skinWeight", new THREE.Float32BufferAttribute(SW, 4)); merged.setIndex(I); merged.computeVertexNormals();
  const ref = bodyParts[0], tailor = new THREE.SkinnedMesh(merged, ref.material);
  // garments get their own skeleton, bound at this rest pose, and live directly under the person
  const skel = new THREE.Skeleton(common);
  tailor.skeleton = skel; tailor.bindMatrix = new THREE.Matrix4();
  tailor.userData = {toNorm: norm, fromNorm: norm.clone().invert(), home: root, skel};
  const hand = n => w(n).applyMatrix4(norm), wrist = Math.min(Math.abs(hand("Bip01_L_Hand").x), Math.abs(hand("Bip01_R_Hand").x)) + .012; // the sleeves end at the wrist joint
  const person = {root, bones, body: ref, norm: {k, turn}, female, wrist, toon};
  if (toon) { // a cartoon head is bigger and higher than the realistic one hats and crowns were placed for: move them up and size them to it
    const hb = w("Bip01_Head").applyMatrix4(norm), box = new THREE.Box3(), top = new THREE.Box3(), v = new THREE.Vector3();
    const eyes = new THREE.Box3();
    for (const o of skins) if (/snow-eyes$|rain-eyes$/i.test(o.name)) { const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i += 2) { v.fromBufferAttribute(pos, i); o.applyBoneTransform(i, v); eyes.expandByPoint(v.applyMatrix4(o.matrixWorld).applyMatrix4(norm)); } }
    if (!eyes.isEmpty()) person.eyes = eyes;
    for (const o of skins) if (o.userData.head && /head|hair/i.test(o.name)) { const hair = /hair/i.test(o.name), pos = o.geometry.attributes.position; /* (cartoon hair has volume: hats sit on it, sized to the head) */
      for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld).applyMatrix4(norm); top.expandByPoint(v); if (!hair) box.expandByPoint(v); (person.headPts ||= []).push(v.x, v.y, v.z); } }
    person.hat = {dy: top.max.y - hb.y - .223 - .05, s: (box.max.z - box.min.z) / .247 * 1.08}; // (measured on the realistic heads; front to back, since ears make width a poor guide)
  }
  // the real clothes underneath: not drawn where the Greek ones cover them; below the hem, leather
  const low = seated ? .58 : .1, fp = {value: 0}, hh = {value: 0};
  person.cover = {value: new THREE.Vector2(9, -9)}; // (the band of leg a long robe covers, set by the robe: none until then)
  for (const o of bodyParts) if (/_body/i.test([].concat(o.material)[0].name)) {
    const m = o.material.clone();
    m.onBeforeCompile = sh => {
      if (m.userData.skinTone) skinShader(sh, m); // (an animated character's own skin colour)
      sh.uniforms.uFP = fp; sh.uniforms.uHH = hh; sh.uniforms.uCover = person.cover;
      sh.fragmentShader = "uniform float uFP; uniform float uHH; uniform vec2 uCover;\n" + sh.fragmentShader;
      sh.vertexShader = "attribute vec3 aBind; attribute float aHand; varying vec3 vB; varying float vH;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvB = aBind; vH = aHand;");
      sh.fragmentShader = "varying vec3 vB; varying float vH;\n" + sh.fragmentShader.replace("void main() {", `void main() {
        ${toon ? "" : `if (vH < .6 && abs(vB.x) < .72 && vB.y > ${low.toFixed(2)} && vB.y < 1.5 && (vB.y > .95 || abs(vB.x) > .28)) discard;`}
        ${toon ? "" : "if (vB.y > 1.46 && abs(vB.x) < .22) discard;"}
        if (vH < .6 && abs(vB.x) < .2 && vB.y > uCover.x && vB.y < uCover.y) discard; // (thighs under a robe: sitting, they pushed through it)
        if (uFP > .5 && vB.y > 1.2) discard;
        if (uHH > .5 && vH > .3) discard;
        ${toon ? "" : `if (abs(vB.x) < ${(wrist - .004).toFixed(3)} && vB.y > ${low.toFixed(2)} && vB.y < 1.5) discard;`}`).replace("#include <map_fragment>", `#include <map_fragment>
        ${toon ? "" : `if (vB.y < ${low.toFixed(2)} && abs(vB.x) < .6) { float l = dot(diffuseColor.rgb, vec3(.3,.59,.11)); diffuseColor.rgb = vec3(.26,.17,.11) * (.55 + l * .9); }`}`);
    };
    m.customProgramCacheKey = () => "rbbody" + low + wrist.toFixed(3) + toon;
    o.material = m;
  }
  // dress: long sleeves, long hems, a high neckline, so nothing modern shows
  // (an animated man's chin hangs lower than the realistic neckline: a round neck just under it)
  const neck = toon && !female ? "b.y < 1.5 && !(b.z > .0 && pow(b.x / .075, 2.) + pow((b.y - 1.5) / .05, 2.) < 1.)" : NECKLINE_HIGH;
  LONG = true; WRIST = wrist + .055; SEATED = seated; NECKLINE = neck; const keepF = [FNECK, FUPPER]; FNECK = neck; FUPPER = UPPER;
  TOONDRESS = toon;
  person.clothAsset = toon && !female && !seated ? ASSETS.toon_chiton_short : null; // (seated, the knees came through its skirt: a seated settling is still to come)
  try { look.dress(person, study(tailor), tailor); } finally { TOONDRESS = false; LONG = false; WRIST = .675; SEATED = false; NECKLINE = NECKLINE_LOW; [FNECK, FUPPER] = keepF; }
  if (person.cloth) clothOn(person, person.cloth.asset, person.cloth.color);
  if (toon && !female && !person.noNeckband) { // the animated man's body ends in a ragged edge where his modern collar was: a neckband in the tunic's colour covers it
    let tunic = null; root.traverse(o => { if (!tunic && o.userData.garment && o.userData.own && o.userData.top > 1.3) tunic = o; });
    if (tunic) put(person, drape(tailor, {from: 1.495, to: 1.39, mat: cloth(tunic.material.color.getHex()), off: .011, flare: .004, folds: 0, step: .02,
      include: d => d === "neck_01" || d === "spine_03", weightsAt: boneWeights(study(tailor), (x, y) => y > 1.46 ? [["neck_01", .7], ["spine_03", .3]] : [["spine_03", 1]])}));
  }
  if (toon && !female && person.noNeckband && person.mantle) { // the open necklines: the same ragged edge shows at the nape, under the shawl; a band of the shawl's cloth round the back only
    let mm = person.mantle; if (mm.normalMap) { mm = mm.clone(); mm.normalMap = null; }
    put(person, drape(tailor, {from: 1.56, to: 1.4, arc: [Math.PI * 1.2, Math.PI * 1.8], mat: mm, off: .014, flare: .004, folds: 0, step: .02,
      include: d => d === "neck_01" || d === "spine_03", weightsAt: boneWeights(study(tailor), (x, y) => y > 1.46 ? [["neck_01", .7], ["spine_03", .3]] : [["spine_03", 1]])}));
  }
  if (look.eyes) { // Charon's eyes of flame
    root.traverse(o => { if (o.isMesh && /head/i.test([].concat(o.material)[0].name)) { o.material = o.material.clone(); } });
    const l = new THREE.PointLight(look.eyes, .35, .4, 2); mount(person, "Head", l, new THREE.Vector3(0, 1.69, .14));
  }
  const headParts = skins.filter(o => /head|opacity/i.test([].concat(o.material)[0].name) || o.userData.head);
  root.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && o.parent?.isBone && /Head/.test(o.parent.name)) headParts.push(o); });
  // First person: only your body from the waist down is drawn, so looking down you see your hem and your feet,
  // never the inside of your own neck. Reflections and cutaways show all of you.
  // Clothes fitted to the body itself (tunic, sleeves) are cut off just below the eyes instead, so you see your own
  // chest, arms and hands; capes and ornaments are simply hidden.
  const upper = [], cut = [], fpPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.22);
  root.traverse(o => {
    if (o.userData.garment && o.userData.top > 1.25) (o.userData.own && !Array.isArray(o.material) ? cut : upper).push(o);
    if (o.isMesh && !o.isSkinnedMesh && !o.userData.garment && o.parent?.isBone && !/Foot|Toe|Hand|Finger/.test(o.parent.name) && !headParts.includes(o)) upper.push(o);
  });
  person.hideHands = on => { hh.value = on ? 1 : 0; }; // seen from your own eyes, a hand raised to your face would fill the lens
  person.setHead = show => { person.headShown = show; headParts.forEach(o => o.visible = show); upper.forEach(o => o.visible = show); cut.forEach(o => o.material.clippingPlanes = show ? null : [fpPlane]); fp.value = show ? 0 : 1; };
  person.fpCut = () => { fpPlane.constant = root.position.y + 1.22 * root.scale.y; }; // keep the cut at eye height as you climb steps
  shareSkeletons(root);
  if (look.ghost) root.traverse(o => { if (o.isMesh) { o.material = [].concat(o.material).map(m => ghostly(m, o.userData.garment ? .9 : .5)); if (o.material.length === 1) o.material = o.material[0]; o.renderOrder = o.userData.garment ? 3 : 2; } });
  root.scale.setScalar(scale);
  const clips = toon ? toonClips(src, ASSETS["rb_anims_" + (female ? "f" : "m")], rbClips(ASSETS, female)) : rbClips(ASSETS, female), mixer = new THREE.AnimationMixer(root);
  if (toon) { const swing = hairSprings(root), tick = mixer.update.bind(mixer); mixer.update = dt => { tick(dt); swing(dt); return mixer; }; } // hair settles after the body moves
  person.expr = makeFace(root); person.clips = clips;
  Object.assign(person, {mixer, action: null, current: null, speaking: false, play(name, fade = .35) {
    const want = CLIPMAP[name] || name, clip = clips[want] || clips.idle;
    if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.timeScale = 1; a.reset().fadeIn(fade).play();
    if (want === "crouchin") { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
    if (want === "walk" && name === "Push_Loop") a.timeScale = .45;
    if (this.action && this.action !== a) this.action.fadeOut(fade);
    this.action = a; this.current = name;
  }});
  // Snow, the animated man, was drawn with a long neck; ours sits the head lower on the shoulders. Done after the
  // clothes are fitted (they and the body share the same rest pose), so everything above the neck moves down together.
  if (toon && !female) { const h = bones.Head; h.position.multiplyScalar(.62); h.updateMatrixWorld(true); }
  if (toon && SHAPE[id]) shapeBody(root, bones, SHAPE[id], seated);
  scene.add(root);
  return person;
}

// A garment sewn and settled in Blender, put on: its skin bound to this person's own bones (found by name), with the
// bind it was settled in, which is this body's rest pose, so it follows every animation, every body shape, every fix.
function clothOn(p, asset, color) {
  let sm = null; asset.scene.traverse(o => { if (o.isSkinnedMesh && !sm) sm = o; }); if (!sm) return;
  const byName = {}; p.root.traverse(o => { if (o.isBone || !byName[o.name]) byName[o.name] = o; }); /* (bones first; the rig's own root node can be a joint too) */
  const bones = sm.skeleton.bones.map(b => byName[b.name]); if (bones.some(b => !b)) { console.warn("cloth: bones missing"); return; }
  const mat = drapeCloth(color, "jersey").clone(); mat.side = THREE.DoubleSide; mat.normalMap = null; /* (the folds are real now: the painted ones only striped it) */
  const mesh = new THREE.SkinnedMesh(sm.geometry, mat); p.bones.pelvis.parent.add(mesh);
  mesh.position.copy(sm.position); mesh.quaternion.copy(sm.quaternion); mesh.scale.copy(sm.scale); mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones, sm.skeleton.boneInverses.map(m => m.clone())), sm.bindMatrix.clone());
  mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.userData.garment = mesh.userData.own = true; mesh.userData.top = 1.45;
  return mesh;
}

// Body shapes from the character sheets: everyone is built on one of two animated bodies, so each is resized by
// its bones. Every scale is uniform (a stretched bone shears when its children turn), and none is animated, so the
// clips play on top unchanged. Each part is sized on its own, the next part up undoing it: hips, belly (the waist),
// chest (shoulders and arms), head, legs (thigh to toe, the body lowered so the feet stay down), size (overall height).
const SHAPE = {
  mikon: {size: .97, hips: 1.35, belly: 1.4, chest: 1, head: 1.28, legs: .8},          // pear-shaped, round belly, short legs
  aunt: {size: .92, hips: 1.3, belly: 1.3, chest: 1.06, head: 1.16, legs: .86},       // Kleio: short, round, formidable
  demeas: {size: 1.05, hips: 1.2, belly: 1.4, chest: 1.12, head: 1.18, legs: .85},    // huge and barrel-chested
  charon: {size: 1.02, belly: .94, chest: .96, head: 1.06, legs: 1.04},               // very tall and gaunt (he is built 1.08 tall already)
  orpheus: {size: 1.03, belly: .95, chest: .97, head: 1.1, legs: 1.04},              // slim and long-limbed
  hermes: {belly: .95, head: 1.1, legs: 1.03},
  lykon: {size: 1.07, belly: .92, chest: .95, head: 1.1, legs: 1.06},                // tall and lanky
  nikias: {size: 1.05, head: 1.1, legs: 1.02},
  thea: {size: .93, head: 1.06},                                                     // petite
  hades: {size: 1.06, chest: 1.06, head: 1.08},
};
function shapeBody(root, bones, {size = 1, hips = 1, belly = 1, chest = 1, head = 1, legs = 1}, seated) {
  const arm = bones.pelvis.parent, v = new THREE.Vector3(), sc = (b, k) => b && b.scale.multiplyScalar(k);
  // what has to stay put: the feet on the ground, or for someone seated, the hips on the seat
  const anchor = () => { root.updateMatrixWorld(true); return seated ? bones.pelvis.getWorldPosition(v).y : Math.min(bones.foot_l.getWorldPosition(v).y, bones.foot_r.getWorldPosition(v).y); };
  const y0 = anchor();
  sc(bones.spine_01, hips); sc(bones.spine_02, belly / hips); sc(bones.spine_03, chest / belly);
  sc(bones.neck_01, 1 / chest); sc(bones.Head, head); // (the head grows from the base of the skull: grown from the neck, the neck grew with it)
  for (const s of ["l", "r"]) sc(bones["thigh_" + s], legs);
  arm.scale.multiplyScalar(size); arm.position.multiplyScalar(size);
  arm.position.y += (y0 - anchor()) / root.scale.y;
  root.updateMatrixWorld(true);
}

// Someone in a crowd: a lighter body, plain Greek dress in their own colours.
export function makeExtra(asset, {ASSETS, scene, female, seated = false, colors, veil}) {
  const look = {dress(p, B, body) { if (female && p.toon) weddingDrape(p, B, body, {color: colors[0], fabric: "jersey", armband: true}); else (female ? gown : greek)(p, B, body, colors[0], colors[1], {veil: veil ? colors[2] : undefined}); }};
  return makeRealPerson("extra", look, {ASSETS, scene, scale: 1, seated, asset, female});
}
// Another of the same person, cheaply: the same body and clothes, a new skeleton, its own colours.
export function cloneExtra(p, ASSETS, scene, tint) {
  const root = SkeletonUtils.clone(p.root);
  root.traverse(o => { if (o.isMesh && o.userData.garment && !/gold|leather/.test(o.material.name)) { o.material = o.material.clone(); if (o.material.color) o.material.color.offsetHSL(tint, (Math.random() - .5) * .2, (Math.random() - .5) * .15); } });
  const bones = {}; root.traverse(o => { if (o.isBone) { bones[o.name] = o; if (UNALIAS[o.name]) bones[UNALIAS[o.name]] = o; } });
  shareSkeletons(root);
  const clips = p.clips || rbClips(ASSETS, p.female), mixer = new THREE.AnimationMixer(root);
  if (p.toon) { const swing = hairSprings(root), tick = mixer.update.bind(mixer); mixer.update = dt => { tick(dt); swing(dt); return mixer; }; }
  const q = {root, bones, mixer, female: p.female, action: null, current: null, play(name, fade = .35) {
    const clip = clips[CLIPMAP[name] || name] || clips.idle; if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.reset().fadeIn(fade).play(); a.time = Math.random() * clip.duration;
    if (this.action && this.action !== a) this.action.fadeOut(fade); this.action = a; this.current = name; }};
  scene.add(root); return q;
}
export function makeCastMember(id, {ASSETS, CLIPS, scene, scale = 1, seated = false}) {
  const look = {...LOOKS[id], id};
  if (ASSETS["rb_" + (look.as || id)]) return makeRealPerson(look.as || id, look, {ASSETS, scene, scale, seated});
  const root = SkeletonUtils.clone((look.body === "female" ? ASSETS.body_female : ASSETS.head_male).scene);
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name] = o; });
  let body = null;
  root.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    if (/Superhero/i.test(o.material.name)) { body = o; o.material = skinMaterial(o.material, look); }
    else if (look.eyes && /Eye/i.test(o.material.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(look.eyes); o.material.emissiveIntensity = 1.6; }
    else if (/Hair/i.test(o.material.name)) { o.material = o.material.clone(); o.material.color = new THREE.Color(look.hairColor).multiplyScalar(1.3); }
  });
  for (const h of look.hair) {
    const parts = []; SkeletonUtils.clone(ASSETS[h].scene).traverse(o => { if (o.isSkinnedMesh) parts.push(o); });
    for (const o of parts) {
      o.bind(new THREE.Skeleton(o.skeleton.bones.map(b => bones[b.name] || b), o.skeleton.boneInverses), o.bindMatrix);
      o.material = o.material.clone(); o.material.color = new THREE.Color(look.hairColor); o.frustumCulled = false;
      root.add(o);
    }
  }
  const person = {root, bones, body};
  look.dress(person, study(body), body);
  if (look.eyes) { // a faint glow on the face, so the eyes read as fire in the dark
    const l = new THREE.PointLight(look.eyes, .25, .35, 2); mount(person, "Head", l, new THREE.Vector3(0, 1.69, .14));
  }
  // For the person you play: hide the head while the camera is inside it, show it in reflections and cutaways.
  const headParts = []; root.traverse(o => { if (o.isMesh && o !== body && (/Hair|Eye/i.test([].concat(o.material)[0]?.name || "") || o.parent?.isBone)) headParts.push(o); });
  // In first person only your lower half is drawn (the camera sits where your chest would block the view):
  // looking down you see your legs, your hem, your sandals.
  const upperParts = []; root.traverse(o => { if (o.isSkinnedMesh && o !== body && !headParts.includes(o)) { o.geometry.computeBoundingBox(); if (o.geometry.boundingBox.max.y > 1.12) upperParts.push(o); } });
  person.hideHands = on => { hh.value = on ? 1 : 0; }; // seen from your own eyes, a hand raised to your face would fill the lens
  person.setHead = show => { body.material.userData.head.value = show ? 1 : 0; headParts.forEach(o => o.visible = show); };
  if (look.ghost) root.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(ghostly) : ghostly(o.material); o.renderOrder = 2; } });
  root.scale.setScalar(scale);
  const mixer = new THREE.AnimationMixer(root);
  Object.assign(person, {mixer, action: null, current: null, play(name, fade = .35) {
    const clip = CLIPS[name]; if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.reset().fadeIn(fade).play();
    if (this.action) this.action.fadeOut(fade);
    this.action = a; this.current = name;
  }});
  scene.add(root);
  return person;
}
export { oar, caduceus, pole, pomegranate, crown, mount };
