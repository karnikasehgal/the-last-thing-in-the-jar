// The film player: camera moves across paintings, voiced lines with subtitles, sound effects,
// choices, the Oracle's reading, credits, and talking to the cast afterwards.
const $ = (s, r = document) => r.querySelector(s);

const KEY = "elpis-coin-v1";
let state = {choices:{}, reached:0};
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.choices) state = s; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
const ACTS = FILM.acts;

/* ---------- the camera ---------- */
const layers = [...document.querySelectorAll(".layer")];
let front = 0, cam = null, lastLook = null;
function frameFor(img, [cx, cy, z]) {
  const W = img.naturalWidth, H = img.naturalHeight, vw = innerWidth, vh = innerHeight;
  z = Math.max(z, 520 / W); // closer than this and the painting turns to mush
  let s = vw / (z * W);
  if (H * s < vh) s = vh / H;
  if (W * s < vw) s = vw / W;
  let tx = vw / 2 - cx * W * s, ty = vh / 2 - cy * H * s;
  tx = Math.min(0, Math.max(vw - W * s, tx));
  ty = Math.min(0, Math.max(vh - H * s, ty));
  return `translate(${tx}px,${ty}px) scale(${s})`;
}

// Credits for library paintings come from each folder's manifest.
const CREDITS = {};
async function loadLibrary() {
  for (const dir of ["styx", "gods"]) {
    try {
      const m = await (await fetch(`img/lib/${dir}/manifest.json`)).json();
      for (const e of Array.isArray(m) ? m : Object.values(m)) {
        const bits = [e.artist, e.title && `<i>${e.title}</i>`, e.year].filter(Boolean).join(", ");
        CREDITS[`img/lib/${dir}/${e.file.split("/").pop()}`] = bits + (e.location ? `. ${e.location}` : "") + (e.author ? `. Photo: ${e.author}, ${e.license}` : "");
      }
    } catch {}
  }
}
const srcOf = img => img.startsWith("img/") ? img : `img/lib/${img}`;
const preloaded = new Set();
function preload(img) { const src = srcOf(img); if (preloaded.has(src)) return; preloaded.add(src); const i = new Image(); i.src = src; }

// A "look" is a named camera position on a painting, defined in shots.js.
function lookFor(name) {
  const l = SHOTS[name];
  if (!l) { console.warn("missing look:", name); return SHOTS._fallback; }
  return l;
}

// Puts a painting on screen and drifts the camera from f to `to` over ms.
// cut = an instant edit; otherwise the two pictures dissolve into each other.
async function show(look, ms, cut = false) {
  const L = layers[1 - front], img = L.firstElementChild, src = srcOf(look.img);
  if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
  try { await img.decode(); } catch {}
  img.style.width = img.naturalWidth + "px";
  img.getAnimations().forEach(x => x.cancel());
  const to = look.to || drift(look.f);
  const anim = img.animate([{transform:frameFor(img, look.f)}, {transform:frameFor(img, to)}], {duration:Math.max(ms, 400), easing:"cubic-bezier(.4,0,.6,1)", fill:"forwards"});
  if (paused) anim.pause();
  const old = layers[front];
  for (const x of [L, old]) x.style.transition = cut ? "none" : "";
  L.classList.add("on"); old.classList.remove("on");
  if (cut) requestAnimationFrame(() => requestAnimationFrame(() => { L.style.transition = old.style.transition = ""; }));
  front = 1 - front; cam = anim; lastLook = {...look, f:to};
  $("#credit").innerHTML = CREDITS[src] || look.credit || "";
}
const drift = ([x, y, z]) => [x, y, Math.max(.1, z * .9)];

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
const estimate = text => 900 + text.split(/\s+/).length * 320;

