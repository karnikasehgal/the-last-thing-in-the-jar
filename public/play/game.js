// THE COIN: the game. First person, through a liminal Underworld hung with Renaissance paintings.
// Rule: the dog can smell coins. Find one, get it to Charon's ferry. Cerberus can't swim.
import * as THREE from "three";

const $ = s => document.querySelector(s);
const LIB = "../img/lib/";

/* ---------- the map: one character per 4×4 tile ----------
   #  wall          .  marble floor     ~  the river (wade slowly; the dog won't follow)
   P  you start     C  a coin           D  where the dog sleeps
   E  Elpenor       T  Theseus and Pirithous, stuck to their chairs
   K  Charon's ferry                                                                    */
const MAP = [
  "###################",
  "#.....#.....#.....#",
  "#..P.....T.....C..#",
  "#.....#.....#.....#",
  "###.#####.#####.###",
  "#.....#.....#.....#",
  "#..E.....D........#",
  "#.....#.....#.....#",
  "###.#####.#####.###",
  "#.................#",
  "#~~~~~~~~~~~~~~~~~#",
  "#~~~~~~~~~~~~~~~K~#",
  "###################"
];
const T = 4, H = 6.2, ROWS = MAP.length, COLS = MAP[0].length;
const cell = (c, r) => (MAP[r] && MAP[r][c]) || "#";
const find = ch => { for (let r = 0; r < ROWS; r++) { const c = MAP[r].indexOf(ch); if (c >= 0) return {c, r}; } };
const center = ({c, r}) => new THREE.Vector3(c * T + T / 2, 0, r * T + T / 2);
const tileAt = (x, z) => ({c: Math.floor(x / T), r: Math.floor(z / T)});
const isWall = (x, z) => cell(Math.floor(x / T), Math.floor(z / T)) === "#";
const isWater = (x, z) => "~K".includes(cell(Math.floor(x / T), Math.floor(z / T)));

// Rooms, each with a painted ceiling. [c0, r0, c1, r1, painting]
const ROOMS = [
  [1, 1, 5, 3, "styx/last-judgment.jpg"],
  [7, 1, 11, 3, "styx/giordano-proserpina.jpg"],
  [13, 1, 17, 3, "styx/raphael-wedding-banquet.jpg"],
  [1, 5, 5, 7, "styx/giordano-charon.jpg"],
  [7, 5, 11, 7, "styx/signorelli-damned.jpg"],
  [13, 5, 17, 7, "styx/brueghel-orpheus-pluto.jpg"]
];
// Framed paintings on the walls: [c, r, side (n/s/e/w), painting, width]
const WALL_ART = [
  [3, 1, "n", "styx/last-judgment-charon.jpg", 3.2],
  [9, 3, "s", "styx/bernini-proserpina.jpg", 2.2],
  [15, 3, "s", "styx/raphael-psyche-vase.jpg", 2.6],
  [1, 6, "w", "styx/rubens-orpheus.jpg", 3.2],
  [9, 5, "n", "styx/carracci-pluto.jpg", 2.4],
  [17, 6, "e", "styx/testa-aeneas-styx.jpg", 3.4],
  [5, 7, "s", "styx/titian-orpheus.jpg", 3]
];

/* ---------- renderer, scene, camera ---------- */
const canvas = $("#view");
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0806);
scene.fog = new THREE.FogExp2(0x120d09, 0.052);
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 120);
camera.rotation.order = "YXZ";
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

scene.add(new THREE.HemisphereLight(0xf2e2c4, 0x1a120c, 0.55));
const loader = new THREE.TextureLoader();
const tex = (src, repeat) => { const t = loader.load(LIB + src); t.colorSpace = THREE.SRGBColorSpace; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } t.anisotropy = 4; return t; };

// Procedural marble and plaster, so nothing looks like a stock texture.
function noiseTexture(base, vein, size = 512, veins = 18) {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.strokeStyle = vein; g.globalAlpha = .18;
  for (let v = 0; v < veins; v++) { g.lineWidth = Math.random() * 2 + .4; g.beginPath(); let x = Math.random() * size, y = Math.random() * size; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - .5) * 140; y += (Math.random() - .5) * 140; g.lineTo(x, y); } g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- build the world ---------- */
const floorTex = noiseTexture("#cfc3ad", "#6b5a49", 512, 26); floorTex.repeat.set(COLS, ROWS);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(COLS * T, ROWS * T), new THREE.MeshStandardMaterial({map: floorTex, roughness: .55, metalness: .05}));
floor.rotation.x = -Math.PI / 2; floor.position.set(COLS * T / 2, 0, ROWS * T / 2); scene.add(floor);

