// The film player: camera moves over paintings, voiced lines with subtitles, choices, items,
// the Oracle's reading, credits, and talking to the cast afterwards.
const $ = (s, r = document) => r.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const ICONS = {
  golden:`<svg viewBox="0 0 100 100"><path d="M27 40c3-15 29-22 45-10 13 10 11 35-4 43-15 9-37 6-43-8-4-9-1-17 2-25z"/><path d="M25 46c15 6 35 3 49-9M29 63c15 4 31 1 43-9M40 30c-4 14-2 34 6 45" opacity=".7"/><path d="M58 55c3-2 7 0 7 3s-3 5-6 4"/></svg>`,
  silver:`<svg viewBox="0 0 100 100"><path d="M10 42c12-14 68-14 80 0"/><path d="M15 50c13-10 57-10 70 0" opacity=".6"/><path d="M10 42l5 8M90 42l-5 8"/><path d="M40 66c2-7 11-8 14-2 3-2 8-1 9 2-3 1-5 3-6 7-6 3-15 1-17-7z"/><path d="M63 66l6-2"/></svg>`,
  bronze:`<svg viewBox="0 0 100 100"><path d="M12 30h76v42H12z"/><path d="M12 38h76M12 64h76" opacity=".5"/><path d="M26 48h10M40 48h8M52 48h14M28 55h12M44 55h18" opacity=".8"/><circle cx="20" cy="34" r="1.5"/><circle cx="80" cy="34" r="1.5"/></svg>`,
  heroic:`<svg viewBox="0 0 100 100"><circle cx="46" cy="48" r="22"/><path d="M26 42c14-6 28-6 40 2M25 53c15 4 30 2 42-8M32 31c10 10 14 24 12 38M45 26c8 12 11 28 6 44" opacity=".75"/><path d="M66 58c9 5 13 13 9 20s-14 7-17 14"/></svg>`,
  iron:`<svg viewBox="0 0 100 100"><path d="M24 12h44l10 10v66H24z"/><path d="M68 12v10h10"/><path d="M32 32h34M32 42h34M32 52h34M32 62h22" opacity=".7"/><path d="M34 76c6-6 9 4 15-2s8 2 12-2"/></svg>`
};

const KEY = "elpis-film-v2";
let state = {choices:{}, reached:0};
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.choices) state = s; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

/* ---------- the camera ---------- */
const layers = [...document.querySelectorAll(".layer")];
let front = 0, cam = null, lastShot = null;
function frameFor(img, [cx, cy, z]) {
  const W = img.naturalWidth, H = img.naturalHeight, vw = innerWidth, vh = innerHeight;
  let s = vw / (z * W);
  if (H * s < vh) s = vh / H;
  if (W * s < vw) s = vw / W;
  let tx = vw / 2 - cx * W * s, ty = vh / 2 - cy * H * s;
  tx = Math.min(0, Math.max(vw - W * s, tx));
  ty = Math.min(0, Math.max(vh - H * s, ty));
  return `translate(${tx}px,${ty}px) scale(${s})`;
}
async function show(key, a, b, ms) {
  const L = layers[1 - front], img = L.firstElementChild, p = PAINTINGS[key];
  if (img.dataset.key !== key) { img.src = p.src; img.dataset.key = key; }
  try { await img.decode(); } catch {}
  img.style.width = img.naturalWidth + "px";
  const anim = img.animate([{transform:frameFor(img, a)}, {transform:frameFor(img, b)}], {duration:ms, easing:"cubic-bezier(.4,0,.6,1)", fill:"forwards"});
  if (paused) anim.pause();
  const old = layers[front];
  L.classList.add("on"); old.classList.remove("on");
  front = 1 - front; cam = anim; lastShot = {key, b};
  $("#credit").textContent = p.credit;
}

/* ---------- time, pause and skip ---------- */
let paused = false, skipNow = null;
function wait(ms) {
  return new Promise(res => {
    let left = ms, last = performance.now(), done = false;
    const finish = () => { if (!done) { done = true; skipNow = null; res(); } };
    skipNow = finish;
    (function tick() {
      if (done) return;
      const now = performance.now();
      if (!paused) left -= now - last;
      last = now;
      if (left <= 0) return finish();
      setTimeout(tick, 50);
    })();
  });
}
const estimate = text => 1400 + text.split(/\s+/).length * 330;

