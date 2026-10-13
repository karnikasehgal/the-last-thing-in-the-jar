// Cerberus: a huge three-headed hound in the animated-film manner (a mastiff's bulk, big glowing eyes, spiked collars,
// short fur drawn as shells), built in code so it can be lit and animated by the game's own logic.
// It faces +x. About 2.8 m long and 1.6 m at the shoulder.
import * as THREE from "three";

export function makeHound(scene) {
  const g = new THREE.Group();
  // charcoal fur with a warm sheen where the light grazes it, and ember light from within
  const hide = new THREE.MeshPhysicalMaterial({color: 0x2a221e, roughness: .82, sheen: 1, sheenRoughness: .5, sheenColor: new THREE.Color(0x9a6248), emissive: 0x120403});
  const rimMat = new THREE.MeshBasicMaterial({color: 0xb2391a, transparent: true, opacity: .3, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending});
  const bone = new THREE.MeshStandardMaterial({color: 0xe8dcc4, roughness: .45});
  const ember = new THREE.MeshBasicMaterial({color: 0xff6a24});
  const bronze = new THREE.MeshStandardMaterial({color: 0x8a5a2a, roughness: .35, metalness: .85});
  // short fur: the same shape drawn again in thin shells a little further out each time, holed by a noise of hairs
  const hairs = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), d = x.createImageData(128, 128);
    for (let k = 0; k < d.data.length; k += 4) { const v = Math.random() ** 2.2 * 255; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } x.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; })();
  const shells = [1, 2, 3, 4, 5].map(k => new THREE.MeshStandardMaterial({color: new THREE.Color(0x2a221e).lerp(new THREE.Color(0x5a4234), k / 6), roughness: .9, alphaMap: hairs, alphaTest: .12 + k * .14, emissive: 0x0e0302}));
  const furry = (m, depth = .035) => { shells.forEach((mat, k) => { const sh = new THREE.Mesh(m.geometry, mat); sh.scale.setScalar(1 + depth * (k + 1) / 5 / Math.max(.15, m.geometry.boundingSphere?.radius || (m.geometry.computeBoundingSphere(), m.geometry.boundingSphere.radius))); m.add(sh); }); return m; };
  const rim = (m, s = 1.07) => { const r = new THREE.Mesh(m.geometry, rimMat); r.scale.setScalar(s); m.add(r); return m; };
  const part = (geo, parent, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = hide) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
  };
  const fur = (geo, parent, ...a) => rim(furry(part(geo, parent, ...a)));
  // a limb segment from (0,0,0) pointing down -y by `len`
  const seg = (r0, r1, len) => { const geo = new THREE.CapsuleGeometry((r0 + r1) / 2, len, 6, 14); geo.translate(0, -len / 2, 0); return geo; };

  /* body: a deep barrel chest, a tucked waist, strong haunches */
  const body = new THREE.Group(); body.position.y = 1.32; g.add(body);
  fur(new THREE.SphereGeometry(.6, 28, 20), body, .36, .02, 0, 0, 0, 0, 1.12, 1.0, .82);        // chest
  fur(new THREE.SphereGeometry(.42, 24, 16), body, -.3, .02, 0, 0, 0, 0, 1.4, .9, .82);         // belly, tucked up
  fur(new THREE.SphereGeometry(.44, 24, 18), body, -.9, .04, 0, 0, 0, 0, 1.05, 1.0, .95);       // haunches
  for (let i = 0; i < 9; i++) part(new THREE.ConeGeometry(.05, .2, 6), body, .7 - i * .2, .55 - Math.abs(i - 3) * .03, 0, 0, 0, -.25, 1, 1, 1, bone); // a ridge of spines

  /* tail: thick at the root, swinging */
  const tail = new THREE.Group(); tail.position.set(-1.28, .14, 0); body.add(tail);
  let t = tail; const tailBits = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Group(); s.position.set(-.2, 0, 0); t.add(s); fur(new THREE.CapsuleGeometry(.075 - i * .011, .14, 4, 10), s, -.1, 0, 0, 0, 0, Math.PI / 2); tailBits.push(s); t = s; }

  /* legs: heavy, with big paws and pale claws; the back legs with the backwards hock */
  const legs = [];
  const paw = (parent, y) => { part(new THREE.SphereGeometry(.15, 16, 12), parent, .06, y, 0, 0, 0, 0, 1.5, .62, 1.15);
    for (const c of [-1.5, -.5, .5, 1.5]) part(new THREE.ConeGeometry(.022, .1, 6), parent, .27, y - .02, c * .045, 0, 0, -Math.PI / 2, 1, 1, 1, bone); };
  for (const side of [1, -1]) {
    const sh = new THREE.Group(); sh.position.set(.55, 1.2, side * .34); g.add(sh);
    fur(seg(.2, .15, .55), sh, 0, 0, 0);
    const elbow = new THREE.Group(); elbow.position.y = -.55; sh.add(elbow);
    fur(seg(.13, .1, .48), elbow, 0, 0, 0);
    const wrist = new THREE.Group(); wrist.position.y = -.5; elbow.add(wrist);
    fur(seg(.1, .1, .1), wrist, 0, 0, 0); paw(wrist, -.17);
    legs.push({upper: sh, mid: elbow, low: wrist, front: true, side});
    const hip = new THREE.Group(); hip.position.set(-.95, 1.22, side * .34); g.add(hip);
    fur(seg(.24, .15, .58), hip, 0, 0, 0);
    const knee = new THREE.Group(); knee.position.y = -.58; hip.add(knee);
    fur(seg(.12, .09, .5), knee, 0, 0, 0);
    const hock = new THREE.Group(); hock.position.y = -.5; knee.add(hock);
    fur(seg(.09, .08, .28), hock, 0, 0, 0); paw(hock, -.33);
    legs.push({upper: hip, mid: knee, low: hock, front: false, side});
  }

  /* three necks and heads: broad mastiff skulls, heavy jowls, ears laid back, big glowing eyes, a spiked collar each */
  const heads = [];
  const eyeWhite = new THREE.MeshStandardMaterial({color: 0xf2e6d0, roughness: .3}), iris = new THREE.MeshBasicMaterial({color: 0xffa020}), pupil = new THREE.MeshBasicMaterial({color: 0x080404});
  const nose = new THREE.MeshPhysicalMaterial({color: 0x0a0706, roughness: .25, clearcoat: 1});
  for (const [z, yaw] of [[-.34, .42], [0, 0], [.34, -.42]]) {
    const neck = new THREE.Group(); neck.position.set(.85, 1.55, z); neck.rotation.y = yaw; g.add(neck);
    fur(new THREE.CapsuleGeometry(.19, .5, 6, 16), neck, .25, .25, 0, 0, 0, -.95);
    const collar = new THREE.Group(); collar.position.set(.1, .08, 0); collar.rotation.z = -.95 + Math.PI / 2; neck.add(collar);
    part(new THREE.TorusGeometry(.23, .035, 10, 28), collar, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1, bronze);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; part(new THREE.ConeGeometry(.025, .09, 6), collar, Math.cos(a) * .26, 0, Math.sin(a) * .26, 0, 0, -Math.PI / 2, 1, 1, 1, bronze).lookAt(Math.cos(a) * 2, 0, Math.sin(a) * 2); }
    const head = new THREE.Group(); head.position.set(.55, .55, 0); neck.add(head);
    fur(new THREE.SphereGeometry(.23, 24, 18), head, 0, .02, 0, 0, 0, 0, 1.1, .95, 1.0);                 // skull
    fur(new THREE.SphereGeometry(.16, 20, 14), head, .25, -.05, 0, 0, 0, -.05, 1.45, .85, 1.05);         // muzzle, short and broad
    for (const s of [-1, 1]) {
      fur(new THREE.SphereGeometry(.1, 14, 10), head, .27, -.12, s * .09, 0, 0, 0, 1.2, .9, .8);          // jowls
      fur(new THREE.ConeGeometry(.09, .26, 8), head, -.1, .2, s * .14, s * .5, 0, .9);                     // ears, laid back
      part(new THREE.SphereGeometry(.052, 16, 12), head, .16, .07, s * .11, 0, 0, 0, 1, 1, .8, eyeWhite); // eyes
      part(new THREE.SphereGeometry(.032, 14, 10), head, .2, .072, s * .118, 0, 0, 0, 1, 1, .5, iris);
      part(new THREE.SphereGeometry(.016, 10, 8), head, .214, .074, s * .12, 0, 0, 0, 1, 1, .5, pupil);
      fur(new THREE.SphereGeometry(.07, 12, 8), head, .14, .14, s * .1, 0, 0, -.3, 1.5, .55, 1);           // a heavy brow
    }
    part(new THREE.SphereGeometry(.06, 14, 10), head, .47, -.02, 0, 0, 0, 0, 1.1, .8, 1.2, nose);
    const jaw = new THREE.Group(); jaw.position.set(.12, -.14, 0); head.add(jaw);
    fur(new THREE.SphereGeometry(.12, 16, 10), jaw, .18, -.02, 0, 0, 0, .05, 1.7, .5, .9);
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      part(new THREE.ConeGeometry(.02, .08, 6), jaw, .08 + k * .07, .05, s * .06, 0, 0, 0, 1, 1, 1, bone);
      part(new THREE.ConeGeometry(.022, .1, 6), head, .22 + k * .06, -.12, s * .07, Math.PI, 0, 0, 1, 1, 1, bone);
    }
    const mouthGlow = part(new THREE.SphereGeometry(.06, 8, 6), jaw, .12, .03, 0, 0, 0, 0, 2, .5, .8, ember);
    heads.push({neck, head, jaw, mouthGlow, seed: Math.random() * 10, yaw});
  }

  /* light so it reads in the dark: ember from within, a red rim from behind */
  const inner = new THREE.PointLight(0xff4a1a, 2.5, 5, 2); inner.position.set(.6, 1.6, 0); g.add(inner);
  const back = new THREE.PointLight(0xb23a1a, 10, 8, 1.5); back.position.set(-1.8, 2.8, 0); g.add(back);

  /* smoke peeling off its back */
  const smokeTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(24,12,9,.85)"); gr.addColorStop(1, "rgba(24,12,9,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const N = 60, life = new Float32Array(N).map(() => Math.random());
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const smoke = new THREE.Points(sg, new THREE.PointsMaterial({map: smokeTex, size: 1.1, transparent: true, depthWrite: false, opacity: .6}));
  scene.add(smoke);
  scene.add(g);
  return {g, body, legs, heads, tailBits, smoke, life, N, inner, phase: 0};
}

