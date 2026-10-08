// Drawings for each relic, in ink.
const ICONS = {
  stone:`<svg viewBox="0 0 100 100"><path d="M27 40c3-15 29-22 45-10 13 10 11 35-4 43-15 9-37 6-43-8-4-9-1-17 2-25z"/><path d="M25 46c15 6 35 3 49-9M29 63c15 4 31 1 43-9M40 30c-4 14-2 34 6 45"/><path d="M58 55c3-2 7 0 7 3s-3 5-6 4" opacity=".7"/><path d="M60 57c1-1 3 0 3 1" opacity=".6"/></svg>`,
  fennel:`<svg viewBox="0 0 100 100"><path d="M28 88 70 16M34 90 76 18"/><path d="M40 70l6 3M52 50l6 3M63 32l5 3" opacity=".6"/><path d="M73 16c-3-5 2-8 0-13M73 16c4-3 8-1 9-6M73 16c-5-1-7-5-11-5" opacity=".75"/><ellipse cx="73" cy="16" rx="4" ry="2.4"/></svg>`,
  plank:`<svg viewBox="0 0 100 100"><path d="M14 40 86 32l2 25-72 8z"/><path d="M19 50c20-3 43-6 65-8M21 58c18-2 40-5 62-7" opacity=".4"/><path d="M30 43v13M36 42v13M42 42v13M48 41v13M54 40v13M60 40v13M66 39v13M72 38v13M78 37v13"/></svg>`,
  thread:`<svg viewBox="0 0 100 100"><circle cx="46" cy="50" r="23"/><path d="M25 44c14-6 29-6 42 2M24 55c15 4 31 2 44-8M31 33c10 10 15 25 13 39M44 27c8 12 11 29 6 46M57 31c2 14 0 29-8 41" opacity=".75"/><path d="M68 60c9 5 12 13 8 20s-13 6-15 13"/></svg>`,
  screen:`<svg viewBox="0 0 100 100"><rect x="31" y="12" width="38" height="76" rx="6"/><path d="M45 18h10" opacity=".6"/><path d="M50 40c-6 0-9 5-9 10 0 7 9 13 9 13s9-6 9-13c0-5-3-10-9-10z"/></svg>`
};

const LS = "elpis-state-v1";
let state = {choices:{}, letters:[false,false,false,false,false]};
try { const s = JSON.parse(localStorage.getItem(LS)); if (s && s.choices) state = s; } catch {}
const save = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch {} };
const unlocked = () => Object.keys(state.choices).length;
const $ = (s, r = document) => r.querySelector(s);

function render() {
  const story = $("#story");
  story.querySelectorAll(".age,.scene").forEach(n => n.remove());
  AGES.forEach((a, i) => {
    const sec = document.createElement("section");
    sec.className = "age"; sec.id = a.id; sec.dataset.i = i;
    sec.style.setProperty("--c", a.c);
    const done = state.choices[i] !== undefined;
    const wit = a.witness.map((p, j) => p === "__BIG__" ? `<div class="name">Ἐλπίς</div>` : `<p${j === 0 ? ' class="dropcap"' : ""}>${p}</p>`).join("");
    sec.innerHTML = `
      <div>
        <div class="chap">${a.num} · ${a.label}</div>
        <h2>${a.title}</h2>
        <div class="greek">${a.greek}</div>
        <p class="myth">${a.myth}<cite>${a.cite}</cite></p>
        <div class="witness"><div class="who">${a.iron ? "Her name" : "What I saw"}</div>${wit}</div>
        <div class="echo">
          <button>listen to the echo</button><span class="where">a voice, recorded near ${a.relic.found}</span>
          <div class="transcript">${a.echo.split(" ").map(w => `<span class="w">${w}</span>`).join(" ")}</div>
        </div>
      </div>
      <div>
        <div class="niche">
          <div class="frame">${ICONS[a.relic.icon]}</div>
          <div class="plate"><b>${a.relic.name}</b>${a.relic.desc}<i>Found at ${a.relic.found}, by <span class="${done ? "" : "hid"}">${a.relic.by}</span></i></div>
        </div>
        <div class="choose">
          <div class="q">${a.q}</div>
          ${a.opts.map((o, k) => `<button class="opt${state.choices[i] === k ? " picked" : ""}" data-k="${k}" ${done ? "disabled" : ""}>${o.t}</button>`).join("")}
          <p class="found${done ? " show" : ""}"><b>Who found it.</b>${a.reveal}</p>
        </div>
      </div>
      <button class="glyph${state.letters[i] ? " got" : ""}" style="${a.gpos}" aria-label="A faint letter">${a.glyph}</button>
      <div class="seal">This age is still closed. Answer the one before it.</div>`;
    const sealed = i > 0 && state.choices[i - 1] === undefined;
    if (sealed) sec.classList.add("sealed");
    const sc = SCENES[a.id], scene = document.createElement("section");
    scene.className = "scene" + (sealed ? " locked" : "");
    scene.dataset.scene = a.id;
    scene.innerHTML = `<div class="img" style="background-image:url(${sc.img});background-position:${sc.pos};transform-origin:${sc.pos}"></div><div class="shade"></div>
      <div class="card"><div class="act">Act ${a.num}</div><h2>${a.label}</h2><div class="sub">${a.title}</div><div class="lock">This act opens when you finish the one before.</div></div>
      <div class="credit">${sc.credit}. ${sc.place}</div><div class="down">scroll ↓</div>`;
    story.appendChild(scene);
    sceneIO.observe(scene);
    story.appendChild(sec);
    sec.querySelectorAll(".opt").forEach(b => b.onclick = () => choose(i, +b.dataset.k));
    sec.querySelector(".echo button").onclick = () => playEcho(sec.querySelector(".echo"), a.echo);
    sec.querySelector(".glyph").onclick = e => findLetter(i, e.currentTarget);
  });
  paintLetters();
  if (unlocked() >= 5) showReading(false);
  updateChat();
  requestAnimationFrame(layoutThread);
}

