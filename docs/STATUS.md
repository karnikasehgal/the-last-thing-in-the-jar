# Status, 12 November 2026

## Where things stand
- **Plan:** `docs/PLAN-level1.md`, Stage 0. Step A4 is done (below). Next step: A1, relight the dock behind `?l1` and measure how dark it is.
- **Speed (laptop, two runs, `tools/perf.mjs`):** river bank 54 to 55 fps, wedding 53 to 60 fps. Phone (emulated, measured earlier today): river bank 46 fps, wedding 31 to 41 fps with slow moments at 20. First load 73.2 MB (budget 60). Details in `docs/budgets.md`.
- **Cache version:** `coin-v66`.
- **Branches not merged:** `cast-build` (bare 3D Thea and Mikon; they didn't reach their model sheets) and `clothes-agent` (cloth experiments). Both wait for the character overhaul in the plan's later list.
- **Waiting for your yes:** fixing the small errors found in `CLAUDE.md`, `docs/references.md` and the plan (reported in chat today); approving the light rocks (`look-test/Rocks before vs after.jpg`); scrubbing old Claude credit lines from git history.

## Step A4: the current game, area by area
Taken today at fixed camera spots with the random scenery seeded, so the same shots can be retaken after any change. Full-size originals are on the laptop only; the copies here are small.

| # | Area | What happens there | Picture |
|---|---|---|---|
| 1 | Start screen | An inked palace map of the underworld; each chapter is a room. Chapter I, The Coin, is lit; II, The Lyre, is playable; III to VIII say "soon". | ![](walkthrough/01-start-screen.jpg) |
| 2 | Chapter card | "How to play": talk to people, find the coin in the dog's cave, put the dog to sleep with the honey cake from the temple altar, run the coin to Charon at the end of the dock. | ![](walkthrough/02-chapter-card.jpg) |
| 3 | Wedding film | The opening film: Thea's wedding in a courtyard at dusk, Lykon saving Mikon a seat, the olive. Played as a film, not playable. | ![](walkthrough/03-wedding-film.jpg) |
| 4 | Arcade (start) | Mikon wakes in a sandstone arcade with paintings on the wall; Hermes is waiting a few steps ahead and explains he's dead. | ![](walkthrough/04-arcade-hermes.jpg) |
| 5 | Elpenor's camp | On the beach below the arcade: Elpenor (the sailor) and the waiting dead, jars, baskets, a lantern on his bench. He tells you how to get the coin. | ![](walkthrough/05-elpenor-camp.jpg) |
| 6 | Sunrise cave | The sea cave at the west end of the bank, opening on a painted sunrise. | ![](walkthrough/06-sunrise-cave.jpg) |
| 7 | Temple | Domed temple with stained glass and the falling Icarus; the altar with the honey cake; Theseus and Pirithous stuck to their stone chairs. | ![](walkthrough/07-temple.jpg) |
| 8 | Dog's cave | Heaped boulders at the east end of the bank; the dog guards the only coin. | ![](walkthrough/08-dogs-cave.jpg) |
| 9 | Dock and boat | The wooden dock into the glowing river; Charon's ferry at the end. Paying him ends Chapter I. | ![](walkthrough/09-dock-and-boat.jpg) |
| 10 | The river | Looking from the dock across the Styx to the far bank; Charon on his boat. | ![](walkthrough/10-river-to-far-bank.jpg) |
| 11 | Far bank, the gate | Landing, torches, and the gate where the dog waits (used in Chapter II). | ![](walkthrough/11-far-bank-gate.jpg) |
| 12 | Sisyphus | The field with Sisyphus and his boulder (Chapter II). | ![](walkthrough/12-sisyphus.jpg) |
| 13 | Hades' hall | The thrones of Hades and Persephone (Chapter II). | ![](walkthrough/13-hades-hall.jpg) |

**The `?l1` switch:** added to `public/play/game.js` (5 lines). It marks the page and does nothing else yet. All 13 shots were retaken after the change, both normally and with `?l1`, and compared pixel by pixel: 10 of 13 differ by less than 1 percent (water, flames and film grain move between shots). The other three were checked by eye: the wedding film is a moving film caught at slightly different moments, and the dock and river showed rainbow smears on the water in some shots, with and without `?l1`.

**A bug found along the way and fixed:** the rainbow water came from the speed change of this morning (1bbfc7a). The river's mirror was refreshed every other frame, and sometimes it was refreshed during the soft-shadow pass, which paints every surface in diagnostic colours. The mirror now skips that pass. Twelve frames of the dock in a row: 4 of 12 had rainbow water before the fix, 0 of 12 after (`look-test/Water before fix (4 of 12 rainbow).jpg` and `Water after fix (0 of 12).jpg`).

**Unexplained:** one of five wedding test loads earlier today timed out while starting up, with no error message. The retry worked.

**Result for A4:** pass. The normal game and the opening film play as before, with no page errors in any run; speed is the same within run-to-run noise (river bank 52 to 53 fps before, 54 to 55 after; wedding 53 to 60 before, 53 to 60 after).
