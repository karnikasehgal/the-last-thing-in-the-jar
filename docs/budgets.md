# Budgets: performance and character assets

Set by the art director for the character-art overhaul. The baseline below was measured on 21 October 2026, before
any of the overhaul's changes, with the tools in `tools/` (see the end of this page for how to run them again).

## The budgets

| budget | limit |
|---|---|
| frame rate, wedding film and river bank | at least 30 fps on the laptop and on a mid-range phone |
| main character, body and clothes together | under 35,000 triangles; skin texture at most 2048 px; under 4 MB |
| crowd extra | under 12,000 triangles and under 1.5 MB |
| whole game, first load | under 60 MB |

## Status against each budget

| budget | now | status |
|---|---|---|
| wedding, laptop, 30 fps | 22.5 to 30.3 fps mean, 20 fps at the 5th percentile (three runs) | **over**: at best on the line, the slow frames well under |
| river bank, laptop, 30 fps | 13.9 to 17.6 fps mean, 8.6 to 15 fps 5th percentile | **over** by about half |
| wedding, phone (emulated), 30 fps | 14.1 fps mean, 10 fps 5th percentile | **over** |
| river bank, phone (emulated), 30 fps | 23.1 fps mean, 20 fps 5th percentile | **over** |
| main character under 35k triangles | Rocketbox cast 11k to 30k dressed (Thea 30.1k, Eurydice 27.3k); bare Thea 61.9k | **pass** for the Rocketbox cast; **bare Thea is 77% over** |
| skin texture at most 2048 px | Rocketbox 1024 px; bare Thea 2048 px | **pass** |
| main character under 4 MB | files 0.7 to 1.6 MB (bare Thea 1.0 MB) | **pass** as a download; once loaded, each takes 27 to 29 MB of GPU memory in uncompressed textures |
| crowd extra under 12k triangles | 12.1k to 13.5k (men), 16.9k to 18.5k (women) dressed | **over**: every extra; the women's gowns and veils by about half |
| crowd extra under 1.5 MB | 0.37 to 0.58 MB | **pass** |
| first load under 60 MB | 72.8 MB before Enter is ready (73.8 MB with ?bare), 74.4 MB by the busiest moment of the wedding | **over** by about 13 MB |

Where the frame time goes: every frame draws the scene several times over (shadow maps, the river's reflection, ambient
occlusion, bloom), which `renderer.info` adds up to 2,800 to 4,800 draw calls and 5 to 11 million triangles a frame on
the laptop. That is the first place to look, before the characters: one Rocketbox guest is 12k to 18k triangles.
Bare Thea on her own made no difference that rose above the noise between runs (wedding with and without ?bare: 15.1 and
30.3 fps in one session, 23.7 and 22.5 fps in the next).

What fills the first load (largest first): `assets/anims.glb` 6.2 MB (the clips of the older cast built on `body_female` and
`head_male`; worth checking whether anything still plays them), the four Rocketbox animation files 9.8 MB together, the HDRs and sky photographs in `assets/env` (19 MB on disk in
all, of which the game loads several), `img/lib/styx/titian-orpheus.jpg` 2.9 MB, and the 18 Rocketbox cast files and
19 crowd files (about 30 MB).

## Performance baseline

Measured by `tools/perf.mjs` in headless Chrome on this laptop, Apple M5 Pro (16-core GPU, Metal 4), Chrome drawing
through ANGLE on Metal, so on the laptop's real GPU. Laptop runs: a 1440 x 900 window at 2x (the game draws at 1.75x:
2520 x 1575 pixels), full quality. Each run is a fresh profile with the service worker bypassed, so the bytes are those
of a first visit. Wedding: Enter, Begin, then 45 s on (the wedding film, the crowd built, Demeas or Kleio speaking);
river bank: `&nointro`, 6 s after Begin, Hermes talking to Mikon on the bank. 10 s measured each time.

