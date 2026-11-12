# PLAN: The Coin, level 1 (the near bank of the Styx)

**Version:** v1
**Date:** 2026-11-12
**Status:** Approved on 2026-11-12 ("just do whatever you think feels right"). Karnika pastes prompt 2 from `docs/claude-code-prompts.md` to start each step.
**Project folder:** `~/Documents/elpis`. Code writes progress to `docs/STATUS.md`. House rules are in `CLAUDE.md`. The art bible is `docs/references.md`.

### Change notes
- v1 (2026-11-12): First version. Every design choice below was made by Claude in Chat because Karnika asked it to decide. She can change any of them; record changes here.

---

## 1. Goal
Rebuild Chapter I's first playable level so that it hooks a stranger in the first minute, so that the underworld finally looks like the board (black water, candles, red light, hooded shades, a drowned cathedral), and so that moving through it feels soft and alive, the way bruno-simon.com does: the world reveals itself, everything reacts to you, the camera glides, and the frame rate stays steady. One level, done properly, is the proof the whole game rests on.

## 2. Audience and medium
- **Who it is for:** friends and people who click a link Karnika shares (for example on X), who know nothing about the game.
- **What it is:** a first-person 3D browser game (three.js), the existing game in `public/play/`.
- **Where people will see it:** a laptop browser first (Chrome and Safari). It must still load and play on a phone in the game's existing LITE mode.

## 3. Definition of done
1. **Hook test:** five friends play from the moment Mikon wakes, with no explanation. At least four keep playing past the first minute without asking "what do I do?", and at least four can say afterwards what Mikon wants (a coin, to get on the boat).
2. **Finish test:** at least three of those five reach the ferry and cross without help.
3. **Look test:** on the river bank, 65 to 75 percent of each test screenshot is at or below 10 percent brightness, and highlights are 5 percent or less (the value rules in `docs/references.md`). Every scene after waking passes its own row in that section.
4. **Speed test:** at least 30 fps in every area of the level on the laptop and on the emulated phone, measured with `tools/perf.mjs` (two runs each).
5. **Weight test:** the first load is not heavier than today (72.8 MB before Enter is ready).
6. **Feel test:** with no on-screen arrows or markers, the player can always find the way by following the red thread, the candles and the visible red light on the far bank.

## 4. Constraints
- **Money:** free tools only.
- **Paid credits:** none in this plan. No ElevenLabs, no Canva AI. New spoken lines use the existing free on-device voices (Kokoro). Recording with ElevenLabs is a separate decision for later.
- **Deadline:** none.
- **Laptop limits:** one Blender at a time, never Blender and the game in a browser at the same time, nothing left running. Warn before anything heavy. No cloth simulations.
- **Platforms:** Chrome and Safari on a laptop; phone in LITE mode.
- **Safety:** all new work runs behind a URL flag (`/play/?l1`) until Stage 7, so the current game keeps working. The public site coin.klickbaitbyk.com is not updated in this plan without Karnika's yes.

## 5. Quality tier
- **Chosen tier:** free tools (three.js, code-built scenes, the existing Rocketbox and Quaternius people), plus painted stills Karnika makes in another AI tool for close-ups.
- **Why this tier:** the board's strength is light, water, candles and cloth over ruins, which code-built 3D can do well. Realistic couture people are what free 3D does worst, so the plan avoids showing them up close.
- **One real example of what this tier can achieve:** Karnika's own approved style frames in `look-test/` ("Style frame 2 river bank.jpg" compared with "Style frame 2 river bank, game today.jpg"). The target is to close the gap between those two.
- **What this tier cannot achieve:** realistic faces and couture clothes that move like the photographs on the board. So in 3D, the dead are hooded or veiled and seen from a distance; faces only appear in painted close-ups.

