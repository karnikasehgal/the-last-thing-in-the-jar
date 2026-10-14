// Records the game's spoken lines with ElevenLabs, acted: each line carries a direction ("dry, deadpan", "panicking")
// that becomes an audio tag, and each character has their own voice.
//   node scripts/voice/eleven.mjs <lines.json> [--force] [--out dir] [--only id,id]
// lines.json: [{id, who, text, how}]. Writes <out>/<id>.m4a (default public/play/voice). Lines already recorded are
// skipped unless --force. The key is read from .dev.vars (ELEVENLABS_API_KEY=...), which never leaves this machine.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const key = (readFileSync(join(root, ".dev.vars"), "utf8").match(/^ELEVENLABS_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!key) throw new Error("No ELEVENLABS_API_KEY in .dev.vars");
const lines = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = arg("--out", join(root, "public/play/voice")), only = arg("--only")?.split(","), force = process.argv.includes("--force");
mkdirSync(out, {recursive: true});

// the cast, from the premade voices every account has
export const VOICES = {
  mikon: "iP95p4xoKVk53GoZ742B",    // Chris: charming, down to earth
  hermes: "N2lVS1w4EtoT3dr4eOWO",   // Callum: husky trickster
  elpenor: "bIHbv24MWmeRgasZH58o",  // Will: relaxed, young
  lykon: "TX3LPaxmHKxFdv7VOQHJ",    // Liam: young, quick
  kleio: "pFZP5JQG7iQjIQuC4Bku",    // Lily: velvety, commanding
  demeas: "JBFqnCBsd6RMkjVDRZzb",   // George: warm, booming
  thea: "cgSgspJ2msm6clMCkdW9",     // Jessica: bright, quick
  nikias: "cjVigY5qzO86Huf0OWal",   // Eric: smooth, young groom
  charon: "pNInz6obpgDQGcFmaJgB",   // Adam: dominant, firm
  theseus: "SOYHLrjzK2X1ezoPC6cr",  // Harry: a warrior
  pirithous: "IKne3meq5aSn9XLyUdCD", // Charlie: brash
};

let used = 0;
for (const l of lines) {
  if (only && !only.includes(l.id)) continue;
  const file = join(out, `${l.id}.m4a`);
  if (existsSync(file) && !force) continue;
  const voice = VOICES[l.who]; if (!voice) { console.warn("no voice for", l.who, l.id); continue; }
  const text = (l.how ? `[${l.how}] ` : "") + l.text; // the direction as an audio tag
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST", headers: {"xi-api-key": key, "content-type": "application/json"},
    body: JSON.stringify({text, model_id: "eleven_v4", voice_settings: {stability: .4, similarity_boost: .8, style: .45, use_speaker_boost: true}})});
  if (!res.ok) { console.error(l.id, res.status, await res.text()); break; }
  const mp3 = file.replace(/\.m4a$/, ".mp3");
  writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-b", "96000", mp3, file]); unlinkSync(mp3); // the game plays .m4a
  used += text.length; console.log("recorded", l.id, l.who, text.length, "chars");
}
console.log("characters used this run:", used);