// the river: a sunken bed and a dark, moving surface
const riverRows = MAP.map((row, r) => row.includes("~") ? r : -1).filter(r => r >= 0);
const r0 = Math.min(...riverRows), r1 = Math.max(...riverRows);
const bed = new THREE.Mesh(new THREE.PlaneGeometry((COLS - 2) * T, (r1 - r0 + 1) * T), new THREE.MeshStandardMaterial({color: 0x0d0a07}));
bed.rotation.x = -Math.PI / 2; bed.position.set(COLS * T / 2, -0.02, (r0 + (r1 - r0 + 1) / 2) * T); scene.add(bed);
const waterTex = noiseTexture("#1d2a24", "#9fb3a5", 256, 30); waterTex.repeat.set(10, 3);
const water = new THREE.Mesh(new THREE.PlaneGeometry((COLS - 2) * T, (r1 - r0 + 1) * T), new THREE.MeshStandardMaterial({map: waterTex, color: 0x5d7468, transparent: true, opacity: .86, roughness: .15, metalness: .3}));
water.rotation.x = -Math.PI / 2; water.position.set(COLS * T / 2, 0.06, bed.position.z); scene.add(water);

// walls
const wallTex = noiseTexture("#b9a88c", "#5b4a39", 256, 6);
const wallMat = new THREE.MeshStandardMaterial({map: wallTex, roughness: .9});
const walls = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (cell(c, r) === "#") walls.push([c, r]);
const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(T, H, T), wallMat, walls.length);
walls.forEach(([c, r], i) => wallMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(c * T + T / 2, H / 2, r * T + T / 2)));
scene.add(wallMesh);
// a dark cornice along the top of every wall, so the rooms read as architecture
const cornice = new THREE.InstancedMesh(new THREE.BoxGeometry(T + .3, .35, T + .3), new THREE.MeshStandardMaterial({color: 0x4a3a2a, roughness: .8}), walls.length);
walls.forEach(([c, r], i) => cornice.setMatrixAt(i, new THREE.Matrix4().makeTranslation(c * T + T / 2, H - .2, r * T + T / 2)));
scene.add(cornice);

// a plain dark ceiling everywhere, with frescoes over the rooms
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(COLS * T, ROWS * T), new THREE.MeshStandardMaterial({color: 0x1a130d}));
ceil.rotation.x = Math.PI / 2; ceil.position.set(COLS * T / 2, H, ROWS * T / 2); scene.add(ceil);
for (const [c0, rr0, c1, rr1, src] of ROOMS) {
  const w = (c1 - c0 + 1) * T, d = (rr1 - rr0 + 1) * T;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({map: tex(src), color: 0x8a7f72}));
  m.rotation.x = Math.PI / 2; m.position.set(c0 * T + w / 2, H - .01, rr0 * T + d / 2); scene.add(m);
}

// framed paintings
function framed(src, width, aspect = .75) {
  const g = new THREE.Group(), h = width * aspect;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + .36, h + .36, .12), new THREE.MeshStandardMaterial({color: 0x6b5432, metalness: .5, roughness: .45}));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshStandardMaterial({map: tex(src), roughness: .8}));
  pic.position.z = .07; g.add(frame, pic); return g;
}
for (const [c, r, side, src, w] of WALL_ART) {
  const p = framed(src, w), x = c * T + T / 2, z = r * T + T / 2, off = T / 2 - .08;
  const pos = {n: [x, z - off, 0], s: [x, z + off, Math.PI], w: [x - off, z, Math.PI / 2], e: [x + off, z, -Math.PI / 2]}[side];
  p.position.set(pos[0], 2.6, pos[1]); p.rotation.y = pos[2]; scene.add(p);
}

// candles: a few warm, flickering lights
const candles = [];
for (const [c0, rr0, c1, rr1] of ROOMS) {
  const l = new THREE.PointLight(0xffc27a, 14, 16, 1.6);
  l.position.set((c0 + c1 + 1) / 2 * T, 4.2, (rr0 + rr1 + 1) / 2 * T); scene.add(l); candles.push(l);
}
const riverLight = new THREE.PointLight(0x7fa69a, 18, 30, 1.4); riverLight.position.set(COLS * T / 2, 4, 9.5 * T); scene.add(riverLight); candles.push(riverLight);
// the far wall of the river is a window onto Patinir's Styx
const vista = new THREE.Mesh(new THREE.PlaneGeometry((COLS - 2) * T, H), new THREE.MeshBasicMaterial({map: tex("styx/patinir-styx.jpg"), color: 0x6f665c}));
vista.position.set(COLS * T / 2, H / 2, (ROWS - 1) * T - .01); vista.rotation.y = Math.PI; scene.add(vista);

