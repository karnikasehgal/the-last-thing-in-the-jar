// Trinkets, the Codex, and the save.
// Every trinket is a real kind of object from Greek graves and stories, with its source.
// Positions are in the game's world (x along the river; z from the arcade's back wall toward the far bank).
import * as THREE from "three";
const $ = s => document.querySelector(s);

export const TRINKETS = [
  // the near bank
  {id: "obol", at: [-24, 12.5], kind: "coin", name: "An obol of Athens",
    text: "A small silver coin with Athena's owl on it. Families put one in the mouth of the dead to pay the ferryman. Archaeologists find them in some graves, not most. This one wasn't enough for anyone.",
    src: "Aristophanes, Frogs; burials at Sicyon and Athens"},
  {id: "lekythos", at: [-14, 7], kind: "jar", name: "A white oil flask",
    text: "A lekythos: a slim jar of oil for the grave, painted on a white ground. Some show Charon waiting in his boat, or Hermes leading a woman down to him. Whoever left this one painted the ferryman smiling. Nobody has seen him smile.",
    src: "Athenian white-ground lekythoi, 5th century BC (e.g. the Sabouroff Painter)"},
  {id: "knucklebones", at: [21, 15], kind: "bones", name: "Five knucklebones",
    text: "Astragaloi: sheep's ankle bones, used as dice and as a game like jacks. They turn up in children's graves. Somebody down here is still playing.",
    src: "Children's burials across Greece; the game is in Pausanias 10.30"},
  {id: "curse", at: [40, 6.5], kind: "scroll", name: "A rolled lead curse",
    text: "A katadesmos: a thin sheet of lead with a curse scratched into it, rolled up, pierced with a nail and dropped into a grave so the dead would deliver it below. This one asks the gods of the Underworld to bind the tongue of a man named Kallias so he loses his court case. It's polite about it.",
    src: "Curse tablets from the Athenian Kerameikos, 5th to 4th century BC"},
  {id: "string", at: [9, 20.5], kind: "string", name: "A broken lyre string",
    text: "Gut, twisted fine, snapped near the peg. Someone has played very hard here, and very recently.",
    src: "Foreshadowing. The lyre is in Virgil, Georgics 4, and Ovid, Metamorphoses 10"},
  {id: "seikilos", at: [-33, 14], kind: "stone", name: "A stone with a song on it",
    text: "\"While you live, shine. Don't grieve at all. Life is short, and time takes what it's owed.\" The words are carved with musical notes above them: the oldest complete song that survives anywhere, from a grave in Asia Minor. A man named Seikilos had it cut for someone.",
    src: "The Seikilos epitaph, 1st century AD (National Museum of Denmark)"},
  // the far bank
  {id: "tablet", at: [-6, 92], kind: "gold", name: "A gold leaf, folded small",
    text: "Instructions for the dead, buried with them. \"To the left of the House of Hades you will find a spring, with a white cypress beside it. Don't go near it. Further on is cold water flowing from the Lake of Memory. Tell the guards: I am a child of Earth and starry Heaven. Give me water.\"",
    src: "The Petelia gold tablet, 4th century BC (British Museum); also Hipponion and Thurii"},
  {id: "asphodel", at: [10, 98], kind: "flower", name: "Asphodel",
    text: "A tall grey-white flower with star-shaped petals. Homer's dead walk through a whole meadow of it. It grows on poor ground and looks like nothing much, which seems to be the point.",
    src: "Homer, Odyssey 11.539 and 24.13"},
  {id: "narcissus", at: [-14, 112], kind: "flower", name: "A narcissus",
    text: "The flower Earth grew to tempt a girl in a meadow. Persephone reached for it, the ground opened, and Hades came up in his chariot. She has kept one by her door ever since. Make of that what you will.",
    src: "Homeric Hymn to Demeter, 8 to 18"},
  {id: "seeds", at: [8, 121], kind: "seeds", name: "Six pomegranate seeds",
    text: "Eat anything in the Underworld and you belong to it. Persephone ate pomegranate seeds, so every year she has to come back for part of it. The stories argue about how many. The hymn says one; later tellers say six.",
    src: "Homeric Hymn to Demeter 371 to 413; Ovid, Metamorphoses 5"},
  {id: "fur", at: [14, 74.5], kind: "fur", name: "A tuft of lion's fur",
    text: "Coarse, tawny, caught on the rock by the dog's cave. Only one visitor down here wears a lion. He'll be back for the dog.",
    src: "Foreshadowing: Heracles' twelfth labour, Apollodorus 2.5.12"},
  {id: "bough", at: [-20, 86], kind: "leaf", name: "A golden leaf",
    text: "A single leaf of gold that grew on a tree. The Sibyl told Aeneas he couldn't come down here without the branch it broke from, and that if it was meant for him it would come away easily. This one fell off on its own.",
    src: "Foreshadowing: Virgil, Aeneid 6.136 to 148"}
];

