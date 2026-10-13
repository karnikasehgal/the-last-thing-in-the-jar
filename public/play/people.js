// The cast, dressed the way the ancient sources describe them.
// Everyone is the same full human body (Quaternius, CC0) with clothes built here in code:
// garments that follow the body are cut from its own surface and pushed out a little, skirts and
// cloaks are drawn around it ring by ring, and every vertex borrows its skinning from the body
// so the clothes move with the animations. Hats, beards, props and jewellery ride on the bones.
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

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
  const names = bodyMesh.skeleton.bones.map(b => UNALIAS[b.name] || b.name), idx = {}; names.forEach((n, i) => idx[n] = i);
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
function wrap(body, keep, {off = LONG ? .02 : .016, mat, bulge = () => 0, clip, smooth = LONG ? 16 : 3}) { // realistic bodies: smoothed enough that the jacket underneath (lapels, seams) doesn't show
  const B = study(body), ix = B.g.index.array, tri = [];
  if (LONG && clip && !/1\.65/.test(clip)) clip = `${NECKLINE_HIGH} && abs(b.x) < ${WRIST.toFixed(3)} && (b.y > .95 || abs(b.x) > .3)`; // (hands hang below the waist line: keep the sleeves whole) // cover everything modern (the hood keeps its own shape)
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
function drape(body, {from, to, mat, off = .02, flare = .06, folds = .012, arc = [0, Math.PI * 2], hem = () => 0, include, weightsAt, SEG = 56, step = .035, free = false}) {
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
      if (prev) rad = Math.max(rad, prev[c] * .985); // cloth hangs from the widest point, it doesn't cling
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
const UPPER = (x, y, z, d) => y < 1.6 && (ARMS.test(d) || (LONG && /^hand_/.test(d) && Math.abs(x) < WRIST + .01) || (y > .96 && (TORSO.test(d) || d === "neck_01"))); // arms whole, wherever the hands hang, to just past the wrist
const put = (p, m) => { const h = m.userData.home; delete m.userData.home; (h || p.root).add(m); };
const LOOKS = {
  // Hermes: young and beardless as the classical painters show him, in a traveller's hat with
  // wings, a short pinned cloak over a short tunic, winged sandals, and the herald's staff.
  hermes: {tone: 0xfff0e2, hair: ["hair_simpleparted"], hairColor: 0x4a321c, dress(p, B, body) {
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
    // his pole, held in the raised hand
    if (!p.norm) mount(p, "hand_r", pole(), new THREE.Vector3(-.75, 1.42, -.02), [Math.PI / 2, 0, 0]);
  }},
  // Elpenor: the youngest of Odysseus' crew, a sailor in a work tunic fastened on one shoulder.
  elpenor: {tone: 0xf2dcc4, hair: ["hair_buzzed"], hairColor: 0x2a1d14, dress(p, B, body) {
    const t = cloth(0x5b6b78);
    // fastened on the left shoulder; the right shoulder and chest are bare
    put(p, wrap(body, UPPER, {mat: t, clip: `${NECKLINE} && b.x < .3 && b.y > .97 && b.y < max(1.24, 1.31 + 1.5 * b.x)`}));
    put(p, drape(body, {from: 1.0, to: .66, mat: cloth(0x5b6b78, {folds: true}), flare: .04, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x3b2a1c), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  }},
  // Theseus: the hero of Athens, older now and bearded, in a red cloak with his father's sword.
  theseus: {tone: 0xf6dfc6, hair: ["hair_simpleparted", "hair_beard"], hairColor: 0x3a2516, dress(p, B, body) {
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
    put(p, wrap(body, UPPER, {mat: cloth(0xa89a80), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xa89a80, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x4a3a2a), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  }},  // Mikon a year on, sitting on the bank: the same clothes, long enough to cover him seated
  mikon_bank: {as: "mikon", tone: 0xf3dcc2, hair: ["hair_buzzed", "hair_beard"], hairColor: 0x3b2a1c, dress(p, B, body) {
    put(p, wrap(body, UPPER, {mat: cloth(0xa89a80), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xa89a80, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.03, to: .99, mat: cloth(0x4a3a2a), off: .025, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    seatedFall(p, B, body, cloth(0xa89a80, {folds: true}));
  }},
  // Orpheus: young and clean-shaven, as the vase painters show him singing; a white tunic, a blue cloak.
  orpheus: {tone: 0xf6dcc0, hair: ["hair_simpleparted"], hairColor: 0x2e1c10, dress(p, B, body) {
    put(p, wrap(body, UPPER, {mat: cloth(0xeee6d4), clip: `${NECKLINE} && ${SLEEVE(.33)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .6, mat: cloth(0xeee6d4, {folds: true}), flare: .05, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: .64, to: .6, mat: cloth(0x2c3f6e), off: .055, flare: 0, folds: 0, weightsAt: skirtWeights(B, .8)}));
    put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
    put(p, drape(body, {from: 1.5, to: .78, arc: [Math.PI * 1.08, Math.PI * 1.92], mat: cloth(0x2c3f6e, {folds: true}), off: .04, flare: .1, folds: .02,
      include: d => TORSO.test(d), weightsAt: boneWeights(B, (x, y) => y > 1.15 ? [["spine_03", 1]] : [["spine_03", .6], ["spine_02", .4]])}));
    mount(p, "clavicle_r", new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 8), gold), new THREE.Vector3(-.13, 1.47, .06));
  }},
  // The wedding at Corinth. Demeas, the uncle who gives the toast.
  demeas: {dress(p, B, body) { greek(p, B, body, 0xd9cdb0, 0x6b2a5a); }},
  // Kleio, the aunt who runs everything.
  aunt: {body: "female", dress(p, B, body) { gown(p, B, body, 0x1f3a6a, 0x9ab0d8, {veil: 0x26385f}); }},
  // Lykon, Mikon's friend, who has heard the goat joke before.
  lykon: {dress(p, B, body) { greek(p, B, body, 0x6b7a4a, 0x4a3a2a); }},
  // Nikias, the groom, in white with a myrtle wreath.
  nikias: {dress(p, B, body) { greek(p, B, body, 0xf2ede2, 0xf2ede2, {wreath: true}); }},
  // Thea, the bride: saffron, a veil, a wreath.
  thea: {body: "female", dress(p, B, body) { gown(p, B, body, 0xe8a83a, 0xf6e2b0, {wreath: true}); }},
  // Eurydice on her wedding day: alive, in saffron, with a myrtle wreath
  eurydice_alive: {as: "eurydice", body: "female", dress(p, B, body) { gown(p, B, body, 0xf2ead8, 0xe8c87a, {wreath: true}); }},
  // the same, standing, for the meadow: a full-length chiton, and a skirt for when she falls
  eurydice_meadow: {as: "eurydice", body: "female", dress(p, B, body) { gown(p, B, body, 0xf2ead8, 0xe8c87a, {wreath: true, kneel: true}); }},
  // the piper, who does not stop playing for anything
  piper: {dress(p, B, body) { greek(p, B, body, 0x8a2a20, 0x5a1a14); mount(p, "Head", aulos(), new THREE.Vector3(0, 1.6, .2), [1.15, 0, 0]); }},
  dancer: {body: "female", dress(p, B, body) { gown(p, B, body, 0xc84a6a, 0xf0b8c8); }},
  // A shade on the meadow: anyone at all, faded.
  shade: {tone: 0xffffff, hair: ["hair_simpleparted"], hairColor: 0x3a3028, sandals: false, ghost: true, dress(p, B, body) {
    put(p, wrap(body, UPPER, {mat: cloth(0xd8d4ca), clip: `${NECKLINE} && ${SLEEVE(.34)} && b.y > .97`}));
    put(p, drape(body, {from: 1.0, to: .3, mat: cloth(0xd8d4ca, {folds: true}), flare: .08, weightsAt: skirtWeights(B, .6)}));
  }},
  // Hades: the vase painters' Plouton, a grave bearded king in a dark cloak over one shoulder, an iron crown,
  // and a sceptre (left by his throne).
  hades: {tone: 0xead2bc, hair: ["hair_long", "hair_beard"], hairColor: 0x15100c, dress(p, B, body) {
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
    put(p, wrap(body, UPPER, {mat: cloth(0x6b5440), clip: `${NECKLINE} && b.x < .3 && b.y > .97 && b.y < max(1.24, 1.31 + 1.5 * b.x)`}));
    put(p, drape(body, {from: 1.0, to: .66, mat: cloth(0x6b5440, {folds: true}), flare: .03, hem: a => .03 * Math.abs(Math.sin(a * 6)), weightsAt: skirtWeights(B, .8)}));
  }},
  // Persephone: queen of the dead, in a pomegranate-red peplos with an overfold, a gold crown, a pomegranate.
  persephone: {body: "female", tone: 0xfbe4d0, hair: ["hair_buns"], hairColor: 0x2a160e, dress(p, B, body) {
    gown(p, B, body, 0x5e0f1c, 0x1a0a12);
    mount(p, "Head", crown(0xc9a14a, false), new THREE.Vector3(0, p.norm ? 1.735 : 1.675, -.012));
    const pom = pomegranate(); if (p.norm) hold(p, "l", pom, new THREE.Vector3(0, .03, -.03)); else mount(p, "hand_l", pom, new THREE.Vector3(.7, 1.38, .01));
  }},
  // Eurydice: a shade, so she's pale and not quite there, still in her wedding gown.
  eurydice: {body: "female", tone: 0xffffff, hair: ["hair_long"], hairColor: 0x3a2a1c, sandals: false, ghost: true, dress(p, B, body) {
    gown(p, B, body, 0xeeeae0, 0xf6f2ea, {wreath: true}); // her wedding gown, and the wreath she died in
  }}
};
// Plain Greek dress for anyone: a chiton, a belt, a cloak behind; a veil or a myrtle wreath if they want one.
function greek(p, B, body, color, cloak, {veil, wreath, kneel} = {}) { // cloak: a colour, or null for none
  put(p, wrap(body, UPPER, {mat: cloth(color), clip: `${NECKLINE} && ${SLEEVE(.33)} && b.y > .97`, smooth: 12, off: .022}));
  const skirt = drape(body, {from: 1.0, to: .6, mat: cloth(color, {folds: true}), flare: .06, weightsAt: skirtWeights(B, .8)}); put(p, skirt);
  if (SEATED) seatedFall(p, B, body, cloth(color, {folds: true}));
  if (kneel) { // a second skirt that hangs from the hips alone: when she kneels it pools on the ground instead of folding through itself
    const k = drape(body, {from: 1.0, to: .6, mat: cloth(color), flare: .2, folds: .01, weightsAt: boneWeights(B, [["pelvis", 1]])}); put(p, k); k.visible = false;
    p.kneel = on => { skirt.visible = !on; k.visible = on; }; }
  put(p, drape(body, {from: 1.035, to: .985, mat: leather, off: .027, flare: 0, folds: 0, weightsAt: boneWeights(B, [["pelvis", 1]])}));
  if (cloak !== null) put(p, drape(body, {from: 1.5, to: .9, arc: [Math.PI * 1.1, Math.PI * 1.9], mat: cloth(cloak, {folds: true}), off: .045, flare: .06, folds: .02, include: d => TORSO.test(d), weightsAt: boneWeights(B, [["spine_03", 1]])}));
  if (veil) put(p, wrap(body, (x, y, z, d) => (d === "Head" || d === "neck_01") && z < .02, {clip: "!(b.z > -.03 && pow(b.x / .09, 2.) + pow((b.y - 1.65) / .14, 2.) < 1.)", mat: cloth(veil), off: .018, smooth: 3, bulge: (x, y, z) => Math.max(0, -z) * .1}));
  if (wreath) { const w = new THREE.Group(), leaf = new THREE.MeshStandardMaterial({color: 0x3d5a2a, roughness: .7, side: THREE.DoubleSide});
    const r = p.female ? .1 : .112, leafG = new THREE.SphereGeometry(.009, 6, 4);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, l = new THREE.Mesh(leafG, leaf); l.scale.set(1.8, .45, .8); l.position.set(Math.cos(a) * r, Math.sin(i * 1.7) * .008, Math.sin(a) * r); l.rotation.y = -a; w.add(l); }
    mount(p, "Head", w, new THREE.Vector3(0, (p.norm ? 1.8 : 1.74) - (p.female ? .03 : 0), -.02), [.05, 0, 0]); }
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
  if (wreath) { const w = new THREE.Group(), leaf = new THREE.MeshStandardMaterial({color: 0x3d5a2a, roughness: .7, side: THREE.DoubleSide}), r = .1, leafG = new THREE.SphereGeometry(.009, 6, 4);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, l = new THREE.Mesh(leafG, i % 8 ? leaf : gold); l.scale.set(1.8, .45, .8); l.position.set(Math.cos(a) * r, Math.sin(i * 1.7) * .008, Math.sin(a) * r); l.rotation.y = -a; w.add(l); }
    mount(p, "Head", w, new THREE.Vector3(0, (p.norm ? 1.8 : 1.74) - .042, -.02), [.05, 0, 0]); }
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
  return RBCLIPS[key] = out;
}
const VISEMES = ["AA_VI_10_aa", "AA_VI_11_E", "AA_VI_13_O", "AA_VI_12_I", "AA_VI_14_U", "AA_VI_01_PP", "AA_VI_07_SS", "AA_VI_02_FF"];
function makeFace(root) {
  const meshes = []; root.traverse(o => { if (o.isSkinnedMesh && o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).length) meshes.push(o); });
  const w = {}, set = (n, v) => { w[n] = v; for (const m of meshes) { const i = m.morphTargetDictionary[n]; if (i !== undefined) m.morphTargetInfluences[i] = v; } };
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
    }
  };
}
function makeRealPerson(id, look, {ASSETS, scene, scale, seated = false, asset, female: fem}) {
  const female = fem ?? (FEMALE.has(id) || look.body === "female");
  const root = SkeletonUtils.clone((asset || ASSETS["rb_" + id]).scene);
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
      if (!g.attributes.aHand) { const hb = o.skeleton.bones.map(b => /Hand|Finger/.test(b.name)), si = g.attributes.skinIndex, sw = g.attributes.skinWeight, h = new Float32Array(n);
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
  const person = {root, bones, body: ref, norm: {k, turn}, female, wrist};
  // the real clothes underneath: not drawn where the Greek ones cover them; below the hem, leather
  const low = seated ? .58 : .1, fp = {value: 0}, hh = {value: 0};
  for (const o of bodyParts) if (/_body/i.test([].concat(o.material)[0].name)) {
    const m = o.material.clone();
    m.onBeforeCompile = sh => {
      sh.uniforms.uFP = fp; sh.uniforms.uHH = hh;
      sh.fragmentShader = "uniform float uFP; uniform float uHH;\n" + sh.fragmentShader;
      sh.vertexShader = "attribute vec3 aBind; attribute float aHand; varying vec3 vB; varying float vH;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvB = aBind; vH = aHand;");
      sh.fragmentShader = "varying vec3 vB; varying float vH;\n" + sh.fragmentShader.replace("void main() {", `void main() {
        if (vH < .6 && abs(vB.x) < .72 && vB.y > ${low.toFixed(2)} && vB.y < 1.5 && (vB.y > .95 || abs(vB.x) > .28)) discard;
        if (vB.y > 1.46 && abs(vB.x) < .22) discard;
        if (uFP > .5 && vB.y > 1.2) discard;
        if (uHH > .5 && vH > .3) discard;
        if (abs(vB.x) < ${(wrist - .004).toFixed(3)} && vB.y > ${low.toFixed(2)} && vB.y < 1.5) discard;`).replace("#include <map_fragment>", `#include <map_fragment>
        if (vB.y < ${low.toFixed(2)} && abs(vB.x) < .6) { float l = dot(diffuseColor.rgb, vec3(.3,.59,.11)); diffuseColor.rgb = vec3(.26,.17,.11) * (.55 + l * .9); }`);
    };
    m.customProgramCacheKey = () => "rbbody" + low + wrist.toFixed(3);
    o.material = m;
  }
  // dress: long sleeves, long hems, a high neckline, so nothing modern shows
  LONG = true; WRIST = wrist + .055; SEATED = seated; NECKLINE = NECKLINE_HIGH; const keepF = [FNECK, FUPPER]; FNECK = NECKLINE_HIGH; FUPPER = UPPER;
  try { look.dress(person, study(tailor), tailor); } finally { LONG = false; WRIST = .675; SEATED = false; NECKLINE = NECKLINE_LOW; [FNECK, FUPPER] = keepF; }
  if (look.eyes) { // Charon's eyes of flame
    root.traverse(o => { if (o.isMesh && /head/i.test([].concat(o.material)[0].name)) { o.material = o.material.clone(); } });
    const l = new THREE.PointLight(look.eyes, .35, .4, 2); mount(person, "Head", l, new THREE.Vector3(0, 1.69, .14));
  }
  const headParts = skins.filter(o => /head|opacity/i.test([].concat(o.material)[0].name));
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
  const clips = rbClips(ASSETS, female), mixer = new THREE.AnimationMixer(root);
  person.expr = makeFace(root);
  Object.assign(person, {mixer, action: null, current: null, speaking: false, play(name, fade = .35) {
    const want = CLIPMAP[name] || name, clip = clips[want] || clips.idle;
    if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.timeScale = 1; a.reset().fadeIn(fade).play();
    if (want === "crouchin") { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; }
    if (want === "walk" && name === "Push_Loop") a.timeScale = .45;
    if (this.action && this.action !== a) this.action.fadeOut(fade);
    this.action = a; this.current = name;
  }});
  scene.add(root);
  return person;
}

// Someone in a crowd: a lighter body, plain Greek dress in their own colours.
export function makeExtra(asset, {ASSETS, scene, female, seated = false, colors, veil}) {
  const look = {dress(p, B, body) { (female ? gown : greek)(p, B, body, colors[0], colors[1], {veil: veil ? colors[2] : undefined}); }};
  return makeRealPerson("extra", look, {ASSETS, scene, scale: 1, seated, asset, female});
}
// Another of the same person, cheaply: the same body and clothes, a new skeleton, its own colours.
export function cloneExtra(p, ASSETS, scene, tint) {
  const root = SkeletonUtils.clone(p.root);
  root.traverse(o => { if (o.isMesh && o.userData.garment && !/gold|leather/.test(o.material.name)) { o.material = o.material.clone(); if (o.material.color) o.material.color.offsetHSL(tint, (Math.random() - .5) * .2, (Math.random() - .5) * .15); } });
  const bones = {}; root.traverse(o => { if (o.isBone) { bones[o.name] = o; if (UNALIAS[o.name]) bones[UNALIAS[o.name]] = o; } });
  shareSkeletons(root);
  const clips = rbClips(ASSETS, p.female), mixer = new THREE.AnimationMixer(root);
  const q = {root, bones, mixer, female: p.female, action: null, current: null, play(name, fade = .35) {
    const clip = clips[CLIPMAP[name] || name] || clips.idle; if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.reset().fadeIn(fade).play(); a.time = Math.random() * clip.duration;
    if (this.action && this.action !== a) this.action.fadeOut(fade); this.action = a; this.current = name; }};
  scene.add(root); return q;
}
export function makeCastMember(id, {ASSETS, CLIPS, scene, scale = 1, seated = false}) {
  const look = LOOKS[id];
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
