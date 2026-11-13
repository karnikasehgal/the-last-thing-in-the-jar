# PLAN: The Coin, fixing what bothers Karnika (the wedding first)

**Version:** v1
**Date:** 2026-11-13
**Status:** Approved on 2026-11-13. Karnika confirms the fix list below by pasting the prompt that starts this plan; if she adds items in that message, add them to the list before starting.
**Project folder:** `~/Documents/elpis`. Progress goes in `docs/STATUS.md`. House rules: `CLAUDE.md`. Art bible: `docs/references.md` (see "Wedding scene direction"). Other plans: `docs/PLAN-level1.md`, `docs/PLAN-hell.md`, and the order between them in `CLAUDE.md`.

### Change notes
- v1 (2026-11-13): First version, from everything Karnika has said bothers her, as far as Chat could see it.

---

## 1. Goal
Fix the things Karnika keeps saying are wrong, starting with the wedding: it is the first thing every player sees, and today it is a sunset courtyard while the art bible and her approved style frame are a candlelit quarry at night. Then make the opening interesting enough that people want to keep going.

## 2. Audience and medium
- **Who it is for:** anyone who opens the game; the wedding is their first impression.
- **What it is:** the opening film and first minutes of the existing three.js game in `public/play/` (`wedding.js`, `people.js`, `game.js`).
- **Where people will see it:** laptop browser first; phone in LITE mode.

## 3. The fix list (Karnika confirms this)
Things she has said bother her, and where each one gets fixed:

| # | What bothers her | Where it's fixed |
|---|---|---|
| F1 | The wedding is a sunset courtyard; it should be the candlelit quarry at night from her approved style frame | **This plan**, Stage 1 |
| F2 | The characters look bad up close | **This plan**, Stage 2 (framing and styling); painted close-ups once her paintings exist (`docs/PLAN-level1.md`, A5) |
| F3 | Clothes that don't fit (cloth poking through bodies, wrong shapes) | **This plan**, Stage 2 |
| F4 | The opening isn't interesting; it doesn't hook | **This plan**, Stage 3 |
| F5 | The style isn't aesthetic or rebellious enough; she wants fashion detailing | **This plan**, Stage 4 (Hermes, the first god you meet), using the style rule in `docs/pin-stories.md` (everyone gets the couture look) |
| F6 | Hell doesn't look like hell (sunlit sandstone arcade, sunrise sea cave, glowing river) | `docs/PLAN-level1.md`, Stage 3 |
| F7 | The first level is a straight line and too simple | `docs/PLAN-level1.md`, Stages 1 and 4 |
| F8 | It doesn't feel playful or smooth like bruno-simon.com | `docs/PLAN-level1.md`, Stage 6 |
| F9 | The first load is heavy (73 MB) | Later list |

## 4. Definition of done
1. **Wedding look:** screenshots of the wedding at six fixed moments, put side by side with `look-test/Style frame 1 wedding.jpg`, and Karnika says they match. Each passes the wedding value rule in `docs/references.md` (45 to 55 percent near-black; highlights about 10 percent, almost all candle flames).
2. **Clothes:** every character seen in the wedding passes `tools/check_clipping.mjs` with no visible clipping in the shots the film actually uses.
3. **Hook:** three friends watch the opening with no explanation; all three are still watching when Mikon wakes, and at least two say they want to keep playing.
4. **Speed:** at least 30 fps through the wedding on the laptop and the emulated phone.
5. **Weight:** the first load is no heavier than today (73.2 MB).

## 5. Constraints
- Free tools only; no paid credits (the painted close-ups are made by Karnika in her own tool). New lines use the existing free on-device voices.
- No deadline. Laptop limits as in `CLAUDE.md` (one Blender at a time, never with the game open; no cloth simulation).
- Work behind a URL flag (`/play/?fix`) until Karnika approves each stage; then it becomes the normal game.

## 6. Quality tier
- **Chosen tier:** free tools.
- **What this tier can achieve:** light, candles, water, stone, cloth hanging still or swaying gently, and people seen at a distance or in shadow. Example: Karnika's own approved style frame `look-test/Style frame 1 wedding.jpg` and the game's current river bank.
- **What it cannot achieve:** realistic faces and couture clothes up close that move like the photographs on her board. So the camera keeps 3D faces small or in candle shadow, and faces up close come from her painted portraits.

## 7. Taste extract
- **She wants:** the art bible's wedding: a quarried stone hall at night with black water down the middle, hundreds of candles, ivory fabric in the upper third, guests in black and charcoal, the bride in ivory liquid silk with a long sheer veil, one burgundy drape as the only red, and the candles going out row by row at the turn to the funeral. Aesthetic, rebellious, fashion detailing.
- **She does not want:** sunsets, bright or sunny looks, Pixar, clothes that don't fit, characters that look cheap up close.
- **Always avoid:** anything that looks AI-generated or generic.

