# The Coin: painting prompt pack

Copy-paste prompts for making the painted images for Chapter I in an external image tool (Midjourney or Leonardo). There are two kinds:

- **Film stills** for the storybook opening (`/play/?stills`): painted 16:9 frames that play with the recorded voices, a slow camera move, rippling water and flickering candles.
- **Portraits** shown during in-game conversations: chest-up, one character, one expression each.

Everything here follows the approved look in `docs/references.md`, the costumes in `docs/model-sheets.md` and the approved images in `look-test/` (Style frame 1 wedding, Style frame 2 river bank, Model sheet 1 Thea). Where `bible.json` disagrees with those (it still describes a cartoon style), this pack follows the approved frames: photoreal period film.

## How to use

**Sizes.** Film stills at 16:9, 2048x1152 or larger (upscale once if the tool makes them smaller). Portraits at 4:5, 1024x1280 or larger.

**References.** Attach these where the tool allows it:

- Style reference, every image: `look-test/Style frame 1 wedding.jpg` and `look-test/Style frame 2 river bank.jpg`. For wedding and funeral images, weight frame 1 more; for the river, frame 2.
- Character reference: `look-test/Model sheet 1 Thea.jpg` for any image with Thea in it. For everyone else, make their **neutral portrait first**, pick the best one, and from then on attach it as that character's reference in every still and portrait they appear in.
- Keep one character's reference image (and the same seed, if the tool shows one) for all of that character's images, so the face and costume stay the same.

**Variations.** Make 2 to 4 of each and keep the best. Check: hands have five fingers, costumes match the character block, no blue glow on the river, no text, and the frame is dark (if it looks fine in a bright room, it is too bright).

**Composition for the player.** The storybook player ripples the lower third of any still marked *water* and lays a soft candle glow over the middle, and it zooms in by up to about 30 percent. So keep water in the bottom third of water stills, keep faces and hands away from the outer 10 percent of the frame, and leave a little room at the bottom for subtitles.

**Long prompts.** Midjourney pays most attention to the start of a prompt, and these prompts put the **Shot** paragraph last; if a result ignores the shot, move that paragraph to the top. Leonardo cuts prompts at about 1500 characters: if it does, drop the shared style block (the style reference images carry it) and keep the setting, character and shot paragraphs; for a crowded still, drop the character blocks of people in the background and rely on their character references.

**Tool suffixes (optional, add on a last line):**

- Midjourney, stills: `--ar 16:9 --style raw --sref <frame 1 url> <frame 2 url> --no text, watermark, cartoon, anime, illustration, blue glow` and, for one main character, `--oref <portrait url> --ow 100` (version 7) or `--cref <portrait url> --cw 100` (version 6). Add `--seed <number>` and reuse the number for that character. Portraits: the same with `--ar 4:5`.
- Leonardo: choose a photoreal model (Lucid Realism, Phoenix or Kino), aspect 16:9 or 4:5, add the style frames under Image Guidance as Style Reference and the portrait or Thea's sheet as Character Reference. Negative prompt: `cartoon, anime, illustration, 3d render, plastic skin, bright daylight, flat lighting, blue glowing water, modern clothing, text, watermark, extra fingers`.

**Naming and saving.** The easy way: drop everything into `/Users/karnikasehgal/Documents/elpis/paintings-in/` with any names, and the main session will rename and place them. If you want to place them yourself:

- Film stills: `public/play/film/ch1/stills/<id>.jpg`, for example `s05.jpg` (JPEG, quality about 85). The old test stills `01.jpg`, `02.jpg` and `12.jpg` in that folder stay until the new ones replace them.
- Portraits: `public/play/portraits/<character>-<expression>.jpg`, for example `hermes-amused.jpg`.

The player's beat list for these stills is in `public/play/film/ch1-stills.json`.

## Shared style block

Paste at the start of every prompt (already included in the full prompts below):

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.
```

Then one setting-and-light line for the scene:

**Wedding**

```
Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.
```

**Funeral (the next night)**

```
Setting and light: the same quarried stone hall the next night, cleared and quiet, most candles out and only a few still burning, one cool grey-white shaft of light from above, burgundy and blood-red silk drapes fallen from the walls and spreading across the stone floor and into the black water channel, the haze thicker, everything colder and emptier.
```

**River bank**

```
Setting and light: a night beach on the river of the dead in a vast dark cavern, flat black still water with no blue, one cool white shaft of light from high above falling on the water near a wooden dock, a small warm lantern glow from one side, dense low fog over the water, long blood-red silk banners stretched across the river with their ends trailing in the water, tall hooded grey figures standing still in the shallows far off, the far bank lost in fog.
```

And for portraits, one of these instead:

**Portrait, wedding candlelight (the family)**

```
Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.
```

**Portrait, river bank (the underworld cast, and Mikon)**

```
Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.
```

Palette, for checking results by eye (from `references.md`): night black `#0B0A0C`, warm black `#16110E`, cold black `#121418`, smoke grey `#2A2D33`, blood red `#8E0E14` (shadow `#4A0509`, edge `#C4202A`), burgundy drape `#6E1A24`, ivory silk `#E9DFC8` (shadow `#B9A98A`), sheer white `#D8D2C4`, silver `#C9CBCF`, gold `#C9A24A`, candle amber `#FFB55A`, candle core `#FFE3A8`, shaft white `#DCE6EE`. Wedding frames are about half near-black; river frames about two thirds to three quarters near-black.

## Character blocks

One paragraph per character, pasted wherever that character appears. The first eight come from the approved model sheets. Charon combines `bible.json` with the board's ferryman (faded blood red, conical cap). Theseus and Pirithous have no sheet yet: these blocks are new proposals, so check their first portraits before using them as references.

**Mikon**

```
Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.
```

**Lykon**

```
Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.
```

**Kleio**

```
Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings.
```

**Demeas**

```
Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand.
```

**Thea**

```
Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.
```

**Nikias**

```
Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.
```

**Hermes**

