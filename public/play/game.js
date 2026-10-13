// THE COIN: the game. An open riverbank in the Underworld, built like an Italian loggia,
// with real people to talk to and something that can smell coins.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { Water } from "three/addons/objects/Water.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { makeHound, animateHound } from "./hound.js";
import { makeCastMember, oar, mount } from "./people.js";
import { buildFarBank, FAR } from "./farbank.js";
import { placeTrinkets, showFound, openCodex, save } from "./lore.js";
import { lyreInit } from "./music.js";
import { makeOrpheus } from "./orpheus.js";
import { sandstoneTunnel, sunrise } from "./cave.js";

const $ = s => document.querySelector(s);
const LIB = "../img/lib/";
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flat = v => V(v.x, 0, v.z);

/* ---------- the place ----------
   x runs along the river, z runs from the back wall of the arcade (0) down to the river (22+).
   The arcade:  x -36..36, z 0..8, columns along z = 8.
   The quay:    z 8..22.   The river starts at z = 22; you can wade to about z = 29.
   The dock:    x -1.4..1.4, z 22..35, Charon's boat at z ≈ 37.
   The temple:  centred on x = 56, z = 4. The dog's grotto: x ≈ 72, z ≈ 12.            */
const SHORE = 22, DEEP = 29;
const PLACES = {
  start: V(-31, 0, 4), hermes: V(-27, 0, 5.2), elpenor: V(-6, 0, 15.5),
  altar: V(56, 0, 9), chairs: V(56, 0, -1), dogHome: V(72, 0, 12), coinSpot: V(69.4, 0, 13.6), dock: V(0, 0, 35), boat: V(0, 0, 37.5)
};
const onDock = p => Math.abs(p.x) < 1.5 && p.z > SHORE - .5 && p.z < 36;
const inWater = p => p.z > SHORE && p.z < 40 && !onDock(p);
const onFarDock = p => Math.abs(p.x) < 1.5 && p.z > FAR.dockFrom && p.z < FAR.shore + .5;
let CH = 1; // which chapter is being played