/* ---------- painted characters: crops of real paintings, in gilded frames ---------- */
function cropTexture(src, [cx, cy, z], aspect) {
  const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * aspect);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const img = new Image(); img.src = LIB + src;
  img.onload = () => {
    const W = img.naturalWidth, Hh = img.naturalHeight; let w = z * W, h = w * aspect;
    if (h > Hh) { h = Hh; w = h / aspect; }
    const x0 = Math.min(Math.max(cx * W - w / 2, 0), W - w), y0 = Math.min(Math.max(cy * Hh - h / 2, 0), Hh - h);
    c.getContext("2d").drawImage(img, x0, y0, w, h, 0, 0, c.width, c.height); t.needsUpdate = true;
    t.image.dataset.ready = "1";
  };
  t.userData = {canvas: c}; return t;
}
function character(texture, w, h) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + .3, h + .3, .1), new THREE.MeshStandardMaterial({color: 0x7a5f33, metalness: .55, roughness: .4}));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: texture, color: 0xcfc6b8}));
  pic.position.z = .06; g.add(frame, pic);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({color: 0x2a2118})); back.rotation.y = Math.PI; back.position.z = -.06; g.add(back);
  return g;
}
const PEOPLE = {
  elpenor: {name: "Elpenor", src: "styx/odysseus-tiresias.jpg", f: [0.737, 0.26, 0.3], tile: find("E")},
  theseus: {name: "Theseus and Pirithous", src: "styx/theseus-peirithoos-relief.jpg", f: [0.6, 0.35, 0.62], tile: find("T")},
  charon: {name: "Charon", src: "styx/last-judgment-charon.jpg", f: [0.3, 0.36, 0.42], tile: find("K")}
};
for (const p of Object.values(PEOPLE)) {
  p.tex = cropTexture(p.src, p.f, 1.25);
  p.face = p.tex.userData.canvas;
  p.obj = character(p.tex, 1.7, 2.12);
  const pos = center(p.tile); p.pos = pos;
  p.obj.position.set(pos.x, p === PEOPLE.charon ? 1.9 : 1.75, pos.z);
  scene.add(p.obj);
}
// Charon's ferry: a dark hull under him
const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, .6, 1.6), new THREE.MeshStandardMaterial({color: 0x2b1d12, roughness: .9}));
hull.position.set(PEOPLE.charon.pos.x, .25, PEOPLE.charon.pos.z); scene.add(hull);

// The coin: a small gold disc that turns and glows.
function makeCoin(at) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .04, 28), new THREE.MeshStandardMaterial({color: 0xd6b25e, metalness: .9, roughness: .25, emissive: 0x3a2a08}));
  m.rotation.x = Math.PI / 2; m.position.copy(at).setY(1.05);
  const glow = new THREE.PointLight(0xffd27a, 6, 5, 2); glow.position.set(0, 0, 0); m.add(glow);
  scene.add(m); return m;
}
let coins = [makeCoin(center(find("C")))];

// Cerberus: Agostino Carracci's three heads, cut out and very much awake.
const dogTex = cropTexture("styx/carracci-pluto.jpg", [0.72, 0.64, 0.33], .82);
const dog = new THREE.Sprite(new THREE.SpriteMaterial({map: dogTex, color: 0xd9cfc2}));
dog.scale.set(3.1, 2.55, 1);
const dogHome = center(find("D"));
dog.position.copy(dogHome).setY(1.35); scene.add(dog);

/* ---------- the player ---------- */
const start = center(find("P"));
const me = {pos: start.clone(), yaw: Math.PI, pitch: 0, coin: false, caught: 0, splashed: 0, choices: {}, started: 0, met: {}, theseusCoin: true};
const keys = {};
let playing = false, talking = false, ended = false;

