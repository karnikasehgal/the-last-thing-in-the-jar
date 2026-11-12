# Prompts to paste into Claude Code

Open Claude Code in the `elpis` folder, then paste one prompt at a time. Wait for it to finish and check what it reports before pasting the next one.
Your rules are in `CLAUDE.md`, which Claude Code reads by itself at the start of every session, so the prompts don't need to repeat them.

---

## 1. One time: lock in the house rules (do this first)

```
Read CLAUDE.md and the section "Board update, 12 November 2026" at the end of docs/references.md. Both were written outside Claude Code today. Check them against the repo and tell me anything that's wrong or out of date before you do anything else.

Then, in this order:
1. Make sure you never add a Claude co-author line to my commits again. Change Claude Code's own setting for this project (check your docs for the right setting name in your version). It goes in .claude/settings.json, which is gitignored, so it only lives on my laptop. Tell me which setting you changed.
2. The commit 9fd7416 ("Light rock shapes") cut the rock models from 5k-57k triangles to 1.5k-3k. I want to approve it with my own eyes. Take the same river bank screenshot before that commit and after it (use a git worktree for the old version, don't touch main), put them side by side, and show me. Don't undo anything; I'll decide.
3. The two speed commits only measured the laptop. Run tools/perf.mjs for the emulated phone (wedding and river bank) and update the status table in docs/budgets.md with the new laptop and phone numbers.
4. Commit CLAUDE.md, docs/references.md, docs/claude-code-prompts.md, docs/PLAN-level1.md and docs/budgets.md together, as me, and push. Report the size of the change and the numbers.
Close everything you started when you're done.
```

---

## 2. Every time you work on the plan: do the next step

Use this after `docs/PLAN-level1.md` exists and you've said "go".

```
Read docs/PLAN-level1.md and find the first step that isn't ticked off. Tell me in three plain sentences what you're about to do and how we'll know it worked. Then do only that step, following CLAUDE.md (measure before and after, screenshot, commit as me, push). Tick the step off in the plan with today's date and the numbers. Stop after that one step and report.
```

---

## 3. After anything visual: check it still looks like the board

```
Take screenshots of the wedding and the river bank at the same camera positions as last time (save them in look-test/, which is gitignored). For each one, measure how much of the frame is near-black (at or below 10% brightness), mid-tone and highlight, and compare it with the value rules in docs/references.md ("Value structure"). Tell me which scenes pass, which are too bright or too flat, and the one change you'd make first. Don't change anything yet.
```

---

## 4. When you've played it and something feels off

Replace the blank with whatever you'd say out loud, however messy.

```
Here's my feedback after playing: ______

Don't fix anything yet. Turn this into a numbered list of specific, checkable changes (what, where, and how we'll know it's fixed). Mark which ones are small fixes and which ones are big enough to need a plan. Wait for me to confirm the list.
```

---

## 5. When you've made a painting: test it before making the rest

Use this after you drop your first painted portrait into `paintings-in/`.

```
I put a painting in paintings-in/: ______ (file name). It's the portrait of ______ from docs/paintings.md.
Show it in portrait mode (/play/?portraits) next to that same character's 3D model in the game, and take one screenshot of both side by side. Tell me plainly whether they look like they belong to the same world, and if not, what's clashing (light, colour, faces, clothes). Don't generate or download anything.
```

---

## 6. End of every session: write down where things stand

```
We're stopping for today. Close everything you started (dev server, headless Chrome, Blender). Then write docs/STATUS.md: what changed today, the latest numbers against docs/budgets.md, the current cache version, which branches aren't merged and why, what's waiting for my yes, and the next step in docs/PLAN-level1.md. Plain sentences, under one page. Commit as me and push.
```

Next time, start by pasting `docs/STATUS.md` (or just say "read docs/STATUS.md") instead of writing the update from memory.

---

## Things that always need your yes first
Claude Code should stop and ask before any of these. If it doesn't, stop it.
- Recording voices with ElevenLabs (costs credits). Ask it for the cost of the batch first.
- Updating the public site coin.klickbaitbyk.com.
- Merging a branch (for example `cast-build`) into main.
- Rewriting git history or force-pushing.
- Downloading anything.
