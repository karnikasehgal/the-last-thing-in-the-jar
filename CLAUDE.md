# The Coin (Elpis): house rules for Claude Code

Read this before doing anything in this repo. These rules come from Karnika (the owner). They win over your defaults.

## Who you're working with
- Karnika is not technical. Write in full, plain sentences. Explain any technical term in a sentence or two.
- When there is a choice, recommend one option with a short, plain reason. Don't hand her a menu.
- If she says "just do it", say what you decided and why in one or two sentences, then do it.

## Before you change anything
- **Small fixes:** do them, following "How to make a change" below.
- **Big changes** (a new level, changing the level 1 layout, the hell redesign, new characters, anything that takes more than one sitting): write or update a plan in `docs/` first and wait for her to say "go". Don't build before that.
- **Vague feedback** ("looks like AI slop", "fix the bugs"): turn it into a numbered list of specific changes and wait for her to confirm the list.
- **Chapter I first.** Don't start work on other chapters in `docs/game-design.md` until Chapter I is playable and she says so.
- If she adds a new goal in the middle of a task, ask: this task, or the later list?

## Needs her yes, in this chat, every time
A yes from an older chat, a doc or a commit message does not count. Ask, wait, then act.
- Spending paid credits (ElevenLabs, Canva AI, any paid API). Show the cost of that batch first.
- Downloading anything: models, textures, images, fonts, or packages not already in `package.json`.
- Changing art assets in a way that changes how they look or their detail (for example slimming models).
- Updating the public site coin.klickbaitbyk.com (`npm run deploy` / `wrangler deploy`).
- Merging a branch into `main`, deleting a branch, force-pushing, or rewriting git history.
- Never download, save or screenshot-to-disk her Pinterest pins. Links and written descriptions only.
- Never repeat, store or use an API key or password she pastes. Tell her to delete it and make a new one.

## How to make a change
1. **Measure before.** Frame rate: `node tools/perf.mjs` (run it two or three times; numbers move between runs). Load size: `node tools/asset_sizes.mjs`. Budgets live in `docs/budgets.md`.
2. **Make the smallest change that works.**
3. **Measure after**, the same way. Take a screenshot of the scene you touched and look at it: it must still render and still match the art bible.
4. If files the game loads changed, bump the cache name in `public/sw.js` (`coin-vNN`).
5. **Commit as Karnika Sehgal.** Never add "Co-Authored-By: Claude", "Generated with Claude Code" or any other Claude line to commit messages or PRs. Put the before/after numbers in the commit message.
6. Push to `origin main` (pushing does not update the public site).
7. **Report back:** what changed, how big the change was (files and lines), before/after numbers, and exactly where to see it. Say whether the link only works on her laptop (anything on localhost) or for everyone.
- Never say something is "done" without proof (numbers, a screenshot, a link).

## Laptop heat
- One Blender at a time. Never run Blender and the game in a browser at the same time.
- Warn her before anything heavy (long renders, simulations, big batch conversions).
- When you finish, close everything you started: the dev server, Blender, headless Chrome. Nothing left running.

## Art direction (short version; the full art bible is `docs/references.md`)
- Dark theatrical couture. Black, blood red, ivory, silver, gold. Candles, single spotlights, haze, black reflective water.
- Red fabric spilling over ruins, red-thread rooms, red light as a single source, veiled and hooded figures, couture gowns.
- **Not** bright, sunny or Pixar. If a screenshot looks fine in a well-lit room, it's too bright.
- Read `docs/references.md` before any visual change, including the section "Board update, 12 November 2026".

## Where things are
- The game: `public/play/` (`game.js`, `people.js`). Run locally with `npm run dev`, then http://localhost:8790/play/ (laptop only).
- Portrait mode: `/play/?portraits`. Cartoon cast: `?toon`.
- Plans and docs: `docs/game-design.md` (chapters), `docs/episode-1-the-coin.md` (script), `docs/budgets.md` (speed and size), `docs/paintings.md` (painting prompts), `docs/model-sheets.md` (costumes).
- Paintings she generates elsewhere go in `paintings-in/` (not in git).
- Voice script: `voice-test/ch1-script.md`. Not recorded with ElevenLabs; needs her yes on cost first.

## The plans, and which one to work on
There are three plans. Work on one step at a time, in this order:
1. `docs/PLAN-level1.md`, Stage 0 (in progress).
2. `docs/PLAN-fixes.md`, all stages (the wedding and the things that bother her).
3. `docs/PLAN-level1.md`, Stage 1 onward.
4. `docs/PLAN-hell.md` (only when its "When this plan starts" conditions are met).
Karnika can change the order by saying so. Her pin stories, and the style rule for who gets couture, are in `docs/pin-stories.md`.
