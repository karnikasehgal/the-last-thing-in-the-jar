// Real surfaces: scanned materials from Poly Haven (CC0), each a colour map, a normal map (the small bumps that catch
// light) and an ARM map (ambient occlusion, roughness, metalness). The game's walls and floors are plain boxes of every
// size, so the textures are laid on from world space along all three axes and blended (triplanar mapping): stone stays
// stone-sized whatever shape it's on, with no stretching and no seams.
// Also: lighting captured from real places (HDRIs), dimmed to suit each scene, for reflections and soft ambient light.
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const L = new THREE.TextureLoader(), cache = {};
function load(name, srgb) {
  const t = L.load(`assets/env/${name}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
// size: metres one copy of the texture covers; tint multiplies the colour; rough scales the roughness
export function pbr(base, {size = 2, tint = 0xffffff, rough = 1, bump = 1, ao = .8, metal = 0, vc = false, side = THREE.FrontSide} = {}) {
  const key = [base, size, tint, rough, bump, ao, metal, vc, side].join("|");
  if (cache[key]) return cache[key];
  const diff = load(base + "_diff", true), nor = load(base + "_nor"), arm = load(base + "_arm");
  const m = new THREE.MeshStandardMaterial({color: tint, roughness: rough, metalness: metal, vertexColors: vc, side});
  const u = {tDiff: {value: diff}, tNor: {value: nor}, tArm: {value: arm}, uScale: {value: 1 / size}, uBump: {value: bump}, uAO: {value: ao}};
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = "varying vec3 vWP; varying vec3 vWN;\n" + sh.vertexShader.replace("#include <worldpos_vertex>",
      "#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = `uniform sampler2D tDiff, tNor, tArm; uniform float uScale, uBump, uAO; varying vec3 vWP; varying vec3 vWN;
      vec3 triW() { vec3 w = pow(abs(normalize(vWN)), vec3(4.)); return w / (w.x + w.y + w.z); }
      vec4 tri(sampler2D t) { vec3 w = triW(); return texture2D(t, vWP.zy * uScale) * w.x + texture2D(t, vWP.xz * uScale) * w.y + texture2D(t, vWP.xy * uScale) * w.z; }
      ` + sh.fragmentShader
      .replace("#include <map_fragment>", `#include <map_fragment>
        vec4 armT = tri(tArm); diffuseColor.rgb *= tri(tDiff).rgb * mix(1., armT.r, uAO);`)
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness * armT.g;")
      .replace("#include <normal_fragment_maps>", `{ // whiteout-blended triplanar normals, built in world space and turned into view space
        vec3 wn = normalize(vWN) * (gl_FrontFacing ? 1. : -1.), w = triW();
        vec3 tx = texture2D(tNor, vWP.zy * uScale).xyz * 2. - 1., ty = texture2D(tNor, vWP.xz * uScale).xyz * 2. - 1., tz = texture2D(tNor, vWP.xy * uScale).xyz * 2. - 1.;
        tx = vec3(tx.xy * uBump + wn.zy, abs(tx.z) * wn.x); ty = vec3(ty.xy * uBump + wn.xz, abs(ty.z) * wn.y); tz = vec3(tz.xy * uBump + wn.xy, abs(tz.z) * wn.z);
        vec3 nW = normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
        normal = normalize((viewMatrix * vec4(nW, 0.)).xyz); }`);
  };
  m.customProgramCacheKey = () => "pbr";
  return cache[key] = m;
}

// An HDRI as the scene's light from all around, scaled (strength) and tinted to suit the place.
const envs = {};
export function hdri(renderer, name, strength = 1, tint = [1, 1, 1]) {
  const key = name + strength + tint;
  return envs[key] ||= new Promise(res => new RGBELoader().load(`assets/env/${name}.hdr`, t => {
    const d = t.image.data; // (half floats: scale them through a float copy)
    const f = d instanceof Uint16Array ? Float32Array.from(d, THREE.DataUtils.fromHalfFloat) : d;
    for (let i = 0; i < f.length; i += 4) { f[i] *= strength * tint[0]; f[i + 1] *= strength * tint[1]; f[i + 2] *= strength * tint[2]; }
    const t2 = new THREE.DataTexture(f, t.image.width, t.image.height, THREE.RGBAFormat, THREE.FloatType); t2.mapping = THREE.EquirectangularReflectionMapping; t2.needsUpdate = true;
    const pm = new THREE.PMREMGenerator(renderer), env = pm.fromEquirectangular(t2).texture; pm.dispose(); t.dispose(); t2.dispose();
    res(env);
  }));
}
