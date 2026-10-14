// THE COIN: the game. An open riverbank in the Underworld, built like an Italian loggia,
// with real people to talk to and something that can smell coins.
import {drawPalace, markPalace} from "./palace.js";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { Water } from "three/addons/objects/Water.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { pbr, hdri, skyPhoto } from "./pbr.js";
import { buildTemple } from "./temple.js";
import { PROPS, rockify, place } from "./props.js";
import { groundHeight } from "./meadow.js";
import { makeHound, animateHound, rigHound } from "./hound.js";
import { makeCastMember, oar, mount, hold, makeExtra, cloneExtra } from "./people.js";
import { prepareToon } from "./toon.js";
import { buildFarBank, FAR } from "./farbank.js";
import { placeTrinkets, showFound, openCodex, save } from "./lore.js";
import { lyreInit, pluck } from "./music.js";
import { trial } from "./trials.js";
import { makeOrpheus } from "./orpheus.js";
import { sandstoneTunnel, sunrise } from "./cave.js";
import { buildWedding, W, SEATS, CROWD } from "./wedding.js";

const $ = s => document.querySelector(s);
const LIB = "../img/lib/";
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const flat = v => V(v.x, 0, v.z);

/* ---------- the place ----------
   x runs along the river, z runs from the back wall of the arcade (0) down to the river (22+).
   The arcade:  x -36..36, z 0..8, columns along z = 8.
   The bank:    z 8..22, paved to z = 13, then a sand beach. The river starts at z = 22; you can wade to about z = 29.
   The dock:    x -1.4..1.4, z 22..35, Charon's boat at z ≈ 37.
   The temple:  centred on x = 56, z = 4. The dog's grotto: x ≈ 72, z ≈ 12.            */
const SHORE = 22, DEEP = 29, BEACH = 13; // the river's edge, as far out as you can wade, where the paving gives way to sand
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the ground's height along the beach: level sand, then a gentle slope that meets the water just before SHORE
// and levels out waist-deep, where the old quay used to drop you
const sandY = z => z < BEACH || z > 40 ? 0 : -.5 * smooth(SHORE - 4, SHORE + 2, z);
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
renderer.localClippingEnabled = true; // your own clothes are cut off just below your eyes in first person
const pixelRatio = () => Math.max(1, Math.min(devicePixelRatio || 1, LITE ? 1.25 : 1.75)); // never below 1, or the picture shrinks into a corner
renderer.setPixelRatio(pixelRatio());
renderer.outputColorSpace = THREE.SRGBColorSpace;
// AgX keeps a colour's hue as it brightens (ACES turned firelit sand red and blue night sky purple)
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.15;
// soft shadows from each scene's key light: what grounds an animated film's characters in their world
renderer.shadowMap.enabled = !LITE; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
// light from all around, faint and warm, so skin, silk and metal have something to reflect (a dim studio room)
{ const room = new RoomEnvironment(); room.traverse(o => { if (o.material?.color) o.material.color.multiply(new THREE.Color(.22, .19, .16)); });
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(room, .04).texture; }
const NIGHT = 0x070b16; // the Styx at night: blue-black, under the stars
scene.background = new THREE.Color(0x03050c);
scene.fog = new THREE.FogExp2(NIGHT, 0.021);
const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 400);
camera.rotation.order = "YXZ"; scene.add(camera); // so things held in your hands can ride on it

let people = [], peopleT = 0; const hiddenBy = new Set();
function unblock(on) {
  if (!on) { if (hiddenBy.size) { hiddenBy.forEach(r => r.visible = true); hiddenBy.clear(); } return; }
  const now = performance.now();
  if (now - peopleT > 1000) { peopleT = now; people = []; scene.traverse(o => { if (o.children?.some(c => c.isSkinnedMesh && /^GEO-/.test(c.name) || c.isGroup && c.children[0]?.isSkinnedMesh && /^GEO-/.test(c.name))) people.push(o); }); }
  const cam = camera.getWorldPosition(new THREE.Vector3()), look = camShot.look, line = look.clone().sub(cam), len = line.length(); line.normalize();
  const h = new THREE.Vector3();
  for (const r of people) {
    const head = r.getObjectByName("Bip01_Head"); if (!head) continue;
    head.getWorldPosition(h); const t = h.clone().sub(cam).dot(line);
    const block = t > .15 && t < len - .45 && h.clone().sub(cam).addScaledVector(line, -t).length() < .3;
    if (block && r.visible) { r.visible = false; hiddenBy.add(r); }
    else if (!block && hiddenBy.has(r)) { r.visible = true; hiddenBy.delete(r); }
  }
}
// Light from all around, captured in real places (HDRIs) and dimmed to suit: the underworld is a cold, dim stone
// interior; the wedding courtyard at dusk takes a sunrise; the meadow by day, a meadow. Chosen by where the camera is.
const ENV = {};
hdri(renderer, "small_cathedral", .1, [.75, .9, 1.15]).then(e => ENV.under = e);
// The wedding's real skies, photographed (Poly Haven, CC0): a low sun setting over open country, and a clear day with
// clouds. Each is turned so its sun stands where the wedding's sunlight comes from (the sunset beyond the colonnade,
// to the west), and the same photograph is both the light and the sky you see. The river's sky is a real night sky,
// the Milky Way across it.
const TURN = {dusk: .387, day: .266, night: 0};
hdri(renderer, "kloppenheim_06_puresky", .5, [1, .97, .92], TURN.dusk).then(e => ENV.dusk = e);
hdri(renderer, "kloofendal_48d_partly_cloudy_puresky", .5, [1, 1, 1], TURN.day).then(e => ENV.day = e);
const SKY = {};
skyPhoto("kloppenheim_06_puresky", TURN.dusk).then(t => SKY.dusk = t);
skyPhoto("kloofendal_48d_partly_cloudy_puresky", TURN.day).then(t => SKY.day = t);
skyPhoto("qwantani_night_puresky", TURN.night).then(t => SKY.night = t);
hdri(renderer, "small_cathedral", .06, [.8, .8, 1]).then(e => ENV.night = e);
// The air and the fill light, by where the camera is: the wedding has its own (a warm golden haze at dusk, clear blue
// air by day, cold night for the funeral); everywhere else is the river at night. (It used to be a brown fog over
// the wedding, which muddied it.)
const AIR = {
  // (the fill is the sky's: cool blue against the warm sun, so shadows read as shade and not just as darker sun)
  // (Thea's wedding is at night, by candlelight, as the board has it: a dim cold sky fill, a warm haze for the candles to light)
  wedding: {fog: 0x1a140f, density: .016, top: 0x2c3a5c, ground: 0x1c140e, fill: .22},
  day: {fog: 0xc8d8e6, density: .002, top: 0xbcd6f4, ground: 0x8a7a5a, fill: .7},
  dusk: {fog: 0xd0a080, density: .002, top: 0x8eaad8, ground: 0x7a5640, fill: .6},
  funeral: {fog: 0x151826, density: .02, top: 0x5a6890, ground: 0x1a140e, fill: .45}
};
const NIGHT_SKY = [0x9fb3c8, 0x2a1d12];
function sceneLight() {
  const x = camera.getWorldPosition(new THREE.Vector3()).x, mood = wedding?.kind || "wedding";
  const want = ENV[x > 200 ? (mood === "day" || mood === "dusk" ? mood : "night") : "under"];
  if (want && scene.environment !== want) scene.environment = want;
  // the sky you see: the photograph for the place, once it's loaded (the painted skies stand in until then)
  const bg = x > 200 ? SKY[mood === "day" || mood === "dusk" ? mood : "night"] : SKY.night;
  if (bg && scene.background !== bg) { scene.background = bg; scene.backgroundIntensity = x > 200 ? (mood === "day" ? 1.25 : mood === "dusk" ? 1 : .32) : .55; /* (the wedding night: the stars faint over the candles) */ }
  starDome.visible = !SKY.night; if (wedding) wedding.sky.visible = !bg || x <= 200;
  moon.visible = x <= 200; // (the river's moon has no business lighting a wedding at sunset)
  if (x > 200) { const a = AIR[mood] || AIR.wedding; scene.fog.color.setHex(a.fog); scene.fog.density = a.density; sky.color.setHex(a.top); sky.groundColor.setHex(a.ground); sky.intensity = a.fill; sky.userData.wed = true; }
  else if (sky.userData.wed) { sky.userData.wed = false; scene.fog.color.setHex(NIGHT); scene.fog.density = .021; sky.color.setHex(NIGHT_SKY[0]); sky.groundColor.setHex(NIGHT_SKY[1]); setLightsFar(farOn); }
}
// The film finish: a warm grade with rich colour, a soft vignette, a whisper of grain (and the blur/dim/danger effects
// the story uses). It used to smear the picture into brushy patches and drain the colour; animated films are crisp and saturated.
const Painterly = {
  uniforms: {tDiffuse: {value: null}, time: {value: 0}, danger: {value: 0}, lite: {value: LITE ? 1 : 0}, blur: {value: 0}, dim: {value: 0}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float danger; uniform float lite; uniform float blur; uniform float dim; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 px = 1.0 / vec2(1600.0, 900.0);
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      if (blur > .001) { vec3 b = c; for (int i = 0; i < 12; i++) { float a = float(i) * .5236; b += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * blur * .012).rgb; } c = b / 13.; }
      float l = dot(c, vec3(.299,.587,.114));
      c = mix(vec3(l), c, 1.24); // (AgX is restrained: a little more colour back)
      c *= vec3(1.03, 1.0, .95);
      c = clamp(c, 0., 1.); c = c * c * (3. - 2. * c) * .55 + c * .45; // an S-curve: deeper shadows, brighter highlights, the contrast of a film print
      c = mix(c, c * vec3(1.25,.55,.45), danger * .35);
      float v = smoothstep(1.05, .35, distance(vUv, vec2(.5)));
      c *= mix(.78, 1.0, v);
      c *= 1. - dim * smoothstep(.15, .75, distance(vUv, vec2(.5)) + dim * .3);
      c += (h(vUv * 900. + time) - .5) * .012;
      gl_FragColor = vec4(c, 1.);
    }`
};
// (the composer draws into its own picture, which by default has no anti-aliasing: every edge came out jagged.
// A multisampled one keeps edges smooth, the way the renderer alone would draw them.)
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth, innerHeight, {type: THREE.HalfFloatType, samples: LITE ? 0 : 4}));
composer.addPass(new RenderPass(scene, camera));
// soft shadow where things meet and in every crease (ambient occlusion): what makes a scene sit together
const ao = LITE ? null : new GTAOPass(scene, camera, innerWidth, innerHeight);
if (ao) { ao.updateGtaoMaterial({radius: .45, distanceExponent: 1, thickness: 1, scale: 1}); ao.blendIntensity = .85; composer.addPass(ao); }
if (!LITE) composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .22, .5, .96)); // candles, torches and silk highlights glow
// (no depth-of-field pass: it drew the whole scene a second time for its depth, for a blur hardly anyone saw)
const lens = null;
// The grade comes last, after the tone mapping, on the picture as it will be seen. (It used to run before it, on raw
// light values: every lamp and candle was clipped flat and the mid-tones were crushed, which is what made the colours muddy.)
composer.addPass(new OutputPass());
const paint = new ShaderPass(Painterly); composer.addPass(paint);
function resize() { renderer.setPixelRatio(pixelRatio()); composer.setPixelRatio(pixelRatio()); renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

/* ---------- light ---------- */
const sky = new THREE.HemisphereLight(0x9fb3c8, 0x2a1d12, 0.55); scene.add(sky);
const moon = new THREE.DirectionalLight(0xbfd3ff, 0.9); moon.position.set(-40, 60, 80); scene.add(moon);
// Every sun or moon in a scene casts soft shadows in a box that follows the camera; anything new in the scene learns to
// cast and catch them (looked over once a second: people and props come and go with the story).
let keyLights = [], lastLook = 0;
function shadows(now) {
  if (now - lastLook > 1000) {
    lastLook = now; keyLights = [];
    scene.traverse(o => {
      if (o.isDirectionalLight) { keyLights.push(o); o.userData.dir ||= o.position.clone().sub(o.target.position).normalize(); if (!o.userData.rigged) { o.userData.rigged = true; /* (direction and shadow setup apart: a set may give its sun a direction of its own) */
        o.castShadow = o.castShadow || o.intensity > .5; /* (a faint light, like the wedding's night moon, casts none) */ const c = o.shadow.camera; c.left = c.bottom = -16; c.right = c.top = 16; c.near = 1; c.far = 160; o.shadow.mapSize.set(2048, 2048); o.shadow.bias = -.0006; o.shadow.normalBias = .05; o.shadow.radius = 3; c.updateProjectionMatrix(); if (!o.target.parent) scene.add(o.target); } }
      if (o.isMesh && !o.userData.shadowed) { o.userData.shadowed = true; o.receiveShadow = true;
        const m = [].concat(o.material)[0]; o.geometry.computeBoundingSphere?.(); const big = (o.geometry.boundingSphere?.radius || 0) * o.scale.x > 25;
        o.castShadow = !big && !m?.transparent && !o.isPoints && !(o.isInstancedMesh && o.count > 200); } // (a meadow of grass blades would cost more than it shows)
    });
  }
  const at = new THREE.Vector3(0, 0, -6).applyQuaternion(camera.quaternion).add(camera.getWorldPosition(new THREE.Vector3()));
  for (const l of keyLights) if (l.visible) { // (a light inside a set lives in the set's coordinates)
    l.target.position.copy(at); l.target.parent?.worldToLocal(l.target.position);
    l.position.copy(at).addScaledVector(l.userData.dir, 70); l.parent?.worldToLocal(l.position); l.updateMatrixWorld(); l.target.updateMatrixWorld(); }
}
const torches = [];
const keyLight = new THREE.PointLight(0xffe2c4, 0, 6, 1.6); scene.add(keyLight);
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
// real scanned surfaces (pbr.js): polished marble underfoot, marble columns, plastered walls, worn stone, old planks
const M = {
  marble: pbr("marble_01", {size: 2.4, rough: .55, tint: 0xe8e0d0}),
  stone: pbr("monastery_stone_floor", {size: 2.6, tint: 0xb8ad9a}),
  column: pbr("marble_01", {size: 1.3, rough: .7, tint: 0xf2ece0}),
  plaster: pbr("plastered_wall_02", {size: 3, tint: 0xe2d4ba}),
  wood: pbr("weathered_planks", {size: 2, tint: 0x8a7056}),
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
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 98 + BEACH), M.stone);
ground.rotation.x = -Math.PI / 2; ground.position.set(20, 0, (BEACH - 98) / 2); scene.add(ground);
// The bank runs down to the water as a beach: the paving stops at a low marble kerb, and pale sand slopes away under
// the river, darker and smoother where the water has wetted it.
const kerb = new THREE.Mesh(new THREE.BoxGeometry(240, .1, .5), M.marble); kerb.position.set(20, .02, BEACH); scene.add(kerb);
// the sand's surface: the walked slope, a waterline that wanders (the sand rises and falls a little along the shore,
// so the water reaches further in some places), and on down under the river
const beachY = (x, z) => sandY(z) + (Math.sin(x * .31) * .07 + Math.sin(x * .83 + 1.3) * .04 + Math.sin(x * 2.1 + 4) * .015) * smooth(SHORE - 5, SHORE - 2, z) - .6 * smooth(SHORE + 2, SHORE + 10, z);
const beach = (() => {
  const geo = new THREE.PlaneGeometry(240, 32, 480, 96); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + 20, z = pos.getZ(i) + BEACH + 16;
    // the walked slope, then on down under the water; small wind ripples on the dry sand, none where it's wet
    const dry = 1 - smooth(SHORE - 2.5, SHORE - .3, z), ripple = (Math.sin(x * 2.1 + Math.sin(z * .7) * 2) * .5 + .5) * .012 * dry;
    pos.setY(i, beachY(x, z) + ripple + (z < BEACH + .3 ? .015 : 0));
    const k = .62 + .38 * dry; col[i * 3] = k; col[i * 3 + 1] = k * .99; col[i * 3 + 2] = k * .97;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, pbr("coast_sand_01", {size: 2.4, tint: 0xb0a490, vc: true, bump: 1.2}));
  m.position.set(20, 0, BEACH + 16); m.receiveShadow = true; scene.add(m); return m;
})();
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
const water = new Water(new THREE.PlaneGeometry(240, 146), {
  textureWidth: LITE ? 256 : 512, textureHeight: LITE ? 256 : 512, waterNormals, sunDirection: moon.position.clone().normalize(),
  sunColor: 0x9fc8d8, waterColor: 0x020d10, distortionScale: 1.1, fog: true
});
water.rotation.x = -Math.PI / 2; water.position.set(20, -.32, SHORE + 67); scene.add(water);
// The river of the dead glows: dark glassy water that mirrors the torches, and waves that light up electric blue as
// they roll in and break on the sand (as plankton does on a night beach), a bright line where each one runs up the
// beach and slides back, and a glitter of sparks in the foam.
water.material.uniforms.glow = {value: new THREE.Color(0x1d6cff)};
water.material.uniforms.deep = {value: new THREE.Color(0x010818)};
water.material.fragmentShader = water.material.fragmentShader.replace("vec3 outgoingLight = albedo;", `
  vec3 wp = worldPosition.xyz;
  float d = max(wp.z - ${(SHORE - .4).toFixed(1)}, 0.0), T = time * 2.4; // (from the waterline on the sand)
  float bend = sin(wp.x * .23) * 1.4 + sin(wp.x * .071 + 2.) * 2.2;
  // crests rolling in toward the shore, broken into pieces along their length
  float ph = d * 1.35 + T + bend, crest = pow(.5 + .5 * sin(ph), 28.);
  float brk = smoothstep(-.2, .7, sin(wp.x * 1.9 + bend * 2. + floor(ph / 6.2832) * 1.7) * .6 + sin(wp.x * 4.3 - T * .5) * .4);
  float zone = exp(-d / 6.) * (.35 + .65 * smoothstep(.2, 2.5, d));
  // the swash: each wave's edge running up the sand and back
  float reach = .55 + .45 * sin(T * .45 + wp.x * .12 + bend * .3);
  float edge = smoothstep(.18, 0., abs(d - reach)) * (.5 + .5 * brk), wet = step(d, reach) * .08;
  // sparks in the foam
  vec2 cell = floor(wp.xz * 9.);
  float hs = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float spark = step(.965, hs) * (.5 + .5 * sin(time * 9. + hs * 60.)) * (crest + edge);
  float rip = clamp(.5 + (surfaceNormal.x + surfaceNormal.z) * 5.0, 0.0, 1.0);
  vec3 tint = mix(deep, glow * .06, exp(-d / 9.));
  vec3 blue = vec3(.16, .55, 1.6);
  vec3 outgoingLight = albedo * .55 + tint * (.4 + rip * .5) + blue * (crest * brk * zone * 1.1 + (edge + wet) * .9 + spark * 1.6);`).replace("uniform vec3 waterColor;", "uniform vec3 waterColor; uniform vec3 glow; uniform vec3 deep;");
// Blue sparks on the wet sand, where the waves have left the glow behind.
const sparkU = {time: {value: 0}};
{ const n = LITE ? 1500 : 5000, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = -60 + Math.random() * 160, z = SHORE - 1.8 + Math.pow(Math.random(), .7) * 2.2; pos.set([x, beachY(x, z) + .015, z], i * 3); seed[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({uniforms: sparkU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float seed; uniform float time; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        vA = pow(max(0., sin(time * (.6 + seed * 1.8) + seed * 40.)), 6.); gl_PointSize = min(5., (1. + seed * 1.5) * 9. / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard; gl_FragColor = vec4(vec3(.25, .65, 1.6) * vA * smoothstep(.5, 0., r), 1.); }`});
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); }
// The sky over the river: deep blue-black, thick with stars, and the Milky Way across it. It follows the camera, so
// it is always infinitely far away.
const starDome = new THREE.Mesh(new THREE.SphereGeometry(380, 48, 24), new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `varying vec3 vD;
    float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float n(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
    float stars(vec3 d, float scale, float th){ vec3 p = d * scale, c = floor(p); float r = h(c); if (r < th) return 0.;
      vec3 o = c + .5 + (vec3(h(c + 7.), h(c + 13.), h(c + 29.)) - .5) * .6; return smoothstep(.09, 0., length(p - o)) * (r - th) / (1. - th); }
    void main(){ vec3 d = normalize(vD); float up = smoothstep(-.05, .25, d.y);
      float band = dot(d, normalize(vec3(.35, .55, .76))), mw = exp(-band * band / .03);
      float cloud = n(d * 6.) * .6 + n(d * 14.) * .3 + n(d * 31.) * .1, dust = smoothstep(.45, .8, n(d * 9. + 3.));
      vec3 col = mix(vec3(.004, .008, .02), vec3(.02, .03, .07), up);
      col += vec3(.18, .2, .32) * mw * cloud * (1. - dust * .7) * up;
      col += vec3(.35, .25, .3) * pow(mw, 4.) * cloud * up * .5;
      float s = stars(d, 220., .985) + stars(d, 420., .99) * .7 + stars(d, 420., .96) * mw * .8;
      col += vec3(.85, .9, 1.) * s * up * 1.6;
      gl_FragColor = vec4(col, 1.); }`}));
