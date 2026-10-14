/* The start screen: a plan of the House of Hades, inked in ivory and gold on black.
   Every chapter is a room sealed in red wax, and a red thread runs through them in order. */

export const INK = {paper: "#0c0a0b", ivory: "rgba(239,230,210,.86)", faint: "rgba(239,230,210,.32)", gold: "#c9a45c", red: "#a3201c", water: "#06090d"};

/* where each chapter happens on the plan, and what the room looks like (viewBox 1600 x 1000) */
const ROOMS = {
  1: {x: 760, y: 905, place: "the near bank"},
  2: {x: 800, y: 330, place: "the throne hall"},
  3: {x: 500, y: 345, place: "the Queen's chamber"},
  4: {x: 285, y: 880, place: "the pit"},
  5: {x: 800, y: 622, place: "the gate"},
  6: {x: 1335, y: 875, place: "the grove"},
  7: {x: 190, y: 250, place: "the hill"},
  8: {x: 1100, y: 345, place: "the garden"}
};

const dots = (x0, y0, x1, y1, n, r = 3.6) => { let s = ""; for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0; s += `<circle cx="${x0 + (x1 - x0) * t}" cy="${y0 + (y1 - y0) * t}" r="${r}"/>`; } return s; };
const wall = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="w"/><rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" class="t"/>`;
const tower = (x, y, r = 16) => `<circle cx="${x}" cy="${y}" r="${r}" class="w f"/><circle cx="${x}" cy="${y}" r="${r - 6}" class="t"/>`;
/* a smooth thread through points (Catmull-Rom), sagging a little between pins */
function thread(P) {
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2, sag = 18;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6 + sag} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6 + sag} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function plan() {
  let s = "";
  /* the far shore: asphodel, stippled */
  let st = ""; for (let i = 0; i < 520; i++) { const x = (i * 397) % 1600, y = 60 + ((i * 211) % 620); if (x > 340 && x < 1260 && y > 180 && y < 640) continue; st += `<circle cx="${x + (i % 7) * 3}" cy="${y}" r="${.9 + (i % 3) * .5}"/>`; }
  s += `<g class="stip">${st}</g>`;
  /* the Styx: black water, ivory hatching */
  s += `<path class="water" d="M0,700 C260,680 520,716 800,694 C1080,672 1340,712 1600,690 L1600,792 C1330,812 1060,776 800,800 C540,822 270,786 0,806 Z"/>`;
  let h = ""; for (let k = 0; k < 9; k++) { const y = 712 + k * 10; h += `<path d="M${20 + (k % 3) * 60},${y} ${Array.from({length: 26}, (_, j) => `q15,${j % 2 ? 4 : -4} 30,0`).join(" ")}"/>`; for (let j = 0; j < 3; j++) h += `<path d="M${300 + j * 480 + k * 13},${y} q22,-5 44,0"/>`; }
  s += `<g class="hatch">${h}</g>`;
  s += `<text class="lbl it big" x="420" y="760" letter-spacing="14">the Styx</text><text class="lbl it" x="1210" y="770" letter-spacing="6">the river of oaths</text>`;
  /* the ferry crossing */
  s += `<path class="t dash" d="M760,800 C770,770 790,730 800,690"/><ellipse cx="786" cy="748" rx="9" ry="22" class="w f" transform="rotate(14 786 748)"/>`;
  /* the near bank: the arcade, the dock, the temple and the dog's cave (chapter I) */
  s += wall(560, 860, 180, 60) + `<g class="col">${dots(572, 852, 728, 852, 10)}</g>`;
  s += `<rect x="752" y="800" width="16" height="70" class="w"/>`;
  s += wall(890, 860, 70, 70) + `<g class="col">${dots(900, 870, 950, 870, 4)}${dots(900, 920, 950, 920, 4)}</g>`;
  s += `<path class="w" d="M985,905 c10,-30 52,-34 66,-6 c14,26 -14,44 -40,40 c-20,-3 -32,-14 -26,-34z"/><path class="t" d="M996,906 c8,-18 34,-20 42,-4"/>`;
  s += `<text class="lbl it sm" x="650" y="952">the arcade</text><text class="lbl it sm" x="925" y="958">the old temple</text><text class="lbl it sm" x="1030" y="862">the cave</text>`;
  /* the pit (chapter IV): a trench dug a cubit each way, rings of blood */
  s += `<rect x="255" y="850" width="60" height="60" class="w"/><rect x="267" y="862" width="36" height="36" class="t"/><circle cx="285" cy="880" r="10" class="blood"/>`;
  for (let i = 0; i < 6; i++) s += `<path class="t" d="M${210 + i * 26},${938 + (i % 2) * 6} l6,-10 l6,10"/>`;
  /* the grove (chapter VI): dark trees and one gold one */
  let tr = ""; for (let i = 0; i < 26; i++) { const a = i * 2.39, r = 14 + Math.sqrt(i) * 17; tr += `<circle cx="${1335 + Math.cos(a) * r * 1.5}" cy="${875 + Math.sin(a) * r * .8}" r="${7 + (i % 3) * 2}" class="tree"/>`; }
  s += `<g>${tr}</g><circle cx="1335" cy="875" r="11" class="goldtree"/>`;
  /* the house: outer wall, towers, the gate (chapter V) */
  s += wall(360, 190, 880, 432).replace('height="432" class="w"', 'height="432" class="w gap"');
  s += tower(360, 190, 20) + tower(1240, 190, 20) + tower(360, 622, 20) + tower(1240, 622, 20) + tower(760, 622, 15) + tower(840, 622, 15);
  s += `<rect x="772" y="612" width="56" height="20" class="paper"/>`;
  s += `<g class="col">${dots(700, 480, 700, 600, 6)}${dots(900, 480, 900, 600, 6)}</g>`;
  s += `<text class="lbl sc" x="800" y="586" letter-spacing="5">the forecourt</text>`;
  /* the throne hall (chapter II) with an apse and two thrones */
  s += wall(650, 240, 300, 220) + `<path class="w" d="M720,240 a80,58 0 0 1 160,0"/>`;
  s += `<g class="col">${dots(684, 262, 684, 440, 7)}${dots(916, 262, 916, 440, 7)}</g><rect x="776" y="204" width="18" height="18" class="w f"/><rect x="806" y="204" width="18" height="18" class="w f"/>`;
  s += `<path class="t" d="M800,460 L800,612"/>`;
  /* the Queen's chamber (chapter III): a coffered dome */
  s += wall(410, 255, 180, 180) + `<circle cx="500" cy="345" r="62" class="w"/><circle cx="500" cy="345" r="42" class="t"/>`;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; s += `<path class="t" d="M${500 + Math.cos(a) * 42},${345 + Math.sin(a) * 42} L${500 + Math.cos(a) * 62},${345 + Math.sin(a) * 62}"/>`; }
  s += `<path class="t" d="M590,345 L650,345"/>`;
  /* the garden (chapter VIII): pomegranates in rows around a long pool */
  s += wall(1010, 255, 180, 180) + `<rect x="1080" y="280" width="40" height="130" class="water w"/>`;
  let pg = ""; for (const x of [1036, 1058, 1142, 1164]) for (let y = 282; y <= 408; y += 21) pg += `<circle cx="${x}" cy="${y}" r="6.5" class="tree"/><circle cx="${x + 2}" cy="${y + 1}" r="1.8" class="pom"/>`;
  s += pg + `<path class="t" d="M950,345 L1010,345"/>`;
  /* the hill (chapter VII): contour rings, a zigzag path and the stone */
  for (let i = 0; i < 6; i++) s += `<ellipse cx="190" cy="250" rx="${150 - i * 24}" ry="${92 - i * 15}" class="t" transform="rotate(-8 190 250)"/>`;
  s += `<path class="w dash" d="M70,330 L130,300 L95,276 L160,258 L130,236 L192,228"/><circle cx="196" cy="222" r="9" class="w f"/>`;
  /* the lake of memory and the white cypress, as in the gold tablets */
  s += `<ellipse cx="1420" cy="230" rx="96" ry="44" class="water w"/><text class="lbl it sm" x="1420" y="300">the lake of Memory</text>`;
  s += `<path class="w" d="M1310,170 l8,-38 l8,38 z"/><text class="lbl it sm" x="1318" y="190">white cypress</text>`;
  s += `<text class="lbl it" x="1430" y="560" letter-spacing="4">Asphodel</text><text class="lbl it" x="160" y="560" letter-spacing="4">Asphodel</text>`;
  /* compass and scale */
  s += `<g transform="translate(1500,90)" class="compass"><circle r="34" class="t"/><path class="w f" d="M0,-46 L7,0 L0,8 L-7,0 Z"/><path class="t" d="M0,46 L7,0 M0,46 L-7,0 M-46,0 L46,0"/><text class="lbl sc" y="-54">the dead</text><text class="lbl sc" y="66">the living</text></g>`;
  s += `<g transform="translate(1340,965)"><path class="w" d="M0,0 h180 M0,-6 v12 M60,-4 v8 M120,-4 v8 M180,-6 v12"/><text class="lbl it sm" x="90" y="-12">one stadion</text></g>`;
  return s;
}