/* ---------- voices and subtitles ---------- */
const voice = $("#voice");
let soundOn = true;
function subtitle(text) { const s = $("#sub"); if (!text) { s.classList.add("off"); return; } s.textContent = text; s.classList.remove("off"); }
async function say(line, src) {
  subtitle(line.line ?? line);
  const text = line.line ?? line;
  if (!src && line.id) src = `audio/${line.id}.mp3`;
  if (!soundOn || !src) { await wait(estimate(text)); subtitle(""); return; }
  voice.src = src;
  score.duck(true);
  try { await voice.play(); }
  catch { score.duck(false); await wait(estimate(text)); subtitle(""); return; }
  await new Promise(res => {
    let done = false;
    const fin = () => { if (done) return; done = true; voice.onended = voice.onerror = null; skipNow = null; res(); };
    voice.onended = fin; voice.onerror = fin;
    skipNow = () => { voice.pause(); fin(); };
  });
  score.duck(false);
  subtitle("");
}

async function shot(s) {
  await show(s.img, s.a, s.b, estimate(s.line) + 3500);
  await wait(500);
  await say(s);
  await wait(450);
}

/* ---------- overlays ---------- */
function overlay(id, on = true) { $("#" + id).classList.toggle("on", on); }
function setWhere(text) { $("#where").textContent = text || ""; }

async function titleCard(act) {
  $("#title > div").innerHTML = `<div class="act">Act ${act.num}</div><h2>${act.age}</h2><div class="place">${act.place}</div>`;
  overlay("title"); score.key(act.id);
  await wait(4200);
  overlay("title", false);
}

function choose(act) {
  return new Promise(res => {
    const box = $("#choice");
    $(".q", box).textContent = act.q;
    $(".opts", box).innerHTML = act.opts.map((o, k) => `<button data-k="${k}">${o.t}</button>`).join("");
    const timer = $(".timer", box);
    timer.style.transition = "none"; timer.style.transform = "scaleX(1)";
    overlay("choice");
    requestAnimationFrame(() => requestAnimationFrame(() => { timer.style.transition = "transform 25s linear"; timer.style.transform = "scaleX(0)"; }));
    let done = false;
    const pick = (k, hesitated) => {
      if (done) return; done = true; clearTimeout(t);
      overlay("choice", false);
      if (hesitated) toast("You hesitated. The moment chose for you.");
      res(k);
    };
    const t = setTimeout(() => pick(Math.floor(Math.random() * act.opts.length), true), 25000);
    box.querySelectorAll(".opts button").forEach(b => b.onclick = () => pick(+b.dataset.k));
    setTimeout(() => box.querySelector(".opts button")?.focus({preventScroll:true}), 300);
  });
}

async function intertitle(card) {
  const box = $("#card");
  $(".lines", box).innerHTML = card.text.split("\n").map(l => `<p>${l}</p>`).join("");
  $(".src", box).textContent = card.src;
  $(".src", box).classList.remove("on");
  overlay("card");
  score.duck(true);
  for (const p of box.querySelectorAll(".lines p")) {
    await wait(700); p.classList.add("on");
    await wait(Math.max(2600, p.textContent.split(" ").length * 300));
  }
  $(".src", box).classList.add("on");
  await wait(3200);
  score.duck(false);
  overlay("card", false);
}

async function itemFound(act, i) {
  const box = $("#relic");
  $(".art", box).innerHTML = ICONS[act.id];
  $("h3", box).textContent = act.relic.name;
  $("p", box).textContent = act.relic.note;
  overlay("relic"); chime();
  document.querySelectorAll("#items span")[i]?.classList.add("got");
  await wait(4200);
  overlay("relic", false);
  await wait(600);
}

