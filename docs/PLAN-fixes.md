# PLAN: The Coin, fixing what bothers Karnika

**Version:** v2.2
**Date:** 2026-11-13
**Status:** Approved on 2026-11-13. Karnika re-sent her feedback as a plan request; Chat took its own recommendations for every open question.
**Project folder:** `~/Documents/elpis`. Progress goes in `docs/STATUS.md`. House rules: `CLAUDE.md`. Art bible: `docs/references.md`. Pin stories and the style rule (everyone is couture): `docs/pin-stories.md`. Other plans: `docs/PLAN-level1.md`, `docs/PLAN-hell.md`.

### Change notes
- v2.2 (2026-11-13): Karnika: the wedding inspiration is the wedding pins on her Pinterest board, and only those. No separate inspiration folder.
- v2.1 (2026-11-13): The wedding and the choke are no longer drawn in 3D. They become a film made of Karnika's photoreal still images (the same kind of picture as `look-test/Style frame 1 wedding.jpg`), with slow camera moves, flickering candles, rippling water and sound layered on. Reason: Karnika asked why the game looks nothing like the style frame. The style frame is a still image made by an AI image tool, not something the game drew, and real-time 3D in a browser with free character models cannot reach it. Stills can, because they are the same kind of image. The 3D game starts when Mikon wakes. Stop all further work on the 3D wedding (`fixwedding.js` stays behind `?fix`, untouched).
- v2 (2026-11-13): Rebuilt from Karnika's playtest feedback of 13 November. New: the story opens on the choke (cold open) and the wedding becomes flashbacks; the olive hand clipping; the narrating line; sound cutting out; the ghosts and the river; the temple; Charon, Hermes and Elpenor; mini-games replaced by walk-in side worlds. The wedding night work already done (old Stage 1, first box) carries over into Stage 3. The river, the shades and the temple move here from `docs/PLAN-level1.md` Stage 3.
- v1 (2026-11-13): First version (the wedding first).

---

## 1. Goal
Fix what Karnika sees as broken when she plays, and give the game a hook. Today a player waits about 250 seconds after pressing Begin before they can move, watching a wedding she finds boring. After this plan, the game opens on the choke, drops the player into the underworld within the first minute, and tells the wedding later as flashbacks. Everything she called out (sound, the olive hand, a line that explains what we can see, the ghosts, the river, the temple, three characters, the mini-games) is fixed and checked.

## 2. Audience and medium
- **Who it is for:** anyone who opens the game; the first minute decides whether they stay.
- **What it is:** the existing first-person three.js game in `public/play/`.
- **Where people will see it:** laptop browser first; phone in LITE mode. Mini-games are designed for laptop play first.

## 3. The fix list (confirmed by Karnika's feedback, 13 November)
| # | What bothers her | What it should be instead | Type | Stage |
|---|---|---|---|---|
| F1 | The story starts slow; the wedding comes first and it's boring | Open on the choke; wake in the underworld; the wedding comes back as flashbacks | Change | 2 |
| F2 | His hand passes through his head when he brings the olive to his mouth | Hand and olive meet his mouth cleanly | Defect | 1 |
| F3 | He narrates what we can see ("everyone I loved was leaning over me…", `game.js` line `w_vo1`) | Cut it; the picture and sound tell it. Check every voiceover line for the same problem | Defect | 1 |
| F4 | Sound cuts out in several places | No gaps or clipped lines anywhere in a full playthrough | Defect | 1 |
| F5 | The wedding still looks off and boring | Only the wedding pins on her board, and the approved style frame; something alive happening on screen | Defect | 3 |
| F6 | Random ghosts on the river bank look off | Hooded shades in layered sheer cloth, standing still in rows in the water (pin 641481540721805879) | Defect | 4 |
| F7 | The river looks weird | Black, still, mirror-like water that only reflects light; no glow | Defect | 4 |
| F8 | The temple with the honey cake looks disgusting | Dark; one cold beam on Icarus; black reflective floor; candles round the honey cake | Defect | 5 |
| F9 | Charon, Hermes and Elpenor look off | Restyled in the couture look, faces in shadow; painted close-ups later | Change | 6 |
| F10 | The mini-games are basic screen puzzles laid over the game | Side quests you walk into: a world inside the world | Change | 7 |
| F11 | The phone wedding runs at 24 fps | At least 30 fps (becomes easier once the wedding is short flashbacks) | Defect | 3 |

