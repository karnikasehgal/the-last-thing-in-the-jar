// The far bank of the Styx, laid out in the order Virgil walks it (Aeneid 6):
// the landing, Cerberus's cave by the gate, the walls of Dis, the Asphodel Meadow with Sisyphus
// on his hill, and the House of Hades. To the left of the house, the white cypress and its spring;
// to the right, the Lake of Memory, as the gold tablets describe.
//    x runs along the river as on the near bank; z keeps going away from it.
//    far shore z = 64 · landing dock x ±1.4, z 50..64 · the gate in the wall at z = 80
//    the meadow z 82..116 · the hall x -14..14, z 118..141
import * as THREE from "three";

export const FAR = {shore: 64, dockFrom: 50, gateZ: 80, hallZ: 118, hallEnd: 141,
  landing: new THREE.Vector3(0, 0, 63), boatStop: 47, dogHome: new THREE.Vector3(9.5, 0, 74.5), gateMouth: new THREE.Vector3(0, 0, 77.6),
  hades: new THREE.Vector3(-1.7, 0, 137.2), persephone: new THREE.Vector3(1.7, 0, 137.2), throneFront: new THREE.Vector3(0, 0, 132.5),
  sisyphus: new THREE.Vector3(-19, 0, 101), boulder: new THREE.Vector3(-19, 0, 102.6),
  path: [[0, 64], [0, 82], [-7, 90], [-4, 99], [5, 107], [0, 117], [0, 131]]};