async function inventoryForm() {
  const donor = {0:"Unknown", 1:"Unknown (still looking)", 2:"Unknown"}[state.choices[4]] ?? "Unknown";
  const rows = ACTS.slice(0, 4).map((a, i) => `<div class="row"><span>${i + 1}.</span><span>${a.relic.name}. <i>${a.relic.note}</i></span><span class="m">${a.relic.mark}</span></div>`).join("");
  $("#form .sheet").innerHTML = `<div class="head"><span>Musei Vaticani · Storeroom inventory</span><span>Crate 7</span></div>
    <div style="margin-bottom:6px"><i>Donor:</i> <span class="hand">${donor}</span></div>${rows}
    <div class="sig"><span>Catalogued by: <span class="hand">S.</span></span><span class="m" style="color:var(--sinopia);font-style:normal;font-size:21px">Σ</span></div>
    <button class="go">continue ›</button>`;
  overlay("form");
  const sheet = $("#form .sheet");
  for (const r of sheet.querySelectorAll(".row")) { await wait(1100); r.classList.add("on"); }
  await wait(1100); $(".sig", sheet).classList.add("on");
  await wait(900); $(".go", sheet).classList.add("on");
  await new Promise(res => { $(".go", sheet).onclick = res; setTimeout(res, 14000); });
  overlay("form", false);
}

/* ---------- an act ---------- */
async function playAct(i) {
  const act = ACTS[i];
  state.reached = Math.max(state.reached, i); save();
  setWhere(""); subtitle("");
  await titleCard(act);
  setWhere(`Act ${act.num} · ${act.age} · ${act.place}`);
  const tag = $("#tag");
  $("b", tag).textContent = act.who.name;
  $("span", tag).textContent = act.who.job;
  for (const [n, s] of act.shots.entries()) {
    if (n === 0) setTimeout(() => tag.classList.add("on"), 1800), setTimeout(() => tag.classList.remove("on"), 8500);
    await shot(s);
  }
  // hold on the last frame for the choice
  const k = await choose(act);
  state.choices[i] = k; save();
  await show(lastShot.key, lastShot.b, zoomIn(lastShot.b), estimate(act.opts[k].reply.line) + 3000);
  await say(act.opts[k].reply);
  await wait(500);
  for (const s of act.after) await shot(s);
  await wait(600);
  if (act.card) await intertitle(act.card);
  if (i < 4) await itemFound(act, i);
  else await inventoryForm();
}
const zoomIn = ([x, y, z]) => [x, y, Math.max(.12, z * .85)];

async function playFrom(i) {
  running = true;
  hideMenus();
  $("#pauseBtn").hidden = $("#skipBtn").hidden = false;
  $("#menuBtn").hidden = false;
  paintItems();
  for (let a = i; a < ACTS.length; a++) {
    await playAct(a);
    state.reached = Math.max(state.reached, a + 1); save();
  }
  await finale();
}

/* ---------- the ending ---------- */
function ranked() {
  const s = Object.fromEntries(GOD_LIST.map(g => [g, 0]));
  Object.entries(state.choices).forEach(([i, k]) => Object.entries(ACTS[i].opts[k].g).forEach(([g, v]) => s[g] += v));
  return GOD_LIST.map((g, i) => [g, s[g], i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0]);
}

async function finale() {
  setWhere(""); subtitle("");
  $("#title > div").innerHTML = `<h2>The Last Thing in the Jar</h2>`;
  overlay("title"); score.key("parnassus");
  await wait(4800);
  overlay("title", false);
  await oracle();
  await rollCredits();
  showEnd();
}

