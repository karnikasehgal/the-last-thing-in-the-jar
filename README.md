# The Coin

**A short film you can play.** Episode I of *The Last Thing in the Jar*.

- The game: https://coin.klickbaitbyk.com
- The film: https://film.klickbaitbyk.com

Mikon chokes on an olive pit at his cousin's wedding and arrives at the River Styx without the coin for the ferry. The rule is a hundred years on the bank. So he waits, and for a century he watches the famous visitors go past: Orpheus singing the ferryman to tears, Theseus and Pirithous getting stuck to their chairs, Heracles walking off with the three-headed dog, Elpenor (who fell off a roof in the *Odyssey*), Aeneas with his golden branch, and Psyche, who is carrying two coins and has been told not to help him.

Inspired by Zach Cregger's *Resident Evil* (2026), which skips the famous heroes and follows an ordinary man through the edges of the legend. Mikon is the old man Psyche is warned to ignore in Apuleius. Nobody ever wrote down his name.

## The game
A game in chapters, each one a different person inside their own legend, on one Underworld map that grows (the plan is in `docs/game-design.md`).
- **Chapter I, The Coin**: you are Mikon. Find a coin, get it past the dog, reach the ferry.
- **Chapter II, The Lyre**: you are Orpheus. Sing your way past Charon and Cerberus, ask Hades and Persephone for Eurydice, and lead her out without looking back.
- Trinkets from real Greek graves and stories are hidden along the way; the Codex keeps them, with sources.

The game (in `public/play/`, served at coin.klickbaitbyk.com) is a first-person version: an open riverbank in the Underworld built like an Italian loggia, with frescoed vaults and real water. Hermes tells you the rule out loud: no coin, no boat, and the dog can smell coins. Talk to Elpenor, Theseus and Pirithous and Charon (every line is spoken, and the camera cuts to whoever is talking), find a coin, and get it past Cerberus to the ferry. Cerberus can't swim.

- 3D people: Microsoft Rocketbox avatars and motion-captured animations (MIT licence, notice in `public/play/assets/rb/`), converted for the web with three.js, with facial rigs for blinking and speech. The meadow's shades use Quaternius *Universal Base Characters* (CC0). Their Greek clothes, hats, beards and props are made in code in `public/play/people.js`, following the ancient descriptions: Hermes in his winged traveller's hat with the herald's staff, Charon as Virgil describes him (filthy cloak, white beard, eyes of flame), Elpenor in a sailor's one-shoulder tunic with his oar.
- Voices: recorded on-device with Kokoro (Apache 2.0) into `public/play/voice/`.
- Cerberus is built in code (`makeHound` in `public/play/game.js`).

## How the film plays
- Press play and watch. The camera cuts across Renaissance paintings, every character speaks in their own voice with subtitles, and a quiet score changes with each act.
- Five times the film stops and you choose what Mikon does.
- At the end the Oracle tells you which Greek god you're most like, from your choices (AI).
- Afterwards you can talk to Mikon, Charon, Elpenor or Heracles (AI).

## How it's made
- `docs/episode-1-the-coin.md`: the screenplay.
- `public/film.js`: the same script, ready to play: every line, who says it, and what the camera shows.
- `public/shots.js`: the named camera positions on each painting.
- `public/player.js`, `public/index.html`: the player.
- `public/img/lib/`: the paintings, each folder with a `manifest.json` (artist, title, date, location, licence, source).
- `public/audio/`: one recording per line. `scripts/voice/` records them with Workers AI text-to-speech.
- `src/worker.js`: Cloudflare Worker for the AI cast, the Oracle's reading and its voice.

## Run it
```bash
npm install
npx wrangler dev
```

## Sources
Aristophanes, *Frogs*; Virgil, *Aeneid* 6 and *Georgics* 4; Ovid, *Metamorphoses* 10; Apollodorus, *Library* 2.5.12 and *Epitome* 1.24; Homer, *Odyssey* 10 to 12; Apuleius, *Metamorphoses* 6. Mikon, his olive pit and the oar are invented.

## Picture credits
Paintings are public domain unless noted. Photographs under Creative Commons are credited on screen and in each `manifest.json` (photographers include Sailko, ArchaiOptix, Alvesgaspar, Carole Raddato, Kent Wang, Francesco Bini and Marie-Lan Nguyen). Agostino Carracci's *Pluto* is in an Italian state museum, which requires permission for commercial reproduction.

Made by Karnika Sehgal.