## 8. Unverified assumptions
| # | Assumption | Test | Pass threshold |
|---|---|---|---|
| B1 | The wedding can be relit to night and candles without losing speed | Relight the wedding behind `?fix` with candle clusters (a few real lights, the rest glowing sprites) | At least 30 fps on laptop and emulated phone; value split in range |
| B2 | Framing alone can hide the weak faces | Re-frame the six key wedding shots so faces are small or in candle shadow | Karnika looks at the six shots and says no face bothers her |
| B3 | Making the olive moment playable is more interesting than watching it | A grey test: as Mikon at the table, the player can look around and pick up the olive; the joke lands, he laughs, he chokes | Three friends: at least two laugh or react out loud, and all three want to see what happens next |

## 9. Stages
Code ticks each box with the date and numbers, and updates `docs/STATUS.md` at every gate.

### Stage 0: Measure the wedding as it is
- [x] Screenshots of the wedding at six fixed moments, side by side with the style frame, with the value split for each. **Done 2026-11-13:** `docs/fixes/wedding-stage0.jpg`; dark 13 to 41% (style frame 39.5%, rule 45 to 55%); bright 0 to 0.5%.
- [x] How long from pressing Enter to the moment the player can first move. **Done 2026-11-13:** 250 s from Begin (film about 160 s, then about 90 s with Hermes), plus the chapter card.
- [x] A clipping report (`tools/check_clipping.mjs`) for every character seen in the wedding, worst first. **Done 2026-11-13** for the 8 named characters: Kleio 20 of 20 clips fail, Thea 5 of 20, Nikias 6 of 21, dancer 16 of 20, Mikon 15 of 21, Lykon 4 of 21, piper 1 of 21, Demeas 0. The 19 crowd extras aren't checked.
- **Gate:** Karnika reads `docs/STATUS.md`. Nothing changes in this stage.

### Stage 1: Relight and rebuild the wedding (F1)
- [ ] Night; the quarry walls; black water down the middle; candle clusters; ivory fabric in the upper third; one burgundy drape; haze; one cool shaft from a high opening.
- [ ] The turn to the funeral: candles go out row by row, the red spreads.
- **Acceptance:** B1 passes; the six shots pass the value rule; Karnika approves the side-by-side.
- **Gate:** Karnika approves, then it becomes the normal wedding.

### Stage 2: The people at the wedding (F2, F3)
- [ ] Fix the worst clipping first, until the shots the film uses show none.
- [ ] Guests in black and charcoal; Thea in ivory silk with a long sheer veil; the older women hooded.
- [ ] Re-frame the shots so 3D faces are small or in candle shadow (B2).
- **Acceptance:** clipping numbers before and after; Karnika approves the six shots.
- **Gate:** Karnika approves.

### Stage 3: Make the opening interesting (F4)
- [ ] If Enter-to-first-move is longer than 90 seconds, tighten the film to the beats that matter, and make sure a skip button is always there.
- [ ] Test B3 (the playable olive). If it passes, build it properly; if not, keep the film.
- **Acceptance:** the hook test in section 4 passes.
- **Gate:** Karnika runs the test with three friends (Code prepares a one-page sheet).

### Stage 4: Fashion pass on Hermes (F5)
- [ ] Restyle Hermes, the first god the player meets, by the style rule in `docs/pin-stories.md` (everyone gets the couture look: sharp tailoring, sheer layers, silver, boots), keeping his winged hat and herald's staff so he's still recognisably Hermes.
- **Acceptance:** before and after side by side; still at least 30 fps; Karnika approves.
- **Gate:** Karnika approves. If she likes it, the same treatment goes to every character, mortals included, in later stages of the other plans.

## 10. Later list
- Making the first load lighter (F9).
- Restyling every other character.
- Replacing the 3D cast with a new one (`cast-build` branch).

## 11. Permissions
As in `CLAUDE.md`. In short: Code may edit, run, measure, commit as Karnika (no Claude line) and push. It must ask first before spending credits, downloading anything, Blender or any heavy job, publishing, merging branches, rewriting history, or replacing something she approved without a side-by-side.

## 12. Stop conditions
Stop, update `docs/STATUS.md` and send it back to Chat when an assumption fails, a constraint can't be met (for example the candlelit wedding can't reach 30 fps), she asks for something outside this plan, or a step needs a permission she hasn't given.

## 13. Decision log
| Date | Decision | Why | Not chosen |
|---|---|---|---|
| 2026-11-13 | The wedding is fixed first among the small things | It's every player's first impression, and its target look is already approved | Fixing it after level 1 |
| 2026-11-13 | Faces are hidden by framing and shadow, not rebuilt | Free 3D faces don't hold up close; painted close-ups take over later | A new 3D cast now |
| 2026-11-13 | A playable olive is tested, not assumed | It could be the hook, but it changes the opening; friends decide | Making it playable without a test |
| 2026-11-13 | Hermes goes first in the fashion pass | He's the first god you meet; one character proves the style before it spreads | Restyling everyone at once |

## 14. Learning notes
LEARNING.md wasn't available, so explain each technical idea in a sentence the first time: clipping (clothing that pokes through the body), value split (how much of a picture is dark, mid or bright), framing (where the camera points and how close), URL flag (`?fix`, a switch that turns on the new version while the old one keeps working), frame rate (pictures per second; below about 30 feels choppy).