```
Hermes, the messenger god: looks about 22, slim and athletic, light warm skin, bright quick grey-green eyes, a sly charming half-grin, tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings on its crown. A knee-length pale ivory linen tunic with a narrow gold belt, a long near-black blood-red cloak pinned at his right shoulder with a round gold disc brooch, a slim gold herald's staff with two twined snakes and small silver wings resting over his shoulder.
```

**Elpenor**

```
Elpenor, a dead sailor: a lean, wiry Greek man of about 21, deep sun-tanned skin gone dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back with a cord, a short scruffy beard, hooded amused dark brown eyes, a wry crooked smile, a small bronze ring in one ear. A wet charcoal linen work tunic with faint white salt marks, knotted at the left shoulder with the right shoulder bare, a black tarred rope belt, and a frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders.
```

**Charon**

```
Charon, the ferryman of the dead: very tall, gaunt and stooped, a long craggy face with a ragged grey beard, deep-set eyes with a faint ember glow, long bony hands. A worn short tunic of faded, wet, blood-red wool, darker at the hem, a ragged dark brown cloak over his shoulders, a conical felt cap pulled low so its shadow hides most of his face, a long black punting pole.
```

**Theseus**

```
Theseus, the hero-king of Athens, trapped: a powerfully built Greek man in his late forties gone stiff and dusty, a square weathered face, heavy brows, tired grey eyes, cropped greying dark hair, a short grey-streaked beard. A dulled bronze muscle cuirass over a faded ivory linen tunic, a dark wool cloak grey with dust, sitting rigidly on a rough black stone chair that his cloak and back have grown into.
```

**Pirithous**

```
Pirithous, king of the Lapiths, trapped beside Theseus: a lean, restless Greek man in his forties, a long nose, bright dark eyes, a sheepish face, long black curly hair and beard shot with grey, a gold torque at his neck. A scuffed dark leather cuirass over a faded burgundy tunic, a dusty dark cloak, sitting on a rough black stone chair, his back and cloak fused into the stone.
```

## Film stills: the Chapter I opening

Eighteen stills from the wedding to the river. Lines are the recorded voice ids from `game.js` (`weddingFilm` and `WAKE`); they play in order over the still. The move is the player's `[start scale, end scale, start x %, start y %]` (it eases to the end scale and centre over 30 seconds). Water means the lower third ripples; candles means the warm flicker is on.

| # | Still | Lines | Move | Water | Candles |
|---|---|---|---|---|---|
| s01 | The wedding hall | w_i1 | Slow crane down and push in (starts high, settles on the tables) | yes | yes |
| s02 | Mikon arrives with the fish | w_l0 | Slow drift right, easing out a little, as he walks in | yes | yes |
| s03 | Lykon and the fish | w_m0 | Slow push in on the two of them | no | yes |
| s04 | Kleio takes the basket | w_a0 | Slow drift left, easing out | no | yes |
| s05 | Demeas's toast | w_d1, w_a1, w_d2 | Slow push in, tilting up to the raised cup | yes | yes |
| s06 | The goat joke | w_m1, w_l1 | Slow drift left from Lykon to Mikon | no | yes |
| s07 | The hand reaches for the olive | w_m2 | Slow push in on the bowl | no | yes |
| s08 | The olive at his lips | (silent beat) | Slow push in (a silent beat: hold about 3 seconds) | no | yes |
| s09 | The laugh | w_m3 | Slow push in, a little rise | no | yes |
| s10 | The choke | w_l2 | Faster push in (the player also shakes this still) | no | yes |
| s11 | The family helps | w_a2, w_n1, w_t1 | Slow drift right, easing out to take in everyone | no | yes |
| s12 | Faces above him | w_a5, w_t3 | Slow sway and push in, like a dizzy gaze | no | yes |
| s13 | The candles go out | w_vo1 | Slow pull out as the light dies | yes | yes |
| s14 | The funeral | w_a3, w_d3, w_a4, w_d4 | Slow push down toward the family | yes | yes |
| s15 | Thea at the funeral | w_t2 | Slow push in | no | yes |
| s16 | The coin not placed | w_vo2 | Slow rise away (pull out) | no | yes |
| s17 | The black beach | w_m4 | Slow pull out to reveal the beach | yes | no |
| s18 | Hermes arrives | v4_h1, v4_m1, v4_h2, v4_m2, v4_h3, v4_m3, v5_h4, v5_m4, v5_h5 | Slow push in | yes | no |

The wake-up talk is long, so the beat list shows two stills twice more: s17 again for Hermes pointing out Elpenor (`v5_h6`, pushing toward the sailor), s18 again for Hermes leaving (`v5_m5`, `v5_h7`), and s17 a last time for the closing voice-over (`v2_i5`, `v2_i6`) with a long pull out and rise. No extra images are needed for those.

### s01. The wedding hall

- **Shows:** Extreme wide high-angle view looking straight down the length of a vast candlelit quarried stone hall at a wedding feast.
- **Camera:** Extreme wide, high angle, one-point view straight down the water channel.
- **Characters:** none in close view.
- **Lines:** `w_i1` Mikon (voice-over): "My name is Mikon. I sell salt fish at the harbour in Corinth...".
- **Move:** Slow crane down and push in (starts high, settles on the tables), `[1.06, 1.16, 0, 2]`.
- **Effects:** water ripples, candles flicker, party sound on.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Shot: Extreme wide, high angle, one-point view straight down the water channel. Extreme wide high-angle view looking straight down the length of a vast candlelit quarried stone hall at a wedding feast. A channel of black water runs down the centre toward a wall of warm fog at the far end. Long banquet tables crowded with candles, bread, olives, lamb and wine run along both banks; guests in black and charcoal sit and stand along them, a few dance, a piper plays the double pipes. Tiny in the distance at the high table, a bride in ivory and gold sits beside a groom in ivory and black. Candle reflections break across the black water in the lower third of the frame. Wide 16:9 cinematic frame.
```

### s02. Mikon arrives with the fish

- **Shows:** Mikon walks in through a rough stone gateway at the edge of the hall, beaming and chest puffed with pride, hugging a round wicker basket of silver salt fish against his belly with one arm and lifting the other hand in greeting toward someone off screen.
- **Camera:** Medium full shot, eye level, from inside the hall looking back at the entrance.
- **Characters:** Mikon.
- **Lines:** `w_l0` Lykon: "Mikon! Over here, I saved you a seat. Wait. Is that fish?...".
- **Move:** Slow drift right, easing out a little, as he walks in, `[1.1, 1.03, 3, 0]`.
- **Effects:** water ripples, candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Medium full shot, eye level, from inside the hall looking back at the entrance. Mikon walks in through a rough stone gateway at the edge of the hall, beaming and chest puffed with pride, hugging a round wicker basket of silver salt fish against his belly with one arm and lifting the other hand in greeting toward someone off screen. Behind him the dark gateway and a ruined arch veiled in a burgundy drape; beside him the stone edge of the black water channel with candle reflections in the lower third; blurred guests in black in the foreground. Wide 16:9 cinematic frame.
```

