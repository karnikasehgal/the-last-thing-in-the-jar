// /play/?fix, the fixes plan (docs/PLAN-fixes.md), Stage 1: Thea's wedding as the approved style frame has it, a
// candlelit quarry at night (look-test/Style frame 1 wedding.jpg). The courtyard built in wedding.js stays; this
// closes it in with high quarry walls lined with candles, darkens the floor, hangs ivory sheers in the upper third and
// one burgundy drape, and turns the broad torch light down so the candles make the pools of light. Glows are sprites,
// not lights, so it costs little to draw. Used only for Thea's wedding and the funeral; hidden for the other moods.
import * as THREE from "three";
import { pbr } from "./pbr.js";

export function quarryNight(w, {lite = false} = {}) {
  const g = new THREE.Group(); w.g.add(g);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // the quarry: cut rock rising far above the courtyard's own walls, open to the night (the gate side keeps a cleft)
  // (grey-brown rock, as in the frame; the candles add the warmth. On phones a plain material: the scanned stone, laid on
  // from three sides, over walls that fill most of the screen cost the phone a third of its frame rate)
  const rock = lite ? new THREE.MeshStandardMaterial({color: 0x2a2420, roughness: .95}) : pbr("sandstone_blocks_05", {size: 4.5, tint: 0x4a4440, bump: 1.6});
  const H = 18, wall = (sx, sz, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, H, sz), rock); m.position.set(x, H / 2, z); g.add(m); };
  wall(40, 1.5, 0, 15.2); wall(40, 1.5, 0, -15.2); wall(1.5, 31, -19.6, 0);
  wall(1.5, 12.8, 19.4, -8.6); wall(1.5, 12.8, 19.4, 8.6);

  // candles in rows of niches up the quarry faces, as in the style frame: a flame and a soft glow each
  const spots = [];
  for (const z of [-14.4, 14.4]) for (const y of [2.1, 3.3, 4.6, 6.2]) for (let x = -17.5; x <= 17.5; x += .7 + rnd() * .5) if (rnd() < .8) spots.push([x, y + (rnd() - .5) * .15, z]);
  for (const y of [2.1, 3.3, 4.6]) for (let z = -13.5; z <= 13.5; z += .8 + rnd() * .5) if (rnd() < .8) spots.push([-18.8, y + (rnd() - .5) * .15, z]);
  const flame = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({color: new THREE.Color(2.2, 1.4, .6)}), spots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  spots.forEach(([x, y, z], i) => flame.setMatrixAt(i, m4.compose(v.set(x, y, z), q, s.set(.012, .03, .012))));
  g.add(flame);
  const dot = document.createElement("canvas"); dot.width = dot.height = 64;
  { const c = dot.getContext("2d"), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,200,130,1)"); gr.addColorStop(.25, "rgba(255,150,70,.35)"); gr.addColorStop(1, "rgba(255,120,40,0)"); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }
  const gp = new Float32Array(spots.length * 3); spots.forEach(([x, y, z], i) => gp.set([x, y, z], i * 3));
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(gp, 3));
  g.add(new THREE.Points(gg, new THREE.PointsMaterial({size: .55, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55, fog: false})));
  // the candlelight on the rock itself, so the faces read as stone and not as stars in the dark: a few warm lights
  // along the faces (left out on phones, where every light costs; there the glows alone carry it)
  const glow = [];
  if (!lite) for (const [x, z] of [[-12, 13.3], [-3, 13.3], [6, 13.3], [14, 13.3], [-12, -13.3], [-3, -13.3], [6, -13.3], [14, -13.3], [-17.8, -6], [-17.8, 6]]) {
    const l = new THREE.PointLight(0xff9a50, 7, 10, 1.6); l.position.set(x, 4.2, z); l.visible = false; g.add(l); glow.push(l); }

  // ivory sheers swagged across the upper third, high over the tables, lit from below by the candles
  const ivory = new THREE.MeshStandardMaterial({color: 0xefe6d6, emissive: 0x3a2614, roughness: 1, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false}); // (warm from the candles below)
  for (let k = 0; k < (lite ? 4 : 7); k++) { // (fewer on phones: each sheer layer is the screen drawn again)
    const x0 = -15 + k * 5 + (rnd() - .5), geo = new THREE.PlaneGeometry(1, 1, 20, 48), P = geo.attributes.position, top = 8.5 + rnd(), sag = 2.2 + rnd() * .8;
    for (let i = 0; i < P.count; i++) { const u = P.getX(i) + .5, t = P.getY(i) + .5, open = .3 + .7 * Math.sin(Math.PI * t);
      P.setXYZ(i, x0 + (u - .5) * 3.4 * open + Math.sin(u * Math.PI * 10) * .1 * (1.3 - open), top - sag * Math.sin(Math.PI * t) - Math.abs(Math.sin(u * Math.PI * 5)) * .25 * open, -14.4 + 28.8 * t); }
    geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, ivory));
  }
  // the one red in the room: a burgundy drape falling from high on the north face and pooling by the high table
  { const geo = new THREE.PlaneGeometry(1, 1, 20, 60), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const u = P.getX(i) + .5, t = .5 - P.getY(i), drop = Math.min(1, t / .85), pool = Math.max(0, (t - .85) / .15);
      P.setXYZ(i, -6 + (u - .5) * (1.2 + 2.2 * Math.pow(drop, .7)) + Math.sin(u * Math.PI * 8) * (.06 + .14 * drop), Math.max(.02, 11 - drop * 10.98), 14.3 - pool * 1.6 - Math.sin(u * Math.PI * 8) * .05); }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color: 0x4a0a10, roughness: .55, side: THREE.DoubleSide}))); }

  // inside the courtyard: a dark floor that holds the candlelight, no garlands or painted band, broad light turned down
  const quiet = []; let water = null;
  w.g.traverse(o => {
    if (!o.isMesh || g.getObjectById(o.id)) return;
    const c = o.material?.color?.getHex?.(), geo = o.geometry?.parameters || {};
    if (o.geometry?.type === "BoxGeometry" && geo.width === 36 && geo.depth === 28) quiet.push([o, "color", o.material.color.clone(), new THREE.Color(0x4a4038)]); // the paving
    else if (o.geometry?.type === "CylinderGeometry" && geo.radiusTop === 3.6) quiet.push([o, "color", o.material.color.clone(), new THREE.Color(0x5a5048)]); // the dance floor
    else if (c === 0x3d5a2a || c === 0x8a3a24 || (o.geometry?.type === "SphereGeometry" && geo.radius === .07)) quiet.push([o, "visible", true, false]); // myrtle, band, its flowers
    else if (o.geometry?.type === "PlaneGeometry" && geo.width === 5.6 && geo.height === 1.3) { quiet.push([o, "visible", true, false]); water ||= o.material; } // the two short pools (the long channels replace them)
    else if (o.geometry?.type === "BoxGeometry" && geo.width === .16 && geo.depth === 1.62) quiet.push([o, "visible", true, false]); // their end copings, which would cross the channels
  });
  // The black water down the middle, as in the style frame: the two short pools beside the high table run on as two
  // long channels, 13 m from near the dance floor toward the gate, edged in stone and lined with candles whose flames lie
  // stretched on the water beneath them (a mirror would draw the whole crowded wedding again: too dear)
  { const x0 = -3.5, x1 = 9.5, len = x1 - x0, xc = (x0 + x1) / 2; // (the servers' loop round the tables crosses z = ±2.7 at about x = -4.1 and 10.1: the water stops short of it)
    water ||= new THREE.MeshPhysicalMaterial({color: 0x0b1416, roughness: .04, clearcoat: 1});
    const stone = pbr("sandstone_blocks_05", {size: 1.2, tint: 0x8a7c6c});
    const cs = [], fs = [];
    for (const zc of [-2.7, 2.7]) {
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.3), water); pool.rotation.x = -Math.PI / 2; pool.position.set(xc, .012, zc); g.add(pool);
      for (const [w2, d, x, z] of [[len + .3, .16, xc, zc - .73], [len + .3, .16, xc, zc + .73], [.16, 1.62, x0 - .08, zc], [.16, 1.62, x1 + .08, zc]]) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(w2, .07, d), stone); c.position.set(x, .035, z); g.add(c); }
      for (let x = x0 + .3; x < x1; x += .45 + rnd() * .3) for (const e of [-.73, .73]) if (rnd() < .7) cs.push([x, .07, zc + e, .08 + rnd() * .16]); // on the copings
      for (let x = x0 + .5; x < x1; x += 1 + rnd() * .6) fs.push([x, .02, zc + (rnd() - .5) * .8, .045]);                          // floating
    }
    const all = cs.concat(fs), wax = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10), new THREE.MeshStandardMaterial({color: 0xf1e6d2, roughness: .55}), all.length);
    const fire = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({color: new THREE.Color(2.2, 1.4, .6)}), all.length);
    // (the water is solid, so each flame's reflection is a soft warm glow lying on its surface, longest across the channel)
    const glint = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(dot), transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}), all.length);
    all.forEach(([x, y, z, h], i) => {
      wax.setMatrixAt(i, m4.compose(v.set(x, y + h / 2, z), q, s.set(.035, h, .035)));
      fire.setMatrixAt(i, m4.compose(v.set(x, y + h + .025, z), q, s.set(.011, .028, .011)));
      const onWater = i >= cs.length, dz = onWater ? 0 : Math.sign(z - (z > 0 ? 2.7 : -2.7)) * -.2; // (a coping candle's reflection lies just out on the water)
      glint.setMatrixAt(i, m4.compose(v.set(x, .016, z + dz), q, s.set(onWater ? .12 : .1, 1, onWater ? .12 : .26)));
    });
    g.add(wax, fire, glint); }
  const dim = [];
  for (const l of w.lights) if (l.isPointLight && l.distance >= 12) dim.push([l, l.intensity]); // the courtyard's broad torch light (the candle lights are short-range)

  function on(yes) {
    g.visible = yes; for (const l of glow) l.visible = yes && w.lights[0]?.visible; // (on only while the wedding's own lights are)
    for (const [o, k, was, now] of quiet) if (k === "visible") o.visible = yes ? now : was; else o.material.color.copy(yes ? now : was);
    for (const [l, was] of dim) l.userData.base = yes ? was * .35 : was;
  }
  const mood = w.mood.bind(w);
  w.mood = kind => { on(kind === "wedding" || kind === "funeral"); mood(kind); };
  w.quarry = g;
  return g;
}
