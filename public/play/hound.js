// Cerberus: a gaunt three-headed hound, built from simple shapes so it can be lit and animated in code.
// It faces +x. About 2.8 m long and 1.6 m at the shoulder.
import * as THREE from "three";

export function makeHound(scene) {
  const g = new THREE.Group();
  const hide = new THREE.MeshStandardMaterial({color: 0x2e241d, roughness: .9, metalness: 0, emissive: 0x140503});
  const rimMat = new THREE.MeshBasicMaterial({color: 0xb2391a, transparent: true, opacity: .35, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending});
  const bone = new THREE.MeshStandardMaterial({color: 0xd9ccb2, roughness: .6});
  const ember = new THREE.MeshBasicMaterial({color: 0xff6a24});
  const rim = (m, s = 1.07) => { const r = new THREE.Mesh(m.geometry, rimMat); r.scale.setScalar(s); m.add(r); return m; };
  const part = (geo, parent, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, mat = hide) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); parent.add(m); return m;
  };
  // a limb segment from (0,0,0) pointing down -y by `len`
  const seg = (r0, r1, len) => { const geo = new THREE.CylinderGeometry(r0, r1, len, 9); geo.translate(0, -len / 2, 0); return geo; };

  /* body: deep chest, thin waist, bony haunches, a ridge of spine */
  const body = new THREE.Group(); body.position.y = 1.32; g.add(body);
  rim(part(new THREE.SphereGeometry(.5, 18, 14), body, .38, .05, 0, 0, 0, 0, 1.15, 1.0, .72));      // ribcage
  rim(part(new THREE.CylinderGeometry(.26, .4, 1.0, 12), body, -.35, 0, 0, 0, 0, Math.PI / 2, 1, 1, .8)); // waist
  rim(part(new THREE.SphereGeometry(.38, 14, 12), body, -.92, .02, 0, 0, 0, 0, 1.05, 1.0, .9));   // haunches
  for (let i = 0; i < 9; i++) part(new THREE.ConeGeometry(.05, .18, 5), body, .7 - i * .2, .44 - Math.abs(i - 3) * .02, 0, 0, 0, -.25, 1, 1, 1, bone); // spine ridge
  const ribMat = new THREE.MeshStandardMaterial({color: 0x4a3a2e, roughness: .9});
  for (let i = 0; i < 5; i++) part(new THREE.TorusGeometry(.505, .02, 5, 16, Math.PI * .9), body, .15 + i * .13, -.04, 0, 0, Math.PI / 2, Math.PI * 1.55, 1, 1, .74, ribMat); // ribs, just under the skin

  /* tail: a thin whip that hangs and sways */
  const tail = new THREE.Group(); tail.position.set(-1.25, .1, 0); body.add(tail);
  let t = tail; const tailBits = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Group(); s.position.set(-.2, 0, 0); t.add(s); rim(part(new THREE.CylinderGeometry(.045 - i * .007, .05 - i * .007, .22, 6), s, -.1, 0, 0, 0, 0, Math.PI / 2)); tailBits.push(s); t = s; }

  /* legs: dog-shaped, front legs straight, back legs with the backwards "hock" bend */
  const legs = [];
  for (const side of [1, -1]) {
    // front
    const sh = new THREE.Group(); sh.position.set(.55, 1.2, side * .3); g.add(sh);
    rim(part(seg(.13, .1, .55), sh, 0, 0, 0));
    const elbow = new THREE.Group(); elbow.position.y = -.55; sh.add(elbow);
    rim(part(seg(.08, .06, .5), elbow, 0, 0, 0));
    const wrist = new THREE.Group(); wrist.position.y = -.5; elbow.add(wrist);
    rim(part(seg(.06, .055, .14), wrist, 0, 0, 0));
    part(new THREE.SphereGeometry(.09, 8, 6), wrist, .05, -.15, 0, 0, 0, 0, 1.6, .55, 1.1);
    for (const c of [-1, 0, 1]) part(new THREE.ConeGeometry(.018, .09, 4), wrist, .17, -.16, c * .04, 0, 0, -Math.PI / 2, 1, 1, 1, bone);
    legs.push({upper: sh, mid: elbow, low: wrist, front: true, side});
    // back
    const hip = new THREE.Group(); hip.position.set(-.95, 1.22, side * .3); g.add(hip);
    rim(part(seg(.17, .1, .58), hip, 0, 0, 0));
    const knee = new THREE.Group(); knee.position.y = -.58; hip.add(knee);
    rim(part(seg(.08, .06, .5), knee, 0, 0, 0));
    const hock = new THREE.Group(); hock.position.y = -.5; knee.add(hock);
    rim(part(seg(.055, .05, .3), hock, 0, 0, 0));
    part(new THREE.SphereGeometry(.09, 8, 6), hock, .05, -.31, 0, 0, 0, 0, 1.6, .55, 1.1);
    legs.push({upper: hip, mid: knee, low: hock, front: false, side});
  }

  /* three necks and heads: long wolf skulls, upright ears, jaws that open, ember eyes */
  const heads = [];
  for (const [z, yaw] of [[-.3, .42], [0, 0], [.3, -.42]]) {
    const neck = new THREE.Group(); neck.position.set(.85, 1.55, z); neck.rotation.y = yaw; g.add(neck);
    rim(part(new THREE.CylinderGeometry(.13, .2, .75, 10), neck, .25, .25, 0, 0, 0, -.95));
    const head = new THREE.Group(); head.position.set(.55, .55, 0); neck.add(head);
    rim(part(new THREE.SphereGeometry(.17, 14, 10), head, 0, 0, 0, 0, 0, 0, 1.25, .95, .9));          // skull
    rim(part(new THREE.SphereGeometry(.12, 14, 10), head, .3, -.04, 0, 0, 0, -.08, 2.3, .78, .78)); // muzzle, long and tapering
    part(new THREE.SphereGeometry(.045, 8, 6), head, .57, -.03, 0, 0, 0, 0, 1, .8, 1.1, new THREE.MeshStandardMaterial({color: 0x050404, roughness: .3})); // nose
    for (const s of [-1, 1]) {
      rim(part(new THREE.ConeGeometry(.07, .3, 4), head, -.06, .2, s * .09, s * .25, 0, .35));        // ears
      part(new THREE.SphereGeometry(.024, 6, 5), head, .13, .05, s * .085, 0, 0, 0, 1.3, .8, 1, ember);  // eyes
      part(new THREE.SphereGeometry(.05, 6, 5), head, .1, .08, s * .07, 0, 0, 0, 1.6, .6, 1);            // brow
    }
    const jaw = new THREE.Group(); jaw.position.set(.12, -.09, 0); head.add(jaw);
    rim(part(new THREE.SphereGeometry(.09, 12, 8), jaw, .2, -.02, 0, 0, 0, .05, 2.4, .55, .7));
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      part(new THREE.ConeGeometry(.016, .07, 4), jaw, .08 + i * .08, .04, s * .045, 0, 0, 0, 1, 1, 1, bone);        // lower teeth
      part(new THREE.ConeGeometry(.016, .07, 4), head, .2 + i * .08, -.08, s * .05, Math.PI, 0, 0, 1, 1, 1, bone);  // upper teeth
    }
    const mouthGlow = part(new THREE.SphereGeometry(.05, 6, 5), jaw, .12, .02, 0, 0, 0, 0, 2, .5, .8, ember);
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