## 6. Taste extract
- **She wants:** dark theatrical couture. Black, blood red, ivory, silver, gold. Candles, single spotlights, haze, black reflective water. Red fabric spilling over ruins, red-thread rooms, red light as a single source, veiled and hooded figures, dramatic sets and props. The world details she already likes: the arcade, the beach, the dog, the cave, the temple. A UI that is playful and smooth like bruno-simon.com.
- **She does not want:** bright, sunny or Pixar looks. Hell that doesn't look like hell. A first level that is a straight line (palace, river, cross). The current characters, and clothes that don't fit. If a screenshot looks fine in a well-lit room, it is too bright.
- **Always avoid:** anything that looks AI-generated or generic.

## 7. References
The art bible `docs/references.md` holds the palette, light, materials and scene direction, plus the section "Board update, 12 November 2026". Board: https://in.pinterest.com/karnika0801/game-design/ (view only; never download pins).

| Reference | Take this | Ignore this |
|---|---|---|
| Pin 641481540721805879 (hooded figures standing in water) | How the shades stand: hooded, faceless, still, in shin-deep water, reflections brighter than they are | Nothing |
| Pin 641481540721805769 (red silk over black water, red figure) | Red banners over black water; one red figure as a focal point | The studio floor |
| Pin 641481540722065771 ("The Red Door in the Abyss") | One red light visible from far away as the goal, with a red trail leading to it | The desert sand |
| Pin 641481540722011729 ("Red Pool") and the cathedral and column pins in the board update | The drowned cathedral: a forest of columns standing in black water, vaults, candles on the floor | Daylight versions |
| Red thread pins (641481540722302981, 641481540721956559 and others in the board update) | The red thread as a line through space that guides, tangles and tightens | Gallery white walls |
| Candle pins (641481540722058604, 641481540722048845, 641481540722302954) | Rows of candles on the floor as the safe path | Nothing |
| Pin 641481540721954159 ("The chained dragon") | Cerberus seen at the end: huge, chained, mostly in shadow, seen in parts | The bat wings |
| `look-test/Style frame 2 river bank.jpg` | The approved target look for the river bank | Nothing |

## 8. Unverified assumptions
| # | Assumption | Stage 0 test | Pass threshold |
|---|---|---|---|
| A1 | The river bank can be as dark as the board and still be easy to find your way in | Relight one area (the dock) behind `?l1`: one cool shaft from above, black water, candles, fog. Take 3 screenshots and measure the value split | 65 to 75 percent near-black, and in each screenshot the path and the dock are visible at a glance (Karnika looks and says yes) |
| A2 | A glowing red thread can be drawn cheaply and reads clearly from far away | A thread 100 m long through the dock area that sways slightly and glows | Costs less than 2 fps on the laptop; visible from 50 m in a screenshot |
| A3 | A crowd of hooded shades fits the speed budget | 40 shades with a simple hooded cloak (no faces, no hands) standing in the water, turning their heads toward the player | At least 30 fps on the laptop and on the emulated phone |
| A4 | The current code can host a new level behind a flag without breaking the opening film and the current game | Write a one-page walkthrough of the current game with a screenshot per area, then add an empty `?l1` route | The normal game and the opening film play exactly as before |
| A5 | Painted portraits and the 3D world feel like one world | Karnika drops one painted portrait into `paintings-in/`; show it next to its 3D scene in `/play/?portraits` | Karnika says they belong together. This test does not block Stage 1; it runs whenever her painting arrives |

## 9. Stages
Each stage ends with something Karnika can play or look at in one sitting. Code ticks each box with the date and the numbers, and writes `docs/STATUS.md` at every gate.