async function oracle() {
  setWhere("Epilogue · The Oracle at Delphi");
  const r = ranked(), patron = r[0], ally = r[1], neglected = r[r.length - 1];
  const F = ORACLE.frames;
  show("council", [.47, .48, .8], [.47, .48, .5], 9000);
  const P = $("#patron");
  P.innerHTML = `<small>your patron</small><b>${patron}</b><span>${GODS[patron].gk} · ${GODS[patron].a}</span><em>Ally: ${ally}<br>The one you neglect: ${neglected}</em>`;
  await wait(1200); P.classList.add("on");
  const text = await readingText(patron, ally, neglected);
  await wait(4000);
  P.classList.remove("on");
  const parts = chunk(text);
  for (const [n, part] of parts.entries()) {
    const f = F[n % F.length], g = F[(n + 1) % F.length];
    await show(ORACLE.img, f, g, estimate(part) + 4000);
    await wait(400);
    let src = null;
    if (soundOn) src = await speak(part);
    await say(part, src || undefined).catch(() => {});
    if (src) URL.revokeObjectURL(src);
  }
  await wait(1200);
}
function chunk(text) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+["”']?\s*/g) || [text];
  const out = []; let cur = "";
  for (const s of sentences) { if ((cur + s).length > 230 && cur) { out.push(cur.trim()); cur = ""; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
async function readingText(patron, ally, neglected) {
  const choices = ACTS.map((a, i) => { const o = a.opts[state.choices[i] ?? 0]; return {age:`${a.age}, as ${a.who.name} the ${a.who.job.replace(/^an? /, "")}`, text:o.t, gods:Object.keys(o.g)}; });
  try {
    const res = await fetch("/api/reading", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({choices, patron, ally, neglected})});
    if (!res.ok) throw 0;
    const t = (await res.text()).trim();
    if (t.length < 60 || t.includes("No answer right now")) throw 0;
    return t.replace(/[*_#]/g, "");
  } catch {
    return `Five jobs, five choices, and a pattern. You chose the way ${patron} would. ${GODS[patron].gift} Watch the shadow, though. ${GODS[patron].shadow} ${ally} shows up when ${patron} gets tired. And ${neglected} barely gets a word in. This week, do one small thing ${neglected} would do. ${GODS[neglected].gift} Things could be worse. Things usually could.`;
  }
}
async function speak(text) {
  try {
    const res = await fetch("/api/voice", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({text, voice:ORACLE.voice})});
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch { return null; }
}

async function rollCredits() {
  setWhere(""); subtitle("");
  const cast = ACTS.map(a => `<span>${a.who.greek}</span><span>${a.who.job.replace(/^an? /, "the ")}</span>`).join("");
  $("#credits .roll").innerHTML = `
    <div class="t">The Last Thing in the Jar</div><div class="ep">Episode I · The Five Ages</div>
    <dl>
      <dt>Written and made by</dt><dd>Karnika Sehgal</dd>
      <dt>Cast</dt><dd><div class="cast">${cast}</div></dd>
      <dt>Painted by</dt><dd>Michelangelo · Raphael · Annibale Carracci · Piero di Cosimo</dd>
      <dt>Locations</dt><dd>The Sistine Chapel · the Stanza della Segnatura · the Pinacoteca Vaticana · the Palazzo Farnese · the Villa Farnesina · the Alte Pinakothek</dd>
      <dt>Based on stories by</dt><dd>Hesiod · Apollodorus · Ovid · Plutarch · Pausanias · Catullus</dd>
      <dt>Voices</dt><dd>Deepgram Aura, on Cloudflare</dd>
      <dt>Swallowed during filming</dt><dd>One stone</dd>
      <dt>No minotaurs were harmed</dt><dd>One was. Theseus has been notified.</dd>
    </dl>
    <div class="next">Next: Episode II, <i>The Heroes</i><small>Heracles · the Argonauts · Troy · Odysseus</small></div>`;
  overlay("credits");
  const roll = $("#credits .roll");
  roll.style.animation = "none"; void roll.offsetWidth; roll.style.animation = "";
  await new Promise(res => { roll.onanimationend = res; $("#skipCredits").onclick = res; });
  overlay("credits", false);
}

function showEnd() {
  running = false;
  $("#pauseBtn").hidden = $("#skipBtn").hidden = true;
  show("ceiling", [.3, .5, .6], [.7, .5, .6], 40000);
  overlay("end");
}

/* ---------- menus ---------- */
let running = false;
function hideMenus() { ["start", "end", "chapters"].forEach(id => overlay(id, false)); }
function paintItems() {
  $("#items").innerHTML = ACTS.slice(0, 4).map((a, i) => `<span class="${state.choices[i] !== undefined && i < state.reached ? "got" : ""}" title="${a.relic.name}">${ICONS[a.id]}</span>`).join("");
}
function openChapters() {
  const list = $("#chapters .list");
  list.innerHTML = ACTS.map((a, i) => `<button data-i="${i}" ${i > state.reached ? "disabled" : ""}><span>${a.num}. ${a.age}</span><i>${i > state.reached ? "not yet" : a.who.name + ", " + a.who.job}</i></button>`).join("");
  list.querySelectorAll("button").forEach(b => b.onclick = () => { location.hash = "act-" + b.dataset.i; location.reload(); });
  overlay("chapters");
}
$("#chapClose").onclick = () => overlay("chapters", false);
$("#chapBtn").onclick = openChapters;
$("#endChapBtn").onclick = openChapters;
$("#menuBtn").onclick = () => { if (!paused) togglePause(); openChapters(); };

function togglePause() {
  paused = !paused;
  $("#pauseBtn").textContent = paused ? "play" : "pause";
  if (paused) { voice.pause(); cam?.pause(); score.duck(true); }
  else { if (voice.src && !voice.ended && voice.currentTime > 0) voice.play().catch(() => {}); cam?.play(); score.duck(false); overlay("chapters", false); }
}
$("#pauseBtn").onclick = togglePause;
$("#skipBtn").onclick = () => skipNow?.();
$("#soundBtn").onclick = () => {
  soundOn = !soundOn;
  $("#soundBtn").textContent = soundOn ? "sound on" : "sound off";
  if (!soundOn) { voice.pause(); skipNow?.(); score.stop(); } else score.start();
};
addEventListener("keydown", e => {
  if ($("#talk").classList.contains("on") || !running) return;
  if (e.code === "Space") { e.preventDefault(); togglePause(); }
  if (e.key === "ArrowRight") skipNow?.();
});
addEventListener("resize", () => { if (lastShot && cam) { const img = layers[front].firstElementChild; img.getAnimations().forEach(a => a.finish()); img.style.transform = frameFor(img, lastShot.b); } });

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3800); }

/* ---------- the score: a slow chord, made live in the browser ---------- */
const score = (() => {
  const CHORDS = {
    open:[110, 164.8, 220, 261.6], golden:[130.8, 196, 261.6, 329.6], silver:[110, 164.8, 220, 261.6],
    bronze:[98, 146.8, 196, 233.1], heroic:[87.3, 130.8, 174.6, 220], iron:[110, 164.8, 220, 277.2], parnassus:[130.8, 196, 246.9, 329.6]
  };
  let ctx, master, voices = [], on = false, current = "open", ducked = false;
  const level = () => ducked ? 0.022 : 0.055;
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1000;
    const wet = ctx.createGain(); wet.gain.value = .8; const dry = ctx.createGain(); dry.gain.value = .3;
    lp.connect(verb).connect(wet).connect(master); lp.connect(dry).connect(master); master.connect(ctx.destination);
    CHORDS.open.forEach((f, i) => {
      const g = ctx.createGain(); g.gain.value = .16;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = .04 + i * .023; lg.gain.value = .1; lfo.connect(lg).connect(g.gain); lfo.start();
      voices.push([0, 4].map(det => { const o = ctx.createOscillator(); o.type = i ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det; o.connect(g); o.start(); return o; }));
      g.connect(lp);
    });
  }
  return {
    start() { try { if (!ctx) build(); ctx.resume(); on = true; master.gain.setTargetAtTime(level(), ctx.currentTime, 2.5); this.key(current); } catch {} },
    stop() { if (!ctx) return; on = false; master.gain.setTargetAtTime(0, ctx.currentTime, .8); },
    key(name) { if (!CHORDS[name]) return; current = name; if (!ctx) return; CHORDS[name].forEach((f, i) => voices[i]?.forEach(o => o.frequency.setTargetAtTime(f, ctx.currentTime, 2.2))); },
    duck(d) { ducked = d; if (ctx && on) master.gain.setTargetAtTime(level(), ctx.currentTime, .5); },
    ctx: () => ctx, out: () => master
  };
})();
function chime() {
  const ctx = score.ctx(); if (!ctx || !soundOn) return;
  [523.3, 784].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .12;
    o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 2.5);
  });
}

