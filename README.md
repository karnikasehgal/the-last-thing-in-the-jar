# The Last Thing in the Jar

**An interactive AI side story of Greek mythology.**

> The gods got the myths. The heroes got the glory. I got there first, and I left you clues.

Inspired by the way Zach Cregger's *Resident Evil* (2026) treats its lead as a side character who walks through the origin of a story everyone already knows: you follow a nameless mortal **Witness** through Hesiod's **Five Ages of Man**. In every Age she leaves a relic that a famous hero finds generations later, without ever learning who left it:

| Age | The myth | Her relic | Found by |
|---|---|---|---|
| I · Golden | Rhea tricks Cronus with a swaddled stone | The stone, with her thumbprint in the seal | Pilgrims at Delphi |
| II · Silver | Prometheus steals fire; Pandora opens the jar | A scorched fennel stalk | Heracles |
| III · Bronze | Deucalion and Pyrrha survive the flood | An oak plank with nine marks | Pyrrha |
| IV · Heroes | Theseus escapes the Labyrinth | The red thread | Dionysus |
| V · Iron | Our age | The screen you're reading on | You |

The twist is in the jar. (Find the five hidden Greek letters and you'll know before she tells you.)

## What's in it
- **Echoes**: each Age has a "found recording", voiced in the browser with live waveform and word-by-word transcript.
- **Choices with consequences**: each moral dilemma unseals the next Age and reveals who found the relic.
- **A red thread** that unspools down the page through every relic as you scroll.
- **Hidden letters**: five faint Greek glyphs in the dark.
- **Talk to the Witness (AI)**: Claude plays her in character. She only remembers the Ages you've unlocked, so she can't spoil the ending, and she says which parts are ancient sources and which are her own invention.
- **Psyche reading (AI + psychology)**: your choices map onto the twelve Olympians as inner archetypes (Jung; Jean Shinoda Bolen's *Goddesses in Everywoman* / *Gods in Everyman*). You get a patron, an ally and a neglected god, plus a personal reading. The ending also draws on C. R. Snyder's hope theory.

## Stack
- `public/index.html`: the whole experience (HTML/CSS/vanilla JS, no build step)
- `src/worker.js`: Cloudflare Worker with `/api/echo` (chat) and `/api/reading`; streams from Claude, or from Cloudflare Workers AI if no Anthropic key is set
- `wrangler.jsonc`: config (rate limit: 12 AI calls per visitor per minute)

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

## Sources
Hesiod, *Works and Days* 90–201 and *Theogony* 453–567 · Apollodorus 1.7.2 · Ovid, *Metamorphoses* I · Plutarch, *Theseus* 19–20 · Catullus 64 · Pausanias 10.24.6. The Witness and her relics are invented; the myths are not.

Made by Karnika Sehgal.