### The level, in one paragraph (the design every stage builds toward)
Black screen and the sound of water. Mikon opens his eyes lying on a black beach in fog, under one cool shaft of light. A thin red thread lies across his hand and runs off into the dark: it is the only bright thing, so the player follows it without being told. Within the first minute, the thread leads past rows of hooded shades standing in the water, who turn their heads as he passes, to Elpenor, who tells him the rule in two lines: no coin, no boat. Far across the water, Charon's red lantern and a red doorway on the far bank are visible from almost everywhere, so the goal is always in sight. The dock is a hub in a drowned cathedral: a forest of columns standing in shallow black water, lit by rows of candles on the stone. From the dock the thread splits into three strands, which the player can follow in any order: the arcade (Theseus and Pirithous stuck to their chairs, who give a clue), the temple with the falling Icarus (a trial from `trials.js` that earns something), and the cave (relit as black wet stone with a candle path, where the coin is found through its owner). Each strand turns gold when its part is done. Once Mikon holds the coin, the crowd of the unburied presses in and grabs at it: where shades gather the candles go out, so the safe route is the candlelit one back to the dock. Charon chooses him, he pays, and the crossing is a slow, calm ride under red banners stretched over the black water. He steps off on the far bank, the red doorway ahead, a chain clanks in the dark, and the dog's cave is a silhouette with eyes. End of level.