/* svg host: an <svg> that fills its box; chapters: the CHAPTERS table; pick(n) when a seal is chosen */
export function drawPalace(host, chapters, pick, played = []) {
  const live = chapters.filter(c => !c.soon).map(c => c.n), last = Math.max(...live);
  const order = chapters.map(c => [ROOMS[c.n].x, ROOMS[c.n].y]);
  const bright = thread(order.slice(0, last)), rest = thread(order.slice(last - 1));
  const seals = chapters.map(c => {
    const R = ROOMS[c.n], off = c.soon ? " soon" : "", done = played.includes(c.n);
    return `<g class="seal${off}" data-n="${c.n}" tabindex="${c.soon ? -1 : 0}" role="button" aria-label="Chapter ${c.roman}, ${c.title}, ${c.soon ? "coming" : "as " + c.who}" transform="translate(${R.x},${R.y})">
      ${c.soon ? "" : `<circle r="70" class="glow"/>`}<circle r="40" class="ring"/>
      <path class="wax" d="M0,-25 C10,-27 20,-19 24,-9 C29,2 25,15 15,21 C6,28 -8,27 -17,20 C-26,13 -28,-1 -23,-11 C-18,-21 -10,-24 0,-25Z"/>
      <circle r="17" class="wax-in"/><text class="num" y="6">${c.roman}</text>
      <text class="ttl" y="50">${c.title}</text><text class="who" y="70">${c.soon ? "sealed, for now" : (done ? "played · " : "") + R.place}</text></g>`;
  }).join("");
  host.setAttribute("viewBox", "0 0 1600 1000");
  host.setAttribute("preserveAspectRatio", "xMidYMid meet");
  host.innerHTML = `<defs>
      <filter id="inkwob"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .93  0 0 0 0 .88  0 0 0 0 .8  0 0 0 .07 0"/></filter>
      <radialGradient id="candle"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".42"/><stop offset=".45" stop-color="#d98a3a" stop-opacity=".14"/><stop offset="1" stop-color="#d98a3a" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx=".5" cy=".46" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    </defs>
    <rect width="1600" height="1000" class="paper"/>
    <g filter="url(#inkwob)" class="plan">${plan()}</g>
    <path d="${rest}" class="thread later"/><path d="${bright}" class="thread now" pathLength="1"/>
    ${seals}
    <rect width="1600" height="1000" filter="url(#grain)" pointer-events="none"/>
    <rect width="1600" height="1000" fill="url(#vig)" pointer-events="none"/>
    <rect x="14" y="14" width="1572" height="972" class="frame"/><rect x="24" y="24" width="1552" height="952" class="frame thin"/>`;
  const choose = g => { if (g && !g.classList.contains("soon")) pick(+g.dataset.n); };
  host.onclick = e => choose(e.target.closest(".seal"));
  host.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(e.target.closest(".seal")); } };
}
export function markPalace(host, n) { host.querySelectorAll(".seal").forEach(g => g.classList.toggle("sel", +g.dataset.n === n)); }

/* the in-game maps share the ink: black paper, grain, a frame */
export function inkPaper(g, W, H) {
  g.fillStyle = INK.paper; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(239,230,210,${Math.random() * .045})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  const v = g.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.6)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
export function inkFrame(g, W, H) { g.strokeStyle = INK.gold; g.lineWidth = 3; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 1; g.strokeRect(16, 16, W - 32, H - 32); }
/* a numbered red seal, matching the steps beside the map */
export function inkSeal(g, x, y, n) {
  g.save(); const glow = g.createRadialGradient(x, y, 0, x, y, 46); glow.addColorStop(0, "rgba(255,200,120,.3)"); glow.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = glow; g.beginPath(); g.arc(x, y, 46, 0, 7); g.fill();
  g.fillStyle = INK.red; g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2, r = 17 + (i % 2 ? 1.6 : -.6); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 12, 0, 7); g.stroke();
  g.fillStyle = "#f3e7cf"; g.font = `20px "IM Fell English SC", Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(n, x, y + 1); g.restore();
}