/* ---------- renderer, camera, post-processing ---------- */
const canvas = $("#view");
// Phones, tablets and modest laptops get a lighter version so it stays smooth.
const LITE = matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4 || innerWidth * innerHeight * devicePixelRatio ** 2 > 6e6;
const renderer = new THREE.WebGLRenderer({canvas, antialias: !LITE, powerPreference: "high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15110d);
scene.fog = new THREE.FogExp2(0x1d1813, 0.021);
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 400);
camera.rotation.order = "YXZ"; scene.add(camera); // so things held in your hands can ride on it

// A painterly finish: soft brushy patches, warm old-pigment grade, vignette, grain.
const Painterly = {
  uniforms: {tDiffuse: {value: null}, time: {value: 0}, danger: {value: 0}, lite: {value: LITE ? 1 : 0}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float danger; uniform float lite; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 px = 1.0 / vec2(1600.0, 900.0);
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec3 acc = c; float w = 1.0;
      if (lite < .5) for (int i = 0; i < 6; i++) { float a = float(i) * 1.047; vec2 o = vec2(cos(a), sin(a)) * px * 2.2;
        vec3 s = texture2D(tDiffuse, vUv + o).rgb; float k = 1.0 - smoothstep(0.0, 0.25, distance(s, c)); acc += s * k; w += k; }
      c = acc / w;
      float l = dot(c, vec3(.299,.587,.114));
      c = mix(vec3(l), c, .82);
      c *= vec3(1.06, .98, .86);
      c = mix(c, c * vec3(1.25,.55,.45), danger * .35);
      float v = smoothstep(1.05, .35, distance(vUv, vec2(.5)));
      c *= mix(.42, 1.0, v);
      c += (h(vUv * 900. + time) - .5) * .035;
      gl_FragColor = vec4(c, 1.);
    }`
};
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const paint = new ShaderPass(Painterly); composer.addPass(paint);
composer.addPass(new OutputPass());
function resize() { renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

/* ---------- light ---------- */
const sky = new THREE.HemisphereLight(0x9fb3c8, 0x2a1d12, 0.55); scene.add(sky);
const moon = new THREE.DirectionalLight(0xbfd3ff, 0.9); moon.position.set(-40, 60, 80); scene.add(moon);
const torches = [];
function torch(x, y, z, power = 22) {
  const l = new THREE.PointLight(0xff9a4a, power, 18, 1.7); l.position.set(x, y, z); scene.add(l);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({color: 0xffc070}));
  flame.position.copy(l.position); scene.add(flame);
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(.05, .08, .7, 6), new THREE.MeshStandardMaterial({color: 0x2a2018, metalness: .6}));
  bracket.position.set(x, y - .45, z); scene.add(bracket);
  torches.push({l, base: power, seed: Math.random() * 100});
}

/* ---------- materials ---------- */
const loader = new THREE.TextureLoader();
const tex = (src, rep) => { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
function noise(base, vein, size = 512, veins = 22, alpha = .16) {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 20; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.strokeStyle = vein; g.globalAlpha = alpha;
  for (let v = 0; v < veins; v++) { g.lineWidth = Math.random() * 2 + .4; g.beginPath(); let x = Math.random() * size, y = Math.random() * size; g.moveTo(x, y); for (let k = 0; k < 9; k++) { x += (Math.random() - .5) * 120; y += (Math.random() - .5) * 120; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const marbleTex = noise("#d6cab4", "#6b5a49", 512, 30); marbleTex.repeat.set(30, 6);
const stoneTex = noise("#a69a86", "#4a3f33", 512, 12, .12); stoneTex.repeat.set(40, 40);
const plasterTex = noise("#c9b89a", "#6b5a49", 256, 4, .08);
const M = {
  marble: new THREE.MeshStandardMaterial({map: marbleTex, roughness: .42, metalness: .03}),
  stone: new THREE.MeshStandardMaterial({map: stoneTex, roughness: .92}),
  column: new THREE.MeshStandardMaterial({color: 0xe2d8c4, roughness: .55}),
  plaster: new THREE.MeshStandardMaterial({map: plasterTex, roughness: .9}),
  wood: new THREE.MeshStandardMaterial({color: 0x3a2a1c, roughness: .85}),
  dark: new THREE.MeshStandardMaterial({color: 0x1b1612, roughness: 1})
};

/* ---------- colliders ---------- */
const circles = [];   // [x, z, r]
const boxes = [];     // [x0, z0, x1, z1]
function solid(x, z, r = .35) {
  for (const [cx, cz, cr] of circles) if ((x - cx) ** 2 + (z - cz) ** 2 < (cr + r) ** 2) return true;
  for (const [x0, z0, x1, z1] of boxes) if (x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) return true;
  if (z > 40) { // the far bank
    if (onFarDock({x, z})) return z < FAR.dockFrom + 1.6;
    if (z < FAR.shore + .3) return true;
    return farWorld.bounds(x, z);
  }
  if (x < -38) return !(CH === 2 && z > 10.6 && z < 15.4 && x > -47); // the way up, open only to the living
  if (z < .4 || x > 82) return true;
  if (onDock({x, z})) return z > 36.2;   // you can walk the whole dock, right up to the boat
  if (z > DEEP) return true;
  return false;
}

/* ---------- the ground and the river ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), M.stone);
ground.rotation.x = -Math.PI / 2; ground.position.set(20, 0, -38); scene.add(ground);
const quay = new THREE.Mesh(new THREE.BoxGeometry(240, .5, .8), M.marble);
quay.position.set(20, -.2, SHORE); scene.add(quay);
const riverBed = new THREE.Mesh(new THREE.PlaneGeometry(240, 140), new THREE.MeshStandardMaterial({color: 0x0c0e0c, roughness: 1}));
riverBed.rotation.x = -Math.PI / 2; riverBed.position.set(20, -1.1, SHORE + 70); scene.add(riverBed);
// Ripples for the river: a tiling height field of overlapping waves, turned into a normal map.
const waterNormals = (() => {
  const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d"), img = g.createImageData(S, S), hgt = new Float32Array(S * S);
  const waves = Array.from({length: 14}, () => ({fx: Math.ceil(Math.random() * 6), fy: Math.ceil(Math.random() * 6) * (Math.random() < .5 ? -1 : 1), a: Math.random() * .8 + .2, p: Math.random() * 6.3}));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v = 0; for (const w of waves) v += w.a / (w.fx + Math.abs(w.fy)) * Math.sin((w.fx * x + w.fy * y) / S * Math.PI * 2 + w.p);
    hgt[y * S + x] = v;
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = hgt[y * S + (x + 1) % S] - hgt[y * S + (x - 1 + S) % S], dy = hgt[((y + 1) % S) * S + x] - hgt[((y - 1 + S) % S) * S + x];
    const n = new THREE.Vector3(-dx * 18, -dy * 18, 1).normalize(), i = (y * S + x) * 4;
    img.data[i] = (n.x * .5 + .5) * 255; img.data[i + 1] = (n.y * .5 + .5) * 255; img.data[i + 2] = (n.z * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
const water = new Water(new THREE.PlaneGeometry(240, 140), {
  textureWidth: LITE ? 256 : 512, textureHeight: LITE ? 256 : 512, waterNormals, sunDirection: moon.position.clone().normalize(),
  sunColor: 0xcfeeff, waterColor: 0x0c3a40, distortionScale: 2.4, fog: true
});
water.rotation.x = -Math.PI / 2; water.position.set(20, -.32, SHORE + 70); scene.add(water);
// The river glows from underneath like a lit cave river: bright turquoise along the bank, a lit rim
// where it meets the stone, darkening toward the far side. The ripples break the glow up.
water.material.uniforms.glow = {value: new THREE.Color(0x10b8dc)};
water.material.uniforms.deep = {value: new THREE.Color(0x06357a)};
water.material.fragmentShader = water.material.fragmentShader.replace("vec3 outgoingLight = albedo;", `
  float d = max(worldPosition.z - ${SHORE.toFixed(1)}, 0.0);
  float c = 0.0;
  for (int i = 0; i < 2; i++) {
    vec2 q = worldPosition.xz * (i == 0 ? 1.0 : 2.3) + float(i) * 7.0;
    float w = sin(q.x * 1.3 + time * .9 + 2.0 * sin(q.y * .9 + time * .6)) + sin(q.y * 1.7 - time * .7 + 2.0 * sin(q.x * .8 - time * .4));
    c += pow(1.0 - abs(w) * .5, 7.0) * (i == 0 ? .7 : .45);
  }
  float rip = clamp(.5 + (surfaceNormal.x + surfaceNormal.z) * 5.0, 0.0, 1.0) * .35 + c;
  float near = exp(-d / 10.0);
  vec3 tint = mix(deep, glow, near);
  float body = (.12 + .5 * near) * (.45 + rip);
  float rim = smoothstep(1.2, 0.0, d);
  vec3 outgoingLight = albedo * .35 + tint * body + vec3(.5, .95, 1.0) * rim * (.35 + .5 * rip);`).replace("uniform vec3 waterColor;", "uniform vec3 waterColor; uniform vec3 glow; uniform vec3 deep;");
// Light thrown up by the river onto the quay, the dock and anyone standing near the water.
for (const x of [-30, -6, 18, 42, 66]) { const l = new THREE.PointLight(0x2fd0e0, 6, 16, 1.6); l.position.set(x, .2, SHORE + 2.5); scene.add(l); }
const far = new THREE.Mesh(new THREE.PlaneGeometry(320, 90), new THREE.MeshBasicMaterial({map: tex(LIB + "styx/patinir-styx.jpg"), color: 0x6b6258, fog: false}));
far.position.set(20, 28, 150); far.rotation.y = Math.PI; scene.add(far);

/* ---------- the arcade: columns, arches, painted vaults ---------- */
const VAULTS = ["styx/last-judgment.jpg", "styx/giordano-charon.jpg", "styx/raphael-wedding-banquet.jpg", "styx/giordano-proserpina.jpg", "styx/signorelli-resurrection.jpg", "styx/brueghel-orpheus-pluto.jpg"];
const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(76, .3, 9), M.marble); floorSlab.position.set(0, -.14, 4); scene.add(floorSlab);
const back = new THREE.Mesh(new THREE.BoxGeometry(76, 9.5, .6), M.plaster); back.position.set(0, 4.75, -.3); scene.add(back);
boxes.push([-38, -1, 38, .3]);
for (let i = 0; i < 6; i++) {
  const xc = -36 + i * 12 + 6;
  // a flat coffered ceiling, with the painting set into it as a framed panel
  // (quadro riportato, the way the Farnese and Sistine ceilings do it), at its true proportions
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 8.6), new THREE.MeshStandardMaterial({map: plasterTex, roughness: .95, color: 0xcabba0}));
  ceiling.position.set(xc, 9.75, 4.1); scene.add(ceiling);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, 8.6), M.column); beam.position.set(xc - 6, 9.5, 4.1); scene.add(beam);
  const panel = new THREE.Group(); panel.position.set(xc, 9.58, 4.1); scene.add(panel);
  const pt = loader.load(LIB + VAULTS[i], t => {
    const maxW = 8.6, maxD = 5.6, a = t.image.width / t.image.height;
    let w = maxW, d = w / a; if (d > maxD) { d = maxD; w = d * a; }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .5, .18, d + .5), new THREE.MeshStandardMaterial({color: 0x8a6a36, metalness: .6, roughness: .35}));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({map: t, roughness: .85, color: 0xd8ccb8}));
    pic.rotation.x = Math.PI / 2; pic.position.y = -.1;
    panel.add(frame, pic);
  });
  pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
  torch(xc, 4.3, .5, 24);
}
const roof = new THREE.Mesh(new THREE.BoxGeometry(76, .5, 9.4), M.plaster); roof.position.set(0, 10.85, 4); scene.add(roof);
const capGeo = new THREE.BoxGeometry(1.25, .35, 1.25), shaftGeo = new THREE.CylinderGeometry(.42, .5, 6.1, 18), baseGeo = new THREE.BoxGeometry(1.2, .4, 1.2);
for (let x = -36; x <= 36; x += 6) {
  for (const z of [8, 0.6]) {
    if (z < 1 && x % 12 !== 0) continue;
    const g = new THREE.Group();
    const b = new THREE.Mesh(baseGeo, M.column); b.position.y = .2;
    const s = new THREE.Mesh(shaftGeo, M.column); s.position.y = 3.45;
    const c = new THREE.Mesh(capGeo, M.column); c.position.y = 6.55;
    g.add(b, s, c); g.position.set(x, 0, z); scene.add(g);
    if (z > 1) circles.push([x, z, .65]);
  }
  if (x < 36) { const arch = new THREE.Mesh(new THREE.TorusGeometry(3, .38, 8, 24, Math.PI), M.column); arch.position.set(x + 3, 6.7, 8); scene.add(arch); }
}
const cornice = new THREE.Mesh(new THREE.BoxGeometry(76, 1.2, 1.2), M.column); cornice.position.set(0, 10.2, 8.2); scene.add(cornice);
const WALL = ["styx/last-judgment-charon.jpg", "styx/rubens-orpheus.jpg", "styx/testa-aeneas-styx.jpg", "styx/titian-orpheus.jpg", "styx/raphael-psyche-vase.jpg", "styx/bernini-proserpina.jpg"];
WALL.forEach((src, i) => {
  const w = 4.2, h = 3.1;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .4, h + .4, .15), new THREE.MeshStandardMaterial({color: 0x6b5432, metalness: .55, roughness: .4}));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: tex(LIB + src), roughness: .8}));
  pic.position.z = .08; frame.add(pic); frame.position.set(-30 + i * 12, 3.4, .1); scene.add(frame);
});

/* ---------- benches, the dock, the boat ---------- */
function bench(x, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, .5, .9), M.marble); m.position.set(x, .25, z); scene.add(m); boxes.push([x - 1.6, z - .45, x + 1.6, z + .45]); }
bench(-6, 16); bench(14, 16); bench(-20, 16);
function brazier(x, z) {
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.45, .25, .4, 12), new THREE.MeshStandardMaterial({color: 0x3a2a1a, metalness: .6, roughness: .5}));
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 1.1, 6), bowl.material);
  stand.position.set(x, .55, z); bowl.position.set(x, 1.2, z); scene.add(stand, bowl);
  const coals = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 6), new THREE.MeshBasicMaterial({color: 0xff7a2a})); coals.scale.y = .35; coals.position.set(x, 1.38, z); scene.add(coals);
  const l = new THREE.PointLight(0xff8a3a, 26, 16, 1.6); l.position.set(x, 1.9, z); scene.add(l); torches.push({l, base: 26, seed: x});
  circles.push([x, z, .5]);
}
brazier(-9, 13.5); brazier(8, 19); brazier(-2.6, 21); brazier(2.6, 21); brazier(30, 13);
for (let z = SHORE - .5; z < 36; z += .55) { const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, .12, .5), M.wood); plank.position.set(0, .02, z); scene.add(plank); }
for (const z of [24, 28, 32, 35.5]) for (const x of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 2, 8), M.wood); post.position.set(x, -.2, z); scene.add(post); }
const boat = new THREE.Group();
const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, .7, 6), M.wood); hull.position.y = -.05;
const bow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 4), M.wood); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(0, -.05, 4); bow.scale.set(1, 1, .45);
boat.add(hull, bow); boat.position.copy(PLACES.boat).setY(-.05); scene.add(boat);
const lantern = new THREE.PointLight(0xffb060, 16, 14, 1.8); lantern.position.set(.8, 2.4, 36.5); scene.add(lantern);
torches.push({l: lantern, base: 16, seed: 3});
const glass = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({color: 0xffd08a})); glass.position.copy(lantern.position); scene.add(glass);
const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.6, 6), M.wood); pole.position.set(.8, 1.1, 36.5); scene.add(pole);

/* ---------- the temple, its two stone chairs, and the altar ---------- */
const stylobate = new THREE.Mesh(new THREE.BoxGeometry(22, .6, 18), M.marble); stylobate.position.set(56, .3, 4); scene.add(stylobate);
const STEP = .6;
const onTemple = p => p.x > 45 && p.x < 67 && p.z > -5 && p.z < 13;
[[46, -4], [46, 3], [46, 12], [66, -4], [66, 3], [66, 12], [51, -4.5], [56, -4.5], [61, -4.5], [51, 12.5], [61, 12.5]].forEach(([x, z], i) => {
  const h = [6.5, 4.2, 6.5, 2.8, 6.5, 5, 6.5, 3.4, 6.5, 6.5, 1.8][i];
  const s = new THREE.Mesh(new THREE.CylinderGeometry(.5, .58, h, 16), M.column); s.position.set(x, STEP + h / 2, z); scene.add(s);
  circles.push([x, z, .7]);
});
const altar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1), M.marble); altar.position.copy(PLACES.altar).setY(STEP + .55); scene.add(altar);
boxes.push([PLACES.altar.x - .8, PLACES.altar.z - .5, PLACES.altar.x + .8, PLACES.altar.z + .5]);
function stoneChair(x, z) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1, .5, 1), M.stone); seat.position.y = .25;
  const backr = new THREE.Mesh(new THREE.BoxGeometry(1, 1.3, .2), M.stone); backr.position.set(0, .9, -.4);
  g.add(seat, backr); g.position.set(x, STEP, z); scene.add(g);
  boxes.push([x - .5, z - .5, x + .5, z + .5]);
}
stoneChair(54.6, PLACES.chairs.z); stoneChair(57.4, PLACES.chairs.z);
torch(50, 3.2, 7, 18); torch(62, 3.2, 7, 18);
for (let i = 0; i < 14; i++) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 1.8, 0), M.dark);
  const a = Math.random() * Math.PI * 1.4 - .2, d = 3.5 + Math.random() * 2;
  r.position.set(PLACES.dogHome.x + Math.cos(a) * d, Math.random() * .8, PLACES.dogHome.z - Math.sin(a) * d * .8);
  r.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(r);
}
const lairGlow = new THREE.PointLight(0xff3a1a, 10, 12, 2); lairGlow.position.set(PLACES.dogHome.x, 1.2, PLACES.dogHome.z - 1); scene.add(lairGlow);

/* ---------- the way up: a sea cave of layered sandstone at the west end of the bank, opening on a sunrise ---------- */
{
  sandstoneTunnel(scene, {x0: -36.5, x1: -56, z: 13, r: 4.3});
  const view = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshBasicMaterial({map: sunrise(), fog: false}));
  view.position.set(-60, 5, 13); view.rotation.y = Math.PI / 2; scene.add(view);
  const sun = new THREE.PointLight(0xffa860, 46, 28, 1.3); sun.position.set(-52, 3.2, 13); scene.add(sun);
  const bounce = new THREE.PointLight(0xff7a3a, 14, 14, 1.6); bounce.position.set(-43, 1.4, 13); scene.add(bounce);
  // a rough face of rock around the mouth, so the cave sits in a cliff
  const rock = new THREE.MeshStandardMaterial({color: 0x3a2a20, roughness: .95});
  for (let i = 0; i < 16; i++) {
    const r = 1.6 + Math.random() * 2.4, a = i / 16 * Math.PI * 2, m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rock);
    m.position.set(-37.2 - Math.random(), 2.7 + Math.sin(a) * 5.2, 13 + Math.cos(a) * 5.6); m.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(m);
  }
}

/* ---------- the far bank (built in farbank.js) ---------- */
const nearLights = []; scene.traverse(o => { if (o.isPointLight) nearLights.push(o); });
const farLights = [];
const farWorld = buildFarBank({scene, boxes, circles, noise, tex, LIB, lights: farLights});
function setLightsFar(far) { nearLights.forEach(l => l.visible = !far); farLights.forEach(l => l.visible = far); sky.intensity = far ? .9 : .55; }

/* ---------- coins ---------- */
let coins = [];
function makeCoin(at, y = 1) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .03, 28), new THREE.MeshStandardMaterial({color: 0xe0b85a, metalness: .95, roughness: .22, emissive: 0x4a3208}));
  m.rotation.x = Math.PI / 2; m.position.set(at.x, y, at.z);
  m.add(new THREE.PointLight(0xffd27a, 4, 4, 2));
  scene.add(m); coins.push(m); return m;
}
makeCoin(PLACES.coinSpot, .14);
// the honey cake: an offering left on the altar, and the only thing the dog loves more than coins
let cake = null;
function placeCake() {
  if (cake) scene.remove(cake);
  cake = new THREE.Group();
  const bun = new THREE.Mesh(new THREE.CylinderGeometry(.2, .23, .12, 18), new THREE.MeshStandardMaterial({color: 0xb07a3a, roughness: .7}));
  const glaze = new THREE.Mesh(new THREE.CylinderGeometry(.19, .2, .03, 18), new THREE.MeshStandardMaterial({color: 0xe0a640, roughness: .25, metalness: .1, emissive: 0x3a2004}));
  glaze.position.y = .07; cake.add(bun, glaze); cake.add(new THREE.PointLight(0xffb050, 2.5, 3, 2));
  cake.position.set(PLACES.altar.x, STEP + 1.17, PLACES.altar.z); scene.add(cake);
}
placeCake();

/* ---------- people ---------- */
const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
// The realistic cast: Microsoft Rocketbox people (MIT licence), converted for the web, with motion-captured animation.
const REAL = ["hermes", "charon", "mikon", "orpheus", "elpenor", "theseus", "pirithous", "hades", "sisyphus", "persephone", "eurydice"];
const ASSETS = {}, CLIPS = {};
async function loadAssets(progress) {
  const list = ["head_male", "body_female", "hair_buns", "hair_beard", "hair_long", "hair_simpleparted", "hair_buzzed", "anims",
    ...REAL.map(n => "rb/" + n), "rb/anims_m", "rb/anims_f"];
  let done = 0;
  await Promise.all(list.map(async n => { ASSETS[n.replace("rb/", "rb_")] = await gltf.loadAsync(`assets/${n}.glb`); progress(++done / list.length); }));
  for (const a of ASSETS.anims.animations) CLIPS[a.name] = a;
}
const NPC = {};
function placePeople() {
  const cast = (id, opts) => makeCastMember(id, {ASSETS, CLIPS, scene, ...opts});
  NPC.hermes = Object.assign(cast("hermes"),
    {name: "Hermes", idle: "Idle_Loop", talk: "Idle_Talking_Loop", pos: PLACES.hermes.clone(), face: true});
  NPC.elpenor = Object.assign(cast("elpenor", {scale: .96, seated: true}),
    {name: "Elpenor", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(-6, 0, 16.05), yaw: Math.PI, seatY: .5});
  NPC.theseus = Object.assign(cast("theseus", {seated: true}),
    {name: "Theseus", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(54.6, 0, PLACES.chairs.z + .1), yaw: 0, seatY: STEP + .5});
  NPC.pirithous = Object.assign(cast("pirithous", {seated: true}),
    {name: "Pirithous", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(57.4, 0, PLACES.chairs.z + .1), yaw: 0, seatY: STEP + .5});
  NPC.charon = Object.assign(cast("charon", {scale: 1.08}),
    {name: "Charon", idle: "Idle_Torch_Loop", talk: "Idle_Talking_Loop", pos: V(0, 0, 37.2), yaw: Math.PI, seatY: .25, face: true});
  // Elpenor's oar, the one he asked to be buried with, leaning on the bench beside him.
  const o = oar(); o.position.set(-7.3, 1.05, 16.4); o.rotation.set(.12, 0, -.32); scene.add(o);
  for (const p of Object.values(NPC)) placeNPC(p);
}
function placeNPC(p) {
  p.root.position.set(p.pos.x, p.seatY || 0, p.pos.z);
  p.root.rotation.y = p.yaw ?? 0;
  p.play(p.idle, 0);
  if (!p.seatY || p === NPC.charon) circles.push([p.pos.x, p.pos.z, .5]);
}

/* ---------- Cerberus (built in hound.js) ---------- */
const hound = makeHound(scene);
const dog = {pos: PLACES.dogHome.clone(), yaw: Math.PI * .8, mode: "sleep", speed: 0, calmAt: 0, noiseUntil: 0, growl: 0};
function animateDog(dt, now) {
  const gait = (dog.mode === "sleep" || dog.mode === "drugged") ? "sleep" : dog.speed > 4 ? "run" : dog.speed > .3 ? "walk" : "idle";
  animateHound(hound, {mode: gait, speed: dog.speed, x: dog.pos.x, z: dog.pos.z, yaw: dog.yaw, hunting: dog.mode === "hunt"}, dt, now);
}

/* ---------- the player ---------- */
const me = {pos: PLACES.start.clone(), yaw: -Math.PI / 2, pitch: -.04, coin: false, caught: 0, splashed: 0, choices: {}, started: 0, met: {}, theseusCoin: true, stage: 0};
const keys = {};
let playing = false, talking = false, ended = false;

/* ---------- sound ---------- */
let actx, master;
const sound = {
  start() {
    if (actx) return; actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = .9; master.connect(actx.destination);
    [55, 82.4, 110].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.value = .022 / (i + 1); o.connect(g).connect(master); o.start(); });
    const b = actx.createBuffer(2, actx.sampleRate * 4, actx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
    const n = actx.createBufferSource(); n.buffer = b; n.loop = true;
    const f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 480; f.Q.value = .6;
    this.river = actx.createGain(); this.river.gain.value = .3; n.connect(f).connect(this.river).connect(master); n.start();
    const vsrc = actx.createMediaElementSource($("#voice"));
    this.voiceMeter = actx.createAnalyser(); this.voiceMeter.fftSize = 512; vsrc.connect(this.voiceMeter); this.voiceBuf = new Float32Array(512);
    const room = actx.createConvolver(), len = actx.sampleRate * 1.8, ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    room.buffer = ir; const wet = actx.createGain(); wet.gain.value = .16;
    vsrc.connect(master); vsrc.connect(room).connect(wet).connect(master);
  },
  noise(s) { const b = actx.createBuffer(1, actx.sampleRate * s, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const x = actx.createBufferSource(); x.buffer = b; return x; },
  env(node, peak, a, d, at) { const g = actx.createGain(); at = at ?? actx.currentTime; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(.0001, at + a + d); node.connect(g).connect(master); },
  // footsteps that sound like what you're walking on
  step(kind, vol = 1) {
    if (!actx) return; if (kind === true) kind = "water"; if (kind === false) kind = "stone";
    const n = this.noise(.16), f = actx.createBiquadFilter(), v = .85 + Math.random() * .3;
    const S = {water: ["bandpass", 1300, .25, .14], wood: ["bandpass", 520, .3, .07], marble: ["highpass", 1800, .1, .05], stone: ["lowpass", 380 + Math.random() * 120, .17, .09]}[kind] || ["lowpass", 360, .16, .1];
    f.type = S[0]; f.frequency.value = S[1]; f.Q.value = kind === "wood" ? 4 : 1; n.connect(f); this.env(f, S[2] * vol * v, .004, S[3]); n.start();
    if (kind === "wood") { const o = actx.createOscillator(); o.frequency.value = 140 + Math.random() * 30; this.env(o, .06 * vol, .002, .08); o.start(); o.stop(actx.currentTime + .1); }
  },
  breath() { if (!actx || Math.random() < .5) return; const n = this.noise(.5), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = .7; n.connect(f); this.env(f, .035, .12, .3); n.start(); },
  splash() { if (!actx) return; const n = this.noise(1.2), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, actx.currentTime); f.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 1); n.connect(f); this.env(f, .7, .02, .9); n.start(); },
  bark() { if (!actx) return; [0, .18, .36, .7].forEach((d, i) => { const at = actx.currentTime + d, o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(200 - i * 25, at); o.frequency.exponentialRampToValueAtTime(70, at + .2); const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; o.connect(f); this.env(f, .55, .01, .22, at); o.start(at); o.stop(at + .3); }); },
  growl(level) { if (!actx) return; const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 42 + Math.random() * 12; const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 150; o.connect(f); this.env(f, .55 * level, .08, .55); o.start(); o.stop(actx.currentTime + .7); },
  hit() { if (!actx) return; const o = actx.createOscillator(); o.frequency.setValueAtTime(120, actx.currentTime); o.frequency.exponentialRampToValueAtTime(26, actx.currentTime + 1); this.env(o, 1, .005, 1.1); o.start(); o.stop(actx.currentTime + 1.2); const n = this.noise(.6); this.env(n, .7, .002, .5); n.start(); },
  // how loud the voice is right now (0..1), for moving mouths
  voiceLevel() { if (!this.voiceMeter) return 0; this.voiceMeter.getFloatTimeDomainData(this.voiceBuf); let s = 0; for (const v of this.voiceBuf) s += v * v; return Math.sqrt(s / this.voiceBuf.length); },
  chime() { if (!actx) return; [784, 1175].forEach((fq, i) => { const at = actx.currentTime + i * .1, o = actx.createOscillator(); o.frequency.value = fq; this.env(o, .12, .005, 1.8, at); o.start(at); o.stop(at + 2); }); }
};

/* ---------- HUD ---------- */
let toastT;
function toast(msg, ms = 2800) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), ms); }
function paintStats() {
  const found = save.get().found.length;
  $("#stats").innerHTML = CH === 1 ? `caught by the dog: ${me.caught}<br>splashed: ${me.splashed}<br>found: ${found} of 12` : `caught by the dog: ${me.caught}<br>found: ${found} of 12`;
}
const GOALS = [
  {label: "Talk to Hermes, the man waiting in the arcade", at: () => NPC.hermes.pos},
  {label: "Find a coin. Ask the sailor sitting by the river", at: () => NPC.elpenor.pos},
  {label: "Get the honey cake from the altar in the old temple, at the far end of the arcade", at: () => PLACES.altar},
  {label: "Throw the honey cake to the dog. He sleeps in the cave past the temple", at: () => PLACES.dogHome},
  {label: "He's asleep. Take the coin from the cave, quickly", at: () => PLACES.coinSpot},
  {label: "Get the coin to the end of the dock, where Charon is. The river is safe", at: () => PLACES.dock}
];
function stageNow() {
  if (!me.met.hermes) return 0;
  if (me.coin) return 5;
  if (dog.mode === "drugged") return 4;
  if (me.cake) return 3;
  if (me.met.elpenor || me.met.theseus) return 2;
  return 1;
}
const goal = () => chap.goal();
function paintGoal() { const l = goal().label; $("#goal").innerHTML = `<small>what to do</small>${typeof l === "function" ? l() : l}`; }

/* ---------- conversations: spoken out loud, with the camera on whoever is talking ---------- */
const voiceEl = $("#voice");
let skipLine = null, choicePick = null, talkingTo = null;
const camShot = {active: false, pos: new THREE.Vector3(), look: new THREE.Vector3()};
function frameOn(p, side = 1) { // over-the-shoulder close-up
  const head = new THREE.Vector3(); (p.bones.Head || p.root).getWorldPosition(head);
  const toMe = flat(me.pos).sub(flat(p.root.position)).normalize();
  const right = V(toMe.z, 0, -toMe.x).multiplyScalar(side * .55);
  camShot.pos.copy(head).add(toMe.multiplyScalar(1.7)).add(right).setY(head.y + .05);
  camShot.look.copy(head).setY(head.y - .05);
  camShot.active = true;
}
// When someone mentions a place, the camera cuts to it, like a film.
const CUTS = {
  ferry:  {pos: V(4, 3, 28), look: V(0, 1.4, 37.5)},
  charon: {pos: V(1.2, 2.3, 33.6), look: V(0, 2.1, 37.2)},
  grotto: {pos: V(64, 3.2, 18), look: V(72, .6, 12)},
  altar:  {pos: V(56, 2.3, 13.2), look: V(56, 1.7, 9)},
  river:  {pos: V(-20, 3, 14), look: V(0, -.3, 40)},
  chairs: {pos: V(56, 2.2, 4.5), look: V(56, 1.3, -1)}
};
function cutTo(name) { const c = CUTS[name]; camShot.pos.copy(c.pos); camShot.look.copy(c.look); camShot.active = true; camShot.snap = true; }
async function line(who, id, text, cut) {
  const p = NPC[who], heard = cut === "voice"; // "voice": heard, not seen; the camera stays where it is
  $("#sub b").textContent = p ? p.name : chap.player;
  $("#sub span").textContent = text; $("#sub").classList.add("on");
  if (heard) {} else if (cut) cutTo(cut); else if (p) frameOn(p, 1); else if (talkingTo) frameOn(talkingTo, -1);
  if (p && !heard) p.play(p.talk);
  if (p) p.speaking = true;
  voiceEl.src = `voice/${id}.m4a`;
  const fallback = 900 + text.split(" ").length * 280;
  await new Promise(res => {
    let done = false;
    const fin = () => { if (done) return; done = true; voiceEl.onended = voiceEl.onerror = null; skipLine = null; res(); };
    voiceEl.onended = fin; voiceEl.onerror = () => setTimeout(fin, fallback);
    skipLine = () => { voiceEl.pause(); fin(); };
    voiceEl.play().catch(() => setTimeout(fin, fallback));
  });
  if (p && !heard) p.play(p.idle);
  if (p) p.speaking = false;
  $("#sub").classList.remove("on");
  await new Promise(r => setTimeout(r, 160));
}
function choose(options) {
  return new Promise(res => {
    const box = $("#choices");
    box.innerHTML = options.map((o, i) => `<button data-k="${i}"><i>${i + 1}</i>${o.t}</button>`).join("");
    box.classList.add("on");
    box.querySelectorAll("button").forEach(b => b.onclick = () => { box.classList.remove("on"); choicePick = null; res(+b.dataset.k); });
    choicePick = k => box.querySelector(`button[data-k="${k}"]`)?.click();
  });
}
const CARDS = {
  hermes: ["Hermes", "Guide of the dead. Always in a hurry."],
  elpenor: ["Elpenor", "Odysseus's youngest sailor. Fell off a roof."],
  theseus: ["Theseus and Pirithous", "Two heroes who came to kidnap the Queen of the Dead. Then they sat down."],
  charon: ["Charon", "Ferryman of the dead. One coin per crossing. No exceptions."]
};
function nameCard(id) {
  save.meet(id); if (id === "theseus") save.meet("theseus");
  if (me.met[id] || !CARDS[id]) return;
  const c = $("#namecard"); c.querySelector("b").textContent = CARDS[id][0]; c.querySelector("span").textContent = CARDS[id][1];
  c.classList.add("on"); setTimeout(() => c.classList.remove("on"), 4200);
}
function beginTalk(p, id) { talking = true; releaseMouse(); document.body.classList.add("talking"); talkingTo = p; $("#toast").classList.remove("on"); clearTimeout(toastT); nameCard(id); }
async function conversation(id) {
  beginTalk(NPC[id], id);
  const say = (who, lid, text, cut) => line(who, lid, text, cut);
  if (id === "hermes") {
    await say("hermes", "v2_h1", "There you are. Don't panic, everybody does the thing with the hands at first. You're dead, I'm afraid. I'm Hermes. Half my job is walking people down here, and the other half is explaining the rules, which is the half nobody listens to.");
    await say("mikon", "v2_m1", "An olive pit. I died of an olive pit. My cousin hadn't even cut the cake yet.");
    await say("hermes", "v2_h2", "Most people go out in less interesting ways, if it helps. Look past the columns. That's the River Styx, and the dock at the end of it is the only way across.", "ferry");
    await say("hermes", "v2_h3", "The ferryman's name is Charon. He's been rowing that boat since before there were cities, and he has exactly one rule. A coin for the crossing. Your family was meant to put one in your mouth. I'm told they were distracted.", "charon");
    await say("mikon", "v2_m2", "So I'm stuck here because my cousin's wedding ran long.");
    await say("hermes", "v2_h4", "For a hundred years, technically. That's what happens to anyone who can't pay. They wait on the bank and watch the boat leave without them. Unless, of course, they find a coin.");
    await say("hermes", "v2_h5", "Which brings me to the dog. Three heads, one temper. He sleeps in the cave past the old temple, and he can smell a coin through solid rock. If he ever comes after you, get into the river. He hates water even more than he hates people.", "grotto");
    await say("mikon", "v2_m3", "That's a lot of rules for one afternoon.");
    await say("hermes", "v2_h6", "And it's a lot of afternoon for one man. Ask around. The sailor down by the water has been here long enough to know where everything is. I'm afraid I have to go and collect a general who fell off his horse.", "river");
    me.stage = Math.max(me.stage, 1); hermesLeaves();
  } else if (id === "elpenor") {
    await say("elpenor", "v2_e1", "Oh, hello. Sorry, I don't get many people stopping, most of them walk straight past. Which, honestly, fair. I'm Elpenor. I rowed for Odysseus. Well, I rowed near Odysseus. There were a lot of us.");
    await say("mikon", "v2_m4", "Mikon. I choked on an olive pit at my cousin's wedding, if we're doing how we got here.");
    await say("elpenor", "v2_e2", "That's a good one. Mine's worse. We were staying at Circe's house, and I'd had too much wine, so I went up on the roof to sleep where it was cool. In the morning I heard everyone leaving, jumped up in a hurry, and forgot about the ladder.");
    const k = await choose([{t: "Ask about a coin"}, {t: "Promise to get him out"}, {t: "Say how sad that is"}]);
    me.choices.elpenor = [{Hermes: 2, Athena: 1}, {Demeter: 2, Hera: 1}, {Dionysus: 2, Apollo: 1}][k];
    if (k === 0) await say("mikon", "v2_m5", "I don't suppose you've seen a coin lying around anywhere?");
    if (k === 1) { await say("mikon", "v2_m6", "When I get across, I'll find a way to get you out of here too."); await say("elpenor", "v2_e5", "That's, um. Nobody's said anything like that to me before. Not even Odysseus, and he came all the way down here in person."); }
    if (k === 2) { await say("mikon", "v2_m7", "That might be the saddest thing I've ever heard."); await say("elpenor", "v2_e6", "Thank you. I tell it slightly differently at parties."); }
    await say("elpenor", "v2_e3", "There's one coin down here that nobody's spent. The dog sleeps on it, in his cave past the old temple, at the far end of the arcade. People have tried for it. Some nights you can hear how that went from here.", "grotto");
    await say("elpenor", "v2_e4", "You can't just walk in and pick it up. He'll smell it the second it moves. You'd have to put him to sleep first.");
    await say("elpenor", "v2_e7", "There's a honey cake on the altar in the temple. Somebody left it as an offering years ago, and it hasn't gone stale, because nothing does down here. No dog alive can say no to honey cake. Throw it close to him, and he'll be out like a lamp.", "altar");
    await say("elpenor", "v2_e8", "Then grab the coin and run for the river. He won't follow you into the water. And Mikon, if you make it across, tell Odysseus he still owes me a funeral.", "river");
  } else if (id === "theseus") {
    await say("theseus", "v2_t1", "Stop right there. Whatever you do, don't sit down.");
    await say("pirithous", "v2_p1", "He's serious. Look at us. This is what sitting down gets you.");
    await say("mikon", "v2_m8", "Are the two of you stuck to those chairs?");
    await say("theseus", "v2_t2", "Theseus, son of Aegeus, king of Athens, killer of the Minotaur. Currently attached to a rock.");
    await say("pirithous", "v2_p2", "And I'm Pirithous, king of the Lapiths, and this was my idea, which he will tell you about if you stay longer than a minute.");
    await say("theseus", "v2_t3", "We came down here to carry off the queen of the dead. Hades was very polite about it. He said we must be tired after such a long journey, and he offered us a seat.");
    await say("pirithous", "v2_p3", "And we sat. And that was four years ago.");
    const k = await choose([{t: "Ask about the dog"}, {t: "Pull them free"}, {t: "Leave them to it"}]);
    me.choices.theseus = [{Athena: 2, Hermes: 1}, {Artemis: 2, Hera: 1}, {Apollo: 2, Zeus: 1}][k];
    if (k === 0) { await say("theseus", "v2_t4", "Honey cake. Throw him one and he sleeps like a baby. Three babies, technically.", "altar"); await say("pirithous", "v2_p4", "The Sibyl did it, apparently, for that Trojan fellow. Everybody does it. Everybody except us. We just sat down."); }
    if (k === 1) { await say("mikon", "v2_m9", "Hold still. I'll pull on three. One, two..."); await say("pirithous", "v2_p5", "No, no, no, stop! It's fused, I'm part chair now, I can feel it in my spine!"); me.met.theseus = true; endTalk(); wakeDog("The screaming woke the dog. Hide in the river.", 10); return; }
    if (k === 2) { await say("mikon", "v2_m10", "You're heroes. You'll work something out."); await say("theseus", "v2_t5", "That's exactly what we said four years ago."); await say("pirithous", "v2_p6", "Guys? Guys, come back."); }
  } else if (id === "charon") {
    if (!me.coin) {
      await say("charon", "v2_c1", "Coin.");
      await say("mikon", "v2_m11", "I'm working on it. I don't suppose there's any chance of, you know, an I.O.U.?");
      await say("charon", "v2_c3", "A hundred years on the bank, or one coin in my hand. Those are the two ways onto this boat. There has never been a third.");
      endTalk(); sound.splash(); me.splashed++; paintStats(); toast("He flicks the water at you with his oar."); return;
    }
    await say("charon", "v2_c1", "Coin.");
    await say("mikon", "v2_m12", "I've got one. I've actually got one.");
    await say("charon", "v2_c4", "Then get in. Sit in the middle, keep your hands inside, and don't look at the water too long. Some of them look back.");
    await say("mikon", "v2_m13", "Wait. There's a kid on the bank. He hasn't got a coin either. He's been sitting there since before I arrived.");
    const k = await choose([{t: "Get in"}, {t: "Give the kid your coin"}, {t: "Stay on the bank"}]);
    me.choices.charon = [{Zeus: 1, Apollo: 1, Hephaestus: 1}, {Demeter: 2, Hera: 1}, {Poseidon: 2, Dionysus: 1, Hephaestus: 1}][k];
    if (k === 0) await say("mikon", "v2_m14", "Sorry, kid. I'll wave.");
    if (k === 1) { await say("charon", "v2_c5", "It doesn't work like that. One coin, one passenger."); await say("mikon", "v2_m15", "Then I'll wait with him. I've apparently got a hundred years to spare, and it turns out I'm good at waiting."); await say("charon", "v2_c6", "Both of you, then. Get in. If anybody asks, you paid."); }
    if (k === 2) await say("mikon", "v2_m16", "Actually, you know what? I've got a good spot now. I think I'll stay a while.");
    await say("mikon", "v2_m17", "Could be worse.");
    endTalk();
    return finish(["You crossed. It goes faster than you'd think.", "You both crossed. Charon will deny this.", "You stayed. You've got a rock. You've got a view."][k]);
  }
  me.met[id] = true;
  endTalk();
}
function endTalk() {
  talking = false; camShot.active = false; talkingTo = null;
  document.body.classList.remove("talking"); $("#sub").classList.remove("on"); $("#choices").classList.remove("on");
  paintGoal();
  if (playing && !ended) grabMouse();
}
addEventListener("keydown", e => { if (!talking) return; if (/^[123]$/.test(e.key) && choicePick) choicePick(+e.key - 1); else if ([" ", "Enter", "e", "E"].includes(e.key)) skipLine?.(); });
addEventListener("pointerdown", e => { if (talking && !e.target.closest("#choices")) skipLine?.(); });
$("#skipIntro")?.addEventListener("click", e => { e.stopPropagation(); skipIntro?.(); });

function hermesLeaves() {
  const h = NPC.hermes; h.leaving = true; h.play("Walk_Formal_Loop");
  const i = circles.findIndex(c => c[0] === h.pos.x && c[1] === h.pos.z); if (i >= 0) circles.splice(i, 1);
}

/* ---------- the coin and the dog ---------- */
function pickCoin(mesh) {
  if (mesh) { scene.remove(mesh); coins = coins.filter(c => c !== mesh); }
  me.coin = true; sound.chime(); paintGoal();
  $("#carry").classList.add("on");
  if (dog.mode === "drugged") toast("Got it. Run. When he wakes up, he'll smell it.");
  else wakeDog("He smelled the coin. RUN.");
}
function pickCake() {
  scene.remove(cake); cake = null; me.cake = true; sound.chime(); paintGoal();
  toast("A honey cake. Sticky. The dog will love it.");
}
function throwCake() {
  me.cake = false;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.2, .23, .14, 14), new THREE.MeshStandardMaterial({color: 0xc08a40, emissive: 0x3a2004}));
  const from = V(me.pos.x, 1.3, me.pos.z), to = V(dog.pos.x + 1.2, .3, dog.pos.z);
  c.position.copy(from); scene.add(c);
  const t0 = performance.now();
  (function fly() {
    const k = Math.min(1, (performance.now() - t0) / 700);
    c.position.lerpVectors(from, to, k); c.position.y += Math.sin(k * Math.PI) * 2; c.rotation.x += .3;
    if (k < 1) requestAnimationFrame(fly); else scene.remove(c);
  })();
  setTimeout(() => {
    dog.mode = "drugged"; dog.drugUntil = performance.now() + 25000; dog.noiseUntil = 0;
    toast("He ate it. He's out cold. You've got about 25 seconds."); paintGoal();
  }, 750);
}
function dropCoin() {
  if (!me.coin) return;
  me.coin = false; $("#carry").classList.remove("on");
  makeCoin(me.pos.clone().add(V(-Math.sin(me.yaw) * .9, 0, -Math.cos(me.yaw) * .9)), (onTemple(me.pos) ? STEP : 0) + .05);
  me.stage = 1; paintGoal();
  toast("You put the coin down. The dog loses interest.");
  dog.calmAt = performance.now() + 2500;
}
function wakeDog(msg, secs) {
  if (dog.mode === "drugged") return;
  if (secs) dog.noiseUntil = performance.now() + secs * 1000;
  if (dog.mode !== "hunt") { dog.mode = "hunt"; sound.bark(); toast(msg); }
}
function updateDog(dt, now) {
  if (dog.mode === "drugged") {
    dog.speed = 0;
    const left = Math.ceil((dog.drugUntil - now) / 1000);
    $("#carry").textContent = `The dog is asleep: ${Math.max(0, left)} seconds`; $("#carry").classList.add("on");
    if (now > dog.snore) { sound.growl(.25); dog.snore = now + 2600; }
    if (now < dog.drugUntil) { paint.uniforms.danger.value *= .9; $("#danger").classList.remove("on"); return; }
    dog.mode = "sleep"; $("#carry").textContent = "You're carrying a coin. Something can smell it."; $("#carry").classList.toggle("on", me.coin);
    if (me.coin) wakeDog("He's awake. And he smells the coin.");
    paintGoal();
  }
  const wanted = me.coin || now < dog.noiseUntil;
  if (dog.mode === "hunt" && !wanted && now > dog.calmAt) dog.mode = "home";
  let target = null, speed = 0;
  const safe = inWater(me.pos) || onDock(me.pos);
  if (dog.mode === "hunt") { target = safe ? V(me.pos.x, 0, SHORE - 1.2) : me.pos.clone(); speed = 6.2; }
  else if (dog.mode === "home") { target = PLACES.dogHome.clone(); speed = 3; if (flat(dog.pos).distanceTo(PLACES.dogHome) < .6) dog.mode = "sleep"; }
  dog.speed = 0;
  if (target) {
    const dir = flat(target).sub(flat(dog.pos)); const d = dir.length();
    if (d > .2) {
      dir.normalize();
      for (const [cx, cz, cr] of circles) { const away = V(dog.pos.x - cx, 0, dog.pos.z - cz), dd = away.length(); if (dd < cr + 2.2 && dd > .01) dir.add(away.normalize().multiplyScalar((cr + 2.2 - dd) * .9)); }
      dir.normalize();
      const step = Math.min(d, speed * dt);
      const nx = dog.pos.x + dir.x * step, nz = Math.min(SHORE - .8, dog.pos.z + dir.z * step);
      if (!boxes.some(([x0, z0, x1, z1]) => nx > x0 - .8 && nx < x1 + .8 && nz > z0 - .8 && nz < z1 + .8)) { dog.pos.x = nx; dog.pos.z = nz; }
      else { dog.pos.x += dir.z * step; dog.pos.z = Math.min(SHORE - .8, Math.max(1.5, dog.pos.z - dir.x * step)); }
      dog.speed = speed;
      const want = Math.atan2(dir.x, dir.z); let dy = want - dog.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); dog.yaw += dy * Math.min(1, dt * 6);
    }
  }
  const dist = flat(dog.pos).distanceTo(flat(me.pos));
  const danger = dog.mode === "hunt" ? Math.max(0, 1 - dist / 18) : 0;
  $("#danger").classList.toggle("on", danger > .15);
  paint.uniforms.danger.value += (danger - paint.uniforms.danger.value) * .1;
  if (dog.mode === "hunt" && now > dog.growl && dist < 22) { sound.growl(Math.max(.2, 1 - dist / 22)); dog.growl = now + 300 + dist * 55; }
  if (dog.mode === "hunt" && dist < 2 && !safe) caught();
}

async function caught() {
  if (!playing) return;
  playing = false; releaseMouse(); me.caught++; paintStats();
  const head = new THREE.Vector3(); hound.heads[1].head.getWorldPosition(head);
  camShot.pos.copy(head).add(flat(me.pos).sub(flat(dog.pos)).normalize().multiplyScalar(.9)).setY(head.y);
  camShot.look.copy(head); camShot.active = true;
  canvas.classList.add("caught"); sound.hit(); toast("Could be worse.", 2400);
  await new Promise(r => setTimeout(r, 2300));
  canvas.classList.remove("caught"); camShot.active = false;
  if (me.coin) { me.coin = false; $("#carry").classList.remove("on"); }
  coins.forEach(c => scene.remove(c)); coins = []; makeCoin(PLACES.coinSpot, .14);
  me.cake = false; placeCake();
  dog.pos.copy(PLACES.dogHome); dog.mode = "sleep"; dog.noiseUntil = 0;
  me.pos.copy(me.met.elpenor ? V(-6, 0, 12) : PLACES.start); me.yaw = -Math.PI / 2; me.pitch = -.04;
  paintGoal();
  playing = true; grabMouse();
}

/* ---------- the ending ---------- */
const GODS = {
  Zeus:{a:"The Sovereign", gift:"You make the call and own it.", shadow:"being in charge isn't the same as being close."},
  Hera:{a:"The Committed", gift:"You keep promises when it would be easier not to.", shadow:"when you're let down, you punish the wrong person."},
  Poseidon:{a:"The Deep Feeler", gift:"You feel things all the way down.", shadow:"grudges that surface as storms, years later."},
  Demeter:{a:"The Nurturer", gift:"You look after people without being asked.", shadow:"grief that freezes everything around it."},
  Athena:{a:"The Strategist", gift:"Cool head, whole board in view.", shadow:"you solve the feeling instead of having it."},
  Apollo:{a:"The Clarifier", gift:"Order, honesty, craft.", shadow:"admired more than known."},
  Artemis:{a:"The Independent", gift:"You protect people who can't protect themselves.", shadow:"contempt for weakness."},
  Ares:{a:"The Warrior", gift:"You act while others are still talking.", shadow:"you fight the fight instead of the problem."},
  Aphrodite:{a:"The Connector", gift:"People change around you.", shadow:"you move on fast and leave a mess."},
  Hephaestus:{a:"The Maker", gift:"You turn bad days into something that lasts.", shadow:"you hide in the workshop."},
  Hermes:{a:"The Messenger", gift:"Quick, funny, at home anywhere.", shadow:"slippery when the truth is inconvenient."},
  Dionysus:{a:"The Liberator", gift:"You loosen everyone up.", shadow:"you lose yourself along with the rules."}
};
function finish(text, {retry} = {}) {
  ended = true; playing = false; releaseMouse(); sound.chime(); document.body.classList.add("over");
  save.finish(CH);
  $("#retry").hidden = !retry;
  $("#retry").onclick = () => { $("#end").classList.remove("on"); document.body.classList.remove("over"); ended = false; retry(); };
  const score = Object.fromEntries(Object.keys(GODS).map(g => [g, 0]));
  Object.values(me.choices).forEach(g => Object.entries(g).forEach(([k, v]) => score[k] += v));
  if (me.caught === 0) score.Athena += 1; else if (me.caught > 2) score.Ares += 1;
  const patron = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
  const mins = Math.max(1, Math.round((performance.now() - me.started) / 60000));
  $("#endline").textContent = text;
  $("#end .portrait").src = `${LIB}gods/${patron.toLowerCase()}.jpg`;
  $("#end .god").textContent = patron;
  $("#end .arch").textContent = GODS[patron].a;
  $("#end .read").textContent = `${GODS[patron].gift} Watch out, though: ${GODS[patron].shadow} Could be worse.`;
  const found = `found ${save.get().found.length} of 12`;
  $("#end .score").textContent = CH === 1
    ? `${mins} minute${mins > 1 ? "s" : ""} · caught by the dog ${me.caught} time${me.caught === 1 ? "" : "s"} · splashed ${me.splashed} time${me.splashed === 1 ? "" : "s"} · ${found}`
    : `${mins} minute${mins > 1 ? "s" : ""} · caught by the dog ${me.caught} time${me.caught === 1 ? "" : "s"} · ${found}`;
  $("#end").classList.add("on");
}
$("#again").onclick = () => location.reload();

/* ---------- controls ---------- */
const touchMode = matchMedia("(pointer: coarse)").matches;
if (touchMode) $("#keys").innerHTML = "<b>Left thumb</b><span>walk</span><b>Right thumb</b><span>look</span><b>use</b><span>talk, pick up</span><b>drop</b><span>drop the coin</span>";
function grabMouse() { if (!touchMode && !talking && !ended) canvas.requestPointerLock?.(); }
function releaseMouse() { if (document.pointerLockElement) document.exitPointerLock(); }
document.addEventListener("pointerlockchange", () => { if (!document.pointerLockElement && playing && !talking && !ended && !touchMode && !$("#mapview").classList.contains("on") && !$("#codex").classList.contains("on") && !$("#perform").classList.contains("on")) $("#paused").classList.add("on"); });
$("#resume").onclick = () => { $("#paused").classList.remove("on"); grabMouse(); };
document.addEventListener("mousemove", e => { if (!document.pointerLockElement || !playing || talking) return; me.yaw -= e.movementX * .0022; me.pitch = Math.max(-1.45, Math.min(1.2, me.pitch - e.movementY * .0022)); });
addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "KeyC" && !talking && (playing || $("#codex").classList.contains("on"))) return toggleCodex();
  if (!playing || talking) return; if (e.code === "KeyE") interact(); if (e.code === "KeyQ" && CH === 1) dropCoin();
});
function toggleCodex(on) {
  const c = $("#codex"), show = on ?? !c.classList.contains("on");
  if (show) { openCodex(); releaseMouse(); } else { c.classList.remove("on"); if (playing && !talking) grabMouse(); }
}
$("#codexBtn").onclick = () => toggleCodex(true);
$("#codexOpen").onclick = () => toggleCodex(true);
$("#codex .close").onclick = () => toggleCodex(false);
addEventListener("keyup", e => { keys[e.code] = false; });
canvas.addEventListener("click", () => { if (playing && !talking) grabMouse(); });
const touch = {move: null, look: null, mx: 0, mz: 0};
if (touchMode) {
  $("#touch").classList.add("on");
  const knob = $(".knob");
  $("#touch").addEventListener("touchstart", e => { for (const t of e.changedTouches) { if (t.target.closest("button")) continue; if (t.clientX < innerWidth / 2 && !touch.move) touch.move = {id: t.identifier, x: t.clientX, y: t.clientY}; else if (!touch.look) touch.look = {id: t.identifier, x: t.clientX, y: t.clientY}; } }, {passive: true});
  $("#touch").addEventListener("touchmove", e => { for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { const dx = Math.max(-50, Math.min(50, t.clientX - touch.move.x)), dy = Math.max(-50, Math.min(50, t.clientY - touch.move.y)); touch.mx = dx / 50; touch.mz = dy / 50; knob.style.transform = `translate(${dx * .8}px,${dy * .8}px)`; }
    else if (touch.look && t.identifier === touch.look.id) { me.yaw -= (t.clientX - touch.look.x) * .006; me.pitch = Math.max(-1.45, Math.min(1.1, me.pitch - (t.clientY - touch.look.y) * .006)); touch.look.x = t.clientX; touch.look.y = t.clientY; } } }, {passive: true});
  const end = e => { for (const t of e.changedTouches) { if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.mx = touch.mz = 0; knob.style.transform = ""; } if (touch.look && t.identifier === touch.look.id) touch.look = null; } };
  $("#touch").addEventListener("touchend", end); $("#touch").addEventListener("touchcancel", end);
  $("#tE").onclick = () => playing && !talking && interact();
  $("#tQ").onclick = () => playing && !talking && dropCoin();
}

/* ---------- what's nearby ---------- */
function nearbyOne() {
  const near = (p, r) => flat(p).distanceTo(flat(me.pos)) < r;
  if (me.cake && dog.mode !== "drugged" && near(dog.pos, 8)) return {kind: "throw", label: "throw the honey cake to the dog"};
  for (const c of coins) if (flat(c.position).distanceTo(flat(me.pos)) < 1.8) return {kind: "coin", obj: c, label: "take the coin"};
  if (cake && near(PLACES.altar, 2.4)) return {kind: "cake", label: "take the honey cake"};
  if (!NPC.hermes.leaving && NPC.hermes.root.visible && near(NPC.hermes.pos, 3.2)) return {kind: "talk", id: "hermes", label: "talk to Hermes"};
  if (near(NPC.elpenor.pos, 3)) return {kind: "talk", id: "elpenor", label: "talk to Elpenor"};
  if (near(PLACES.chairs, 3.6)) return {kind: "talk", id: "theseus", label: "talk to Theseus and Pirithous"};
  if (near(NPC.charon.pos, 4.2)) return {kind: "talk", id: "charon", label: me.coin ? "give Charon the coin" : "talk to Charon"};
  return null;
}
// Whatever's in reach: a trinket first, then whatever the chapter has.
function nearby() {
  if (ride) return null;
  const t = trinkets?.near(me.pos.x, me.pos.z);
  if (t) return {kind: "trinket", obj: t, label: "pick it up"};
  return chap.nearby();
}
function interact() {
  const n = nearby(); if (!n) return;
  if (n.kind === "trinket") { trinkets.take(n.obj); sound.chime(); showFound(n.obj.t); paintStats(); clearTimeout(foundT); foundT = setTimeout(() => $("#found").classList.remove("on"), 12000); return; }
  if (CH !== 1) return chap.interact(n);
  if (n.kind === "coin") { if (me.coin) return toast("One coin is plenty."); pickCoin(n.obj); }
  else if (n.kind === "cake") pickCake();
  else if (n.kind === "throw") throwCake();
  else conversation(n.id);
}
let foundT;
$("#found").addEventListener("click", () => $("#found").classList.remove("on"));

/* ---------- the loop ---------- */
let last = performance.now(), stepT = 0, wasWet = false, greeted = false;
const fpPos = new THREE.Vector3();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (ride) rideBoat(now);
  if (playing && !talking && !ride) {
    let fx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.mx;
    let fz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + touch.mz;
    const len = Math.hypot(fx, fz);
    const wet = inWater(me.pos);
    if (len > .05) {
      fx /= Math.max(1, len); fz /= Math.max(1, len);
      const speed = (wet ? 2.1 : (keys.ShiftLeft || keys.ShiftRight ? 7 : 4.3)) * speedK;
      const s = Math.sin(me.yaw), c = Math.cos(me.yaw);
      const dx = (fx * c + fz * s) * speed * dt, dz = (-fx * s + fz * c) * speed * dt;
      if (!solid(me.pos.x + dx, me.pos.z)) me.pos.x += dx;
      if (!solid(me.pos.x, me.pos.z + dz)) me.pos.z += dz;
      else if (me.pos.z + dz > DEEP - .5) toast("Too deep. You can't swim either.", 1500);
      stepT -= dt; if (stepT <= 0) { sound.step(wet ? "water" : onDock(me.pos) || onFarDock(me.pos) ? "wood" : me.pos.z > FAR.hallZ ? "marble" : "stone"); if (speed > 5) sound.breath(); stepT = wet ? .7 : (speed > 5 ? .3 : .45); }
    }
    if (wet && !wasWet) { sound.splash(); me.splashed++; paintStats(); if (dog.mode === "hunt") toast("It won't follow you into the river."); }
    wasWet = wet;
    if (!greeted && NPC.hermes && flat(me.pos).distanceTo(NPC.hermes.pos) < 4.5) { greeted = true; chap.conversation("hermes"); }
    const n = nearby(), pr = $("#prompt");
    if (n && !(n.id === "hermes" && !greeted)) { pr.textContent = (touchMode ? "" : "E · ") + n.label; pr.classList.add("on"); } else pr.classList.remove("on");
    chap.update(dt, now);
  }
  chap.always?.(dt, now);
  trinkets?.animate(now);
  const h = NPC.hermes;
  if (h?.leaving) { h.root.position.x += dt * 1.6; h.root.position.z += dt * .9; h.root.rotation.y = Math.atan2(1.6, .9); if (h.root.position.z > SHORE - 2) { h.root.visible = false; h.leaving = false; } }
  const voiceLevelNow = sound.voiceLevel ? sound.voiceLevel() : 0;
  for (const p of Object.values(NPC)) {
    p.mixer.update(dt);
    p.expr?.update(now, p.speaking, voiceLevelNow);
    if (p.face && !p.leaving && p.root.visible && flat(me.pos).distanceTo(flat(p.root.position)) < 9) {
      const want = Math.atan2(me.pos.x - p.root.position.x, me.pos.z - p.root.position.z); let d = want - p.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.root.rotation.y += d * Math.min(1, dt * 3);
    }
  }
  animateDog(dt, now);
  // camera: first person, or a close-up during conversations
  fpPos.set(me.pos.x, ride ? 1.95 : inWater(me.pos) ? 1.12 : (onTemple(me.pos) ? STEP : 0) + 1.62, me.pos.z);
  moveBody(dt);
  // looking down, your head tips forward and you can see yourself: chest, hem, sandals
  const lean = Math.max(0, -me.pitch - .35) * .32;
  fpPos.x -= Math.sin(me.yaw) * lean; fpPos.z -= Math.cos(me.yaw) * lean; fpPos.y -= lean * .35;
  if (camShot.active) {
    if (camShot.snap) { camera.position.copy(camShot.pos); camera.lookAt(camShot.look); camShot.snap = false; }
    camera.position.lerp(camShot.pos, .12);
    const m = new THREE.Matrix4().lookAt(camera.position, camShot.look, V(0, 1, 0));
    camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m), .15);
  } else {
    const far = camera.position.distanceTo(fpPos) > .3;
    camera.position.lerp(fpPos, far ? .12 : 1);
    camera.position.y += Math.sin(bob * 2) * .028; camera.position.x += Math.cos(bob) * .012 * Math.cos(me.yaw);
    camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(me.pitch, me.yaw, Math.sin(bob) * .006, "YXZ")), far ? .15 : 1);
  }
  if (playing && NPC.hermes) {
    const g = goal().at(), d = flat(g).sub(flat(me.pos)); const ang = Math.atan2(-d.x, -d.z) - me.yaw;
    $(".compass .arrow").style.transform = `rotate(${-ang}rad)`;
    $("#compassText").textContent = `${Math.round(d.length())} m`;
  }
  farWorld.animate(now);
  for (const l of farWorld.flicker) l.intensity = 30 * (.82 + Math.sin(now / 90 + l.position.x) * .07 + Math.random() * .1);
  for (const t of torches) t.l.intensity = t.base * (.82 + Math.sin(now / 90 + t.seed) * .07 + Math.random() * .1);
  coins.forEach(c => c.rotation.z = now / 600);
  boat.position.y = -.05 + Math.sin(now / 1100) * .05; boat.rotation.z = Math.sin(now / 1500) * .02;
  // the gate swings a little wider once the dog is asleep
  for (const [i, d] of farWorld.doors.entries()) d.rotation.y += ((i ? 1 : -1) * (dog.asleep ? 1.25 : .35) - d.rotation.y) * .02;
  if (NPC.charon) NPC.charon.root.position.y = .25 + Math.sin(now / 1100) * .05;
  water.material.uniforms.time.value += dt * .45;
  paint.uniforms.time.value = now / 1000;
  if (sound.river) sound.river.gain.value = .2 + Math.max(0, 1.2 - Math.abs(me.pos.z - SHORE) / 14);
  composer.render();
  requestAnimationFrame(tick);
}

/* ---------- start ---------- */
(async () => {
  camera.position.set(me.pos.x, 1.62, me.pos.z); camera.rotation.set(me.pitch, me.yaw, 0);
  requestAnimationFrame(tick);
  try {
    await loadAssets(f => $("#loading").textContent = `Loading the Underworld… ${Math.round(f * 100)}%`);
    placePeople();
    trinkets = placeTrinkets(scene);
    $("#loading").textContent = ""; $("#go").disabled = false;
  } catch (e) { console.error(e); $("#loading").textContent = "Something didn't load. Try refreshing."; }
  paintGoal(); paintStats();
})();
/* ---------- the map: an old chart of the riverbank, drawn in code ---------- */
function drawMap(cv) {
  const g = cv.getContext("2d"), W = cv.width, H = cv.height;
  // world x -40..84 → map; world z -8..40 → map (river at the bottom)
  const X = x => (x + 40) / 124 * W, Y = z => (z + 8) / 48 * H;
  g.fillStyle = "#e6d8b8"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,70,45,${Math.random() * .05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  // the river
  g.fillStyle = "rgba(30,150,185,.55)"; g.fillRect(0, Y(SHORE), W, H - Y(SHORE));
  g.strokeStyle = "rgba(40,60,70,.5)"; g.lineWidth = 2;
  for (let k = 0; k < 7; k++) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, Y(SHORE + 2.5 + k * 2.4) + Math.sin(x / 40 + k) * 4); g.stroke(); }
  g.strokeStyle = "#5a4630"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, Y(SHORE)); g.lineTo(W, Y(SHORE)); g.stroke();
  const ink = "#3a2a1c", label = (t, x, y, size = 26, it = false, color = ink) => { g.fillStyle = color; g.font = `${it ? "italic " : ""}${size}px "IM Fell English", Georgia, serif`; g.textAlign = "center"; g.fillText(t, x, y); };
  // the arcade
  g.fillStyle = "rgba(120,95,60,.18)"; g.fillRect(X(-37), Y(0), X(37) - X(-37), Y(8.5) - Y(0));
  g.strokeStyle = ink; g.lineWidth = 2.5; g.strokeRect(X(-37), Y(0), X(37) - X(-37), Y(8.5) - Y(0));
  g.fillStyle = ink; for (let x = -36; x <= 36; x += 6) { g.beginPath(); g.arc(X(x), Y(8), 5, 0, 7); g.fill(); }
  label("THE ARCADE", X(0), Y(4.8), 28);
  // the dock and the ferry
  g.fillStyle = "#6b4e2e"; g.fillRect(X(-1.5), Y(SHORE - .5), X(1.5) - X(-1.5), Y(36) - Y(SHORE - .5));
  g.beginPath(); g.ellipse(X(0), Y(37.8), 18, 34, 0, 0, 7); g.fill();
  label("Charon's ferry", X(0) + 120, Y(36.5), 26, true);
  // the temple and the dog's cave
  g.strokeStyle = ink; g.strokeRect(X(45), Y(-5), X(67) - X(45), Y(13) - Y(-5));
  for (const [x, z] of [[46, -4], [46, 3], [46, 12], [66, -4], [66, 3], [66, 12], [51, -4.5], [56, -4.5], [61, -4.5], [51, 12.5], [61, 12.5]]) { g.beginPath(); g.arc(X(x), Y(z), 5, 0, 7); g.fill(); }
  label("THE OLD TEMPLE", X(56), Y(-1.8), 24);
  g.fillStyle = "#c08a40"; g.beginPath(); g.arc(X(PLACES.altar.x), Y(PLACES.altar.z), 9, 0, 7); g.fill();
  label("a honey cake, on the altar", X(56), Y(11.4), 20, true);
  g.fillStyle = "rgba(40,25,20,.75)"; g.beginPath(); g.ellipse(X(72.5), Y(12), 42, 30, 0, 0, 7); g.fill();
  label("the dog sleeps here,", X(72.5), Y(18.2), 21, true, "#7a2414");
  label("on the only coin", X(72.5), Y(20.4), 21, true, "#7a2414");
  g.fillStyle = "#b8862a"; g.beginPath(); g.arc(X(PLACES.coinSpot.x), Y(PLACES.coinSpot.z), 8, 0, 7); g.fill();
  // people
  const who = (x, z, t) => { g.fillStyle = "#2a3a5e"; g.beginPath(); g.arc(X(x), Y(z), 7, 0, 7); g.fill(); label(t, X(x), Y(z) - 14, 19, true, "#2a3a5e"); };
  if (NPC.hermes?.root.visible) who(NPC.hermes.pos.x, NPC.hermes.pos.z, "Hermes");
  who(-6, 16, "Elpenor");
  who(56, -1, "Theseus & Pirithous");
  label("THE RIVER STYX", X(30), Y(31), 30, false, "#2c4450");
  label("the river is safe: the dog can't swim", X(30), Y(34.5), 20, true, "#2c4450");
  // you
  const mx = X(me.pos.x), my = Y(me.pos.z);
  g.fillStyle = "#a2432c"; g.beginPath(); g.arc(mx, my, 10, 0, 7); g.fill();
  g.strokeStyle = "#a2432c"; g.lineWidth = 4; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx - Math.sin(me.yaw) * 28, my - Math.cos(me.yaw) * 28); g.stroke();
  label("you", mx, my + 32, 22, true, "#a2432c");
  // where to go next
  if (playing || me.stage === 0) { const goalAt = goal().at(); g.strokeStyle = "#b8862a"; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(mx, my); g.lineTo(X(goalAt.x), Y(goalAt.z)); g.stroke(); g.setLineDash([]); }
  g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
}
function toggleMap(on) {
  const v = $("#mapview"), show = on ?? !v.classList.contains("on");
  if (show) { chap.drawMap($("#map2")); v.classList.add("on"); releaseMouse(); }
  else { v.classList.remove("on"); if (playing && !talking) grabMouse(); }
}
addEventListener("keydown", e => { if (e.code === "KeyM" && (playing || $("#mapview").classList.contains("on")) && !talking) toggleMap(); });
$("#mapview").addEventListener("click", () => toggleMap(false));
$("#mapBtn").onclick = () => playing && !talking && toggleMap(true);

$("#go").onclick = () => {
  sound.start(); actx.resume(); if (!lyreReady) { lyreInit(actx, master); lyreReady = true; }
  $("#start").classList.remove("on");
  document.fonts.ready.then(() => chap.drawMap($("#map1")));
  $("#howto").classList.add("on");
};
let lyreReady = false;
function rotateHint() { $("#rotate").classList.toggle("on", matchMedia("(pointer: coarse)").matches && innerHeight > innerWidth && playing && !ended); }
addEventListener("resize", rotateHint);
$("#rotate").addEventListener("click", () => $("#rotate").classList.add("dismissed"));
// Each chapter opens like a film: the camera moves through the place while the person you're about to play talks.
const INTROS = {1: {title: ["Chapter I", "The Coin"], shots: [{"from": [25, 6, 44, 0, 1.2, 37.5], "to": [11, 4, 31, 0, 1.4, 37.5], "id": "v2_i1", "who": "mikon", "text": "My name is Mikon. I sold salt fish in the agora at Corinth for twenty-two years, and I was, by every account, fine at it."}, {"from": [-30, 2.4, 4, 30, 2.2, 4], "to": [-12, 2.2, 4, 30, 2.2, 4], "id": "v2_i2", "who": "mikon", "text": "Last spring, at my cousin's wedding, I laughed at the wrong moment with an olive in my mouth. That's the whole story. There isn't a better version of it."}, {"from": [50, 3.2, 15, 56, 1.6, 6], "to": [54.5, 2.3, 11, 56, 1.7, 8.6], "id": "v2_i3", "who": "mikon", "text": "Nobody put a coin under my tongue for the ferryman. They were busy. It was a wedding, and the lamb was getting cold."}, {"from": [62, 2.8, 21, 72, 0.8, 12], "to": [66.5, 1.8, 17, 72, 0.6, 12], "id": "v2_i4", "who": "mikon", "text": "So this is where I am now. The bank of the River Styx, a ferry I can't afford, a dog that can smell money, and a hundred years to think about olives."}, {"from": [-1, 1.9, 23, -6, 1.2, 16], "to": [-3.5, 1.6, 19.5, -6, 1.1, 16], "id": "v2_i5", "who": "mikon", "text": "Everyone you've ever heard of came through here. Heroes, kings, a man with a lyre. Nobody wrote down the people who were already waiting."}, {"from": [-36, 1.75, 7, -20, 1.6, 4], "to": [-34, 1.7, 5.5, -20, 1.6, 4], "id": "v2_i6", "who": "mikon", "text": "This is the story of one of them."}]},
  2: {title: ["Chapter II", "The Lyre"], far: [2, 3, 4], shots: [{"from": [-53, 2.2, 13, -36, 1.5, 13], "to": [-44, 1.9, 13, -30, 1.5, 13], "id": "v2_j1", "who": "orpheus", "text": "They say I could make rivers stop to listen. I never tried. I only ever wanted one person to listen, and she always did."}, {"from": [-20, 1.8, 18, -6, 1.1, 16], "to": [-12, 1.7, 17, -6, 1.2, 16], "id": "v2_j2", "who": "orpheus", "text": "Eurydice. We were married in the spring. That same afternoon she ran through the long grass by the river, laughing, and a snake was waiting in it."}, {"from": [0, 5, 30, 0, 3, 80], "to": [0, 4, 42, 0, 3, 80], "id": "v2_j3", "who": "orpheus", "text": "I sang at her funeral. Every bird in Thrace went quiet. It didn't help."}, {"from": [-6, 2.4, 96, 6, 1, 108], "to": [-2, 2.2, 101, 6, 1, 110], "id": "v2_j4", "who": "orpheus", "text": "So I took the old road down at Taenarum, where the cliffs go into the sea, and I kept walking until the light ran out."}, {"from": [0, 3.2, 119, 0, 2, 137.4], "to": [0, 2.4, 128, 0, 2, 137.4], "id": "v2_j5", "who": "orpheus", "text": "Nobody comes back from the Underworld. Everybody says so. But as far as I know, nobody has ever asked properly."}, {"from": [-36, 1.75, 7, -20, 1.6, 4], "to": [-34, 1.7, 5.5, -20, 1.6, 4], "id": "v2_j6", "who": "orpheus", "text": "I'm going to ask."}]}};
let skipIntro = null;
async function playIntro(n) {
  const I = INTROS[n]; if (!I) return;
  talking = true; document.body.classList.add("talking", "cinema");
  let skipped = false; skipIntro = () => { skipped = true; skipLine?.(); };
  for (const [k, sh] of I.shots.entries()) {
    if (skipped) break;
    setLightsFar(!!I.far?.includes(k));
    const t0 = performance.now(), est = 2200 + sh.text.split(" ").length * 360, A = V(...sh.from.slice(0, 3)), AL = V(...sh.from.slice(3)), B = V(...sh.to.slice(0, 3)), BL = V(...sh.to.slice(3));
    camShot.active = true; camShot.snap = true; camShot.pos.copy(A); camShot.look.copy(AL);
    let moving = true;
    (function drift() { if (!moving) return; const u = Math.min(1, (performance.now() - t0) / est), e = u * u * (3 - 2 * u); camShot.pos.lerpVectors(A, B, e); camShot.look.lerpVectors(AL, BL, e); requestAnimationFrame(drift); })();
    $(".cine").classList.add("on");
    await line(sh.who, sh.id, sh.text, "voice");
    moving = false;
  }
  setLightsFar(false);
  // the title card
  const card = $("#titlecard"); card.querySelector("small").textContent = I.title[0]; card.querySelector("b").textContent = I.title[1];
  card.classList.add("on"); await new Promise(r => setTimeout(r, skipped ? 900 : 2600)); card.classList.remove("on");
  $(".cine").classList.remove("on");
  document.body.classList.remove("talking", "cinema"); camShot.active = false; talking = false; skipIntro = null;
}
addEventListener("keydown", e => { if (skipIntro && (e.key === "Escape" || e.key === "Enter")) skipIntro(); });
$("#begin").onclick = async () => {
  if (CH !== 1 && !chap.ready) { chap.setup(); chap.ready = true; }
  if (!PLAYER) { PLAYER = G.cast(CH === 2 ? "orpheus" : "mikon"); PLAYER.play("Idle_Loop", 0); PLAYER.setHead(false); chap.onBody?.(PLAYER); }
  setTimeout(rotateHint, 50);
  $("#howto").classList.remove("on"); $("#bg").remove(); $("#mapBtn").hidden = false;
  if (!new URLSearchParams(location.search).has("nointro")) await playIntro(CH);
  playing = true; me.started = performance.now();
  grabMouse();
  setTimeout(() => { if (!talking) toast("Hermes is waiting for you, just ahead."); }, 700);
};


/* ---------- chapters ---------- */
const chapterOne = {
  id: 1, player: "Mikon", rule: "The dog can smell coins.", goal: () => GOALS[stageNow()], conversation, nearby: nearbyOne, update: updateDog, drawMap,
  interact() {}, setup() {}
};
let chap = chapterOne, speedK = 1, ride = null, trinkets = null, PLAYER = null;
// You can see yourself: in the river, the whole of you; looking down, your own body and feet.
{
  const before = water.onBeforeRender;
  water.onBeforeRender = function (...a) { PLAYER?.setHead(true); before.apply(this, a); PLAYER?.setHead(camShot.active); };
}
const bodyPrev = new THREE.Vector3();
let bob = 0;
function moveBody(dt) {
  if (!PLAYER) return;
  const moved = flat(me.pos).distanceTo(flat(bodyPrev)) / Math.max(dt, 1e-3); bodyPrev.copy(me.pos);
  const f = V(-Math.sin(me.yaw), 0, -Math.cos(me.yaw));
  PLAYER.root.position.set(me.pos.x - f.x * .02, fpPos.y - 1.66, me.pos.z - f.z * .02);
  PLAYER.root.rotation.y = me.yaw + Math.PI;
  const back = (keys.KeyS || keys.ArrowDown) && !(keys.KeyW || keys.ArrowUp);
  const clip = ride || talking ? "Idle_Loop" : moved > 5 ? "Jog_Fwd_Loop" : moved > .4 ? "Walk_Loop" : "Idle_Loop";
  PLAYER.play(clip, .25);
  if (PLAYER.action) PLAYER.action.timeScale = back ? -1 : clip === "Walk_Loop" ? Math.min(1.4, moved / 3.2) : 1;
  PLAYER.mixer.update(dt);
  PLAYER.setHead(camShot.active);
  bob = moved > .4 && !ride ? bob + dt * moved * 2.1 : bob * .9;
}

// The ferry: Charon poles you across; you can look around but not walk. Lights swap halfway over.
function boatTo(far) {
  boat.position.z = far ? FAR.boatStop : PLACES.boat.z; boat.rotation.y = far ? 0 : Math.PI;
  const dir = far ? 1 : -1, z = boat.position.z - dir * 2.3;
  NPC.charon.root.position.set(0, .25, z); NPC.charon.pos.set(0, 0, z);
}
function crossRiver(toFar, {eury, during} = {}) {
  return new Promise(res => {
    ride = {t0: performance.now(), dur: 12500, from: toFar ? PLACES.boat.z : FAR.boatStop, to: toFar ? FAR.boatStop : PLACES.boat.z, dir: toFar ? 1 : -1, eury, res};
    boat.rotation.y = toFar ? 0 : Math.PI;
    me.yaw = toFar ? Math.PI : 0; me.pitch = -.05;
    chap.onRide?.(true); $("#prompt").classList.remove("on");
    sound.splash();
    during?.();
  });
}
function rideBoat(now) {
  const r = ride, k = Math.min(1, (now - r.t0) / r.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const z = r.from + (r.to - r.from) * e;
  boat.position.z = z;
  me.pos.set(0, 0, z + r.dir * 1.7);
  NPC.charon.root.position.set(0, .25, z - r.dir * 2.3); NPC.charon.root.rotation.y = r.dir > 0 ? 0 : Math.PI;
  if (r.eury) { r.eury.root.position.set(0, .22, z - r.dir * .3); r.eury.root.rotation.y = r.dir > 0 ? 0 : Math.PI; }
  if (k > .5 && !r.swapped) { r.swapped = true; setLightsFar(r.dir > 0); }
  if (k >= 1) {
    ride = null; boatTo(r.dir > 0);
    me.pos.set(0, 0, r.dir > 0 ? FAR.dockFrom + 2.2 : 35); me.yaw = r.dir > 0 ? Math.PI : 0;
    chap.onRide?.(false); r.res();
  }
}
// Caught by the dog, in any chapter: a moment on his face, then wherever the chapter puts you back.
async function caughtBy(reset) {
  if (!playing) return;
  playing = false; releaseMouse(); me.caught++; paintStats();
  const head = new THREE.Vector3(); hound.heads[1].head.getWorldPosition(head);
  camShot.pos.copy(head).add(flat(me.pos).sub(flat(dog.pos)).normalize().multiplyScalar(.9)).setY(head.y);
  camShot.look.copy(head); camShot.active = true;
  canvas.classList.add("caught"); sound.hit(); toast("Could be worse.", 2400);
  await new Promise(r => setTimeout(r, 2300));
  canvas.classList.remove("caught"); camShot.active = false;
  reset(); paintGoal();
  playing = true; grabMouse();
}
function clearChapterOne() {
  coins.forEach(c => scene.remove(c)); coins = [];
  if (cake) { scene.remove(cake); cake = null; }
}
let lyreHeld = false;
const G = {
  THREE, scene, camera, me, NPC, dog, V, flat, $, keys, sound, save, PLACES, CARDS, CLIPS, SkeletonUtils, camShot, paint,
  get farWorld() { return farWorld; },
  cast: (id, opts) => makeCastMember(id, {ASSETS, CLIPS, scene, ...opts}), mount, placeNPC, clearChapterOne, hermesLeaves,
  line, choose, beginTalk, endTalk, toast, paintGoal, crossRiver, boatTo, setLightsFar, caughtBy, finish, releaseMouse, grabMouse,
  setPlaying: v => { playing = v; }, isTalking: () => talking, speedScale: k => { speedK = k; }, touchLyre: () => lyreHeld
};
const CHAPTERS = [
  {n: 1, roman: "I", title: "The Coin", who: "Mikon", over: "Chapter I · you are Mikon, an ordinary man", rule: "The dog can smell coins.", line: "You died without the fare. Find a coin and get it to the ferry."},
  {n: 2, roman: "II", title: "The Lyre", who: "Orpheus", over: "Chapter II · you are Orpheus", rule: "Don't look back.", line: "Your wife died on your wedding day. You're alive, and you've come down to get her."},
  {n: 3, roman: "III", title: "The Box", who: "Psyche", soon: true}, {n: 4, roman: "IV", title: "The Pit", who: "Odysseus", soon: true},
  {n: 5, roman: "V", title: "The Dog", who: "Heracles", soon: true}, {n: 6, roman: "VI", title: "The Bough", who: "Aeneas", soon: true},
  {n: 7, roman: "VII", title: "The Rock", who: "Sisyphus", soon: true}, {n: 8, roman: "VIII", title: "The Seeds", who: "Persephone", soon: true}
];
const howtoOne = $("#howto .steps").innerHTML, keysOne = $("#keys").innerHTML;
function pickChapter(n) {
  const c = CHAPTERS.find(c => c.n === n); if (!c || c.soon) return;
  CH = n; chap = n === 2 ? (chap.id === 2 ? chap : makeOrpheus(G)) : chapterOne;
  $("#start .over").textContent = c.over; $("#start h1").textContent = c.title;
  $("#start .rulebig").textContent = c.rule; $("#start .small").textContent = c.line;
  $(".hud .rule").textContent = c.rule;
  $("#keys").innerHTML = n === 1 ? keysOne : touchMode ? "<b>Left thumb</b><span>walk</span><b>Right thumb</b><span>look</span><b>lyre</b><span>hold to play</span><b>tap</b><span>play a note, in a song</span><b>use</b><span>talk, pick up</span>" : chap.keys;
  $("#howto .steps").innerHTML = n === 2 ? chap.howto : howtoOne;
  $("#tQ").hidden = n !== 1; $("#tF").hidden = n !== 2;
  document.querySelectorAll("#chapters button").forEach(b => b.classList.toggle("sel", +b.dataset.n === n));
  paintGoal(); paintStats();
}
$("#chapters").innerHTML = CHAPTERS.map(c => `<button data-n="${c.n}" ${c.soon ? "disabled" : ""}><i>${c.roman}</i><b>${c.title}</b><span>${c.soon ? "coming" : c.who}${save.get().done.includes(c.n) ? " · played" : ""}</span></button>`).join("");
$("#chapters").addEventListener("click", e => { const b = e.target.closest("button"); if (b && !b.disabled) pickChapter(+b.dataset.n); });
pickChapter(+(new URLSearchParams(location.search).get("chapter") || (save.get().done.includes(1) ? 2 : 1)));
// the lyre button on touch screens: hold to play
$("#tF").addEventListener("touchstart", e => { e.preventDefault(); lyreHeld = true; }, {passive: false});
$("#tF").addEventListener("touchend", () => { lyreHeld = false; }); $("#tF").addEventListener("touchcancel", () => { lyreHeld = false; });

// For testing only: /play/?debug exposes the game state in the console.
if (new URLSearchParams(location.search).has("debug")) window.__game = {me, dog, NPC, camShot, THREE, G, get player() { return PLAYER; }, get chap() { return chap; }, get ride() { return ride; }, setLightsFar, crossRiver, FAR, PLACES, interact, conversation, pickCoin, wakeDog, camera, hound, renderer, composer, get playing() { return playing; }};
