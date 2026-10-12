// THE COIN: the game. An open riverbank in the Underworld, built like an Italian loggia,
// with real people to talk to and something that can smell coins.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { Water } from "three/addons/objects/Water.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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
  altar: V(56, 0, 9), chairs: V(56, 0, -1), dogHome: V(72, 0, 12), dock: V(0, 0, 35), boat: V(0, 0, 37.5)
};
const onDock = p => Math.abs(p.x) < 1.5 && p.z > SHORE - .5 && p.z < 36;
const inWater = p => p.z > SHORE && !onDock(p);

/* ---------- renderer, camera, post-processing ---------- */
const canvas = $("#view");
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: "high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15110d);
scene.fog = new THREE.FogExp2(0x1d1813, 0.021);
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 400);
camera.rotation.order = "YXZ";

// A painterly finish: soft brushy patches, warm old-pigment grade, vignette, grain.
const Painterly = {
  uniforms: {tDiffuse: {value: null}, time: {value: 0}, danger: {value: 0}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float danger; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 px = 1.0 / vec2(1600.0, 900.0);
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec3 acc = c; float w = 1.0;
      for (int i = 0; i < 6; i++) { float a = float(i) * 1.047; vec2 o = vec2(cos(a), sin(a)) * px * 2.2;
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
scene.add(new THREE.HemisphereLight(0x9fb3c8, 0x2a1d12, 0.55));
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
  if (z < .4 || x < -38 || x > 82 || z > DEEP) return true;
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
  textureWidth: 512, textureHeight: 512, waterNormals, sunDirection: moon.position.clone().normalize(),
  sunColor: 0xcfd9ff, waterColor: 0x0f1c18, distortionScale: 2.4, fog: true
});
water.rotation.x = -Math.PI / 2; water.position.set(20, -.32, SHORE + 70); scene.add(water);
const far = new THREE.Mesh(new THREE.PlaneGeometry(320, 90), new THREE.MeshBasicMaterial({map: tex(LIB + "styx/patinir-styx.jpg"), color: 0x6b6258, fog: false}));
far.position.set(20, 28, 150); far.rotation.y = Math.PI; scene.add(far);

/* ---------- the arcade: columns, arches, painted vaults ---------- */
const VAULTS = ["styx/last-judgment.jpg", "styx/giordano-charon.jpg", "styx/raphael-wedding-banquet.jpg", "styx/giordano-proserpina.jpg", "styx/signorelli-resurrection.jpg", "styx/brueghel-orpheus-pluto.jpg"];
const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(76, .3, 9), M.marble); floorSlab.position.set(0, -.14, 4); scene.add(floorSlab);
const back = new THREE.Mesh(new THREE.BoxGeometry(76, 9.5, .6), M.plaster); back.position.set(0, 4.75, -.3); scene.add(back);
boxes.push([-38, -1, 38, .3]);
for (let i = 0; i < 6; i++) {
  const xc = -36 + i * 12 + 6;
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 12, 32, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({map: tex(LIB + VAULTS[i]), side: THREE.BackSide, roughness: .9, color: 0xb5a891}));
  vault.rotation.z = Math.PI / 2; vault.position.set(xc, 6.4, 4); scene.add(vault);
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

/* ---------- coins ---------- */
let coins = [];
function makeCoin(at, y = 1) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .03, 28), new THREE.MeshStandardMaterial({color: 0xe0b85a, metalness: .95, roughness: .22, emissive: 0x4a3208}));
  m.rotation.x = Math.PI / 2; m.position.set(at.x, y, at.z);
  m.add(new THREE.PointLight(0xffd27a, 4, 4, 2));
  scene.add(m); coins.push(m); return m;
}
makeCoin(PLACES.altar, STEP + 1.25);