## 4. Definition of done
1. **Hook:** three friends start the game with no explanation. All three are still playing one minute after the wake, and at least two say they want to know what happened at the wedding.
2. **Time to play:** from pressing Begin to moving freely in the underworld takes 60 seconds or less (today: about 250).
3. **Sound:** a full playthrough log shows no gaps or clipped lines.
4. **No narration of the obvious:** every voiceover line is checked; none describes what the picture already shows.
5. **Look:** side-by-sides for the wedding, river bank and temple, each against its reference, approved by Karnika; each passes its value rule in `docs/references.md`.
6. **Characters:** Charon, Hermes and Elpenor before and after, approved by Karnika.
7. **Side world:** two friends play the first walk-in side quest; both finish it and both call it a real part of the game, not a puzzle screen.
8. **Speed and weight:** at least 30 fps everywhere on laptop and emulated phone; first load no heavier than 73.2 MB.

## 5. Constraints
- Free tools only; no paid credits. New or changed lines use the existing free on-device voices.
- No deadline. Laptop limits in `CLAUDE.md` (one Blender at a time, never with the game open, no cloth simulation).
- Big changes run behind `/play/?fix` until Karnika approves them; then they become the normal game. The public site is updated only with her yes for that update.

## 6. Quality tier
- **Chosen tier:** free tools.
- **Can achieve:** light, candles, black water, stone, sheer layered cloth that sways, couture silhouettes, people seen at a distance or in shadow. Example: `look-test/Style frame 1 wedding.jpg` and `look-test/Style frame 2 river bank.jpg`, both approved by Karnika.
- **Cannot achieve:** realistic faces and couture detail up close. Faces stay small or in shadow; close-ups come from her painted portraits.

## 7. Taste extract
- **She wants:** her vision board followed, visibly: dark theatrical couture, black, blood red, ivory, silver, gold, candles, single beams of light, haze, black reflective water, red fabric and red thread, hooded and veiled figures in sheer layers, everyone dressed couture (aesthetic and rebellious, fashion detailing). A hook first, then the story. Side quests that feel like real places.
- **She does not want:** a slow start; characters saying what we can see; clothes or hands passing through bodies; bright, colourful or busy rooms (the current temple); glowing water; generic ghosts; screen-overlay puzzles.
- **Always avoid:** anything that looks AI-generated or generic.

## 8. Unverified assumptions
| # | Assumption | Test | Pass threshold |
|---|---|---|---|
| C1 | A cold open on the choke hooks people better than the wedding first | Grey cut of the new opening behind `?fix` (choke, black, wake) shown to three friends | All three keep playing a minute after the wake; at least two ask or want to know what happened |
| C2 | A walk-in side world is fun and buildable in the browser | Grey version of the first side world (Stage 7) | Two friends finish it; at least 30 fps; it loads only when entered |
| C4 | Karnika's own still images, with motion drawn over them, look like the style frame inside the game | Her single test image s05 (Demeas's toast) shown in the stills player with a slow push in, candle flicker and water ripples | Karnika looks at it next to `look-test/Style frame 1 wedding.jpg` and says it belongs in the same world |
| C3 | Removing the random ghosts and adding still rows of sheer shades stays fast | 40 shades in one to three sheer layers standing in the water | At least 30 fps on laptop and emulated phone |

## 9. Stages
Code ticks each box with the date and numbers, and updates `docs/STATUS.md` at each gate.

### Stage 0: Measure the wedding as it is
- [x] Screenshots of the wedding at six fixed moments, side by side with the style frame, with the value split for each. **Done 2026-11-13:** `docs/fixes/wedding-stage0.jpg`; dark 13 to 41% (style frame 39.5%, rule 45 to 55%); bright 0 to 0.5%.
- [x] How long from pressing Enter to the moment the player can first move. **Done 2026-11-13:** 250 s from Begin (film about 160 s, then about 90 s with Hermes), plus the chapter card.
- [x] A clipping report (`tools/check_clipping.mjs`) for every character seen in the wedding, worst first. **Done 2026-11-13** for the 8 named characters: Kleio 20 of 20 clips fail, Thea 5 of 20, Nikias 6 of 21, dancer 16 of 20, Mikon 15 of 21, Lykon 4 of 21, piper 1 of 21, Demeas 0. The 19 crowd extras aren't checked.
- **Gate:** Karnika reads `docs/STATUS.md`. Nothing changes in this stage.
- [ ] Full playthrough recorded with sound; every gap or clipped line listed with its time and place (F4).
- [ ] Every voiceover line listed, with the ones that describe what the picture already shows marked (F3).
- [ ] Where the river bank's current ghosts come from, and why the river glows (F6, F7).

