// Records every spoken line in public/film.js to public/audio/<id>.mp3.
// 1. In one terminal:  cd scripts/voice && npx wrangler dev --port 8799
// 2. In another:       node scripts/voice/make.mjs          (add --force to re-record everything)
// Lines that already have audio are skipped, so after editing a line, delete its mp3 and run again.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const { ACTS } = new Function(readFileSync(join(root, "public/film.js"), "utf8") + ";return {ACTS};")();
const out = join(root, "public/audio");
mkdirSync(out, { recursive: true });
const force = process.argv.includes("--force");

const jobs = [];
for (const act of ACTS) {
  const lines = [...act.shots, ...act.opts.map((o) => o.reply), ...act.after];
  for (const l of lines) jobs.push({ id: l.id, text: l.line, voice: act.who.voice });
}

let made = 0;
for (const j of jobs) {
  const file = join(out, `${j.id}.mp3`);
  if (existsSync(file) && !force) continue;
  const res = await fetch("http://localhost:8799", {
    method: "POST",
    body: JSON.stringify({ model: "@cf/deepgram/aura-2-en", input: { text: j.text, speaker: j.voice } }),
  });
  if (!res.ok) { console.error(`✗ ${j.id}: ${res.status} ${await res.text()}`); continue; }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  made++;
  console.log(`✓ ${j.id} (${j.voice})`);
}
console.log(`${made} recorded, ${jobs.length - made} already there.`);