/* ---------- voices and subtitles ---------- */
const voice = $("#voice");
let soundOn = true;
const esc = t => String(t).replace(/[&<>]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;"}[c]));
function subtitle(text, who) {
  const s = $("#sub");
  if (!text) { s.classList.add("off"); return; }
  s.innerHTML = (who ? `<b class="who">${esc(who)}</b>` : "") + esc(text);
  s.classList.remove("off");
}
const durations = {};
function lineLength(src, text) {
  if (!src || !soundOn) return Promise.resolve(estimate(text));
  if (durations[src]) return Promise.resolve(durations[src]);
  return new Promise(res => {
    const a = new Audio(); a.preload = "metadata";
    let done = false;
    const fin = ms => { if (done) return; done = true; a.onloadedmetadata = a.onerror = null; res(ms); };
    a.onloadedmetadata = () => fin(durations[src] = a.duration * 1000);
    a.onerror = () => fin(estimate(text));
    setTimeout(() => fin(estimate(text)), 2500);
    a.src = src;
  });
}
// Plays one line (or waits the right time if sound is off) with its subtitle.
async function say(text, src, who) {
  subtitle(text, who);
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

// One shot = one spoken line (or one sound effect), with the camera cutting between its looks.
async function shot(s) {
  const looks = (s.see || []).map(lookFor);
  looks.forEach(l => preload(l.img));
  const who = s.who ? CAST[s.who]?.name : null;
  if (s.sfx) {
    const ms = sfx(s.sfx);
    const each = ms / Math.max(1, looks.length);
    for (const [n, l] of looks.entries()) { await show(l, each + 900, s.cut ?? n > 0); await wait(each); }
    return;
  }
  const src = s.id ? `audio/${s.id}.mp3` : null;
  const total = await lineLength(src, s.line);
  const each = total / Math.max(1, looks.length);
  const speaking = say(s.line, src, who);
  for (const [n, l] of looks.entries()) {
    await show(l, each + 1200, s.cut ?? n > 0);
    if (n < looks.length - 1) await wait(each);
  }
  await speaking;
  await wait(s.pause ?? 220);
}

/* ---------- full-screen moments ---------- */
function overlay(id, on = true) { $("#" + id).classList.toggle("on", on); }
function setWhere(text) { $("#where").textContent = text || ""; }

async function titleCard(html, ms = 4200) {
  $("#title > div").innerHTML = html;
  overlay("title");
  await wait(ms);
  overlay("title", false);
}

function choose(act) {
  return new Promise(res => {
    const box = $("#choice");
    $(".q", box).textContent = act.q;
    $(".opts", box).innerHTML = act.opts.map((o, k) => `<button data-k="${k}">${esc(o.t)}</button>`).join("");
    const timer = $(".timer", box);
    timer.style.transition = "none"; timer.style.transform = "scaleX(1)";
    overlay("choice");
    requestAnimationFrame(() => requestAnimationFrame(() => { timer.style.transition = "transform 20s linear"; timer.style.transform = "scaleX(0)"; }));
    let done = false;
    const pick = (k, hesitated) => {
      if (done) return; done = true; clearTimeout(t);
      overlay("choice", false);
      if (hesitated) toast("You hesitated. The moment chose for you.");
      res(k);
    };
    const t = setTimeout(() => pick(Math.floor(Math.random() * act.opts.length), true), 20000);
    box.querySelectorAll(".opts button").forEach(b => b.onclick = () => pick(+b.dataset.k));
    setTimeout(() => box.querySelector(".opts button")?.focus({preventScroll:true}), 300);
  });
}

async function intertitle(card) {
  const box = $("#card");
  $(".lines", box).innerHTML = card.text.split("\n").map(l => `<p>${esc(l)}</p>`).join("");
  $(".src", box).textContent = card.src || "";
  $(".src", box).classList.remove("on");
  overlay("card");
  score.duck(true);
  for (const p of box.querySelectorAll(".lines p")) {
    await wait(700); p.classList.add("on");
    await wait(Math.max(2600, p.textContent.split(" ").length * 320));
  }
  $(".src", box).classList.add("on");
  await wait(3200);
  score.duck(false);
  overlay("card", false);
}

/* ---------- the film ---------- */
async function playCold() {
  setWhere("");
  score.key("cold");
  for (const s of FILM.cold) await shot(s);
  const [ep, name] = FILM.episode.split(":");
  await titleCard(`<div class="act">${esc(ep)}</div><h2>${esc(FILM.title)}</h2><div class="place">${esc(name?.trim() || "")}</div>`, 5200);
  await titleCard(`<div class="place" style="font-size:24px">${esc(FILM.after)}</div>`, 2800);
}

async function playAct(i) {
  const act = ACTS[i];
  state.reached = Math.max(state.reached, i); save();
  setWhere(""); subtitle("");
  score.key(act.id);
  await titleCard(`<div class="act">${esc(act.label)}</div><h2>${esc(act.title)}</h2>`, 3200);
  setWhere(`${act.label} · ${act.title}`);
  for (const s of act.shots) await shot(s);
  const k = await choose(act);
  state.choices[i] = k; save();
  for (const s of [act.opts[k].reply].flat()) await shot(s);
  for (const s of act.after || []) await shot(s);
}

async function playFrom(i) {
  running = true;
  hideMenus();
  $("#pauseBtn").hidden = $("#skipBtn").hidden = $("#menuBtn").hidden = false;
  if (i === 0) await playCold();
  for (let a = i; a < ACTS.length; a++) {
    await playAct(a);
    state.reached = Math.max(state.reached, a + 1); save();
  }
  setWhere(""); subtitle("");
  await intertitle(FILM.card);
  await oracle();
  await rollCredits();
  await sting();
  showEnd();
}

/* ---------- the ending ---------- */
function ranked() {
  const s = Object.fromEntries(GOD_LIST.map(g => [g, 0]));
  Object.entries(state.choices).forEach(([i, k]) => Object.entries(ACTS[i]?.opts[k]?.g || {}).forEach(([g, v]) => s[g] += v));
  return GOD_LIST.map((g, i) => [g, s[g], i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0]);
}

async function oracle() {
  setWhere("Epilogue · The Oracle");
  score.key("oracle");
  const r = ranked(), patron = r[0], ally = r[1], neglected = r[r.length - 1];
  await titleCard(`<div class="act">Epilogue</div><h2>The Oracle</h2><div class="place">what your choices say about you</div>`, 3600);
  show(lookFor(`god ${patron}`), 12000);
  const P = $("#patron");
  P.innerHTML = `<small>you are most like</small><b>${patron}</b><span>${GODS[patron].gk} · ${GODS[patron].a}</span><em>Your ally: ${ally}<br>The one you neglect: ${neglected}</em>`;
  await wait(1000); P.classList.add("on");
  const text = await readingText(patron, ally, neglected);
  await wait(3500);
  P.classList.remove("on");
  const parts = chunk(text);
  const looks = [`god ${patron} face`, "oracle", `god ${ally} face`, `god ${neglected} face`, `god ${patron}`];
  for (const [n, part] of parts.entries()) {
    show(lookFor(looks[n % looks.length]), estimate(part) + 4000, false);
    await wait(500);
    const src = soundOn ? await speak(part) : null;
    await say(part, src, "The Oracle");
    if (src) URL.revokeObjectURL(src);
  }
  await wait(1000);
}
function chunk(text) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+["”']?\s*/g) || [text];
  const out = []; let cur = "";
  for (const s of sentences) { if ((cur + s).length > 200 && cur) { out.push(cur.trim()); cur = ""; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
async function readingText(patron, ally, neglected) {
  const choices = ACTS.map((a, i) => { const o = a.opts[state.choices[i] ?? 0]; return {age:`${a.label}, ${a.title}`, text:o.t, gods:Object.keys(o.g)}; });
  try {
    const res = await fetch("/api/reading", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({choices, patron, ally, neglected})});
    if (!res.ok) throw 0;
    const t = (await res.text()).trim();
    if (t.length < 60 || t.includes("No answer right now")) throw 0;
    return t.replace(/[*_#]/g, "");
  } catch {
    return `A hundred years on a riverbank, and five choices. You chose the way ${patron} would. ${GODS[patron].gift} Watch the shadow, though. ${GODS[patron].shadow} ${ally} shows up when ${patron} gets tired. And ${neglected} barely gets a word in. This week, do one small thing ${neglected} would do. Things could be worse. They usually could.`;
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
  const cast = Object.values(CAST).map(c => `<span>${esc(c.name)}</span><span>${c.name === "Mikon" ? "a man with no coin" : "as themselves"}</span>`).join("");
  const painters = [...new Set(Object.values(SHOTS).map(l => l.artist).filter(Boolean))];
  $("#credits .roll").innerHTML = `
    <div class="t">${esc(FILM.title)}</div><div class="ep">${esc(FILM.episode)}</div>
    <dl>
      <dt>Written and made by</dt><dd>Karnika Sehgal</dd>
      <dt>Cast</dt><dd><div class="cast">${cast}</div></dd>
      <dt>Painted by</dt><dd>${painters.map(esc).join(" · ")}</dd>
      <dt>Based on stories by</dt><dd>Homer · Virgil · Ovid · Apuleius · Apollodorus · Aristophanes</dd>
      <dt>Voices</dt><dd>Deepgram Aura, on Cloudflare</dd>
      <dt>Splashed during filming</dt><dd>One man, roughly thirty-six thousand times</dd>
      <dt>No dogs were harmed</dt><dd>One was borrowed. He was returned.</dd>
    </dl>
    <div class="next">Next: Episode II<small>coming soon</small></div>`;
  overlay("credits");
  const roll = $("#credits .roll");
  roll.style.animation = "none"; void roll.offsetWidth; roll.style.animation = "";
  await new Promise(res => { roll.onanimationend = res; $("#skipCredits").onclick = res; });
  overlay("credits", false);
}

async function sting() {
  if (!FILM.sting) return;
  score.key("cold");
  show(lookFor(FILM.sting.see[0]), 9000);
  await wait(1200);
  subtitle(FILM.sting.text);
  await wait(4500);
  subtitle("");
  await wait(800);
}

function showEnd() {
  running = false;
  $("#pauseBtn").hidden = $("#skipBtn").hidden = true;
  show(lookFor("river wide"), 40000);
  overlay("end");
}

/* ---------- menus and controls ---------- */
let running = false;
function hideMenus() { ["start", "end", "chapters"].forEach(id => overlay(id, false)); }
function openChapters() {
  const list = $("#chapters .list");
  list.innerHTML = ACTS.map((a, i) => `<button data-i="${i}" ${i > state.reached ? "disabled" : ""}><span>${a.num}. ${esc(a.title)}</span><i>${i > state.reached ? "not yet" : esc(a.label)}</i></button>`).join("");
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
addEventListener("resize", () => {
  const img = layers[front].firstElementChild;
  if (lastLook && img.naturalWidth) { img.getAnimations().forEach(a => a.finish()); img.style.transform = frameFor(img, lastLook.f); }
});

let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3800); }

/* ---------- sound: a slow chord under everything, and effects ---------- */
const score = (() => {
  const CHORDS = {
    open:[110, 164.8, 220, 261.6], cold:[98, 146.8, 196, 233.1], bank:[110, 164.8, 220, 261.6],
    singer:[130.8, 196, 261.6, 329.6], chairs:[87.3, 130.8, 174.6, 207.7], dog:[82.4, 123.5, 164.8, 196],
    coin:[110, 164.8, 220, 277.2], oracle:[130.8, 196, 246.9, 329.6]
  };
  let ctx, master, voices = [], on = false, current = "open", ducked = false;
  const level = () => ducked ? 0.02 : 0.05;
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    const wet = ctx.createGain(); wet.gain.value = .8; const dry = ctx.createGain(); dry.gain.value = .3;
    lp.connect(verb).connect(wet).connect(master); lp.connect(dry).connect(master); master.connect(ctx.destination);
    placeVoices();
    CHORDS.open.forEach((f, i) => {
      const g = ctx.createGain(); g.gain.value = .16;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = .04 + i * .023; lg.gain.value = .1; lfo.connect(lg).connect(g.gain); lfo.start();
      voices.push([0, 4].map(det => { const o = ctx.createOscillator(); o.type = i ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det; o.connect(g); o.start(); return o; }));
      g.connect(lp);
    });
  }
  // Voices go through a small stone room with a little warmth, over a quiet river,
  // so they sound like they're in the scene rather than on top of it.
  function placeVoices() {
    const src = ctx.createMediaElementSource(voice);
    const len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    const room = ctx.createConvolver(); room.buffer = ir;
    const warm = ctx.createBiquadFilter(); warm.type = "lowshelf"; warm.frequency.value = 220; warm.gain.value = 3;
    const air = ctx.createBiquadFilter(); air.type = "highshelf"; air.frequency.value = 6000; air.gain.value = -4;
    const wet = ctx.createGain(); wet.gain.value = .2;
    src.connect(warm).connect(air);
    air.connect(ctx.destination);
    air.connect(room).connect(wet).connect(ctx.destination);
    const b = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } }
    const n = ctx.createBufferSource(); n.buffer = b; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 500; f.Q.value = .6;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .15; lg.gain.value = 180; lfo.connect(lg).connect(f.frequency); lfo.start();
    const rg = ctx.createGain(); rg.gain.value = 7; n.connect(f).connect(rg).connect(master); n.start();
  }
  return {
    start() { try { if (!ctx) build(); ctx.resume(); on = true; master.gain.setTargetAtTime(level(), ctx.currentTime, 2.5); this.key(current); } catch {} },
    stop() { if (!ctx) return; on = false; master.gain.setTargetAtTime(0, ctx.currentTime, .8); },
    key(name) { if (!CHORDS[name]) return; current = name; if (!ctx) return; CHORDS[name].forEach((f, i) => voices[i]?.forEach(o => o.frequency.setTargetAtTime(f, ctx.currentTime, 2.2))); },
    duck(d) { ducked = d; if (ctx && on) master.gain.setTargetAtTime(level(), ctx.currentTime, .5); },
    ctx: () => ctx
  };
})();

// Sound effects, synthesised in the browser. Returns how long the moment should last (ms).
function sfx(kind) {
  const LEN = {splash:1300, oar:1600, lyre:4200, bark:1500, hit:1100, rumble:2000};
  const ms = LEN[kind] || 1200;
  const ctx = score.ctx();
  if (!ctx || !soundOn) return ms;
  const t = ctx.currentTime, out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
  const noise = secs => { const b = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = b; return s; };
  const env = (node, peak, attack, decay, at = t) => { const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + attack); g.gain.exponentialRampToValueAtTime(.0001, at + attack + decay); node.connect(g); return g; };
  if (kind === "splash" || kind === "oar") {
    const n = noise(1.4), f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(kind === "oar" ? 600 : 1800, t); f.frequency.exponentialRampToValueAtTime(300, t + 1); f.Q.value = .8;
    n.connect(f); env(f, kind === "oar" ? .25 : .7, .02, kind === "oar" ? 1.3 : .9).connect(out); n.start(t);
  } else if (kind === "lyre") {
    [392, 523.3, 659.3, 784, 659.3, 523.3, 587.3, 784].forEach((fq, i) => {
      const at = t + i * .42, o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = fq;
      env(o, .09, .005, 1.6, at).connect(out); o.start(at); o.stop(at + 1.8);
    });
  } else if (kind === "bark") {
    [0, .28, .5].forEach(d => {
      const at = t + d, o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(220, at); o.frequency.exponentialRampToValueAtTime(90, at + .18);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; o.connect(f);
      env(f, .35, .01, .2, at).connect(out); o.start(at); o.stop(at + .3);
    });
  } else if (kind === "hit") {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(30, t + .8);
    env(o, .9, .005, .9).connect(out); o.start(t); o.stop(t + 1);
    const n = noise(.4); env(n, .4, .002, .3).connect(out); n.start(t);
  } else if (kind === "rumble") {
    const n = noise(2.2), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 120;
    n.connect(f); env(f, 1.2, .3, 1.7).connect(out); n.start(t);
  }
  return ms;
}

/* ---------- talk to the cast ---------- */
const TALKERS = ["mikon", "charon", "elpenor", "heracles"];
const OPENERS = {mikon:"Oh! Hi. Sorry, I'm a bit wet. Are you here to cross?", charon:"Coin.", elpenor:"Hey. Don't go on any roofs. That's my advice.", heracles:"You're not here for the dog, are you? I've got the dog."};
const ABOUT = {mikon:"Mikon. On the riverbank, a hundred years.", charon:"Charon. The ferryman. Not a talker.", elpenor:"Elpenor. Fell off a roof.", heracles:"Heracles. Has the dog."};
const talks = {};
let talkWho = null, talking = false;
function openTalk() {
  $("#talk .who").innerHTML = TALKERS.map(id => `<button data-id="${id}">${CAST[id].name}</button>`).join("") + `<button class="x" aria-label="Close">×</button>`;
  $("#talk .who").querySelectorAll("button[data-id]").forEach(b => b.onclick = () => pickTalk(b.dataset.id));
  $("#talk .x").onclick = () => $("#talk").classList.remove("on");
  $("#talk").classList.add("on");
  pickTalk(talkWho || "mikon");
}
function pickTalk(id) {
  talkWho = id;
  $("#talk .who").querySelectorAll("button[data-id]").forEach(b => b.classList.toggle("sel", b.dataset.id === id));
  $("#talk .about").textContent = ABOUT[id];
  $("#talk .log").innerHTML = "";
  (talks[id] ||= []).forEach(m => addMsg(m.role === "user" ? "u" : "c", m.content, CAST[id].name));
  if (!talks[id].length) addMsg("c", OPENERS[id], CAST[id].name);
  $("#talk input").focus();
}
function addMsg(who, text, name) {
  const d = document.createElement("div"); d.className = "msg " + who;
  d.innerHTML = who === "c" ? `<b>${esc(name)}</b>${esc(text).replace(/\*/g, "")}` : esc(text);
  $("#talk .log").appendChild(d); $("#talk .log").scrollTop = 1e9; return d;
}
$("#talk form").onsubmit = async e => {
  e.preventDefault();
  const input = $("#talk input"), text = input.value.trim();
  if (!text || talking || !talkWho) return;
  talking = true; input.value = "";
  const id = talkWho, name = CAST[id].name, hist = talks[id];
  addMsg("u", text); hist.push({role:"user", content:text});
  const el = addMsg("c", "", name); el.insertAdjacentHTML("beforeend", `<span class="caret"></span>`);
  let reply = "";
  try {
    const res = await fetch("/api/echo", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({character:id, messages:hist})});
    if (!res.ok || !res.body) { let m = "(No answer right now. Try again in a bit.)"; try { m = (await res.json()).error || m; } catch {} throw new Error(m); }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) { const {done, value} = await reader.read(); if (done) break; reply += value; el.innerHTML = `<b>${esc(name)}</b>${esc(reply).replace(/\*/g, "")}<span class="caret"></span>`; $("#talk .log").scrollTop = 1e9; }
    el.innerHTML = `<b>${esc(name)}</b>${esc(reply).replace(/\*/g, "")}`;
    hist.push({role:"assistant", content:reply});
  } catch (err) {
    el.innerHTML = `<b>${esc(name)}</b><i>${esc(err.message && err.message !== "Failed to fetch" ? err.message : "(No answer right now. Try again in a bit.)")}</i>`;
    hist.pop();
  }
  talking = false;
};
$("#talkBtn").onclick = openTalk;
addEventListener("keydown", e => { if (e.key === "Escape") $("#talk").classList.remove("on"); });

/* ---------- start ---------- */
$("#againBtn").onclick = () => { state = {choices:{}, reached:0}; save(); location.hash = ""; location.reload(); };

(async function boot() {
  await loadLibrary();
  show(lookFor("start"), 60000);
  const fromHash = /^#act-(\d)$/.exec(location.hash);
  const startAt = fromHash ? Math.min(+fromHash[1], state.reached) : (state.reached > 0 && state.reached < ACTS.length ? state.reached : 0);
  if (startAt > 0) { $("#playBtn").textContent = `Continue the film: ${ACTS[startAt].title}`; $("#restartBtn").hidden = false; }
  if (state.reached > 0) $("#chapBtn").hidden = false;
  overlay("start");
  const go = i => { score.start(); playFrom(i); };
  $("#playBtn").onclick = () => go(startAt);
  $("#restartBtn").onclick = () => { state = {choices:{}, reached:0}; save(); go(0); };
  if (fromHash) history.replaceState(null, "", location.pathname);
})();