/* ---------- sound, made in the browser ---------- */
let actx, master;
function audio() {
  if (actx) return actx;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain(); master.gain.value = .9; master.connect(actx.destination);
  // a low hum, like a huge empty building
  [55, 82.4, 110].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.value = .025 / (i + 1); o.connect(g).connect(master); o.start(); });
  // the river, louder as you get closer
  const b = actx.createBuffer(2, actx.sampleRate * 4, actx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
  const n = actx.createBufferSource(); n.buffer = b; n.loop = true;
  const f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500; f.Q.value = .6;
  sound.river = actx.createGain(); sound.river.gain.value = 0;
  n.connect(f).connect(sound.river).connect(master); n.start();
  return actx;
}
const sound = {
  noise(secs) { const b = actx.createBuffer(1, actx.sampleRate * secs, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = actx.createBufferSource(); s.buffer = b; return s; },
  env(node, peak, a, d, at) { const g = actx.createGain(); at = at ?? actx.currentTime; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(.0001, at + a + d); node.connect(g).connect(master); },
  step(wet) { if (!actx) return; const n = this.noise(.12), f = actx.createBiquadFilter(); f.type = wet ? "bandpass" : "lowpass"; f.frequency.value = wet ? 1400 : 380; n.connect(f); this.env(f, wet ? .25 : .18, .005, .1); n.start(); },
  splash() { if (!actx) return; const n = this.noise(1.2), f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(1800, actx.currentTime); f.frequency.exponentialRampToValueAtTime(300, actx.currentTime + 1); n.connect(f); this.env(f, .7, .02, .9); n.start(); },
  bark() { if (!actx) return; [0, .25, .45].forEach(d => { const at = actx.currentTime + d, o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(240, at); o.frequency.exponentialRampToValueAtTime(90, at + .18); const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; o.connect(f); this.env(f, .5, .01, .2, at); o.start(at); o.stop(at + .3); }); },
  growl(level) { if (!actx) return; const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 48 + Math.random() * 10; const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 160; o.connect(f); this.env(f, .5 * level, .08, .5); o.start(); o.stop(actx.currentTime + .7); },
  hit() { if (!actx) return; const o = actx.createOscillator(); o.frequency.setValueAtTime(120, actx.currentTime); o.frequency.exponentialRampToValueAtTime(28, actx.currentTime + .9); this.env(o, 1, .005, 1); o.start(); o.stop(actx.currentTime + 1.1); const n = this.noise(.5); this.env(n, .6, .002, .4); n.start(); },
  chime() { if (!actx) return; [784, 1175].forEach((fq, i) => { const at = actx.currentTime + i * .1, o = actx.createOscillator(); o.frequency.value = fq; this.env(o, .12, .005, 1.8, at); o.start(at); o.stop(at + 2); }); },
  blip() { if (!actx) return; const o = actx.createOscillator(); o.type = "triangle"; o.frequency.value = 520 + Math.random() * 120; this.env(o, .035, .003, .05); o.start(); o.stop(actx.currentTime + .08); }
};

/* ---------- HUD ---------- */
let toastT;
function toast(msg, ms = 2600) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), ms); }
const setGoal = t => $("#goal").textContent = t;
function paintStats() { $("#stats").innerHTML = `caught by the dog: ${me.caught}<br>splashed: ${me.splashed}`; }
paintStats();