function choose(i, k) {
  if (state.choices[i] !== undefined) return;
  state.choices[i] = k; save();
  const sec = document.getElementById(AGES[i].id);
  sec.querySelectorAll(".opt").forEach(b => { b.disabled = true; if (+b.dataset.k === k) b.classList.add("picked"); });
  sec.querySelector(".found").classList.add("show");
  sec.querySelector(".hid")?.classList.remove("hid");
  const next = AGES[i + 1] && document.getElementById(AGES[i + 1].id);
  if (next) {
    next.classList.remove("sealed");
    next.previousElementSibling.classList.remove("locked");
    note(`Act ${AGES[i + 1].num} is open. Keep scrolling.`);
  }
  else showReading(true);
  updateChat();
  setTimeout(layoutThread, 50);
}

function paintLetters() { document.querySelectorAll("#letters span").forEach((s, i) => s.classList.toggle("got", state.letters[i])); }
function findLetter(i, el) {
  state.letters[i] = true; save();
  el.classList.add("got"); paintLetters();
  const n = state.letters.filter(Boolean).length;
  note(n === 5 ? "ΕΛΠΙΣ. Now you know my name." : `You found ${AGES[i].glyph}. ${["Four", "Three", "Two", "One"][n - 1]} still hidden.`);
}
let noteT;
function note(msg) { const t = $("#note"); t.textContent = msg; t.classList.add("show"); clearTimeout(noteT); noteT = setTimeout(() => t.classList.remove("show"), 3400); }

// Echoes are read aloud by the browser, with the words darkening as they're spoken.
let speaking = null;
function playEcho(box, text) {
  const synth = window.speechSynthesis;
  const words = [...box.querySelectorAll(".w")];
  const btn = box.querySelector("button");
  const stop = () => { score.duck(false); synth?.cancel(); document.querySelectorAll(".echo.on").forEach(e => { e.classList.remove("on"); e.querySelector("button").textContent = "listen to the echo"; }); speaking = null; };
  if (speaking === box) return stop();
  stop();
  speaking = box; box.classList.add("on"); btn.textContent = "listening";
  score.duck(true);
  words.forEach(w => w.classList.remove("lit"));
  let idx = 0;
  const lightTo = n => { for (; idx < Math.min(n, words.length); idx++) words[idx].classList.add("lit"); };
  if (!synth) { const iv = setInterval(() => { lightTo(idx + 1); if (idx >= words.length) { clearInterval(iv); stop(); } }, 360); return; }
  const u = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  u.voice = voices.find(v => /Serena|Moira|Kate|Fiona|Samantha|Karen|Google UK English Female/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang)) || null;
  u.rate = 0.84; u.pitch = 0.9;
  let boundary = false;
  u.onboundary = e => { if (e.name && e.name !== "word") return; boundary = true; lightTo(text.slice(0, e.charIndex).split(" ").filter(Boolean).length + 1); };
  const fallback = setInterval(() => { if (!boundary) lightTo(idx + 1); }, 400);
  u.onend = u.onerror = () => { clearInterval(fallback); lightTo(words.length); if (speaking === box) stop(); };
  synth.speak(u);
}

