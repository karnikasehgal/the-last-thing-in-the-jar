// The spring meadow outside the east gate, where Eurydice runs down to the stream: rolling green land under a high
// sun, long grass moving in the wind, wildflowers, round trees, a clear stream over pebbles, and hills going blue
// into the distance. Everything is built here in code; coordinates are the wedding's (the gate is at x = 16.5).
// The ground stays flat where the story happens (x 15..46, z -13..13) and only starts to roll beyond it.
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// smooth value noise, so hills and patches of colour have no seams
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, z) => vnoise(x, z) * .5 + vnoise(x * 2.1, z * 2.1) * .25 + vnoise(x * 4.3, z * 4.3) * .125;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// the stream winds across the meadow; its bed is cut into the ground
const streamZ = x => 11.2 + Math.sin(x * .11) * 1.6 + Math.sin(x * .27 + 1) * .5;
const STREAM_W = 1.7;
export function groundHeight(x, z) {
  const out = Math.max(15 - x, x - 46, Math.abs(z) - 13, 0); // how far outside the stage
  let h = smooth(0, 30, out) * (2 + fbm(x * .03, z * .03) * 14) + smooth(0, 8, out) * (fbm(x * .15, z * .15) - .4) * .8;
  h *= smooth(14, 24, x); // never rising into the courtyard behind the gate
  const d = Math.abs(z - streamZ(x)); if (d < STREAM_W + .8) h -= .32 * smooth(STREAM_W + .8, STREAM_W * .4, d);
  return h;
}

const windUniforms = {uTime: {value: 0}};
function windy(mat, strength = .09) { // grass leans and ripples in waves of wind (only the tips move)
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = windUniforms.uTime;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      #ifdef USE_INSTANCING
      vec3 ip = vec3(instanceMatrix[3][0], 0., instanceMatrix[3][2]);
      float tip = pow(clamp(position.y / .62, 0., 1.), 1.6);
      float gust = sin(uTime * .9 + ip.x * .18 + ip.z * .07) * .5 + .5;
      transformed.x += (sin(uTime * 2.3 + ip.x * 1.3 + ip.z * .7) * .35 + gust * .8) * tip * ${strength.toFixed(3)};
      transformed.z += cos(uTime * 1.9 + ip.z * 1.1) * tip * ${(strength * .4).toFixed(3)};
      #endif`);
  };
  mat.customProgramCacheKey = () => "wind" + strength;
  return mat;
}

