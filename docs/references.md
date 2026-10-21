# The Coin: visual references

The art bible for the overhaul. It is built from Karnika's Pinterest board **Game design** (https://in.pinterest.com/karnika0801/game-design/, a private board, 51 pins on 2026-10-22) and from about twenty public-domain museum images kept outside the repo in `elpis-assets/refs/`.

This file holds links and written descriptions only. No pin images are copied anywhere. Museum images are credited below and live in `/Users/karnikasehgal/Documents/elpis-assets/refs/` (there is a one-page visual summary at `refs/board.html`).

Hex values are estimated by eye from the pins in the browser, not measured with a picker. Treat them as starting points and tune them in the engine against the pins.

---

## The look in one paragraph

Night, stone and water, cut by a few hard sources of light. Most of every frame is close to black, and the black is not empty: it is wet stone, still water and heavy cloth that catch a thin edge of light. Into that dark the game puts three things that glow. The first is warm candlelight, hundreds of small amber flames in niches and along tables. The second is cloth, either ivory silk and sheer white fabric that drifts like smoke, or blood-red silk that pours down from ruins and spills across water. The third is metal: silver armour-like bodices, gold pins, a coin. People are dressed like couture on a museum plinth, not like a costume party: sheer black organza, liquid ivory silk, veils that cover the whole body, deep hoods. The wedding is the warm, ivory half of this world and the river bank is the cold, red-and-black half, and the same materials connect them so the wedding can turn into the funeral without changing sets.

---

## Palette

| Name | Hex | Where it comes from | Use |
|---|---|---|---|
| Night black | `#0B0A0C` | Shadows of the quarry banquet (5627), the stage in 5769 | The base. Sky, deep water, far walls |
| Warm black | `#16110E` | Shadowed stone between candles (5627, 5756) | Stone in shadow near warm light; never use pure `#000` |
| Cold black | `#121418` | The hooded figures in water (5879) | River, underworld, the shades |
| Smoke grey | `#2A2D33` | Figures and haze in 5879, tulle in 5752 | Fog, veils, the shades' cloaks |
| Blood red | `#8E0E14` | Silk banners in 5769, red veil in 5773 | Red cloth in light |
| Blood red, shadow | `#4A0509` | Folds of the red figure (6432, 5769) | Red cloth in its own shadow |
| Blood red, edge | `#C4202A` | Rim-lit silk edges in 5769 | Only on thin edges and highlights |
| Burgundy drape | `#6E1A24` | Draped ruins (5606, 5782) | Older, sun-faded red for the wedding ruin and the funeral |
| Ivory silk | `#E9DFC8` | Liquid satin gown (6358) | Bride, white drapes in light |
| Ivory, shadow | `#B9A98A` | Folds in 6358 and the white hall (5616) | Ivory in shadow; keeps white from going grey |
| Sheer white | `#D8D2C4` | The draped hall (5616), garden arch (5610) | Gauze, arches, ceiling swags |
| Silver | `#C9CBCF` | Highlights on the metal bodices (5584, 5516) | Gods' armour, jewellery, the coin's edge |
| Silver, mid | `#8A8D93` | Mid-tones of the same | Metal away from the key light |
| Gold | `#C9A24A` | Gold fibulae, the coin, the gold-and-black gown (5579) | Pins, wreaths, the coin. Small amounts only |
| Candle amber | `#FFB55A` | Candle halos (5627, 5756, 5764) | Candle light colour, about 2000 to 2200 K |
| Candle core | `#FFE3A8` | The flames themselves | Flame sprites, brightest wedding highlights |
| Shaft white | `#DCE6EE` | Overhead beams (6380, 5752, 5627) | Cool moon or sky shafts, about 6500 to 7500 K |
| Garden green, dark | `#2B3326` | Canopy in the garden aisle (5610) | Only for the garden aisle; keep it nearly black |

**Value structure (the most important rule):**

- **River bank and underworld:** 65 to 75 percent of the frame at or below 10 percent brightness. Mid-tones about 20 percent (stone, fog, cloaks). Highlights 5 percent or less, and only in three places: the light shaft, the water's reflection of it, and red cloth edges.
- **Wedding in the quarry:** 45 to 55 percent near-black. Warm mid-tones (lit stone, faces, tables) about 35 percent. Highlights about 10 percent, almost all candle flames and their sparkle on the water.
- **White draped hall and garden aisle:** the exception. Only 15 to 25 percent near-black, mostly in corners and under benches. Most of the frame is ivory and sheer white in the middle values, so the black of the guests' clothes reads strongly against it.
- **Never** a bright, evenly lit, sunny frame. If a screenshot looks fine in a well-lit room, it is too bright.