export const PEOPLE = {
  hermes: ["Hermes", "Messenger of the gods and guide of the dead (psychopompos). He walks souls down and, now and then, a living person back up.", "Homer, Odyssey 24.1 to 14"],
  charon: ["Charon", "The ferryman. Virgil describes him as filthy and frightening, with a mass of white beard and eyes of fixed flame. One coin a crossing.", "Virgil, Aeneid 6.298 to 304"],
  elpenor: ["Elpenor", "The youngest of Odysseus's crew. He fell asleep drunk on Circe's roof, forgot the ladder, and broke his neck. He asked to be buried with his oar.", "Homer, Odyssey 10.552 and 11.51 to 78"],
  theseus: ["Theseus and Pirithous", "Two heroes who came down to carry off Persephone. Hades offered them seats. The seats kept them.", "Apollodorus, Epitome 1.24"],
  mikon: ["Mikon", "Choked on an olive pit at his cousin's wedding. Ninety-nine years on the bank and counting. Invented by us: the old man in the river that Psyche is told to ignore.", "After Apuleius, Metamorphoses 6.18"],
  orpheus: ["Orpheus", "The best singer who ever lived. When his wife Eurydice died of a snakebite, he walked down here with a lyre to ask for her back.", "Virgil, Georgics 4.453 to 527; Ovid, Metamorphoses 10.1 to 77"],
  hades: ["Hades", "King of the dead, brother of Zeus. The Greeks avoided saying his name and called him Plouton, the rich one, for all the wealth under the earth.", "Hesiod, Theogony; Plato, Cratylus 403"],
  persephone: ["Persephone", "Queen of the dead, daughter of Demeter. Carried off by Hades, she ate pomegranate seeds below and so spends part of every year here.", "Homeric Hymn to Demeter"],
  eurydice: ["Eurydice", "Orpheus's wife. Bitten by a snake on the day of their wedding, as she ran through long grass.", "Virgil, Georgics 4.457 to 459"],
  sisyphus: ["Sisyphus", "King of Corinth, who cheated death twice. His sentence is a boulder he pushes uphill forever. When Orpheus sang, he sat down on it.", "Homer, Odyssey 11.593 to 600; Ovid, Metamorphoses 10.44"],
  cerberus: ["Cerberus", "The hound of Hades. He lets everyone in and no one out. Three heads, in the version that stuck.", "Hesiod, Theogony 769 to 774; Apollodorus 2.5.12"]
};

/* ---------- the save: one per browser, shared by every chapter ---------- */
const KEY = "jar-save-1";
export const save = (() => {
  let s = {found: [], met: [], done: []};
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  return {
    get: () => s,
    find(id) { if (!s.found.includes(id)) { s.found.push(id); write(); return true; } return false; },
    meet(id) { if (PEOPLE[id] && !s.met.includes(id)) { s.met.push(id); write(); } },
    finish(ch) { if (!s.done.includes(ch)) { s.done.push(ch); write(); } }
  };
})();