/* ---------- talk to the cast ---------- */
const talks = {};
let talkWho = null, talking = false;
function openTalk() {
  const reached = ACTS.filter((a, i) => state.choices[i] !== undefined);
  if (!reached.length) return toast("Watch an act first.");
  $("#talk .who").innerHTML = ACTS.map((a, i) => `<button data-id="${a.id}" ${state.choices[i] === undefined ? "disabled" : ""}>${a.who.name}</button>`).join("") + `<button class="x" aria-label="Close">×</button>`;
  $("#talk .who").querySelectorAll("button[data-id]").forEach(b => b.onclick = () => pickTalk(b.dataset.id));
  $("#talk .x").onclick = () => $("#talk").classList.remove("on");
  $("#talk").classList.add("on");
  pickTalk(talkWho && state.choices[ACTS.findIndex(a => a.id === talkWho)] !== undefined ? talkWho : reached[reached.length - 1].id);
}
function pickTalk(id) {
  talkWho = id;
  const act = ACTS.find(a => a.id === id);
  $("#talk .who").querySelectorAll("button[data-id]").forEach(b => b.classList.toggle("sel", b.dataset.id === id));
  $("#talk .about").textContent = `${act.who.name}, ${act.who.job}. ${act.age}.`;
  const log = $("#talk .log"); log.innerHTML = "";
  (talks[id] ||= []).forEach(m => addMsg(m.role === "user" ? "u" : "c", m.content, act.who.name));
  if (!talks[id].length) addMsg("c", {golden:"Yeah? If this is about the rock, I just deliver them.", silver:"Hi. If you want a jar, it's a two week wait. If you want to talk, I've got until the kiln's hot.", bronze:"Still drying off. What can I do for you?", heroic:"You're not here to kill anything, are you? I just mopped.", iron:"Sorry, I'm technically still on shift. What's up?"}[id], act.who.name);
  $("#talk input").focus();
}
function addMsg(who, text, name) {
  const d = document.createElement("div"); d.className = "msg " + who;
  d.innerHTML = who === "c" ? `<b>${name}</b>${esc(text)}` : esc(text);
  $("#talk .log").appendChild(d); $("#talk .log").scrollTop = 1e9; return d;
}
const esc = t => t.replace(/[&<>]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;"}[c])).replace(/\*/g, "");
$("#talk form").onsubmit = async e => {
  e.preventDefault();
  const input = $("#talk input"), text = input.value.trim();
  if (!text || talking || !talkWho) return;
  talking = true; input.value = "";
  const id = talkWho, act = ACTS.find(a => a.id === id), hist = talks[id];
  addMsg("u", text); hist.push({role:"user", content:text});
  const el = addMsg("c", "", act.who.name); el.insertAdjacentHTML("beforeend", `<span class="caret"></span>`);
  let reply = "";
  try {
    const res = await fetch("/api/echo", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({character:id, messages:hist})});
    if (!res.ok || !res.body) { let m = "(No answer. They might be on a break.)"; try { m = (await res.json()).error || m; } catch {} throw new Error(m); }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) { const {done, value} = await reader.read(); if (done) break; reply += value; el.innerHTML = `<b>${act.who.name}</b>${esc(reply)}<span class="caret"></span>`; $("#talk .log").scrollTop = 1e9; }
    el.innerHTML = `<b>${act.who.name}</b>${esc(reply)}`;
    hist.push({role:"assistant", content:reply});
  } catch (err) {
    el.innerHTML = `<b>${act.who.name}</b><i>${esc(err.message && err.message !== "Failed to fetch" ? err.message : "(No answer. They might be on a break.)")}</i>`;
    hist.pop();
  }
  talking = false;
};
$("#talkBtn").onclick = openTalk;
addEventListener("keydown", e => { if (e.key === "Escape") $("#talk").classList.remove("on"); });