/* ---------- dialogue ---------- */
const GODS = {
  Zeus:{a:"The Sovereign", gift:"You make the call and own it.", shadow:"Being in charge isn't the same as being close."},
  Hera:{a:"The Committed", gift:"You keep promises when it would be easier not to.", shadow:"When you're let down, you punish the wrong person."},
  Poseidon:{a:"The Deep Feeler", gift:"You feel things all the way down.", shadow:"Grudges that surface as storms, years later."},
  Demeter:{a:"The Nurturer", gift:"You look after people without being asked.", shadow:"Grief that freezes everything around it."},
  Athena:{a:"The Strategist", gift:"Cool head, whole board in view.", shadow:"You solve the feeling instead of having it."},
  Apollo:{a:"The Clarifier", gift:"Order, honesty, craft.", shadow:"Admired more than known."},
  Artemis:{a:"The Independent", gift:"You protect people who can't protect themselves.", shadow:"Contempt for weakness."},
  Ares:{a:"The Warrior", gift:"You act while others are still talking.", shadow:"You fight the fight instead of the problem."},
  Aphrodite:{a:"The Connector", gift:"People change around you.", shadow:"You move on fast and leave a mess."},
  Hephaestus:{a:"The Maker", gift:"You turn bad days into something that lasts.", shadow:"You hide in the workshop."},
  Hermes:{a:"The Messenger", gift:"Quick, funny, at home anywhere.", shadow:"Slippery when the truth is inconvenient."},
  Dionysus:{a:"The Liberator", gift:"You loosen everyone up.", shadow:"You lose yourself along with the rules."}
};
const SCENES = {
  elpenor: () => ({
    lines: [["Elpenor", "Oh. Hey. Are you dead too?"], ["Mikon", "Olive pit. You?"], ["Elpenor", "Fell off a roof. Long story. Short roof."]],
    q: [
      {t: "Ask if he's seen a coin anywhere.", g: {Hermes: 2, Athena: 1}, then: [["Elpenor", "Gold ceiling, top right, past the dog. The dog can smell coins, by the way."], ["Elpenor", "Can't swim, though. I fell in the river once. It just stood there and watched."]], goal: "There's a coin under the gold ceiling. The dog can't swim."},
      {t: "Tell him you'll get him out too.", g: {Demeter: 2, Hera: 1}, then: [["Elpenor", "Nobody's ever said that to me."], ["Elpenor", "The dog can't swim. If it comes for you, get in the river."]], goal: "If the dog comes, get in the river."},
      {t: "Tell him to stay off roofs.", g: {Dionysus: 2, Apollo: 1}, then: [["Elpenor", "Bit late, mate."]]}
    ]
  }),
  theseus: () => ({
    lines: [["Theseus", "Don't sit down."], ["Pirithous", "Seriously. Don't."], ["Mikon", "Are you two... stuck?"], ["Theseus", "We've been here a while. My coin's in my belt. I can't reach it. I can't reach anything."]],
    q: [
      {t: "Take his coin. He's not using it.", g: {Ares: 2, Hermes: 1}, act: "take", then: [["Theseus", "Fine. Take it. Quietly. The dog..."], ["Theseus", "Too late. It heard you."]]},
      {t: "Try to pull them off the chairs.", g: {Artemis: 2, Hera: 1}, act: "pull", then: [["Mikon", "On three. One, two..."], ["Pirithous", "AAAAAGH. No. No. It's fused. I'm part chair now."]]},
      {t: "Leave them. They're heroes, they'll figure it out.", g: {Apollo: 2, Zeus: 1}, then: [["Pirithous", "Guys?"]]}
    ]
  }),
  charon: () => me.coin ? ({
    lines: [["Charon", "Coin."], ["Mikon", "...Coin!"], ["Charon", "Get in."], ["Mikon", "There's a kid on the bank. No coin."]],
    q: [
      {t: "Get in. A hundred years. You earned it.", g: {Zeus: 1, Apollo: 1, Hephaestus: 1}, end: "You crossed. It goes faster than you'd think."},
      {t: "Give the kid your coin.", g: {Demeter: 2, Hera: 1}, then: [["Charon", "Doesn't work like that."], ["Mikon", "Then I'll wait with him."], ["Charon", "...Both of you. Get in."]], end: "You both crossed. Charon will deny this."},
      {t: "Stay. You've got a good spot now.", g: {Poseidon: 2, Dionysus: 1, Hephaestus: 1}, end: "You stayed. You've got a rock. You've got a view."}
    ]
  }) : ({lines: [["Charon", "Coin."], ["Mikon", "Working on it."]], splash: true})
};
let talkResolve = null;
function typeLine(el, text) {
  return new Promise(res => {
    let i = 0; el.textContent = "";
    const t = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i % 3 === 0) sound.blip(); if (i >= text.length) { clearInterval(t); res(); } }, 22);
    talkResolve = () => { clearInterval(t); el.textContent = text; res(); };
  });
}
function waitAdvance() { return new Promise(res => { talkResolve = res; }); }
async function talk(id) {
  const p = PEOPLE[id], s = SCENES[id]();
  talking = true; releaseMouse();
  const box = $("#talk"), face = $(".face", box), who = $(".who", box), line = $(".line", box), opts = $(".opts", box), next = $(".next", box);
  face.src = (p.face).toDataURL("image/jpeg", .85);
  box.classList.add("on"); opts.innerHTML = "";
  const say = async ([name, text]) => {
    who.textContent = name; face.style.opacity = name === "Mikon" ? .35 : 1;
    next.textContent = ""; await typeLine(line, text); next.textContent = "click or press E";
    await waitAdvance();
  };
  for (const l of s.lines) await say(l);
  if (s.splash) { sound.splash(); me.splashed++; paintStats(); toast("Splash."); }
  if (s.q) {
    next.textContent = ""; who.textContent = "Mikon"; face.style.opacity = .35; line.textContent = "What do you do?";
    const k = await new Promise(res => {
      opts.innerHTML = s.q.map((o, i) => `<button data-k="${i}"><b>${i + 1}</b>${o.t}</button>`).join("");
      opts.querySelectorAll("button").forEach(b => b.onclick = () => res(+b.dataset.k));
      talkResolve = null; choiceKeys = res;
    });
    choiceKeys = null; opts.innerHTML = "";
    const o = s.q[k]; me.choices[id] = o.g;
    for (const l of o.then || []) await say(l);
    if (o.goal) setGoal(o.goal);
    if (o.act === "take") { if (me.coin) toast("You've already got one."); else if (me.theseusCoin) { me.theseusCoin = false; pickCoin(); } }
    if (o.act === "pull") wakeDog("The noise woke something.", 9);
    if (o.end) { box.classList.remove("on"); talking = false; return finish(o.end); }
  }
  box.classList.remove("on"); talking = false; me.met[id] = true;
  if (playing) grabMouse();
}
let choiceKeys = null;
addEventListener("keydown", e => {
  if (!talking) return;
  if (choiceKeys && /^[123]$/.test(e.key)) { const b = $(`.talk .opts button[data-k="${+e.key - 1}"]`); if (b) b.click(); return; }
  if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") { e.preventDefault(); talkResolve?.(); }
});
$("#talk").addEventListener("click", e => { if (!e.target.closest("button")) talkResolve?.(); });

