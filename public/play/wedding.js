// The wedding at Corinth, where Chapter I begins: a courtyard at dusk, a long table under a vine,
// olives, bread, wine, a roast lamb, oil lamps, a piper, and a sunset beyond the colonnade.
// The same courtyard, cleared and lamp-lit, is where they lay Mikon out the next night.
// It is built far from the river (around x = 300) and only ever seen in the opening film.
import * as THREE from "three";
import { buildMeadow } from "./meadow.js";

export const W = new THREE.Vector3(300, 0, 0);
// where everyone sits and stands (relative to W). Mikon and Lykon on the near bench, facing the table;
// Kleio, Thea and Nikias across from them; Demeas standing at the end for the toast.
export const SEATS = {
  mikon: [-.7, -1.02, 0], lykon: [.1, -1.02, 0], kleio: [-.9, 1.02, Math.PI], thea: [.3, 1.02, Math.PI], nikias: [1.1, 1.02, Math.PI],
  demeas: [-3.35, 0, Math.PI / 2], piper: [-3.6, 2.6, Math.PI * .8], dancer: [-2.2, 3.4, Math.PI]
};

// Where the crowd goes (relative to W): two more long tables, a ring dance, people standing and talking,
// servers carrying trays, the band.
export const CROWD = {
  tables: [-5.2, 5.2].flatMap(z => [-2.4, -1.6, -.8, 0, .8, 1.6, 2.4].flatMap(x => [[x, z - 1.02, 0], [x, z + 1.02, Math.PI]])),
  ring: {x: -9.5, z: 0, r: 2.9, n: 12},
  groups: [[5.5, -9.5], [10, 7.5], [-3, 10], [11, -3], [-13, 8.5], [-13, -8.5], [2, -10.5], [-6, -11], [12.5, 10.5]],
  band: [[-9.5, -5.6, 0], [-8.1, -5.9, -.2]],
  servers: 4,
  gate: [16.5, -1.7]
};
export function buildWedding(scene, {noise, lite = false}) {
  const g = new THREE.Group(); g.position.copy(W); scene.add(g);
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  const S = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .8, ...o});
  const lights = [];
  const L = (c, p, d, x, y, z) => { const l = new THREE.PointLight(c, p, d, 1.6); l.position.set(x, y, z); l.visible = false; g.add(l); lights.push(l); return l; };

  // floor, whitewashed walls, a colonnade open to the west
  const pav = noise("#b9a487", "#6b5a44", 512, 40, .14); pav.repeat.set(5, 4);
  pav.repeat.set(10, 8);
  add(new THREE.Mesh(new THREE.BoxGeometry(36, .2, 28), new THREE.MeshStandardMaterial({map: pav, roughness: .9})), 0, -.1, 0);
  const lime = noise("#e6dccb", "#9a8a72", 256, 6, .1);
  const wallM = new THREE.MeshStandardMaterial({map: lime, roughness: .95});
  add(new THREE.Mesh(new THREE.BoxGeometry(36, 4, .5), wallM), 0, 2, 14);
  add(new THREE.Mesh(new THREE.BoxGeometry(36, 4, .5), wallM), 0, 2, -14);
  // the east wall, with the gate Mikon walks in through
  add(new THREE.Mesh(new THREE.BoxGeometry(.5, 4, 12), wallM), 18, 2, -8); add(new THREE.Mesh(new THREE.BoxGeometry(.5, 4, 12), wallM), 18, 2, 8);
  add(new THREE.Mesh(new THREE.BoxGeometry(.6, 1, 4.2), wallM), 18, 3.5, 0);
  for (const z of [-2.1, 2.1]) add(new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 3.2, 12), S(0xe8dfcf)), 17.6, 1.6, z);
  // the west side is a colonnade, open to the sunset
  for (let z = -12; z <= 12; z += 3) add(new THREE.Mesh(new THREE.CylinderGeometry(.24, .28, 3.8, 14), S(0xe8dfcf)), -18, 1.9, z);
  add(new THREE.Mesh(new THREE.BoxGeometry(.7, .45, 28), S(0xe0d6c4)), -18, 3.9, 0);
  // doorways into the house, and a painted band along the walls
  for (const x of [-8, 4, 12]) add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, .1), S(0x1a120c)), x, 1.25, 13.73);
  add(new THREE.Mesh(new THREE.BoxGeometry(36, .3, .05), S(0x8a3a24)), 0, 2.9, 13.72);
  add(new THREE.Mesh(new THREE.BoxGeometry(36, .3, .05), S(0x8a3a24)), 0, 2.9, -13.72);
  // myrtle garlands swagged along the walls
  const myrtle = S(0x3d5a2a);
  for (const z of [13.6, -13.6]) for (let k = 0; k < 12; k++) {
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector3(-16.5 + k * 3 + u * 3, 3.3 - Math.sin(u * Math.PI) * .5, z)); }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .07, 6), myrtle), 0, 0, 0);
    const fl = add(new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), S(k % 2 ? 0xf2f0e8 : 0xe8c040)), -15 + k * 3, 2.8, z);
  }
  // a dance floor of pale stone, and the second and third tables
  add(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, .03, 40), S(0xd8ccb4)), -9.5, .01, 0);
  for (const tz of [-5.2, 5.2]) {
    add(new THREE.Mesh(new THREE.BoxGeometry(5.6, .08, 1.1), S(0x6a4a2e)), 0, .74, tz);
    add(new THREE.Mesh(new THREE.BoxGeometry(5.7, .01, 1.2), S(0xe9e0cf)), 0, .785, tz);
    for (const [x, z] of [[-2.6, -.45], [-2.6, .45], [2.6, -.45], [2.6, .45]]) add(new THREE.Mesh(new THREE.BoxGeometry(.08, .74, .08), S(0x6a4a2e)), x, .37, tz + z);
    for (const z of [-1.02, 1.02]) add(new THREE.Mesh(new THREE.BoxGeometry(5.2, .07, .36), S(0x6a4a2e)), 0, .45, tz + z);
    for (let i = 0; i < 7; i++) { const x = -2.4 + i * .8; for (const dz of [-.32, .32]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.15, .11, .03, 16), S(0xa85a34)); add(pl, x, .8, tz + dz); } const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 6), S(0xc89050)); b.scale.y = .5; add(b, x + .3, .83, tz); }
    const kr = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.08, 0], [.1, .05], [.16, .18], [.18, .3], [.17, .34], [0, .34]].map(([x, y]) => new THREE.Vector2(x, y)), 18), S(0x2a1a12)); add(kr, -.4, .79, tz);
  }
  // torches on poles around the courtyard
  for (const [x, z] of [[-14, -11], [-14, 11], [-4, -12], [-4, 12], [8, -12], [8, 12], [15, -5], [15, 5]]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, 2.4, 6), S(0x3a2a1a)), x, 1.2, z);
    add(new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({color: 0xffb060})), x, 2.5, z);
  }
  // petals and sparks hanging in the warm air
  const pn = 380, pg = new THREE.BufferGeometry(), pp = new Float32Array(pn * 3), pc = new Float32Array(pn * 3);
  for (let i = 0; i < pn; i++) { pp[i * 3] = -16 + Math.random() * 32; pp[i * 3 + 1] = 2.6 + Math.random() * 3; pp[i * 3 + 2] = -12 + Math.random() * 24; const c = new THREE.Color(Math.random() < .5 ? 0xf6d0d8 : Math.random() < .5 ? 0xfff2c8 : 0xffa860); pc.set([c.r, c.g, c.b], i * 3); }
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3)); pg.setAttribute("color", new THREE.BufferAttribute(pc, 3));
  const dot = document.createElement("canvas"); dot.width = dot.height = 32; { const x = dot.getContext("2d"), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.5, "rgba(255,255,255,.6)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); }
  const petals = new THREE.Points(pg, new THREE.PointsMaterial({size: .07, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, opacity: .9, depthWrite: false})); g.add(petals);

  // the vine over the table
  for (const [x, z] of [[-3, -2], [-3, 2], [3, -2], [3, 2]]) add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 3, 8), S(0x5a3c24)), x, 1.5, z);
  for (let i = 0; i < 7; i++) add(new THREE.Mesh(new THREE.BoxGeometry(.1, .1, 4.4), S(0x5a3c24)), -3 + i, 3, 0);
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, -.09); leafShape.quadraticCurveTo(.07, -.02, 0, .09); leafShape.quadraticCurveTo(-.07, -.02, 0, -.09);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 4), leafMat = new THREE.MeshStandardMaterial({color: 0x4a6a2e, side: THREE.DoubleSide, roughness: .8});
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 1800), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 1800; i++) { leafMat.color.setHSL(.26, .4, .26); q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)); m4.compose(new THREE.Vector3(-3.3 + Math.random() * 6.6, 2.95 + Math.random() * .3 - (Math.random() < .15 ? Math.random() * .6 : 0), -2.3 + Math.random() * 4.6), q, new THREE.Vector3(1, 1, 1)); leaves.setMatrixAt(i, m4); }
  g.add(leaves);
  for (let i = 0; i < 14; i++) { const bunch = new THREE.Group(); for (let k = 0; k < 9; k++) { const gr = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), S(0x4a1a3a, {roughness: .35})); gr.position.set((Math.random() - .5) * .08, -k * .025, (Math.random() - .5) * .08); bunch.add(gr); } add(bunch, -3 + Math.random() * 6, 2.8, -2 + Math.random() * 4); }

  // the table and benches
  const wood = S(0x6a4a2e);
  add(new THREE.Mesh(new THREE.BoxGeometry(5.6, .08, 1.1), wood), 0, .74, 0);
  for (const [x, z] of [[-2.6, -.45], [-2.6, .45], [2.6, -.45], [2.6, .45]]) add(new THREE.Mesh(new THREE.BoxGeometry(.08, .74, .08), wood), x, .37, z);
  for (const z of [-1.02, 1.02]) add(new THREE.Mesh(new THREE.BoxGeometry(5.2, .07, .36), wood), 0, .45, z);
  const cloth = add(new THREE.Mesh(new THREE.BoxGeometry(5.7, .01, 1.2), S(0xe9e0cf)), 0, .785, 0);

  // the food: everything that will be cleared away for the funeral
  const food = new THREE.Group(); g.add(food);
  const put = (m, x, y, z) => { m.position.set(x, y, z); food.add(m); return m; };
  const plate = c => new THREE.Mesh(new THREE.CylinderGeometry(.16, .12, .03, 18), S(c));
  for (let i = 0; i < 6; i++) { const x = -2.2 + i * .9; put(plate(0xa85a34), x, .8, -.32); put(plate(0xa85a34), x, .8, .32); }
  // olives in a bowl, in front of Mikon
  const olives = new THREE.Group(); olives.add(new THREE.Mesh(new THREE.CylinderGeometry(.13, .08, .07, 16), S(0xb06a40)));
  for (let i = 0; i < 22; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), S(i % 3 ? 0x5a6a2a : 0x2a2418, {roughness: .3})); o.scale.set(1, .8, .8); o.position.set((Math.random() - .5) * .16, .035 + Math.random() * .03, (Math.random() - .5) * .16); olives.add(o); }
  put(olives, -.55, .82, -.2);
  // bread, figs, a krater of wine, cups
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), S(0xc89050)); b.scale.y = .5; put(b, -2 + i * 1.1, .83, .02); }
  const krater = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.08, 0], [.1, .05], [.16, .18], [.18, .3], [.17, .34], [0, .34]].map(([x, y]) => new THREE.Vector2(x, y)), 20), S(0x2a1a12));
  put(krater, .9, .79, .1);
  for (let i = 0; i < 6; i++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.07, .03, .05, 14), S(0x1a1410)); put(cup, -2.1 + i * .85, .83, i % 2 ? .3 : -.3); }
  // the lamb
  const lamb = new THREE.Group(); const lb = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), S(0x8a4a20, {roughness: .5})); lb.scale.set(1.8, .7, 1); lamb.add(lb);
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(.45, .4, .03, 24), S(0xb8b0a0, {metalness: .6, roughness: .3})); platter.position.y = -.14; lamb.add(platter);
  put(lamb, 1.9, .95, 0);
  for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), S(0x5a2a4a)); put(f, -1.4 + Math.random() * 2.6, .82, (Math.random() - .5) * .5); }
  // oil lamps on the table, torches on the walls
  const flame = new THREE.MeshBasicMaterial({color: 0xffc070});
  for (const x of [-1.6, 1.2]) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 6), S(0x8a5a30)); lamp.scale.set(1.6, .6, 1); add(lamp, x, .81, .2); add(new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), flame), x + .08, .86, .2); L(0xffb060, 3.2, 6, x, 1.1, .2); }
  for (const [x, z] of [[-9.5, 0, 14], [6, 9], [6, -9], [-4, 6], [-4, -6], [13, 0]]) L(0xff9a4a, z === 0 && x === -9.5 ? 14 : 10, 12, x, 2.6, z);

  // the bier for the funeral, the same table with a pillow and a shroud
  const bier = new THREE.Group(); bier.visible = false; g.add(bier);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(.4, .12, .3), S(0xe9e0cf)); pillow.position.set(-1.25, .86, 0); bier.add(pillow);
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.5, .16, .62), S(0xefe8dc, {roughness: .95})); shroud.position.set(.35, .9, 0); bier.add(shroud);
  for (let i = 0; i < 8; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), S(i % 2 ? 0xe8d040 : 0xf2f0e8)); fl.position.set(-.4 + Math.random() * 1.4, .99, (Math.random() - .5) * .4); bier.add(fl); }

  // the sky beyond the colonnade: dusk
  const c = document.createElement("canvas"); c.width = 16; c.height = 256; const x = c.getContext("2d");
  const grad = x.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, "#1c2240"); grad.addColorStop(.45, "#6a4a6a"); grad.addColorStop(.7, "#e0864a"); grad.addColorStop(.85, "#f6c070"); grad.addColorStop(1, "#3a2a20");
  x.fillStyle = grad; x.fillRect(0, 0, 16, 256);
  const skyT = new THREE.CanvasTexture(c); skyT.colorSpace = THREE.SRGBColorSpace;
  const c2 = document.createElement("canvas"); c2.width = 16; c2.height = 256; { const x2 = c2.getContext("2d"), g2 = x2.createLinearGradient(0, 0, 0, 256); g2.addColorStop(0, "#4a7ab8"); g2.addColorStop(.55, "#9cc4e0"); g2.addColorStop(.8, "#e8eef0"); g2.addColorStop(1, "#c8c0a8"); x2.fillStyle = g2; x2.fillRect(0, 0, 16, 256); }
  const skyDay = new THREE.CanvasTexture(c2); skyDay.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(230, 24, 16), new THREE.MeshBasicMaterial({map: skyT, side: THREE.BackSide, fog: false})); sky.position.set(0, -8, 0); g.add(sky);
  // outside the east gate: a spring meadow running down to a stream, for Orpheus and Eurydice (meadow.js)
  const meadow = buildMeadow(lite); g.add(meadow);
  // the snake, waiting in the grass
  const snake = new THREE.Group(); { // a grass snake: a tapering, banded body in loose curves, and a neck that can strike
    const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(new THREE.Vector3(Math.sin(t * 10) * .14 * (1 - t * .6), .03, -t * 1.1)); }
    const n = 60, segs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), S(0xffffff, {roughness: .35}), n - 8), m = new THREE.Matrix4(), c = new THREE.Color();
    const neck = new THREE.Group(); snake.add(segs, neck);
    const rad = t => .011 + .021 * Math.sin(Math.min(1, t * 1.15) * Math.PI * .92); // thin at the tail, thickest past the middle, narrowing to the neck
    for (let i = 0; i < n; i++) { const t = i / n, p = pts[i], r = rad(t), col = c.setHex(i % 5 < 2 ? 0x1e2412 : 0x3e4a22);
      if (i < n - 8) { m.compose(p, new THREE.Quaternion(), new THREE.Vector3(r, r * .8, Math.max(r * 1.6, .016))); segs.setMatrixAt(i, m); segs.setColorAt(i, col); }
      else { const sp = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), S(col.getHex(), {roughness: .35})); sp.position.copy(p).setY(.03 + (t - .87) * .5); sp.scale.set(r, r * .8, r * 1.6); neck.add(sp); } }
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), S(0x1a2010, {roughness: .3})); head.scale.set(.026, .016, .042); head.position.copy(pts[n]).setY(.1); neck.add(head);
    for (const sx of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.005, 6, 4), S(0xc8a030, {roughness: .1})); eye.position.copy(head.position).add(new THREE.Vector3(sx * .018, .008, -.02)); neck.add(eye); }
    snake.userData.head = neck; }
  snake.position.set(29.6, 0, 4.4); snake.rotation.y = Math.PI * .7; snake.visible = false; g.add(snake);
  const sun = new THREE.DirectionalLight(0xffb070, 1.6); sun.position.set(-30, 8, 4); sun.target.position.set(0, 0, 0); sun.visible = false; g.add(sun, sun.target); lights.push(sun);

  return {
    g, lights, food, bier, olives, sky, petals, meadow, snake, sun,
    animate(now) { const a = pg.attributes.position; for (let i = 0; i < pn; i++) { let y = a.getY(i) - .0015; if (y < 2.6) y = 5.6; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(now / 900 + i) * .002); } a.needsUpdate = true; },
    // "wedding": warm dusk; "funeral": the next night, lamps only
    mood(kind) {
      const fun = kind === "funeral", day = kind === "day";
      sun.color.set(day ? 0xfff2d8 : 0xffb070); sun.position.set(day ? -10 : -30, day ? 30 : 8, day ? 12 : 4);
      sky.material.map = day ? skyDay : skyT; sky.material.needsUpdate = true;
      food.visible = !fun; bier.visible = fun; cloth.material.color.set(fun ? 0xd8d0c0 : 0xe9e0cf);
      sun.intensity = fun ? .15 : day ? 3 : 1.6; sky.material.color.set(fun ? 0x2a2a44 : 0xffffff);
      lights.forEach(l => { if (l.isPointLight) l.intensity = l.userData.base ?? (l.userData.base = l.intensity); });
    }
  };
}