/* ---------- start ---------- */
const shareText = () => {
  const r = ranked();
  return state.choices[4] !== undefined
    ? `Watched a courier deliver a rock to a god who eats his kids, and a janitor hand Ariadne his yarn. My patron god is apparently ${r[0]}.`
    : "A short film you can play: a courier, a potter, a carpenter, a janitor and an intern, in five ages of Greek myth.";
};
$("#shareBtn").onclick = () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(location.origin + "/")}`, "_blank", "noopener");
$("#againBtn").onclick = () => { state = {choices:{}, reached:0}; save(); location.hash = ""; location.reload(); };

(function boot() {
  show("ceiling", [.2, .5, .55], [.8, .5, .55], 60000);
  const fromHash = /^#act-(\d)$/.exec(location.hash);
  const startAt = fromHash ? Math.min(+fromHash[1], state.reached) : (state.reached > 0 && state.reached < ACTS.length ? state.reached : 0);
  if (startAt > 0) {
    $("#playBtn").textContent = `Continue: Act ${ACTS[startAt].num}`;
    $("#restartBtn").hidden = false;
  }
  if (state.reached > 0) $("#chapBtn").hidden = false;
  overlay("start");
  const go = i => { score.start(); voice.play().catch(() => {}); voice.pause(); playFrom(i); };
  $("#playBtn").onclick = () => go(startAt);
  $("#restartBtn").onclick = () => { state = {choices:{}, reached:0}; save(); go(0); };
  if (fromHash) history.replaceState(null, "", location.pathname);
})();
