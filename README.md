# The Last Thing in the Jar

**A short film you can play.** Five ordinary people with five terrible jobs, in five ages of Greek myth, shot entirely on Renaissance frescoes from the Vatican and Rome.

Inspired by Zach Cregger's *Resident Evil* (2026), which skips the famous heroes and follows a courier doing his job across town while the legend happens around him. Nobody here announces they're important. They just work, complain, and leave things behind that the heroes later use.

| Act | Age | Who you follow | What happens around them |
|---|---|---|---|
| I | Golden | Eudoros, a courier | delivers a "baby" to Cronus. It's a rock. |
| II | Silver | Lyka, a potter | sells Prometheus a fennel stalk; makes Pandora's jar |
| III | Bronze | Pamphilos, a carpenter | builds Deucalion's flood chest; carves "Stuck? Look down." inside the lid |
| IV | Heroes | Ion, a night janitor | gets lost in the Labyrinth every shift, so he carries red yarn. Ariadne notices. |
| V | Iron | Sofia, a Vatican intern | catalogues an old crate with no donor |

There's something none of them notice. The film never says what it is.

## How it plays
- Press play and watch: the camera moves across the paintings, each character speaks in their own voice with subtitles, and a quiet score changes key with each act.
- At one moment in each act the film stops and you choose what the character does. Your choice changes what they say, and builds a profile across the twelve Olympians.
- Each act ends on a silent-film intertitle with what the ancient sources say happened next, and the item that character left behind.
- At the end the Oracle at Delphi reads your choices back to you (AI), then the credits roll.
- Afterwards you can **talk to the cast** (AI). Each character only knows their own act and has no idea they were part of anything.

## Stack
- `public/film.js`: **the screenplay.** Every shot, camera move, line, choice and intertitle. Edit this to change the story.
- `public/player.js` + `public/index.html`: the player (camera, voices, subtitles, choices, credits, chat)
- `public/audio/`: recorded lines, one mp3 per line id
- `scripts/voice/`: records the lines with Workers AI text-to-speech (Deepgram Aura 2). Start `npx wrangler dev --port 8799` in that folder, then run `node scripts/voice/make.mjs`. Delete an mp3 to re-record that line.
- `src/worker.js`: Cloudflare Worker with `/api/echo` (talk to the cast), `/api/reading` (the Oracle) and `/api/voice` (the Oracle's voice)
- `wrangler.jsonc`: config (rate limit: 12 AI calls per visitor per minute)

## Live
https://elpis.karnika-portfolio.workers.dev

## Run locally
```bash
npm install
npx wrangler dev
```
Open http://localhost:8787. To use Claude, put `ANTHROPIC_API_KEY=...` in `.dev.vars` (git-ignored). Without it, the AI runs on Cloudflare Workers AI.

## Deploy
```bash
npx wrangler secret put ANTHROPIC_API_KEY   # optional
npx wrangler deploy
```

## Design
Paintings are public domain via Wikimedia Commons, except the Sistine ceiling photo (CC BY-SA 3.0, credited on the page). `public/og.jpg` is the share card.

Soft and quiet on purpose: fresco plaster, sepia ink, sinopia red and faded lapis, arched niches from Italian Renaissance architecture, IM Fell (a 17th-century typeface) and Cardo (made for classicists, with proper Greek).

## Sources
Hesiod, *Works and Days* 90–201 and *Theogony* 453–567 · Apollodorus 1.7.2 · Ovid, *Metamorphoses* I · Plutarch, *Theseus* 19–20 · Catullus 64 · Pausanias 10.24.6. The five characters and the things they leave behind are invented; the myths are not.

Further reading: Morford, Lenardon & Sham, *Classical Mythology* · Katerina Servi, *Greek Mythology* · Edith Hamilton, *Mythology* · Apollodorus, tr. Robin Hard · Robert Graves, *The Greek Myths* · Stephen Fry, *Heroes* and *Troy* · Apollonius, *Argonautica*, tr. Richard Hunter · Homer, *Iliad*, tr. Martin Hammond, and *Odyssey*, tr. Emily Wilson · Virgil, *Aeneid*, tr. David West.

Made by Karnika Sehgal.