starDome.renderOrder = -1; scene.add(starDome);
// Light thrown up by the glowing river onto the beach, the dock and anyone standing near the water (faint and cold).
for (const x of [-30, -6, 18, 42, 66]) { const l = new THREE.PointLight(0x2a78ff, 3.2, 14, 1.6); l.position.set(x, .2, SHORE + 2); scene.add(l); }
// Mist lying on the river in slow drifting banks, thicker in the distance.
const mistU = {time: {value: 0}};
{ const mat = new THREE.ShaderMaterial({uniforms: mistU, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float time; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vW.xz * .06 + vec2(time * .012, time * .004);
        float m = n(p) * .55 + n(p * 2.3 + 5.) * .3 + n(p * 5.1 - time * .02) * .15;
        float far = smoothstep(${(SHORE + 2).toFixed(1)}, ${(SHORE + 40).toFixed(1)}, vW.z);
        float a = smoothstep(.55, .9, m) * .08 * far; // (only far out: near the shore it turned the glowing water milky)
        gl_FragColor = vec4(vec3(.14, .2, .34), a); }`});
  const sheets = []; for (let i = 0; i < 4; i++) { const sheet = new THREE.Mesh(new THREE.PlaneGeometry(260, 150), mat); sheet.rotation.x = -Math.PI / 2; sheet.position.set(20, -.1 + i * .35, SHORE + 72); sheet.renderOrder = 5; scene.add(sheet); sheets.push(sheet); }
  // the river mirrors the torches and the arcade, not the mist lying on it
  const mirror = water.onBeforeRender; water.onBeforeRender = (...a) => { sheets.forEach(m => m.visible = false); mirror.apply(water, a); sheets.forEach(m => m.visible = true); }; }
// Pale lights hanging over the water: the souls waiting to cross, drifting and bobbing.
const souls = (() => {
  const n = LITE ? 30 : 70, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = -60 + Math.random() * 160; pos[i * 3 + 1] = .3 + Math.random() * 2.2; pos[i * 3 + 2] = SHORE + 4 + Math.random() * 90; seed[i] = Math.random() * 100; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const pts = new THREE.Points(geo, new THREE.ShaderMaterial({uniforms: mistU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float time; attribute float seed; varying float vA;
      void main(){ vec3 p = position + vec3(sin(time * .2 + seed) * 1.5, sin(time * .7 + seed * 3.) * .25, cos(time * .15 + seed) * 1.2);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        vA = .5 + .5 * sin(time * 1.3 + seed * 7.); gl_PointSize = (520. / -mv.z) * (.6 + vA * .6); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); float g = smoothstep(.5, 0., d); gl_FragColor = vec4(vec3(.55, .9, 1.) * (g * g * .55 + smoothstep(.1, 0., d) * .9) * (.35 + vA * .6), 1.); }`}));
  scene.add(pts); return pts;
})();
const far = new THREE.Mesh(new THREE.PlaneGeometry(320, 90), new THREE.MeshBasicMaterial({map: tex(LIB + "styx/patinir-styx.jpg"), color: 0x6b6258, fog: false}));
far.position.set(20, 28, 150); far.rotation.y = Math.PI; far.visible = false; scene.add(far); // (a flat picture in the sky read as a broken slab from the side: the dark and the mist do better)

/* ---------- the arcade: columns, arches, painted vaults ---------- */
const VAULTS = ["styx/last-judgment.jpg", "styx/giordano-charon.jpg", "styx/raphael-wedding-banquet.jpg", "styx/giordano-proserpina.jpg", "styx/signorelli-resurrection.jpg", "styx/brueghel-orpheus-pluto.jpg"];
const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(76, .3, 9), M.marble); floorSlab.position.set(0, -.14, 4); scene.add(floorSlab);
const back = new THREE.Mesh(new THREE.BoxGeometry(76, 9.5, .6), M.plaster); back.position.set(0, 4.75, -.3); scene.add(back);
boxes.push([-38, -1, 38, .3]);
for (let i = 0; i < 6; i++) {
  const xc = -36 + i * 12 + 6;
  // a flat coffered ceiling, with the painting set into it as a framed panel
  // (quadro riportato, the way the Farnese and Sistine ceilings do it), at its true proportions
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 8.6), pbr("plastered_wall_02", {size: 3, tint: 0xcabba0}));
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
  const y = sandY(z); stand.position.set(x, y + .55, z); bowl.position.set(x, y + 1.2, z); scene.add(stand, bowl);
  const coals = new THREE.Mesh(new THREE.SphereGeometry(.32, 10, 6), new THREE.MeshBasicMaterial({color: 0xff7a2a})); coals.scale.y = .35; coals.position.set(x, y + 1.38, z); scene.add(coals);
  const l = new THREE.PointLight(0xff8a3a, 26, 16, 1.6); l.position.set(x, y + 1.9, z); scene.add(l); torches.push({l, base: 26, seed: x});
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

/* ---------- the temple (built in temple.js), its two stone chairs, and the altar ---------- */
const STEP = .6;
const onTemple = p => p.x > 45 && p.x < 67 && p.z > -5 && p.z < 13;
const temple = buildTemple(scene, {M, STEP, circles});
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
  // solid, except where one would block the way from the temple to the coin (that path must stay open)
  const rr = r.geometry.parameters.radius * 1.1, ax = 65.5, az = 12.5, bx = PLACES.coinSpot.x, bz = PLACES.coinSpot.z;
  const t = Math.max(0, Math.min(1, ((r.position.x - ax) * (bx - ax) + (r.position.z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
  if (Math.hypot(r.position.x - (ax + (bx - ax) * t), r.position.z - (az + (bz - az) * t)) > rr + 1.1) circles.push([r.position.x, r.position.z, rr * .8]);
}
const lairGlow = new THREE.PointLight(0xff4a1a, 22, 14, 1.8); lairGlow.position.set(PLACES.dogHome.x, 1.2, PLACES.dogHome.z - 1); scene.add(lairGlow);

/* ---------- the way up: a sea cave of layered sandstone at the west end of the bank, opening on a sunrise ---------- */
{
  sandstoneTunnel(scene, {x0: -36.5, x1: -56, z: 13, r: 4.3});
  const view = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), new THREE.MeshBasicMaterial({map: sunrise(), fog: false}));
  view.position.set(-56.6, 3.3, 13); view.rotation.y = Math.PI / 2; scene.add(view);
  // boulders heaped over the cave, so from the river it reads as a cliff
  // (kept above the cave's roof, which reaches about 8.5 m, and back from the sea mouth, so none of them hang inside it)
  for (let i = 0; i < 22; i++) { const r = 2 + Math.random() * 3, m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), new THREE.MeshStandardMaterial({color: 0x2c2420, roughness: .95, flatShading: true})); m.position.set(-39 - Math.random() * 13, 8.6 + r * .75 + Math.random() * 2, 13 + (Math.random() - .5) * 16); m.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(m); }
  const sun = new THREE.PointLight(0xffa860, 46, 28, 1.3); sun.position.set(-52, 3.2, 13); scene.add(sun);
  const bounce = new THREE.PointLight(0xff7a3a, 14, 14, 1.6); bounce.position.set(-43, 1.4, 13); scene.add(bounce);
  // a rough face of rock around the mouth, so the cave sits in a cliff
  const rock = new THREE.MeshStandardMaterial({color: 0x3a2a20, roughness: .95});
  for (let i = 0; i < 16; i++) {
    const r = 1.6 + Math.random() * 2.4, a = i / 16 * Math.PI * 2, m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rock);
    const ring = 4.7 + r * .75; m.position.set(-37.2 - Math.random(), 2.7 + Math.sin(a) * ring, 13 + Math.cos(a) * ring); /* outside the opening, never across it */ m.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(m);
  }
}