### s03. Lykon and the fish

- **Shows:** At a long candlelit banquet table, Lykon half-rises from the bench, leaning back from the basket with his nose wrinkled and his eyebrows up in disbelief, one long hand raised as if to fend it off.
- **Camera:** Medium two-shot across the table, eye level.
- **Characters:** Lykon, Mikon.
- **Lines:** `w_m0` Mikon: "Salt fish from Lechaion. The good kind. It's a present.".
- **Move:** Slow push in on the two of them, `[1.03, 1.12, 0, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch. Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Medium two-shot across the table, eye level. At a long candlelit banquet table, Lykon half-rises from the bench, leaning back from the basket with his nose wrinkled and his eyebrows up in disbelief, one long hand raised as if to fend it off. Mikon stands at the table holding the wicker basket of salt fish up proudly in both hands like a prize, grinning. Candles, bread and a bowl of olives on the table between them, guests in black blurred behind. Wide 16:9 cinematic frame.
```

### s04. Kleio takes the basket

- **Shows:** Kleio, small and hooded, has snatched the wicker basket of salt fish out of Mikon's hands and holds it out at arm's length with a look of disgust, her other hand pressing firmly on his shoulder to push him down onto the bench.
- **Camera:** Medium shot, slightly low, at table height.
- **Characters:** Kleio, Mikon.
- **Lines:** `w_a0` Kleio: "Give that to me before the bride smells it...".
- **Move:** Slow drift left, easing out, `[1.1, 1.04, -3, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings. Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Medium shot, slightly low, at table height. Kleio, small and hooded, has snatched the wicker basket of salt fish out of Mikon's hands and holds it out at arm's length with a look of disgust, her other hand pressing firmly on his shoulder to push him down onto the bench. Mikon, half-sitting, surprised and sheepish, a cup of wine in front of him on the candlelit table. Wide 16:9 cinematic frame.
```

### s05. Demeas's toast

- **Shows:** Demeas stands on a bench above the crowd, his bronze wine cup raised high in his right hand, mid-speech, wine slopping over the rim, his face beaming.
- **Camera:** Low angle medium-wide, like Style frame 1.
- **Characters:** Demeas, Kleio, Thea, Nikias.
- **Lines:** `w_d1` Demeas: "Friends! Friends, quiet, please. I'll be brief. I won't be brief..."; `w_a1` Kleio: "Demeas, sit down before you fall into the lamb again."; `w_d2` Demeas: "That was one time, Kleio, and the lamb started it.".
- **Move:** Slow push in, tilting up to the raised cup, `[1.04, 1.14, 0, -2]`.
- **Effects:** water ripples, candles flicker, party sound on.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand. Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings. Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor. Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.

