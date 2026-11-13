# PLAN: The Coin, level 2 (Tartarus, with the Gorgon's head)

**Version:** v1.1
**Date:** 2026-11-12
**Status:** Approved on 2026-11-12 ("go with yours"). Starts only when the conditions in "When this plan starts" are met.
**Project folder:** `~/Documents/elpis`. Code writes progress to `docs/STATUS.md`. House rules are in `CLAUDE.md`. The art bible is `docs/references.md`. Level 1's plan is `docs/PLAN-level1.md`.

### Change notes
- v1.1 (2026-11-13): Built from Karnika's first pin stories (`docs/pin-stories.md`). The monster is now the Gorgon's head that Persephone keeps (Homer), held by a veiled guardian, instead of a living Medusa. New scenes: Hecate at the Fork, the Furies styled as rebellious couture, Nyx's house, and the Fates' hall of red threads. The shades wear layered sheer veils.
- v1 (2026-11-12): First version. Design choices were recommended by Claude in Chat and accepted by Karnika ("go with yours"). She can change any of them; record changes here.

### When this plan starts
- **Stage 0** may start once level 1's Stage 0 gate is passed (the dark lighting, red thread and hooded shades have been tested) **and** `docs/pin-stories.md` exists.
- **Stage 1 onward** starts once level 1's Stage 2 gate is passed (level 1's first minute is finished), so the lighting, candles, water and shades built there can be reused.
- One plan is worked on at a time. If both have a next step, level 1 goes first unless Karnika says otherwise.

---

## 1. Goal
Build Tartarus, the punishment pit of the Greek underworld, as the game's second level: a place made from Karnika's own Pinterest board and the stories behind her pins, with one monster encounter that people talk about afterwards. Mikon is dragged in by mistake, crosses Tartarus past the punished sinners, escapes the Gorgon by looking only at her reflection in black water, and finds out whose coin he was carrying. It has to be fun for people who don't play games, and accurate to the ancient sources wherever we don't deliberately invent.

## 2. Audience and medium
- **Who it is for:** friends and people who click a link Karnika shares (for example on X), most of whom rarely play games.
- **What it is:** a level in the existing first-person 3D browser game (three.js) in `public/play/`.
- **Where people will see it:** a laptop browser first (Chrome and Safari). It must still load and play on a phone in the game's LITE mode.

## 3. Definition of done
1. **Gorgon test:** five friends play Tartarus with no hints. At least four work out the reflection rule and get past the Gorgon within three tries.
2. **Favourite moment:** asked "what was your favourite moment?", at least three of the five name the Gorgon encounter.
3. **Finish test:** at least three of the five reach the end of the level without help.
4. **Look test:** every area passes the value rules for the underworld in `docs/references.md` (65 to 75 percent of the frame at or below 10 percent brightness, highlights 5 percent or less), with the red key light coming from below (the river of fire).
5. **Speed test:** at least 30 fps everywhere in the level on the laptop and on the emulated phone (`tools/perf.mjs`, two runs each), including during the Gorgon encounter.
6. **Weight test:** Tartarus loads only when the player reaches it, so the first load does not grow (73.2 MB on 12 November 2026). Tartarus itself adds at most 15 MB.
7. **Accuracy test:** every sinner, monster and place in the level has a line in `docs/accuracy.md` saying whether it is ancient, a variant or invented, with the source and line numbers.

## 4. Constraints
- **Money:** free tools only.
- **Paid credits:** none. New spoken lines use the existing free on-device voices (Kokoro).
- **Deadline:** none.
- **Laptop limits:** one Blender at a time, never Blender and the game in a browser together, nothing left running. Warn before anything heavy. No cloth simulations.
- **Platforms:** Chrome and Safari on a laptop; phone in LITE mode.
- **Safety:** all work runs behind a URL flag (`/play/?l2`) until Stage 6. The public site is not updated without Karnika's yes.
- **Selling later:** Karnika may sell the game one day. Use only assets that allow commercial use, and log every new asset's licence in `README.md` or the relevant `manifest.json`. Pins are inspiration only: never copy a specific artwork or installation from the board.