/* ---------- the far bank (built in farbank.js) ---------- */
const nearLights = []; scene.traverse(o => { if ((o.isPointLight || o.isSpotLight) && o !== keyLight) nearLights.push(o); }); // (spotlights too: the temple's stayed lit through the wedding)
const farLights = [];
const farWorld = buildFarBank({scene, boxes, circles, noise, tex, LIB, lights: farLights});
let farOn = false;
function setLightsFar(far) { farOn = far; nearLights.forEach(l => l.visible = !far); farLights.forEach(l => l.visible = far); sky.intensity = far ? .9 : .55; }

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
const REAL = ["hermes", "charon", "mikon", "orpheus", "elpenor", "theseus", "pirithous", "hades", "sisyphus", "persephone", "eurydice", "demeas", "nikias", "lykon", "piper", "aunt", "thea", "dancer"];
const ASSETS = {}, CLIPS = {};
const TOON_F = ["persephone", "eurydice", "aunt", "thea", "dancer"];
const TOON_V = 4; // bump when a character file changes, so no browser keeps an old one
async function loadAssets(progress) {
  const list = ["head_male", "body_female", "hair_buns", "hair_beard", "hair_long", "hair_simpleparted", "hair_buzzed", "anims",
    ...REAL.map(n => "rb/" + n), "rb/anims_m", "rb/anims_f", "rb/anims_mx", "rb/anims_fx",
    ...Array.from({length: 10}, (_, i) => "crowd/m" + i), ...Array.from({length: 9}, (_, i) => "crowd/f" + i)];
  // the animated-film cast: one character model each for the women and the men, dressed and coloured per person
  for (const n of REAL) list.splice(list.indexOf("rb/" + n), 1);
  for (const n of list.filter(n => n.startsWith("crowd/"))) list.splice(list.indexOf(n), 1);
  list.push("toon/rain", "toon/snow", "toon/cerberus", "toon/chiton_short", ...PROPS.map(n => "props/" + n));
  let done = 0;
  await Promise.all(list.map(async n => { ASSETS[n.replace("rb/", "rb_").replace("crowd/", "crowd_").replace("toon/", "toon_").replace("props/", "props_")] = await gltf.loadAsync(`assets/${n}.glb${n.startsWith("toon/") ? "?v=" + TOON_V : ""}`); progress(++done / list.length); }));
  prepareToon(ASSETS.toon_rain); prepareToon(ASSETS.toon_snow); prepareToon(ASSETS.toon_chiton_short); // (the tunic's bones renamed as the body's are)
  for (const n of REAL) ASSETS["rb_" + n] = TOON_F.includes(n) ? ASSETS.toon_rain : ASSETS.toon_snow;
  for (let i = 0; i < 9; i++) ASSETS["crowd_f" + i] = ASSETS.toon_rain;
  for (let i = 0; i < 10; i++) ASSETS["crowd_m" + i] = ASSETS.toon_snow;
  for (const a of ASSETS.anims.animations) CLIPS[a.name] = a;
  dressWorld();
  rigHound(hound, ASSETS.toon_cerberus); // the real dog takes over from the puppet
}
// The real objects: scanned boulders in place of the placeholder rocks; tall clay jars along the arcade between the
// columns, as a Greek stoa would keep them.
function dressWorld() {
  rockify(scene, ASSETS);
  temple.addIcarus(ASSETS);
  for (let i = 0; i < 6; i++) { const x = -36 + i * 12 + 6;
    place(ASSETS, i % 2 ? "antique_ceramic_vase_01" : "ceramic_vase_02", scene, x - 3.2, 0, .55, .95, {tint: 0xd8b89a});
    place(ASSETS, "ceramic_vase_02", scene, x + 3.4, 0, .5, .7, {tint: 0xc8a888}); }
}
// the same for the wedding set and its meadow, once they're built
function dressWedding() {
  if (!wedding || wedding.dressed) return; wedding.dressed = true;
  rockify(wedding.g, ASSETS);
  const g = wedding.g;
  for (const [x, z] of [[-16.6, -12.6], [-16.6, 12.6], [16.6, -12.6], [16.6, 12.6], [12, 13], [-6, 13]]) place(ASSETS, x > 0 ? "antique_ceramic_vase_01" : "ceramic_vase_02", g, x, 0, z, 1.05, {tint: 0xe0c0a0});
  for (const [x, z, h] of [[28, -9, 1.1], [42, -3, .9], [35, 16, 1.2], [48, 10, 1], [23, 13, .8], [60, -14, 1.3], [33, 6.5, .7]]) place(ASSETS, "shrub_02", g, x, groundHeight(x, z), z, h);
  for (const [x, z] of [[31, 9.6], [37, 13.8], [45, 8.7], [27, 12.9]]) place(ASSETS, "fern_02", g, x, -.05, z, .7);
  // The table, laid with real things: the plates, cups and fruit that were drawn as plain shapes become carved wooden
  // plates, brass goblets and pomegranates, each put where the shape stood (in the same group, so the funeral clears them)
  const swap = [], P = (o, k) => o.geometry?.parameters?.[k];
  g.traverse(o => { if (!o.isMesh || !o.geometry) return; const t = o.geometry.type;
    if (t === "CylinderGeometry" && ((P(o, "radiusTop") === .16 && P(o, "radiusBottom") === .12) || (P(o, "radiusTop") === .15 && P(o, "radiusBottom") === .11))) swap.push([o, "plate"]);
    else if (t === "CylinderGeometry" && P(o, "radiusTop") === .07 && P(o, "radiusBottom") === .03) swap.push([o, "cup"]);
    else if (t === "SphereGeometry" && P(o, "radius") === .035 && o.material?.color?.getHex() === 0x5a2a4a) swap.push([o, "fruit"]); });
  let k = 0;
  for (const [o, kind] of swap) {
    const y = Math.max(.793, o.position.y - (kind === "fruit" ? .03 : P(o, "height") / 2)), yaw = Math.random() * 6.3; // (on top of the cloth, never in it: a plate sunk into it showed only its rim)
    if (kind === "plate") place(ASSETS, "carved_wooden_plate", o.parent, o.position.x, y, o.position.z, .032, {yaw});
    else if (kind === "cup") place(ASSETS, "brass_goblets#brass_goblet_0" + (1 + k++ % 3), o.parent, o.position.x, y, o.position.z, .17, {yaw});
    else if (k++ % 2) place(ASSETS, "food_pomegranate_01", o.parent, o.position.x, y, o.position.z, .085, {yaw});
    o.visible = false;
  }
  // brass candelabra on the tables, lit; on the long side tables between the bread, at the two ends of the high one
  for (const tz of [-5.2, 5.2]) for (const x of [-.85, 1.55]) place(ASSETS, "brass_candleholders#brass_candleholder_03", g, x, .785, tz, .62, {yaw: Math.random() < .5 ? 0 : Math.PI});
  for (const x of [-2.75, 2.75]) place(ASSETS, "brass_candleholders#brass_candleholder_02", g, x, .785, 0, .36, {yaw: Math.PI / 2});
  // a clay jug of wine on each side table
  for (const tz of [-5.2, 5.2]) place(ASSETS, "ceramic_vase_04", g, .45, .785, tz + .05, .3, {tint: 0xd8c8b0});
  // plants in clay pots by the gate and the colonnade, and trees beyond the walls, their crowns over the top
  for (const [x, z] of [[16.9, -3.7], [16.9, 3.7], [-16.9, -13], [-16.9, 13]]) place(ASSETS, "potted_plant_02", g, x, 0, z, .9);
  for (const [x, z, h] of [[-8, 17.5, 6.5], [6, -17.8, 7], [13.5, 17.2, 6]]) place(ASSETS, "tree_small_02", g, x, 0, z, h);
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
  hound.g.position.y += sandY(dog.pos.z);
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
    master = actx.createGain(); master.gain.value = .9;
    this.muffle = actx.createBiquadFilter(); this.muffle.type = "lowpass"; this.muffle.frequency.value = 20000;
    master.connect(this.muffle).connect(actx.destination);
    const b = actx.createBuffer(2, actx.sampleRate * 4, actx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
    const n = actx.createBufferSource(); n.buffer = b; n.loop = true;
    // the river: no steady hiss. Slow waves wash in and draw back, darker as they go, with small laps at the edge between.
    this.river = actx.createGain(); this.river.gain.value = .3; this.river.connect(master);
    const wash = actx.createBiquadFilter(); wash.type = "lowpass"; wash.frequency.value = 240; wash.Q.value = .4;
    const swell = actx.createGain(); swell.gain.value = .04; n.connect(wash).connect(swell).connect(this.river); n.start();
    const lap = at => { const x = this.noise(.5), bf = actx.createBiquadFilter(), g = actx.createGain();
      bf.type = "bandpass"; bf.frequency.value = 260 + Math.random() * 260; bf.Q.value = 1.4;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.05 + Math.random() * .05, at + .05); g.gain.setTargetAtTime(0, at + .06, .09);
      x.connect(bf).connect(g).connect(this.river); x.start(at); x.stop(at + .5); };
    const wave = () => {
      const t = actx.currentTime, up = 1.6 + Math.random() * 1.4, down = 2.6 + Math.random() * 2.4;
      swell.gain.cancelScheduledValues(t); swell.gain.setValueAtTime(swell.gain.value, t);
      swell.gain.linearRampToValueAtTime(.3 + Math.random() * .35, t + up); swell.gain.setTargetAtTime(.04, t + up, down / 3);
      wash.frequency.cancelScheduledValues(t); wash.frequency.setValueAtTime(wash.frequency.value, t);
      wash.frequency.linearRampToValueAtTime(700 + Math.random() * 500, t + up); wash.frequency.setTargetAtTime(200, t + up, down / 3);
      for (let i = 0, k = Math.floor(Math.random() * 3); i < k; i++) lap(t + up + .4 + Math.random() * down);
      setTimeout(wave, (up + down + Math.random() * 1.5) * 1000);
    };
    wave();
    const vsrc = actx.createMediaElementSource($("#voice"));
    this.voiceMeter = actx.createAnalyser(); this.voiceMeter.fftSize = 512; vsrc.connect(this.voiceMeter); this.voiceBuf = new Float32Array(512);
    const room = actx.createConvolver(), len = actx.sampleRate * 1.8, ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    room.buffer = ir; const wet = actx.createGain(); wet.gain.value = .16;
    // voices in the world go through the mix (so they can be muffled); narration can bypass it and stay clear
    this.vWet = actx.createGain(); this.vDry = actx.createGain(); this.vDry.gain.value = 0;
    vsrc.connect(this.vWet).connect(master); this.vWet.connect(room).connect(wet).connect(master); vsrc.connect(this.vDry).connect(actx.destination);
  },
  noise(s) { const b = actx.createBuffer(1, actx.sampleRate * s, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const x = actx.createBufferSource(); x.buffer = b; return x; },
  env(node, peak, a, d, at) { const g = actx.createGain(); at = at ?? actx.currentTime; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(.0001, at + a + d); node.connect(g).connect(master); },
  // footsteps that sound like what you're walking on
  step(kind, vol = 1) {
    if (!actx) return; if (kind === true) kind = "water"; if (kind === false) kind = "stone";
    const n = this.noise(.16), f = actx.createBiquadFilter(), v = .85 + Math.random() * .3;
    const S = {water: ["bandpass", 1300, .25, .14], wood: ["bandpass", 520, .3, .07], marble: ["highpass", 1800, .1, .05], sand: ["bandpass", 2400, .13, .09], stone: ["lowpass", 380 + Math.random() * 120, .17, .09]}[kind] || ["lowpass", 360, .16, .1];
    f.type = S[0]; f.frequency.value = S[1]; f.Q.value = kind === "wood" ? 4 : 1; n.connect(f); this.env(f, S[2] * vol * v, .004, S[3]); n.start();
    if (kind === "wood") { const o = actx.createOscillator(); o.frequency.value = 140 + Math.random() * 30; this.env(o, .06 * vol, .002, .08); o.start(); o.stop(actx.currentTime + .1); }
  },
  breath() { if (!actx || Math.random() < .5) return; const n = this.noise(.5), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; f.Q.value = .7; n.connect(f); this.env(f, .035, .12, .3); n.start(); },
  splash() { if (!actx) return; const n = this.noise(1.2), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, actx.currentTime); f.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 1); n.connect(f); this.env(f, .7, .02, .9); n.start(); },
  bark() { if (!actx) return; [0, .18, .36, .7].forEach((d, i) => { const at = actx.currentTime + d, o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(200 - i * 25, at); o.frequency.exponentialRampToValueAtTime(70, at + .2); const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; o.connect(f); this.env(f, .55, .01, .22, at); o.start(at); o.stop(at + .3); }); },
  growl(level) { if (!actx) return; const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 42 + Math.random() * 12; const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 150; o.connect(f); this.env(f, .55 * level, .08, .55); o.start(); o.stop(actx.currentTime + .7); },
  hit() { if (!actx) return; const o = actx.createOscillator(); o.frequency.setValueAtTime(120, actx.currentTime); o.frequency.exponentialRampToValueAtTime(26, actx.currentTime + 1); this.env(o, 1, .005, 1.1); o.start(); o.stop(actx.currentTime + 1.2); const n = this.noise(.6); this.env(n, .7, .002, .5); n.start(); },
  // a wedding: a piper on the double pipes (the crowd used to be pulsing static; gone)
  party(on) {
    if (!actx) return;
    if (!on) { this.partyStop?.(); this.partyStop = null; return; }
    const out = actx.createGain(); out.gain.value = .0; out.connect(master); out.gain.linearRampToValueAtTime(.5, actx.currentTime + 2);
    const tune = [62, 64, 65, 67, 69, 67, 65, 64, 62, 60, 62, 64, 65, 64, 62, 62], beat = .32; let k = 0, stop = false;
    const note = () => { if (stop) return; const at = actx.currentTime + .02, fq = 440 * Math.pow(2, (tune[k % tune.length] - 69) / 12);
      for (const d of [0, 7]) { const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.value = fq * Math.pow(2, d / 1200 * 12 * (d ? 1 : 0)) * (d ? 1.498 : 1); const bf = actx.createBiquadFilter(); bf.type = "bandpass"; bf.frequency.value = 1400; bf.Q.value = 1.2; const gg = actx.createGain(); gg.gain.setValueAtTime(0, at); gg.gain.linearRampToValueAtTime(d ? .03 : .06, at + .04); gg.gain.linearRampToValueAtTime(0, at + beat * .95); o.connect(bf).connect(gg).connect(out); o.start(at); o.stop(at + beat); }
      k++; setTimeout(note, beat * 1000); };
    note();
    this.partyStop = () => { stop = true; out.gain.linearRampToValueAtTime(0, actx.currentTime + 1.5); setTimeout(() => out.disconnect(), 1600); };
  },
  // birdsong in a spring meadow; birds() with no argument stops it
  birds(on) {
    if (!actx) return; clearInterval(this.birdT); if (!on) return;
    this.birdT = setInterval(() => { if (Math.random() < .5) return; const at = actx.currentTime, o = actx.createOscillator(), f0 = 2400 + Math.random() * 1800; o.frequency.setValueAtTime(f0, at); for (let k = 1; k < 5; k++) o.frequency.linearRampToValueAtTime(f0 * (k % 2 ? 1.25 : .9), at + k * .05); this.env(o, .025, .01, .25, at); o.start(at); o.stop(at + .3); }, 260);
  },
  cheer() { if (!actx) return; for (let i = 0; i < 9; i++) { const at = actx.currentTime + i * .06, n = this.noise(.5), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 600 + Math.random() * 900; n.connect(f); this.env(f, .14, .05, .5, at); n.start(at); } },
  cough() { if (!actx) return; [0, .32, .6, 1.1].forEach(d => { const at = actx.currentTime + d, n = this.noise(.25), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 800; f.Q.value = 1.5; n.connect(f); this.env(f, .5, .01, .2, at); n.start(at); }); },
  heart() { if (!actx) return; for (let i = 0; i < 6; i++) for (const d of [0, .18]) { const at = actx.currentTime + i * .9 + d, o = actx.createOscillator(); o.frequency.value = 52; this.env(o, .5, .01, .2, at); o.start(at); o.stop(at + .3); } },
  narration(on) { if (!this.vWet) return; this.vWet.gain.value = on ? 0 : 1; this.vDry.gain.value = on ? 1 : 0; },
  setMuffle(hz, secs = 1) { if (this.muffle) this.muffle.frequency.linearRampToValueAtTime(hz, actx.currentTime + secs); },
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
const voiceEl = $("#voice"), storyEl = $("#story");
let skipLine = null, choicePick = null, talkingTo = null;
/* a hidden tab goes quiet, and the line being spoken waits until you're back */
document.addEventListener("visibilitychange", () => {
  if (!actx) return;
  if (document.hidden) { actx.suspend(); voiceEl.pause(); $("#clip").pause(); }
  else { actx.resume(); if (voiceEl.currentTime > 0 && !voiceEl.ended) voiceEl.play().catch(() => {}); const c = $("#clip"); if (c.currentSrc && c.currentTime > 0 && !c.ended) c.play().catch(() => {}); }
});
const camShot = {active: false, pos: new THREE.Vector3(), look: new THREE.Vector3()};
function frameOn(p, side = 1) { // over-the-shoulder close-up
  shot.cur = null;
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
  grotto: {pos: V(68.2, 2.1, 18.6), look: V(71.8, .6, 12.4)},
  altar:  {pos: V(56, 2.3, 13.2), look: V(56, 1.7, 9)},
  river:  {pos: V(-20, 3, 14), look: V(0, -.3, 40)},
  chairs: {pos: V(56, 2.2, 4.5), look: V(56, 1.3, -1)}
};
function cutTo(name) { shot.cur = null; const c = CUTS[name]; camShot.pos.copy(c.pos); camShot.look.copy(c.look); camShot.active = true; camShot.snap = true; }
async function line(who, id, text, cut) {
  const p = NPC[who], heard = cut === "voice" || cut === "vo"; // "voice": heard, not seen; "vo": narration, clear of the world's sound
  sound.narration(cut === "vo");
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
  sound.narration(false);
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
    await say("hermes", "v4_h1", "Easy. Easy, sit up slowly. You'll feel cold for a while. That passes.");
    await say("mikon", "v4_m1", "Where... The wedding. I was at the wedding. Thea was about to dance.");
    await say("hermes", "v4_h2", "You were. And then you laughed with an olive in your mouth. I'm sorry, Mikon. You died at your cousin's wedding.");
    await say("mikon", "v4_m2", "I died. At a wedding. In front of everyone.");
    await say("hermes", "v4_h3", "In front of everyone. Though, if it's any comfort, most of them were looking at the lamb.");
    await say("mikon", "v4_m3", "Who are you?");
    await say("hermes", "v4_h4", "Hermes. I carry messages for the gods, and when someone dies, I walk them down here. You're my third today.");
    await say("mikon", "v4_m4", "And where is here?");
    await say("hermes", "v4_h5", "The bank of the River Styx. The dead cross on that ferry, at the end of the dock. The ferryman is Charon, and he takes one coin from every passenger. Your family should have put one under your tongue.", "ferry");
    await say("mikon", "v4_m5", "And they didn't.");
    await say("hermes", "v4_h6", "Nobody remembered. It happens more often than you'd think. Without a coin, you wait on this bank. A hundred years. That's the law, and Charon has never once broken it.", "charon");
    await say("mikon", "v4_m6", "A hundred years.");
    await say("hermes", "v4_h7", "Unless you find a coin. There is one, in the cave beyond the old temple, but a dog sleeps on it. Three heads, and a nose that can smell bronze through stone. If he wakes, get into the river. He won't follow you into the water.", "grotto");
    await say("mikon", "v4_m7", "You're very calm about all of this.");
    await say("hermes", "v4_h8", "I've had a lot of practice. Go and find the sailor down by the water. His name is Elpenor, and he's been here long enough to know where everything is. Good luck, Mikon. I mean that.", "river");
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
    if (me.met.hermes) await say("elpenor", "v4_e0", "Did Hermes walk you down? Check your sandals. On the day he was born he stole fifty of Apollo's cattle and made them walk backwards so nobody could follow the tracks.");
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
function grabMouse() { if (!touchMode && !talking && !ended) canvas.requestPointerLock?.()?.catch?.(() => {}); } // (refused inside some frames; the game still plays)
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
  if (t) return {kind: "trinket", obj: t, label: {water: "reach into the water", urn: "open the urn", chest: "open the box", pouch: "look in the pouch", stone: "look under the stone", crack: "look in the crack", flower: "pick the flower", falling: "catch the leaf"}[t.t.hide] || "look closer"};
  return chap.nearby();
}
function interact() {
  const n = nearby(); if (!n) return;
  if (n.kind === "trinket") return earnTrinket(n.obj);
  if (CH !== 1) return chap.interact(n);
  if (n.kind === "coin") { if (me.coin) return toast("One coin is plenty."); pickCoin(n.obj); }
  else if (n.kind === "cake") pickCake();
  else if (n.kind === "throw") throwCake();
  else conversation(n.id);
}
let foundT;
// Nothing is just lying around: each find is behind a small trial.
async function earnTrinket(o) {
  if (o.busy) return; o.busy = true;
  talking = true; releaseMouse(); $("#prompt").classList.remove("on");
  const ok = await trial(o.t.trial);
  talking = false; o.busy = false;
  if (ok) { trinkets.reveal(o); trinkets.take(o); sound.chime(); showFound(o.t); paintStats(); clearTimeout(foundT); foundT = setTimeout(() => $("#found").classList.remove("on"), 12000); }
  else toast("Not this time. You can try again.", 2200);
  if (playing && !ended) grabMouse();
}
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
      stepT -= dt; if (stepT <= 0) { sound.step(wet ? "water" : onDock(me.pos) || onFarDock(me.pos) ? "wood" : me.pos.z > FAR.hallZ ? "marble" : me.pos.z > BEACH && me.pos.z < 40 ? "sand" : "stone"); if (speed > 5) sound.breath(); stepT = wet ? .7 : (speed > 5 ? .3 : .45); }
    }
    if (wet && !wasWet) { sound.splash(); me.splashed++; paintStats(); if (dog.mode === "hunt") toast("It won't follow you into the river."); }
    wasWet = wet;
    if (!greeted && NPC.hermes && flat(me.pos).distanceTo(NPC.hermes.pos) < 4.5) { greeted = true; chap.conversation("hermes"); }
    const n = nearby(), pr = $("#prompt");
    if (n && !(n.id === "hermes" && !greeted)) { pr.textContent = (touchMode ? "" : "E · ") + n.label; pr.classList.add("on"); } else pr.classList.remove("on");
    chap.update(dt, now);
  }
  chap.always?.(dt, now);
  trinkets?.animate(now, me.pos.x, me.pos.z);
  const h = NPC.hermes;
  if (h?.leaving) { h.root.position.x += dt * 1.6; h.root.position.z += dt * .9; h.root.position.y = sandY(h.root.position.z); h.root.rotation.y = Math.atan2(1.6, .9); if (h.root.position.z > SHORE - 2) { h.root.visible = false; h.leaving = false; } }
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
  fpPos.set(me.pos.x, ride ? 1.95 : onDock(me.pos) ? 1.62 : (onTemple(me.pos) ? STEP : 0) + sandY(me.pos.z) + 1.62, me.pos.z);
  moveBody(dt);
  // in conversations and cutaways, a soft key light from beside the camera, the way films light a face
  // nobody blocks a shot: in a film shot, anyone whose head sits right on the line between the camera and the speaker
  // steps out of the picture until the shot moves on
  unblock(camShot.active);
  // the film passes (soft contact shadows, a shallow focus) only in film shots: each draws the scene again, which
  // halves the frame rate, too dear while you're walking
  if (ao) ao.enabled = camShot.active && camera.position.x < 200; // (not at the wedding: with its crowd, one more drawing of the scene is too many)
  if (lens) { lens.enabled = camShot.active; if (camShot.active) lens.uniforms.focus.value = camera.getWorldPosition(new THREE.Vector3()).distanceTo(camShot.look); }
  // a soft light from beside the camera, the way films keep a face lit: strong in a shot or a conversation, faint otherwise
  keyLight.intensity += ((camShot.active ? 4 : talking ? 3 : .9) - keyLight.intensity) * .15;
  { const cp = camera.getWorldPosition(new THREE.Vector3()), r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); keyLight.position.copy(cp).addScaledVector(r, .6).add(V(0, .45, 0)); }
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
  if (crowd && wedding?.lights[0]?.visible) { crowd.update(dt, now); wedding.animate(now); }
  if (orph) for (const p of Object.values(orph)) if (p.mixer && p.root.visible && !NPC.eury) p.mixer.update(dt);
  for (const l of farWorld.flicker) l.intensity = 30 * (.82 + Math.sin(now / 90 + l.position.x) * .07 + Math.random() * .1);
  for (const t of torches) t.l.intensity = t.base * (.82 + Math.sin(now / 90 + t.seed) * .07 + Math.random() * .1);
  coins.forEach(c => c.rotation.z = now / 600);
  boat.position.y = -.05 + Math.sin(now / 1100) * .05; boat.rotation.z = Math.sin(now / 1500) * .02;
  // the gate swings a little wider once the dog is asleep
  for (const [i, d] of farWorld.doors.entries()) d.rotation.y += ((i ? 1 : -1) * (dog.asleep ? 1.25 : .35) - d.rotation.y) * .02;
  if (NPC.charon) NPC.charon.root.position.y = .25 + Math.sin(now / 1100) * .05;
  water.material.uniforms.time.value += dt * .45;
  paint.uniforms.time.value = now / 1000; mistU.time.value = sparkU.time.value = now / 1000; starDome.position.copy(camera.position);
  // the wedding is a world of its own under its own sky, built off to one side: seen from outside that sky (from the
  // river) it would hang in the stars like a planet, so it's only drawn while the camera is inside it
  if (wedding) wedding.g.visible = camera.position.distanceTo(wedding.g.position) < 215;
  // the arch of white strands over the gate is drawn only from a few steps away: shots that pass through the gate
  // would otherwise look out through a thicket of white poles
  const arch = wedding?.g.userData.arch; if (arch) arch.visible = camera.position.distanceTo(wedding.g.localToWorld(arch.userData.center.clone())) > 3.4;
  sceneLight();
  if (!LITE) shadows(now);
  if (sound.river) sound.river.gain.value = camera.position.x > 200 || storyEl.classList.contains("on") ? 0 : .12 + Math.max(0, .7 - Math.abs(me.pos.z - SHORE) / 16); /* only at the river: silent at the weddings and over the storybook */
  PLAYER?.fpCut?.();
  for (const f of poses) f(now);
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
const INTROS = {
  1: {title: ["Chapter I", "The Coin"], who: "mikon", stand: [-16, 18.6, Math.PI], shots: [
    {id: "v2_i1", text: "My name is Mikon. I sold salt fish in the agora at Corinth for twenty-two years, and I was, by every account, fine at it.", face: "close"},
    {id: "v2_i2", text: "Last spring, at my cousin's wedding, I laughed at the wrong moment with an olive in my mouth. That's the whole story. There isn't a better version of it.", art: ["styx/diver-symposium.jpg", "styx/raphael-wedding-banquet.jpg"]},
    {id: "v2_i3", text: "Nobody put a coin under my tongue for the ferryman. They were busy. It was a wedding, and the lamb was getting cold.", art: ["styx/prothesis-pinax.jpg", "styx/obol-athens.jpg"]},
    {id: "v2_i4", text: "So this is where I am now. The bank of the River Styx, a ferry I can't afford, a dog that can smell money, and a hundred years to think about olives.", path: [[-10, 3, 14, 0, 1, 37.5], [10, 3.5, 30, 0, 1.5, 37.5], [62, 3, 21, 72, .8, 12], [66.5, 1.8, 17, 72, .6, 12]]},
    {id: "v2_i5", text: "Everyone you've ever heard of came through here. Heroes, kings, a man with a lyre. Nobody wrote down the people who were already waiting.", art: ["styx/theseus-peirithoos-relief.jpg", "styx/rubens-orpheus.jpg", "styx/testa-aeneas-styx.jpg"]},
    {id: "v2_i6", text: "This is the story of one of them.", face: "pull"}]},
  2: {title: ["Chapter II", "The Lyre"], who: "orpheus", stand: [-16, 18.6, Math.PI], far: [], shots: [
    {id: "v2_j1", text: "They say I could make rivers stop to listen. I never tried. I only ever wanted one person to listen, and she always did.", face: "close"},
    {id: "v2_j2", text: "Eurydice. We were married in the spring. That same afternoon she ran through the long grass by the river, laughing, and a snake was waiting in it.", face: "close"},
    {id: "v2_j3", text: "I sang at her funeral. Every bird in Thrace went quiet. It didn't help.", face: "pull"},
    {id: "v2_j4", text: "So I took the old road down at Taenarum, where the cliffs go into the sea, and I kept walking until the light ran out.", path: [[-53, 2.2, 13, -36, 1.5, 13], [-44, 1.9, 13, -30, 1.5, 13]]},
    {id: "v2_j5", text: "Nobody comes back from the Underworld. Everybody says so. But as far as I know, nobody has ever asked properly.", path: [[-6, 3, 26, 0, 2, 60], [6, 4, 33, 0, 2, 70]]},
    {id: "v2_j6", text: "I'm going to ask.", face: "close"}]}
};
let skipIntro = null;
async function playIntro(n) {
  const I = INTROS[n]; if (!I) return;
  talking = true; document.body.classList.add("talking", "cinema");
  let skipped = false; skipIntro = () => { skipped = true; skipLine?.(); };
  // the person you're about to play stands on the bank and tells you who they are
  staging = true;
  const [sx, sz, sy] = I.stand;
  PLAYER.root.position.set(sx, 0, sz); PLAYER.root.rotation.y = sy; PLAYER.setHead(true);
  const head = () => { const h = new THREE.Vector3(); PLAYER.bones.Head.getWorldPosition(h); return h; };
  const fwd = V(Math.sin(sy), 0, Math.cos(sy));
  $(".cine").classList.add("on");
  for (const sh of I.shots) {
    if (skipped) break;
    const t0 = performance.now(), est = 1800 + sh.text.split(" ").length * 380;
    let moving = true, art = null;
    if (sh.face) {
      setLightsFar(false); camShot.active = true; camShot.snap = true;
      PLAYER.play("Idle_Talking_Loop"); PLAYER.speaking = true;
      (function frame() { if (!moving) return; const u = Math.min(1, (performance.now() - t0) / est), h = head();
        const d = sh.face === "pull" ? .7 + u * 2.6 : .95 - u * .25, side = V(fwd.z, 0, -fwd.x).multiplyScalar(.18);
        camShot.pos.copy(h).addScaledVector(fwd, d).add(side).setY(h.y + .03 + (sh.face === "pull" ? u * .5 : 0)); camShot.look.copy(h).setY(h.y - .03);
        PLAYER.expr?.update(performance.now(), true, sound.voiceLevel ? sound.voiceLevel() : 0);
        requestAnimationFrame(frame); })();
    } else if (sh.path) {
      PLAYER.speaking = false; camShot.active = true; camShot.snap = true;
      const P = sh.path.map(k => [V(...k.slice(0, 3)), V(...k.slice(3))]);
      setLightsFar(P.some(([p]) => p.z > 50));
      (function drift() { if (!moving) return; const u = Math.min(.999, (performance.now() - t0) / est) * (P.length - 1), i = Math.floor(u), f = u - i, e = f * f * (3 - 2 * f);
        camShot.pos.lerpVectors(P[i][0], P[i + 1][0], e); camShot.look.lerpVectors(P[i][1], P[i + 1][1], e); requestAnimationFrame(drift); })();
    } else if (sh.art) {
      // the paintings, one after another, drifting slowly like a documentary
      art = $("#artshot"); art.classList.add("on"); const per = est / sh.art.length;
      sh.art.forEach((src, i) => setTimeout(() => { if (!moving) return; const img = art.querySelector("img"); img.classList.remove("go"); img.src = LIB + src; void img.offsetWidth; img.classList.add("go"); }, i * per));
    }
    await line(I.who, sh.id, sh.text, "vo");
    moving = false; PLAYER.speaking = false;
    if (art) art.classList.remove("on");
  }
  setLightsFar(false);
  const card = $("#titlecard"); card.querySelector("small").textContent = I.title[0]; card.querySelector("b").textContent = I.title[1];
  card.classList.add("on"); await new Promise(r => setTimeout(r, skipped ? 900 : 2600)); card.classList.remove("on");
  $(".cine").classList.remove("on"); $("#artshot").classList.remove("on");
  staging = false; PLAYER.setHead(false);
  document.body.classList.remove("talking", "cinema"); camShot.active = false; talking = false; skipIntro = null;
}
addEventListener("keydown", e => { if (skipIntro && (e.key === "Escape" || e.key === "Enter")) skipIntro(); });

