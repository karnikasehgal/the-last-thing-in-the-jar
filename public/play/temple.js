// The old temple, made a sanctuary: full columns under a coffered dome, a back wall with two windows of stained glass
// glowing in the dark, a floor of cut-marble mosaic, one brilliant light high up in the dome, and hanging in the
// middle of it all Icarus, in dark bronze, falling head first on his great pale wings, held in the air by cables.
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { pbr } from "./pbr.js";

const C = new THREE.Vector3(56, 0, 4);          // the temple's centre on the ground
const W = 22, D = 18;                            // the platform
const COLS = [[46, -4], [46, 3], [46, 12], [66, -4], [66, 3], [66, 12], [51, -4.5], [56, -4.5], [61, -4.5], [51, 12.5], [61, 12.5]];

// a canvas drawn once and used as a texture
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// Opus sectile: a floor of cut coloured marble. A wide border of bands and lozenges, and in the middle a great
// wheel of radiating pieces, as in a Roman or Byzantine pavement.
function mosaic() {
  return canvasTex(2048, 1676, (g, w, h) => {
    const cream = "#e6dac2", rust = "#8e3424", black = "#1d1915", ochre = "#c08a34", sage = "#6c7a66", rose = "#c99a86";
    g.fillStyle = cream; g.fillRect(0, 0, w, h);
    // the border: dark bands with a row of lozenges between
    const band = (m, t, col) => { g.fillStyle = col; g.fillRect(m, m, w - 2 * m, t); g.fillRect(m, h - m - t, w - 2 * m, t); g.fillRect(m, m, t, h - 2 * m); g.fillRect(w - m - t, m, t, h - 2 * m); };
    band(20, 26, black); band(70, 14, rust); band(150, 26, black);
    const loz = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill(); };
    for (let x = 140; x < w - 120; x += 64) { loz(x, 112, 26, x / 64 % 2 ? ochre : sage); loz(x, h - 112, 26, x / 64 % 2 ? ochre : sage); }
    for (let y = 140; y < h - 120; y += 64) { loz(112, y, 26, y / 64 % 2 ? ochre : sage); loz(w - 112, y, 26, y / 64 % 2 ? ochre : sage); }
    // a field of small squares set on point
    g.save(); g.beginPath(); g.rect(200, 200, w - 400, h - 400); g.clip();
    for (let y = 200; y < h; y += 90) for (let x = 200 + (y / 90 % 2) * 45; x < w; x += 90) loz(x, y, 22, "#d4c4a6");
    g.restore();
    // the wheel
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .36;
    g.fillStyle = black; g.beginPath(); g.arc(cx, cy, R + 34, 0, 7); g.fill();
    g.fillStyle = cream; g.beginPath(); g.arc(cx, cy, R + 14, 0, 7); g.fill();
    const N = 32;
    for (let ring = 0; ring < 4; ring++) {
      const r0 = R * (1 - ring * .24), r1 = R * (1 - (ring + 1) * .24), off = ring % 2 ? Math.PI / N : 0;
      for (let i = 0; i < N; i++) {
        const a0 = i / N * Math.PI * 2 + off, a1 = (i + 1) / N * Math.PI * 2 + off, am = (a0 + a1) / 2;
        g.fillStyle = [[rust, cream], [ochre, black], [sage, rose], [black, ochre]][ring][i % 2];
        g.beginPath(); g.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0); g.lineTo(cx + Math.cos(am) * r1, cy + Math.sin(am) * r1);
        g.lineTo(cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0); g.closePath(); g.fill();
      }
    }
    g.fillStyle = rust; g.beginPath(); g.arc(cx, cy, R * .06, 0, 7); g.fill();
    // wear: the polish gone in places, faint cracks
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? "255,250,240" : "20,15,10"},${Math.random() * .05})`; const s = 4 + Math.random() * 30; g.fillRect(Math.random() * w, Math.random() * h, s, s); }
    g.strokeStyle = "rgba(20,15,10,.18)"; g.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - .5) * 90; y += (Math.random() - .5) * 90; g.lineTo(x, y); } g.stroke(); }
  });
}

// Stained glass: small panes of deep blue, ruby and gold held in black lead, a border, and in a roundel near the
// top a winged figure, the same story the temple tells.
function stainedGlass(seed) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return canvasTex(256, 512, (g, w, h) => {
    const blues = ["#0d2a7a", "#1a3c9c", "#122f86", "#2a52b8"], reds = ["#8a0f1c", "#a8182a", "#6e0c18"], golds = ["#d8a028", "#e8c050", "#b88420"], greens = ["#1d6a3a", "#2a7a4a"];
    g.fillStyle = "#0a0806"; g.fillRect(0, 0, w, h);
    // panes, jittered in a grid
    const cw = 15, ch = 19;
    for (let y = 0; y < h; y += ch) for (let x = 0; x < w; x += cw) {
      const edge = x < 30 || x > w - 56 || y > h - 40, pal = edge ? (rnd() < .5 ? reds : golds) : rnd() < .78 ? blues : rnd() < .5 ? reds : greens;
      g.fillStyle = pal[rnd() * pal.length | 0];
      const j = () => (rnd() - .5) * 5;
      g.beginPath(); g.moveTo(x + j(), y + j()); g.lineTo(x + cw + j(), y + j()); g.lineTo(x + cw + j(), y + ch + j()); g.lineTo(x + j(), y + ch + j()); g.closePath(); g.fill();
      g.strokeStyle = "#0a0806"; g.lineWidth = 2.2; g.stroke(); // (lead round every pane, following its own crooked edges)
    }
    // the roundel: gold ring, pale sky, a winged figure falling
    const cx = w / 2, cy = 150, r = 82;
    g.fillStyle = "#0a0806"; g.beginPath(); g.arc(cx, cy, r + 8, 0, 7); g.fill();
    g.fillStyle = golds[0]; g.beginPath(); g.arc(cx, cy, r + 4, 0, 7); g.fill();
    g.fillStyle = "#7aa8e0"; g.beginPath(); g.arc(cx, cy, r - 4, 0, 7); g.fill();
    g.fillStyle = "#f0d070"; g.beginPath(); g.arc(cx + 34, cy - 40, 16, 0, 7); g.fill(); // the sun he flew too near
    g.save(); g.translate(cx - 6, cy + 6); g.rotate(.7);
    g.fillStyle = "#e8dcc4"; // the wings
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(sd * 40, -46, sd * 62, -30); g.quadraticCurveTo(sd * 40, -12, sd * 8, 8); g.closePath(); g.fill(); }
    g.fillStyle = "#c08850"; g.beginPath(); g.ellipse(0, 10, 7, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, 36, 8, 0, 7); g.fill();
    g.restore();
    // lead between the panes, drawn over everything
    g.strokeStyle = "#0a0806"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r + 6, 0, 7); g.stroke();
  });
}

// The inside of the dome: rows of square coffers, each sunk in shadow with a gilt rosette, shrinking toward the top.
function coffers() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = "#cbbd9f"; g.fillRect(0, 0, w, h);
    const cols = 24, rows = 6;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = c / cols * w, y0 = r / rows * h * .86 + h * .14, cw = w / cols, ch = h * .86 / rows, m = cw * .12;
      g.fillStyle = "#8a7c64"; g.fillRect(x0 + m, y0 + m, cw - 2 * m, ch - 2 * m);
      g.fillStyle = "#5a4e3c"; g.fillRect(x0 + m * 2, y0 + m * 2, cw - 4 * m, ch - 4 * m);
      g.fillStyle = "#3a3024"; g.fillRect(x0 + m * 2.8, y0 + m * 2.8, cw - 5.6 * m, ch - 5.6 * m);
      g.fillStyle = "#c89a3a"; g.beginPath(); g.arc(x0 + cw / 2, y0 + ch / 2, Math.min(cw, ch) * .12, 0, 7); g.fill();
    }
    const cr = g.createLinearGradient(0, 0, 0, h * .16); cr.addColorStop(0, "#4a3e2e"); cr.addColorStop(1, "rgba(203,189,159,0)"); g.fillStyle = cr; g.fillRect(0, 0, w, h * .16); // (the crown of the dome, softly shadowed)
  });
}

// A starburst: the glare of one very bright light, as a camera lens sees it.
function starTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const cx = w / 2, cy = h / 2, gr = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.08, "rgba(255,250,235,.9)"); gr.addColorStop(.3, "rgba(255,230,190,.12)"); gr.addColorStop(1, "rgba(255,220,180,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2 + .1, L = (i % 2 ? .3 : .5) * w;
      const lg = g.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      lg.addColorStop(0, "rgba(255,250,240,.9)"); lg.addColorStop(1, "rgba(255,250,240,0)");
      g.strokeStyle = lg; g.lineWidth = i % 2 ? 1.5 : 2.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke();
    }
  });
}

// an arched window shape, w wide and h tall, its base at y = 0
function archShape(w, h) {
  const s = new THREE.Shape(), r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return s;
}

export function buildTemple(scene, {M, STEP, circles}) {
  const g = new THREE.Group(); scene.add(g);
  const TOP = STEP + 6.5, ENT = .9;               // the tops of the columns, the depth of the cornice above them
  // the platform and its columns, whole again
  const stylobate = new THREE.Mesh(new THREE.BoxGeometry(W, STEP, D), M.marble); stylobate.position.set(C.x, STEP / 2, C.z); g.add(stylobate);
  for (const [x, z] of COLS) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.5, .58, 6.5, 20), M.column); s.position.set(x, STEP + 3.25, z); s.castShadow = true; g.add(s);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, .28, 1.3), M.column); cap.position.set(x, TOP - .14, z); g.add(cap);
    circles.push([x, z, .7]);
  }
  // the cornice: a ring of beams on the columns
  for (const [x, z, sx, sz] of [[C.x, -4.3, W - .6, 1.1], [C.x, 12.3, W - .6, 1.1], [46, C.z, 1.1, D - 1.4], [66, C.z, 1.1, D - 1.4]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, ENT, sz), M.column); b.position.set(x, TOP + ENT / 2, z); b.castShadow = true; g.add(b);
  }
  // the dome: stone outside, coffered inside, a little flattened, resting on the cornice
  const domeY = TOP + ENT, domeGeo = new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const outer = new THREE.Mesh(domeGeo, M.column), inner = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({map: coffers(), side: THREE.BackSide, roughness: .85}));
  for (const m of [outer, inner]) { m.scale.set(W / 2 - .3, 5.2, D / 2 - .3); m.position.set(C.x, domeY, C.z); g.add(m); }
  outer.castShadow = true; inner.scale.multiplyScalar(.985);
  // a flat stone ceiling filling the corners between the square cornice and the round foot of the dome (open, the sky showed through)
  { const sh = new THREE.Shape(); sh.moveTo(-W / 2, -D / 2); sh.lineTo(W / 2, -D / 2); sh.lineTo(W / 2, D / 2); sh.lineTo(-W / 2, D / 2); sh.lineTo(-W / 2, -D / 2);
    const hole = new THREE.Path(); hole.absellipse(0, 0, W / 2 - .35, D / 2 - .35, 0, Math.PI * 2, true); sh.holes.push(hole);
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(sh, 48), M.column); ceil.material = M.column; ceil.rotation.x = Math.PI / 2; ceil.position.set(C.x, domeY - .02, C.z);
    const top = ceil.clone(); top.rotation.x = -Math.PI / 2; top.position.y = domeY + .02; g.add(ceil, top); }
  // the back wall, and its two windows between the columns, each over one of the stone chairs
  const wallMat = pbr("plastered_wall_02", {size: 3, tint: 0xcabca4});
  const wall = new THREE.Mesh(new THREE.BoxGeometry(W, TOP + ENT - STEP, .5), wallMat); wall.position.set(C.x, STEP + (TOP + ENT - STEP) / 2, -5.05); g.add(wall);
  const winGeo = new THREE.ShapeGeometry(archShape(2.4, 4.8), 24), frameGeo = new THREE.ShapeGeometry(archShape(2.9, 5.15), 24);
  { const uv = winGeo.attributes.position, uvs = new Float32Array(uv.count * 2); for (let i = 0; i < uv.count; i++) { uvs[i * 2] = uv.getX(i) / 2.4 + .5; uvs[i * 2 + 1] = uv.getY(i) / 4.8; } winGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2)); }
  [53.5, 58.5].forEach((x, i) => {
    const frame = new THREE.Mesh(frameGeo, M.column); frame.position.set(x, STEP + 1.5, -4.79); g.add(frame);
    const glass = new THREE.Mesh(winGeo, new THREE.MeshBasicMaterial({map: stainedGlass(7 + i * 31), color: new THREE.Color(1.3, 1.3, 1.3), fog: false}));
    glass.position.set(x, STEP + 1.68, -4.77); g.add(glass);
    const l = new THREE.PointLight(i ? 0xb03050 : 0x3a5cff, 5, 9, 1.6); l.position.set(x, STEP + 3.5, -3.6); g.add(l); // their colours thrown on the floor and the chairs
  });
  // the mosaic floor, polished
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - .8, D - .8), new THREE.MeshStandardMaterial({map: mosaic(), roughness: .32, metalness: 0}));
  floor.rotation.x = -Math.PI / 2; floor.position.set(C.x, STEP + .004, C.z); floor.receiveShadow = true; g.add(floor);
  // one brilliant light high in the dome, and its glare
  const hi = new THREE.Vector3(50.5, domeY + 1.6, -1.5);
  const lamp = new THREE.PointLight(0xfff0dc, 16, 22, 1.5); lamp.position.copy(hi); g.add(lamp);
  const star = new THREE.Sprite(new THREE.SpriteMaterial({map: starTex(), color: new THREE.Color(2.2, 2.1, 1.9), blending: THREE.AdditiveBlending, depthWrite: false, fog: false}));
  star.position.copy(hi); star.scale.setScalar(3.2); g.add(star);
  // a cold light from below on the figure, so the bronze reads against the dark dome
  const up = new THREE.SpotLight(0xcfe0ff, 30, 18, .5, .6, 1.2); up.position.set(60, STEP + .3, 9); up.target.position.set(58, STEP + 5.5, 3); g.add(up, up.target);
  return {group: g, top: domeY, addIcarus: A => addIcarus(g, A, domeY + 3.8, STEP)};
}

/* ---------- Icarus ---------- */

// one wing, built flat: the leading edge out along +x, the feathers trailing back along -z. Each feather is a long
// narrow blade folded a little along its shaft, laid in overlapping rows: long flight feathers fanning out toward
// the tip, shorter ones over them, small ones along the edge, every one a slightly different shade.
function wingGeometry() {
  const pos = [], col = [], idx = [], L = 3.2;
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const feather = (ox, oy, oz, ang, len, wid, shade) => {
    const dx = Math.sin(ang), dz = -Math.cos(ang), px = Math.cos(ang), pz = Math.sin(ang), b = pos.length / 3;
    const at = (t, side, lift) => { const w = wid * (side) * Math.sin(Math.PI * Math.min(1, .15 + t * .95)) * (1 - t * .55);
      pos.push(ox + dx * len * t + px * w, oy - .04 * len * t * t + lift, oz + dz * len * t + pz * w); };
    for (let k = 0; k <= 4; k++) { const t = k / 4; at(t, -.5, 0); at(t, 0, .012 * (1 - t)); at(t, .5, 0); } // three lines along it, the middle one raised: the shaft
    for (let k = 0; k < 15; k++) { const c = shade * (k % 3 === 1 ? 1.06 : .94); col.push(c, c * .97, c * .9); }
    for (let k = 0; k < 4; k++) { const r = b + k * 3; idx.push(r, r + 3, r + 1, r + 1, r + 3, r + 4, r + 1, r + 4, r + 2, r + 2, r + 4, r + 5); }
  };
  const N = 46;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), x = t * L, y = Math.sin(Math.PI * Math.min(1, t * 1.25)) * .22, fan = Math.pow(t, 1.6) * 1.15, j = () => (rnd() - .5) * .08;
    feather(x, y, 0, fan + j(), .85 + 1.6 * Math.pow(t, 1.4) + j(), .2, .82 + rnd() * .22);                 // flight feathers
    if (i % 1 === 0) feather(x + .03, y + .03, .04, fan * .85 + j(), .55 + .7 * t + j(), .19, .88 + rnd() * .2); // over them, shorter
    feather(x + .015, y + .06, .07, fan * .7 + j(), .28 + .3 * t, .16, .92 + rnd() * .16);                  // small ones along the edge
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// turn a bone so that it points from itself to its child along dir (given in the figure's own frame)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _w = new THREE.Quaternion();
function aim(fig, bone, child, dir) {
  if (!bone || !child) return;
  fig.updateMatrixWorld(true);
  const cur = child.getWorldPosition(_b).sub(bone.getWorldPosition(_a)).normalize(), want = dir.clone().normalize().transformDirection(fig.matrixWorld);
  _q.setFromUnitVectors(cur, want); bone.getWorldQuaternion(_w); bone.parent.getWorldQuaternion(_p);
  bone.quaternion.copy(_p.invert().multiply(_q.multiply(_w)));
}

function addIcarus(g, A, ceiling, STEP) {
  const src = A.toon_snow?.scene; if (!src) return null;
  const bronze = new THREE.MeshStandardMaterial({color: 0x3b2c20, metalness: .85, roughness: .36});
  const fig = SkeletonUtils.clone(src); const bones = {};
  fig.traverse(o => { if (o.isBone) bones[o.name] = o; if (o.isMesh) { o.material = bronze; o.castShadow = true; o.frustumCulled = false; } });
  const B = n => bones["Bip01_" + n];
  // the pose of a fall: arms flung out past the head, one leg straight, the other drawn up
  for (const [s, k] of [["L", 1], ["R", -1]]) {
    aim(fig, B(s + "_UpperArm"), B(s + "_Forearm"), new THREE.Vector3(k * .55, .75, -.25));
    aim(fig, B(s + "_Forearm"), B(s + "_Hand"), new THREE.Vector3(k * .35, .9, -.15));
  }
  aim(fig, B("R_Thigh"), B("R_Calf"), new THREE.Vector3(.05, -.6, .8));
  aim(fig, B("R_Calf"), B("R_Foot"), new THREE.Vector3(0, -.95, -.3));
  aim(fig, B("L_Thigh"), B("L_Calf"), new THREE.Vector3(-.05, -1, -.12));
  // the wings, from between the shoulder blades, swept back toward the feet
  fig.updateMatrixWorld(true);
  const back = B("Spine2") ? fig.worldToLocal(B("Spine2").getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 1.35, 0);
  const wingMat = new THREE.MeshStandardMaterial({color: 0xd2c4aa, vertexColors: true, roughness: .78, side: THREE.DoubleSide}), wgeo = wingGeometry();
  const wings = [];
  for (const k of [1, -1]) {
    const E = new THREE.Vector3(k * .62, -.55, -.56).normalize();                       // along the leading edge
    const T = new THREE.Vector3(0, 1, 0).addScaledVector(E, -E.y).normalize().negate();  // the feathers trail toward the head
    const Y = new THREE.Vector3().crossVectors(T, E).normalize();
    const w = new THREE.Mesh(wgeo, wingMat); w.matrixAutoUpdate = true;
    w.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, Y, T)); w.position.copy(back).add(new THREE.Vector3(k * .1, .08, -.14));
    w.castShadow = true; fig.add(w); wings.push(w);
  }
  // larger than life, head down, hanging over the middle of the floor
  const hold = new THREE.Group(); hold.add(fig); fig.scale.setScalar(1.55); fig.position.y = -1.05 * 1.55; // (turned about his hips, not his feet)
  hold.position.set(58.5, STEP + 4.7, 3.4); hold.rotation.set(Math.PI * .78, .5, .35); g.add(hold);
  hold.updateMatrixWorld(true);
  // cables: up from the wings and body to the dome, and slack ones down to the floor
  const pts = [], P = wgeo.attributes.position, v = new THREE.Vector3();
  const anchor = [];
  for (const w of wings) for (let i = 0; i < 14; i++) anchor.push(v.fromBufferAttribute(P, (Math.random() * P.count) | 0).applyMatrix4(w.matrixWorld).clone());
  for (const n of ["Pelvis", "Spine2", "L_Hand", "R_Hand", "L_Foot", "R_Foot", "Head"]) if (B(n)) anchor.push(B(n).getWorldPosition(new THREE.Vector3()));
  for (const a of anchor) {
    pts.push(a.x, a.y, a.z, a.x + (Math.random() - .5) * 2, ceiling, a.z + (Math.random() - .5) * 2);
    if (Math.random() < .55) { // a slack line to the floor, sagging
      const e = new THREE.Vector3(a.x + (Math.random() - .5) * 4, STEP + .01, a.z + (Math.random() - .5) * 4), sag = .4 + Math.random() * .8;
      let prev = a.clone();
      for (let s = 1; s <= 12; s++) { const t = s / 12, q = a.clone().lerp(e, t); q.y -= Math.sin(Math.PI * t) * sag * (1 - t * .3); pts.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q; }
    }
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({color: 0x0e0c0a, transparent: true, opacity: .85})));
  return hold;
}