/* ---------- people ---------- */
const gltf = new GLTFLoader();
const ASSETS = {}, CLIPS = {};
async function loadAssets(progress) {
  const list = ["male_peasant", "male_ranger", "head_male", "hair_beard", "hair_long", "hair_simpleparted", "hair_buzzed", "anims"];
  let done = 0;
  await Promise.all(list.map(async n => { ASSETS[n] = await gltf.loadAsync(`assets/${n}.glb`); progress(++done / list.length); }));
  for (const a of ASSETS.anims.animations) CLIPS[a.name] = a;
}
// Recolour the clothes but keep their folds; leave skin alone.
function tintCloth(mat, hex, amount = .6) {
  mat = mat.clone();
  const tint = new THREE.Color(hex);
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTint = {value: tint}; sh.uniforms.uAmt = {value: amount};
    sh.fragmentShader = "uniform vec3 uTint; uniform float uAmt;\n" + sh.fragmentShader.replace("#include <map_fragment>",
      `#include <map_fragment>
       float lum = dot(diffuseColor.rgb, vec3(.299,.587,.114));
       diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (lum * 2.1), uAmt);`);
  };
  mat.customProgramCacheKey = () => "tint" + hex;
  return mat;
}
function makePerson({body, cloth, hide = [], hair = [], hairColor = 0x2a1d14, scale = 1}) {
  const root = SkeletonUtils.clone(ASSETS[body].scene);
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name] = o; });
  root.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    if (hide.some(h => o.name.includes(h))) { o.visible = false; return; }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => /Peasant|Ranger/.test(m.name) ? tintCloth(m, cloth) : m);
    o.material = Array.isArray(o.material) ? out : out[0];
  });
  // The outfits are clothes and hands only, so each person borrows a head from the base body:
  // keep just the triangles above the collar, plus the eyes and eyebrows.
  {
    const parts = []; SkeletonUtils.clone(ASSETS.head_male.scene).traverse(o => { if (o.isSkinnedMesh) parts.push(o); });
    for (const o of parts) {
      if (/Sphere|Retopology/.test(o.name)) {
        const geo = o.geometry.clone(), pos = geo.attributes.position, idx = geo.index.array, keep = [];
        for (let i = 0; i < idx.length; i += 3) if (pos.getY(idx[i]) > 1.57 && pos.getY(idx[i + 1]) > 1.57 && pos.getY(idx[i + 2]) > 1.57) keep.push(idx[i], idx[i + 1], idx[i + 2]);
        geo.setIndex(keep); o.geometry = geo;
      }
      o.bind(new THREE.Skeleton(o.skeleton.bones.map(b => bones[b.name] || b), o.skeleton.boneInverses), o.bindMatrix);
      o.frustumCulled = false; root.add(o);
    }
  }
  for (const h of hair) {
    const parts = []; SkeletonUtils.clone(ASSETS[h].scene).traverse(o => { if (o.isSkinnedMesh) parts.push(o); });
    for (const o of parts) {
      o.bind(new THREE.Skeleton(o.skeleton.bones.map(b => bones[b.name] || b), o.skeleton.boneInverses), o.bindMatrix);
      o.material = o.material.clone(); o.material.color = new THREE.Color(hairColor); o.frustumCulled = false;
      root.add(o);
    }
  }
  root.scale.setScalar(scale);
  const mixer = new THREE.AnimationMixer(root);
  const person = {root, mixer, bones, action: null, current: null, play(name, fade = .35) {
    const clip = CLIPS[name]; if (!clip || this.current === name) return;
    const a = mixer.clipAction(clip); a.reset().fadeIn(fade).play();
    if (this.action) this.action.fadeOut(fade);
    this.action = a; this.current = name;
  }};
  scene.add(root);
  return person;
}
const NPC = {};
function placePeople() {
  NPC.hermes = Object.assign(makePerson({body: "male_peasant", cloth: 0xd9cdb4, hair: ["hair_simpleparted"], hairColor: 0x6b4a2a}),
    {name: "Hermes", idle: "Idle_Loop", talk: "Idle_Talking_Loop", pos: PLACES.hermes.clone(), face: true});
  NPC.elpenor = Object.assign(makePerson({body: "male_peasant", cloth: 0x5d6f80, hair: ["hair_buzzed"], hairColor: 0x2b2018}),
    {name: "Elpenor", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(-6, 0, 16.05), yaw: Math.PI, seatY: .5});
  NPC.theseus = Object.assign(makePerson({body: "male_ranger", cloth: 0x8f2f22, hide: ["Pauldron", "Bracer", "Hood", "Belt"], hair: ["hair_simpleparted"], hairColor: 0x3a2516}),
    {name: "Theseus", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(54.6, 0, PLACES.chairs.z + .1), yaw: 0, seatY: STEP + .5});
  NPC.pirithous = Object.assign(makePerson({body: "male_peasant", cloth: 0xa9823a, hair: ["hair_long", "hair_beard"], hairColor: 0x1d140d}),
    {name: "Pirithous", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(57.4, 0, PLACES.chairs.z + .1), yaw: 0, seatY: STEP + .5});
  NPC.charon = Object.assign(makePerson({body: "male_ranger", cloth: 0x1c1a19, hide: ["Pauldron", "Bracer", "Belt"], hair: ["hair_beard", "hair_long"], hairColor: 0x9a948a, scale: 1.12}),
    {name: "Charon", idle: "Idle_Torch_Loop", talk: "Idle_Talking_Loop", pos: V(0, 0, 37.2), yaw: Math.PI, seatY: .25, face: true});
  for (const p of Object.values(NPC)) {
    p.root.position.set(p.pos.x, p.seatY || 0, p.pos.z);
    p.root.rotation.y = p.yaw ?? 0;
    p.play(p.idle, 0);
    if (!p.seatY || p === NPC.charon) circles.push([p.pos.x, p.pos.z, .5]);
  }
}

