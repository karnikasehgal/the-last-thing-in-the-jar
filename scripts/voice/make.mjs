// Records every spoken line in public/film.js to public/audio/<id>.mp3.
// 1. In one terminal:  cd scripts/voice && npx wrangler dev --port 8799
// 2. In another:       node scripts/voice/make.mjs          (add --force to re-record everything)
// Lines that already have audio are skipped, so after editing a line, delete its mp3 and run again.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const { CAST, FILM } = new Function(readFileSync(join(root, "public/film.js"), "utf8") + ";return {CAST, FILM};")();
const out = join(root, "public/audio");
mkdirSync(out, { recursive: true });
const force = process.argv.includes("--force");

// Every spoken line in the film, in running order, voiced by whoever says it.
const shots = [...FILM.cold];
for (const act of FILM.acts) {
  shots.push(...act.shots);
  for (const o of act.opts) shots.push(...[o.reply].flat());
  shots.push(...(act.after || []));
}
const jobs = shots.filter((s) => s.id && s.line).map((s) => ({ id: s.id, text: s.line, voice: CAST[s.who]?.voice || "apollo" }));

let made = 0;
for (const j of jobs) {
  const file = join(out, `${j.id}.mp3`);
  if (existsSync(file) && !force) continue;
  const res = await fetch("http://localhost:8799", {
    method: "POST",
    body: JSON.stringify({ model: "@cf/deepgram/aura-2-en", input: { text: j.text, speaker: j.voice } }),
  });
  if (!res.ok) {
    const why = await res.text();
    console.error(`✗ ${j.id}: ${res.status} ${why.slice(0, 160)}`);
    if (/allocation|neurons|4006/.test(why)) { console.error("Daily free allowance used up. Run again tomorrow; finished lines are kept."); break; }
    continue;
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  made++;
  console.log(`✓ ${j.id} (${j.voice})`);
}
console.log(`${made} recorded, ${jobs.length - made} already there.`);