// A red thread runs through every relic, and unwinds as you read.
function layoutThread() {
  const story = $("#story"), svg = $("#thread");
  const r0 = story.getBoundingClientRect();
  const w = r0.width, h = story.scrollHeight;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const pts = [...story.querySelectorAll(".niche .frame")].map(el => {
    const r = el.getBoundingClientRect();
    return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height * 0.55];
  });
  if (!pts.length) return;
  let d = `M ${w * 0.5} 0`, prev = [w * 0.5, 0];
  pts.forEach(([x, y], i) => {
    const sway = (i % 2 ? -1 : 1) * w * 0.26;
    d += ` C ${prev[0] + sway} ${prev[1] + (y - prev[1]) * 0.45}, ${x - sway} ${y - (y - prev[1]) * 0.45}, ${x} ${y}`;
    prev = [x, y];
  });
  d += ` C ${prev[0]} ${prev[1] + 200}, ${w * 0.5} ${h - 200}, ${w * 0.5} ${h}`;
  $("#ghost").setAttribute("d", d);
  const p = $("#threadPath"); p.setAttribute("d", d);
  const len = p.getTotalLength();
  p.style.strokeDasharray = len; p.dataset.len = len;
  drawThread();
}
function drawThread() {
  const p = $("#threadPath"), len = +p.dataset.len || 0;
  const story = $("#story"), r = story.getBoundingClientRect();
  const sealed = story.querySelector(".age.sealed");
  const limit = sealed ? (sealed.getBoundingClientRect().top - r.top) / r.height : 1;
  const prog = Math.max(0, Math.min(limit, (innerHeight * 0.6 - r.top) / r.height));
  p.style.strokeDashoffset = len * (1 - prog);
}
addEventListener("scroll", drawThread, {passive:true});
addEventListener("resize", () => requestAnimationFrame(layoutThread));