export function buildFarBank({scene, boxes, circles, noise, tex, LIB, lights}) {
  const S = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .9, ...o});
  const basaltTex = noise("#3b3633", "#14110f", 512, 26, .2); basaltTex.repeat.set(30, 30);
  const blockTex = noise("#5a524a", "#1e1a16", 512, 10, .25); blockTex.repeat.set(10, 2);
  const blackMarble = noise("#1c1a1d", "#7a6a58", 512, 34, .22); blackMarble.repeat.set(6, 8);
  const M = {
    ground: new THREE.MeshStandardMaterial({map: basaltTex, roughness: .95}),
    wall: new THREE.MeshStandardMaterial({map: blockTex, roughness: .92}),
    bronze: new THREE.MeshStandardMaterial({color: 0x6a4a26, metalness: .85, roughness: .38}),
    hall: new THREE.MeshStandardMaterial({map: blackMarble, roughness: .3, metalness: .1}),
    column: S(0x2b2622, {roughness: .5}),
    rock: S(0x2a2420), path: S(0x6a5e50), wood: S(0x3a2a1c, {roughness: .85})
  };
  const add = (m, x, y, z) => { m.position.set(x, y, z); scene.add(m); return m; };
  const light = (c, p, d, x, y, z) => { const l = new THREE.PointLight(c, p, d, 1.7); l.position.set(x, y, z); l.visible = false; scene.add(l); lights.push(l); return l; };
  const flicker = [];
  function brazier(x, z, y = 0) {
    const bowl = add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .28, .42, 12), M.bronze), x, y + 1.2, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 1.1, 6), M.bronze), x, y + .55, z);
    const coals = add(new THREE.Mesh(new THREE.SphereGeometry(.36, 10, 6), new THREE.MeshBasicMaterial({color: 0xff7a2a})), x, y + 1.4, z); coals.scale.y = .35;
    flicker.push(light(0xff8a3a, 30, 18, x, y + 2, z));
    circles.push([x, z, .55]);
    return bowl;
  }

  /* ground, shore, cliffs */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 90), M.ground); ground.rotation.x = -Math.PI / 2; add(ground, 0, 0, FAR.shore + 45);
  add(new THREE.Mesh(new THREE.BoxGeometry(130, .6, .9), M.wall), 0, -.25, FAR.shore);
  for (let i = 0; i < 70; i++) { // cliffs closing the far bank in on both sides and behind
    const side = i % 3, r = 3 + Math.random() * 6;
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), M.rock);
    const x = side === 0 ? -48 - Math.random() * 6 : side === 1 ? 48 + Math.random() * 6 : -45 + Math.random() * 90;
    const z = side === 2 ? 146 + Math.random() * 6 : 66 + Math.random() * 80;
    m.position.set(x, r * .4 + Math.random() * 6, z); m.rotation.set(Math.random(), Math.random(), Math.random()); m.scale.y = 1.6 + Math.random(); scene.add(m);
  }
  // a dark roof of rock overhead, far up
  const vault = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), new THREE.MeshBasicMaterial({color: 0x0b0908, side: THREE.BackSide, fog: true}));
  vault.scale.y = .32; add(vault, 0, 0, 105);

  /* the landing */
  for (let z = FAR.dockFrom; z < FAR.shore + .2; z += .55) add(new THREE.Mesh(new THREE.BoxGeometry(2.8, .12, .5), M.wood), 0, .02, z);
  for (const z of [51, 55, 59, 63]) for (const x of [-1.5, 1.5]) add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 2, 8), M.wood), x, -.2, z);
  const lamp = add(new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({color: 0xffd08a})), -1.2, 2.3, 63);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 2.4, 6), M.wood), -1.2, 1.1, 63);
  flicker.push(light(0xffb060, 14, 14, -1.2, 2.3, 63));

  /* the path, in pale stones */
  const pts = FAR.path.map(([x, z]) => new THREE.Vector3(x, .03, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  for (let i = 0; i <= 160; i++) {
    const p = curve.getPoint(i / 160), slab = new THREE.Mesh(new THREE.BoxGeometry(1.6 + Math.random() * .6, .06, .9 + Math.random() * .4), M.path);
    slab.position.copy(p); slab.rotation.y = Math.random() * .6 - .3; scene.add(slab);
  }

  /* Cerberus's cave, just this side of the gate */
  for (let i = 0; i < 16; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.8, 0), M.rock);
    const a = Math.random() * Math.PI * 1.3 + Math.PI * .1, d = 3 + Math.random() * 1.6;
    r.position.set(FAR.dogHome.x + Math.cos(a) * d, Math.random() * 1.2, FAR.dogHome.z + Math.sin(a) * d * .7);
    r.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(r);
  }
  add(new THREE.Mesh(new THREE.SphereGeometry(.9, 8, 6), M.rock), FAR.dogHome.x + 2, .4, FAR.dogHome.z - 1).scale.set(1, .4, 1);
  const lair = light(0xff3a1a, 12, 12, FAR.dogHome.x, 1.2, FAR.dogHome.z + 1);
  circles.push([FAR.dogHome.x + 1.5, FAR.dogHome.z + 2.5, 2.4]);

  /* the walls of Dis: Cyclopean blocks, with a bronze gate */
  const wallH = 13;
  for (const [x0, x1] of [[-46, -3.2], [3.2, 46]]) {
    const w = add(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, wallH, 2.4), M.wall), (x0 + x1) / 2, wallH / 2, FAR.gateZ);
    for (let k = 0; k < 18; k++) { // a few blocks standing proud of the wall face
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.5 + Math.random() * 2.5, 1 + Math.random() * 1.4, .5), M.wall);
      b.position.set(x0 + Math.random() * (x1 - x0), Math.random() * wallH, FAR.gateZ - 1.3); scene.add(b);
    }
    boxes.push([x0, FAR.gateZ - 1.2, x1, FAR.gateZ + 1.2]);
  }
  for (const s of [-1, 1]) { // towers either side of the gate
    add(new THREE.Mesh(new THREE.BoxGeometry(3.4, wallH + 4, 3.4), M.wall), s * 4.9, (wallH + 4) / 2, FAR.gateZ);
    brazier(s * 4.9, FAR.gateZ - 2.6);
  }
  add(new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.6, 2.6), M.wall), 0, 9.6, FAR.gateZ);
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 3.1, 0, FAR.gateZ + .6); scene.add(pivot);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(3.05, 8.8, .25), M.bronze); leaf.position.set(-s * 1.52, 4.4, 0); pivot.add(leaf);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const stud = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), M.bronze); stud.position.set(-s * (.7 + c * 1.6), 1.4 + r * 2, -.15); pivot.add(stud); }
    pivot.rotation.y = s * .35; // ajar
    doors.push(pivot);
  }

  /* the Asphodel Meadow: grey flowers, the ordinary dead */
  const stemGeo = new THREE.CylinderGeometry(.01, .014, .7, 4); stemGeo.translate(0, .35, 0);
  const headGeo = new THREE.SphereGeometry(.05, 5, 4); headGeo.scale(1, 1.8, 1); headGeo.translate(0, .74, 0);
  const N = 1400, stems = new THREE.InstancedMesh(stemGeo, S(0x4b5244), N), heads = new THREE.InstancedMesh(headGeo, S(0xd7d2c4, {emissive: 0x5a5850}), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let n = 0;
  while (n < N) {
    const x = -40 + Math.random() * 80, z = 83 + Math.random() * 34;
    let near = false; for (let i = 0; i <= 40; i++) { const p = curve.getPoint(i / 40); if (Math.hypot(p.x - x, p.z - z) < 1.6) { near = true; break; } }
    if (near || (x > -27 && x < -11 && z > 95 && z < 109)) continue;
    q.setFromEuler(new THREE.Euler((Math.random() - .5) * .3, Math.random() * 6, (Math.random() - .5) * .3)); sc.setScalar(.7 + Math.random() * .7);
    m4.compose(new THREE.Vector3(x, 0, z), q, sc); stems.setMatrixAt(n, m4); heads.setMatrixAt(n, m4); n++;
  }
  scene.add(stems, heads);
  // pale lights drifting over the meadow, and motes hanging in the air
  const wisps = [[-14, 90], [12, 96], [-6, 106], [18, 110]].map(([x, z]) => {
    const l = light(0xb8d4ff, 9, 22, x, 2.4, z);
    const orb = add(new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({color: 0xdfeaff})), x, 2.4, z);
    return {l, orb, x, z, seed: Math.random() * 10};
  });
  const moteN = 500, mg = new THREE.BufferGeometry(), mp = new Float32Array(moteN * 3);
  for (let i = 0; i < moteN; i++) { mp[i * 3] = -40 + Math.random() * 80; mp[i * 3 + 1] = Math.random() * 6; mp[i * 3 + 2] = 66 + Math.random() * 74; }
  mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({color: 0xe8e0d0, size: .06, transparent: true, opacity: .55, depthWrite: false}));
  scene.add(motes);

  /* Sisyphus's hill */
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(4, 9, 7, 9, 1), M.rock); add(hill, -19, -2.2, 106); hill.rotation.y = .3;
  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), S(0x6a6056));
  boulder.position.copy(FAR.boulder).setY(1.15); scene.add(boulder);
  circles.push([-19, 106, 8.6], [FAR.boulder.x, FAR.boulder.z, 1.2]);

  /* the House of Hades */
  const H = {x0: -14, x1: 14, z0: FAR.hallZ, z1: FAR.hallEnd};
  add(new THREE.Mesh(new THREE.BoxGeometry(28, .3, 23), M.hall), 0, .0, (H.z0 + H.z1) / 2);
  for (const s of [-1, 1]) { add(new THREE.Mesh(new THREE.BoxGeometry(.8, 11, 23), M.wall), s * 14, 5.5, (H.z0 + H.z1) / 2); boxes.push([s * 14 - .4, H.z0, s * 14 + .4, H.z1]); }
  add(new THREE.Mesh(new THREE.BoxGeometry(28.8, 11, .8), M.wall), 0, 5.5, H.z1); boxes.push([-14.4, H.z1 - .4, 14.4, H.z1 + .4]);
  for (const s of [-1, 1]) { add(new THREE.Mesh(new THREE.BoxGeometry(10.5, 11, .8), M.wall), s * 8.8, 5.5, H.z0); boxes.push(s < 0 ? [-14, H.z0 - .4, -3.5, H.z0 + .4] : [3.5, H.z0 - .4, 14, H.z0 + .4]); }
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 3, .8), M.wall), 0, 9.5, H.z0);
  add(new THREE.Mesh(new THREE.BoxGeometry(28.8, .6, 23.8), M.wall), 0, 11.2, (H.z0 + H.z1) / 2);
  for (const z of [122, 126.5, 131]) for (const x of [-8, 8]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, 10.6, 16), M.column), x, 5.3, z); circles.push([x, z, .7]);
  }
  // the dais and two thrones
  add(new THREE.Mesh(new THREE.BoxGeometry(10, .5, 5), M.hall), 0, .25, 137.6); boxes.push([-5, 135.1, 5, 140.1]);
  const thrones = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, .6, 1.1), M.column); seat.position.y = .3;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, .25), M.column); back.position.set(0, 1.3, .5);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), M.bronze); finial.position.set(0, 2.7, .5);
    for (const a of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(.18, .5, 1), M.bronze); arm.position.set(a * .62, .75, 0); t.add(arm); }
    t.add(seat, back, finial); t.position.set(s * 1.7, .5, 137.4); scene.add(t); thrones.push(t);
  }
  // Hades's sceptre, propped by his throne
  const sceptre = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.2, 8), M.bronze); sceptre.position.set(-2.75, 1.6, 137); sceptre.rotation.z = .12; scene.add(sceptre);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), M.bronze); knob.position.set(-2.88, 2.7, 137); scene.add(knob);
  brazier(-5, 133); brazier(5, 133); brazier(-5, 121.5); brazier(5, 121.5);
  // a shaft of warm light from high up onto the two thrones, and a cold one behind them
  const key = new THREE.SpotLight(0xffc890, 260, 30, .5, .6, 1.4); key.position.set(0, 10.5, 128); key.target.position.set(0, 1.4, 137.6);
  key.visible = false; scene.add(key, key.target); lights.push(key);
  const rim = light(0x8fb0ff, 18, 10, 0, 3.5, 140.2);
  // paintings of the queen's story on the walls
  [["styx/giordano-proserpina.jpg", -13.55, 128, Math.PI / 2], ["styx/bernini-proserpina.jpg", 13.55, 128, -Math.PI / 2], ["styx/brueghel-orpheus-pluto.jpg", 0, 140.55, Math.PI]].forEach(([src, x, z, ry]) => {
    const t = tex(LIB + src);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.4, .15), M.bronze), pic = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3), new THREE.MeshStandardMaterial({map: t, roughness: .8}));
    pic.position.z = .08; frame.add(pic); frame.position.set(x, 4.6, z); frame.rotation.y = ry; scene.add(frame);
  });

  /* the pomegranate tree by the door, the white cypress and its spring, the Lake of Memory */
  function tree(x, z, leaf, trunkC, h, cone) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(.18, .28, h * .5, 7), S(trunkC)), x, h * .25, z);
    const crown = cone ? new THREE.Mesh(new THREE.ConeGeometry(1.1, h * .85, 9), S(leaf)) : new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), S(leaf));
    add(crown, x, cone ? h * .7 : h * .62, z); circles.push([x, z, .5]);
    return crown;
  }
  const pomTree = tree(8.5, 115.5, 0x2e3b22, 0x3a2a1c, 4.2, false);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), S(0x8a1420, {roughness: .4})); const a = Math.random() * 6.3; f.position.set(8.5 + Math.cos(a) * 1.5, 2.2 + Math.random() * 1.4, 115.5 + Math.sin(a) * 1.5); scene.add(f); }
  tree(-24, 123, 0xe8e4dc, 0xcfc9bc, 7, true); // the white cypress: the tablets say don't drink here
  const spring = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshStandardMaterial({color: 0x8fb0b8, roughness: .1, metalness: .4, emissive: 0x0c1a1e}));
  spring.rotation.x = -Math.PI / 2; add(spring, -21, .04, 125.5);
  const memory = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshStandardMaterial({color: 0x1a4c66, roughness: .05, metalness: .5, emissive: 0x06243a}));
  memory.rotation.x = -Math.PI / 2; add(memory, 25, .04, 126);
  const lethe = light(0x9fd8ff, 6, 10, -21, 1.5, 125.5), mnemo = light(0x3a9fff, 8, 14, 25, 1.5, 126);
  boxes.push([-23.2, 123.3, -18.8, 127.7], [21, 122, 29, 130]);

  // the bounds of the far bank
  const bounds = (x, z) => x < -44 || x > 44 || z > FAR.hallEnd - .4 + (Math.abs(x) > 14 ? -6 : 0);
  function animate(now) {
    for (const w of wisps) { const y = 2.2 + Math.sin(now / 1300 + w.seed) * .6, x = w.x + Math.sin(now / 2700 + w.seed) * 2; w.l.position.set(x, y, w.z); w.orb.position.set(x, y, w.z); }
    motes.rotation.y = Math.sin(now / 20000) * .02; motes.position.y = Math.sin(now / 4000) * .15;
  }
  return {doors, thrones, boulder, flicker, bounds, curve, lair, lights, H, animate};
}

// Shades: pale figures standing about the meadow, made from one built person and cloned.
export function scatterShades(scene, template, SkeletonUtils, CLIPS, count = 9) {
  const out = [];
  const spots = [[-12, 88], [14, 90], [-26, 92], [20, 101], [-8, 108], [24, 112], [-32, 112], [12, 113], [30, 94]];
  for (let i = 0; i < Math.min(count, spots.length); i++) {
    const r = SkeletonUtils.clone(template.root);
    r.position.set(spots[i][0], 0, spots[i][1]); r.rotation.y = Math.random() * 6.3; r.scale.setScalar(.9 + Math.random() * .2);
    scene.add(r);
    const mixer = new THREE.AnimationMixer(r), a = mixer.clipAction(CLIPS[i % 3 ? "Idle_Loop" : "Crouch_Idle_Loop"]);
    a.play(); a.time = Math.random() * 2; a.timeScale = .6;
    out.push({root: r, mixer});
  }
  return out;
}