/* ---------- the coin and the dog ---------- */
function pickCoin(mesh) {
  if (mesh) { scene.remove(mesh); coins = coins.filter(c => c !== mesh); }
  me.coin = true; sound.chime();
  $("#carry").classList.add("on");
  wakeDog("It smells the coin.");
  setGoal("Get the coin to Charon's ferry. Don't let the dog catch you.");
}
function dropCoin() {
  if (!me.coin) return;
  me.coin = false; $("#carry").classList.remove("on");
  coins.push(makeCoin(me.pos.clone().add(new THREE.Vector3(-Math.sin(me.yaw) * .9, 0, -Math.cos(me.yaw) * .9))));
  toast("You put the coin down. The dog loses interest.");
  dogState.calmAt = performance.now() + 2500;
}
const dogState = {mode: "sleep", path: [], repath: 0, calmAt: 0, noiseUntil: 0, growl: 0};
function wakeDog(msg, secs) {
  if (secs) dogState.noiseUntil = performance.now() + secs * 1000;
  if (dogState.mode !== "hunt") { dogState.mode = "hunt"; sound.bark(); toast(msg); }
}
function bfs(from, to) {
  const key = (c, r) => r * COLS + c, prev = new Map(), q = [from]; prev.set(key(from.c, from.r), null);
  while (q.length) {
    const cur = q.shift();
    if (cur.c === to.c && cur.r === to.r) break;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = {c: cur.c + dc, r: cur.r + dr}, ch = cell(n.c, n.r);
      if (ch === "#" || ch === "~" || ch === "K" || prev.has(key(n.c, n.r))) continue;
      prev.set(key(n.c, n.r), cur); q.push(n);
    }
  }
  if (!prev.has(key(to.c, to.r))) return [];
  const path = []; for (let p = to; p; p = prev.get(key(p.c, p.r))) path.unshift(p);
  return path;
}
function nearestDryTile(t) { // where the dog waits when you're in the river
  for (let d = 0; d < 4; d++) { const c = cell(t.c, t.r - d); if (c !== "~" && c !== "K" && c !== "#") return {c: t.c, r: t.r - d}; }
  return find("D");
}
function updateDog(dt, now) {
  const huntWanted = me.coin || now < dogState.noiseUntil;
  if (dogState.mode === "hunt" && !huntWanted && now > dogState.calmAt) dogState.mode = "home";
  let target = null, speed = 0;
  if (dogState.mode === "hunt") {
    const mt = tileAt(me.pos.x, me.pos.z);
    target = isWater(me.pos.x, me.pos.z) ? nearestDryTile(mt) : mt; speed = 5.4;
  } else if (dogState.mode === "home") {
    target = find("D"); speed = 3;
    if (dog.position.distanceTo(new THREE.Vector3(dogHome.x, dog.position.y, dogHome.z)) < .4) dogState.mode = "sleep";
  }
  if (target) {
    if (now > dogState.repath) { dogState.path = bfs(tileAt(dog.position.x, dog.position.z), target); dogState.path.shift(); dogState.repath = now + 300; }
    let goal = dogState.path[0] ? center(dogState.path[0]) : (dogState.mode === "hunt" && !isWater(me.pos.x, me.pos.z) ? me.pos : null);
    if (goal) {
      const v = new THREE.Vector3(goal.x - dog.position.x, 0, goal.z - dog.position.z), d = v.length();
      if (d < .3 && dogState.path.length) dogState.path.shift();
      else if (d > .01) dog.position.addScaledVector(v.normalize(), Math.min(d, speed * dt));
    }
  }
  // breathing, and a lunge when close
  const dist = dog.position.distanceTo(new THREE.Vector3(me.pos.x, dog.position.y, me.pos.z));
  dog.position.y = 1.35 + Math.sin(now / (dogState.mode === "sleep" ? 700 : 140)) * (dogState.mode === "sleep" ? .04 : .09);
  const s = dogState.mode === "sleep" ? 1 : 1.12; dog.scale.set(3.1 * s, 2.55 * s, 1);
  dog.material.color.setHex(dogState.mode === "sleep" ? 0x8a8078 : 0xffe9dc);
  $("#vig").classList.toggle("danger", dogState.mode === "hunt" && dist < 12);
  if (dogState.mode === "hunt" && now > dogState.growl && dist < 16) { sound.growl(Math.max(.2, 1 - dist / 16)); dogState.growl = now + 400 + dist * 60; }
  if (dogState.mode === "hunt" && dist < 1.25 && !isWater(me.pos.x, me.pos.z)) caught();
}

async function caught() {
  if (!playing) return;
  playing = false; releaseMouse(); me.caught++; paintStats();
  canvas.classList.add("caught"); sound.hit();
  const sc = $("#scare"), cv = $("canvas", sc), g = cv.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(dogTex.userData.canvas, 0, 0, cv.width, cv.height);
  sc.classList.add("on");
  await new Promise(r => setTimeout(r, 2200));
  // back to the start, everything as it was
  sc.classList.remove("on"); canvas.classList.remove("caught");
  if (me.coin) { me.coin = false; $("#carry").classList.remove("on"); }
  coins.forEach(c => scene.remove(c)); coins = [makeCoin(center(find("C")))];
  dog.position.copy(dogHome).setY(1.35); dogState.mode = "sleep"; dogState.noiseUntil = 0;
  me.pos.copy(start); me.yaw = Math.PI; me.pitch = 0;
  setGoal("Find a coin. Get to the ferry.");
  playing = true; grabMouse();
}