### Stage 0: Test the assumptions
- [x] A4: walkthrough of the current game written to `docs/STATUS.md`, empty `?l1` route added, normal game unchanged. **Done 2026-11-12: pass.** 13 areas photographed (`docs/walkthrough/`); with and without `?l1`, 10 of 13 shots differ by under 1% and the other 3 by moving film or water only; no page errors. Laptop river bank 54 to 55 fps (was 52 to 53), wedding 53 to 60 (was 53 to 60); first load 73.2 MB (unchanged). Found and fixed rainbow water from the 1bbfc7a speed change (4 of 12 frames before, 0 of 12 after).
- [ ] A1: dock relit behind `?l1`, value split measured.
- [ ] A2: red thread test, fps cost measured.
- [ ] A3: 40 hooded shades test, fps measured on laptop and emulated phone.
- **Deliverable:** a pass or fail for A1 to A4, with numbers and screenshots (A5 waits for Karnika's painting).
- **Acceptance criteria:** each assumption marked pass or fail with its measurement.
- **Evidence Code must show:** screenshots of each test, the value split numbers, fps before and after.
- **Gate:** Karnika reads `docs/STATUS.md` and says "continue". If any assumption fails, stop and send it back to Chat.
- **Assets she supplies:** one painted portrait for A5, Karnika, whenever she's ready (does not block).

### Stage 1: The layout in grey boxes
- [ ] The whole route playable behind `?l1` with simple shapes and placeholder lighting: wake spot, thread, shade rows, Elpenor spot, dock hub, three branches (arcade, temple, cave), the return path, the ferry, the far bank landing.
- **Deliverable:** a level you can walk from waking to the far bank, made of grey shapes, with the thread leading the way. Existing models (arcade, temple, cave) may stand in where they already exist.
- **Acceptance criteria:** the route takes 8 to 15 minutes; the red lantern on the far bank is visible from the wake spot, the dock and the end of each branch; no dead ends without a reason.
- **Evidence Code must show:** a top-down map image of the route with timings, and a screenshot from each key spot.
- **Gate:** Karnika plays it for five minutes and says whether the shape is fun before any art goes on it.
- **Assets she supplies:** none.

### Stage 2: The first minute, finished
- [ ] Wake scene: black screen, water sound, eyes open, fog, cool shaft, the thread across his hand.
- [ ] The walk past the shades: they turn their heads; water ripples at his feet; the thread sways.
- [ ] Elpenor and the rule, using the existing free voices (new lines with Kokoro only).
- [ ] The far bank's red lantern and doorway, visible from the start.
- **Deliverable:** the first 60 to 90 seconds at final quality; the rest stays grey.
- **Acceptance criteria:** passes the look test for the river bank; at least 30 fps on laptop and emulated phone; no text on screen except subtitles.
- **Evidence Code must show:** a screenshot every 10 seconds of the first minute, the value split for three of them, fps.
- **Gate:** Karnika plays it, then shows it to two friends with no explanation. Both start walking within 15 seconds and both can say what Mikon wants.
- **Assets she supplies:** none.

### Stage 3: Make the underworld look like hell
- [ ] The cave relit: from sunlit sandstone to black wet stone, a candle path on the floor, one red light deep inside.
- [ ] The temple relit: one cold shaft on Icarus, black floor that reflects, candles at the base.
- [ ] The arcade and the dock as the drowned cathedral: columns in black water, rows of floor candles, haze.
- [ ] Red banners over the water near the ferry; the red key light used only past the river.
- **Deliverable:** every area of the level dressed and lit to the art bible.
- **Acceptance criteria:** each area passes its look test row; at least 30 fps everywhere; the first load is no heavier than 72.8 MB.
- **Evidence Code must show:** before and after screenshots of each area side by side, the value split per area, fps per area, load size.
- **Gate:** Karnika looks at the side-by-sides and approves each area.
- **Assets she supplies:** none.

### Stage 4: The three strands and the crowd
- [ ] The arcade strand: Theseus and Pirithous, the clue.
- [ ] The temple strand: a trial from `trials.js`, the reward.
- [ ] The cave strand: the coin and its owner.
- [ ] Each strand of thread turns gold when its part is done.
- [ ] The crowd of the unburied presses in once Mikon has the coin; candles go out where shades gather.
- **Deliverable:** the middle of the level is playable and finished.
- **Acceptance criteria:** the strands work in any order; the crowd is tense but fair (Karnika can get through on her second try at most); at least 30 fps with the crowd at its biggest.
- **Evidence Code must show:** a short list of each strand's steps with a screenshot each; fps at the crowd's peak.
- **Gate:** Karnika plays the middle and says it's fun.
- **Assets she supplies:** none.

### Stage 5: The crossing and the ending
- [ ] Charon chooses Mikon; paying the coin.
- [ ] The crossing: slow, calm, red banners over black water, the shades' reflections.
- [ ] The far bank: red doorway, a chain in the dark, the dog's cave with eyes. End of level.
- **Deliverable:** the last two to three minutes, finished.
- **Acceptance criteria:** passes the look test; at least 30 fps; the end is clearly an end.
- **Evidence Code must show:** screenshots of the crossing and the ending, fps.
- **Gate:** Karnika plays from the dock to the end.
- **Assets she supplies:** none.

### Stage 6: Feel (the bruno-simon pass)
- [ ] The camera glides: smooth starts and stops, a gentle sway when walking, no sudden jumps.
- [ ] Everything near the player reacts: water ripples, candle flames lean, cloth and banners move, shades turn.
- [ ] Sound reacts too: footsteps on wet stone, water, distant murmur that grows near the crowd.
- [ ] The frame rate stays steady (no stutters over 100 ms during play).
- **Deliverable:** the whole level, polished in feel.
- **Acceptance criteria:** at least 30 fps everywhere with fewer than five frames over 100 ms in a full run on the laptop.
- **Evidence Code must show:** a full-run frame-time log and the numbers.
- **Gate:** Karnika plays the whole level start to finish.
- **Assets she supplies:** none.

### Stage 7: The friend test, then make it the real level
- [ ] Run the hook test and finish test from section 3 with five friends (Karnika runs it; Code prepares a one-page checklist she can follow).
- [ ] Fix only what the test shows, through the feedback step (numbered list, confirmed first).
- [ ] With Karnika's yes, make `?l1` the normal level 1.
- **Deliverable:** level 1 that passes every test in section 3.
- **Gate:** Karnika says yes to making it the default. Updating the public site is a separate yes.
- **Assets she supplies:** five friends' time, Karnika, whenever she chooses.

## 10. Later list (out of scope for now)
- Relighting the opening wedding film from a sunset courtyard to the candlelit quarry in the art bible (the next project after this one).
- The rest of Chapter I's story beats from the screenplay, and every other chapter in `docs/game-design.md`.
- The character overhaul: bare Thea and Mikon on the `cast-build` branch, `clothes-agent`, better faces in 3D.
- Making the first load lighter (from 72.8 MB toward the 60 MB budget).
- Recording voices with ElevenLabs.
- The full Codex as handwritten pages with red ink and pins.
- Scrubbing old Claude credit lines from git history.
- Updating the public site.

## 11. Permissions
**Code may do these without asking:**
- Read and edit files in this project folder.
- Run the game on her laptop (a local preview) and run `tools/perf.mjs` and `tools/asset_sizes.mjs`.
- Make normal git commits as Karnika Sehgal (no Claude co-author line) and push to `origin main`.

**Code must ask Karnika first, and wait for a clear yes for that specific item:**
- Spending any paid credits (show the cost first; a yes covers that one batch only).
- Downloading or installing anything (tools, packages, models, textures, images, sounds).
- Publishing anything publicly, including updating coin.klickbaitbyk.com.
- Any action on one of her accounts.
- Any heavy local job (a long render, a simulation, Blender work), with a warning about heat and time.
- Replacing anything she already approved, including making `?l1` the default. Show a side-by-side first.
- Merging a branch into `main`, force-pushing or rewriting git history.

## 12. Stop conditions
Code stops, writes `docs/STATUS.md`, and sends the work back to Chat when:
- an assumption in section 8 fails its test;
- the plan conflicts with a constraint in section 4 (for example, a stage can't reach 30 fps);
- Karnika asks for something that is not in this plan (that is a change, not a defect);
- a step would need a permission she has not given.

## 13. Decision log
| Date | Decision | Why | Options we did not choose |
|---|---|---|---|
| 2026-11-12 | Level 1 runs from waking on the black beach to stepping off on the far bank; the wedding stays a film | Matches "Chapter I, reworked" in `docs/game-design.md`; one place made great | Making the wedding playable |
| 2026-11-12 | Stay first person | Keeps Mikon's body and clothes (the weakest part) off screen; softness comes from the camera and the reacting world | Following Mikon from behind like bruno-simon.com's car |
| 2026-11-12 | A red thread is the guide; no arrows or markers | The board's main new motif; works as Ariadne's thread and the Fates' cut thread; gives the "world reveals itself" feel | A HUD with objectives and a minimap |
| 2026-11-12 | The dock is a hub with three strands in any order | Fixes "too simple, a straight line" | A longer straight path |
| 2026-11-12 | The dead are hooded or veiled, never close up in 3D; faces only in painted close-ups | Free 3D can't match couture photography up close | A full 3D character overhaul now |
| 2026-11-12 | Red key light only past the river; the river bank keeps its cool shaft | Hell needs its own light, but red everywhere stops being special | Red light everywhere |
| 2026-11-12 | Free tools only, no paid credits | No budget was set; voices stay on the free on-device voices | ElevenLabs for new lines |
| 2026-11-12 | Everything behind `?l1` until Stage 7 | The current game keeps working while the new level is built | Changing the live level directly |

## 14. Learning notes
LEARNING.md was not available when this plan was written, so treat every technical idea as new and explain it in one or two plain sentences the first time it comes up. Ideas likely to come up:
- **Grey box (greybox):** building a level out of plain shapes first to test whether the route is fun before spending effort on art.
- **Frame rate (fps):** how many pictures a second the game draws; below about 30 it starts to feel choppy.
- **URL flag (`?l1`):** a word added to the end of the game's address that switches on the new level, so the old one keeps working.
- **Value split:** how much of a picture is dark, mid-tone or bright, measured from a screenshot.
- **Branch and merge (git):** a branch is a separate copy of the work; merging brings it back into the main version.
- **Cache version (`coin-vNN`):** a name that tells browsers to fetch the new files instead of an old saved copy.
