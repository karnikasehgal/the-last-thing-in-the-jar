# The Last Thing in the Jar

**A short film you can play: an AI side story of Greek mythology, set in Renaissance frescoes.**

> The gods got the myths. The heroes got the glory. I got there first, and I left you clues.

Inspired by the way Zach Cregger's *Resident Evil* (2026) treats its lead as a side character who walks through the origin of a story everyone already knows: you follow a nameless mortal **Witness** through Hesiod's **Five Ages of Man**. In every Age she leaves a relic that a famous hero finds generations later, without ever learning who left it:

| Age | The myth | Her relic | Found by |
|---|---|---|---|
| I · Golden | Rhea tricks Cronus with a swaddled stone | The stone, with her thumbprint in the seal | Pilgrims at Delphi |
| II · Silver | Prometheus steals fire; Pandora opens the jar | A scorched fennel stalk | Heracles |
| III · Bronze | Deucalion and Pyrrha survive the flood | An oak plank with nine marks | Deucalion |
| IV · Heroes | Theseus escapes the Labyrinth | The red thread | Dionysus |
| V · Iron | Our age | The screen you're reading on | You |

The twist is in the jar. (Find the five hidden Greek letters and you'll know before she tells you.)

## What's in it
- **Opening titles** over Michelangelo's Sistine Chapel ceiling, letterboxed, with a quiet score generated live in the browser (Web Audio) that shifts key with each act.
- **Five acts**, each opening on a full-screen painting from the Vatican or Rome with a slow camera drift: Michelangelo's *Delphic Sibyl* and *Deluge*, Piero di Cosimo's *Prometheus*, Carracci's *Bacchus and Ariadne*, Raphael's *Hope*, *Parnassus* and *Council of the Gods*.
- **End credits**, with a tease for Episode II (Heracles, the Argonauts, Troy, Odysseus) and share links.
- **Echoes**: each Age has a "found recording", voiced in the browser with live waveform and word-by-word transcript.
- **Choices with consequences**: each moral dilemma unseals the next Age and reveals who found the relic.
- **A red thread** that unspools down the page through every relic as you scroll.
- **Hidden letters**: five faint Greek glyphs in the dark.
- **Talk to the Witness (AI)**: Claude plays her in character. She only remembers the Ages you've unlocked, so she can't spoil the ending, and she says which parts are ancient sources and which are her own invention.
- **Psyche reading (AI + psychology)**: your choices map onto the twelve Olympians as inner archetypes (Jung; Jean Shinoda Bolen's *Goddesses in Everywoman* / *Gods in Everyman*). You get a patron, an ally and a neglected god, plus a personal reading. The ending also draws on C. R. Snyder's hope theory.

## Stack
- `public/story.js`: **the story itself** (every Age, relic, echo, choice and god). Edit this to change the writing.
- `public/index.html` + `public/app.js`: the page and how it behaves (plain HTML/CSS/JS, no build step)
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

## Design
Paintings are public domain via Wikimedia Commons, except the Sistine ceiling photo (CC BY-SA 3.0, credited on the page). `public/og.jpg` is the share card.

Soft and quiet on purpose: fresco plaster, sepia ink, sinopia red and faded lapis, arched niches from Italian Renaissance architecture, IM Fell (a 17th-century typeface) and Cardo (made for classicists, with proper Greek).

## Sources
Hesiod, *Works and Days* 90–201 and *Theogony* 453–567 · Apollodorus 1.7.2 · Ovid, *Metamorphoses* I · Plutarch, *Theseus* 19–20 · Catullus 64 · Pausanias 10.24.6. The Witness and her relics are invented; the myths are not.

Further reading: Morford, Lenardon & Sham, *Classical Mythology* · Katerina Servi, *Greek Mythology* · Edith Hamilton, *Mythology* · Apollodorus, tr. Robin Hard · Robert Graves, *The Greek Myths* · Stephen Fry, *Heroes* and *Troy* · Apollonius, *Argonautica*, tr. Richard Hunter · Homer, *Iliad*, tr. Martin Hammond, and *Odyssey*, tr. Emily Wilson · Virgil, *Aeneid*, tr. David West.

Made by Karnika Sehgal.