## 5. Quality tier
- **Chosen tier:** free tools (three.js, code-built scenes and creatures, existing free character models).
- **Why this tier:** the Gorgon is only ever seen properly in the black water, distorted by ripples, darkness and red light from below. That hides exactly what free tools do badly (detailed faces, hair, skin up close). The game mechanic and the budget point the same way.
- **One real example of what this tier can achieve:** the game's own Cerberus, built entirely in code in `public/play/hound.js`.
- **What this tier cannot achieve:** a Gorgon that holds up in full light, up close, at the level of the couture photographs on the board. We never show it that way. Looking straight at it turns the screen to stone, so the player never gets a clear direct view anyway.

## 6. Taste extract
- **She wants:** dark theatrical couture. Black, blood red, ivory, silver, gold. Candles, single spotlights, haze, black reflective water. Red fabric spilling over ruins, red-thread rooms, red light as a single source, chains, veiled and hooded figures, bodies as set pieces (a tree of bodies, a pile of bodies), marble that is breaking or veiled, creatures at a scale that dwarfs people. The game must be fun.
- **She does not want:** bright, sunny or Pixar looks; generic dark fantasy; hell that doesn't look like hell; a fight that needs gaming skill or fast button combos.
- **Always avoid:** anything that looks AI-generated or generic, and anything that looks like the game *Hades* (Supergiant Games). Ours is first person, theatrical couture, an ordinary man, and close to the ancient sources.

## 7. References
The art bible `docs/references.md`, especially "Board update, 12 November 2026". Board: https://in.pinterest.com/karnika0801/game-design/ (view only; never download pins). Karnika's stories behind her 20 chosen pins: `docs/pin-stories.md` (each story there says which room, monster, puzzle or moment it becomes; that file overrides this table where they disagree).

| Reference | Take this | Ignore this |
|---|---|---|
| Pin 641481540722011729 ("Red Pool") | The Gorgon's chamber: a gothic hall with a pool between the columns | The red colour of the water itself; our water stays black and only reflects red |
| Pin 641481540722175219 ("Medusa's shadow") | The veiled guardian first appears as a shadow between pillars | Nothing |
| Pin 641481540722302994 (bust splitting into a skull) | The look of her victims: marble statues cracking open | Gallery setting |
| Pin 641481540722173784 ("Spiral") | The descent into Tartarus as a spiral, lit red from the centre | Nothing |
| Pin 641481540721954159 ("The chained dragon") | Chains, scale, a creature mostly in shadow | The bat wings |
| Pin 641481540721867916 ("Tree of bodies 2") | A set piece for the punished: bodies as architecture | Nothing |
| Red thread pins in the board update | The sinners' rooms strung with red thread | Gallery white walls |
| Candle pins in the board update | Rows of candles as the safe path; candles going out as danger | Nothing |
| Ancient sources (read in a free online translation such as the Perseus Digital Library; quote line numbers, don't download) | Virgil, *Aeneid* 6, about lines 548 to 627 (Tartarus, the river of fire Phlegethon, Tisiphone at the gate, the sinners); Homer, *Odyssey* 11, about lines 576 to 600 (Tityos, Tantalus, Sisyphus) and 633 to 635 (fear of the Gorgon's head); Virgil, *Aeneid* 6, about line 289 (Gorgons at the entrance); Ovid, *Metamorphoses* 4, about lines 765 to 803 (Perseus sees the Gorgon in the reflection on his bronze shield) | Check every line number before quoting it; the ranges here are approximate |

## 8. Unverified assumptions
| # | Assumption | Stage 0 test | Pass threshold |
|---|---|---|---|
| A1 | Seeing the Gorgon's head only in its reflection is a rule people work out by themselves and enjoy | A grey prototype behind `?l2`: a pool, a placeholder guardian holding up the head, turning slowly as it moves, an exit on the far side. Looking straight at it for about one second turns the screen to stone and restarts the attempt. Hints are only in the world: earlier victims as statues frozen mid-step, all staring ahead, and one survivor statue with its head bowed toward the water | Karnika and two friends play with no hints: at least two of three work it out within three tries, and at least two of three say they'd play it again |
| A2 | The water reflection can show a moving creature clearly while staying fast | The placeholder guardian and head moving around the pool, with the reflection the river already uses | At least 30 fps on the laptop and the emulated phone; the Gorgon readable in the reflection in a screenshot |
| A3 | A punished sinner can be built as a cheap set piece | One sinner as a test, reusing the existing Sisyphus and his boulder from the far bank, re-lit for Tartarus | Under 5,000 extra triangles, costs less than 2 fps |
| A4 | Tartarus can load separately, only when the player reaches it | Move the prototype's files so they load only when `?l2` starts | First load unchanged; the prototype loads in under 5 seconds on the laptop |

