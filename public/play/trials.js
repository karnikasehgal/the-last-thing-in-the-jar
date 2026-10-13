// Small trials for the things worth finding: you have to earn each one.
//   timing   - a needle swings across a bar; stop it inside the gold, a few times running
//   sequence - signs (or lyre notes) light up in order; repeat the order
//   riddle   - a question, three answers; get it wrong and you have to wait before trying again
import { pluck } from "./music.js";
const $ = s => document.querySelector(s);

export function trial(spec) {
  return new Promise(res => {
    const box = $("#trial"), body = box.querySelector(".tbody");
    box.querySelector("h3").textContent = spec.title; box.querySelector(".thint").textContent = spec.hint;
    body.innerHTML = ""; box.classList.add("on"); box.dataset.kind = spec.kind;
    let cleanup = () => {};
    const done = ok => { cleanup(); setTimeout(() => { box.classList.remove("on"); res(ok); }, ok ? 500 : 900); box.classList.toggle("won", ok); box.classList.toggle("lost", !ok); setTimeout(() => box.classList.remove("won", "lost"), 1200); };
    $("#trialQuit").onclick = () => done(false);

    if (spec.kind === "timing") {
      const need = spec.hits || 3, speed = spec.speed || 1;
      body.innerHTML = `<div class="tbar"><i class="win"></i><b class="needle"></b></div><div class="tcount"></div>`;
      const win = body.querySelector(".win"), needle = body.querySelector(".needle"), count = body.querySelector(".tcount");
      let hits = 0, misses = 0, t = 0, w = spec.width || .16, at = Math.random() * (1 - w), raf, last = performance.now();
      const place = () => { at = .05 + Math.random() * (.9 - w); win.style.left = at * 100 + "%"; win.style.width = w * 100 + "%"; };
      const paint = () => count.textContent = `${hits} of ${need}` + (misses ? ` · ${2 - misses < 0 ? 0 : 2 - misses} slips left` : "");
      place(); paint();
      const press = () => {
        const x = (Math.sin(t) + 1) / 2;
        if (x >= at && x <= at + w) { hits++; pluck(4 + hits, .8); w *= .82; place(); if (hits >= need) return done(true); }
        else { misses++; box.classList.add("shake"); setTimeout(() => box.classList.remove("shake"), 300); if (misses > 2) return done(false); }
        paint();
      };
      (function frame(now) { t += (now - last) / 1000 * 2.4 * speed * (1 + hits * .18); last = now; needle.style.left = ((Math.sin(t) + 1) / 2 * 100) + "%"; raf = requestAnimationFrame(frame); })(last);
      const key = e => { if (["Space", "KeyE", "Enter"].includes(e.code)) { e.preventDefault(); press(); } };
      const tap = e => { if (!e.target.closest("button")) press(); };
      addEventListener("keydown", key); box.addEventListener("pointerdown", tap);
      cleanup = () => { cancelAnimationFrame(raf); removeEventListener("keydown", key); box.removeEventListener("pointerdown", tap); };
    }

    if (spec.kind === "sequence") {
      const signs = spec.signs || ["Α", "Β", "Γ", "Δ", "Ε"], len = spec.length || 4;
      const order = Array.from({length: len}, () => Math.random() * signs.length | 0);
      body.innerHTML = `<div class="tsigns">${signs.map((g, i) => `<button data-i="${i}">${g}</button>`).join("")}</div><div class="tcount">watch</div>`;
      const btns = [...body.querySelectorAll("button")], count = body.querySelector(".tcount");
      let pos = 0, listening = false, timers = [];
      const flash = i => { btns[i].classList.add("lit"); pluck(2 + i * 2, .8); timers.push(setTimeout(() => btns[i].classList.remove("lit"), 380)); };
      order.forEach((i, k) => timers.push(setTimeout(() => flash(i), 700 + k * 650)));
      timers.push(setTimeout(() => { listening = true; count.textContent = "your turn"; }, 700 + len * 650));
      btns.forEach(b => b.onclick = () => {
        if (!listening) return;
        const i = +b.dataset.i; flash(i);
        if (i !== order[pos]) { listening = false; count.textContent = "wrong sign"; return done(false); }
        pos++; count.textContent = `${pos} of ${len}`;
        if (pos >= len) { listening = false; done(true); }
      });
      const key = e => { const n = +e.key; if (n >= 1 && n <= signs.length) btns[n - 1].click(); };
      addEventListener("keydown", key);
      cleanup = () => { timers.forEach(clearTimeout); removeEventListener("keydown", key); };
    }

    if (spec.kind === "riddle") {
      const opts = spec.answers.map((a, i) => ({a, i})).sort(() => Math.random() - .5);
      body.innerHTML = `<p class="tq">${spec.question}</p><div class="tans">${opts.map(o => `<button data-i="${o.i}">${o.a}</button>`).join("")}</div>`;
      body.querySelectorAll("button").forEach(b => b.onclick = () => done(+b.dataset.i === 0));
      const key = e => { const n = +e.key; if (n >= 1 && n <= opts.length) body.querySelectorAll("button")[n - 1].click(); };
      addEventListener("keydown", key);
      cleanup = () => removeEventListener("keydown", key);
    }
  });
}