/* ---------- Chapter I opens like a film: the wedding at Corinth, the olive, the funeral, the river ---------- */
let wedding = null, guests = null, povDim = false;
const wpos = (x, y, z) => V(W.x + x, W.y + y, W.z + z);
function stage(p, [x, z, ry], y = 0) { p.root.position.copy(wpos(x, y, z)); p.root.rotation.set(0, ry, 0); p.root.visible = true; }
function shot(from, look, to, lookTo, ms, world = false) { // a camera move, in courtyard coordinates (or world ones)
  const P = a => world ? V(...a) : wpos(...a);
  const A = P(from), AL = P(look), B = to ? P(to) : A.clone(), BL = lookTo ? P(lookTo) : AL.clone(), t0 = performance.now(), id = {};
  camShot.active = true; camShot.snap = true; camShot.pos.copy(A); camShot.look.copy(AL); shot.cur = id;
  (function go() { if (shot.cur !== id) return; const u = Math.min(1, (performance.now() - t0) / ms), e = u * u * (3 - 2 * u); camShot.pos.lerpVectors(A, B, e); camShot.look.lerpVectors(AL, BL, e); if (u < 1) requestAnimationFrame(go); })();
}
function faceShot(p, {dist = .85, side = .25, up = .04, drift = .12, ms = 5000} = {}) { // a close-up on someone's face
  const h = new THREE.Vector3(); p.bones.Head.getWorldPosition(h);
  const f = V(Math.sin(p.root.rotation.y), 0, Math.cos(p.root.rotation.y)), r = V(f.z, 0, -f.x);
  const A = h.clone().addScaledVector(f, dist).addScaledVector(r, side).setY(h.y + up), B = h.clone().addScaledVector(f, dist - drift).addScaledVector(r, side * .8).setY(h.y + up);
  const t0 = performance.now(), id = {}; camShot.active = true; camShot.snap = true; shot.cur = id;
  (function go() { if (shot.cur !== id) return; const u = Math.min(1, (performance.now() - t0) / ms), hh = new THREE.Vector3(); p.bones.Head.getWorldPosition(hh); camShot.pos.lerpVectors(A, B, u);
    // if they lean in toward the lens while they talk, the camera eases back to keep its distance
    const off = camShot.pos.clone().sub(hh), min = (dist - drift) * .95; if (off.length() < min) camShot.pos.copy(hh).addScaledVector(off.normalize(), min);
    camShot.look.copy(hh).setY(hh.y - .02); requestAnimationFrame(go); })();
}
const fade = (to, ms) => new Promise(r => { const f = $("#fader"); f.style.transition = `opacity ${ms}ms`; f.style.background = to === "white" ? "#f6efe4" : "#000"; f.style.opacity = to === "clear" ? 0 : 1; setTimeout(r, ms); });
const pause = ms => new Promise(r => setTimeout(r, ms));
function setWeddingLights(on) {
  wedding?.lights.forEach(l => l.visible = on);
  if (on) { nearLights.forEach(l => l.visible = false); farLights.forEach(l => l.visible = false); scene.fog.color.set(0x3a2a24); scene.fog.density = .018; sky.intensity = .8; }
  else { scene.fog.color.set(NIGHT); scene.fog.density = .021; setLightsFar(false); }
}