/* ---------- Cerberus: three heads on long necks, made of shadow and smoke ---------- */
function makeHound() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({color: 0x0b0908, roughness: 1, emissive: 0x120403});
  const rim = new THREE.MeshBasicMaterial({color: 0x8a2a10, transparent: true, opacity: .42, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending});
  const glow = (m, s = 1.16) => { const r = new THREE.Mesh(m.geometry, rim); r.scale.setScalar(s); m.add(r); return m; };
  const body = glow(new THREE.Mesh(new THREE.CapsuleGeometry(.55, 2.1, 6, 14), skin)); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, .8);
  const torso = new THREE.Group(); torso.add(body); torso.position.y = 1.25; g.add(torso);
  for (let i = 0; i < 6; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(.5, .035, 4, 14, Math.PI), skin); rib.position.set(-.5 + i * .22, -.05, 0); rib.rotation.y = Math.PI / 2; torso.add(rib); }
  const legs = [];
  for (const [x, z] of [[.95, .42], [.95, -.42], [-.95, .42], [-.95, -.42]]) {
    const hip = new THREE.Group(); hip.position.set(x, 1.15, z); g.add(hip);
    const upper = glow(new THREE.Mesh(new THREE.CylinderGeometry(.11, .08, 1.05, 6), skin)); upper.position.y = -.5; hip.add(upper);
    const knee = new THREE.Group(); knee.position.y = -1.0; hip.add(knee);
    const lower = glow(new THREE.Mesh(new THREE.CylinderGeometry(.07, .045, 1.0, 6), skin)); lower.position.y = -.48; knee.add(lower);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 4), skin); paw.position.y = -.98; paw.scale.set(1.6, .5, 1); knee.add(paw);
    legs.push({hip, knee, front: x > 0, side: z > 0 ? 1 : -1});
  }
  const heads = [];
  const eyeMat = new THREE.MeshBasicMaterial({color: 0xff5a1f});
  for (const [z, yaw] of [[-.38, -.45], [0, 0], [.38, .45]]) {
    const neck = new THREE.Group(); neck.position.set(1.25, 1.45, z); neck.rotation.y = yaw; g.add(neck);
    const n = glow(new THREE.Mesh(new THREE.CylinderGeometry(.13, .2, .95, 7), skin)); n.rotation.z = -1.05; n.position.set(.38, .22, 0); neck.add(n);
    const head = new THREE.Group(); head.position.set(.8, .46, 0); neck.add(head);
    const skull = glow(new THREE.Mesh(new THREE.ConeGeometry(.2, 1.0, 7), skin)); skull.rotation.z = -Math.PI / 2; skull.position.x = .42; skull.scale.set(1, 1, .8); head.add(skull);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), skin); crown.scale.set(1.1, .85, .9); head.add(crown);
    const jaw = new THREE.Group(); jaw.position.set(.02, -.1, 0); head.add(jaw);
    const j = new THREE.Mesh(new THREE.ConeGeometry(.12, .86, 6), skin); j.rotation.z = -Math.PI / 2; j.position.x = .4; j.scale.set(1, 1, .7); jaw.add(j);
    const toothMat = new THREE.MeshBasicMaterial({color: 0xd9cbb0});
    for (let t = 0; t < 4; t++) for (const s of [-1, 1]) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(.018, .09, 4), toothMat); tooth.position.set(.2 + t * .13, .05, s * .06); jaw.add(tooth); }
    for (const s of [-1, 1]) {
      const ear = glow(new THREE.Mesh(new THREE.ConeGeometry(.08, .45, 4), skin)); ear.position.set(-.08, .3, s * .13); ear.rotation.z = .45; head.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.022, 6, 4), eyeMat); eye.position.set(.22, .08, s * .1); head.add(eye);
    }
    heads.push({neck, head, jaw, seed: Math.random() * 10});
  }
  const eyesLight = new THREE.PointLight(0xff4a1a, 3, 6, 2); eyesLight.position.set(2, 1.8, 0); g.add(eyesLight);
  const backLight = new THREE.PointLight(0x9a2a14, 9, 7, 1.6); backLight.position.set(-1.5, 2.6, 0); g.add(backLight);
  const smokeTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(20,10,8,.9)"); gr.addColorStop(1, "rgba(20,10,8,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const N = 70, life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  const smokeGeo = new THREE.BufferGeometry(); smokeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({map: smokeTex, size: 1.3, transparent: true, depthWrite: false, opacity: .75}));
  scene.add(smoke);
  g.scale.setScalar(1.15);
  scene.add(g);
  return {g, legs, heads, torso, smoke, life, N, eyesLight};
}
const hound = makeHound();
const dog = {pos: PLACES.dogHome.clone(), yaw: Math.PI * .8, mode: "sleep", speed: 0, calmAt: 0, noiseUntil: 0, growl: 0, phase: 0};