---

## Light

General rules for every scene:

- **One key light, and you should be able to say where it is.** Either a top-down shaft (cool) or a crowd of candles (warm). Never a flat front fill.
- **Fill comes from the scene, not from a fill light.** Water and pale stone bounce the key back up. Keep ambient very low (night black should stay black).
- **Rim light separates people from the dark.** Every character standing in the dark gets a thin rim from behind or above, in the colour of the nearest key.
- **Haze is how light becomes visible.** Thin volumetric fog in every scene so shafts and candle halos read as shapes (6380, 5756, 5627).
- **Water doubles everything.** Every bright source should appear twice: once in the air and once broken up in the water.

| Scene | Key | Fill | Rim | Haze |
|---|---|---|---|---|
| Wedding, quarry banquet | Hundreds of candles, 2000 to 2200 K, low and close to the guests; brightest along the central table | Warm bounce from pale stone walls; cool-green bounce from the water | Warm candle rim on faces and shoulders from below and behind | Light warm haze toward the far end; one cool shaft from a high opening (5627) |
| Wedding, white draped hall | Soft top light through the fabric, neutral to warm, 3500 to 4000 K | The fabric itself glows and fills everything | Barely needed; the guests in black read against the ivory | Very light |
| Wedding, garden aisle | Overcast sky, cool and soft, plus white pillar candles along the aisle | Dark canopy keeps it low | Back light through the white arch makes it glow | Low ground mist |
| Turn to funeral | The candles go out row by row; one cool shaft remains | Fill drops to near zero | Red cloth gets a cool rim only | Haze thickens |
| River bank (night beach) | One cool shaft from above (moon or a gap in the cavern roof), 6500 to 7500 K, falling on the water near the dock | Reflection of the shaft in black water; nothing else | Cool rim on hoods, veils and the boat's prow; red cloth gets a red-tinted rim | Dense low fog over the water; the shaft cuts through it |
| House of Hades | Overhead spotlights on single figures and objects, like a gallery (7411, 5586) | Polished black floor reflections | Strong silver rim on metal and on Persephone | Thin haze so the spot beams show |

---

## Materials and fabrics

| Material | What it must look like in game |
|---|---|
| **Silk (ivory)** | Liquid and heavy. Long, soft, continuous folds that pool at the floor (6358). Strong, wide specular highlight that slides along each fold; shadows warm (`#B9A98A`), never grey. It should move slowly and swing after the body stops. |
| **Silk (red)** | Same weight, but used as drapes, banners and cloaks. Falls straight from a high point and puddles in loops on stone or water (5606, 5782). Where it lies on water it darkens and clings. Thin layers go translucent and glow when light is behind them. |
| **Organza and tulle (black)** | Stiff, sheer, layered. Translucency depends on the number of layers: one layer is smoky grey, three or more is black (5586, 5752). Edges catch light and draw a silver line. It holds big sculptural shapes (wings, spread panels) rather than hanging limp. |
| **Linen (Greek dress)** | The chiton is fine pleated linen: many narrow, parallel vertical folds that fall straight from shoulder pins and a belt (Delphi Charioteer, the kore, the caryatid). Matte, slightly crisp, no shine. This is the everyday base layer for every Greek character. |
| **Wool (himation and cloaks)** | Heavier, thicker, fewer and rounder folds. Wraps diagonally around the body and over one shoulder, often over the head for mourners and older women (Tanagra figurines, grave stelai). Matte, soft edges on highlights. |
| **Metal (silver and gold)** | Silver bodices are sculpted like anatomy and feathers (5584, 5516): high contrast, sharp reflections, dark in most of the surface with thin bright edges. Gold appears only as small accents: fibulae, wreaths, the coin. |
| **Stone** | Pale limestone and marble that reads warm where candles hit it and near-black elsewhere. Carved niches for candles. Wet at the water line, with a darker band and a reflection. Ruined arches and quarry walls rather than clean temples (5627, 5756, 5606). |
| **Water** | Black, still, mirror-like (5879, 5769). It reflects light shafts and candles as broken streaks. Small ripples only where something moves. No blue: it is black with reflections. On the wedding pool it can go a dark teal-green near candles (5627). |
| **Wax** | Ivory pillar and taper candles with drips running down and pooling (5764). Candle clusters, not single candles. |