## 9. Stages
Each stage ends with something Karnika can play or look at in one sitting. Code ticks each box with the date and the numbers, and writes `docs/STATUS.md` at every gate.

### The level, in one paragraph (the design every stage builds toward)
At the Fork, Hecate, goddess of crossroads, stands holding fire: the only light in the scene. She sees that the coin Mikon paid Charon with in level 1 belonged to a sinner, and calls the Furies, three women in black hoods, thigh-high boots and heels, carrying whips, with snakes worn like jewellery. They seize him; Tisiphone opens the iron gate and he is thrown inside. On the edge of the pit stands the House of Night: Nyx, with huge sheer wings, hides him under them while the Furies pass. Then the Fates' hall, strung with red threads, one for every life, where Mikon finds the cut end of his own (the red thread that guided him through level 1 was his life thread all along). Below it, Tartarus is a spiral descent around a pit, lit red from below by the river of fire, with iron walls, chains and rows of candles on the stone. On the way down he passes the punished sinners, each one a set piece built from Karnika's pins: Sisyphus and his boulder, Tantalus reaching for fruit and water that pull away, the Danaid sisters carrying water in leaking jars, Tityos stretched on the ground. Each one gives him a clue about whose coin he carried. The shades here wear layered sheer veils, more layers the longer they have been dead. At the bottom is a drowned gothic hall with a black pool, full of marble statues of people caught mid-step and cracking open to show the skull inside. A tall veiled guardian stands in the water holding up the Gorgon's head, which Persephone keeps. Looking straight at it turns you to stone; the only safe way to see it is in the water. The player crosses the hall by watching the reflection, as the guardian turns and the candles go out wherever the head's gaze passes, and escapes up a stair on the far side. At the top he learns the answer: the coin was Sisyphus's, the trickster who cheated death. Hermes arrives to correct the mistake, and Mikon is let out toward the Asphodel Meadow. End of level.

### Stage 0: Test the assumptions
- [ ] A1: the Gorgon reflection prototype, tested with Karnika and two friends.
- [ ] A2: reflection speed and readability measured.
- [ ] A3: one sinner set piece measured.
- [ ] A4: separate loading measured.
- **Deliverable:** a pass or fail for A1 to A4, with numbers, screenshots and the friends' results.
- **Acceptance criteria:** each assumption marked pass or fail with its measurement.
- **Evidence Code must show:** screenshots of each test, fps before and after, the load sizes, and a one-page test sheet Karnika uses with her friends (what to say, which is nothing, and what to write down).
- **Gate:** Karnika reads `docs/STATUS.md` and says "continue". If A1 fails, stop and send it back to Chat: the monster design changes before anything else is built.
- **Assets she supplies:** the stories behind her 20 favourite pins, Karnika, by Thursday 19 November 2026 (dictated to Claude in Chat, which writes `docs/pin-stories.md`); two friends for the A1 test, Karnika, whenever she chooses.

### Stage 1: The route in grey boxes
- [ ] The whole route playable behind `?l2` with simple shapes: the seizure at the Fork, the gate, the spiral descent, a spot for each sinner, the Gorgon hall, the exit stair, the ending.
- **Deliverable:** a level you can walk from the gate to the end, made of grey shapes.
- **Acceptance criteria:** takes 10 to 15 minutes; the red glow at the bottom of the pit is visible from the gate, so the goal is always clear; no dead ends without a reason.
- **Evidence Code must show:** a top-down or side map of the route with timings; a screenshot from each key spot.
- **Gate:** Karnika plays it and says whether the shape is fun before any art goes on.
- **Assets she supplies:** none.

### Stage 2: The Gorgon's head, finished
- [ ] The hall dressed: black pool, columns, statues of victims cracking open, candles, red light from below.
- [ ] The veiled guardian and the Gorgon's head built in code, seen properly only in the reflection: first the guardian as a shadow between pillars, then the head in the water.
- [ ] The rule: looking straight at her turns the screen to stone, with sound, and a quick restart.
- [ ] Three rising beats in the crossing: the guardian wanders, then hunts, the candles go out and the player must cross by the reflection alone.
- [ ] Sound: the guardian's steps in the water, stone cracking, a low hiss from the head.
- **Deliverable:** the Gorgon encounter at final quality; the rest of the level stays grey.
- **Acceptance criteria:** passes the look test; at least 30 fps throughout; repeats the A1 friend test with two new friends, and both work it out within three tries.
- **Evidence Code must show:** screenshots of each beat, the value split, fps, the friends' results.
- **Gate:** Karnika plays it and approves it.
- **Assets she supplies:** two new friends for the test, Karnika, whenever she chooses.