### Stage 1: Quick fixes (F2, F3, F4)
- [ ] ~~The olive hand clipping~~: no longer needed, because the choke becomes still images (v2.1). Skip this box.
- [ ] Cut `w_vo1` ("One moment I was laughing…"), and cut or rewrite every other line marked in Stage 0. The fading picture and muffled sound carry the choke.
- [ ] Fix every sound gap from Stage 0.
- **Gate:** a replay log with no gaps; before-and-after frames of the olive; the list of cut lines. Karnika plays the choke.

### Stage 2: The stills player and the cold open (F1)
- [ ] A stills player for cutscenes: shows Karnika's images full screen one after another with a slow camera move on each (push in, drift, crane), flickering candle light and rippling water drawn over the picture, subtitles, voices and sound. Use the existing portrait mode (`/play/?portraits`) and `tools/placeholder_portraits.mjs` where they help. Until her images arrive, it runs on placeholders.
- [ ] The cold open, as stills: black; laughter and music; the candlelit table; Demeas's toast; the goat joke; the hand reaching for the olive; the olive at his lips; the laugh; the choke, with the picture fading and the sound going underwater, no narration; black. He wakes on the black beach (the 3D game starts here).
- [ ] The wedding returns as two or three short flashbacks of stills during level 1, at moments that earn them (for example when Elpenor asks how he died, or when he finds the coin), ending with the funeral.
- [ ] Test C1 (the hook) and C4 (stills match the style frame).
- **Acceptance:** Begin to moving freely in 60 seconds or less; C1 and C4 pass.
- **Gate:** Karnika plays the new opening with her real images, then runs the friend test (Code prepares a one-page sheet).
- **Assets she supplies:** her still images, made in her own image tool from the prompts in `docs/paintings.md`, dropped into `paintings-in/`. First the single test image **s05 (Demeas's toast)** for C4, then the cold open set (**s01, s05, s06, s07, s08, s09, s10, s12, s13**), then the flashbacks (**s02, s03, s04, s11, s14, s15, s16**). Karnika sets the date for each batch.

### Stage 3: The wedding images (F5, F11)
- [ ] The wedding is built **only** from the wedding pins on Karnika's board (https://in.pinterest.com/karnika0801/game-design/; view them, never download them). Before she generates the wedding set, Code checks every wedding prompt in `docs/paintings.md` against these pins, removes anything that doesn't come from them, and shows her what changed:
  - 641481540721805627: candlelit quarry banquet over a dark pool (layout, candles in niches, the long table on the water)
  - 641481540721805756: banquet along a straight black water channel in a pale cave hall (the one-point view, tea lights, guests in black)
  - 641481540721953942: immersive dining inside a quarry at dusk (scale, the quarry walls as the room)
  - 641481540721805616: a hall drowned in ivory fabric (fabric overhead and over seating, only in the upper part of the frame)
  - 641481540721805610: garden aisle with a flowing white arch and white pillar candles (the arrival)
  - 641481540721805606: a ruined arch veiled in burgundy (the only red, at the edge; it spreads at the funeral)
  - 641481540721805764: clusters of white pillar candles with drips
  - 641481540721806358 and 641481540721805567: Thea's ivory liquid satin gown and fine hair chains
  - 641481540721981113: a couple in front of a projection at their reception, then walking down the aisle (check it on the board; use it only if it reads as part of this look)
- [ ] Every still checked against the art bible before it goes in: night, candles, the black water channel, guests in couture black and charcoal, Thea in ivory silk with a long sheer veil, one burgundy drape, no bright red or orange.
- [ ] Phone check: the stills player runs at at least 30 fps on the emulated phone (it should be far lighter than the 3D wedding).
- **Gate:** side by side with the wedding pins (described in writing) and `look-test/Style frame 1 wedding.jpg`; Karnika approves.
- **Assets she supplies:** none beyond the stills listed in Stage 2.

### Stage 4: The river bank (F6, F7)
- [ ] Remove the random ghosts; add hooded shades in layered sheer cloth, still, in rows, standing shin-deep in the water (test C3 first).
- [ ] Black, still, mirror-like water; no glow; reflections of the cool shaft and candles only.
- **Gate:** before and after next to `look-test/Style frame 2 river bank.jpg`; value split; fps. Karnika approves.

### Stage 5: The temple (F8)
- [ ] Dark: one cold beam from the dome on the falling Icarus; black floor that reflects; candles round the honey cake; the stained glass dimmed to a deep glow or removed; no bright mosaic.
- **Gate:** before and after; value split; Karnika approves.

### Stage 6: Charon, Hermes and Elpenor (F9)
- [ ] One at a time, Hermes first: couture styling by the rule in `docs/pin-stories.md` (sharp tailoring, sheer layers, hoods, silver, boots), each still recognisable (Hermes' winged hat and staff, Charon's pole and lantern, Elpenor's oar). Faces kept in shadow.
- **Gate:** before and after for each; Karnika approves each before the next.

### Stage 7: A world inside the world (F10)
- [ ] The first side quest replaces the temple's screen puzzle: touch the Icarus statue and step into **Daedalus's stair maze**, a dark space of stairs going up and down in every direction, lit by candles, with red thread to follow. Climb out to earn the reward (the honey cake). Built grey first (test C2), then dressed.
- [ ] If C2 passes and Karnika likes it, list the other screen puzzles in `trials.js` with a proposed world for each (for example the Fates' red-thread hall), for her to choose from. Don't build them in this plan.
- **Gate:** two friends play it (definition of done 7); Karnika approves.

## 10. Later list
- Replacing the other mini-games with side worlds (after Stage 7 proves one).
- Restyling every other character.
- The first load (73.2 MB toward 60 MB).
- A new 3D cast (`cast-build` branch).

## 11. Permissions
As in `CLAUDE.md`: Code may edit, run, measure, commit as Karnika (no Claude line) and push. It asks first before spending credits, downloading anything, Blender or any heavy job, publishing (including the public site), merging branches, rewriting history, or replacing something she approved without a side-by-side.

## 12. Stop conditions
Stop, update `docs/STATUS.md` and send it back to Chat when a test fails (C1 to C3), a constraint can't be met, she asks for something outside this plan, or a step needs a permission she hasn't given.

## 13. Decision log
| Date | Decision | Why | Not chosen |
|---|---|---|---|
| 2026-11-13 | The wedding and the choke become a film of Karnika's photoreal stills with motion; 3D starts at the wake | The style frame is an AI-made still; a browser game with free character models can't draw that, but stills can match it because they're the same kind of picture | Keep polishing the 3D wedding; paid AI video (needs credits); a 3D artist |
| 2026-11-13 | Open on the choke; the wedding becomes flashbacks | Karnika: hook first, story after; today players wait about 250 s before moving | Wedding first; a playable olive (v1's idea) |
| 2026-11-13 | Cut lines that describe what we can see | Karnika: the picture already shows it | Keeping the narration |
| 2026-11-13 | Code finds the sound gaps itself with a full recorded playthrough | Karnika shouldn't have to remember where they were | Asking her to list them |
| 2026-11-13 | First side world is Daedalus's stair maze, entered through the Icarus statue | Uses her stairs pin and the temple she hates; Icarus is Daedalus's son; proves the idea in one place | Replacing every mini-game at once |
| 2026-11-13 | Quick fixes before the cold open, then the look | Small broken things first, so every later test isn't spoiled by them | Look first |
| 2026-11-13 | Hermes first among the characters | He's the first character you meet in the underworld | All three at once |

## 14. Learning notes
LEARNING.md wasn't available, so explain each technical idea in a sentence the first time: cold open (a story that starts at its most dramatic moment, then goes back), flashback, clipping (one thing passing through another), value split, URL flag (`?fix`), frame rate, playthrough log (a recording of a full play with every sound event listed).