// The wedding crowd: everyone Thea's family has ever met. Built once, the first time the film plays.
let crowd = null;
const PALETTE = [[0xe9e0cc, 0x8a2f24], [0x6b7a4a, 0x3a2a1a], [0x2f4a6b, 0xd8cdb6], [0xa8823a, 0x5a3a20], [0xd8d4ca, 0x6b4a7a], [0x8a3a2a, 0xe0d0b0], [0xc8b48a, 0x2a3a5a], [0x5a6b78, 0xa86a3a], [0xd89a2a, 0xf2ede2], [0x7a2a4a, 0xd8cdb6]];
// the women's gowns: rich colours, each with a lighter cape
// (silk jersey in warm, deep colours; ivory is the bride's alone)
const GOWNS = [[0xb5562e, 0], [0xc77a52, 0], [0x8a9a6a, 0], [0xc98a8a, 0], [0x1f5a5a, 0], [0x6b6a2e, 0], [0x7a2232, 0], [0xcdb48a, 0]];
// Dressing a person takes the best part of a second; done back to back, the page froze for the length of the whole
// guest list (long enough for a browser to call it unresponsive). Between people, a breath: the page keeps moving.
const breathe = () => new Promise(r => setTimeout(r, 0));
async function buildCrowd() {
  const people = [], few = LITE ? 14 : 44;
  const pal = () => PALETTE[Math.random() * PALETTE.length | 0];
  // one dressed person per face, seated or standing; then cheaper copies in new colours
  const base = {standing: [], seated: []};
  // (every crowd man is the same animated body, and every woman: what makes them different people is their skin, cut and
  // colours. Nine dressed ones, each copied in new colours, look as varied as nineteen and dress in half the time.)
  const keys = [...Array.from({length: 5}, (_, i) => ["crowd_m" + i, false]), ...Array.from({length: 4}, (_, i) => ["crowd_f" + i, true])];
  for (const [i, [k, female]] of keys.entries()) {
    if (!ASSETS[k]) continue;
    const c = female ? GOWNS[i % GOWNS.length] : pal(), seated = i % 2 === 0;
    await breathe();
    const p = makeExtra(ASSETS[k], {ASSETS, scene, female, seated, colors: [c[0], c[1], 0xe8e0d0], veil: female && Math.random() < .5});
    p.root.visible = false; (seated ? base.seated : base.standing).push(p);
  }
  let si = 0, ti = 0;
  const take = kind => { const list = base[kind]; const b = list[(kind === "seated" ? si++ : ti++) % list.length]; if (!b.used) { b.used = true; return b; } return cloneExtra(b, ASSETS, scene, (Math.random() - .5) * .12); };
  const placeAt = (p, x, z, ry, clip) => { p.root.position.copy(wpos(x, 0, z)); p.root.rotation.set(0, ry, 0); p.root.visible = true; p.play(clip, 0); people.push(p); return p; };
  // the tables
  const seats = CROWD.tables.slice().sort(() => Math.random() - .5).slice(0, LITE ? 8 : 28);
  for (const [x, z, ry] of seats) placeAt(take("seated"), x, z, ry, ["sittable", "sittabletalk", "sittablethink"][Math.random() * 3 | 0]);
  // the ring dance, turning slowly around the dance floor
  const ring = [];
  for (let i = 0; i < (LITE ? 6 : CROWD.ring.n); i++) { const p = placeAt(take("standing"), 0, 0, 0, "walk"); p.ring = i; ring.push(p); }
  // people standing about, talking, laughing, drinking
  for (const [gx, gz] of CROWD.groups.slice(0, LITE ? 2 : 9)) for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + Math.random(); const p = placeAt(take("standing"), gx + Math.cos(a) * .8, gz + Math.sin(a) * .8, Math.atan2(-Math.cos(a), -Math.sin(a)), ["Idle_Talking_Loop", "laugh", "drink", "listen", "Idle_Loop"][Math.random() * 5 | 0]); p.moods = ["Idle_Talking_Loop", "listen", "Idle_Loop", "laugh", "drink", "listen", "Idle_Talking_Loop"]; p.next = 3000 + Math.random() * 9000; }
  // the band: two more players beside the piper
  for (const [bx, bz, ry] of CROWD.band) placeAt(take("standing"), bx, bz, ry, "clap");
  // servers walking between the tables with trays
  const servers = [];
  for (let i = 0; i < (LITE ? 1 : CROWD.servers); i++) {
    const p = placeAt(take("standing"), 0, 0, 0, "walk"); p.serve = i;
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .03, 16), new THREE.MeshStandardMaterial({color: 0xb8b0a0, metalness: .6, roughness: .3}));
    for (let k = 0; k < 4; k++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.05, .03, .06, 10), new THREE.MeshStandardMaterial({color: 0x1a1410})); cup.position.set(Math.cos(k * 1.6) * .12, .04, Math.sin(k * 1.6) * .12); tray.add(cup); }
    tray.position.set(.2, 1.15, .32); p.root.add(tray); servers.push(p);
  }
  return {people, ring, servers, update(dt, now) {
    if (this.freeze) { if (!this.frozen) { this.frozen = true; for (const p of [...ring, ...servers]) p.play("Idle_Loop"); } }
    for (const p of people) p.mixer.update(dt);
    if (this.freeze) return;
    // people in conversation don't repeat one gesture forever: every so often they listen, laugh, take a drink
    for (const p of people) if (p.moods && (p.next -= dt * 1000) < 0) { p.next = 5000 + Math.random() * 9000; p.play(p.moods[Math.random() * p.moods.length | 0], .6); if (p.action) p.action.timeScale = .85 + Math.random() * .3; }
    const R = CROWD.ring;
    ring.forEach((p, i) => { const a = now / 6000 + i / ring.length * Math.PI * 2; p.root.position.copy(wpos(R.x + Math.cos(a) * R.r, 0, R.z + Math.sin(a) * R.r)); p.root.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); if (p.action) p.action.timeScale = .75; });
    servers.forEach((p, i) => { const a = now / 9000 * (i % 2 ? 1 : -1) + i * 1.7, rx = 7.5, rz = 8; p.root.position.copy(wpos(3 + Math.cos(a) * rx, 0, Math.sin(a) * rz)); p.root.rotation.y = Math.atan2(-Math.sin(a) * rx * (i % 2 ? 1 : -1), Math.cos(a) * rz * (i % 2 ? 1 : -1)); });
  }, hide() { people.forEach(p => p.root.visible = false); }, show() { people.forEach(p => p.root.visible = true); }};
}
async function weddingFilm({skip = false} = {}) { // skip: the opening was played as video; go straight to the river bank
  if (!skip && !crowd) { // the title card goes up before the wedding is built (which takes a few seconds), not after: the river must not show first
    const card = $("#titlecard"); card.querySelector("small").textContent = "Corinth"; card.querySelector("b").textContent = "Last spring";
    $("#fader").style.transition = "none"; $("#fader").style.opacity = 1; card.classList.add("on"); document.body.classList.add("cinema");
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }
  if (!wedding && !skip) {
    wedding = buildWedding(scene, {noise, lite: LITE}); dressWedding();
    const who = async (id, name, o) => { await breathe(); return Object.assign(G.cast(id, o), {name}); };
    guests = {
      demeas: await who("demeas", "Demeas"), kleio: await who("aunt", "Kleio", {seated: true}),
      lykon: await who("lykon", "Lykon", {seated: true}), nikias: await who("nikias", "Nikias", {seated: true}),
      thea: await who("thea", "Thea", {seated: true}), piper: await who("piper", "the piper"), dancer: await who("dancer", "a guest")
    };
  }
  if (skip) {} else if (!crowd) {
    const card = $("#titlecard");
    await pause(1200); crowd = await buildCrowd(); await pause(600); card.classList.remove("on");
  } else { crowd.show(); crowd.freeze = false; crowd.frozen = false; }
  guests ||= {};
  const cast = {...guests, mikon: PLAYER};
  for (const [k, p] of Object.entries(guests)) NPC[k] = p;
  NPC.mikon = PLAYER; PLAYER.name = "Mikon";
  let skipped = skip; skipIntro = () => { skipped = true; skipLine?.(); };
  // for testing only: ?debug&from=<words> jumps the film to the first line containing them
  let fast = new URLSearchParams(location.search).has("debug") && new URLSearchParams(location.search).get("from");
  const say = (who, id, text, how = "voice") => { if (skipped) return null; if (fast) { if (!text.includes(fast)) return pause(20); fast = null; } return line(who, id, text, how); };
  const vo = (who, id, text) => say(who, id, text, "vo");
  talking = true; staging = true; document.body.classList.add("talking", "cinema"); $(".cine").classList.add("on");
  PLAYER.setHead(true);
  await fade("black", 10);
  if (!skip) { // (with the opening played as video, none of the 3D wedding is staged)
  // seat everyone
  for (const k of ["mikon", "lykon", "kleio", "thea", "nikias"]) { stage(cast[k], SEATS[k]); cast[k].play("sittable", 0); }
  stage(cast.demeas, SEATS.demeas); cast.demeas.play("Idle_Talking_Loop", 0);
  stage(cast.piper, SEATS.piper); cast.piper.play("Idle_Loop", 0);
  stage(cast.dancer, SEATS.dancer); cast.dancer.play("dance", 0);
  wedding.mood("wedding"); setWeddingLights(true); sound.party(true);
  const reel = async () => {
    // Corinth, last spring: the whole wedding from above, then Mikon walking in through the gate with his present
    shot([-2, 9, 14], [-6, 0, -2], [6, 6, 11], [-4, 0, -1], 7000);
    await fade("clear", 1600);
    const card = $("#namecard"); card.querySelector("b").textContent = "Corinth"; card.querySelector("span").textContent = "Last spring. Thea's wedding."; card.classList.add("on"); setTimeout(() => card.classList.remove("on"), 5000);
    await pause(4200);
    const basket = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(.17, .13, .2, 14, 1, true), new THREE.MeshStandardMaterial({color: 0x9a7a4a, roughness: 1, side: THREE.DoubleSide})); basket.add(b); for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(.03, .16, 4, 8), new THREE.MeshStandardMaterial({color: 0xb8b8a8, metalness: .4, roughness: .3})); f.rotation.z = Math.PI / 2 + (k - 2) * .25; f.position.set(0, .1, (k - 2) * .05); basket.add(f); }
      const handle = new THREE.Mesh(new THREE.TorusGeometry(.15, .012, 6, 18, Math.PI), new THREE.MeshStandardMaterial({color: 0x7a5a32, roughness: 1})); handle.position.y = .1; basket.add(handle); }
    hold(PLAYER, "r", basket, V(0, .25, 0));
    const g0 = performance.now(), from = wpos(CROWD.gate[0], 0, CROWD.gate[1]), to = wpos(-.7, 0, -1.9);
    PLAYER.root.rotation.set(0, -Math.PI / 2, 0); PLAYER.play("walk", .1);
    let walking = true, following = true;
    (function walk() { if (!walking) return; const u = Math.min(1, (performance.now() - g0) / 10000); PLAYER.root.position.lerpVectors(from, to, u); if (u < 1) requestAnimationFrame(walk); else { PLAYER.play("Idle_Loop"); walking = false; } })();
    // first over his shoulder as he walks into the party, then round to his face once the crowd is behind him
    (function follow() { if (!following) return; const h = new THREE.Vector3(); PLAYER.bones.Head.getWorldPosition(h); camShot.active = true; shot.cur = null;
      const u = (performance.now() - g0) / 10000;
      if (u < .45) { camShot.pos.copy(h).add(V(1.4, .25, .55)); camShot.look.copy(h).add(V(-6, -.6, -.4)); }
      else { camShot.pos.copy(h).add(V(-1.25, .05, .6)); camShot.look.copy(h).add(V(0, -.05, 0)); }
      requestAnimationFrame(follow); })();
    await vo("mikon", "w_i1", "My name is Mikon. I sell salt fish at the harbour in Corinth. Have done for twenty-two years. Tonight my cousin Thea is getting married, and I've brought the best I've got.");
    following = false; walking = false; PLAYER.root.position.copy(to); PLAYER.root.rotation.set(0, .5, 0); PLAYER.play("Idle_Loop");
    if (skipped) return;
    faceShot(cast.lykon, {side: .2}); cast.lykon.play("sittabletalk"); await say("lykon", "w_l0", "Mikon! Over here, I saved you a seat. Wait. Is that fish? You brought fish to a wedding?");
    PLAYER.play("Idle_Talking_Loop");
    faceShot(PLAYER, {dist: 1, side: .25}); await say("mikon", "w_m0", "Salt fish from Lechaion. The good kind. It's a present.");
    faceShot(cast.kleio, {side: -.2}); cast.kleio.play("sittabletalk"); await say("kleio", "w_a0", "Give that to me before the bride smells it. Sit down, Mikon, have some wine, and try to enjoy yourself for once.");
    basket.parent?.remove(basket);
    stage(PLAYER, SEATS.mikon); PLAYER.play("sittable", 0); cast.kleio.play("sittable");
    if (skipped) return;
    // the toast
    faceShot(cast.demeas, {dist: 1.6, side: .5, up: -.05, ms: 9000});
    await say("demeas", "w_d1", "Friends! Friends, quiet, please. I'll be brief. I won't be brief. To Thea and Nikias! May the gods give you long lives, a full house, and more children than this family has goats!");
    if (skipped) return;
    for (const k of ["lykon", "kleio", "thea", "nikias", "mikon"]) cast[k].play("sittabletalk"); cast.demeas.play("cheer"); cast.dancer.play("clap");
    sound.cheer(); shot([-2.8, 2.3, -3.4], [.6, 1, .4], [-2.2, 2, -2.8], [.6, 1, .4], 3000); await pause(2400);
    faceShot(cast.kleio, {side: -.2}); await say("kleio", "w_a1", "Demeas, sit down before you fall into the lamb again.");
    faceShot(cast.demeas, {dist: 1.3, side: -.4}); cast.demeas.play("Idle_Talking_Loop"); await say("demeas", "w_d2", "That was one time, Kleio, and the lamb started it.");
    if (skipped) return;
    for (const k of ["lykon", "kleio", "thea", "nikias"]) cast[k].play("sittable");
    // the goat
    faceShot(cast.mikon, {side: .35, dist: 1.05, ms: 7000}); cast.mikon.play("sittabletalk");
    await say("mikon", "w_m1", "Lykon. Lykon. Have you heard the one about the goat who wandered into the temple of Zeus?");
    faceShot(cast.lykon, {side: .2}); cast.lykon.play("sittablethink"); await say("lykon", "w_l1", "Mikon, it's your cousin's wedding. Not the goat one. Anything but the goat one.");
    faceShot(cast.mikon, {side: -.18, ms: 9000}); await say("mikon", "w_m2", "So the goat walks right up to the altar, and the priest looks at the goat, and the goat looks at the priest, and the priest says...");
    if (skipped) return;
    // the olive
    const olive = wedding.olives.children[3]; if (olive) { const h = new THREE.Vector3(); PLAYER.bones.Head.getWorldPosition(h); const from = new THREE.Vector3(); olive.getWorldPosition(from); const t0 = performance.now(); scene.attach(olive);
      (function fly() { const u = Math.min(1, (performance.now() - t0) / 450); olive.position.lerpVectors(from, h.clone().add(V(0, -.06, .07)), u); olive.position.y += Math.sin(u * Math.PI) * .25; if (u < 1) requestAnimationFrame(fly); else olive.visible = false; })(); }
    PLAYER.expr.hold = {AK_44_MouthSmileLeft: .7, AK_45_MouthSmileRight: .7};
    await say("mikon", "w_m3", "Ha! No, wait, wait, this is the good part, this is the...");
    PLAYER.expr.hold = {AK_03_BrowInnerUp: 1, AK_25_JawOpen: .35};
    cast.mikon.play("choke", .2); sound.cough(); sound.party(false); crowd.freeze = true; shot([-.6, 1.25, .45], [-.7, 1.1, -1.02], [-.65, 1.2, .2], [-.7, 1.05, -1.02], 4000); await pause(1600);
    stage(cast.lykon, [.15, -1.75, -.6]); cast.lykon.play("Idle_Talking_Loop"); cast.lykon.expr.hold = {AK_03_BrowInnerUp: .9};
    faceShot(cast.lykon, {side: .25, dist: .8}); await say("lykon", "w_l2", "Mikon? Mikon, are you all right? You've gone a very strange colour.");
    // everyone up
    stage(cast.demeas, [-1.2, -1.75, .3]); cast.demeas.play("Idle_Talking_Loop"); stage(cast.nikias, [-.2, -1.75, -.3]); cast.nikias.play("Idle_Talking_Loop");
    faceShot(cast.kleio, {side: -.25, dist: .75}); cast.kleio.play("sittabletalk"); sound.cough(); await say("kleio", "w_a2", "He's choking! Somebody hit him on the back! Not like that, Demeas, harder!");
    shot([-.3, 1.7, .9], [-.6, 1.1, -1.2], [-.3, 1.5, .7], [-.6, 1.05, -1.2], 4000); await say("nikias", "w_n1", "I've got him, I've got him! Breathe, cousin, just breathe!");
    faceShot(cast.thea, {side: .2}); cast.thea.play("sittabletalk"); await say("thea", "w_t1", "Mikon, don't you dare. Not today! It's my wedding!");
    if (skipped) return;
    // through his eyes: the faces leaning in, the sound going, the light going
    const h = new THREE.Vector3(); PLAYER.bones.Head.getWorldPosition(h);
    // the people he loves, gathered round, looking down at him
    const eye = h.clone().add(V(0, -.3, .1)), ring = [["kleio", -.45], ["thea", .15], ["lykon", .7], ["nikias", -1.1]];
    for (const [k, a] of ring) { const p = cast[k], at = eye.clone().add(V(Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2)); p.root.position.set(at.x, 0, at.z); p.root.rotation.set(0, Math.atan2(eye.x - at.x, eye.z - at.z), 0); p.root.rotateX(.36); p.play("listen"); p.expr.hold = {AK_03_BrowInnerUp: 1}; p.hideHands?.(true); } // tipped toward him, their hands would swing up into the lens
    camShot.active = true; camShot.snap = true; shot.cur = {}; camShot.pos.copy(eye); camShot.look.copy(eye).add(V(.2, .62, .85));
    { const t0 = performance.now(), id = shot.cur; (function sway() { if (shot.cur !== id) return; const u = (performance.now() - t0) / 1000; camShot.look.copy(eye).add(V(.2 + Math.sin(u * .7) * .18, .62 - u * .03, .85)); requestAnimationFrame(sway); })(); }
    PLAYER.setHead(false); PLAYER.hideHands?.(true); sound.setMuffle(500, 3); sound.heart(); sound.party(false);
    povDim = true; { const t0 = performance.now(); (function dimming() { if (!povDim) return; const u = Math.min(1, (performance.now() - t0) / 9000); paint.uniforms.blur.value = u; paint.uniforms.dim.value = u * .9; if (u < 1) requestAnimationFrame(dimming); })(); }
    await say("kleio", "w_a5", "Mikon? Mikon, look at me. Stay with us. Somebody get water!");
    await say("thea", "w_t3", "Mikon, please. Please.");
    await vo("mikon", "w_vo1", "One moment I was laughing. The next, everyone I loved was leaning over me, and their voices were getting very far away.");
    await fade("black", 2200);
    povDim = false; PLAYER.hideHands?.(false); for (const [k] of ring) cast[k].hideHands?.(false); paint.uniforms.blur.value = 0; paint.uniforms.dim.value = 0; sound.setMuffle(20000, .5);
    if (skipped) return;
    // the next night: the same courtyard, cleared, and Mikon laid out on the table
    wedding.mood("funeral"); PLAYER.setHead(true); crowd.hide(); for (const k of ["kleio", "thea", "lykon", "nikias"]) cast[k].expr.hold = {};
    PLAYER.root.position.copy(wpos(.55, .86, 0)); PLAYER.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, -1), V(-1, 0, 0), V(0, 1, 0)));
    PLAYER.play("Idle_Loop", 0); PLAYER.action && (PLAYER.action.timeScale = 0); PLAYER.expr.hold = {AK_09_EyeBlinkLeft: 1, AK_10_EyeBlinkRight: 1};
    for (const k of ["lykon", "nikias", "piper", "dancer"]) cast[k].root.visible = false;
    stage(cast.kleio, [-.5, 1.1, Math.PI]); cast.kleio.play("Idle_Loop", 0); stage(cast.demeas, [.6, 1.1, Math.PI]); cast.demeas.play("Idle_Loop", 0); stage(cast.thea, [-2, 0, Math.PI / 2]); cast.thea.play("Idle_Loop", 0);
    shot([-1.05, 2.6, .15], [-1.05, .86, 0], [-1.05, 1.7, .1], [-1.05, .86, 0], 9000);
    await fade("clear", 2200);
    faceShot(cast.kleio, {side: -.2, dist: 1}); await say("kleio", "w_a3", "Did anybody put the coin in his mouth? For the ferryman?");
    faceShot(cast.demeas, {side: .2, dist: 1}); await say("demeas", "w_d3", "I thought you did.");
    faceShot(cast.kleio, {side: -.15, dist: .8}); cast.kleio.play("Idle_Talking_Loop"); await say("kleio", "w_a4", "I was doing the lamb!");
    faceShot(cast.demeas, {side: .25, dist: 1.1}); cast.demeas.play("Idle_Talking_Loop"); await say("demeas", "w_d4", "Well, the lamb's going cold now. He'd want us to eat. He loved lamb, the poor man.");
    cast.kleio.play("walk"); cast.demeas.play("walk");
    faceShot(cast.thea, {side: .15, dist: .9, ms: 7000}); await say("thea", "w_t2", "He never even finished the joke. I wanted to know what the priest said.");
    shot([-1.05, 1.5, .1], [-1.05, .86, 0], [-1.05, 3.2, .2], [-1.05, .86, 0], 9000); await vo("mikon", "w_vo2", "Nobody put a coin under my tongue for the ferryman. They were grieving, and they were busy, and nobody thought of it.");
    await fade("black", 2000);
  };
  await reel();
  }
  // the river: he wakes on a bench by the Styx, and Hermes is there
  await fade("black", 300);
  PLAYER.hideHands?.(false); for (const g of Object.values(guests)) g.hideHands?.(false); sound.party(false); sound.setMuffle(20000, .2); povDim = false; paint.uniforms.blur.value = 0; paint.uniforms.dim.value = 0;
  setWeddingLights(false); for (const p of Object.values(guests)) p.root.visible = false; crowd?.hide();
  for (const k of Object.keys(guests)) delete NPC[k];
  PLAYER.root.quaternion.identity(); PLAYER.root.position.set(-20.4, 0, 16.05); PLAYER.root.rotation.set(0, Math.PI, 0);
  PLAYER.action && (PLAYER.action.timeScale = 1); PLAYER.play("Sitting_Idle_Loop", 0); PLAYER.expr.hold = {AK_09_EyeBlinkLeft: 1, AK_10_EyeBlinkRight: 1};
  const H = NPC.hermes; H.root.position.set(-19.3, 0, 14.9); H.root.rotation.y = -Math.PI * .8; H.pos.set(-19.3, 0, 14.9); H.face = false;
  if (!skipped) {
    faceShot(PLAYER, {dist: .9, side: .2, ms: 6000});
    await fade("clear", 2500);
    await pause(900); PLAYER.expr.hold = {AK_09_EyeBlinkLeft: .5, AK_10_EyeBlinkRight: .5}; await pause(400); PLAYER.expr.hold = {};
    await say("mikon", "w_m4", "Oh. Oh, no. Is that a river? Why is it glowing?");
    const hermes = [["hermes", "v4_h1"], ["mikon", "v4_m1"], ["hermes", "v4_h2"], ["mikon", "v4_m2"], ["hermes", "v4_h3"], ["mikon", "v4_m3"], ["hermes", "v4_h4"], ["mikon", "v4_m4"], ["hermes", "v4_h5", "ferry"], ["mikon", "v4_m5"], ["hermes", "v4_h6", "charon"], ["mikon", "v4_m6"], ["hermes", "v4_h7", "grotto"], ["mikon", "v4_m7"], ["hermes", "v4_h8"]];
    const TXT = {"v4_h1": "Easy. Easy, sit up slowly. You'll feel cold for a while. That passes.", "v4_m1": "Where... The wedding. I was at the wedding. Thea was about to dance.", "v4_h2": "You were. And then you laughed with an olive in your mouth. I'm sorry, Mikon. You died at your cousin's wedding.", "v4_m2": "I died. At a wedding. In front of everyone.", "v4_h3": "In front of everyone. Though, if it's any comfort, most of them were looking at the lamb.", "v4_m3": "Who are you?", "v4_h4": "Hermes. I carry messages for the gods, and when someone dies, I walk them down here. You're my third today.", "v4_m4": "And where is here?", "v4_h5": "The bank of the River Styx. The dead cross on that ferry, at the end of the dock. The ferryman is Charon, and he takes one coin from every passenger. Your family should have put one under your tongue.", "v4_m5": "And they didn't.", "v4_h6": "Nobody remembered. It happens more often than you'd think. Without a coin, you wait on this bank. A hundred years. That's the law, and Charon has never once broken it.", "v4_m6": "A hundred years.", "v4_h7": "Unless you find a coin. There is one, in the cave beyond the old temple, but a dog sleeps on it. Three heads, and a nose that can smell bronze through stone. If he wakes, get into the river. He won't follow you into the water.", "v4_m7": "You're very calm about all of this.", "v4_h8": "I've had a lot of practice. Go and find the sailor down by the water. His name is Elpenor, and he's been here long enough to know where everything is. Good luck, Mikon. I mean that.", "v4_e0": "Did Hermes walk you down? Check your sandals. On the day he was born he stole fifty of Apollo's cattle and made them walk backwards so nobody could follow the tracks.", "v4_i4": "This is where I woke up. The bank of the River Styx, with a ferry I can't pay for, and a hundred years in front of me."};
    for (const [who, id, cut] of hermes) {
      if (skipped) break;
      if (cut) cutTo(cut); else faceShot(who === "hermes" ? H : PLAYER, {dist: who === "hermes" ? 1.1 : .9, side: who === "hermes" ? -.3 : .25});
      if (who === "hermes") H.play("Idle_Talking_Loop"); else PLAYER.play("Sitting_Talking_Loop");
      await say(who, id, TXT[id]);
      H.play("Idle_Loop"); PLAYER.play("Sitting_Idle_Loop");
    }
  }
  H.face = true; me.met.hermes = true; me.stage = 1; greeted = true; hermesLeaves();
  if (!skipped) {
    shot([-20, 2, 13.8], [-20.4, 1, 16.05], [-24, 9, 9], [-14, 1, 22], 14000, true);
    await vo("mikon", "v2_i5", "Everyone you've ever heard of came through here. Heroes, kings, a man with a lyre. Nobody wrote down the people who were already waiting.");
    await vo("mikon", "v2_i6", "This is the story of one of them.");
  }
  delete NPC.mikon; PLAYER.expr.hold = {};
  const card = $("#titlecard"); card.querySelector("small").textContent = "Chapter I"; card.querySelector("b").textContent = "The Coin";
  card.classList.add("on"); await pause(skipped ? 900 : 2800); card.classList.remove("on");
  await fade("clear", 600);
  me.pos.set(-20.4, 0, 17.4); me.yaw = -Math.PI / 2; me.pitch = -.05;
  $(".cine").classList.remove("on"); staging = false; PLAYER.setHead(false); PLAYER.play("Idle_Loop", 0);
  document.body.classList.remove("talking", "cinema"); camShot.active = false; talking = false; skipIntro = null; shot.cur = null;
  paintGoal();
}