function animateHound(dt, now) {
  const h = hound, moving = dog.speed > .3, sleeping = dog.mode === "sleep";
  dog.phase += dt * (moving ? dog.speed * 2.1 : 1);
  h.g.position.set(dog.pos.x, sleeping ? -.55 : 0, dog.pos.z);
  h.g.rotation.y = -dog.yaw + Math.PI / 2;
  h.torso.position.y = sleeping ? 1.0 : 1.25 + Math.sin(dog.phase * 2) * (moving ? .06 : .02);
  for (const l of h.legs) {
    const ph = dog.phase + (l.front ? 0 : Math.PI) + (l.side > 0 ? Math.PI / 2 : 0);
    if (sleeping) { l.hip.rotation.z = l.front ? 1.1 : -1.1; l.knee.rotation.z = l.front ? -2.2 : 2.2; continue; }
    l.hip.rotation.z = (moving ? Math.sin(ph) * .55 : Math.sin(now / 900 + l.side) * .04) + (l.front ? -.1 : .15);
    l.knee.rotation.z = moving ? Math.max(0, Math.sin(ph + 1.2)) * .9 + .15 : .2;
  }
  for (const [i, hd] of h.heads.entries()) {
    const t = now / 1000 + hd.seed;
    if (sleeping) { hd.neck.rotation.z = -.9; hd.jaw.rotation.z = 0; continue; }
    hd.neck.rotation.z = (moving ? -.35 : -.1) + Math.sin(t * (moving ? 6 : 1.5)) * .12;
    hd.neck.rotation.x = Math.sin(t * 2.3 + i) * .18;
    hd.jaw.rotation.z = -Math.max(0, Math.sin(t * (dog.mode === "hunt" ? 7 : 1.2))) * (dog.mode === "hunt" ? .55 : .15);
  }
  h.eyesLight.intensity = sleeping ? .3 : 3 + Math.sin(now / 80) * .5;
  const p = h.smoke.geometry.attributes.position;
  for (let i = 0; i < h.N; i++) {
    h.life[i] += dt * (.35 + (i % 5) * .05);
    if (h.life[i] > 1) { h.life[i] = 0; p.setXYZ(i, dog.pos.x + (Math.random() - .5) * 2.4, (sleeping ? .5 : 1.2) + Math.random() * .6, dog.pos.z + (Math.random() - .5) * 1.4); }
    else p.setY(i, p.getY(i) + dt * .8);
  }
  p.needsUpdate = true;
  h.smoke.material.opacity = sleeping ? .4 : .8;
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
    const room = actx.createConvolver(), len = actx.sampleRate * 1.8, ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    room.buffer = ir; const wet = actx.createGain(); wet.gain.value = .16;
    vsrc.connect(master); vsrc.connect(room).connect(wet).connect(master);
  },
  noise(s) { const b = actx.createBuffer(1, actx.sampleRate * s, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const x = actx.createBufferSource(); x.buffer = b; return x; },
  env(node, peak, a, d, at) { const g = actx.createGain(); at = at ?? actx.currentTime; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(.0001, at + a + d); node.connect(g).connect(master); },
  step(wet) { if (!actx) return; const n = this.noise(.12), f = actx.createBiquadFilter(); f.type = wet ? "bandpass" : "lowpass"; f.frequency.value = wet ? 1300 : 360; n.connect(f); this.env(f, wet ? .25 : .16, .005, .1); n.start(); },
  splash() { if (!actx) return; const n = this.noise(1.2), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, actx.currentTime); f.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 1); n.connect(f); this.env(f, .7, .02, .9); n.start(); },
  bark() { if (!actx) return; [0, .18, .36, .7].forEach((d, i) => { const at = actx.currentTime + d, o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(200 - i * 25, at); o.frequency.exponentialRampToValueAtTime(70, at + .2); const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; o.connect(f); this.env(f, .55, .01, .22, at); o.start(at); o.stop(at + .3); }); },
  growl(level) { if (!actx) return; const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 42 + Math.random() * 12; const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 150; o.connect(f); this.env(f, .55 * level, .08, .55); o.start(); o.stop(actx.currentTime + .7); },
  hit() { if (!actx) return; const o = actx.createOscillator(); o.frequency.setValueAtTime(120, actx.currentTime); o.frequency.exponentialRampToValueAtTime(26, actx.currentTime + 1); this.env(o, 1, .005, 1.1); o.start(); o.stop(actx.currentTime + 1.2); const n = this.noise(.6); this.env(n, .7, .002, .5); n.start(); },
  chime() { if (!actx) return; [784, 1175].forEach((fq, i) => { const at = actx.currentTime + i * .1, o = actx.createOscillator(); o.frequency.value = fq; this.env(o, .12, .005, 1.8, at); o.start(at); o.stop(at + 2); }); }
};