Shot: Low angle medium-wide, like Style frame 1. Demeas stands on a bench above the crowd, his bronze wine cup raised high in his right hand, mid-speech, wine slopping over the rim, his face beaming. The black water channel with candle reflections runs along the left of the frame. Behind him at the high table, Thea and Nikias laugh, embarrassed, guests raising cups. In the lower left foreground, small Kleio in her dark hood stands with her arms folded, glaring up at him. Composition close to the approved style frame of the toast. Wide 16:9 cinematic frame.
```

### s06. The goat joke

- **Shows:** Mikon sits at the candlelit table leaning toward Lykon, eyes twinkling, both hands up at his forehead with the fingers bent like a goat's horns as he acts out a joke.
- **Camera:** Medium two-shot, eye level, side-on along the table.
- **Characters:** Mikon, Lykon.
- **Lines:** `w_m1` Mikon: "Lykon. Lykon. Have you heard the one about the goat..."; `w_l1` Lykon: "Mikon, it's your cousin's wedding. Not the goat one...".
- **Move:** Slow drift left from Lykon to Mikon, `[1.12, 1.05, -3, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Shot: Medium two-shot, eye level, side-on along the table. Mikon sits at the candlelit table leaning toward Lykon, eyes twinkling, both hands up at his forehead with the fingers bent like a goat's horns as he acts out a joke. Lykon beside him looks pained, his long hands pressed together under his chin, pleading. A bowl of olives, bread and wine cups on the table in front of them. Wide 16:9 cinematic frame.
```

### s07. The hand reaches for the olive

- **Shows:** Close-up insert: Mikon's broad right hand reaches into a shallow red-figure clay bowl heaped with glossy green and black olives on the candlelit table, thumb and finger closing on one green olive, while his other hand, out of focus behind, still gestures through his story.
- **Camera:** Insert close-up on the table, slightly high angle.
- **Characters:** Mikon.
- **Lines:** `w_m2` Mikon: "So the goat walks right up to the altar...".
- **Move:** Slow push in on the bowl, `[1.02, 1.15, 0, 1]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Insert close-up on the table, slightly high angle. Close-up insert: Mikon's broad right hand reaches into a shallow red-figure clay bowl heaped with glossy green and black olives on the candlelit table, thumb and finger closing on one green olive, while his other hand, out of focus behind, still gestures through his story. Candle flames and wine cups blurred around the bowl. Wide 16:9 cinematic frame.
```

### s08. The olive at his lips

- **Shows:** Close-up of Mikon in three-quarter profile, grinning with delight at his own story, holding a single green olive between thumb and finger at his open lips, about to pop it in.
- **Camera:** Close-up, three-quarter profile.
- **Characters:** Mikon.
- **Lines:** none (a silent beat between the joke and the laugh).
- **Move:** Slow push in (a silent beat: hold about 3 seconds), `[1.03, 1.1, 0, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Close-up, three-quarter profile. Close-up of Mikon in three-quarter profile, grinning with delight at his own story, holding a single green olive between thumb and finger at his open lips, about to pop it in. Warm candle bokeh behind him. Wide 16:9 cinematic frame.
```

### s09. The laugh

- **Shows:** Mikon throws his head back in a huge laugh at his own joke, mouth wide open, eyes squeezed shut, one big hand slapping the candlelit table so the cups jump.
- **Camera:** Medium close-up, slightly low.
- **Characters:** Mikon, Lykon.
- **Lines:** `w_m3` Mikon: "Ha! No, wait, wait, this is the good part, this is the...".
- **Move:** Slow push in, a little rise, `[1.04, 1.1, 0, -1]`.
- **Effects:** candles flicker, party sound on.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Shot: Medium close-up, slightly low. Mikon throws his head back in a huge laugh at his own joke, mouth wide open, eyes squeezed shut, one big hand slapping the candlelit table so the cups jump. Lykon beside him, out of focus, wincing. Wide 16:9 cinematic frame.
```

### s10. The choke

- **Shows:** Mikon frozen mid-laugh, eyes wide with shock, both hands clutching his throat, face reddening, mouth open with no sound.
- **Camera:** Medium close-up, eye level.
- **Characters:** Mikon, Lykon.
- **Lines:** `w_l2` Lykon: "Mikon? Mikon, are you all right? You've gone a very strange colour.".
- **Move:** Faster push in (the player also shakes this still), `[1.03, 1.18, 0, 0]`.
- **Effects:** candles flicker, choke shake and cough.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Shot: Medium close-up, eye level. Mikon frozen mid-laugh, eyes wide with shock, both hands clutching his throat, face reddening, mouth open with no sound. Lykon half-standing behind him with one long hand on his shoulder, worried. A wine cup tipping over on the table, wine spilling across the wood toward a candle. Wide 16:9 cinematic frame.
```

### s11. The family helps

- **Shows:** Chaos at the table.
- **Camera:** Medium-wide, eye level, across the table.
- **Characters:** Nikias, Mikon, Demeas, Kleio, Thea.
- **Lines:** `w_a2` Kleio: "He's choking! Somebody hit him on the back! Not like that, Demeas, harder!"; `w_n1` Nikias: "I've got him, I've got him! Breathe, cousin, just breathe!"; `w_t1` Thea: "Mikon, don't you dare. Not today! It's my wedding!".
- **Move:** Slow drift right, easing out to take in everyone, `[1.12, 1.04, 2, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border. Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand. Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings. Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.

Shot: Medium-wide, eye level, across the table. Chaos at the table. Nikias stands behind Mikon with his arms wrapped round under his ribs, pulling in and up. Demeas beside them raises his big hand to thump Mikon's back. Across the table Kleio is on her feet, pointing at him with her whole arm, mouth open, shouting. Thea in ivory and gold rushes in from the side and grips Mikon's shoulders, frightened and furious. Toppled cups, spilled wine, guests in black rising in the background. Wide 16:9 cinematic frame.
```

### s12. Faces above him

- **Shows:** Point of view from the ground looking straight up: Kleio, Thea, Lykon and Nikias lean over the camera in a ring, frightened faces lit warm from below by candles, Thea's gold veil hanging down toward the lens, the ivory fabric swags and the dark stone ceiling beyond them.
- **Camera:** Point of view from below, looking straight up.
- **Characters:** Kleio, Thea, Lykon, Nikias.
- **Lines:** `w_a5` Kleio: "Mikon? Mikon, look at me. Stay with us. Somebody get water!"; `w_t3` Thea: "Mikon, please. Please.".
- **Move:** Slow sway and push in, like a dizzy gaze, `[1.06, 1.12, -2, 1]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Characters: Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings. Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor. Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch. Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.

Shot: Point of view from below, looking straight up. Point of view from the ground looking straight up: Kleio, Thea, Lykon and Nikias lean over the camera in a ring, frightened faces lit warm from below by candles, Thea's gold veil hanging down toward the lens, the ivory fabric swags and the dark stone ceiling beyond them. The edges of the frame are soft and slightly blurred, as if vision is going. Wide 16:9 cinematic frame.
```

### s13. The candles go out

- **Shows:** Candles on the banquet table seen very close and badly out of focus, blurring into soft glowing circles; several have just gone out and thin threads of smoke rise from their wicks.
- **Camera:** Close, very shallow focus, table level.
- **Characters:** none in close view.
- **Lines:** `w_vo1` Mikon (voice-over): "One moment I was laughing. The next, everyone I loved was leaning over me...".
- **Move:** Slow pull out as the light dies, `[1.15, 1.02, 0, 0]`.
- **Effects:** water ripples, candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a quarried stone hall at a wedding feast, lit by hundreds of small candles in wall niches and along long tables, warm amber candlelight from low and close, a straight channel of black water down the middle of the hall reflecting the candles as broken streaks, ivory sheer fabric swagged high overhead, one faint cool shaft of light from a high opening, guests dressed in black and charcoal, one burgundy drape over a ruined arch as the only red.

Shot: Close, very shallow focus, table level. Candles on the banquet table seen very close and badly out of focus, blurring into soft glowing circles; several have just gone out and thin threads of smoke rise from their wicks. The hall beyond is falling into darkness. The black water channel in the lower third holds only a few fading reflections. Wide 16:9 cinematic frame.
```

### s14. The funeral

- **Shows:** Mikon lies on the long table as on a bier, under a white linen sheet to the chest, eyes closed, hands folded, sprigs of myrtle and flowers around him, a few candles at his head.
- **Camera:** Wide-medium, high angle over the bier.
- **Characters:** Mikon, Kleio, Demeas.
- **Lines:** `w_a3` Kleio: "Did anybody put the coin in his mouth? For the ferryman?"; `w_d3` Demeas: "I thought you did."; `w_a4` Kleio: "I was doing the lamb!"; `w_d4` Demeas: "Well, the lamb's going cold now. He'd want us to eat...".
- **Move:** Slow push down toward the family, `[1.04, 1.14, 0, 2]`.
- **Effects:** water ripples, candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: the same quarried stone hall the next night, cleared and quiet, most candles out and only a few still burning, one cool grey-white shaft of light from above, burgundy and blood-red silk drapes fallen from the walls and spreading across the stone floor and into the black water channel, the haze thicker, everything colder and emptier.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings. Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand.

Shot: Wide-medium, high angle over the bier. Mikon lies on the long table as on a bier, under a white linen sheet to the chest, eyes closed, hands folded, sprigs of myrtle and flowers around him, a few candles at his head. Kleio, her dark mantle drawn over her head, and Demeas, huge and stooped, stand over him; a platter of lamb sits further down the table. Burgundy and blood-red silk drapes have fallen from the walls and spread across the stone floor and into the black water channel in the lower third, which reflects the one cool shaft of light. Wide 16:9 cinematic frame.
```

### s15. Thea at the funeral

- **Shows:** Close-up of Thea at the funeral, still in her bridal gown; her saffron-gold veil is now lit cool and grey by the shaft from above, like a mourning veil.
- **Camera:** Close-up, eye level.
- **Characters:** Thea.
- **Lines:** `w_t2` Thea: "He never even finished the joke. I wanted to know what the priest said.".
- **Move:** Slow push in, `[1.02, 1.1, 0, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: the same quarried stone hall the next night, cleared and quiet, most candles out and only a few still burning, one cool grey-white shaft of light from above, burgundy and blood-red silk drapes fallen from the walls and spreading across the stone floor and into the black water channel, the haze thicker, everything colder and emptier.

Characters: Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.

Shot: Close-up, eye level. Close-up of Thea at the funeral, still in her bridal gown; her saffron-gold veil is now lit cool and grey by the shaft from above, like a mourning veil. Her eyes are wet and red-rimmed and she gives a small sad laugh. A single candle burns behind her, out of focus. Wide 16:9 cinematic frame.
```

### s16. The coin not placed

- **Shows:** Looking straight down at Mikon's still face on the bier, lips closed, eyes shut, myrtle by his ear.
- **Camera:** Overhead close shot, looking straight down.
- **Characters:** Mikon.
- **Lines:** `w_vo2` Mikon (voice-over): "Nobody put a coin under my tongue for the ferryman...".
- **Move:** Slow rise away (pull out), `[1.2, 1.02, 0, 0]`.
- **Effects:** candles flicker.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: the same quarried stone hall the next night, cleared and quiet, most candles out and only a few still burning, one cool grey-white shaft of light from above, burgundy and blood-red silk drapes fallen from the walls and spreading across the stone floor and into the black water channel, the haze thicker, everything colder and emptier.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Overhead close shot, looking straight down. Looking straight down at Mikon's still face on the bier, lips closed, eyes shut, myrtle by his ear. Beside his head on the table lies a small dull silver obol coin on a little clay dish, forgotten and untouched, catching the one cool shaft of light. Red silk at the edge of frame. Wide 16:9 cinematic frame.
```

### s17. The black beach

- **Shows:** Extreme wide shot of the night beach.
- **Camera:** Extreme wide, eye level from the water's edge.
- **Characters:** Mikon, Elpenor.
- **Lines:** `w_m4` Mikon: "Oh. Oh, no. Is that a river? Why is it glowing?".
- **Move:** Slow pull out to reveal the beach, `[1.1, 1.02, 0, 0]`.
- **Effects:** water ripples.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a night beach on the river of the dead in a vast dark cavern, flat black still water with no blue, one cool white shaft of light from high above falling on the water near a wooden dock, a small warm lantern glow from one side, dense low fog over the water, long blood-red silk banners stretched across the river with their ends trailing in the water, tall hooded grey figures standing still in the shallows far off, the far bank lost in fog.

Characters: Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder. Elpenor, a dead sailor: a lean, wiry Greek man of about 21, deep sun-tanned skin gone dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back with a cord, a short scruffy beard, hooded amused dark brown eyes, a wry crooked smile, a small bronze ring in one ear. A wet charcoal linen work tunic with faint white salt marks, knotted at the left shoulder with the right shoulder bare, a black tarred rope belt, and a frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders.

Shot: Extreme wide, eye level from the water's edge. Extreme wide shot of the night beach. Small in the centre-left, Mikon sits up on a stone bench on the black sand, groggy, staring out at the river. Flat black water fills the lower third, the cool shaft of light falling on it near a long wooden dock. Far to the left by the water, a young sailor sits on a bench mending a fishing net across his knees by a small lantern. Far right, a dark ferry boat with a single lantern at its prow. Red banners over the water, hooded shades standing in the shallows, fog. Wide 16:9 cinematic frame.
```

### s18. Hermes arrives

- **Shows:** Hermes crouches beside Mikon on the stone bench at the water's edge, one hand steadying Mikon's shoulder, with a kind, amused smile, his winged hat and the gold staff over his shoulder catching the cool shaft.
- **Camera:** Medium two-shot, eye level.
- **Characters:** Hermes, Mikon.
- **Lines:** `v4_h1` Hermes: "Easy. Easy, sit up slowly..."; `v4_m1` Mikon: "Where... The wedding. I was at the wedding..."; `v4_h2` Hermes: "You were. And then you laughed with an olive in your mouth..."; `v4_m2` Mikon: "I died. At a wedding. In front of everyone."; `v4_h3` Hermes: "In front of everyone. Though... most of them were looking at the lamb."; `v4_m3` Mikon: "Who are you?"; `v5_h4` Hermes: "Hermes. I walk the dead down here..."; `v5_m4` Mikon: "Down where? What is this place?..."; `v5_h5` Hermes: "All very good questions... I'd also love a day off.".
- **Move:** Slow push in, `[1.03, 1.12, 0, 0]`.
- **Effects:** water ripples.

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Setting and light: a night beach on the river of the dead in a vast dark cavern, flat black still water with no blue, one cool white shaft of light from high above falling on the water near a wooden dock, a small warm lantern glow from one side, dense low fog over the water, long blood-red silk banners stretched across the river with their ends trailing in the water, tall hooded grey figures standing still in the shallows far off, the far bank lost in fog.

Characters: Hermes, the messenger god: looks about 22, slim and athletic, light warm skin, bright quick grey-green eyes, a sly charming half-grin, tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings on its crown. A knee-length pale ivory linen tunic with a narrow gold belt, a long near-black blood-red cloak pinned at his right shoulder with a round gold disc brooch, a slim gold herald's staff with two twined snakes and small silver wings resting over his shoulder. Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Shot: Medium two-shot, eye level. Hermes crouches beside Mikon on the stone bench at the water's edge, one hand steadying Mikon's shoulder, with a kind, amused smile, his winged hat and the gold staff over his shoulder catching the cool shaft. Mikon, pale and stunned, looks at him. Black water with the reflection of the shaft in the lower third, red banners and fog behind them. Wide 16:9 cinematic frame.
```

## Portraits

Eleven speaking characters, three expressions each. File name: `<character>-<expression>.jpg`. The wedding family is lit by wedding candlelight; the underworld cast (and Mikon, who does all his in-game talking on the river bank) by the river bank's cool shaft and warm lantern. Make each character's neutral first and use it as the reference for the other two.

| Character | Light | Expressions | Why these |
|---|---|---|---|
| Mikon | river bank | neutral, cheerful, stunned | his jokes and his shock at being dead |
| Hermes | river bank | neutral, amused, hurried | teasing, then late for the next one |
| Elpenor | river bank | neutral, wry, grim | the speech is dry jokes about grim things |
| Lykon | wedding candles | neutral, pleading, worried | begging him not to tell the goat joke, then the choke |
| Kleio | wedding candles | neutral, commanding, alarmed | giving orders, then the choke |
| Demeas | wedding candles | neutral, jolly, sheepish | the toast, then the lamb at the funeral |
| Thea | wedding candles | neutral, happy, tearful | the wedding, then the funeral |
| Nikias | wedding candles | neutral, embarrassed, frightened | the toast, then the rescue |
| Charon | river bank | neutral, stern, dry | "Coin." and "If anybody asks, you paid" |
| Theseus | river bank | neutral, warning, resigned | "Don't sit down" and four years in a chair |
| Pirithous | river bank | neutral, sheepish, panicked | "This was my idea" and "I'm part chair now" |

### Mikon

**mikon-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Expression: a calm, open, slightly tired expression, lips closed, looking just off camera. Vertical 4:5 portrait, dark background, no other people.
```

**mikon-cheerful.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Expression: a big gap-toothed grin, eyes crinkled, mid-chuckle, warm and pleased with himself. Vertical 4:5 portrait, dark background, no other people.
```

**mikon-stunned.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40: short, round-bellied, broad soft shoulders, big friendly hands, olive weathered skin, a round face, large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top, dark stubble, a gap-toothed grin. He wears a long coarse undyed oatmeal wool chiton pinned at the shoulders with dull gold disc pins and belted with a twisted dark brown cord, and a plain warm charcoal wool mantle slung over his left shoulder.

Expression: eyes wide, eyebrows high, mouth slightly open, pale and lost, as if he has just heard bad news. Vertical 4:5 portrait, dark background, no other people.
```

### Hermes

**hermes-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Hermes, the messenger god: looks about 22, slim and athletic, light warm skin, bright quick grey-green eyes, a sly charming half-grin, tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings on its crown. A knee-length pale ivory linen tunic with a narrow gold belt, a long near-black blood-red cloak pinned at his right shoulder with a round gold disc brooch, a slim gold herald's staff with two twined snakes and small silver wings resting over his shoulder.

Expression: a composed, knowing half-smile, eyes steady and kind. Vertical 4:5 portrait, dark background, no other people.
```

**hermes-amused.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Hermes, the messenger god: looks about 22, slim and athletic, light warm skin, bright quick grey-green eyes, a sly charming half-grin, tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings on its crown. A knee-length pale ivory linen tunic with a narrow gold belt, a long near-black blood-red cloak pinned at his right shoulder with a round gold disc brooch, a slim gold herald's staff with two twined snakes and small silver wings resting over his shoulder.

Expression: a sly grin, one eyebrow raised, eyes bright with mischief. Vertical 4:5 portrait, dark background, no other people.
```

**hermes-hurried.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Hermes, the messenger god: looks about 22, slim and athletic, light warm skin, bright quick grey-green eyes, a sly charming half-grin, tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings on its crown. A knee-length pale ivory linen tunic with a narrow gold belt, a long near-black blood-red cloak pinned at his right shoulder with a round gold disc brooch, a slim gold herald's staff with two twined snakes and small silver wings resting over his shoulder.

Expression: glancing back over his shoulder, eyebrows up, already half turned to go, a quick apologetic smile. Vertical 4:5 portrait, dark background, no other people.
```

### Elpenor

**elpenor-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Elpenor, a dead sailor: a lean, wiry Greek man of about 21, deep sun-tanned skin gone dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back with a cord, a short scruffy beard, hooded amused dark brown eyes, a wry crooked smile, a small bronze ring in one ear. A wet charcoal linen work tunic with faint white salt marks, knotted at the left shoulder with the right shoulder bare, a black tarred rope belt, and a frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders.

Expression: quiet and patient, a steady gaze, a netting needle in his fingers at the bottom of the frame. Vertical 4:5 portrait, dark background, no other people.
```

**elpenor-wry.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Elpenor, a dead sailor: a lean, wiry Greek man of about 21, deep sun-tanned skin gone dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back with a cord, a short scruffy beard, hooded amused dark brown eyes, a wry crooked smile, a small bronze ring in one ear. A wet charcoal linen work tunic with faint white salt marks, knotted at the left shoulder with the right shoulder bare, a black tarred rope belt, and a frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders.

Expression: a crooked one-sided smile, hooded amused eyes, head tilted. Vertical 4:5 portrait, dark background, no other people.
```

**elpenor-grim.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Elpenor, a dead sailor: a lean, wiry Greek man of about 21, deep sun-tanned skin gone dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back with a cord, a short scruffy beard, hooded amused dark brown eyes, a wry crooked smile, a small bronze ring in one ear. A wet charcoal linen work tunic with faint white salt marks, knotted at the left shoulder with the right shoulder bare, a black tarred rope belt, and a frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders.

Expression: unsmiling, eyes lowered and shadowed, jaw set, a hollow tired look. Vertical 4:5 portrait, dark background, no other people.
```

### Lykon

**lykon-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Expression: a nervous half-smile, eyebrows slightly raised. Vertical 4:5 portrait, dark background, no other people.
```

**lykon-pleading.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Expression: pained, eyebrows pulled up at the inner ends, long hands pressed together under his chin. Vertical 4:5 portrait, dark background, no other people.
```

**lykon-worried.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Lykon, Mikon's best friend: a very tall, lanky, long-necked Greek man in his thirties, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes, messy mid-brown hair. He wears a faded sage-green linen chiton slightly too short for him, so his bony shins show, and a smoke-grey wool cloak pinned at his right shoulder with a dull bronze ring brooch.

Expression: eyes wide, mouth tight, leaning forward in alarm. Vertical 4:5 portrait, dark background, no other people.
```

### Kleio

**kleio-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings.

Expression: composed, a sharp appraising gaze, lips pressed together. Vertical 4:5 portrait, dark background, no other people.
```

**kleio-commanding.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings.

Expression: chin up, one eyebrow down, mouth open mid-order, one finger raised. Vertical 4:5 portrait, dark background, no other people.
```

**kleio-alarmed.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Kleio, Mikon's aunt: a short, round, formidable Greek woman in her sixties, olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose, grey hair pinned in a low bun. A deep navy wool mantle, so dark it reads as black, is drawn over her head as a smooth hood framing her face, over a navy peplos edged with a thin gold line; a single string of round gold beads high at her throat, small gold earrings.

Expression: eyes wide with fear, mouth open shouting, the hood slipping back from her hair. Vertical 4:5 portrait, dark background, no other people.
```

### Demeas

**demeas-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand.

Expression: a mild contented smile, small twinkling eyes. Vertical 4:5 portrait, dark background, no other people.
```

**demeas-jolly.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand.

Expression: roaring with laughter, eyes vanished into his cheeks, wine cup raised beside his face. Vertical 4:5 portrait, dark background, no other people.
```

**demeas-sheepish.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Demeas, Mikon's uncle: a huge, jolly, barrel-chested Greek man in his sixties, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose, small twinkling dark eyes that vanish when he smiles. He wears a long cream linen chiton with loose draped sleeves and a deep plum wool mantle, almost black, wrapped round his belly and over his left shoulder with a gold meander border; a heavy gold signet ring; a bronze wine cup in his right hand.

Expression: sad and sheepish, eyes downcast, a guilty little shrug. Vertical 4:5 portrait, dark background, no other people.
```

### Thea

**thea-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.

Expression: warm and alert, a slight smile. Vertical 4:5 portrait, dark background, no other people.
```

**thea-happy.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.

Expression: laughing with her whole face, eyes shining. Vertical 4:5 portrait, dark background, no other people.
```

**thea-tearful.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Thea, the bride: a petite Greek woman of 23, light warm skin with freckles across her nose, large amber eyes, a short glossy auburn bob, a fine gold myrtle-leaf wreath. A floor-length gown of heavy liquid ivory silk with thin crossed gold straps and a narrow gold band high under the bust, draped open sleeves over sheer gold-embroidered tulle gauntlets, a flat gold collar necklace, and a sheer saffron-gold organza veil falling from the wreath to the floor.

Expression: eyes wet and red-rimmed, a small sad laugh through tears, the veil lit cool and grey. Vertical 4:5 portrait, dark background, no other people.
```

### Nikias

**nikias-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.

Expression: a kind, shy, gentle smile. Vertical 4:5 portrait, dark background, no other people.
```

**nikias-embarrassed.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.

Expression: blushing, laughing and looking down, one hand rubbing the back of his neck. Vertical 4:5 portrait, dark background, no other people.
```

**nikias-frightened.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a dark background of softly blurred candle points in a quarried stone hall. Warm amber candle key light from low front left, a thin cool rim of light from behind and above, the face fully readable, the rest falling into warm black.

Nikias, the groom: a tall, gentle, slightly awkward Greek man of about 24, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears, soft brown curls under a wreath of dark green myrtle. He wears a long ivory linen chiton with deep crisp vertical pleats, belted high with a narrow dark leather belt, and a fine matte black wool mantle over his left shoulder with a narrow ivory and gold border.

Expression: urgent and wide-eyed, brows drawn together, jaw set with effort. Vertical 4:5 portrait, dark background, no other people.
```

### Charon

**charon-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Charon, the ferryman of the dead: very tall, gaunt and stooped, a long craggy face with a ragged grey beard, deep-set eyes with a faint ember glow, long bony hands. A worn short tunic of faded, wet, blood-red wool, darker at the hem, a ragged dark brown cloak over his shoulders, a conical felt cap pulled low so its shadow hides most of his face, a long black punting pole.

Expression: still and unreadable, eyes glinting faintly under the shadow of his cap. Vertical 4:5 portrait, dark background, no other people.
```

**charon-stern.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Charon, the ferryman of the dead: very tall, gaunt and stooped, a long craggy face with a ragged grey beard, deep-set eyes with a faint ember glow, long bony hands. A worn short tunic of faded, wet, blood-red wool, darker at the hem, a ragged dark brown cloak over his shoulders, a conical felt cap pulled low so its shadow hides most of his face, a long black punting pole.

Expression: deadpan and flat, one long bony hand held out palm up at the bottom of the frame, demanding payment. Vertical 4:5 portrait, dark background, no other people.
```

**charon-dry.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Charon, the ferryman of the dead: very tall, gaunt and stooped, a long craggy face with a ragged grey beard, deep-set eyes with a faint ember glow, long bony hands. A worn short tunic of faded, wet, blood-red wool, darker at the hem, a ragged dark brown cloak over his shoulders, a conical felt cap pulled low so its shadow hides most of his face, a long black punting pole.

Expression: the faintest dry twitch at one corner of the mouth, the ember eyes softened. Vertical 4:5 portrait, dark background, no other people.
```

### Theseus

**theseus-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Theseus, the hero-king of Athens, trapped: a powerfully built Greek man in his late forties gone stiff and dusty, a square weathered face, heavy brows, tired grey eyes, cropped greying dark hair, a short grey-streaked beard. A dulled bronze muscle cuirass over a faded ivory linen tunic, a dark wool cloak grey with dust, sitting rigidly on a rough black stone chair that his cloak and back have grown into.

Expression: proud but stiff, sitting rigidly upright, dignified and dusty. Vertical 4:5 portrait, dark background, no other people.
```

**theseus-warning.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Theseus, the hero-king of Athens, trapped: a powerfully built Greek man in his late forties gone stiff and dusty, a square weathered face, heavy brows, tired grey eyes, cropped greying dark hair, a short grey-streaked beard. A dulled bronze muscle cuirass over a faded ivory linen tunic, a dark wool cloak grey with dust, sitting rigidly on a rough black stone chair that his cloak and back have grown into.

Expression: leaning forward as far as the stone chair lets him, one hand raised palm out, eyes wide, mouth open mid-shout. Vertical 4:5 portrait, dark background, no other people.
```

**theseus-resigned.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Theseus, the hero-king of Athens, trapped: a powerfully built Greek man in his late forties gone stiff and dusty, a square weathered face, heavy brows, tired grey eyes, cropped greying dark hair, a short grey-streaked beard. A dulled bronze muscle cuirass over a faded ivory linen tunic, a dark wool cloak grey with dust, sitting rigidly on a rough black stone chair that his cloak and back have grown into.

Expression: a long weary look, mouth flat, eyes lifted slightly to the dark above. Vertical 4:5 portrait, dark background, no other people.
```

### Pirithous

**pirithous-neutral.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Pirithous, king of the Lapiths, trapped beside Theseus: a lean, restless Greek man in his forties, a long nose, bright dark eyes, a sheepish face, long black curly hair and beard shot with grey, a gold torque at his neck. A scuffed dark leather cuirass over a faded burgundy tunic, a dusty dark cloak, sitting on a rough black stone chair, his back and cloak fused into the stone.

Expression: restless, with a slightly guilty smile. Vertical 4:5 portrait, dark background, no other people.
```

**pirithous-sheepish.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Pirithous, king of the Lapiths, trapped beside Theseus: a lean, restless Greek man in his forties, a long nose, bright dark eyes, a sheepish face, long black curly hair and beard shot with grey, a gold torque at his neck. A scuffed dark leather cuirass over a faded burgundy tunic, a dusty dark cloak, sitting on a rough black stone chair, his back and cloak fused into the stone.

Expression: a broad sheepish grin, shoulders up, eyebrows raised. Vertical 4:5 portrait, dark background, no other people.
```

**pirithous-panicked.jpg**

```
Photorealistic cinematic still from a high-end period film set in ancient Greece, at night. Real actors, real costumes and real stone, never a cartoon, an illustration or a plastic 3D render. Low-key chiaroscuro lighting with one clear key light, deep near-black shadows that still hold detail in wet stone, water and heavy cloth, a thin rim of light separating every figure from the dark, thin haze that makes the light visible. Restrained palette: near-black, warm candle amber, ivory silk, blood red used sparingly, small accents of gold and silver. Shallow depth of field, natural skin texture, fine 35mm film grain, slightly muted colour. Hands natural with five fingers. No text, no captions, no logos, no watermark.

Chest-up portrait, head and shoulders filling the upper two thirds of the frame, against a near-black background with the faint blur of black water, fog and a distant shaft of light. A cool white top light from above rims the hair and shoulders, a warm lantern glow from one side lights the face, the face fully readable, the rest falling into cold black.

Pirithous, king of the Lapiths, trapped beside Theseus: a lean, restless Greek man in his forties, a long nose, bright dark eyes, a sheepish face, long black curly hair and beard shot with grey, a gold torque at his neck. A scuffed dark leather cuirass over a faded burgundy tunic, a dusty dark cloak, sitting on a rough black stone chair, his back and cloak fused into the stone.

Expression: eyes wide, teeth bared, both hands gripping the stone armrests. Vertical 4:5 portrait, dark background, no other people.
```

## Count and order

**51 images in all:** 18 film stills and 33 portraits (11 characters x 3). With 2 to 4 variations each, expect about 102 to 204 generations.

**The six to make first:**

1. **mikon-neutral**: Mikon is in thirteen of the eighteen stills; this becomes his character reference for all of them.
2. **s01**: the opening frame, and the first file the player checks for before it plays the storybook at all.
3. **s05**: Demeas's toast, the closest to the approved Style frame 1, so it sets the wedding look for the rest.
4. **s10**: the choke, the turn of the whole opening.
5. **s14**: the funeral, the turn from warm to cold and the red spreading.
6. **s18**: Hermes on the black beach: carries the longest stretch of dialogue and sets the river look.

**Then:** the other neutrals (hermes, elpenor, kleio, demeas, lykon, nikias; Thea already has her sheet), so every character has a reference; then s17, s02 to s04, s06 to s09, s11 to s13, s15, s16; then the remaining portraits, underworld cast first (they are what the player sees during gameplay): hermes-amused, hermes-hurried, elpenor-wry, elpenor-grim, mikon-cheerful, mikon-stunned, charon, theseus, pirithous, then the wedding family.