| run | fps mean | fps 5th pct | frame ms p95 | draw calls | triangles | textures | geometries | JS heap MB | MB downloaded (ready / total) | load s | LITE | canvas px |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| wedding | 30.3 | 20 | 50 | 2825 | 4,832,134 | 570 | 2061 | 110.8 | 72.8 / 74.3 | 5.6 | no | 2520x1575 |
| wedding (second session) | 22.5 | 20 | 50.1 | 4772 | 11,384,747 | 570 | 2068 | 121.9 | 72.8 / 74.4 | 5.6 | no | 2520x1575 |
| wedding, ?bare | 15.1 | 10 | 100 | 3396 | 8,906,754 | 565 | 2113 | 104.7 | 73.8 / 75.3 | 8.1 | no | 2520x1575 |
| wedding, ?bare (second session) | 23.7 | 20 | 50.1 | 4506 | 10,946,712 | 565 | 2110 | 148 | 73.8 / 75.4 | 5.6 | no | 2520x1575 |
| river bank | 17.6 | 15 | 66.8 | 4200 | 11,018,928 | 236 | 1186 | 142 | 72.8 / 72.9 | 14.6 | no | 2520x1575 |
| river bank (second session) | 13.9 | 8.6 | 116.6 | 4172 | 11,334,874 | 236 | 1196 | 98.6 | 72.8 / 72.9 | 6 | no | 2520x1575 |
| phone (emulated), wedding at 80 s | 14.1 | 10 | 100 | 1875 | 5,067,998 | 446 | 1970 | 96.9 | 72.8 / 74.4 | 18.5 | yes | 487x1055 |
| phone (emulated), river bank | 23.1 | 20 | 50.1 | 862 | 1,971,046 | 206 | 749 | 55.6 | 72.8 / 72.9 | 18.7 | yes | 487x1055 |

How far to trust these numbers:
- The laptop runs use the laptop's own GPU, but headless Chrome draws off screen at a fixed 60 Hz, so frame times come
  in steps of 16.7 ms (the medians are 33 or 50 or 67 ms); read the fps as "which step", not to the decimal.
  The same scene varied by up to a third between sessions (the film's timing moves with loading and the voices, and the
  machine warms up over a run); run it two or three times before calling a change a gain.
- The phone is an **emulation**, not a phone: 390 x 844 at 3x with touch (so the game chose its LITE mode itself:
  no shadows, no ambient occlusion or bloom, fewer guests, 1.25x pixels), an Android user agent, and the CPU slowed 4x.
  The GPU is still the M5 Pro, far faster than any mid-range phone's, so real phones will do worse than this on the
  GPU side; read the phone rows as a best case. At 45 s the slowed phone was still building the wedding (a 7 s stall
  while the crowd was made), so the phone wedding was measured at 80 s.
- Draw calls and triangles are summed over every render pass of a frame (renderer.info with its reset taken over by the
  measurement), so they count shadow, reflection and post-processing passes too.

## Character assets now

Sizes as stored (`tools/asset_sizes.mjs`); "dressed" is the character as the game builds it, body plus the clothes,
gold and flowers made in code at load time, read from the look-dev page. Texture MB (GPU) is uncompressed RGBA with
mipmaps, what each takes in GPU memory once loaded. There is no `assets/cloth` folder: the one simulated garment is
`toon/chiton_short.glb`. The toon files are the animated-film cast (?toon), not the game's.

