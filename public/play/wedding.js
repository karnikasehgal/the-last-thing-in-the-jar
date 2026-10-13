// The wedding at Corinth, where Chapter I begins: a courtyard at dusk, a long table under a vine,
// olives, bread, wine, a roast lamb, oil lamps, a piper, and a sunset beyond the colonnade.
// The same courtyard, cleared and lamp-lit, is where they lay Mikon out the next night.
// It is built far from the river (around x = 300) and only ever seen in the opening film.
import * as THREE from "three";
import { buildMeadow } from "./meadow.js";
import { pbr } from "./pbr.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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
  add(new THREE.Mesh(new THREE.BoxGeometry(36, .2, 28), pbr("seaworn_stone_tiles", {size: 2.6, tint: 0xf2e8d6})), 0, -.1, 0);
  const lime = noise("#e6dccb", "#9a8a72", 256, 6, .1);
  const wallM = pbr("plastered_wall_02", {size: 3, tint: 0xf2e8d6}); // whitewashed lime plaster
  add(new THREE.Mesh(new THREE.BoxGeometry(36, 4, .5), wallM), 0, 2, 14);
  add(new THREE.Mesh(new THREE.BoxGeometry(36, 4, .5), wallM), 0, 2, -14);
  // the east wall, with the gate Mikon walks in through
  add(new THREE.Mesh(new THREE.BoxGeometry(.5, 4, 12), wallM), 18, 2, -8); add(new THREE.Mesh(new THREE.BoxGeometry(.5, 4, 12), wallM), 18, 2, 8);
  add(new THREE.Mesh(new THREE.BoxGeometry(.6, 1, 4.2), wallM), 18, 3.5, 0);
  for (const z of [-2.1, 2.1]) add(new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 3.2, 24), pbr("marble_01", {size: 1.3, rough: .7, tint: 0xf2ece0})), 17.6, 1.6, z);
  // the west side is a colonnade, open to the sunset
  for (let z = -12; z <= 12; z += 3) add(new THREE.Mesh(new THREE.CylinderGeometry(.24, .28, 3.8, 24), pbr("marble_01", {size: 1.3, rough: .7, tint: 0xf2ece0})), -18, 1.9, z);
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

  dressed(g, S);

  // The sky, painted as the films paint it. Dusk: deep blue overhead going to peach and gold toward the sun setting
  // beyond the colonnade (to the west), the sun a soft blaze on the horizon, and slow clouds lit pink and gold from
  // underneath. Day: clear blue, paler at the horizon, white clouds. The funeral: night, and stars.
  const skyU = {mode: {value: 0}, sunDir: {value: new THREE.Vector3(-1, .06, .1).normalize()}, time: {value: 0}};
  const sky = new THREE.Mesh(new THREE.SphereGeometry(230, 48, 24), new THREE.ShaderMaterial({uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float mode; uniform vec3 sunDir; uniform float time; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0., w = .5; for (int i = 0; i < 5; i++) { a += w * n(p); p *= 2.03; w *= .5; } return a; }
      void main(){
        vec3 d = normalize(vD); float y = max(d.y, 0.), s = max(dot(d, sunDir), 0.);
        // clouds: a layer seen from below, stretched toward the horizon
        vec2 cp = d.xz / (d.y + .12) * 1.6 + vec2(time * .004, 0.);
        float cl = smoothstep(.5, .78, fbm(cp)) * smoothstep(.0, .12, d.y);
        vec3 col;
        if (mode < .5) { // dusk
          vec3 zen = vec3(.18, .3, .62), mid = vec3(1., .5, .42), hor = vec3(1., .72, .36);
          col = mix(hor, mid, smoothstep(.0, .25, y)); col = mix(col, zen, smoothstep(.22, .85, y));
          col = mix(col, vec3(1., .66, .32), pow(s, 2.5) * .75 * (1. - smoothstep(.1, .7, y)));              // the glow round the sun
          col += vec3(1., .85, .6) * pow(s, 200.) * 3. + vec3(1., .7, .4) * pow(s, 24.) * .5;
          vec3 cc = mix(vec3(.55, .42, .55), vec3(1., .66, .52), pow(s, 2.) * .8 + (1. - smoothstep(.0, .25, y)) * .5); // lit from below, warmest near the sun
          col = mix(col, cc, cl * .85);
          col = mix(col, vec3(.95, .7, .52), (1. - smoothstep(-.02, .06, d.y)) * .6); // haze along the horizon
        } else if (mode < 1.5) { // day
          vec3 zen = vec3(.24, .48, .86), hor = vec3(.78, .88, .96);
          col = mix(hor, zen, smoothstep(.0, .55, y));
          col += vec3(1., .95, .85) * pow(s, 300.) * 2.;
          col = mix(col, vec3(1.), cl * .9);
        } else { // night
          col = mix(vec3(.05, .07, .14), vec3(.01, .015, .04), smoothstep(.0, .6, y));
          vec2 sp = floor(d.xz / (d.y + .3) * 160.); float st = step(.997, h(sp)) * smoothstep(.05, .3, d.y);
          col += vec3(.9, .9, 1.) * st;
          col = mix(col, vec3(.08, .09, .14), cl * .5);
        }
        // (kept well below white: the tone mapping washes very bright colour out to grey, and a sunset is all colour)
        col *= mode < .5 ? .62 : mode < 1.5 ? .62 : 1.;
        gl_FragColor = vec4(col, 1.);
      }`}));
  sky.position.set(0, -8, 0); g.add(sky);
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
    animate(now) { skyU.time.value = now / 1000; const a = pg.attributes.position; for (let i = 0; i < pn; i++) { let y = a.getY(i) - .0015; if (y < 2.6) y = 5.6; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(now / 900 + i) * .002); } a.needsUpdate = true; },
    // "wedding": warm dusk; "funeral": the next night, lamps only
    mood(kind) {
      this.kind = kind;
      const fun = kind === "funeral", day = kind === "day";
      sun.color.set(day ? 0xfff4e2 : 0xffb46e); sun.position.set(day ? -10 : -30, day ? 30 : 9, day ? 12 : 7);
      sun.userData.dir = sun.position.clone().normalize(); // (the shadow rig keeps its own copy of the sun's direction: tell it)
      skyU.mode.value = fun ? 2 : day ? 1 : 0;
      food.visible = !fun; bier.visible = fun; cloth.material.color.set(fun ? 0xd8d0c0 : 0xe9e0cf);
      sun.intensity = fun ? .15 : day ? 3.4 : 3.6; // (the key light: a low golden sun raking across the courtyard)
      lights.forEach(l => { if (l.isPointLight) l.intensity = l.userData.base ?? (l.userData.base = l.intensity); });
    }
  };
}

// The courtyard dressed for the night, after the bride's mood board: a ceiling of great sheer white swags, burgundy
// gauze falling from the colonnade and pooling on the floor, candles everywhere (down the tables, in clusters on the
// floor, lining the way in from the gate with white flowers), and over the gate an arch of flowing white strands.
function dressed(g, S) {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // a length of cloth: hung between two ends, sagging, gathered at the ends and falling open in folds between
  function swag(x0, width, z0, z1, top, sag, mat, folds = 7) {
    const geo = new THREE.PlaneGeometry(1, 1, 28, 64), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const u = P.getX(i) + .5, t = P.getY(i) + .5, open = .22 + .78 * Math.sin(Math.PI * t);
      // across the width the cloth hangs in scallops between its folds, deepest mid-span; along it, a slow ripple
      const scallop = Math.pow(Math.abs(Math.sin(u * Math.PI * folds)), .7) * .2 * open, ripple = Math.sin(t * Math.PI * 13 + u * 4) * .05 * open;
      const wave = Math.sin(u * Math.PI * 2 * folds) * .12 * (1.25 - open);
      P.setXYZ(i, x0 + (u - .5) * width * open + wave, top - sag * Math.sin(Math.PI * t) - scallop + ripple, z0 + (z1 - z0) * t + Math.sin(u * Math.PI * folds) * .15 * open);
    }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  // a fall of cloth from a beam to the floor, pinched into gathers at the top, flaring and pooling at the bottom
  function cascade(x, z, width, top, mat) {
    const geo = new THREE.PlaneGeometry(1, 1, 24, 48), P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const u = P.getX(i) + .5, t = .5 - P.getY(i); // t: 0 at the beam, 1 at the end of the pool
      const drop = Math.min(1, t / .82), pool = Math.max(0, (t - .82) / .18);
      const spread = .35 + .65 * Math.pow(drop, .6) + pool * .4;
      const fold = Math.sin(u * Math.PI * 9 + rnd() * .2) * (.05 + .1 * drop);
      P.setXYZ(i, x + fold + pool * 1.1, Math.max(.01, top - drop * (top - .02)) + pool * .03 * Math.sin(u * 30), z + (u - .5) * width * spread);
    }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); g.add(m); return m;
  }
  const sheer = new THREE.MeshStandardMaterial({color: 0x8a8274, roughness: 1, transparent: true, opacity: .26, side: THREE.DoubleSide, depthWrite: false}); // (dim: the torches below light it from close by)
  for (const x of [-11, 10]) swag(x, 3.6, -13.7, 13.7, 4.15, .5 + rnd() * .15, sheer, 5); // (clear of the vine over the high table)
  const gauze = new THREE.MeshStandardMaterial({color: 0x6e1020, roughness: .75, transparent: true, opacity: .78, side: THREE.DoubleSide, depthWrite: false});
  for (const z of [-10.5, -7.5, 7.5, 10.5]) cascade(-17.6, z, 2.4, 3.9, gauze);
  for (const z of [-12.8, 12.8]) cascade(17.4, z * .9, 2, 3.9, gauze);

  // candles
  const spots = []; // [x, y, z, height, radius]
  for (const tz of [-5.2, 5.2]) for (let i = 0; i < 7; i++) spots.push([-2.4 + i * .8, .79, tz, .12 + rnd() * .22, .028]); // down the side tables
  for (const x of [-2.75, 2.75]) spots.push([x, .79, 0, .3, .035]); // the two ends of the high table
  const cluster = (cx, cz, n, r = .45) => { for (let i = 0; i < n; i++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * r; spots.push([cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d, .18 + rnd() * .55, .045 + rnd() * .04]); } };
  for (const [x, z] of [[-16.6, -12.6], [-16.6, 12.6], [16.4, -12.6], [16.4, 12.6], [-16.8, -9], [-16.8, 9], [-16.8, -6], [-16.8, 6], [-4, -13.1], [4, -13.1], [-4, 13.1], [4, 13.1], [12, -13.1], [12, 13.1]]) cluster(x, z, 7);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; cluster(-9.5 + Math.cos(a) * 4.1, Math.sin(a) * 4.1, 3, .2); } // round the dance floor
  for (let x = 13.4; x <= 17; x += .7) for (const z of [-3, -.4]) cluster(x, z, 2, .15);      // the way in from the gate
  const n = spots.length, wax = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 14), S(0xf1e6d2, {roughness: .55}), n);
  const fire = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({color: new THREE.Color(2.2, 1.45, .62)}), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  spots.forEach(([x, y, z, h, r], i) => {
    wax.setMatrixAt(i, m4.compose(v.set(x, y + h / 2, z), q, sc.set(r, h, r)));
    fire.setMatrixAt(i, m4.compose(v.set(x, y + h + .025, z), q, sc.set(.011, .028, .011)));
  });
  g.add(wax, fire);
  // white flowers heaped round the floor candles: roses and sprays, with a little green
  const blooms = [], leaves = [];
  spots.forEach(([x, y, z, h]) => { if (y > .5) return; for (let k = 0; k < 7; k++) { const a = rnd() * 6.3, d = .1 + rnd() * .32; blooms.push([x + Math.cos(a) * d, .03 + rnd() * .1, z + Math.sin(a) * d, .026 + rnd() * .03]); if (k < 2) leaves.push([x + Math.cos(a + 1) * d, .03, z + Math.sin(a + 1) * d]); } });
  const bloom = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), S(0xf6f2ea, {roughness: .7}), blooms.length);
  blooms.forEach(([x, y, z, r], i) => bloom.setMatrixAt(i, m4.compose(v.set(x, y, z), q.setFromEuler(new THREE.Euler(rnd(), rnd(), rnd())), sc.set(r, r * .55, r))));
  const leaf = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), S(0x4a6236, {roughness: .8}), leaves.length);
  leaves.forEach(([x, y, z], i) => leaf.setMatrixAt(i, m4.compose(v.set(x, y, z), q.setFromEuler(new THREE.Euler(0, rnd() * 6, 0)), sc.set(.09, .025, .045))));
  g.add(bloom, leaf);
  // the arch over the gate: white strands rising from the floor on each side and flowing over in loose waves
  const strands = [];
  for (let i = 0; i < 72; i++) {
    const R = 2.5 + (rnd() - .5) * .9, H = 3.2 + rnd() * .9, ph = rnd() * 6.3, k = .8 + rnd() * 2.2, amp = .2 + rnd() * .8, foot = (rnd() - .5) * 1.2;
    const pts = [];
    for (let j = 0; j <= 40; j++) {
      const s = j / 40, a = Math.PI * s, sw = Math.sin(Math.PI * s);
      pts.push(new THREE.Vector3(15.6 + Math.sin(s * Math.PI * 2 * k + ph) * amp * sw + foot * (1 - sw), Math.sin(a) * H + (rnd() - .5) * .02, -R * Math.cos(a) + Math.sin(s * 9 + ph) * .12 * sw));
    }
    strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .011, 4));
  }
  g.add(new THREE.Mesh(mergeGeometries(strands), S(0xf6f4f0, {roughness: .35, metalness: .1})));
}