export function buildMeadow(lite) {
  const meadow = new THREE.Group();
  // ground: rolling, in sunny yellow-greens and deep greens, with a fine grain
  {
    const geo = new THREE.PlaneGeometry(156, 220, lite ? 80 : 150, lite ? 110 : 200); geo.rotateX(-Math.PI / 2); geo.translate(92, 0, 0); // (from the gate on: the courtyard has its own floor)
    const p = geo.attributes.position, col = [], c = new THREE.Color(), sun = new THREE.Color(0x9fb84a), deep = new THREE.Color(0x3f6a2a), earth = new THREE.Color(0x8a7a52);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = groundHeight(x, z); p.setY(i, y);
      c.copy(deep).lerp(sun, smooth(.3, .75, fbm(x * .05 + 3, z * .05))).lerp(earth, Math.max(0, smooth(-.05, -.3, y)) * .8); // the stream bed is earth
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const grain = new THREE.CanvasTexture((() => { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d"), d = g.createImageData(256, 256);
      for (let i = 0; i < d.data.length; i += 4) { const v = 200 + Math.random() * 55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return cv; })());
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(160, 160); grain.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, map: grain, roughness: 1})); ground.receiveShadow = true; meadow.add(ground);
  }
  // long grass: curved blades, dark at the root and sunlit at the tip, thickest where the camera goes
  {
    const blade = new THREE.BufferGeometry(), bp = [], bc = [], bi = [], S = 5;
    for (let k = 0; k <= S; k++) { const t = k / S, w = .024 * (1 - t * .92), bend = t * t * .18, y = t * .62; bp.push(-w, y, bend, w, y, bend); const sh = .38 + t * .8; bc.push(sh, sh, sh * .95, sh, sh, sh * .95); }
    for (let k = 0; k < S; k++) bi.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
    blade.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); blade.setAttribute("color", new THREE.Float32BufferAttribute(bc, 3)); blade.setIndex(bi); blade.computeVertexNormals();
    const n = lite ? 16000 : 60000, mat = windy(new THREE.MeshStandardMaterial({vertexColors: true, roughness: .7, side: THREE.DoubleSide}));
    const bl = new THREE.InstancedMesh(blade, mat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), e = new THREE.Euler();
    let placed = 0;
    while (placed < n) {
      // most of it near the story (around where she falls), the rest spread wide
      const near = placed < n * .6, x = near ? 17 + Math.random() * 30 : 15 + Math.random() * 75, z = near ? -14 + Math.random() * 28 : -40 + Math.random() * 80;
      if (Math.abs(z - streamZ(x)) < STREAM_W * .75) continue; // not in the water
      const trodden = Math.hypot(x - 29.6, z - 4.4) < 1.6; // short where she falls, so the camera sees her and the snake
      e.set((Math.random() - .5) * .35, Math.random() * 6.3, (Math.random() - .5) * .35); q.setFromEuler(e);
      const tall = trodden ? .12 + Math.random() * .12 : (.55 + Math.random() * .8) * (.8 + fbm(x * .2, z * .2) * .5);
      m.compose(new THREE.Vector3(x, groundHeight(x, z) - .02, z), q, new THREE.Vector3(1 + Math.random() * .5, tall, 1)); bl.setMatrixAt(placed, m);
      bl.setColorAt(placed, c.setHSL(.2 + Math.random() * .06 - fbm(x * .05 + 3, z * .05) * .04, .55 + Math.random() * .15, .3 + Math.random() * .12 + fbm(x * .05 + 3, z * .05) * .1));
      placed++;
    }
    bl.castShadow = false; bl.receiveShadow = true; bl.onBeforeRender = () => { windUniforms.uTime.value = performance.now() / 1000; }; meadow.add(bl);
  }
  // wildflowers: five round petals around a gold eye, held up on the grass, in drifts of one colour
  {
    const petals = [];
    for (let k = 0; k < 5; k++) { const pg = new THREE.SphereGeometry(.02, 7, 5); pg.scale(1, .3, 1.4); pg.translate(0, 0, .022); pg.rotateY(k / 5 * Math.PI * 2); petals.push(pg); }
    const eye = new THREE.SphereGeometry(.011, 7, 5); eye.translate(0, .006, 0);
    const flower = mergeGeometries([...petals.map(g => { g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 3).fill(1), 3)); return g; }),
      (() => { const c = new THREE.Color(0xe8a828); eye.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({length: eye.attributes.position.count}, () => [c.r, c.g, c.b]).flat(), 3)); return eye; })()]);
    const n = lite ? 1500 : 5000, fl = new THREE.InstancedMesh(flower, windy(new THREE.MeshStandardMaterial({vertexColors: true, roughness: .55}), .05), n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    const drifts = [0xf6f2ea, 0xf2d84a, 0xe58ab0, 0x9a8ae6, 0xf6f2ea, 0xf0a050];
    let placed = 0;
    while (placed < n) {
      const x = 16 + Math.random() * 60, z = -30 + Math.random() * 60;
      if (Math.abs(z - streamZ(x)) < STREAM_W || Math.hypot(x - 29.6, z - 4.4) < 1.7 || fbm(x * .12, z * .12) < .45) continue; // in drifts, not everywhere
      q.setFromEuler(new THREE.Euler((Math.random() - .5) * .5, Math.random() * 6, (Math.random() - .5) * .5));
      m.compose(new THREE.Vector3(x, groundHeight(x, z) + .3 + Math.random() * .35, z), q, new THREE.Vector3().setScalar(.8 + Math.random() * .6)); fl.setMatrixAt(placed, m);
      fl.setColorAt(placed, c.setHex(drifts[Math.floor(vnoise(x * .08, z * .08) * drifts.length)]).offsetHSL(0, 0, (Math.random() - .5) * .08)); placed++;
    }
    meadow.add(fl);
  }
  // the stream: clear water, pale over the shallows and deeper green-blue in the middle, rippling as it runs
  {
    const ripple = new THREE.CanvasTexture((() => { const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d"), d = g.createImageData(256, 256);
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const a = x / 256 * Math.PI * 2, b = y / 256 * Math.PI * 2;
        const nx = Math.sin(a * 3 + Math.sin(b * 2) * 2) * .5 + Math.sin(a * 7 + b * 3) * .25, nz = Math.cos(b * 4 + Math.sin(a * 3)) * .5 + Math.cos(b * 9 + a) * .2, i = (y * 256 + x) * 4;
        d.data[i] = 128 + nx * 90; d.data[i + 1] = 128 + nz * 90; d.data[i + 2] = 255; d.data[i + 3] = 255; }
      g.putImageData(d, 0, 0); return cv; })());
    ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping; ripple.repeat.set(30, 1.5);
    const seg = 160, P = [], C = [], UV = [], I = [], shallow = new THREE.Color(0xa8e0cc), deep = new THREE.Color(0x3a9090), c = new THREE.Color();
    for (let i = 0; i <= seg; i++) {
      const x = 12 + i / seg * 90, z0 = streamZ(x);
      for (let j = 0; j <= 6; j++) { const t = j / 6, z = z0 + (t - .5) * 2 * (STREAM_W + .25); P.push(x, -.13, z); c.copy(shallow).lerp(deep, Math.sin(t * Math.PI) ** 1.5); C.push(c.r, c.g, c.b); UV.push(i / seg, t); }
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < 6; j++) { const a = i * 7 + j, b = a + 7; I.push(a, a + 1, b, a + 1, b + 1, b); } // (wound to face up)
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2)); geo.setIndex(I); geo.computeVertexNormals();
    const water = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: .04, metalness: 0, transparent: true, opacity: .5, depthWrite: false, normalMap: ripple, normalScale: new THREE.Vector2(.35, .35),
      clearcoat: 1, clearcoatRoughness: .05, sheen: .3, sheenColor: new THREE.Color(0xd8f0ff), envMapIntensity: 1.5}));
    water.onBeforeRender = () => { ripple.offset.x = -performance.now() / 9000; }; // it runs downstream
    water.receiveShadow = true; meadow.add(water);
    // pebbles along the banks and showing through the shallows
    const peb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.08, 1), new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .75}), lite ? 600 : 1800), m = new THREE.Matrix4(), q = new THREE.Quaternion(), pc = new THREE.Color();
    for (let i = 0; i < peb.count; i++) { const x = 13 + Math.random() * 85, side = Math.random() < .5 ? -1 : 1, off = (i % 2 ? Math.random() * STREAM_W : STREAM_W - .2 + Math.random() * .9) * side, z = streamZ(x) + off; // (half on the banks, half on the bed, seen through the water)
      q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, 0)); const s = .3 + Math.random() * 1.1;
      m.compose(new THREE.Vector3(x, groundHeight(x, z) - .02, z), q, new THREE.Vector3(s * 1.3, s * .55, s)); peb.setMatrixAt(i, m); peb.setColorAt(i, pc.setHSL(.08, .08 + Math.random() * .1, .45 + Math.random() * .25)); }
    meadow.add(peb);
  }
  // mossy boulders along the banks, green where the rain falls on them
  {
    const rnd = (a => () => (a = (a * 9301 + 49297) % 233280) / 233280)(11), moss = new THREE.Color(0x5a7a32), stone = new THREE.Color(0x8a867c);
    for (let k = 0; k < 26; k++) {
      const geo = mergeVertices(new THREE.IcosahedronGeometry(.35 + rnd() * .5, 2)); geo.deleteAttribute("normal"); geo.deleteAttribute("uv");
      const p = geo.attributes.position, col = [], c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 1 + (vnoise(v.x * 4 + k, v.z * 4 + v.y * 3) - .5) * .5; v.multiplyScalar(n); v.y *= .65; p.setXYZ(i, v.x, v.y, v.z);
        c.copy(stone).lerp(moss, smooth(.0, .25, v.y) * (.6 + vnoise(v.x * 9, v.z * 9) * .4)); col.push(c.r, c.g, c.b); }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const x = 18 + rnd() * 70, side = rnd() < .5 ? -1 : 1, z = streamZ(x) + side * (STREAM_W + .2 + rnd() * .9);
      const b = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .9})); b.position.set(x, groundHeight(x, z) - .08, z); b.rotation.y = rnd() * 6; b.castShadow = b.receiveShadow = true; meadow.add(b);
    }
  }
  // ferns where the ground is wet: arching fronds, each a stem with leaflets that shrink toward the tip
  {
    const frond = (() => { const P = [], C = [], N = 14, light = new THREE.Color(0x7aa848), dark = new THREE.Color(0x2e5a24), c = new THREE.Color();
      for (let i = 0; i < N; i++) { const t = i / N, t2 = (i + 1) / N, y = s => Math.sin(s * 1.9) * .32, z = s => s * .55, w = (1 - t) * .09 + .01;
        for (const sd of [-1, 1]) { const a = [0, y(t), z(t)], b = [0, y(t2), z(t2)], tip = [sd * w, y(t) + .02 - t * .03, z(t) + .03]; P.push(...a, ...b, ...tip);
          for (const k of [0, 1, 2]) { c.copy(dark).lerp(light, t * .6 + (k === 2 ? .4 : 0)); C.push(c.r, c.g, c.b); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); return g; })();
    const parts = []; for (let k = 0; k < 7; k++) { const f = frond.clone(); f.rotateY(k / 7 * Math.PI * 2); parts.push(f); }
    const fern = mergeGeometries(parts), n = lite ? 120 : 360;
    const ferns = new THREE.InstancedMesh(fern, windy(new THREE.MeshStandardMaterial({vertexColors: true, roughness: .75, side: THREE.DoubleSide}), .03), n), m = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) { const x = 14 + Math.random() * 80, side = Math.random() < .5 ? -1 : 1, z = streamZ(x) + side * (STREAM_W + .3 + Math.random() * 1.6), s = .9 + Math.random() * 1.1;
      q.setFromEuler(new THREE.Euler(0, Math.random() * 6.3, 0)); m.compose(new THREE.Vector3(x, groundHeight(x, z) - .03, z), q, new THREE.Vector3(s, s, s)); ferns.setMatrixAt(i, m); }
    ferns.receiveShadow = true; meadow.add(ferns);
  }
  // trees: round, full crowns of many leafy clumps, lit from above and shadowed beneath, on a trunk with a branch or two
  {
    const tree = (h, seed) => {
      const parts = [], rnd = (a => () => (a = (a * 9301 + 49297) % 233280) / 233280)(seed), bark = new THREE.Color(0x5a4430);
      const trunk = new THREE.CylinderGeometry(.16 * h / 6, .3 * h / 6, h * .55, 8, 3); trunk.translate(0, h * .27, 0);
      const tc = []; for (let i = 0; i < trunk.attributes.position.count; i++) tc.push(bark.r, bark.g, bark.b); trunk.setAttribute("color", new THREE.Float32BufferAttribute(tc, 3)); parts.push(trunk);
      const light = new THREE.Color(0x8fb84a), dark = new THREE.Color(0x2f5226);
      for (let k = 0; k < 11; k++) {
        const a = rnd() * 6.3, rr = rnd() * h * .2, cy = h * (.62 + rnd() * .25);
        const cl = mergeVertices(new THREE.IcosahedronGeometry(h * (.13 + rnd() * .08), 3)); cl.deleteAttribute("normal"); cl.deleteAttribute("uv"); // (welded, so it shades round, not faceted)
        const p = cl.attributes.position, col = []; const c = new THREE.Color();
        for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 1 + (vnoise(v.x * 9 + k, v.z * 9) - .5) * .35; v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z);
          c.copy(dark).lerp(light, smooth(-h * .15, h * .2, v.y + (cy - h * .7))); col.push(c.r, c.g, c.b); }
        cl.translate(Math.cos(a) * rr, cy, Math.sin(a) * rr); cl.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); cl.computeVertexNormals(); parts.push(cl);
      }
      trunk.deleteAttribute("uv"); trunk.computeVertexNormals();
      const g = mergeGeometries(parts);
      const t = new THREE.Mesh(g, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .85})); t.castShadow = true; t.receiveShadow = true; return t;
    };
    const spots = [[30, -10, 6], [44, -5, 7], [36, 16, 5.5], [50, 8, 6.5], [24, 14, 5], [58, -16, 7.5], [64, 14, 6], [70, -4, 8], [52, 24, 7], [78, 20, 8.5], [82, -22, 9]];
    spots.forEach(([x, z, h], i) => { const t = tree(h, i * 17 + 3); t.position.set(x, groundHeight(x, z) - .05, z); t.rotation.y = i; meadow.add(t); });
  }
  // the rock by the stream, where the snake waits
  { const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.5, 1), new THREE.MeshStandardMaterial({color: 0x8a8278, roughness: .9})); rock.scale.set(1.3, .7, 1); rock.position.set(33, .25, 9); rock.castShadow = rock.receiveShadow = true; meadow.add(rock); }
  // far away: hills, then mountains, going blue in the haze
  {
    const ring = (r0, r1, hMax, color, seed) => {
      const geo = new THREE.CylinderGeometry(r1, r0, 1, 128, 6, true), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), top = p.getY(i) > 0; const a = Math.atan2(z, x);
        const peak = hMax * (.35 + fbm(Math.cos(a) * 3 + seed, Math.sin(a) * 3) * .9); p.setY(i, top ? peak : -2); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, roughness: 1, side: THREE.DoubleSide})); m.position.set(40, 0, 0); return m;
    };
    meadow.add(ring(118, 112, 22, 0x6a8a52, 1), ring(165, 150, 48, 0x7a90a8, 7));
  }
  return meadow;
}