/* ---------- HUD ---------- */
let toastT;
function toast(msg, ms = 2800) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), ms); }
function paintStats() { $("#stats").innerHTML = `caught by the dog: ${me.caught}<br>splashed: ${me.splashed}`; }
const GOALS = [
  {label: "Talk to the man in the light tunic", at: () => NPC.hermes.pos},
  {label: "Find a coin. Somebody by the river might know where.", at: () => me.met.elpenor ? PLACES.altar : NPC.elpenor.pos},
  {label: "Get the coin to Charon's ferry. Don't get caught.", at: () => PLACES.dock}
];
const goal = () => GOALS[Math.min(me.stage, GOALS.length - 1)];
function paintGoal() { $("#goal").innerHTML = `<small>what to do</small>${goal().label}`; }

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
async function line(who, id, text) {
  const p = NPC[who];
  $("#sub b").textContent = p ? p.name : "Mikon";
  $("#sub span").textContent = text; $("#sub").classList.add("on");
  if (p) { frameOn(p, 1); p.play(p.talk); } else if (talkingTo) frameOn(talkingTo, -1);
  voiceEl.src = `voice/${id}.m4a`;
  const fallback = 900 + text.split(" ").length * 280;
  await new Promise(res => {
    let done = false;
    const fin = () => { if (done) return; done = true; voiceEl.onended = voiceEl.onerror = null; skipLine = null; res(); };
    voiceEl.onended = fin; voiceEl.onerror = () => setTimeout(fin, fallback);
    skipLine = () => { voiceEl.pause(); fin(); };
    voiceEl.play().catch(() => setTimeout(fin, fallback));
  });
  if (p) p.play(p.idle);
  $("#sub").classList.remove("on");
  await new Promise(r => setTimeout(r, 160));
}
function choose(options) {
  return new Promise(res => {
    const box = $("#choices");
    box.innerHTML = options.map((o, i) => `<button data-k="${i}"><b>${i + 1}</b>${o.t}</button>`).join("");
    box.classList.add("on");
    box.querySelectorAll("button").forEach(b => b.onclick = () => { box.classList.remove("on"); choicePick = null; res(+b.dataset.k); });
    choicePick = k => box.querySelector(`button[data-k="${k}"]`)?.click();
  });
}
function beginTalk(p) { talking = true; releaseMouse(); document.body.classList.add("talking"); talkingTo = p; }
async function conversation(id) {
  beginTalk(NPC[id]);
  const say = (who, lid, text) => line(who, lid, text);
  if (id === "hermes") {
    await say("hermes", "h1", "Right. Here's you. Dead. Welcome.");
    await say("hermes", "h2", "River's that way. The ferry's at the end of the dock. The ferryman's the cheerful one.");
    await say("hermes", "h3", "He'll want a coin. You don't have a coin. So. Find a coin.");
    await say("hermes", "h4", "One thing. There's a dog. Three heads, very good nose. He can smell coins.");
    await say("mikon", "m1", "Wait. A dog? How big is the...");
    await say("hermes", "h5", "He can't swim, though. Lovely to meet you.");
    me.stage = Math.max(me.stage, 1); hermesLeaves();
  } else if (id === "elpenor") {
    await say("elpenor", "e1", "Oh. Hey. Are you dead too?");
    await say("mikon", "m2", "Olive pit. You?");
    await say("elpenor", "e2", "Fell off a roof. Long story. Short roof.");
    const k = await choose([{t: "Ask if he's seen a coin anywhere."}, {t: "Tell him you'll get him out of here too."}, {t: "Tell him to stay off roofs."}]);
    me.choices.elpenor = [{Hermes: 2, Athena: 1}, {Demeter: 2, Hera: 1}, {Dionysus: 2, Apollo: 1}][k];
    if (k === 1) await say("elpenor", "e5", "Nobody's ever said that to me.");
    if (k === 2) await say("elpenor", "e6", "Bit late, mate.");
    await say("elpenor", "e3", "There's an old coin on the altar in the temple. End of the arcade. Right next to where the dog sleeps.");
    await say("elpenor", "e4", "If he wakes up, get in the river. He hates water.");
  } else if (id === "theseus") {
    await say("theseus", "t1", "Don't sit down.");
    await say("pirithous", "p1", "Seriously. Don't.");
    await say("mikon", "m3", "Are you two... stuck?");
    await say("theseus", "t2", "We've been here a while. My coin's in my belt. I can't reach it. I can't reach anything.");
    const k = await choose([{t: "Take his coin. He's not using it."}, {t: "Try to pull them off the chairs."}, {t: "Leave them. They're heroes, they'll figure it out."}]);
    me.choices.theseus = [{Ares: 2, Hermes: 1}, {Artemis: 2, Hera: 1}, {Apollo: 2, Zeus: 1}][k];
    if (k === 0) {
      await say("theseus", "t3", "Fine. Take it. Quietly.");
      if (!me.coin && me.theseusCoin) { me.theseusCoin = false; pickCoin(); await say("theseus", "t4", "That was not quietly."); }
    }
    if (k === 1) { await say("mikon", "m4", "On three. One, two..."); await say("pirithous", "p2", "No. No. It's fused. I'm part chair now."); me.met.theseus = true; endTalk(); wakeDog("The screaming woke something up.", 10); return; }
    if (k === 2) await say("pirithous", "p3", "Guys?");
  } else if (id === "charon") {
    if (!me.coin) {
      await say("charon", "c1", "Coin.");
      await say("mikon", "m5", "Working on it.");
      endTalk(); sound.splash(); me.splashed++; paintStats(); toast("Splash."); return;
    }
    await say("charon", "c1", "Coin.");
    await say("mikon", "m6", "Coin!");
    await say("charon", "c2", "Get in.");
    await say("mikon", "m7", "There's a kid on the bank. He doesn't have a coin.");
    const k = await choose([{t: "Get in. A hundred years. You earned it."}, {t: "Give the kid your coin."}, {t: "Stay. You've got a good spot now."}]);
    me.choices.charon = [{Zeus: 1, Apollo: 1, Hephaestus: 1}, {Demeter: 2, Hera: 1}, {Poseidon: 2, Dionysus: 1, Hephaestus: 1}][k];
    if (k === 1) { await say("charon", "c3", "Doesn't work like that."); await say("mikon", "m8", "Then I'll wait with him."); await say("charon", "c4", "Both of you. Get in."); }
    await say("mikon", "m9", "Could be worse.");
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

function hermesLeaves() {
  const h = NPC.hermes; h.leaving = true; h.play("Walk_Formal_Loop");
  const i = circles.findIndex(c => c[0] === h.pos.x && c[1] === h.pos.z); if (i >= 0) circles.splice(i, 1);
}

/* ---------- the coin and the dog ---------- */
function pickCoin(mesh) {
  if (mesh) { scene.remove(mesh); coins = coins.filter(c => c !== mesh); }
  me.coin = true; me.stage = 2; sound.chime(); paintGoal();
  $("#carry").classList.add("on");
  wakeDog("It smells the coin.");
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
  if (secs) dog.noiseUntil = performance.now() + secs * 1000;
  if (dog.mode !== "hunt") { dog.mode = "hunt"; sound.bark(); toast(msg); }
}
function updateDog(dt, now) {
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
  coins.forEach(c => scene.remove(c)); coins = []; makeCoin(PLACES.altar, STEP + 1.25);
  dog.pos.copy(PLACES.dogHome); dog.mode = "sleep"; dog.noiseUntil = 0;
  me.pos.copy(me.met.elpenor ? V(-6, 0, 12) : PLACES.start); me.yaw = -Math.PI / 2; me.pitch = -.04;
  me.stage = Math.min(me.stage, 1); paintGoal();
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
function finish(text) {
  ended = true; playing = false; releaseMouse(); sound.chime(); document.body.classList.add("over");
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
  $("#end .score").textContent = `${mins} minute${mins > 1 ? "s" : ""} · caught by the dog ${me.caught} time${me.caught === 1 ? "" : "s"} · splashed ${me.splashed} time${me.splashed === 1 ? "" : "s"}`;
  $("#end").classList.add("on");
  $("#share").onclick = () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I got a coin past a three-headed dog and onto Charon's ferry. Caught ${me.caught} time${me.caught === 1 ? "" : "s"}. Apparently I play like ${patron}.`)}&url=${encodeURIComponent(location.origin + "/play/")}`, "_blank", "noopener");
}
$("#again").onclick = () => location.reload();

/* ---------- controls ---------- */
const touchMode = matchMedia("(pointer: coarse)").matches;
if (touchMode) $("#keys").innerHTML = "<b>Left thumb</b><span>walk</span><b>Right thumb</b><span>look</span><b>use</b><span>talk, pick up</span><b>drop</b><span>drop the coin</span>";
function grabMouse() { if (!touchMode && !talking && !ended) canvas.requestPointerLock?.(); }
function releaseMouse() { if (document.pointerLockElement) document.exitPointerLock(); }
document.addEventListener("pointerlockchange", () => { if (!document.pointerLockElement && playing && !talking && !ended && !touchMode) $("#paused").classList.add("on"); });
$("#resume").onclick = () => { $("#paused").classList.remove("on"); grabMouse(); };
document.addEventListener("mousemove", e => { if (!document.pointerLockElement || !playing || talking) return; me.yaw -= e.movementX * .0022; me.pitch = Math.max(-1.2, Math.min(1.2, me.pitch - e.movementY * .0022)); });
addEventListener("keydown", e => { keys[e.code] = true; if (!playing || talking) return; if (e.code === "KeyE") interact(); if (e.code === "KeyQ") dropCoin(); });
addEventListener("keyup", e => { keys[e.code] = false; });
canvas.addEventListener("click", () => { if (playing && !talking) grabMouse(); });
const touch = {move: null, look: null, mx: 0, mz: 0};
if (touchMode) {
  $("#touch").classList.add("on");
  const knob = $(".knob");
  $("#touch").addEventListener("touchstart", e => { for (const t of e.changedTouches) { if (t.target.closest("button")) continue; if (t.clientX < innerWidth / 2 && !touch.move) touch.move = {id: t.identifier, x: t.clientX, y: t.clientY}; else if (!touch.look) touch.look = {id: t.identifier, x: t.clientX, y: t.clientY}; } }, {passive: true});
  $("#touch").addEventListener("touchmove", e => { for (const t of e.changedTouches) {
    if (touch.move && t.identifier === touch.move.id) { const dx = Math.max(-50, Math.min(50, t.clientX - touch.move.x)), dy = Math.max(-50, Math.min(50, t.clientY - touch.move.y)); touch.mx = dx / 50; touch.mz = dy / 50; knob.style.transform = `translate(${dx * .8}px,${dy * .8}px)`; }
    else if (touch.look && t.identifier === touch.look.id) { me.yaw -= (t.clientX - touch.look.x) * .006; me.pitch = Math.max(-1.1, Math.min(1.1, me.pitch - (t.clientY - touch.look.y) * .006)); touch.look.x = t.clientX; touch.look.y = t.clientY; } } }, {passive: true});
  const end = e => { for (const t of e.changedTouches) { if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.mx = touch.mz = 0; knob.style.transform = ""; } if (touch.look && t.identifier === touch.look.id) touch.look = null; } };
  $("#touch").addEventListener("touchend", end); $("#touch").addEventListener("touchcancel", end);
  $("#tE").onclick = () => playing && !talking && interact();
  $("#tQ").onclick = () => playing && !talking && dropCoin();
}

/* ---------- what's nearby ---------- */
function nearby() {
  for (const c of coins) if (flat(c.position).distanceTo(flat(me.pos)) < 1.8) return {kind: "coin", obj: c, label: "pick up the coin"};
  const near = (p, r) => flat(p).distanceTo(flat(me.pos)) < r;
  if (!NPC.hermes.leaving && NPC.hermes.root.visible && near(NPC.hermes.pos, 3.2)) return {kind: "talk", id: "hermes", label: "talk to Hermes"};
  if (near(NPC.elpenor.pos, 3)) return {kind: "talk", id: "elpenor", label: "talk to Elpenor"};
  if (near(PLACES.chairs, 3.6)) return {kind: "talk", id: "theseus", label: "talk to Theseus and Pirithous"};
  if (near(NPC.charon.pos, 4.2)) return {kind: "talk", id: "charon", label: "talk to Charon"};
  return null;
}
function interact() {
  const n = nearby(); if (!n) return;
  if (n.kind === "coin") { if (me.coin) return toast("One coin is plenty."); pickCoin(n.obj); }
  else conversation(n.id);
}

/* ---------- the loop ---------- */
let last = performance.now(), stepT = 0, wasWet = false, greeted = false;
const fpPos = new THREE.Vector3();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (playing && !talking) {
    let fx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.mx;
    let fz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + touch.mz;
    const len = Math.hypot(fx, fz);
    const wet = inWater(me.pos);
    if (len > .05) {
      fx /= Math.max(1, len); fz /= Math.max(1, len);
      const speed = wet ? 2.1 : (keys.ShiftLeft || keys.ShiftRight ? 7 : 4.3);
      const s = Math.sin(me.yaw), c = Math.cos(me.yaw);
      const dx = (fx * c + fz * s) * speed * dt, dz = (-fx * s + fz * c) * speed * dt;
      if (!solid(me.pos.x + dx, me.pos.z)) me.pos.x += dx;
      if (!solid(me.pos.x, me.pos.z + dz)) me.pos.z += dz;
      else if (me.pos.z + dz > DEEP - .5) toast("Too deep. You can't swim either.", 1500);
      stepT -= dt; if (stepT <= 0) { sound.step(wet); stepT = wet ? .7 : (speed > 5 ? .3 : .45); }
    }
    if (wet && !wasWet) { sound.splash(); me.splashed++; paintStats(); if (dog.mode === "hunt") toast("It won't follow you into the river."); }
    wasWet = wet;
    if (!greeted && NPC.hermes && flat(me.pos).distanceTo(NPC.hermes.pos) < 4.5) { greeted = true; conversation("hermes"); }
    const n = nearby(), pr = $("#prompt");
    if (n && !(n.id === "hermes" && !greeted)) { pr.textContent = (touchMode ? "" : "E · ") + n.label; pr.classList.add("on"); } else pr.classList.remove("on");
    updateDog(dt, now);
  }
  const h = NPC.hermes;
  if (h?.leaving) { h.root.position.x += dt * 1.6; h.root.position.z += dt * .9; h.root.rotation.y = Math.atan2(1.6, .9); if (h.root.position.z > SHORE - 2) { h.root.visible = false; h.leaving = false; } }
  for (const p of Object.values(NPC)) {
    p.mixer.update(dt);
    if (p.face && !p.leaving && p.root.visible && flat(me.pos).distanceTo(flat(p.root.position)) < 9) {
      const want = Math.atan2(me.pos.x - p.root.position.x, me.pos.z - p.root.position.z); let d = want - p.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); p.root.rotation.y += d * Math.min(1, dt * 3);
    }
  }
  animateHound(dt, now);
  // camera: first person, or a close-up during conversations
  fpPos.set(me.pos.x, inWater(me.pos) ? 1.12 : (onTemple(me.pos) ? STEP : 0) + 1.62, me.pos.z);
  if (camShot.active) {
    camera.position.lerp(camShot.pos, .12);
    const m = new THREE.Matrix4().lookAt(camera.position, camShot.look, V(0, 1, 0));
    camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m), .15);
  } else {
    const far = camera.position.distanceTo(fpPos) > .3;
    camera.position.lerp(fpPos, far ? .12 : 1);
    camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(me.pitch, me.yaw, 0, "YXZ")), far ? .15 : 1);
  }
  if (playing && NPC.hermes) {
    const g = goal().at(), d = flat(g).sub(flat(me.pos)); const ang = Math.atan2(-d.x, -d.z) - me.yaw;
    $(".compass .arrow").style.transform = `rotate(${-ang}rad)`;
    $("#compassText").textContent = `${Math.round(d.length())} m`;
  }
  for (const t of torches) t.l.intensity = t.base * (.82 + Math.sin(now / 90 + t.seed) * .07 + Math.random() * .1);
  coins.forEach(c => c.rotation.z = now / 600);
  boat.position.y = -.05 + Math.sin(now / 1100) * .05; boat.rotation.z = Math.sin(now / 1500) * .02;
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
    $("#loading").textContent = ""; $("#go").disabled = false;
  } catch (e) { console.error(e); $("#loading").textContent = "Something didn't load. Try refreshing."; }
  paintGoal(); paintStats();
})();
$("#go").onclick = () => {
  sound.start(); actx.resume();
  $("#start").classList.remove("on"); $("#bg").remove();
  playing = true; me.started = performance.now();
  grabMouse();
  setTimeout(() => toast("Someone is waiting for you."), 700);
};

// For testing only: /play/?debug exposes the game state in the console.
if (new URLSearchParams(location.search).has("debug")) window.__game = {me, dog, NPC, PLACES, interact, conversation, pickCoin, wakeDog, camera, hound, renderer, composer, get playing() { return playing; }};