/* ---------- the ending ---------- */
const GOD_IMG = {Zeus:"zeus", Hera:"hera", Poseidon:"poseidon", Demeter:"demeter", Athena:"athena", Apollo:"apollo", Artemis:"artemis", Ares:"ares", Aphrodite:"aphrodite", Hephaestus:"hephaestus", Hermes:"hermes", Dionysus:"dionysus"};
function finish(line) {
  ended = true; playing = false; releaseMouse(); sound.chime();
  document.body.classList.add("over");
  const score = Object.fromEntries(Object.keys(GODS).map(g => [g, 0]));
  Object.values(me.choices).forEach(g => Object.entries(g).forEach(([k, v]) => score[k] += v));
  if (me.caught === 0) score.Athena += 1; else if (me.caught > 2) score.Ares += 1;
  const patron = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
  const mins = Math.max(1, Math.round((performance.now() - me.started) / 60000));
  $("#endline").textContent = line;
  $("#end .portrait").src = `${LIB}gods/${GOD_IMG[patron]}.jpg`;
  $("#end .god").textContent = patron;
  $("#end .arch").textContent = GODS[patron].a;
  $("#end .read").textContent = `${GODS[patron].gift} Watch out, though: ${GODS[patron].shadow.charAt(0).toLowerCase() + GODS[patron].shadow.slice(1)} Could be worse.`;
  $("#end .score").textContent = `${mins} minute${mins > 1 ? "s" : ""} · caught by the dog ${me.caught} time${me.caught === 1 ? "" : "s"} · splashed ${me.splashed} time${me.splashed === 1 ? "" : "s"}`;
  $("#end").classList.add("on");
  $("#share").onclick = () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I got a coin past Cerberus and onto Charon's ferry. Caught ${me.caught} time${me.caught === 1 ? "" : "s"}. Apparently I play like ${patron}.`)}&url=${encodeURIComponent(location.origin + "/play/")}`, "_blank", "noopener");
}
$("#again").onclick = () => location.reload();

/* ---------- controls ---------- */
const touchMode = matchMedia("(pointer: coarse)").matches;
if (touchMode) $("#keys").innerHTML = "<b>Left thumb</b><span>walk</span><b>Right thumb</b><span>look</span><b>talk</b><span>talk, pick up</span><b>drop</b><span>drop the coin</span>";
function grabMouse() { if (!touchMode && !talking && !ended) canvas.requestPointerLock?.(); }
function releaseMouse() { if (document.pointerLockElement) document.exitPointerLock(); }
document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && playing && !talking && !ended && !touchMode) $("#paused").classList.add("on");
});
$("#resume").onclick = () => { $("#paused").classList.remove("on"); grabMouse(); };
document.addEventListener("mousemove", e => {
  if (!document.pointerLockElement || !playing) return;
  me.yaw -= e.movementX * .0022; me.pitch = Math.max(-1.2, Math.min(1.2, me.pitch - e.movementY * .0022));
});
addEventListener("keydown", e => {
  keys[e.code] = true;
  if (!playing || talking) return;
  if (e.code === "KeyE") interact();
  if (e.code === "KeyQ") dropCoin();
});
addEventListener("keyup", e => { keys[e.code] = false; });
canvas.addEventListener("click", () => { if (playing && !talking) grabMouse(); });

// touch: left half is a joystick, right half turns your head
const touch = {move: null, look: null, mx: 0, mz: 0};
if (touchMode) {
  $("#touch").classList.add("on");
  const stick = $(".stick"), knob = $(".knob");
  $("#touch").addEventListener("touchstart", e => {
    for (const t of e.changedTouches) {
      if (t.target.closest("button")) continue;
      if (t.clientX < innerWidth / 2 && !touch.move) touch.move = {id: t.identifier, x: t.clientX, y: t.clientY};
      else if (!touch.look) touch.look = {id: t.identifier, x: t.clientX, y: t.clientY};
    }
  }, {passive: true});
  $("#touch").addEventListener("touchmove", e => {
    for (const t of e.changedTouches) {
      if (touch.move && t.identifier === touch.move.id) {
        const dx = Math.max(-50, Math.min(50, t.clientX - touch.move.x)), dy = Math.max(-50, Math.min(50, t.clientY - touch.move.y));
        touch.mx = dx / 50; touch.mz = dy / 50; knob.style.transform = `translate(${dx * .8}px,${dy * .8}px)`;
      } else if (touch.look && t.identifier === touch.look.id) {
        me.yaw -= (t.clientX - touch.look.x) * .006; me.pitch = Math.max(-1.1, Math.min(1.1, me.pitch - (t.clientY - touch.look.y) * .006));
        touch.look.x = t.clientX; touch.look.y = t.clientY;
      }
    }
  }, {passive: true});
  const end = e => { for (const t of e.changedTouches) { if (touch.move && t.identifier === touch.move.id) { touch.move = null; touch.mx = touch.mz = 0; knob.style.transform = ""; } if (touch.look && t.identifier === touch.look.id) touch.look = null; } };
  $("#touch").addEventListener("touchend", end); $("#touch").addEventListener("touchcancel", end);
  $("#tE").onclick = () => { if (talking) talkResolve?.(); else if (playing) interact(); };
  $("#tQ").onclick = () => playing && dropCoin();
}