### Stage 3: Make it look like Tartarus
- [ ] Hecate at the Fork with her fire; the Furies styled as in `docs/pin-stories.md` (story 2); the gate and iron walls; Tisiphone at the gate.
- [ ] Nyx's house on the edge of the pit, with her sheer wings.
- [ ] The Fates' hall: red threads for every life, Mikon's cut thread.
- [ ] The spiral descent: red light from the river of fire below, chains, candles, red thread strung through the rooms.
- [ ] The sinners dressed according to `docs/pin-stories.md`.
- **Deliverable:** every area dressed and lit to the art bible and the pin stories.
- **Acceptance criteria:** each area passes the look test; at least 30 fps everywhere; Tartarus adds at most 15 MB and the first load is unchanged.
- **Evidence Code must show:** screenshots of each area next to the pins it was built from; value split; fps; load sizes.
- **Gate:** Karnika approves each area against her pins.
- **Assets she supplies:** none.

### Stage 4: The story: the Furies, the sinners and the coin
- [ ] The seizure at the Fork: Hecate notices the coin, the Furies take him. Nyx hides him. He finds his cut thread in the Fates' hall.
- [ ] Each sinner's moment and clue (short lines, free on-device voices).
- [ ] The answer at the top (Sisyphus's coin), Hermes, and the release toward the Asphodel Meadow.
- [ ] Every sinner, monster, place and invention logged in `docs/accuracy.md`, with sources and line numbers checked.
- **Deliverable:** the level's story is complete and playable from start to end.
- **Acceptance criteria:** a player who finishes can say whose coin it was and why the Furies took Mikon; the accuracy log covers everything in the level.
- **Evidence Code must show:** the list of lines and clues; the new rows in `docs/accuracy.md`.
- **Gate:** Karnika plays it start to end.
- **Assets she supplies:** none.

### Stage 5: Feel
- [ ] Reuse level 1's feel work (soft camera, reacting water, candles and cloth, sound).
- [ ] The frame rate stays steady, including in the Gorgon hall.
- **Deliverable:** the whole level, polished in feel.
- **Acceptance criteria:** at least 30 fps everywhere, with fewer than five frames over 100 ms in a full run on the laptop.
- **Evidence Code must show:** a full-run frame-time log.
- **Gate:** Karnika plays the whole level.
- **Assets she supplies:** none.

### Stage 6: The friend test, then make it real
- [ ] Run the tests in section 3 with five friends (Code prepares the test sheet).
- [ ] Fix only what the test shows, through the feedback step (numbered list, confirmed first).
- [ ] With Karnika's yes, connect level 2 to the end of level 1 in the normal game.
- **Deliverable:** level 2 that passes every test in section 3.
- **Gate:** Karnika says yes to connecting it. Updating the public site is a separate yes.
- **Assets she supplies:** five friends' time, Karnika, whenever she chooses.

## 10. Later list (out of scope for now)
- How to make money from the game (for example a free Chapter I as a demo and the full game for sale). Decide later; the licence rule in section 4 keeps that option open.
- Tekken-style fighting or any combat that needs button skill.
- The court of Minos: a side quest in a maze of impossible stairs, with Ariadne's thread (`docs/pin-stories.md`, story 6).
- Story 9 ("the lighting one"): waiting for Karnika to say which pin.
- More monsters (the Hydra, the Chimaera and the other shapes Virgil puts at the entrance), the Titans, Ixion's wheel.
- Painted close-ups for Tartarus (after the painting test in level 1's plan).
- Recording voices with ElevenLabs.
- Every other chapter in `docs/game-design.md`.
- Updating the public site.

## 11. Permissions
**Code may do these without asking:**
- Read and edit files in this project folder.
- Run the game on her laptop and run `tools/perf.mjs` and `tools/asset_sizes.mjs`.
- Read ancient texts on free websites to check line numbers (reading, not downloading).
- Make normal git commits as Karnika Sehgal (no Claude co-author line) and push to `origin main`.

**Code must ask Karnika first, and wait for a clear yes for that specific item:**
- Spending any paid credits (show the cost first; a yes covers that one batch only).
- Downloading or installing anything (tools, packages, models, textures, images, sounds).
- Publishing anything publicly, including updating coin.klickbaitbyk.com.
- Any action on one of her accounts.
- Any heavy local job (a long render, a simulation, Blender work), with a warning about heat and time.
- Replacing anything she already approved, including connecting level 2 to the normal game. Show a side-by-side first.
- Merging a branch into `main`, force-pushing or rewriting git history.

## 12. Stop conditions
Code stops, writes `docs/STATUS.md`, and sends the work back to Chat when:
- an assumption in section 8 fails its test (above all A1, the Gorgon rule);
- the plan conflicts with a constraint in section 4 (for example, the Gorgon hall can't reach 30 fps);
- `docs/pin-stories.md` doesn't exist yet when Stage 0 would start;
- Karnika asks for something that is not in this plan (that is a change, not a defect);
- a step would need a permission she has not given.

## 13. Decision log
| Date | Decision | Why | Options we did not choose |
|---|---|---|---|
| 2026-11-12 | "Hell" is Tartarus, as level 2 | Greek myth has no hell; Tartarus is its punishment pit, and it reuses level 1's building blocks | Replacing level 1; a hell with no source |
| 2026-11-12 | Built from Karnika's 20 favourite pins and their stories | Twenty strong stories are enough for a level; the stories are what make it hers | All 123 pins; Claude guessing the stories |
| 2026-11-12 | The monster is the Gorgon, beaten by a rule (look only at the reflection), not by button skill | Fun for non-gamers; free tools can do it; Greek heroes win by tricks; uses the board's black water | A fighting game like Tekken; a sword fight |
| 2026-11-12 | Mikon escapes the Gorgon; he doesn't kill her | He is an ordinary man, not Perseus | Beheading her |
| 2026-11-12 | The Furies take Mikon because his coin belonged to a sinner; it was Sisyphus's | Links levels 1 and 2 and gives a mystery; Virgil says no innocent may cross Tartarus's threshold, so his presence is a mistake the game can use | Mikon goes in by choice; no reason |
| 2026-11-13 | The monster is the Gorgon's head that Persephone keeps, held by a veiled guardian | Homer (*Odyssey* 11) has Persephone able to send up the Gorgon's head from Hades; Karnika loves the pin of someone holding Medusa's head | A living Medusa in Tartarus (our invention) |
| 2026-11-13 | Hecate, the Furies, Nyx and the Fates join level 2, built from Karnika's pin stories | Each comes from a pin she loves and has an ancient source | Making each pin its own level |
| 2026-11-13 | Mortals stay close to Greek dress; gods, monsters and spirits get couture freedom (boots, heels, sheer layers) | Karnika wants it aesthetic and rebellious; keeps the ordinary dead believable | Couture for everyone; strict Greek dress for everyone |
| 2026-11-13 | The red thread is Mikon's life thread from the Fates; red is our colour | The red string of fate is East Asian, not Greek; the Fates' thread is the Greek idea | Calling it a Greek red string |
| 2026-11-12 | Free tools only; the Gorgon only seen clearly in the reflection | Hides free tools' weak spot (detail up close) | Buying a monster model; hiring a 3D artist |
| 2026-11-12 | Tartarus loads separately when reached | Keeps the first load from growing | Loading everything at the start |
| 2026-11-12 | Never look like *Hades* (Supergiant) | The famous Greek underworld game; ours must be different on purpose | None |

## 14. Learning notes
LEARNING.md was not available when this plan was written, so treat every technical idea as new and explain it in one or two plain sentences the first time it comes up. Karnika does not play games (she played Tekken as a child), so explain game ideas too. Ideas likely to come up:
- **Grey box (greybox):** a level built from plain shapes to test whether the route is fun before any art.
- **Playtest:** watching someone play without helping, and writing down where they get stuck.
- **Boss or encounter:** the big, memorable challenge of a level; here, the Gorgon's head.
- **Telegraphing:** showing a danger before it hurts you (the Gorgon's shadow first, the statues as a warning).
- **Frame rate (fps):** how many pictures a second the game draws; below about 30 it feels choppy.
- **Loading on demand (lazy loading):** fetching a level's files only when the player gets there, so the start stays quick.
- **URL flag (`?l2`):** a word added to the game's address that switches on the new level while the old game keeps working.
- **Licence:** the permission that says whether you may use, change or sell something someone else made.
