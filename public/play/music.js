// Orpheus's lyre: plucked strings made in code (Karplus-Strong), a rhythm game for the songs he
// performs, and a lullaby you hold down to keep playing.
const $ = s => document.querySelector(s);

// The old Greek Dorian mode, descending from E: E D C B A G F E. Here as frequencies from low to high.
const SCALE = [164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
let ctx = null, out = null, cache = new Map();

export function lyreInit(audioCtx, master) {
  ctx = audioCtx;
  out = ctx.createGain(); out.gain.value = .55;
  const room = ctx.createConvolver(), len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  room.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .32;
  out.connect(master); out.connect(room).connect(wet).connect(master);
}
function string(freq) {
  if (cache.has(freq)) return cache.get(freq);
  const sr = ctx.sampleRate, dur = 2.6, buf = ctx.createBuffer(1, sr * dur, sr), d = buf.getChannelData(0);
  const N = Math.round(sr / freq), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (.6 + .4 * Math.sin(i / N * Math.PI)); // a gut string, plucked near the middle
  let p = 0, prev = 0;
  for (let i = 0; i < d.length; i++) {
    const nxt = (p + 1) % N, v = .5 * (ring[p] + ring[nxt]) * .996;
    ring[p] = v; d[i] = v * .5 + prev * .5; prev = v; p = nxt;
  }
  cache.set(freq, buf); return buf;
}
export function pluck(step, vel = 1, when = 0) {
  if (!ctx) return;
  const f = SCALE[Math.max(0, Math.min(SCALE.length - 1, step))];
  const s = ctx.createBufferSource(); s.buffer = string(f);
  const g = ctx.createGain(); g.gain.value = .5 * vel;
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (pan) { pan.pan.value = (step - 5) / 12; s.connect(g).connect(pan).connect(out); } else s.connect(g).connect(out);
  s.start(ctx.currentTime + when);
}
function thud() {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 90; o.type = "triangle";
  g.gain.setValueAtTime(.18, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
  o.connect(g).connect(out); o.start(); o.stop(ctx.currentTime + .2);
}

/* ---------- songs ----------
   Each note is [beat, scale step]. The melodies are new, written in the Dorian mode on a seven-string lyre. */
export const SONGS = {
  // For Charon: slow, plain, like a work song on the water.
  ferry: {bpm: 76, notes: [[0, 4], [1, 5], [2, 7], [3, 5], [4, 4], [5, 2], [6, 4], [8, 7], [9, 8], [10, 7], [11, 5], [12, 4], [14, 2], [15, 1], [16, 2], [18, 4]]},
  // For Hades and Persephone: the whole case, faster, with runs.
  plea: {bpm: 92, notes: [[0, 2], [1, 4], [2, 5], [2.5, 7], [3, 8], [4, 7], [5, 5], [6, 4], [7, 5], [8, 9], [9, 8], [9.5, 7], [10, 5], [11, 7], [12, 4], [13, 2],
    [14, 4], [15, 5], [15.5, 7], [16, 8], [17, 10], [18, 9], [18.5, 8], [19, 7], [20, 5], [21, 4], [22, 2], [23, 1], [24, 2], [26, 4]]}
};

/* ---------- the rhythm game ----------
   Notes slide in from the right toward the ring; tap, click or press Space as each one reaches it. */
export function perform(song, {title = "", sub = "", need = .7} = {}) {
  return new Promise(res => {
    const box = $("#perform"), lane = box.querySelector(".lane"), meter = box.querySelector(".meter i");
    box.querySelector("h3").textContent = title; box.querySelector(".psub").textContent = sub;
    lane.querySelectorAll(".note").forEach(n => n.remove());
    box.classList.add("on");
    const spb = 60 / song.bpm, lead = 2.4, travel = 2.4;  // seconds of warning before the first note; seconds a note takes to cross
    const t0 = performance.now() / 1000 + lead;
    const notes = song.notes.map(([b, step]) => {
      const el = document.createElement("i"); el.className = "note"; el.style.setProperty("--h", (step / 10 * 70 + 10) + "%"); lane.appendChild(el);
      return {t: t0 + b * spb, step, el, done: false};
    });
    let hits = 0, judged = 0, raf;
    const WINDOW = .17;
    const judge = () => {
      const now = performance.now() / 1000;
      const n = notes.find(n => !n.done && Math.abs(n.t - now) < WINDOW);
      if (n) { n.done = true; judged++; hits++; n.el.classList.add("hit"); pluck(n.step, 1); flash("good"); }
      else { thud(); flash("miss"); }
      meter.style.width = (hits / notes.length * 100) + "%";
    };
    const flash = k => { box.classList.remove("good", "miss"); void box.offsetWidth; box.classList.add(k); };
    const key = e => { if (e.code === "Space" || e.code === "KeyE" || e.code === "Enter") { e.preventDefault(); judge(); } };
    const tap = e => { if (!e.target.closest("button")) judge(); };
    addEventListener("keydown", key); box.addEventListener("pointerdown", tap);
    (function frame() {
      const now = performance.now() / 1000;
      for (const n of notes) {
        const x = (n.t - now) / travel; // 1 = right edge, 0 = the ring
        n.el.style.left = (10 + x * 85) + "%";
        n.el.style.opacity = x > 1.05 ? 0 : 1;
        if (!n.done && now - n.t > WINDOW) { n.done = true; judged++; n.el.classList.add("missed"); }
      }
      if (judged < notes.length) { raf = requestAnimationFrame(frame); return; }
      removeEventListener("keydown", key); box.removeEventListener("pointerdown", tap);
      const score = hits / notes.length;
      setTimeout(() => { box.classList.remove("on"); res({score, passed: score >= need}); }, 700);
    })();
  });
}

/* ---------- the lullaby: hold to keep playing ---------- */
const LULLABY = [4, 7, 9, 7, 5, 7, 4, 2];
export function lullaby() {
  let i = 0, next = 0;
  return {
    tick(now, playing) { if (!playing || now < next) return; pluck(LULLABY[i % LULLABY.length], .75); if (i % 2 === 0) pluck(LULLABY[i % LULLABY.length] - 4, .35); i++; next = now + 430; }
  };
}
