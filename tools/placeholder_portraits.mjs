// Placeholder portraits for testing ?portraits=placeholder before the real paintings exist: a dark card per character and
// expression (a lit bust, a face that changes with the expression, the name), drawn in headless Chrome, saved as
// public/play/portraits/_placeholder/<who>-<expression>.jpg. Not art, never committed (.gitignore), never served off
// localhost (src/worker.js).
//   node tools/placeholder_portraits.mjs [who ...]      (default: the Chapter I speakers)
//   node tools/placeholder_portraits.mjs --clean        (delete them all)
import fs from "node:fs";
import path from "node:path";
import { launch } from "./cdp.mjs";

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "../public/play/portraits/_placeholder");
if (process.argv.includes("--clean")) { fs.rmSync(OUT, {recursive: true, force: true}); console.log("removed", OUT); process.exit(0); }
const WHO = process.argv.slice(2).length ? process.argv.slice(2) : ["hermes", "elpenor", "theseus", "pirithous", "charon", "mikon"];
const EXPR = ["neutral", "amused", "sad", "stern", "surprised", "worried"];
// each character's light: [background glow, rim light, robe]
const TINT = {hermes: ["#5a3f16", "#e8c27a", "#3a2c1c"], elpenor: ["#16364a", "#9cc6d8", "#1c2a34"], theseus: ["#4a3416", "#d8a860", "#33261a"],
  pirithous: ["#4a1620", "#e09a9a", "#341a1e"], charon: ["#1e2a26", "#a8c0b4", "#161c1a"], mikon: ["#3e3424", "#f0dcb4", "#2e281e"],
  orpheus: ["#2a2246", "#c4b4ec", "#221c34"], eurydice: ["#3a2a34", "#f0c8d8", "#2c2028"], hades: ["#200e0e", "#c06a4a", "#140a0a"],
  persephone: ["#1e3020", "#c8e0a8", "#182418"], sisyphus: ["#2e2a22", "#c8b89a", "#222018"]};

const b = await launch({width: 640, height: 800, log: true});
try {
  const cards = await b.eval(`(() => {
    const out = {}, W = 640, H = 800;
    for (const who of ${JSON.stringify(WHO)}) for (const ex of ${JSON.stringify(EXPR)}) {
      const [bg, rim, robe] = ${JSON.stringify(TINT)}[who] || ["#2a2a2a", "#d8d0c0", "#1e1e1e"];
      const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
      let gr = g.createRadialGradient(W * .5, H * .4, 20, W * .5, H * .45, H * .7); gr.addColorStop(0, bg); gr.addColorStop(1, "#060508");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // shoulders and robe
      g.fillStyle = robe; g.beginPath(); g.moveTo(W * .1, H); g.bezierCurveTo(W * .12, H * .7, W * .3, H * .62, W * .5, H * .62); g.bezierCurveTo(W * .7, H * .62, W * .88, H * .7, W * .9, H); g.fill();
      g.strokeStyle = rim; g.globalAlpha = .55; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
      // neck and head, lit from one side
      g.fillStyle = "#2a2220"; g.fillRect(W * .44, H * .5, W * .12, H * .14);
      gr = g.createRadialGradient(W * .43, H * .36, 10, W * .5, H * .4, W * .22); gr.addColorStop(0, "#8a7262"); gr.addColorStop(1, "#2a2220");
      g.fillStyle = gr; g.beginPath(); g.ellipse(W * .5, H * .4, W * .15, H * .14, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = rim; g.globalAlpha = .7; g.lineWidth = 2.5; g.beginPath(); g.ellipse(W * .5, H * .4, W * .15, H * .14, 0, -1.2, 1.3); g.stroke(); g.globalAlpha = 1;
      // the face: brows, eyes, mouth, by expression
      const ey = H * .385, ex1 = W * .45, ex2 = W * .55;
      const brow = {neutral: [0, 0], amused: [-4, 4], sad: [6, -8], stern: [6, 8], surprised: [-14, 0], worried: [-2, -10]}[ex];
      g.strokeStyle = "#140e0c"; g.lineWidth = 4; g.lineCap = "round";
      for (const [x, s] of [[ex1, -1], [ex2, 1]]) { g.beginPath(); g.moveTo(x - 18, ey - 26 + brow[0] - s * brow[1] * .5); g.lineTo(x + 18, ey - 26 + brow[0] + s * brow[1] * .5); g.stroke();
        g.fillStyle = "#140e0c"; g.beginPath(); g.ellipse(x, ey, 7, ex === "surprised" ? 9 : ex === "amused" ? 4 : 6, 0, 0, Math.PI * 2); g.fill(); }
      const my = H * .465, mw = 30; g.beginPath();
      if (ex === "surprised") g.ellipse(W * .5, my, 10, 14, 0, 0, Math.PI * 2);
      else { const bend = {neutral: 0, amused: 14, sad: -10, stern: -3, worried: -6}[ex]; g.moveTo(W * .5 - mw, my - bend * .3); g.quadraticCurveTo(W * .5, my + bend, W * .5 + mw, my - bend * .3); }
      g.stroke();
      // the name and the expression, so a test shows which card is up
      g.fillStyle = "rgba(242,232,213,.9)"; g.textAlign = "center"; g.font = "italic 44px Georgia, serif"; g.fillText(who[0].toUpperCase() + who.slice(1), W / 2, H * .86);
      g.fillStyle = "rgba(214,178,94,.85)"; g.font = "18px Georgia, serif"; g.fillText(ex.toUpperCase().split("").join(" ") + "  ·  P L A C E H O L D E R", W / 2, H * .91);
      out[who + "-" + ex] = c.toDataURL("image/jpeg", .82).split(",")[1];
    }
    return out;
  })()`);
  fs.mkdirSync(OUT, {recursive: true});
  for (const [k, v] of Object.entries(cards)) fs.writeFileSync(path.join(OUT, k + ".jpg"), Buffer.from(v, "base64"));
  console.log(`wrote ${Object.keys(cards).length} placeholder portraits to ${OUT}`);
} finally { await b.close(); }