// mode: "sleep" | "idle" | "walk" | "run" ; speed in m/s ; x,z,yaw = where it is and which way it faces
export function animateHound(h, {mode, speed, x, z, yaw, hunting}, dt, now) {
  const moving = mode === "walk" || mode === "run", sleeping = mode === "sleep";
  h.phase += dt * (moving ? 2.2 + speed * 1.1 : 1);
  const p = h.phase;
  h.g.position.set(x, sleeping ? -.55 : 0, z);
  h.g.rotation.y = -yaw + Math.PI / 2;
  h.body.position.y = sleeping ? 1.05 : 1.32 + (moving ? Math.abs(Math.sin(p)) * .07 : Math.sin(now / 700) * .015);
  h.body.rotation.z = sleeping ? 0 : (moving ? -.06 : 0) + Math.sin(p * 2) * (moving ? .03 : 0);
  for (const l of h.legs) {
    if (sleeping) { l.upper.rotation.z = l.front ? 1.2 : -1.2; l.mid.rotation.z = l.front ? -2.4 : 2.0; l.low.rotation.z = 0; continue; }
    const off = (l.front ? 0 : Math.PI) + (l.side > 0 ? 0 : Math.PI / 2);
    const s = moving ? Math.sin(p + off) : 0, swing = mode === "run" ? .75 : .45;
    if (l.front) {
      l.upper.rotation.z = s * swing - .05;
      l.mid.rotation.z = moving ? -Math.max(0, Math.cos(p + off)) * .9 : 0;
      l.low.rotation.z = moving ? Math.max(0, Math.cos(p + off)) * .5 : .05;
    } else {
      l.upper.rotation.z = s * swing + .35;                                    // thigh angled forward
      l.mid.rotation.z = -.75 - (moving ? Math.max(0, -Math.cos(p + off)) * .5 : 0); // shin back: the hock
      l.low.rotation.z = .45;
    }
  }
  h.tailBits.forEach((b, i) => { b.rotation.z = sleeping ? -.3 : -.18 + Math.sin(now / 300 + i * .6) * (hunting ? .05 : .12); b.rotation.y = Math.sin(now / 500 + i) * .15; });
  for (const [i, hd] of h.heads.entries()) {
    const t = now / 1000 + hd.seed;
    if (sleeping) { hd.neck.rotation.z = -1.0; hd.head.rotation.z = .3; hd.jaw.rotation.z = 0; continue; }
    hd.neck.rotation.z = (hunting ? -.45 : -.15) + Math.sin(t * (moving ? 5 : 1.3)) * .1;  // heads low when it hunts
    hd.neck.rotation.y = hd.yaw + Math.sin(t * 1.7 + i) * .2;
    hd.head.rotation.z = hunting ? .25 : 0;
    const open = hunting ? Math.max(0, Math.sin(t * 6)) * .55 : Math.max(0, Math.sin(t * 1.1)) * .12;
    hd.jaw.rotation.z = -open; hd.mouthGlow.visible = open > .1;
  }
  h.inner.intensity = sleeping ? .4 : 2.5 + Math.sin(now / 90) * .6;
  const pos = h.smoke.geometry.attributes.position;
  for (let i = 0; i < h.N; i++) {
    h.life[i] += dt * (.3 + (i % 5) * .05);
    if (h.life[i] > 1) { h.life[i] = 0; pos.setXYZ(i, x + (Math.random() - .5) * 2.2, (sleeping ? .5 : 1.4) + Math.random() * .5, z + (Math.random() - .5) * 1.2); }
    else pos.setY(i, pos.getY(i) + dt * .7);
  }
  pos.needsUpdate = true;
  h.smoke.material.opacity = sleeping ? .35 : .65;
}