/* ---------- interaction ---------- */
function nearby() {
  for (const c of coins) if (c.position.distanceTo(new THREE.Vector3(me.pos.x, 1.05, me.pos.z)) < 1.6) return {kind: "coin", obj: c, label: "E · pick up the coin"};
  for (const [id, p] of Object.entries(PEOPLE)) if (p.pos.distanceTo(new THREE.Vector3(me.pos.x, 0, me.pos.z)) < (id === "charon" ? 3.4 : 2.8)) return {kind: "talk", id, label: `E · talk to ${p.name}`};
  return null;
}
function interact() {
  const n = nearby();
  if (!n) return;
  if (n.kind === "coin") { if (me.coin) return toast("One coin is plenty."); pickCoin(n.obj); }
  else talk(n.id);
}

/* ---------- the loop ---------- */
let last = performance.now(), stepT = 0, wasWet = false;
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (playing && !talking) {
    const wet = isWater(me.pos.x, me.pos.z);
    let fx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + touch.mx;
    let fz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + touch.mz;
    const len = Math.hypot(fx, fz);
    if (len > 0.05) {
      fx /= Math.max(1, len); fz /= Math.max(1, len);
      const speed = (wet ? 2.2 : (keys.ShiftLeft || keys.ShiftRight ? 7.2 : 4.4));
      const sin = Math.sin(me.yaw), cos = Math.cos(me.yaw);
      const dx = (fx * cos + fz * sin) * speed * dt, dz = (-fx * sin + fz * cos) * speed * dt;
      const R = .38, free = (x, z) => !isWall(x + R, z + R) && !isWall(x - R, z + R) && !isWall(x + R, z - R) && !isWall(x - R, z - R);
      if (free(me.pos.x + dx, me.pos.z)) me.pos.x += dx;
      if (free(me.pos.x, me.pos.z + dz)) me.pos.z += dz;
      stepT -= dt; if (stepT <= 0) { sound.step(wet); stepT = wet ? .7 : (speed > 5 ? .3 : .45); }
    }
    if (wet && !wasWet) { sound.splash(); me.splashed++; paintStats(); if (dogState.mode === "hunt") toast("It won't follow you into the river."); }
    wasWet = wet;
    const n = nearby(); const p = $("#prompt");
    if (n) { p.textContent = touchMode ? n.label.replace("E · ", "") : n.label; p.classList.add("on"); } else p.classList.remove("on");
    updateDog(dt, now);
  }
  // camera
  const eye = isWater(me.pos.x, me.pos.z) ? 1.15 : 1.62;
  camera.position.set(me.pos.x, THREE.MathUtils.lerp(camera.position.y || eye, eye, .15), me.pos.z);
  camera.rotation.set(me.pitch, me.yaw, 0);
  // the world breathes a little
  candles.forEach((l, i) => l.intensity = (i === candles.length - 1 ? 18 : 14) * (0.85 + Math.sin(now / 90 + i * 7) * .06 + Math.random() * .08));
  coins.forEach(c => c.rotation.z = now / 600);
  for (const p of Object.values(PEOPLE)) p.obj.rotation.y = Math.atan2(me.pos.x - p.obj.position.x, me.pos.z - p.obj.position.z);
  waterTex.offset.x = now / 40000; waterTex.offset.y = Math.sin(now / 3000) * .02;
  if (sound.river) sound.river.gain.value = Math.max(0, 1.4 - Math.abs(me.pos.z - 10.5 * T) / 12);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ---------- start ---------- */
$("#go").onclick = () => {
  audio(); actx.resume();
  $("#start").classList.remove("on"); $("#bg").remove();
  playing = true; me.started = performance.now();
  grabMouse();
  setTimeout(() => toast(touchMode ? "Find a coin. The dog is asleep. For now." : "Find a coin. The dog is asleep. For now."), 600);
};

// For testing only: /play/?debug exposes the game state in the console.
if (new URLSearchParams(location.search).has("debug")) window.__game = {me, dog, dogState, PEOPLE, interact, talk, pickCoin, center, find, T};