---

## Costume rules per character type

Base every Greek garment on real construction: a chiton or peplos is a rectangle of cloth pinned at the shoulders and belted (see the Stratz diagram and the Hope plate); a himation is a large rectangle wrapped around the body. Then push the cut, fabric and colour toward the board.

**The bride**
- Ivory liquid silk chiton cut long and full, pooling on the ground (pin 6358 for the fabric, the Erechtheion caryatid and the Tanagra figurines for the drape).
- A sheer veil from the crown to the floor (the Greek bride's veil was real; see the Amasis Painter wedding procession and the wedding loutrophoros). Lace or embroidered gauntlet sleeves as in 6358.
- Fine silver or crystal hair chains (pin 5567) instead of a heavy crown.
- At the turn to the funeral her veil is the first thing that changes: lit cool and grey, like the black tulle in 5752.

**Older women (mothers, mourners)**
- Heavy wool himation pulled over the head as a hood, the way the mourning women wear it on the funerary plaque (Met 54.11.5) and on the grave stelai.
- Colours: undyed wool, charcoal, burgundy `#6E1A24`. Black for mourning.
- Use the Met's marble old woman (09.39) for an older body under drapery: loose chiton slipping off one shoulder, a fold gathered at the belt.

**Older men**
- Himation wrapped around the body and over the left shoulder, chest partly bare or covered by a chiton, as on the family grave stele (Met 11.100.2) and the draped seated man (Met 09.221.4).
- Matte wool in dark tones, staff in hand.
- For the board's menswear note (pin 5760): tailored black over-layer plus a draped panel. In game this means a dark himation worn very cleanly, with one patterned or embroidered border.

**Young men**
- Short chiton belted at the waist, or the long pleated chiton of the Delphi Charioteer for formal moments (the wedding).
- Black and charcoal at the wedding to read against the ivory hall. A short cloak (chlamys) pinned at one shoulder.

**Gods (Hades, Persephone, Hermes)**
- Silver sculpted bodices and armour-like pieces from 5584 and 5516 over sheer grey or black skirts. Persephone: ivory silk plus silver, with a black organza outer layer that spreads like wings (5586).
- Hades: black, with a deep hood and a red lining (5585 is the closest pin).
- Hermes: travelling hat and short cloak as on the Sabouroff Painter lekythos (Met 21.88.17), with silver details instead of colour.

**The ferryman (Charon)**
- Take the shape straight from the white-ground lekythoi: a rough exomis or short tunic in faded red-brown, a conical felt cap, standing in the stern and poling (Met 21.88.17 and 09.221.44).
- Translate to the board: the red becomes a dark blood red `#4A0509` to `#8E0E14`, worn and wet at the hem; the face mostly lost under the cap's shadow.

**Shades (the dead)**
- Tall hooded figures in smoke-grey or charcoal cloaks that hang straight to the water (pin 5879).
- Faces hidden; no hands unless they reach out. They stand in the water up to the shins and their reflections are the brightest part of them.
- Some shades wear full-body veils like 5752 and the red-veiled figure in 5773 (the red one is special: use her once, for a key moment).

---

## Wedding scene direction

The wedding is Mikon's world at its warmest, and the player should feel the funeral already sitting inside it.

- **Setting:** a quarried stone hall at night with water running down its middle (5627 for the layout and candle niches, 5756 for the one-point view along a black water channel with tables on both sides). The bride and groom walk along the water.
- **Ivory layer:** sheer white fabric hung from the quarry ceiling and draped over seating, as in the white hall (5616), but only in the upper third of the frame so the quarry stays dark underneath.
- **Aisle:** where the procession arrives, a flowing white arch between two trees or two stone pillars, lit from behind (5610).
- **Red is held back.** One burgundy drape over a ruined arch at the edge of the quarry (5606) is the only red at the wedding. When the wedding turns into the funeral, that red is what spreads: more drapes fall, and the candles go out row by row.
- **People:** guests in black and charcoal, which reads well against ivory and candlelight; the bride in ivory silk; older women hooded in himatia.
- **Reference the procession:** the Amasis Painter lekythos (Met 56.11.1) shows the bride and groom in a cart led by torch-bearers and musicians. Use torches and music for the arrival.

## River bank direction

The Styx is a night beach, and it should feel like a stage after the audience has left.

- **Water:** flat black water filling most of the lower frame (5879, 5769). The shades stand in it in rows, their reflections sharper than they are.
- **Light:** one cool shaft from above falling onto the water near the dock (6380 for the shaft, 5752 for how a beam lights a veil from the crown). Everything else is lit only by its reflection in the water.
- **Red:** long red silk banners stretched over and across the water, some hanging from a ring or a broken structure, the ends trailing in the water (5769). A single red-robed figure can stand on the water as a focal point.
- **Charon's boat:** dark wood, a lantern or a single flame at the prow; Charon in faded blood red from the lekythoi.
- **Fog:** low, dense, cut by the shaft. The far bank never fully visible.
- **The House of Hades** (later): gallery light, polished black floors, spotlights on single figures and on couture costumes on plinths (7411, 5586), red thread installations (6375).

---

## Pins chosen (the ten that define the look)

All pins are on the private board https://in.pinterest.com/karnika0801/game-design/. Descriptions were written while viewing each pin; nothing was saved.

**1. Candlelit quarry banquet over water** (wedding)
https://in.pinterest.com/pin/641481540721805627/
High aerial view down into a vast carved stone quarry or cave, with tiers of rough pale-brown rock. A long single banquet table runs diagonally across a dark teal-green pool, lit along its whole length by candles; round tables with candle centrepieces in the foreground; candles in niches up the walls and a crowd on a far terrace. Key light: the candles, warm amber about 2000 K, low and everywhere; one cool grey-white shaft of haze falls from the top left. About 45 percent of the frame is near-black (deep rock shadow, the corners); highlights are candle flames and their sparkle on the water. Take: the layout of the wedding (table on water, guests on both sides), candle niches carved into stone, warm stone against cool water, one cool shaft above the warm room.

**2. Banquet along a black water channel in a cave hall** (wedding, and the bridge to the river)
https://in.pinterest.com/pin/641481540721805756/
One-point perspective down a straight channel of black water. Two very long tables run along both sides, packed with tea lights; guests in black. Pale, smoothly quarried cream walls glow warm where the candles hit them. At the far end a huge dark boulder fills the arch, wrapped in fog that is backlit warm. About 35 percent near-black, mostly the water, which carries rippled reflections of the candles. Take: the central water channel, the wall of fog at the end of the axis (the same composition can be the river later), black water as the darkest value in a warm scene.

**3. Hall drowned in white fabric** (wedding, ivory layer) (video pin)
https://in.pinterest.com/pin/641481540721805616/
A concert hall where everything (ceiling, walls, every seat) is covered in ivory and off-white fabric: billowing swags from the ceiling, crumpled sheets over the seating. An orchestra in black sits in the middle, a black grand piano, a staircase in the foreground with a few small dark figures. Soft neutral-warm top light makes the fabric glow from inside. Only 15 to 20 percent near-black, in the corners. Take: sheer white swags in the upper part of the wedding space; black-clad people against ivory fabric as the wedding's main contrast.

**4. Garden aisle with a flowing white arch** (wedding arrival)
https://in.pinterest.com/pin/641481540721805610/
A paved stone path between dark wooden benches, edged with white flowers and white pillar candles, leads to an arch made of flowing white strands (fabric or wire) that pours between two big ivy-covered tree trunks like frozen water or smoke. Overcast soft daylight, dark green canopy almost black at the top. Take: the arch shape (two columns of flowing white that meet overhead), white candles lining the aisle, and lighting the arch from behind so it glows against the dark trees.

**5. Ruined arch veiled in burgundy** (wedding edge, then the funeral)
https://in.pinterest.com/pin/641481540721805606/
A ruined classical stone arch tower in a roofless courtyard, entirely veiled in sheer oxblood fabric that falls from the top and pools on the rubble. Flat overcast daylight, beige stone. Where the fabric is single-layered it is translucent and the arch shows through; where it folds it is deep red-black. Take: red fabric draped over Greek ruins, falling straight and puddling; burgundy `#6E1A24` as the wedding's only red; translucency by layer count. (Pin 5782, red fabric hanging from a ruined vault with a bright window behind, is the same idea indoors.)

**6. Red silk over black water, a red figure** (river bank)
https://in.pinterest.com/pin/641481540721805769/
A dark stage with a glossy black floor that reads as water. Long red silk banners stream horizontally across the middle of the frame; a ring hung from above carries more red cloth. A single figure in a long red hooded robe stands in the centre, mirrored in the water below. About 70 percent of the frame is near-black. Highlights are the cool top light on the silk edges, about `#C4202A` on `#8E0E14`. Take: the river bank's red: banners crossing over the water, a red focal figure, and red reflected in black water.

**7. Hooded figures standing in dark water** (the shades)
https://in.pinterest.com/pin/641481540721805879/
Seven tall figures in heavy hooded cloaks stand in a loose line in still dark water, with clear reflections beneath them. All charcoal and blue-black, low contrast, soft light from above; no bright highlight anywhere. About 55 percent near-black, the rest dark smoke grey `#2A2D33`. Take: how the shades look and stand (hooded, faceless, still, in the water), and how muted the river is outside the main shaft of light.

**8. Black tulle veil under a single spotlight** (veils, mourning, the bride at the turn)
https://in.pinterest.com/pin/641481540721805752/
A woman entirely covered by a floor-length black tulle veil, a narrow spotlight beam falling straight down on her head. The veil glows grey at the crown and fades to black at the hem; black ribbons hang from it; red and dark roses lie scattered on the floor. Grey studio backdrop. Take: lighting a veiled figure from directly above, how layered tulle goes from grey to black, and the image for the bride at the moment the wedding becomes a funeral.

**9. Black organza gown spread like wings** (couture, Persephone, gallery light)
https://in.pinterest.com/pin/641481540721805586/
A gown on a mannequin in a gallery: black sheer organza with huge panels spread out sideways as if lifted by wind, layer over layer so the centre is black and the edges are smoky. Warm gallery spotlights from above, pale floor. Take: black organza as a stiff, sculptural, layered material; outer layers for the gods; the gallery-spotlight look for the House of Hades.

**10. Silver armour bodice over a sheer skirt** (gods, silver)
https://in.pinterest.com/pin/641481540721805584/
Front, side and back views of a figure in a sculpted silver metallic bodice with ridges like a spine and ribs, pointed shoulder pieces and gauntlets, over a long sheer grey-silver chiffon skirt with a high slit; the face hidden by hair. White studio light. Take: silver as armour shaped like the body, sheer skirt under hard metal, for the gods and Persephone. (Pin 5516, silver bodices like feathers on mannequins, supports this.)

### Supporting costume pins (used in the costume rules)

- https://in.pinterest.com/pin/641481540721806358/ : Ivory liquid satin gown with wide sleeves and lace gauntlets, heavy folds catching a soft side light. The bride's fabric.
- https://in.pinterest.com/pin/641481540721805585/ : Runway look with a deep hood and cape in black with a dark red patterned lining, sequinned black underneath, long black cloak to the floor. Hades, and the red cloak.
- https://in.pinterest.com/pin/641481540721805760/ : Menswear on a red carpet: a black tailored coat over a long draped panel printed with a classical marble head, worn with a deconstructed, layered look. Menswear direction.
- https://in.pinterest.com/pin/641481540721805773/ : A figure under a floor-length red tulle veil in a dark green forest. The single red-veiled shade.

### All other pins (one line each)

- https://in.pinterest.com/pin/641481540721867916/ : Silhouette of several bodies with many arms forming a tree shape against a lit wall ("Tree bodies 2").
- https://in.pinterest.com/pin/641481540721807909/ : A prosthetic hand with long webbed, claw-like fingers.
- https://in.pinterest.com/pin/641481540721807411/ : Empty dark gallery with large pale paintings and round ceiling lights.
- https://in.pinterest.com/pin/641481540721807408/ : Hands painted black with long pointed nails and silver rings.
- https://in.pinterest.com/pin/641481540721806432/ : A figure entirely draped in red cloth on a black background.
- https://in.pinterest.com/pin/641481540721806392/ : A wall covered in hundreds of white masks, warm light.
- https://in.pinterest.com/pin/641481540721805759/ : Red threads falling from two pale panels like hair or blood.
- https://in.pinterest.com/pin/641481540721806388/ : Audience on a quarry floor facing a huge stone wall, with hanging white poles like wind chimes.
- https://in.pinterest.com/pin/641481540721806380/ : A white-robed figure floating in a cold light shaft above a red pyramid of bodies.
- https://in.pinterest.com/pin/641481540721806375/ : Red thread installation filling a room like a tunnel (Chiharu Shiota style).
- https://in.pinterest.com/pin/641481540721806359/ : A woman in large white feathered wings on a bed in a grey room.
- https://in.pinterest.com/pin/641481540721806331/ : Climbers on ropes in a deep green shaft lit from above.
- https://in.pinterest.com/pin/641481540721805868/ : Baroque dome with a huge sculpted relief of falling figures and a tiny person below.
- https://in.pinterest.com/pin/641481540721805867/ : A small bat resting on a person's arm.
- https://in.pinterest.com/pin/641481540721805861/ : A black cat with green eyes and horn-like ears.
- https://in.pinterest.com/pin/641481540721805859/ : A giant winged angel carved into the wall of a domed hall, a lone figure below.
- https://in.pinterest.com/pin/641481540721805782/ : Burgundy fabric hanging from a ruined vault and pooling on the floor, bright window behind.
- https://in.pinterest.com/pin/641481540721805765/ : A suspended winged figure made of wire and strips in a church with stained glass.
- https://in.pinterest.com/pin/641481540721805764/ : A cluster of tall ivory taper candles with heavy drips.
- https://in.pinterest.com/pin/641481540721805736/ : Collage of veiled, pale faces, long gold claw nails and white eyes with crystal tears.
- https://in.pinterest.com/pin/641481540721805734/ : Red thread figure hanging in a white room.
- https://in.pinterest.com/pin/641481540721805729/ : A menu printed on a sheer, wavy, sage-green material.
- https://in.pinterest.com/pin/641481540721805714/ : Black hooded dress with draped asymmetric skirt and thigh boots.
- https://in.pinterest.com/pin/641481540721805709/ : Runway dress made of melted ivory candles ("Drip Candle dress").
- https://in.pinterest.com/pin/641481540721805707/ : A woman in black standing in the centre of a stone spiral labyrinth on bare ground.
- https://in.pinterest.com/pin/641481540721805590/ : A dress form covered in overlapping metallic leaf scales.
- https://in.pinterest.com/pin/641481540721805588/ : Long pointed dark red stiletto nails.
- https://in.pinterest.com/pin/641481540721805581/ : Black and white portrait under a crystal-beaded veil and headpiece.
- https://in.pinterest.com/pin/641481540721805578/ : Black lace stockings with ribbon details.
- https://in.pinterest.com/pin/641481540721805575/ : Two silver-grey hooded looks with metal spine details.
- https://in.pinterest.com/pin/641481540721805579/ : Black and gold hooded gown with ruffled organza layers.
- https://in.pinterest.com/pin/641481540721805574/ : Black gown with huge sheer black insect-like wings in a gallery.
- https://in.pinterest.com/pin/641481540721805573/ : Silver fringe or chain gown with a beaded face veil.
- https://in.pinterest.com/pin/641481540721805572/ : Black and ivory hooded ceremonial robe with horned headpiece on a grassy hill.
- https://in.pinterest.com/pin/641481540721805564/ : Black and ivory gown with enormous bat-like wings in a gallery.
- https://in.pinterest.com/pin/641481540721805567/ : Fine crystal hair chains across a bun.
- https://in.pinterest.com/pin/641481540721805516/ : Silver feather-like metal bodices on mannequins, black and white photo.

---

## Museum references (downloaded)

All files are in `/Users/karnikasehgal/Documents/elpis-assets/refs/` (outside the repo), downscaled to at most 2000 px on the long side. Metropolitan Museum images are Open Access, public domain (CC0). Wikimedia files are public domain or CC0 as noted.

### Drape on statues and figurines (`refs/drape/`)

| File | Object | Source | Licence and credit | Why it matters |
|---|---|---|---|---|
| `met-248166-tanagra-standing-woman.jpg` | Terracotta statuette of a standing woman, late 4th to early 3rd c. BCE, Met 09.221.28 | https://www.metmuseum.org/art/collection/search/248166 | Public domain (Met Open Access). The Met, Rogers Fund, 1909 | Tanagra-type himation wrapped tight over a chiton: the everyday look for women |
| `met-247556-tanagra-draped-woman.jpg` | Terracotta statuette of a draped woman, ca. 315 to 285 BCE, Met 06.1138 | https://www.metmuseum.org/art/collection/search/247556 | Public domain. The Met, Rogers Fund, 1906 | Himation over the shoulders with one hand gathering it; shows how heavy wool falls in few, deep folds |
| `met-248008-kore.jpg` | Marble statue of a kore (maiden), late 6th c. BCE, Met 07.306 | https://www.metmuseum.org/art/collection/search/248008 | Public domain. The Met, Gift of John Marshall, 1907 | Fine Ionic chiton pleats and a diagonal mantle: the most "silk-like" drape in Greek sculpture |
| `met-248114-grave-stele-woman.jpg` | Marble grave stele of a woman, 425 to 400 BCE, Met 08.258.42 | https://www.metmuseum.org/art/collection/search/248114 | Public domain. The Met, Rogers Fund, 1908 | Funeral imagery; drape on a seated woman |
| `met-253505-grave-stele-woman-servant.jpg` | Marble grave stele of a young woman and servant, ca. 400 to 390 BCE, Met 36.11.1 | https://www.metmuseum.org/art/collection/search/253505 | Public domain. The Met, Fletcher Fund, 1936 | A young woman in fine chiton and mantle beside a plainer servant: two social levels of dress |
| `met-248483-grave-stele-family.jpg` | Marble grave stele with a family group, ca. 360 BCE, Met 11.100.2 | https://www.metmuseum.org/art/collection/search/248483 | Public domain. The Met, Rogers Fund, 1911 | Older man in a himation with bare chest and staff, a veiled woman behind him: older men and older women |
| `met-255391-mirror-peplos-woman.jpg` | Bronze mirror with a support in the form of a draped woman, mid-5th c. BCE, Met 1972.118.78 | https://www.metmuseum.org/art/collection/search/255391 | Public domain. The Met, Bequest of Walter C. Baker, 1971 | A peplos with its overfold, straight column folds: caryatid posture in small |
| `met-248132-old-woman.jpg` | Marble statue of an old woman, 14 to 68 CE, Met 09.39 | https://www.metmuseum.org/art/collection/search/248132 | Public domain. The Met, Rogers Fund, 1909 | An older body under a loose chiton slipping off the shoulder: older women |
| `met-248141-draped-seated-man.jpg` | Marble statue of a draped seated man, 1st c. BCE, signed by Zeuxis, Met 09.221.4 | https://www.metmuseum.org/art/collection/search/248141 | Public domain. The Met, Rogers Fund, 1909 | A male himation wrapped around the body in heavy folds |
| `commons-caryatid-erechtheion-bm.jpg` | Caryatid from the Erechtheion, British Museum Sc407 | https://commons.wikimedia.org/wiki/File:Caryatid_Erechtheion_BM_Sc407.jpg | Public domain (released by the photographer). Photo: Marie-Lan Nguyen (User:Jastrow), Wikimedia Commons | Peplos drape on a standing woman: the folds over the weight-bearing leg go straight like a column, the other knee pushes through. The bride's stance |
| `commons-delphi-charioteer.jpg` | The Charioteer of Delphi, bronze, ca. 478 to 470 BCE, Delphi Archaeological Museum | https://commons.wikimedia.org/wiki/File:Aurige._Mus%C3%A9e_Delphes._Gr%C3%A8ce.png | CC0. Photo: Jebulon, Wikimedia Commons | The long belted chiton with deep, regular vertical pleats: young men's formal dress |

### Vase paintings (`refs/vases/`)

| File | Object | Source | Licence and credit | Why it matters |
|---|---|---|---|---|
| `met-254843-amasis-wedding-procession.jpg` | Black-figure lekythos attributed to the Amasis Painter, ca. 550 to 530 BCE, Met 56.11.1 | https://www.metmuseum.org/art/collection/search/254843 | Public domain. The Met, Purchase, Walter C. Baker Gift, 1956 | A wedding procession: bride and groom in a cart with attendants and musicians. The wedding's arrival |
| `met-249069-lebes-gamikos-wedding.jpg` | Red-figure lebes gamikos (wedding bowl) attributed to the Washing Painter, ca. 430 to 420 BCE, Met 16.73 | https://www.metmuseum.org/art/collection/search/249069 | Public domain. The Met, Rogers Fund, 1916 | A bowl made for weddings, painted with women in chiton and mantle. The shape itself is a wedding prop for the banquet tables |
| `met-244821-loutrophoros-wedding.jpg` | Red-figure loutrophoros (ceremonial water vase), ca. 400 BCE, Met 75.2.15 | https://www.metmuseum.org/art/collection/search/244821 | Public domain. The Met, Gift of Samuel G. Ward, 1875 | Wedding scene with Eros. The loutrophoros carried the bride's bath water and was also set on the graves of the unmarried: the wedding and the funeral in one object |
| `met-251043-charon-hermes-lekythos.jpg` | White-ground lekythos attributed to the Sabouroff Painter, ca. 450 BCE, Met 21.88.17 | https://www.metmuseum.org/art/collection/search/251043 | Public domain. The Met, Rogers Fund, 1921 | Charon in a red-brown tunic and cap poling his boat, with Hermes: the ferryman's look and pose |
| `met-248182-charon-lekythos.jpg` | White-ground lekythos attributed to the Painter of Munich 2335, ca. 430 BCE, Met 09.221.44 | https://www.metmuseum.org/art/collection/search/248182 | Public domain. The Met, Rogers Fund, 1909 | Charon in red with a child at the shore: Charon's red and the scale of the dead beside him |
| `met-247920-funeral-lekythos.jpg` | White-ground lekythos attributed to the Sabouroff Painter, ca. 450 BCE, Met 07.286.40 | https://www.metmuseum.org/art/collection/search/247920 | Public domain. The Met, Rogers Fund, 1907 | Funeral scene at a tomb: the pale white-ground palette with faded red is a good model for the shades |
| `met-254801-funerary-plaque-mourners.jpg` | Black-figure funerary plaque, ca. 520 to 510 BCE, Met 54.11.5 | https://www.metmuseum.org/art/collection/search/254801 | Public domain. The Met, Rogers Fund, 1954 | The prothesis: the dead laid out, women mourners with mantles over their heads and arms raised, a chariot frieze below. Blocking for the funeral |

### Dress diagrams (`refs/diagrams/`)

| File | Object | Source | Licence and credit | Why it matters |
|---|---|---|---|---|
| `commons-doric-chiton-stratz.png` | Diagram of how to put on a Doric chiton, from C. H. Stratz, *Die Frauenkleidung und ihre natürliche Entwicklung*, 3rd ed. 1904, fig. 209 | https://commons.wikimedia.org/wiki/File:Doric_Chiton.png | Public domain. Carl Heinrich Stratz, via Wikimedia Commons | The pattern: one rectangle folded over at the top (the overfold), pinned at both shoulders and belted. Use it to build the cloth sim mesh |
| `commons-greek-womens-attire-hope.gif` | Plate of Greek women's dress with high belts, from Thomas Hope *Costumes of the Greeks and Romans*, Autenrieth, J. Moyr Smith and Furtwängler | https://commons.wikimedia.org/wiki/File:Greek-womens-attire-Regency-Empire-influence-hypsizonos.gif | Public domain, via Wikimedia Commons | Five line drawings of chiton and peplos variants with high belts: quick variety for women's costumes |

### Couture draping (links only, not Open Access)

None of the Madeleine Vionnet or Madame Grès (Alix) pieces at the Met Costume Institute are Open Access, so no images were downloaded. The API marks them as not public domain and serves no image. Links for viewing:

- Madeleine Vionnet, Evening dress, 1925, silk, C.I.46.16.10: https://www.metmuseum.org/art/collection/search/95201
- House of Vionnet, Evening dress, 1936 to 1937, silk, C.I.52.18.2: https://www.metmuseum.org/art/collection/search/83258
- Madeleine Vionnet, Evening dress, fall/winter 1937 to 1938, metal thread, C.I.53.40.1: https://www.metmuseum.org/art/collection/search/84014
- Alix (later Madame Grès), Evening dress, spring/summer 1938, silk, 2009.300.1214: https://www.metmuseum.org/art/collection/search/155905
- Alix, Evening dress, 1937, silk, 2009.300.1174: https://www.metmuseum.org/art/collection/search/155859
- Madame Grès, Evening dress, fall/winter 1972 to 1973, silk, 2009.300.3386: https://www.metmuseum.org/art/collection/search/158316

What to take from them, in general terms: Vionnet cut on the bias so silk clings and falls in soft, liquid folds that follow the body without darts; Grès pleated silk jersey by hand into fine, regular pleats gathered at the shoulders and waist, the closest modern equivalent of the Greek chiton. Together they are the bridge between the museum drapery above and the couture pins: Greek construction, couture fabric behaviour.