/* ---------- Chapter II opens with Orpheus and Eurydice's wedding, the snake, and the road down ---------- */
let orph = null, caveLights = [];
// Poses laid over the animation just before each frame is drawn
const poses = new Set();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();
function aimBone(bone, from, to) { // turn a bone so that the world direction 'from' points along 'to'
  _q.setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  bone.getWorldQuaternion(_pq); _pq.premultiply(_q);
  const parent = new THREE.Quaternion(); bone.parent.getWorldQuaternion(parent);
  bone.quaternion.copy(parent.invert().multiply(_pq)); bone.updateMatrixWorld(true);
}
function reach(p, side, target, pole, palm = 0) { // two-bone reach: shoulder, elbow, wrist, with the elbow bending toward 'pole'
  if (palm) { reach(p, side, target, pole); const hd = p.bones["hand_" + side], lo = p.bones["lowerarm_" + side]; hd.getWorldPosition(_c); lo.getWorldPosition(_b); target = target.clone().addScaledVector(_c.clone().sub(_b).normalize(), -palm); }
  const up = p.bones["upperarm_" + side], lo = p.bones["lowerarm_" + side], hd = p.bones["hand_" + side];
  up.getWorldPosition(_a); lo.getWorldPosition(_b); hd.getWorldPosition(_c);
  const l1 = _a.distanceTo(_b), l2 = _b.distanceTo(_c), toT = target.clone().sub(_a), d = Math.min(toT.length(), (l1 + l2) * .999), dir = toT.normalize();
  const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))), perp = pole.clone().sub(_a); perp.addScaledVector(dir, -perp.dot(dir)).normalize();
  const elbow = _a.clone().addScaledVector(dir, l1 * cosA).addScaledVector(perp, l1 * Math.sqrt(1 - cosA * cosA));
  aimBone(up, _b.clone().sub(_a), elbow.clone().sub(_a));
  lo.getWorldPosition(_b); hd.getWorldPosition(_c); aimBone(lo, _c.clone().sub(_b), target.clone().sub(_b));
}
// Orpheus with the lyre held against his chest: left hand on the frame, right hand moving across the strings
function playLyre(p, on) {
  if (p.lyrePose) poses.delete(p.lyrePose); p.lyreHeld?.removeFromParent(); p.lyrePose = p.lyreHeld = null;
  const carried = chap.st?.carried; if (carried) carried.visible = !on;
  if (!on || !carried) return;
  const ly = carried.clone(); ly.visible = true; ly.scale.setScalar(1.05); scene.add(ly); p.lyreHeld = ly; // (the carried one sits under a bone measured in centimetres)
  p.lyrePose = now => {
    p.root.updateMatrixWorld(true);
    const chest = new THREE.Vector3(); p.bones.spine_03.getWorldPosition(chest);
    const ry = p.root.rotation.y, f = V(Math.sin(ry), 0, Math.cos(ry)), left = V(Math.cos(ry), 0, -Math.sin(ry));
    ly.position.copy(chest).addScaledVector(f, .26).addScaledVector(left, .07).add(V(0, -.2, 0));
    ly.rotation.set(0, ry, 0); ly.rotateZ(.22); ly.rotateX(.18); ly.updateMatrixWorld(true);
    const strum = Math.sin(now / 210) * .045 + Math.sin(now / 67) * .008;
    reach(p, "l", ly.localToWorld(V(.1, .2, -.03)), chest.clone().addScaledVector(left, .5).add(V(0, -.35, 0)).addScaledVector(f, -.1));
    reach(p, "r", ly.localToWorld(V(-.02 + strum, .13, -.07)), chest.clone().addScaledVector(left, -.5).add(V(0, -.4, 0)).addScaledVector(f, -.15));
  };
  poses.add(p.lyrePose);
}
async function orpheusFilm({skip = false} = {}) { // skip: the opening was played as video; go straight to Taenarum
  if (skip) { // only the hand-over to play: the title, then Orpheus at the foot of the road down
    const card = $("#titlecard"); card.querySelector("small").textContent = "Chapter II"; card.querySelector("b").textContent = "The Lyre";
    card.classList.add("on"); await pause(2200); card.classList.remove("on"); await fade("clear", 600);
    PLAYER.name = "Orpheus"; me.pos.set(-36.5, 0, 13); me.yaw = -Math.PI / 2; me.pitch = -.03; PLAYER.setHead(false); PLAYER.play("Idle_Loop", 0);
    $(".cine").classList.remove("on"); document.body.classList.remove("talking", "cinema"); staging = false; camShot.active = false; talking = false; skipIntro = null; shot.cur = null;
    return paintGoal();
  }
  // the title card stays up the whole time the wedding and its people are being built (a few seconds), not just at first
  const title = $("#titlecard"), building = !wedding || !crowd || !orph;
  if (building) { title.querySelector("small").textContent = "Thrace"; title.querySelector("b").textContent = "Spring";
    $("#fader").style.transition = "none"; $("#fader").style.opacity = 1; title.classList.add("on"); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
  if (!wedding) { wedding = buildWedding(scene, {noise, lite: LITE}); dressWedding(); }
  if (!crowd) { await pause(1200); crowd = await buildCrowd(); await pause(600); }
  else { crowd.show(); crowd.freeze = false; crowd.frozen = false; }
  if (!orph) {
    const eury = (await breathe(), Object.assign(G.cast("eurydice_alive", {seated: true}), {name: "Eurydice"}));
    const euryM = (await breathe(), Object.assign(G.cast("eurydice_meadow"), {name: "Eurydice"}));
    const hymen = (await breathe(), Object.assign(makeExtra(ASSETS.crowd_m3, {ASSETS, scene, female: false, colors: [0xe8a830, 0xd86a2a]}), {name: "Hymen, god of weddings"}));
    const friend = (await breathe(), Object.assign(makeExtra(ASSETS.crowd_f2, {ASSETS, scene, female: true, colors: [0xc8d8e8, 0x8aa8c8]}), {name: "her friend"}));
    orph = {eury, euryM, hymen, friend};
    // Hymen's torch, which will not catch
    const torchG = new THREE.Group(), stick = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, .7, 8), new THREE.MeshStandardMaterial({color: 0x4a3020})); torchG.add(stick);
    const sn = 60, sg = new THREE.BufferGeometry(), sp = new Float32Array(sn * 3); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const puffT = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,.9)"); r.addColorStop(.5, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const smoke = new THREE.Points(sg, new THREE.PointsMaterial({color: 0x9a948a, size: .22, map: puffT, transparent: true, opacity: .5, depthWrite: false})); smoke.frustumCulled = false; scene.add(smoke); orph.smoke = smoke;
    // the torch stands in a bronze holder beside him, its head blackened, giving only smoke
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.06, .04, .16, 10), new THREE.MeshStandardMaterial({color: 0x1a1410, roughness: 1})); head.position.y = .42; torchG.add(head);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .06, 12), new THREE.MeshStandardMaterial({color: 0x8a6a30, roughness: .4, metalness: .7})); foot.position.y = -.35; torchG.add(foot);
    stick.scale.y = 1; torchG.scale.setScalar(1.6); scene.add(torchG); orph.torch = torchG;
  }
  if (building) { await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); title.classList.remove("on"); }
  let {eury} = orph; const {hymen, friend} = orph; orph.euryM.root.visible = false;
  NPC.eury = eury; NPC.hymen = hymen; NPC.friend = friend; NPC.orpheus = PLAYER;
  let skipped = false; skipIntro = () => { skipped = true; skipLine?.(); };
  let fast = new URLSearchParams(location.search).has("debug") && new URLSearchParams(location.search).get("from");
  const say = (who, id, text, how = "voice") => { if (skipped) return null; if (fast) { if (!text.includes(fast)) return pause(20); fast = null; } return line(who, id, text, how); };
  const vo = (who, id, text) => say(who, id, text, "vo");
  talking = true; staging = true; document.body.classList.add("talking", "cinema"); $(".cine").classList.add("on");
  PLAYER.setHead(true); PLAYER.name = "Orpheus";
  await fade("black", 10);
  // the wedding, in daylight
  stage(PLAYER, SEATS.mikon); PLAYER.play("sittable", 0); stage(eury, SEATS.lykon); eury.play("sittable", 0);
  stage(hymen, [-3.35, 0, Math.PI / 2]); hymen.play("Idle_Loop", 0); friend.root.visible = false;
  orph.torch.position.copy(wpos(-3.2, .72, .38)); // at his right hand orph.torch.visible = true; orph.smoke.visible = true;
  // Hymen keeps his right hand on the torch's shaft
  const hymenHolds = () => { if (!hymen.root.visible || !orph.torch.visible) return; hymen.root.updateMatrixWorld(true);
    const ch = new THREE.Vector3(); hymen.bones.spine_03.getWorldPosition(ch);
    reach(hymen, "r", orph.torch.localToWorld(V(0, .14, 0)), ch.clone().add(V(-.3, -.4, .45)), .085); };
  poses.add(hymenHolds); orph.hymenHolds = hymenHolds;
  wedding.mood("day"); setWeddingLights(true); scene.fog.color.set(0xc8ccc4); scene.fog.density = .006; sky.intensity = 1.3; sound.party(true); sound.birds(true);
  wedding.snake.visible = false;
  let smoking = true;
  (function puff() { if (!smoking) return; const a = orph.smoke.geometry.attributes.position, tip = new THREE.Vector3(); orph.torch.getWorldPosition(tip); tip.y += .72;
    for (let i = 0; i < 60; i++) { let y = a.getY(i) + .006; if (y > tip.y + 1.6 || y < tip.y - .1 || Math.random() < .004) { a.setXYZ(i, tip.x + (Math.random() - .5) * .05, tip.y, tip.z + (Math.random() - .5) * .05); continue; } a.setY(i, y); a.setX(i, a.getX(i) + (Math.random() - .5) * .006 + .002); } a.needsUpdate = true; requestAnimationFrame(puff); })();
  const reel = async () => {
    shot([-8, 6, 9], [-1, 1, -1], [-3.5, 3, 4.5], [-.3, 1.1, -1], 9000);
    await fade("clear", 1600);
    const card = $("#namecard"); card.querySelector("b").textContent = "Thrace"; card.querySelector("span").textContent = "Spring. The day of the wedding."; card.classList.add("on"); setTimeout(() => card.classList.remove("on"), 5000);
    await vo("", "v2_j1", "They say I could make rivers stop to listen. I never tried. I only ever wanted one person to listen, and she always did.");
    if (skipped) return;
    faceShot(eury, {side: .25}); eury.play("sittabletalk"); await say("eury", "x_e1", "Play the one about the swallows. The one you made up on the boat.");
    faceShot(PLAYER, {side: -.25}); PLAYER.play("sittabletalk"); await say("orpheus", "x_o1", "That one isn't finished yet.");
    faceShot(eury, {side: .2, dist: .95}); eury.expr.hold = {AK_44_MouthSmileLeft: .6, AK_45_MouthSmileRight: .6}; await say("eury", "x_e2", "Then finish it now. Look, everyone's waiting.");
    if (skipped) return;
    // he plays; the wedding goes quiet to listen
    eury.expr.hold = {AK_44_MouthSmileLeft: .45, AK_45_MouthSmileRight: .45}; sound.party(false); crowd.freeze = true; PLAYER.play("sittable"); playLyre(PLAYER, true);
    const tune = [4, 5, 7, 8, 7, 5, 4, 2, 4, 5, 7, 9, 8, 7, 5, 4];
    tune.forEach((n, i) => setTimeout(() => { if (!skipped) pluck(n, .9); }, i * 420));
    faceShot(PLAYER, {side: .3, dist: 1.1, ms: 7000}); await pause(3200);
    shot([-6.5, 2.2, 4], [-.3, 1.1, -1], [-5, 1.9, 2.8], [-.3, 1.1, -1], 4000); await pause(3600);
    if (skipped) return;
    playLyre(PLAYER, false);
    // the omen: Hymen's torch will not catch
    shot([-1.75, 1.55, 1.95], [-3.25, 1.2, .25], [-1.9, 1.55, 1.8], [-3.25, 1.25, .25], 7000); hymen.play("Idle_Talking_Loop"); await say("hymen", "x_h1", "My torch won't catch. It's only smoke. I've stood at a thousand weddings, and that has never happened before.");
    stage(friend, [-2.4, -2.6, 0]); friend.play("Idle_Talking_Loop"); faceShot(friend, {side: -.25}); await say("friend", "x_g1", "Hymen's torch is smoking. That's a bad sign, isn't it?");
    if (skipped) return;
    // the river
    stage(friend, [15.5, -1.5, -Math.PI / 2]); friend.play("wave");
    faceShot(friend, {side: .3, dist: 1.4}); await say("friend", "x_f1", "Eurydice! Come down to the river, it's full of flowers! Come and see!");
    // she gets up from the table: from here on, the standing Eurydice in her full-length dress
    eury.root.visible = false; eury = orph.euryM; NPC.eury = eury; eury.kneel(false);
    stage(eury, [.1, -1.7, Math.PI / 2]); eury.play("Idle_Talking_Loop"); faceShot(eury, {side: .3, dist: 1}); await say("eury", "x_e3", "Wait for me! Orpheus, I'll be right back, don't you dare stop playing!");
    // she runs out laughing through the long grass
    sound.birds(true); eury.play("walk"); eury.action && (eury.action.timeScale = 1.7);
    const path = [wpos(.1, 0, -1.7), wpos(17, 0, -1), wpos(24, 0, 2), wpos(29.4, 0, 4)], t0 = performance.now(), dur = 9000; let running = true;
    (function run() { if (!running) return; const u = Math.min(1, (performance.now() - t0) / dur) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(u)), f = u - i;
      eury.root.position.lerpVectors(path[i], path[i + 1], f); const d = path[i + 1].clone().sub(path[i]); eury.root.rotation.y = Math.atan2(d.x, d.z);
      const h = new THREE.Vector3(); eury.bones.Head.getWorldPosition(h); camShot.active = true; shot.cur = null; camShot.pos.copy(h).add(V(-2.6, .4, -1.4)); camShot.look.copy(h).add(V(1, -.3, .4));
      if (u < path.length - 1) requestAnimationFrame(run); else running = false; })();
    friend.root.visible = false; wedding.snake.visible = true;
    await vo("", "v2_j2", "Eurydice. We were married in the spring. That same afternoon she ran through the long grass by the river, laughing, and a snake was waiting in it.");
    while (running && !skipped) await pause(100); running = false;
    if (skipped) return;
    // the snake
    // the snake lives in the wedding set, so place it in the set's own coordinates; its head ends a step from her feet
    const sn = wedding.snake, feet = eury.root.position.clone().setY(0), out = V(.6, 0, .8).normalize(), tail = feet.clone().addScaledVector(out, 1.35);
    sn.position.copy(wedding.g.worldToLocal(tail.clone())); sn.lookAt(feet); sn.rotateY(Math.PI);
    const mid = feet.clone().addScaledVector(out, .45);
    shot.cur = null; camShot.active = true; camShot.snap = true; camShot.pos.copy(tail).addScaledVector(out, .7).add(V(0, .42, 0)); camShot.look.copy(feet).addScaledVector(out, .25).add(V(0, .12, 0));
    await pause(1100); { const hd = sn.userData.head, base = hd.position.clone(), t1 = performance.now(); (function strike() { const u = Math.min(1, (performance.now() - t1) / 220); hd.position.copy(base).add(V(0, .1 * Math.sin(u * Math.PI), -.28 * u)); if (u < 1) requestAnimationFrame(strike); else setTimeout(() => hd.position.copy(base), 1500); })(); }
    sound.hit(); sound.birds(false);
    eury.play("crouchin", .15); eury.kneel(true);
    faceShot(eury, {side: .2, dist: .9, up: .1}); eury.expr.hold = {AK_03_BrowInnerUp: 1, AK_25_JawOpen: .4};
    eury.play("crouchin", .15); await say("eury", "x_e4", "Orpheus!");
    // he runs to her
    stage(PLAYER, [24, 1.4, Math.PI / 2]); PLAYER.play("run"); { const a = PLAYER.root.position.clone(), b = eury.root.position.clone().add(V(Math.sin(eury.root.rotation.y) * .6 + Math.cos(eury.root.rotation.y) * .3, 0, Math.cos(eury.root.rotation.y) * .6 - Math.sin(eury.root.rotation.y) * .3)).setY(0), t2 = performance.now(); (function go() { const u = Math.min(1, (performance.now() - t2) / 1800); PLAYER.root.position.lerpVectors(a, b, u); if (u < 1) requestAnimationFrame(go); else { PLAYER.play("crouch"); PLAYER.root.lookAt(eury.root.position.clone().setY(0)); eury.root.lookAt(PLAYER.root.position.clone().setY(0)); } })(); }
    shot([31.2, 1.3, 5.4], [26, 1, 2.6], [30.8, 1.1, 5.1], [28, .8, 3.4], 2600); await pause(2000);
    { // a two-shot from the side: the two of them kneeling face to face in the grass
      const a = new THREE.Vector3(), b = new THREE.Vector3(); PLAYER.bones.Head.getWorldPosition(a); eury.bones.Head.getWorldPosition(b);
      const m = a.clone().lerp(b, .5), d = b.clone().sub(a).setY(0).normalize(), side = V(-d.z, 0, d.x);
      shot.cur = null; camShot.active = true; camShot.snap = true; camShot.pos.copy(m).addScaledVector(side, 1.35).add(V(0, .08, 0)); camShot.look.copy(m).add(V(0, -.08, 0)); }
    await say("orpheus", "x_o2", "Eurydice! Eurydice, I'm here, I'm here. Look at me.");
    faceShot(eury, {side: -.2, dist: .75, up: .08, ms: 9000}); eury.expr.hold = {AK_03_BrowInnerUp: .4, AK_44_MouthSmileLeft: .25, AK_45_MouthSmileRight: .25};
    await say("eury", "x_e5", "It's all right. It doesn't hurt anymore. Play me the swallows. I want to hear how it ends.");
    { const t3 = performance.now(); (function close() { const u = Math.min(1, (performance.now() - t3) / 2500); eury.expr.hold = {AK_09_EyeBlinkLeft: u, AK_10_EyeBlinkRight: u}; if (u < 1) requestAnimationFrame(close); })(); }
    await pause(2800); await fade("black", 2000);
    if (skipped) return;
    // grief: alone by the stream at dusk; the birds stop singing
    wedding.mood("dusk"); crowd.hide(); eury.root.visible = false; hymen.root.visible = false; wedding.snake.visible = false; smoking = false; orph.smoke.visible = false; orph.torch.visible = false;
    PLAYER.root.position.copy(wpos(33, .18, 9.15)); PLAYER.root.rotation.set(0, Math.PI, 0); PLAYER.play("Sitting_Idle_Loop", 0); playLyre(PLAYER, true);
    shot([30.5, 1.4, 6.2], [33, 1, 8.8], [29.8, 2, 5.4], [33, 1, 9], 12000);
    await fade("clear", 2000);
    [7, 5, 4, 2, 4, 5, 4].forEach((n, i) => setTimeout(() => { if (!skipped) pluck(n, .7); }, 600 + i * 900));
    await vo("", "v2_j3", "I sang at her funeral. Every bird in Thrace went quiet. It didn't help.");
    await pause(1500); await fade("black", 1800);
  };
  await reel();
  // Taenarum: the cave by the sea, the road down; then the river
  await fade("black", 300);
  playLyre(PLAYER, false); poses.delete(orph.hymenHolds); sound.party(false); sound.birds(false); smoking = false; orph.smoke.visible = false; orph.torch.visible = false;
  setWeddingLights(false); crowd?.hide(); for (const p of Object.values(orph)) if (p.root) p.root.visible = false;
  delete NPC.eury; delete NPC.hymen; delete NPC.friend; delete NPC.orpheus; PLAYER.expr.hold = {}; wedding.snake.visible = false;
  PLAYER.root.position.set(-53, 0, 13); PLAYER.root.rotation.set(0, Math.PI / 2, 0); PLAYER.play("walk", 0);
  if (!skipped) {
    // he carries a lamp down; ahead, the faint grey light of the dead
    const lamp = new THREE.PointLight(0xffa860, 5, 12, 1.5), deep = new THREE.PointLight(0x8aa0c8, 3, 16, 1.4); deep.position.set(-37, 2.6, 13); scene.add(lamp, deep);
    { const a = V(-54, 0, 13), b = V(-43.5, 0, 13), t0 = performance.now(); (function walk() { const u = Math.min(1, (performance.now() - t0) / 16000); PLAYER.root.position.lerpVectors(a, b, u); lamp.position.copy(PLAYER.root.position).add(V(.35, 1.3, .25)); lamp.intensity = 5 + Math.sin(performance.now() / 70) * .4 + Math.sin(performance.now() / 23) * .25; if (u < 1 && staging) requestAnimationFrame(walk); })(); }
    caveLights = [lamp, deep];
    shot([-40.8, 1.75, 13.3], [-52, 1.4, 13], [-41.2, 1.7, 13.2], [-48, 1.3, 13], 16000, true); // well inside the cave, clear of its open end
    await fade("clear", 1800);
    await vo("", "v2_j4", "So I took the old road down at Taenarum, where the cliffs go into the sea, and I kept walking until the light ran out.");
    // follow behind him, into the dark
    shot.cur = null; camShot.active = true; { const id = shot.cur = {}; (function follow() { if (shot.cur !== id || !staging) return; const p = PLAYER.root.position; camShot.pos.set(p.x - 2.6, 1.75, p.z + .7); camShot.look.set(p.x + 4, 1.3, p.z - .2); requestAnimationFrame(follow); })(); }
    await vo("", "v2_j5", "Nobody comes back from the Underworld. Everybody says so. But as far as I know, nobody has ever asked properly.");
    PLAYER.play("Idle_Loop"); faceShot(PLAYER, {side: .3, dist: 1.1, ms: 6000});
    await vo("", "v2_j6", "I'm going to ask.");
  }
  const card = $("#titlecard"); card.querySelector("small").textContent = "Chapter II"; card.querySelector("b").textContent = "The Lyre";
  await fade("black", 900);
  for (const l of caveLights) { scene.remove(l); l.dispose(); } caveLights = [];
  card.classList.add("on"); await pause(skipped ? 900 : 2800); card.classList.remove("on");
  await fade("clear", 600);
  me.pos.set(-36.5, 0, 13); me.yaw = -Math.PI / 2; me.pitch = -.03;
  $(".cine").classList.remove("on"); staging = false; PLAYER.setHead(false); PLAYER.play("Idle_Loop", 0);
  document.body.classList.remove("talking", "cinema"); camShot.active = false; talking = false; skipIntro = null; shot.cur = null;
  paintGoal();
}
/* ---------- the opening as animated video ----------
   Each chapter's opening can be made as video clips (film/chN.json lists the shots; the clips go in film/chN/01.mp4 and
   so on). When every clip is there, the game plays them instead of the 3D film; ?clips plays whatever is there so far. */