/* ---------- trinkets in the world ---------- */
const glint = new THREE.MeshBasicMaterial({color: 0xfff1c0, transparent: true, opacity: .55, depthWrite: false});
function model(kind) {
  const g = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .5, ...o});
  if (kind === "coin" || kind === "gold") { const m = new THREE.Mesh(kind === "coin" ? new THREE.CylinderGeometry(.07, .07, .015, 20) : new THREE.BoxGeometry(.16, .005, .07), M(0xe0b85a, {metalness: .95, roughness: .25})); m.rotation.x = kind === "coin" ? Math.PI / 2 : 0; m.position.y = .05; g.add(m); }
  else if (kind === "jar") { const pts = [[0, 0], [.05, 0], [.06, .1], [.07, .2], [.06, .24], [.025, .27], [.02, .33], [.04, .35], [0, .35]].map(([x, y]) => new THREE.Vector2(x, y)); g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 18), M(0xece2cc))); }
  else if (kind === "bones") for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .03, 4, 8), M(0xe6dcc6)); b.rotation.set(Math.random() * 3, Math.random() * 3, Math.PI / 2); b.position.set(Math.random() * .2 - .1, .02, Math.random() * .2 - .1); g.add(b); }
  else if (kind === "scroll") { const m = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .16, 12), M(0x7d7f84, {metalness: .7})); m.rotation.z = Math.PI / 2; m.position.y = .03; g.add(m); const n = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .12, 6), M(0x3a3028, {metalness: .8})); n.position.y = .05; g.add(n); }
  else if (kind === "string") { const pts = []; for (let i = 0; i < 20; i++) pts.push(new THREE.Vector3(Math.sin(i * .7) * .06, .01, i * .012 - .12)); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .003, 4), M(0xd9c79a))); }
  else if (kind === "stone") { const s = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.1, .16), M(0xb8ad98, {roughness: .9})); s.position.y = .55; g.add(s); const top = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .16, 16, 1, false, 0, Math.PI), s.material); top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2; top.position.y = 1.1; g.add(top); }
  else if (kind === "flower") { const st = new THREE.Mesh(new THREE.CylinderGeometry(.006, .008, .5, 5), M(0x4a5a3a)); st.position.y = .25; g.add(st); for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), M(0xf1ece0)); p.scale.set(1, .3, .5); const a = i / 6 * Math.PI * 2; p.position.set(Math.cos(a) * .035, .5, Math.sin(a) * .035); p.rotation.y = -a; g.add(p); } const c = new THREE.Mesh(new THREE.SphereGeometry(.015, 6, 4), M(0xe0a020)); c.position.y = .51; g.add(c); }
  else if (kind === "seeds") for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.014, 8, 6), M(0xb0102a, {roughness: .2})); s.scale.y = 1.4; s.position.set(Math.cos(i) * .04, .015, Math.sin(i * 1.7) * .04); g.add(s); }
  else if (kind === "fur") { for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.012, .12, 4), M(0xb08a4a, {roughness: 1})); f.rotation.set(Math.random() - .5, 0, Math.PI / 2 + Math.random() - .5); f.position.set(Math.random() * .06, .5 + Math.random() * .06, 0); g.add(f); } }
  else if (kind === "leaf") { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(.05, .06, 0, .14); sh.quadraticCurveTo(-.05, .06, 0, 0); const l = new THREE.Mesh(new THREE.ShapeGeometry(sh, 8), M(0xe8c060, {metalness: .9, roughness: .3, side: THREE.DoubleSide})); l.rotation.x = -Math.PI / 2; l.position.y = .02; g.add(l); }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), glint); halo.position.y = kind === "stone" ? .6 : .12; halo.userData.halo = true; g.add(halo);
  return g;
}
export function placeTrinkets(scene, groundY = () => 0) {
  const list = [];
  for (const t of TRINKETS) {
    if (save.get().found.includes(t.id)) continue;
    const g = model(t.kind); g.position.set(t.at[0], groundY(t.at[0], t.at[1]), t.at[1]); g.rotation.y = Math.random() * 6;
    scene.add(g); list.push({t, g});
  }
  return {
    list,
    near(x, z, r = 1.7) { return list.find(o => !o.taken && Math.hypot(o.g.position.x - x, o.g.position.z - z) < r); },
    take(o) { o.taken = true; o.g.parent?.remove(o.g); save.find(o.t.id); },
    animate(now) { for (const o of list) if (!o.taken) for (const c of o.g.children) if (c.userData.halo) { c.material.opacity = .25 + Math.sin(now / 400 + o.t.at[0]) * .15; c.scale.setScalar(1 + Math.sin(now / 500) * .08); } }
  };
}

/* ---------- the Codex ---------- */
export function showFound(t) {
  const c = $("#found"); c.querySelector("b").textContent = t.name; c.querySelector("p").textContent = t.text; c.querySelector("small").textContent = t.src;
  c.classList.add("on");
}
export function openCodex() {
  const s = save.get(), body = $("#codex .entries");
  const things = TRINKETS.map(t => s.found.includes(t.id)
    ? `<div class="entry"><b>${t.name}</b><p>${t.text}</p><small>${t.src}</small></div>`
    : `<div class="entry locked"><b>Not yet found</b><p>Somewhere on the ${t.at[1] > 50 ? "far" : "near"} bank.</p></div>`).join("");
  const people = Object.entries(PEOPLE).map(([id, [n, d, src]]) => s.met.includes(id)
    ? `<div class="entry"><b>${n}</b><p>${d}</p><small>${src}</small></div>`
    : `<div class="entry locked"><b>Not yet met</b></div>`).join("");
  body.innerHTML = `<h4>Things you found <span>${s.found.length} of ${TRINKETS.length}</span></h4><div class="grid">${things}</div><h4>People you met <span>${s.met.length} of ${Object.keys(PEOPLE).length}</span></h4><div class="grid">${people}</div>`;
  $("#codex").classList.add("on");
}