| file | MB | tris in file | verts | textures | largest texture px | texture MB (file) | texture MB (GPU) | dressed tris (body + clothes) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| rb/anims_f.glb | 1.45 | 0 | 0 | 0 | - | 0.00 | 0.00 | - |
| rb/anims_fx.glb | 2.80 | 0 | 0 | 0 | - | 0.00 | 0.00 | - |
| rb/anims_m.glb | 2.49 | 0 | 0 | 0 | - | 0.00 | 0.00 | - |
| rb/anims_mx.glb | 2.61 | 0 | 0 | 0 | - | 0.00 | 0.00 | - |
| rb/aunt.glb | 1.22 | 8,940 | 26,820 | 5 | 1024 | 0.65 | 26.67 | 19,312 (8,940 + 10,372) |
| rb/charon.glb | 1.20 | 7,836 | 23,508 | 5 | 1024 | 0.68 | 26.67 | 16,564 (7,836 + 8,728) |
| rb/dancer.glb | 1.14 | 8,774 | 26,322 | 5 | 1024 | 0.59 | 26.67 | 17,352 (8,774 + 8,578) |
| rb/demeas.glb | 1.29 | 7,200 | 21,600 | 5 | 1024 | 0.79 | 24.00 | 12,798 (7,200 + 5,598) |
| rb/elpenor.glb | 1.10 | 7,364 | 22,092 | 5 | 1024 | 0.62 | 26.67 | 12,155 (7,364 + 4,791) |
| rb/eurydice.glb | 1.35 | 9,832 | 29,496 | 5 | 1024 | 0.59 | 26.67 | 27,272 (9,832 + 17,440) |
| rb/hades.glb | 0.70 | 6,950 | 20,850 | 4 | 1024 | 0.26 | 21.33 | 13,332 (6,950 + 6,382) |
| rb/hermes.glb | 1.12 | 7,440 | 22,320 | 5 | 1024 | 0.59 | 26.67 | 16,713 (7,440 + 9,273) |
| rb/lykon.glb | 1.11 | 6,732 | 20,196 | 5 | 1024 | 0.56 | 26.67 | 11,877 (6,732 + 5,145) |
| rb/mikon.glb | 1.01 | 7,588 | 22,764 | 5 | 1024 | 0.49 | 26.67 | 12,520 (7,588 + 4,932) |
| rb/nikias.glb | 1.31 | 7,456 | 22,368 | 5 | 1024 | 0.80 | 26.67 | 14,397 (7,456 + 6,941) |
| rb/orpheus.glb | 1.03 | 7,312 | 21,936 | 5 | 1024 | 0.51 | 26.67 | 13,141 (7,312 + 5,829) |
| rb/persephone.glb | 1.29 | 8,308 | 24,924 | 5 | 1024 | 0.69 | 26.67 | 17,658 (8,308 + 9,350) |
| rb/piper.glb | 0.76 | 7,064 | 21,192 | 4 | 1024 | 0.30 | 21.33 | 12,737 (7,064 + 5,673) |
| rb/pirithous.glb | 1.25 | 8,684 | 26,052 | 5 | 1024 | 0.69 | 26.67 | 15,079 (8,684 + 6,395) |
| rb/sisyphus.glb | 0.85 | 6,710 | 20,130 | 4 | 1024 | 0.39 | 21.33 | 10,989 (6,710 + 4,279) |
| rb/thea.glb | 1.61 | 8,724 | 26,172 | 5 | 1024 | 0.96 | 26.67 | 30,076 (8,724 + 21,352) |
| rb/theseus.glb | 1.11 | 7,470 | 22,410 | 5 | 1024 | 0.60 | 26.67 | 13,537 (7,470 + 6,067) |
| bare/thea.glb | 1.00 | 37,304 | 21,422 | 7 | 2048 | 0.50 | 29.08 | 61,927 (37,304 + 24,623) |
| toon/cerberus.glb | 0.22 | 23,375 | 12,954 | 1 | 1024 | 0.03 | 5.33 | - |
| toon/chiton_short.glb | 0.15 | 15,392 | 7,915 | 0 | - | 0.00 | 0.00 | - |
| toon/rain.glb | 1.93 | 93,615 | 54,564 | 11 | 1024 | 0.15 | 58.67 | - |
| toon/snow.glb | 1.09 | 62,127 | 38,052 | 6 | 1024 | 0.09 | 32.00 | - |
| crowd/f0.glb | 0.54 | 8,722 | 26,166 | 3 | 512 | 0.11 | 4.00 | 17,574 (8,722 + 8,852) |
| crowd/f1.glb | 0.58 | 9,191 | 27,573 | 3 | 512 | 0.13 | 4.00 | 18,512 (9,191 + 9,321) |
| crowd/f2.glb | 0.56 | 9,274 | 27,822 | 3 | 512 | 0.12 | 4.00 | 17,991 (9,274 + 8,717) |
| crowd/f3.glb | 0.50 | 8,266 | 24,798 | 3 | 512 | 0.10 | 4.00 | 16,899 (8,266 + 8,633) |
| crowd/f4.glb | 0.51 | 8,261 | 24,783 | 3 | 512 | 0.11 | 4.00 | 17,060 (8,261 + 8,799) |
| crowd/f5.glb | 0.55 | 9,005 | 27,015 | 3 | 512 | 0.11 | 4.00 | 17,818 (9,005 + 8,813) |
| crowd/f6.glb | 0.51 | 8,890 | 26,670 | 3 | 512 | 0.09 | 4.00 | 17,538 (8,890 + 8,648) |
| crowd/f7.glb | 0.52 | 8,701 | 26,103 | 3 | 512 | 0.12 | 4.00 | 17,631 (8,701 + 8,930) |
| crowd/f8.glb | 0.57 | 8,504 | 25,512 | 3 | 512 | 0.13 | 4.00 | 17,046 (8,504 + 8,542) |
| crowd/m0.glb | 0.45 | 7,418 | 22,254 | 3 | 512 | 0.08 | 3.33 | 12,856 (7,418 + 5,438) |
| crowd/m1.glb | 0.37 | 6,740 | 20,220 | 2 | 512 | 0.03 | 2.67 | 12,115 (6,740 + 5,375) |
| crowd/m2.glb | 0.37 | 6,712 | 20,136 | 2 | 512 | 0.04 | 2.67 | 12,117 (6,712 + 5,405) |
| crowd/m3.glb | 0.37 | 6,842 | 20,526 | 2 | 512 | 0.03 | 2.67 | 12,333 (6,842 + 5,491) |
| crowd/m4.glb | 0.37 | 7,120 | 21,360 | 2 | 512 | 0.02 | 2.67 | 12,764 (7,120 + 5,644) |
| crowd/m5.glb | 0.47 | 7,429 | 22,287 | 3 | 512 | 0.10 | 4.00 | 13,144 (7,429 + 5,715) |
| crowd/m6.glb | 0.44 | 7,437 | 22,311 | 3 | 512 | 0.07 | 4.00 | 13,208 (7,437 + 5,771) |
| crowd/m7.glb | 0.47 | 7,808 | 23,424 | 3 | 512 | 0.09 | 4.00 | 13,512 (7,808 + 5,704) |
| crowd/m8.glb | 0.38 | 7,156 | 21,468 | 2 | 512 | 0.03 | 2.67 | 12,816 (7,156 + 5,660) |
| crowd/m9.glb | 0.37 | 6,712 | 20,136 | 2 | 512 | 0.03 | 2.67 | 12,107 (6,712 + 5,395) |

## Running the tools again

All need the dev server (`wrangler dev --port 8796`); each starts one headless Chrome and closes it when done.
- `node tools/perf.mjs [--only wedding,wedding-bare,bank,phone-wedding,phone-bank] [--wait 45] [--out dir]`: the table above (perf.json, perf.md and a screenshot per run).
- `node tools/asset_sizes.mjs [--runtime]`: the asset table (with `--runtime`, the dressed triangle counts).
- `node tools/check_clipping.mjs <id> [--bare]`: clothing inside the body, clip by clip.
- `public/play/lookdev.html?id=thea&bare=1&light=neutral&view=front&anim=idle&t=1.5`: the look-dev turntable.