async function videoFilm(ch) {
  const q = new URLSearchParams(location.search);
  let list, bible;
  try { [list, bible] = await Promise.all([fetch(`film/ch${ch}.json`).then(r => r.json()), fetch("film/bible.json").then(r => r.json())]); } catch { return false; }
  const url = s => `film/ch${ch}/${s.id}.mp4`;
  const have = await Promise.all(list.shots.map(s => fetch(url(s), {method: "HEAD"}).then(r => r.ok && /video|mp4/.test(r.headers.get("content-type") || "")).catch(() => false)));
  const shots = list.shots.filter((s, i) => have[i]);
  if (!shots.length || (shots.length < list.shots.length && !q.has("clips"))) return false;
  const v = $("#clip"), sub = $("#sub");
  talking = true; staging = true; document.body.classList.add("clipping", "cinema", "talking"); $(".cine").classList.add("on");
  sound.party(false); sound.birds?.(false);
  let skipped = false; skipIntro = () => { skipped = true; v.pause(); v.onended?.(); };
  for (const shot of shots) {
    if (skipped) break;
    v.src = url(shot);
    // subtitles: each line gets a share of the clip in proportion to its length
    const words = shot.lines.map(l => l.text.split(/\s+/).length), total = words.reduce((a, b) => a + b, 0) || 1;
    v.ontimeupdate = () => {
      if (!shot.lines.length || !v.duration) return sub.classList.remove("on");
      let t = v.currentTime / v.duration, i = 0, acc = words[0] / total; while (t > acc && i < words.length - 1) { i++; acc += words[i] / total; }
      const l = shot.lines[i]; sub.querySelector("b").textContent = bible.characters[l.who]?.name || ""; sub.querySelector("span").textContent = l.text; sub.classList.add("on");
    };
    await new Promise(res => { v.onended = v.onerror = res; v.play().catch(res); });
    v.ontimeupdate = v.onended = v.onerror = null;
  }
  sub.classList.remove("on"); v.pause(); v.removeAttribute("src"); v.load();
  await fade("black", 10); document.body.classList.remove("clipping");
  return true;
}
/* ---------- the storybook opening (/play/?stills): painted stills that breathe, candles, water and a slow camera, with the film's voices ---------- */
const STORY = {1: [
  {img: "01", move: [1.02, 1.13, 0, -3], water: true, party: true, lines: [["Mikon", "w_i1", "My name is Mikon. I sell salt fish at the harbour in Corinth. Have done for twenty-two years. Tonight my cousin Thea is getting married, and I've brought the best I've got.", true]]},
  {img: "02", move: [1.12, 1.03, -3, 1], lines: [["Lykon", "w_l0", "Mikon! Over here, I saved you a seat. Wait. Is that fish? You brought fish to a wedding?"], ["Mikon", "w_m0", "Salt fish from Lechaion. The good kind. It's a present."], ["Kleio", "w_a0", "Give that to me before the bride smells it. Sit down, Mikon, have some wine, and try to enjoy yourself for once."]]},
  {img: "01", move: [1.22, 1.3, 4, 3], water: true, lines: [["Mikon", "w_m1", "Lykon. Lykon. Have you heard the one about the goat who wandered into the temple of Zeus?"], ["Lykon", "w_l1", "Mikon, it's your cousin's wedding. Not the goat one. Anything but the goat one."], ["Mikon", "w_m2", "So the goat walks right up to the altar, and the priest looks at the goat, and the goat looks at the priest, and the priest says..."]]},
  {img: "12", move: [1.03, 1.12, 0, 0], choke: true, lines: [["Mikon", "w_m3", "Ha! No, wait, wait, this is the good part, this is the..."], ["Lykon", "w_l2", "Mikon? Mikon, are you all right? You've gone a very strange colour."], ["Kleio", "w_a2", "He's choking! Somebody hit him on the back! Not like that, Demeas, harder!"], ["Nikias", "w_n1", "I've got him, I've got him! Breathe, cousin, just breathe!"], ["Thea", "w_t1", "Mikon, don't you dare. Not today! It's my wedding!"]]},
  {img: null, lines: [["Mikon", "w_vo1", "One moment I was laughing. The next, everyone I loved was leaning over me, and their voices were getting very far away.", true]]}
]};
async function speak(name, id, text, vo) {
  $("#sub b").textContent = name; $("#sub span").textContent = text; $("#sub").classList.add("on");
  sound.narration(!!vo); voiceEl.src = `voice/${id}.m4a`;
  const fallback = 900 + text.split(" ").length * 280;
  await new Promise(res => {
    let done = false; const fin = () => { if (done) return; done = true; voiceEl.onended = voiceEl.onerror = null; skipLine = null; res(); };
    voiceEl.onended = fin; voiceEl.onerror = () => setTimeout(fin, fallback); skipLine = () => { voiceEl.pause(); fin(); };
    voiceEl.play().catch(() => setTimeout(fin, fallback));
  });
  sound.narration(false); $("#sub").classList.remove("on"); await pause(240);
}
async function stillFilm(ch) {
  const beats = STORY[ch]; if (!beats || !new URLSearchParams(location.search).has("stills")) return false;
  const dir = `film/ch${ch}/stills/`;
  if (!(await fetch(dir + beats[0].img + ".jpg", {method: "HEAD"}).then(r => r.ok).catch(() => false))) return false;
  const box = $("#story"); box.innerHTML = ""; box.classList.add("on");
  talking = true; staging = true; document.body.classList.add("cinema", "talking"); $(".cine").classList.add("on");
  let skipped = false; skipIntro = () => { skipped = true; skipLine?.(); };
  sound.birds?.(false);
  let prev = null;
  for (const b of beats) {
    if (skipped) break;
    const layer = document.createElement("div"); layer.className = "still";
    if (b.img) {
      const src = dir + b.img + ".jpg";
      layer.innerHTML = `<div class="cam"><img src="${src}" alt="">${b.water ? `<img class="ripple" src="${src}" alt="">` : ""}<i class="glow"></i></div>`;
      await layer.querySelector("img").decode().catch(() => {});
      const [s0, s1, x0, y0] = b.move;
      layer.firstChild.animate([{transform: `scale(${s0}) translate(${x0}%,${y0}%)`}, {transform: `scale(${s1}) translate(0,0)`}], {duration: 30000, easing: "cubic-bezier(.3,.1,.3,1)", fill: "forwards"});
    }
    box.appendChild(layer); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); layer.classList.add("on");
    if (prev) { const old = prev; setTimeout(() => old.remove(), 1600); }
    prev = layer;
    if (b.party) sound.party(true);
    if (b.choke) { sound.party(false); sound.cough(); layer.classList.add("shake"); }
    await pause(b.img ? 900 : 1400);
    for (const [name, id, text, vo] of b.lines) { if (skipped) break; await speak(name, id, text, vo); }
    if (!skipped) await pause(600);
  }
  sound.party(false); $("#sub").classList.remove("on");
  await fade("black", 10); box.style.transition = "opacity 1.4s"; box.classList.remove("on"); await pause(1500);
  box.innerHTML = ""; box.style.transition = "";
  return true;
}
$("#begin").onclick = async () => {
  const intro = !new URLSearchParams(location.search).has("nointro");
  if (intro) { $("#fader").style.transition = "none"; $("#fader").style.background = "#000"; $("#fader").style.opacity = 1; document.body.classList.add("cinema"); // black at once: the world behind is built and waiting, and mustn't flash up before the film
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
  if (CH !== 1 && !chap.ready) { await chap.setup(); chap.ready = true; }
  if (!PLAYER) { PLAYER = G.cast(CH === 2 ? "orpheus" : "mikon", {seated: true}); PLAYER.play("Idle_Loop", 0); PLAYER.setHead(false); chap.onBody?.(PLAYER); }
  setTimeout(rotateHint, 50);
  $("#howto").classList.remove("on"); $("#bg").remove(); $("#mapBtn").hidden = false;
  if (intro) {
    const film = CH === 1 ? weddingFilm : orpheusFilm;
    await film({skip: await videoFilm(CH) || await stillFilm(CH)}); // the animated video when it's there, otherwise the 3D film
  }
  playing = true; me.started = performance.now();
  grabMouse();
  if (CH !== 1 || new URLSearchParams(location.search).has("nointro")) setTimeout(() => { if (!talking) toast("Hermes is waiting for you, just ahead."); }, 700);
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
  water.onBeforeRender = function (...a) { const was = PLAYER?.headShown; PLAYER?.setHead(true); before.apply(this, a); PLAYER?.setHead(was); };
}
const bodyPrev = new THREE.Vector3();
let bob = 0;
let staging = false;
function moveBody(dt) {
  if (!PLAYER) return;
  if (staging) { if (!Object.values(NPC).includes(PLAYER)) PLAYER.mixer.update(dt); PLAYER.expr?.update(performance.now(), PLAYER.speaking, sound.voiceLevel ? sound.voiceLevel() : 0); return; }
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
  cast: (id, opts) => makeCastMember(id, {ASSETS, CLIPS, scene, ...opts}), mount, hold, poses, reach, placeNPC, clearChapterOne, hermesLeaves,
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
  $("#chOver").textContent = c.over; $("#chTitle").textContent = c.title;
  $("#chRule").textContent = c.rule; $("#chLine").textContent = c.line;
  $(".hud .rule").textContent = c.rule;
  $("#keys").innerHTML = n === 1 ? keysOne : touchMode ? "<b>Left thumb</b><span>walk</span><b>Right thumb</b><span>look</span><b>lyre</b><span>hold to play</span><b>tap</b><span>play a note, in a song</span><b>use</b><span>talk, pick up</span>" : chap.keys;
  $("#howto .steps").innerHTML = n === 2 ? chap.howto : howtoOne;
  $("#tQ").hidden = n !== 1; $("#tF").hidden = n !== 2;
  markPalace($("#palace"), n);
  paintGoal(); paintStats();
}
drawPalace($("#palace"), CHAPTERS, pickChapter, save.get().done);
pickChapter(+(new URLSearchParams(location.search).get("chapter") || (save.get().done.includes(1) ? 2 : 1)));
// the lyre button on touch screens: hold to play
$("#tF").addEventListener("touchstart", e => { e.preventDefault(); lyreHeld = true; }, {passive: false});
$("#tF").addEventListener("touchend", () => { lyreHeld = false; }); $("#tF").addEventListener("touchcancel", () => { lyreHeld = false; });

// For testing only: /play/?debug exposes the game state in the console.
if (new URLSearchParams(location.search).has("debug")) window.__game = {me, dog, NPC, camShot, THREE, G, get player() { return PLAYER; }, get chap() { return chap; }, get ride() { return ride; }, setLightsFar, crossRiver, FAR, PLACES, interact, conversation, pickCoin, wakeDog, camera, hound, renderer, composer, get playing() { return playing; }, playLyre, faceShot, poses, get trinkets() { return trinkets; }, earnTrinket, get wedding() { return wedding; }, scene};