// The reading
function ranked() {
  const s = Object.fromEntries(GOD_LIST.map(g => [g, 0]));
  Object.entries(state.choices).forEach(([i, k]) => Object.entries(AGES[i].opts[k].g).forEach(([g, v]) => s[g] += v));
  return GOD_LIST.map((g, i) => [g, s[g], i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0]);
}
let readingStarted = false;
function showReading(scroll) {
  const sec = $("#reading"); sec.classList.add("show");
  const r = ranked(), patron = r[0], ally = r[1], neglected = r[r.length - 1];
  const fig = (role, g, cls) => `<div class="${cls}"><div class="frame"><span>${GODS[g].gk.normalize("NFD").replace(/\p{M}/gu, "")[0]}</span></div><div class="role">${role}</div><h3>${g}</h3><div class="arch-name">${GODS[g].gk}, ${GODS[g].a.toLowerCase()}</div><p>${GODS[g].gift}</p></div>`;
  $("#triad").innerHTML = fig("your patron", patron, "first") + fig("your ally", ally, "") + fig("the one you neglect", neglected, "");
  document.querySelectorAll(".god").forEach(el => el.classList.toggle("you", el.dataset.g === patron));
  if (scroll) setTimeout(() => sec.scrollIntoView({behavior:"smooth"}), 900);
  if (!readingStarted) { readingStarted = true; fetchReading(patron, ally, neglected); }
  setTimeout(layoutThread, 100);
}
async function fetchReading(patron, ally, neglected) {
  const out = $("#oracleText");
  out.innerHTML = `<span class="caret"></span>`;
  const choices = AGES.map((a, i) => { const o = a.opts[state.choices[i]]; return {age:a.label, text:o.t, gods:Object.keys(o.g)}; });
  const fallback = `You chose the way someone ruled by ${patron} would. ${GODS[patron].gift} Watch its shadow, though: ${GODS[patron].shadow.charAt(0).toLowerCase() + GODS[patron].shadow.slice(1)}\n\n${ally} walks beside you. It is the part of you that shows up when ${patron} is tired.\n\nAnd ${neglected} you barely let speak. This week, do one small thing ${neglected} would do.\n\nI stayed in the jar for you. Don't waste me.`;
  try {
    const res = await fetch("/api/reading", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({choices, patron, ally, neglected})});
    if (!res.ok || !res.body) throw 0;
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let txt = "";
    for (;;) { const {done, value} = await reader.read(); if (done) break; txt += value; out.innerHTML = fmt(txt) + `<span class="caret"></span>`; }
    out.innerHTML = fmt(txt);
  } catch { out.innerHTML = fmt(fallback); }
}
function fmt(t) { return t.replace(/[&<>]/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;"}[c])).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/_(.+?)_/g, "<i>$1</i>"); }
$("#copyBtn").onclick = () => {
  const r = ranked();
  const txt = `The Last Thing in the Jar\nPatron: ${r[0]}. Ally: ${r[1]}. Neglected: ${r[r.length - 1]}.\n\n${$("#oracleText").innerText}\n\n${location.href.split("#")[0]}`;
  navigator.clipboard?.writeText(txt).then(() => note("Copied."), () => note("Couldn't copy here."));
};

// Sharing
const shareUrl = () => location.origin + location.pathname;
const tweet = text => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl())}`;
$("#shareCredits").href = tweet("I followed the thread through five ages of Greek myth and found the last thing in the jar.");
$("#shareReading").onclick = () => { const r = ranked(); open(tweet(`My patron god is ${r[0]}, and the one I neglect is ${r[r.length - 1]}. Found out by following a red thread through five ages of Greek myth.`), "_blank", "noopener"); };

// Appendix
$("#gods").innerHTML = GOD_LIST.map(g => `<div class="god" data-g="${g}"><h3>${g}<span>${GODS[g].gk}</span></h3><div class="ep">${GODS[g].a}</div><p><i>Gift.</i> ${GODS[g].gift}</p><p><i>Shadow.</i> ${GODS[g].shadow}</p></div>`).join("");

// Letters to the witness
let history = [];
const chipsFor = () => unlocked() >= 4
  ? ["Was hope a blessing or a curse?", "Why did you stay in the jar?", "How do I hope when I'm tired?"]
  : ["Who are you?", "Which parts are true?", ["Why leave the thumbprint?", "What stayed in the jar?", "Why count out loud?", "Who else helped Theseus?"][Math.min(unlocked(), 3)]];
function updateChat() {
  const known = unlocked() >= 4;
  $("#chatName").textContent = known ? "Elpis" : "The Witness";
  $("#writeBtn").textContent = known ? "Write to Elpis" : "Write to the witness";
  $("#chatSub").textContent = `she remembers ${["one age", "two ages", "three ages", "four ages", "every age"][Math.min(unlocked(), 4)]}`;
  $("#chips").innerHTML = chipsFor().map(c => `<button type="button">${c}</button>`).join("");
  $("#chips").querySelectorAll("button").forEach(b => b.onclick = () => send(b.textContent));
}
function openChat() {
  $("#chat").classList.add("open"); $("#writeBtn").style.display = "none";
  if (!$("#log").children.length) addMsg("w", unlocked() >= 4 ? "You found me. Ask what you like. I have nowhere else to be." : "You can hear me? Most people walk past. Ask about what I saw, but only the ages you have opened. I won't tell you the rest.");
  $("#chatIn").focus();
}
function closeChat() { $("#chat").classList.remove("open"); $("#writeBtn").style.display = ""; }
function addMsg(who, text) { const d = document.createElement("div"); d.className = "msg " + who; d.innerHTML = fmt(text); $("#log").appendChild(d); $("#log").scrollTop = 1e9; return d; }
let busy = false;
async function send(text) {
  text = text.trim(); if (!text || busy) return;
  busy = true; $("#chatIn").value = "";
  addMsg("u", text); history.push({role:"user", content:text});
  const el = addMsg("w", ""); el.innerHTML = `<span class="caret"></span>`;
  let reply = "";
  try {
    const res = await fetch("/api/echo", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({messages:history, unlocked:unlocked(), letters:state.letters.filter(Boolean).length})});
    if (!res.ok || !res.body) { let m = "Her voice is too faint here."; try { m = (await res.json()).error || m; } catch {} throw new Error(m); }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) { const {done, value} = await reader.read(); if (done) break; reply += value; el.innerHTML = fmt(reply) + `<span class="caret"></span>`; $("#log").scrollTop = 1e9; }
    el.innerHTML = fmt(reply);
    history.push({role:"assistant", content:reply});
  } catch (e) {
    el.innerHTML = fmt(e.message && e.message !== "Failed to fetch" ? e.message : "Her voice is too faint here. (The AI isn't connected.)");
    history.pop();
  }
  busy = false;
}
$("#chatForm").onsubmit = e => { e.preventDefault(); send($("#chatIn").value); };
addEventListener("keydown", e => { if (e.key === "Escape") closeChat(); });

$("#reset").onclick = () => {
  if (!confirm("Forget every answer and every letter?")) return;
  state = {choices:{}, letters:[false,false,false,false,false]}; save();
  readingStarted = false; history = []; $("#log").innerHTML = ""; $("#reading").classList.remove("show");
  render(); scrollTo({top:0, behavior:"smooth"});
};

const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("in")), {threshold:.12});
document.querySelectorAll(".fade").forEach(el => io.observe(el));



// ---------- the film ----------

// Each scene drifts slowly when it comes into view, and the score shifts key.
const sceneIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); score.key(e.target.dataset.scene); }
  else if (e.intersectionRatio === 0) e.target.classList.remove("in");
}), {threshold:[0, .45]});
sceneIO.observe($("#readingScene"));

// A quiet score made in the browser: a slow chord of soft tones in a large reverberant room.
const score = (() => {
  const CHORDS = { // Hz
    open:[110, 164.8, 220, 261.6], golden:[130.8, 196, 261.6, 329.6], silver:[110, 164.8, 220, 261.6],
    bronze:[98, 146.8, 196, 233.1], heroic:[87.3, 130.8, 174.6, 220], iron:[110, 164.8, 220, 277.2], parnassus:[130.8, 196, 246.9, 329.6]
  };
  let ctx, master, voices = [], on = false, current = "open", ducked = false;
  const level = () => ducked ? 0.018 : 0.06;
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const len = ctx.sampleRate * 4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100;
    const wet = ctx.createGain(); wet.gain.value = .8; const dry = ctx.createGain(); dry.gain.value = .35;
    lp.connect(verb).connect(wet).connect(master); lp.connect(dry).connect(master); master.connect(ctx.destination);
    CHORDS.open.forEach((f, i) => {
      const g = ctx.createGain(); g.gain.value = .16;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = .04 + i * .023; lg.gain.value = .1; lfo.connect(lg).connect(g.gain); lfo.start();
      const oscs = [0, 4].map(det => { const o = ctx.createOscillator(); o.type = i ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det; o.connect(g); o.start(); return o; });
      g.connect(lp); voices.push(oscs);
    });
  }
  return {
    get on() { return on; },
    start() { if (!ctx) build(); ctx.resume(); on = true; master.gain.setTargetAtTime(level(), ctx.currentTime, 2.5); this.key(current); },
    stop() { if (!ctx) return; on = false; master.gain.setTargetAtTime(0, ctx.currentTime, .8); },
    key(name) { if (!CHORDS[name]) return; current = name; if (!ctx) return; CHORDS[name].forEach((f, i) => voices[i]?.forEach(o => o.frequency.setTargetAtTime(f, ctx.currentTime, 2.2))); },
    duck(d) { ducked = d; if (ctx && on) master.gain.setTargetAtTime(level(), ctx.currentTime, .6); }
  };
})();
function paintSound() { $("#soundBtn").textContent = score.on ? "sound on" : "sound off"; }
$("#soundBtn").onclick = () => { score.on ? score.stop() : score.start(); paintSound(); };

// Opening titles
(() => {
  const intro = $("#intro"), line = $("#introLine"), title = $("#introTitle");
  if (unlocked()) $("#startBtn").textContent = "Continue, with sound";
  let timers = [], done = false;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    intro.classList.add("gone");
    document.body.style.overflow = "";
    setTimeout(() => { intro.remove(); layoutThread(); }, 2300);
  };
  document.body.style.overflow = "hidden";
  const roll = sound => {
    if (sound) { score.start(); paintSound(); }
    intro.classList.add("rolling");
    if (unlocked()) { later(finish, 1200); return; }
    let t = 1800;
    TITLES.forEach(text => {
      later(() => { line.textContent = text; line.classList.add("on"); }, t);
      later(() => line.classList.remove("on"), t + 3600);
      t += 5000;
    });
    later(() => title.classList.add("on"), t);
    later(finish, t + 4600);
  };
  $("#startBtn").onclick = () => roll(true);
  $("#startQuiet").onclick = () => roll(false);
  $("#skip").onclick = finish;
  addEventListener("keydown", e => { if (e.key === "Escape" && !done && intro.classList.contains("rolling")) finish(); });
})();

render();
addEventListener("load", layoutThread);
document.fonts?.ready.then(layoutThread);
