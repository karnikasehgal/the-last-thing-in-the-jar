# The Coin: model sheets

Costume and body sheets for the eight characters of Episode 1. Each one brings a character from `public/play/film/bible.json` into the approved look in `docs/references.md` and the two approved style frames (`look-test/Style frame 1 wedding.jpg`, `look-test/Style frame 2 river bank.jpg`).

How to read this file:

- **Pins** are numbered by the last four digits of the Pinterest pin, as in `references.md` (for example 6358 is the ivory satin gown).
- **Museum files** are in `/Users/karnikasehgal/Documents/elpis-assets/refs/` and credited in `references.md`.
- **Palette hexes** in plain type come from the `references.md` palette. Hexes marked *(added)* are new character colours (navy, plum, sage, oatmeal, saffron) worked out to sit inside that palette: dark, low in saturation, and warm or cool to match the scene. Tune them in the engine against the pins, like the rest of the palette.
- **Measurements** are in centimetres from the floor unless stated. Body landmarks are taken from each character's height with ordinary adult proportions (shoulder point at about 0.82 of height, natural waist at about 0.62, knee at about 0.28, fingertip span about equal to height) and then adjusted for each build. Check them against the built body before cutting cloth: the landmarks matter more than the exact numbers.
- **MPFB values** follow `tools/blender/make_thea.py`. In MakeHuman, `age` 0.5 is 25 years and 1.0 is 90, so a year past 25 adds about 0.0077. `gender` 0 is female, 1 is male. `muscle` and `weight` 0.5 are average. `proportions` 1.0 is idealised; lower values are more ordinary. `height` is the macro (it shapes the proportions); the script then scales the finished body to the exact height in metres. Target names in the lists are MakeHuman's standard modifier targets; check each name against MPFB's target list before running, as `make_thea.py` does.
- **Cloth settings** are given relative to the linen in `tools/blender/garments.py` (mass 0.55, tension and compression 15, shear 10, bending 0.6, quality 12, collision distance 0.006, self collision 0.005), which already gives soft, rounded linen folds.

---

## Cast line-up

**Heights, tallest to shortest (to the top of the head):**

| Character | Height | Reads as |
|---|---|---|
| Lykon | 1.91 m | The tallest and thinnest: a reed. Head and neck clear above everyone at the table |
| Demeas | 1.90 m | Nearly as tall but twice as wide: the biggest mass in any frame |
| Nikias | 1.84 m | Tall, narrow-shouldered, a little stooped toward his bride |
| Hermes | 1.80 m | Slim and upright; the hat brim adds 8 cm and widens his head into a disc |
| Elpenor | 1.75 m | Lean and wiry; almost always seated, so he reads at about 1.30 m |
| Mikon | 1.68 m | Short, broad and round: the warm centre of the family |
| Thea | 1.60 m | Petite; the veil and its train make her look longer than she is |
| Kleio | 1.50 m | The smallest, and the most solid: a dark column with a face |

In a line, the family makes a deliberate rhythm: tall Demeas and tiny Kleio side by side (the oldest joke in comedy, and the warmest), Mikon square between them, Thea and Nikias a pale pair with a 24 cm height gap, and Lykon sticking up at the end of the row.

**How the colours read together at the wedding table.** The table and the hall are ivory and candlelight, so the family is dressed in dark grounds with pale linen showing underneath. Read from a distance, the table is a band of near-black wool (Kleio's navy, Demeas's plum, Mikon's warm charcoal, Nikias's black) with ivory linen at every neck and wrist, faces lit warm from the candles below, and small points of gold at each person (Kleio's beads, Demeas's cup and border, Nikias's border, Thea's wreath and collar). In candlelight at about 2000 K, navy reads as cold black, plum reads as a wine-black with a red edge where the flame catches it, and charcoal reads as warm black, so the three older family members look like one family in three temperatures of black. Mikon's undyed oatmeal chiton is the one warm mid-tone body among them, between the ivory and the black: the ordinary man. Lykon's sage-green is the only green at the table; candlelight turns it grey-olive, so it reads as faded and slightly wrong, which is the joke. Thea is the brightest value in the room after the flames: ivory silk under a saffron-gold veil that glows like a lamp shade when a candle is behind it. Nikias is ivory under black, so the couple share the ivory and he frames her.

Red is held back at the wedding (references.md): nobody in the family wears red. Demeas's plum is purple, not red, and is kept dark enough not to compete with the one burgundy drape on the ruined arch.

**The gods and the dead.** Hermes is the only figure with a hat silhouette and the only one in red-black at the river; his look comes straight from the approved river-bank style frame (oatmeal linen, a near-black red cloak, gold). Elpenor belongs to the cold half: wet charcoal and salt-grey, with a scrap of faded red sail, the same red as the banners over the water. The same materials (ivory and oatmeal linen, black wool, gold, red cloth) run through both halves, so Mikon in oatmeal can walk from the wedding to the river bank without looking like he came from another film.

**General rules for every sheet:**

- Every garment is a rectangle (or a tube made from rectangles) pinned, belted and draped on the body, as the Greeks made them (Stratz diagram, `refs/diagrams/commons-doric-chiton-stratz.png`). Nothing is tailored with sleeves set into armholes, collars, cuffs or buttons down the front.
- Couture comes from fabric, fit at a few chosen points (a high belt, cross-straps, a pinned shoulder line) and length. Menswear is long and falls straight; women's garments pool at the floor.
- Hands are always fully visible on the sheet, relaxed, fingers natural.
- Each character has one "hero" metal accent in gold (the gods and the bride may add silver).

**Shared simulation workflow (all characters):**

1. Build the bare body with MPFB, game-engine rig, at the exact height (as `make_thea.py`).
2. Cut each panel flat at the sizes below, about 1.5 cm edge length for silk and organza, 2 cm for linen and wool.
3. Wrap the panel into its starting shape close to the body in the rest A-pose (as `garments.py` does: a tube at the body's own width at each height, or a pre-wrapped spiral for a himation), pin the named landmarks, and let it fall for 150 to 200 frames.
4. Pleats: for chitons, pre-pleat the panel before the drop (accordion folds 1.0 to 1.5 cm deep at a 2 cm pitch along the top edge, fading out by the belt) so the fine vertical pleats of the kore and the Charioteer appear; back it up with a pleat normal map. Without this, linen sims as a smooth sack.
5. Inner layers first, apply the cloth modifier, then use the applied inner layer as a collision object for the next layer.
6. Bind to the skeleton by nearest-skin weights, with below-the-hip cloth weighted more to the pelvis than to each leg (as `garments.py` does), so a stride swings the hem instead of splitting it.
7. **Seated scenes.** Do not bend a standing-simmed long garment into a sitting pose: the hem goes through the thighs and the bench. For every character who sits (Thea, Nikias, Kleio, Demeas, Mikon and Lykon at the wedding table; Elpenor on his bench), simulate a second, seated variant of the long layers with the body posed seated on a collision proxy of the bench, bind that variant, and swap meshes when the character sits. Short over-layers (a chlamys) can share one sim.
8. Check every frame of the idle and talk animations for cloth through skin before export; push any offending cloth out along the skin normal by 4 mm, the same rule `make_thea.py` uses for hair.

---

## 1. Thea, the bride

### Silhouette

A small, slender column of liquid ivory under a long saffron-gold veil that falls from a gold wreath to a short train on the floor: the brightest thing in the room.

### Body (MPFB)

- **Height** 1.60 m. **Build** petite, slim, shapely; narrow shoulders, defined waist. **Age** about 23.
- **Skin** light, warm, freckled across the nose and cheeks (skin `toigo_light_skin_female_ginger_with_makeup`, as built).
- **Hair** short glossy auburn bob (`bob02`, recoloured deep copper-brown, side fringe swept to the temple, as built). Fine silver and crystal chains laid across the crown under the veil (pin 5567).
- **Eyes** large, amber (`brownlight`). **Facial hair** none.
- **Macros** (keep the existing build in `tools/blender/make_thea.py` exactly): gender 0.0, age 0.5, muscle 0.42, weight 0.38, proportions 1.0, height 0.35, cupsize 0.6, firmness 0.75; race caucasian 0.9, asian 0.05, african 0.05; plus the existing waist, hip, face and eye targets.

Key landmarks: shoulder point 131, under-bust 115, natural waist 99, hip 83, knee 45, ankle 7. Fingertip span 160. Elbow-to-elbow (arms out) 96. Bust 86, waist 64, hip 92.

### Garment layers, inside out

**1. Ionic chiton (the gown).**
- *History:* the Ionic chiton is two wide panels sewn up the sides and joined along the top edge by a row of small pins or buttons from the neck to the elbow, which makes loose draped sleeves; it is the fine, many-pleated dress of the kore (`refs/drape/met-248008-kore.jpg`, Met 07.306, https://www.metmuseum.org/art/collection/search/248008). High belts and cross-straps over the shoulders are in the Hope plate (`refs/diagrams/commons-greek-womens-attire-hope.gif`). The stance, weight on one leg so the folds fall straight as a column over it and the other knee pushes through, is the Erechtheion caryatid (`refs/drape/commons-caryatid-erechtheion-bm.jpg`).
- *Couture:* cut and worn exactly that way but in heavy liquid silk (pin 6358), so it clings at the bust and hips under the cross-straps, then falls in long continuous folds that pool on the floor. The fitted part is only the bust and ribcage, held by the gold cross-straps and a narrow belt under the bust; everything below falls free. The sleeves are draped and open, gathered at five points along each upper arm, to the elbow.
- *Fabric:* silk charmeuse, heavy (about 30 momme, 130 g per m²), satin face out, wide sliding highlight, warm shadows.
- *Colour:* Ivory silk `#E9DFC8`, shadows Ivory shadow `#B9A98A`. A woven saffron-gold band 1.5 cm wide at the neck edge and the hem (*added* Saffron gold `#D49A3A`).
- *Trims:* the band above. No embroidery on the body of the gown.

**2. Gauntlet sleeves.**
- *History:* none; this is the couture element from pin 6358 (lace gauntlets under wide sleeves). It replaces the bible's "gold cuffs".
- *Couture:* fitted sheer sleeves from the knuckles to just below the elbow, where the draped chiton sleeve begins, with a loop over the middle finger. They make her hands and forearms read in candlelight.
- *Fabric:* fine silk tulle, ivory, embroidered with a trailing myrtle vine in gold thread that gets denser toward the wrist.
- *Colour:* Sheer white `#D8D2C4` tulle, Gold `#C9A24A` embroidery.

**3. Cross-straps and belt (zoster).**
- *History:* crossed bands over both shoulders, crossing between the breasts and between the shoulder blades, with a belt under the bust (Hope plate; on the Delphi Charioteer the same straps run behind the shoulders, `refs/drape/commons-delphi-charioteer.jpg`).
- *Couture:* flat gold braid 1.2 cm wide; a small gold disc where the straps cross at the front, sitting at the sternum.
- *Colour:* Gold `#C9A24A`.

**4. Bridal veil (kredemnon).**
- *History:* the Greek bride wore a veil over her head through the procession (the Amasis Painter wedding procession, `refs/vases/met-254843-amasis-wedding-procession.jpg`, Met 56.11.1, https://www.metmuseum.org/art/collection/search/254843; the wedding loutrophoros, `refs/vases/met-244821-loutrophoros-wedding.jpg`) and lifted it at the wedding feast. Saffron-dyed cloth was tied to Greek women's festival and bridal dress (the *krokotos*), which is where Thea's signature colour now lives.
- *Couture:* a full rectangle of sheer silk from the crown to the floor, framing the face at the sides and falling into a short train behind, held at the crown under the wreath. Single layer over the ivory it reads as gold smoke; where it folds double it goes deep saffron. At the procession it is drawn forward over the face; at the feast it is pushed back.
- *Fabric:* silk organza, light (about 25 g per m²), crisp, with a faint sheen; translucency by layer count, like pin 5606.
- *Colour:* Saffron gold `#D49A3A` *(added)*, its folds Saffron shadow `#7A5222` *(added)*, rolled edge in Gold `#C9A24A` thread.
- *At the turn to the funeral:* the veil is the first thing to change (references.md): lit cool from above it goes grey-gold, like the black tulle in pin 5752.

**Jewellery:** a gold myrtle wreath of fine wire leaves over the veil (Hellenistic gold wreaths are real; it keeps the bible's myrtle wreath and adds the board's gold). A gold strap necklace with small seed-shaped pendants lying flat at the base of the neck (the bible's "gold collar"). Fine gold snake armbands on both upper arms under the sleeve. Silver and crystal hair chains under the veil (pin 5567). Small gold drop earrings.

**Footwear:** soft gilded leather slippers, hidden under the pooled hem.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton front | 105 x 150 | Width 105 per panel (total 210, 1.3 x fingertip span, 2.4 x bust). Length = shoulder 131 + 13 blousing + 6 pooling on the floor |
| Chiton back | 105 x 150 | Same |
| Gauntlet sleeve (x2) | tube 28 long, 15 round at the wrist, 23 round below the elbow | Skinned, not simulated |
| Cross-strap braid | 2 strips 1.2 x 135 | Rigid, skinned to the chest |
| Under-bust belt | 1.2 x 70 | Rigid, skinned |
| Veil | 120 x 270 | Rectangle. 270 = crown to floor (about 150) + 20 train + 100 for the fall over the head and the drape |

- **Side seams:** sewn from the hem up to 22 cm below the top edge on each side (armholes 22 cm).
- **Top-edge pins** (front edge to back edge), on each side, measured from the centre of the neck: 14, 22, 30, 38, 46 cm. Pin landmarks: left and right neck edge, mid-shoulder, shoulder point, upper arm, just above the elbow. The neck opening between the two 14 cm pins is 28 cm. Between pins the cloth hangs free in small swags; that is the sleeve.
- **Overfold (apoptygma):** none (Ionic).
- **Belt height:** under the bust at 115 cm. The cloth is pulled up through it so it blouses over by about 6 cm (the *kolpos*); the rest of the 13 cm blousing allowance becomes the soft fullness over the bust.
- **Cross-straps:** from the belt at the front, up over each shoulder (just outside the 22 cm pin), down the back to the belt; crossing at the sternum and between the shoulder blades.
- **Fullness:** 210 cm of cloth around a 64 cm waist, 3.3 to 1: all of it falls into folds below the belt.
- **Veil pins:** crown (top of head, under the wreath), left temple, right temple. Nothing else.

**Simulation notes:**
- Chiton, silk charmeuse: light-medium weight class. Mass 0.30, tension and compression 8, shear 5, bending 0.05, air damping 1.5. Pre-pleat the top 30 cm finely (1.0 cm deep, 1.6 cm pitch) so the bodice has the kore's crinkled pleats; let the skirt fall without pleats so it reads as liquid. Strong friction (8) at the belt ring so the blouse holds.
- Veil, organza: lightest class. Mass 0.10, tension 10 (organza is crisp, not stretchy), shear 6, bending 0.3 (enough body to hold a shape, not limp), air damping 3 so it drifts. Self collision on. Sim after the chiton with the chiton applied as a collider.
- Simulate standing in the A-pose, apply, bind. The veil's train should be weighted to the pelvis and the root, not the feet.
- **Seated (wedding table):** separate seated variant: the chiton pools over the knees and the bench and falls to the floor in front of the shins; the veil is pushed back and falls behind the bench back. Sim with the bench as a collider.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Ivory silk | `#E9DFC8` | Pin 6358, the liquid satin gown |
| Ivory shadow | `#B9A98A` | Pin 6358 folds, the white hall 5616 |
| Saffron gold *(added)* | `#D49A3A` | Gold `#C9A24A` warmed toward saffron; the krokotos; bible signature colour |
| Saffron shadow *(added)* | `#7A5222` | The same in a fold; matches the warm black of 5627 |
| Gold | `#C9A24A` | Gold fibulae and the gold-and-black gown, pin 5579 |
| Silver | `#C9CBCF` | Hair chains, pin 5567 |

### What it must NOT look like

- A modern satin prom dress or a sweetheart-neckline wedding gown with a fitted bodice and seams.
- A saffron-yellow costume-shop toga, or a solid yellow gown (the board says ivory; the gold is in the veil).
- The current in-game look (look-test `Thea 6`): a stiff yellow tube with a flat bodice and the skirt standing off the body like cardboard. No straight-sided cylinder below the belt; the silk must cling at the hips and pool.
- Tiered rings of cloth around the skirt (the sim stacking horizontal folds). Folds must be vertical and long.
- A heavy crown or a tiara.
- Veil cloth through the face, or the veil floating off the head like a tent.

### Image prompt

A realistic, film-quality 3D character model sheet of Thea, a petite 23-year-old Greek bride, 1.60 m tall, slender and shapely, light warm skin with freckles across her nose, large amber eyes and a short glossy auburn bob swept off one eye, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. She wears a floor-length Ionic chiton of heavy liquid ivory silk that clings at the bust under thin crossed gold straps and a narrow gold belt high under the bust, then falls in long vertical folds that pool on the floor, with draped open sleeves gathered by tiny gold pins along the upper arm to the elbow, a fine saffron-gold band at the neckline and hem, and sheer ivory tulle gauntlet sleeves embroidered with a gold myrtle vine; over everything a sheer saffron-gold silk organza veil falls from a fine gold myrtle-leaf wreath on her crown to a short train behind her, gold where it is single and deep saffron where it folds, with fine silver crystal chains glinting through it; a flat gold strap necklace at the base of her neck. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep shadows that stay warm, rich film grain, matching the candlelit quarry wedding of the approved style frame. No text, no labels, no logos.

---

## 2. Mikon, the salt-fish seller

### Silhouette

A short, square, round-bellied man in a long undyed chiton that falls straight from broad shoulders to the shin, a dark wool mantle slung over one shoulder: a warm loaf of a man.

### Body (MPFB)

- **Height** 1.68 m. **Build** stocky and pear-shaped: short legs, a round belly, broad soft shoulders, big hands. **Age** about 40.
- **Skin** olive Mediterranean, weathered on the face and forearms from the market (start from `middleage_caucasian_male` and warm and darken it toward olive; dark stubble painted into the skin texture).
- **Hair** short black curls, thinning on top (`short02` recoloured near-black `#1A1512`, with the crown alpha thinned). Thick, expressive black eyebrows (the heaviest eyebrow proxy; compare `eyebrow001` to `eyebrow012`).
- **Eyes** large, warm brown (`brown`). **Facial hair** two days of dark stubble; no beard. A big bulbous nose; a small gap between the front teeth.
- **Macros:** gender 1.0, age 0.615, muscle 0.5, weight 0.8, proportions 0.25, height 0.3. Targets: `stomach-pregnant-incr` 0.4 (the belly), `measure-upperleg-height-decr` 0.3 and `measure-lowerleg-height-decr` 0.2 (short legs), `measure-shoulder-dist-incr` 0.2, `measure-neck-circ-incr` 0.3, `head-round` 0.4, `nose-volume-incr` 0.5, `nose-scale-horiz-incr` 0.3, `l-eye-scale-incr` and `r-eye-scale-incr` 0.2, `l-hand-scale-incr` and `r-hand-scale-incr` 0.15.

Landmarks: shoulder point 137, natural waist 101, hip 85, knee 46, ankle 7. Fingertip span 165. Chest 112, belly 112, hip 110.

### Garment layers, inside out

**1. Doric chiton (long, men's).**
- *History:* a single rectangle wrapped round the body, sewn closed down one side, pinned at both shoulders and belted, with no overfold for men (Stratz diagram `refs/diagrams/commons-doric-chiton-stratz.png`; https://commons.wikimedia.org/wiki/File:Doric_Chiton.png). The plain, undecorated version is what the servant wears beside her mistress on the grave stele `refs/drape/met-253505-grave-stele-woman-servant.jpg` (Met 36.11.1): the same garment as the rich, in a coarser cloth.
- *Couture:* worn long, to the middle of the shin, so he has the long menswear line of the board instead of a short workman's tunic. Bloused over the belt so the belly is held, not hidden: the cloth falls from the shoulders straight down the front of the belly to the belt, then straight to the hem. Fitted nowhere; the fit comes from the belt and the length.
- *Fabric:* coarse undyed wool and linen blend, about 220 g per m², slubby, fully matte, rounder folds than fine linen. Salt marks faintly at the hem.
- *Colour:* Oatmeal *(added)* `#BFAE8E`, in shadow Oatmeal shadow *(added)* `#7C6D55`. A single narrow self-coloured woven stripe 1 cm above the hem.
- *Pins:* two plain bronze-gold disc pins, one per shoulder (Gold `#C9A24A`, dulled).

**2. Belt (zoster).**
- *History:* a cord belt at the waist over which the chiton is bloused (Stratz diagram, last figure).
- *Couture:* the bible's rope belt, made decent: a twisted cord of dark undyed wool, 1.5 cm thick, wrapped twice and knotted at the front left with two long ends hanging to mid-thigh.
- *Colour:* Dark brown *(added)* `#4A3626`.

**3. Himation (his one good mantle).**
- *History:* a large rectangle of wool wrapped round the body and over the left shoulder, leaving the right arm free, as on the family grave stele (`refs/drape/met-248483-grave-stele-family.jpg`, Met 11.100.2, https://www.metmuseum.org/art/collection/search/248483) and the seated man (`refs/drape/met-248141-draped-seated-man.jpg`, Met 09.221.4).
- *Couture:* a smaller, plainer himation than his uncle's, worn neatly over the left shoulder and round the back, across the hips under the right arm, the end thrown back over the left forearm. Dark against the oatmeal so he has the board's black-and-pale contrast; it makes him look dressed up for the wedding without making him rich.
- *Fabric:* medium wool twill, about 320 g per m², matte, soft edges on the highlights.
- *Colour:* Warm charcoal *(added)* `#2B2622`, which sits between Warm black `#16110E` and Smoke grey `#2A2D33`. No border: he can't afford one.

**Footwear:** worn brown leather sandals with ankle straps, toes visible. Colour `#4A3626`.

**Jewellery:** none. A small leather purse on a cord at the belt (for the coin later).

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton | 200 x 118 | Width 200 (1.2 x fingertip span; 1.8 x chest). Length = shoulder 137 down to mid-shin at 27 = 110, plus 8 blousing |
| Belt cord | 1.5 round x 260 | Two wraps plus a knot and two 40 cm ends |
| Himation | 260 x 120 | Rectangle |

- **Chiton seams:** one seam closing the rectangle into a tube down the right side, from the hem up to 24 cm below the top edge (right armhole 24 cm); the left armhole is the fold, 24 cm.
- **Chiton pins:** two per shoulder, front edge to back edge, at 11 and 17 cm from the neck centre on each side (landmarks: left neck-shoulder, left mid-shoulder, right neck-shoulder, right mid-shoulder). The neck opening is 22 cm. Between the 17 cm pin and the armhole the cloth hangs free and forms the short cap sleeve.
- **Overfold:** none.
- **Belt height:** natural waist at 101, under the belly; cloth pulled up 8 cm through it so it blouses over the cord all round.
- **Fullness:** 200 around a 112 belly: modest, he's not swamped.
- **Himation wrap** (landmarks): corner A hangs in front of the left shoulder to the left knee (about 90 cm); the cloth runs up over the left shoulder, diagonally down across the back, round under the right arm at the waist, across the front of the hips, and the end goes back over the left forearm. Hidden tack pins for the sim: left shoulder top, left shoulder front, left hip.

**Simulation notes:**
- Chiton, coarse wool-linen: medium class. Mass 0.70, tension and compression 20, shear 12, bending 1.5 (rounder, fewer folds than fine linen). Pre-pleat lightly (1.5 cm deep, 3 cm pitch) above the belt only.
- Himation, medium wool: medium-heavy class. Mass 0.95, tension 25, shear 15, bending 3.0. Start it as a pre-wrapped spiral 1.5 cm off the chiton, then drop. Friction 10 against the chiton so it stays on the shoulder.
- Simulate standing, bind. He walks a lot: weight the chiton below the hips to the pelvis at 0.7.
- **Seated:** separate seated variant for the chiton and himation; the himation end lies on the bench beside him.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Oatmeal *(added)* | `#BFAE8E` | Bible's undyed oatmeal wool; the oatmeal linen in Style frame 2; Ivory shadow `#B9A98A` nudged warmer and rougher |
| Oatmeal shadow *(added)* | `#7C6D55` | The same in a fold |
| Warm charcoal *(added)* | `#2B2622` | Between Warm black and Smoke grey; guests in black at the wedding (5616, 5756) |
| Dark brown *(added)* | `#4A3626` | Belt and sandals; the servant's plain dress on Met 36.11.1 |
| Gold, dulled | `#C9A24A` at low gloss | The two shoulder pins; the gold in Style frame 2 |

### What it must NOT look like

- A sweater or a sweatshirt (look-test `Thea 6` shows a male guest in exactly this: a fitted pale knit top with set-in sleeves). No sleeves sewn into armholes; no ribbed neck.
- A costume-shop "peasant" tunic with a hairy rope belt and a hemp texture.
- A short, knee-length tunic showing bare thighs: he is long and dignified, even if poor.
- A sack: the belt must be visible and the blouse must be there, or the belly turns into a box.
- Mantle sliding off the shoulder in animation, or himation folds standing off the body like cardboard.

### Image prompt

A realistic, film-quality 3D character model sheet of Mikon, a stocky, pear-shaped Greek salt-fish seller of about 40, 1.68 m tall, with short legs, a round belly, broad soft shoulders and big friendly hands, olive weathered skin, a round face with large warm brown eyes, a big bulbous nose, thick expressive black eyebrows, short black curly hair thinning on top and dark stubble, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a long Doric chiton of coarse undyed oatmeal wool that falls straight from two dull gold disc pins at the shoulders to the middle of his shins, bloused over a twisted dark brown wool cord tied at the front with long ends, and a plain warm charcoal wool himation slung over his left shoulder, wrapped round his back and hips with its end over his left forearm, in soft, heavy, matte folds; worn brown leather sandals. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep warm shadows, rich film grain, matching the approved candlelit wedding and river bank style frames. No text, no labels, no logos.

---

## 3. Kleio, the aunt

### Silhouette

A short, round, upright column of deep navy wool with a hood drawn over her pinned grey hair, a pale face, a gold glint at the throat and a hand clutching the mantle: small, dark and impossible to argue with.

### Body (MPFB)

- **Height** 1.50 m. **Build** short and round, full bust and hips, strong forearms, upright posture (she never stoops). **Age** about 64.
- **Skin** olive, lined at the eyes and mouth, a little sun on the cheeks (start from `old_caucasian_female` and warm it toward olive; it must still look well kept).
- **Hair** grey, pinned up in a low coiled bun at the nape, mostly under the hood; a grey wave shows at the forehead (`ponytail01` coiled into a bun, recoloured `#A9A6A0`).
- **Eyes** sharp, dark brown, a little narrowed (`brown`). Strong, slightly hooked nose. **Facial hair** none.
- **Macros:** gender 0.0, age 0.8, muscle 0.4, weight 0.85, proportions 0.3, height 0.08, cupsize 0.7, firmness 0.2. Targets: `measure-waist-circ-incr` 0.3, `hip-scale-horiz-incr` 0.2, `measure-neck-circ-incr` 0.2, `nose-hump-incr` 0.4, `nose-scale-vert-incr` 0.2, `head-round` 0.3, `l-eye-height2-decr` and `r-eye-height2-decr` 0.15 (the narrowed eyes).

Landmarks: shoulder point 121, natural waist 92, hip 77, knee 41, ankle 6. Fingertip span 147. Bust 108, waist 100, hip 114.

### Garment layers, inside out

**1. Doric peplos.**
- *History:* the peplos is one rectangle of wool folded over at the top into a deep overfold (apoptygma), wrapped round the body, pinned at each shoulder with one large pin and belted; the overfold hangs free over the belt (`refs/drape/met-255391-mirror-peplos-woman.jpg`, Met 1972.118.78, https://www.metmuseum.org/art/collection/search/255391; Stratz diagram). The open side is traditionally the right.
- *Couture:* a formidable, beautifully kept matron, not a granny. The overfold is cut deep so it falls past the waist and the belt is hidden under it: from the front the line runs unbroken from shoulder to floor, which makes her look taller and more upright. The right side is sewn closed (no open slit) so she stays decent when she bustles. Hem just clears the floor so she can walk fast.
- *Fabric:* fine silk-and-wool crepe (the bible's "navy silk dress", made into the wool the board asks for older women), about 200 g per m², matte with a soft low sheen on the highlights only.
- *Colour:* Navy *(added)* `#1B2236`, in shadow Navy-black *(added)* `#11151F`. A narrow gold-thread line (0.5 cm) at the edge of the overfold.

**2. Himation, drawn over the head (her "veil").**
- *History:* older and mourning women pull the himation over the head as a hood (the funerary plaque `refs/vases/met-254801-funerary-plaque-mourners.jpg`, Met 54.11.5, https://www.metmuseum.org/art/collection/search/254801; the veiled woman on the family grave stele, Met 11.100.2). The Tanagra figurines show it wrapped tight over the chiton, gathered by one hand (`refs/drape/met-248166-tanagra-standing-woman.jpg`, Met 09.221.28; `refs/drape/met-247556-tanagra-draped-woman.jpg`, Met 06.1138).
- *Couture:* worn exactly like the Tanagra women: over the back of the head, framing the face, wrapped round the shoulders and across the front of the body to the hips, gathered at the chest by her left hand (or by a small hidden pin when both hands hold something). Close to the body, never bulky: it should make a rounded, sculptural cowl at the head and a long clean diagonal across the body. A woven gold meander border, 3 cm, runs along one long edge so it frames her face.
- *Fabric:* heavy fine wool, about 380 g per m², matte.
- *Colour:* Navy-black *(added)* `#11151F` (one step darker than the peplos, so the layers separate), border Gold `#C9A24A`.

**Jewellery:** a single string of round gold beads (the bible's), about 1 cm beads, sitting high at the base of the neck. Small gold earrings. A plain gold ring.

**Footwear:** closed soft black leather shoes, barely visible.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Peplos | 230 x 156 | Width 230 (1.6 x fingertip span; 2 x hip, because she is round and needs the fullness to fall rather than stretch). Height = shoulder 121 + overfold 38 - 3 floor clearance |
| Himation | 300 x 125 | Rectangle, gold border on one 300 cm edge |

- **Overfold (apoptygma):** 38 cm deep, folded outward along the top edge before pinning, so the doubled cloth hangs from the shoulders to about 83, just past the belt and the waist.
- **Seams:** the right side sewn closed from the hem up to 26 cm below the fold line (right armhole 26 cm); the left side is the fold of the cloth, armhole 26 cm.
- **Pins:** one per shoulder, front to back through both layers (peplos and overfold), at 10 cm from the neck centre on each side: left shoulder, right shoulder. The neck between is 20 cm, cut slightly lower in front (falls 4 cm) so the gold beads show.
- **Belt:** a plain cord at the natural waist, 92, under the overfold, with 3 cm of blouse over it, hidden.
- **Fullness:** 230 round a 100 waist and 114 hip: the overfold hangs in about six deep vertical folds at the front.
- **Himation wrap** (landmarks): starts at the right hip with corner A hanging to the knee; across the back of the waist, up over the left shoulder, over the back of the head (top of the hood 4 cm above the crown, front edge at the hairline), down over the right shoulder, across the front of the chest, and gathered at the left side of the chest in her left hand. Sim tack pins: crown (back of head), right shoulder, left chest gather point.

**Simulation notes:**
- Peplos, silk-wool crepe: medium class. Mass 0.50, tension 12, shear 8, bending 0.8. Build the overfold as a separate flap welded along the fold line (simpler and more stable than folding a single sheet), with self collision between the flap and the body of the peplos.
- Himation, heavy wool: heavy class. Mass 1.0, tension 25, shear 15, bending 4.0. Pre-wrap it close, then drop with a head collider that includes the hair bun. Collision distance 0.008 around the face so it never touches the cheek.
- The hood must not slip: weight the hood region of the himation to the head bone at 1.0 and blend to the spine by the shoulders.
- Simulate standing, bind.
- **Seated (wedding table):** separate seated variant. The peplos falls over the knees and the overfold lies on the lap; the himation end lies across her lap under her hands.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Navy *(added)* | `#1B2236` | Bible signature navy, pushed toward Cold black `#121418` so it reads as black in candlelight |
| Navy-black *(added)* | `#11151F` | Hooded mourners in 5879; Met 54.11.5 |
| Gold | `#C9A24A` | Gold beads and border; pin 5579 |
| Ivory shadow | `#B9A98A` | Candlelight on the inside of her hood and her face |
| Grey hair *(added)* | `#A9A6A0` | Close to Silver mid `#8A8D93`, warmed |

### What it must NOT look like

- A nun's habit, a witch's hood, or a hooded sweatshirt: no seam at the top of the hood, no drawstring, no pointed peak.
- A shapeless dark tent. The overfold and the diagonal of the himation must show her shape.
- A frumpy granny: she is fashionable and formidable (dark couture, a perfect hood, gold at the throat).
- The overfold as a stiff square apron (cardboard panel) or as a ring round the body (tiered).
- Hood cloth through the cheek or the bun poking through the back of the hood.

### Image prompt

A realistic, film-quality 3D character model sheet of Kleio, a short, round, formidable Greek woman in her sixties, 1.50 m tall, with olive skin, sharp narrowed dark brown eyes, a strong slightly hooked nose and grey hair pinned up in a low bun, shown three times in one wide image (front view, side view, back view) standing very upright in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. She wears a floor-length Doric peplos of deep navy silk-wool crepe with a deep overfold falling past her waist in a few vertical folds, edged with a thin gold line, and over it a heavy navy-black wool himation drawn over the back of her head as a smooth hood that frames her face, wrapped close round her shoulders and across her body in a clean diagonal, its edge bordered with a narrow gold meander; a single string of round gold beads high at her throat; small gold earrings. Elegant, dark, sculptural, like couture on a museum plinth. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep shadows, rich film grain, matching the approved candlelit wedding style frame. No text, no labels, no logos.

---

## 4. Demeas, the uncle

### Silhouette

A huge, barrel-chested, bald and white-bearded man in a long cream chiton with a deep plum mantle wrapped round his middle and over one shoulder, his right arm free and always raising a cup: the biggest, warmest shape in the room.

### Body (MPFB)

- **Height** 1.90 m. **Build** huge and barrel-chested: deep chest, big round belly, thick arms and neck, strong legs. **Age** about 64.
- **Skin** light olive with very rosy cheeks and nose (start from `old_caucasian_male`, warm it and add red on the cheeks and nose).
- **Hair** completely bald, a shining scalp (no hair proxy; give the scalp a slightly higher specular than the face so candles catch it, as in Style frame 1). A big bushy white beard to the upper chest and a full moustache: MPFB has no beard asset, so build it as hair cards or a sculpted hair mesh, coloured `#E6E1D6`. Bushy white eyebrows.
- **Eyes** small and twinkling, dark brown (`brown`); they vanish when he smiles. **Facial hair** the beard.
- **Macros:** gender 1.0, age 0.8, muscle 0.6, weight 0.9, proportions 0.5, height 0.92. Targets: `stomach-pregnant-incr` 0.5, `measure-chest-circ-incr` 0.4 (barrel chest), `measure-neck-circ-incr` 0.4, `measure-upperarm-circ-incr` 0.3, `head-round` 0.3, `l-eye-scale-decr` and `r-eye-scale-decr` 0.3 (small eyes), `l-cheek-volume-incr` and `r-cheek-volume-incr` 0.3.

Landmarks: shoulder point 156, natural waist 118, hip 98, knee 53, ankle 8. Fingertip span 194. Chest 130, belly 128, hip 118.

### Garment layers, inside out

**1. Ionic chiton (long).**
- *History:* the long Ionic chiton, two panels joined along the top by pins to make loose sleeves, was older men's formal dress (the kore's chiton, `refs/drape/met-248008-kore.jpg`, shows the construction). The look of a big older man in pale draped cloth with a cup raised is Style frame 1 itself.
- *Couture:* straight to the ankle, sleeves to the elbow, very fine pleats at the shoulders that open into soft long folds over the belly. Not belted visibly: the himation covers the waist. Generous and calm, like the robe in Style frame 1.
- *Fabric:* fine linen, about 150 g per m², matte, slightly crisp; it should catch candlelight as soft cream.
- *Colour:* Ivory silk `#E9DFC8` is too bridal for him; use Cream linen *(added)* `#D9CDB2` with shadow Ivory shadow `#B9A98A`.

**2. Himation (the plum cloak).**
- *History:* the older man's himation wrapped round the lower body and over the left shoulder, the right shoulder and arm free, as on the family grave stele (`refs/drape/met-248483-grave-stele-family.jpg`, Met 11.100.2) and the seated man (`refs/drape/met-248141-draped-seated-man.jpg`, Met 09.221.4, https://www.metmuseum.org/art/collection/search/248141). references.md: older men wear a dark himation "very cleanly, with one patterned or embroidered border" (pin 5760).
- *Couture:* a big, beautiful, generous wrap: over the left shoulder, a deep swag across the back, round the belly under the right arm, and the end thrown back over the left shoulder so it hangs to the calf behind. One embroidered border in gold: a meander 5 cm wide. The right arm is always free for the cup.
- *Fabric:* fine heavy wool, about 400 g per m², with a faint soft sheen on the highlights (a well-off man's wool).
- *Colour:* Plum *(added)* `#4B1D36`, in shadow Plum shadow *(added)* `#250D1B`, edge highlights Plum edge *(added)* `#74304F`. Border Gold `#C9A24A`.

**Jewellery:** a heavy gold signet ring. His wine cup: a gold-and-bronze kantharos (the goblet in Style frame 1 is the right material).

**Footwear:** dark brown leather sandals with ankle straps. `#4A3626`.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton front | 115 x 158 | Width 115 per panel (total 230, 1.2 x span, 1.8 x chest). Length = shoulder 156 + 6 blousing - 4 ankle clearance |
| Chiton back | 115 x 158 | Same |
| Himation | 360 x 150 | Rectangle, gold border along one 360 cm edge |

- **Chiton side seams:** hem up to 26 cm below the top (armholes 26 cm).
- **Chiton top pins**, each side from the neck centre: 13, 22, 31, 40, 50 cm (left and right neck edge, mid-shoulder, shoulder point, upper arm, above the elbow). Neck opening 26 cm.
- **Overfold:** none.
- **Belt:** a hidden cord at the natural waist 118, 6 cm blouse, under the himation.
- **Fullness:** 230 round a 128 belly: drapes; doesn't strain.
- **Himation wrap** (landmarks): corner A in front of the left shoulder, hanging to mid-shin (about 110); up over the left shoulder; diagonally across the back to the right hip; round under the right arm, across the front of the belly at about 110 to 120, rolled at the top edge into a thick soft roll; then up and back over the left shoulder, the end hanging behind to the calf. Sim tack pins: left shoulder front, left shoulder top, left shoulder back (for the end), right hip.

**Simulation notes:**
- Chiton, fine linen: the existing `garments.py` linen (mass 0.55, tension 15, bending 0.6), pre-pleated finely at the shoulders (1.0 cm deep, 2 cm pitch) for the top 25 cm.
- Himation, heavy fine wool: heavy class. Mass 1.1, tension 30, shear 15, bending 4.0. Roll the top edge of the belly section into a tube of 4 cm diameter before the drop (a rolled edge is how the stelai show it), with stiffer bending there (8.0) via a vertex group.
- Simulate standing, bind. The cup arm: test the raise-cup animation; the himation must not slide off the left shoulder when the right arm lifts (weight the shoulder region to the left clavicle at 1.0).
- **Seated:** separate seated variant; in the seated pose the himation lies over the thighs in heavy folds exactly as on the family stele and the Met seated man, which are the reference for this pose.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Cream linen *(added)* | `#D9CDB2` | Style frame 1 robe; between Ivory silk and Sheer white |
| Ivory shadow | `#B9A98A` | Folds of the robe in Style frame 1 |
| Plum *(added)* | `#4B1D36` | Bible plum, darkened and pulled toward Burgundy drape `#6E1A24` |
| Plum shadow *(added)* | `#250D1B` | Blood red shadow `#4A0509` shifted to purple |
| Gold | `#C9A24A` | Border and cup; the goblet in Style frame 1 |
| Beard white *(added)* | `#E6E1D6` | Warm white so it doesn't go blue; Sheer white `#D8D2C4` |

### What it must NOT look like

- Santa Claus or a toga-party Zeus: no bright purple, no shiny satin, no gold lamé trim everywhere, no laurel wreath.
- A bathrobe: the himation must wrap and roll, not hang open from both shoulders like a dressing gown.
- A box: his size comes from the body; the clothes should drape over it in long diagonals, not stand off it.
- Himation edges as thick cardboard slabs; folds should be few, deep and rounded.
- Beard passing through the chiton, or the chiton's neck cutting through the beard.

### Image prompt

A realistic, film-quality 3D character model sheet of Demeas, a huge, jolly, barrel-chested Greek man in his sixties, 1.90 m tall, completely bald with a shining scalp, a big bushy white beard and moustache, bushy white eyebrows, rosy cheeks and nose and small twinkling dark eyes, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a long, ankle-length Ionic chiton of fine cream linen with loose draped sleeves to the elbow, finely pleated at the shoulders, and a large deep plum wool himation wrapped round his belly in a soft rolled edge, over his left shoulder and hanging behind to the calf, his right arm free, with a single gold meander border along its edge; a heavy gold signet ring; dark brown leather sandals. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep warm shadows, rich film grain, matching the approved candlelit wedding style frame. No text, no labels, no logos.

---

## 5. Nikias, the groom

### Silhouette

A tall, narrow young man in a long ivory pleated chiton like the Charioteer of Delphi, belted high, with a black himation crossing his body from one shoulder: an ink-and-ivory line beside his bride.

### Body (MPFB)

- **Height** 1.84 m. **Build** tall, slim, narrow-shouldered, a gentle slight stoop, long hands. **Age** about 24.
- **Skin** light olive (start from `young_caucasian_male`, warmed slightly).
- **Hair** soft brown curls, short at the sides, longer and loose on top (`short04` or `short02`, whichever curls better, recoloured `#4A3020`).
- **Eyes** kind, brown (`brownlight`). Big ears. **Facial hair** clean-shaven.
- **Macros:** gender 1.0, age 0.48, muscle 0.45, weight 0.4, proportions 0.8, height 0.85. Targets: `l-ear-scale-incr` and `r-ear-scale-incr` 0.4, `l-ear-flap-incr` and `r-ear-flap-incr` 0.2, `measure-shoulder-dist-decr` 0.15, `neck-scale-vert-incr` 0.15, `eyebrows-angle-down` 0.15 (gentle).

Landmarks: shoulder point 151, under the chest (the Charioteer's belt) 129, natural waist 114, knee 51, ankle 7. Fingertip span 186. Chest 94, waist 78.

### Garment layers, inside out

**1. Long Ionic chiton (the Charioteer's chiton).**
- *History:* the Charioteer of Delphi (`refs/drape/commons-delphi-charioteer.jpg`, https://commons.wikimedia.org/wiki/File:Aurige._Mus%C3%A9e_Delphes._Gr%C3%A8ce.png) wears the long belted chiton with deep regular vertical pleats from a high belt to the ankle, sleeves to the elbow, and straps running behind the shoulders. references.md names it the young men's formal dress for the wedding.
- *Couture:* exactly that line: high belt just under the chest, deep straight pleats to the instep, short draped sleeves to the elbow. It is the bible's "white tunic", made long and formal. The pleats should be crisp and very regular, like Grès pleated jersey (references.md).
- *Fabric:* fine linen, about 140 g per m², pressed in permanent narrow pleats. Matte, crisp.
- *Colour:* Ivory silk `#E9DFC8` is the bride's; give him Sheer white `#D8D2C4` linen so he is a step cooler and duller than she is, shadow Ivory shadow `#B9A98A`.

**2. Belt and back straps.**
- *History:* the Charioteer's narrow belt and the straps over the back that stop the chiton billowing.
- *Couture:* a narrow belt of dark leather 2 cm wide, with straps crossing between the shoulder blades.
- *Colour:* Warm black `#16110E`, gold buckle `#C9A24A`.

**3. Himation (black).**
- *History:* the men's himation over the left shoulder (Met 11.100.2). references.md, menswear pin 5760: a tailored black over-layer plus a draped panel; in game a dark himation worn very cleanly with one border.
- *Couture:* narrower than an old man's himation, worn high and neat: over the left shoulder, diagonally across the back, under the right arm and across the body at the high belt, the end over the left forearm. The black falls in long straight folds over the ivory pleats so he reads as a sharp diagonal of black on ivory. One ivory-and-gold woven meander border, 4 cm.
- *Fabric:* fine wool, about 300 g per m², matte black with a faint sheen.
- *Colour:* Night black `#0B0A0C` lit to about `#1A1719`; border Ivory silk `#E9DFC8` and Gold `#C9A24A`.

**Wreath:** a real myrtle wreath of dark green leaves (Garden green, dark `#2B3326`), to match the bride's gold one in shape. (The bible gives both a myrtle wreath; hers is gold, his is living.)

**Jewellery:** none besides a plain gold ring on a cord round his neck (the ring he gives). **Footwear:** plain dark leather sandals `#2B2622`, barely visible at the hem.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton front | 112 x 162 | Width 112 per panel (total 224, 1.2 x span, 2.4 x chest). Length = shoulder 151 + 14 blousing - 3 so the hem just touches the instep |
| Chiton back | 112 x 162 | Same |
| Belt | 2 x 95, plus 2 back straps 2 x 75 | Rigid, skinned |
| Himation | 320 x 130 | Rectangle, border on one 320 cm edge |

- **Chiton side seams:** hem up to 24 cm below the top.
- **Chiton top pins**, each side from the neck centre: 12, 20, 28, 36, 44 cm (neck edge, mid-shoulder, shoulder point, upper arm, elbow). Neck opening 24 cm, falling 4 cm at the front (the Charioteer's V).
- **Overfold:** none.
- **Belt height:** high, at 129, just under the chest; 8 cm of blouse over it, as on the Charioteer.
- **Back straps:** from the belt at each side of the back up over the shoulder blade and down to the belt on the opposite side, crossing at the mid-back.
- **Fullness:** 224 round a 78 waist, nearly 3 to 1: deep pleats.
- **Himation wrap** (landmarks): corner A in front of the left shoulder to the knee; over the left shoulder; across the back to the right hip; under the right arm; across the front at belt height 125 to 130; end over the left forearm. Sim tack pins: left shoulder front, left shoulder top, right hip.

**Simulation notes:**
- Chiton, fine pleated linen: mass 0.45, tension 18, shear 10, bending 0.8, with full-length pre-pleating (1.5 cm deep, 2.2 cm pitch, the whole length of the skirt, opening slightly toward the hem). The pleats are the point; keep them crisp by raising bending to 2.0 along the pleat ridges with a vertex group.
- Himation, fine wool: medium-heavy. Mass 0.85, tension 25, shear 15, bending 3.0.
- Simulate standing, bind. Weight the skirt to the pelvis at 0.7.
- **Seated:** separate seated variant; the pleats fan over the knees, the hem falls straight from the knee to the floor.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Sheer white | `#D8D2C4` | The white hall 5616; Delphi Charioteer's chiton |
| Ivory shadow | `#B9A98A` | Pleat shadows |
| Night black | `#0B0A0C` | Menswear pin 5760; guests in black (5616, 5756) |
| Gold | `#C9A24A` | Border and buckle |
| Garden green, dark | `#2B3326` | Living myrtle wreath; garden aisle 5610 |

### What it must NOT look like

- A sweater with set-in sleeves (look-test `Thea 6`, the groom at the table) or a modern dress shirt.
- A toga-party bedsheet with one bare shoulder: the chiton covers both shoulders.
- A short tunic showing his knees: he is long to the instep.
- The pleated skirt as a smooth cylinder (no pleats) or as stiff horizontal rings (tiered).
- The black himation reading as a separate jacket or a sash with a hard edge: it must drape.

### Image prompt

A realistic, film-quality 3D character model sheet of Nikias, a tall, gentle, slightly awkward young Greek groom of about 24, 1.84 m tall, slim and narrow-shouldered, light olive skin, kind brown eyes, big ears and soft brown curls under a wreath of dark green myrtle leaves, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a long, ankle-length ivory linen chiton like the Charioteer of Delphi, with deep, crisp, regular vertical pleats falling from a narrow dark leather belt high under the chest, short draped sleeves to the elbow and a small V at the neck, and over it a fine matte black wool himation worn high over his left shoulder, across his back and body in long straight folds, its end over his left forearm, edged with a narrow ivory and gold meander border; plain dark leather sandals. A sharp line of black on ivory. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep warm shadows, rich film grain, matching the approved candlelit wedding style frame. No text, no labels, no logos.

---

## 6. Lykon, the friend

### Silhouette

A very tall, thin, long-necked man in a long faded sage-green chiton that is just too short for him (his ankles and shins show), with a short charcoal cloak pinned at one shoulder: a reed that worries.

### Body (MPFB)

- **Height** 1.91 m. **Build** tall and lanky: long neck, long arms, narrow chest, bony wrists and knees. **Age** about 33.
- **Skin** light olive, a bit pale and blotchy when he's anxious (start from `young_caucasian_male2` or `middleage_caucasian_male`, desaturated slightly).
- **Hair** messy mid-brown, uncombed, sticking up at the crown (`short03`, recoloured `#5A4030`).
- **Eyes** hazel-brown, worried (`brownlight`). Big ears, a long thin face, worried eyebrows lifted at the inner ends. **Facial hair** a thin, patchy attempt at stubble.
- **Macros:** gender 1.0, age 0.56, muscle 0.3, weight 0.22, proportions 0.45, height 1.0. Targets: `neck-scale-vert-incr` 0.5 (long neck), `head-oval` 0.5 and `head-scale-vert-incr` 0.2 (long face), `l-ear-scale-incr` and `r-ear-scale-incr` 0.5, `measure-upperarm-length-incr` and `measure-lowerarm-length-incr` 0.25, `measure-shoulder-dist-decr` 0.2, `eyebrows-trans-up` 0.2, and in his idle face a constant 0.3 of `browInnerUp`.

Landmarks: shoulder point 155 (the long neck sets the shoulders lower than usual), natural waist 118, knee 54, mid-shin 32, ankle 8. Fingertip span 199. Chest 90, waist 74.

### Garment layers, inside out

**1. Doric chiton (long, men's), worn too short.**
- *History:* the one-rectangle men's chiton, pinned at both shoulders and belted, no overfold (Stratz diagram, `refs/diagrams/commons-doric-chiton-stratz.png`). Variants with belts in the Hope plate.
- *Couture:* the bible says "too short for him"; on the board we keep the joke as a matter of length, not as a mini tunic: it is a good long chiton that was made for a shorter man, so it ends at mid-shin with 20 cm of bony shin and ankle showing, and the sleeves stop above the elbow on his long arms. Otherwise it is worn properly: bloused neatly over a narrow belt, long vertical folds.
- *Fabric:* medium linen, about 170 g per m², faded and slightly soft from washing, matte.
- *Colour:* Sage *(added)* `#7D8A70`, faded toward the edges and the shoulders to Sage faded *(added)* `#A3AC93`, shadow Sage shadow *(added)* `#424A3B`.

**2. Belt.**
- A narrow dark leather thong, knotted, 1 cm. Warm black `#16110E`.

**3. Chlamys (short cloak).**
- *History:* the young man's short cloak, a rectangle pinned at one shoulder (references.md, young men: "A short cloak (chlamys) pinned at one shoulder"; the Hermes figure on the Sabouroff lekythos, Met 21.88.17).
- *Couture:* pinned at the right shoulder, the pin edge running across the front of the neck, falling down his back to just above the knee and open down the right side. It gives him the black of the wedding guests and a long vertical line that stretches him further.
- *Fabric:* medium wool, about 280 g per m², matte.
- *Colour:* Smoke grey `#2A2D33`. Pin: a plain bronze ring brooch, dulled Gold `#C9A24A`.

**Footwear:** plain sandals, a bit too big, `#4A3626`.

**Jewellery:** none. He fiddles with the cloak pin.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton | 210 x 129 | Width 210 (1.05 x span, 2.3 x chest). Length = shoulder 155 down to mid-shin at 32 = 123, plus 6 blousing. This is the "too short" length; a chiton that fitted him would be 155 |
| Belt | 1 x 150 | Thong with a knot and ends |
| Chlamys | 170 x 105 | Rectangle; the two bottom corners carry small sewn-in weights (historically lead), 40 g each |

- **Chiton seam:** right side, hem up to 24 cm below the top.
- **Chiton pins:** two per shoulder, at 11 and 18 cm from the neck centre (left neck-shoulder, left mid-shoulder, right neck-shoulder, right mid-shoulder). Neck 22 cm. The short cap sleeve ends above the elbow because his upper arm is long.
- **Overfold:** none.
- **Belt height:** natural waist 118, 6 cm blouse.
- **Fullness:** 210 round a 74 waist; the folds are long and thin, like him.
- **Chlamys:** one 170 cm edge across the back of the shoulders; the two upper corners meet at the right shoulder and are pinned there (landmark: right shoulder point, 3 cm in front of the seam); the cloth falls behind to about 60 (just above the back of the knee) and hangs open down his right side.

**Simulation notes:**
- Chiton, medium linen: `garments.py` linen settings (mass 0.55, tension 15, bending 0.6), pre-pleat above the belt (1.2 cm deep, 2.5 cm pitch).
- Chlamys, medium wool: mass 0.8, tension 22, shear 12, bending 2.5; corner weights by raising the mass of the two corner vertex groups to 2.0.
- Simulate standing, bind. He fidgets: test the talk animation for the cloak clipping through the right arm.
- **Seated:** separate seated variant for the chiton (with his knees high on a low bench, the hem rides up to show even more shin: keep it); the chlamys can share the standing sim and lie over the bench back.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Sage *(added)* | `#7D8A70` | Bible signature sage-green; the sheer sage-green menu, pin 5729 |
| Sage faded *(added)* | `#A3AC93` | Sun-faded shoulders and edges |
| Sage shadow *(added)* | `#424A3B` | Toward Garden green, dark `#2B3326` |
| Smoke grey | `#2A2D33` | The chlamys; tulle and haze in 5752, cloaks in 5879 |
| Warm black | `#16110E` | Belt |

### What it must NOT look like

- A mini tunic or a short dress: the length gap is at the shin, not at the thigh.
- A bright mint or lime green: in candlelight it must read grey-olive and faded.
- A hoodie or a cape with a hood: the chlamys has no hood and no collar.
- A scarecrow: he is anxious, not ragged; the clothes are clean and decent.
- The chlamys as a stiff flat board down his back, or passing through his right arm.

### Image prompt

A realistic, film-quality 3D character model sheet of Lykon, a very tall, lanky, anxious Greek man in his thirties, 1.91 m tall, with a long neck, long thin arms, a long thin face, big ears, worried eyebrows lifted at the inner ends, a nervous half-smile, hazel-brown eyes and messy mid-brown hair, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a long Doric chiton of faded sage-green linen that is slightly too short for him, ending at mid-shin so his bony shins and ankles show, with short cap sleeves stopping above the elbow, bloused neatly over a narrow dark leather belt, and a smoke-grey wool chlamys pinned at his right shoulder with a plain dull bronze ring brooch, falling in long straight folds down his back to just above the knee; plain leather sandals. Lit like a high-end period film at night: a warm candle-coloured key light from low front left, a thin cool rim light from above and behind, soft haze, deep warm shadows, rich film grain, matching the approved candlelit wedding style frame. No text, no labels, no logos.

---

## 7. Hermes, the god

### Silhouette

A slim young man under a wide black traveller's hat with two white wings, in a pale linen chiton with a gold belt and a long near-black red cloak pinned with a gold disc, a gold herald's staff over his shoulder: always about to leave.

### Body (MPFB)

- **Height** 1.80 m (1.88 m to the top of the hat crown). **Build** slim, athletic, light on his feet: long legs, lean muscle. **Age** looks about 22 (ageless).
- **Skin** light, warm, a little golden (start from `young_caucasian_male`; the approved frame shows a fair, slightly flushed face).
- **Hair** tousled light brown, short, curling out from under the hat at the nape and temples (`short01`, recoloured `#7A5A3C`).
- **Eyes** bright, quick, grey-green (`bluegreen`, desaturated); a sly, charming half-grin. **Facial hair** clean-shaven.
- **Macros:** gender 1.0, age 0.49, muscle 0.58, weight 0.32, proportions 1.0, height 0.75. Targets: `measure-upperleg-height-incr` 0.15, `head-oval` 0.3, `chin-prominent-incr` 0.2, `mouth-angles-up` 0.15 (a resting smirk, stronger on one side in the face rig).

Landmarks: shoulder point 148, natural waist 112, knee 50, ankle 7. Fingertip span 181. Chest 94, waist 76.

### Garment layers, inside out

**1. Doric chiton, knee length.**
- *History:* the short belted chiton of travellers and young men (references.md); the Stratz construction without overfold. Hermes is shown on the Sabouroff Painter lekythos with Charon (`refs/vases/met-251043-charon-hermes-lekythos.jpg`, Met 21.88.17, https://www.metmuseum.org/art/collection/search/251043).
- *Couture:* as in the approved Style frame 2: pale linen with a small round neck, short cap sleeves, belted at the waist with a narrow gold belt, falling to just above the knee in soft vertical folds. Knee length is right for him (he runs between worlds), and the long cloak gives the long menswear line.
- *Fabric:* fine linen, about 150 g per m², matte, a little crumpled from travel.
- *Colour:* Ivory linen *(added)* `#D3C6A8` (Style frame 2's tunic), shadow Ivory shadow `#B9A98A` going to Oatmeal shadow `#7C6D55` in deep folds. It must stay paler and finer than Mikon's oatmeal.

**2. Belt.**
- A narrow gold belt, 2.5 cm, worn at the natural waist (Style frame 2). Gold `#C9A24A`.

**3. Chlamys (the cloak).**
- *History:* the traveller's chlamys pinned at one shoulder is Hermes's own garment in vase painting (references.md: "travelling hat and short cloak as on the Sabouroff Painter lekythos").
- *Couture:* lengthened to mid-calf for the couture line, pinned at the right shoulder with a round gold disc brooch (Style frame 2), falling open down the right side and wrapping the left shoulder and back, deep enough that it swings behind him when he turns. The inside face is the same cloth.
- *Fabric:* heavy silk-wool, about 320 g per m², with a deep soft sheen so a cool rim light draws a red line on its edges.
- *Colour:* Blood red shadow `#4A0509` in its body (it reads as near-black brown-red, as in Style frame 2), Burgundy drape `#6E1A24` where lit, edge highlights Blood red edge `#C4202A` used only on the rim.

**4. Petasos (traveller's hat).**
- *History:* the wide-brimmed felt petasos of travellers, Hermes's attribute.
- *Couture:* a rigid black felt hat with a low round crown and a wide flat brim (about 48 cm across), a thin gold band round the crown, and two small white wings rising from the sides of the crown (Style frame 2: keep these exactly).
- *Colour:* Night black `#0B0A0C` felt (matte), Gold band `#C9A24A`, wings Sheer white `#D8D2C4` with silver-grey shading at the quill ends `#8A8D93`.

**Props and footwear:**
- Kerykeion (caduceus): a slim gold staff about 1.1 m with two snakes twined round it and two small wings at the top, carried diagonally over his right shoulder, as in Style frame 2. Gold `#C9A24A`, with Silver `#C9CBCF` on the wings (the board's "silver details").
- Winged sandals: fine dark leather sandals laced to mid-calf, with a small white-and-silver wing at each ankle.

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Chiton | 196 x 106 | Width 196 (1.08 x span, 2.1 x chest). Length = shoulder 148 down to 50 (knee) = 98, plus 8 blousing |
| Belt | 2.5 x 85 | Rigid, skinned |
| Chlamys | 180 x 118 | Rectangle; 118 = shoulder 148 down to mid-calf at 30. Two 50 g corner weights at the bottom corners |
| Petasos | 48 diameter brim, crown 18 diameter x 9 high | Rigid prop parented to the head bone |

- **Chiton seam:** right side, hem up to 23 cm below the top.
- **Chiton pins:** two per shoulder at 10 and 16 cm from the neck centre (left and right neck-shoulder, left and right mid-shoulder). Neck 20 cm, small and round as in the frame.
- **Overfold:** none.
- **Belt height:** natural waist 112, 8 cm blouse (the frame shows a full blouse over the gold belt).
- **Fullness:** 196 round a 76 waist.
- **Chlamys:** the top 180 cm edge laid across the back of the shoulders; both upper corners brought to the right shoulder (landmark: right shoulder point, 4 cm toward the front) and pinned with the disc; the cloth wraps the left shoulder and falls behind to mid-calf, open down the right side.

**Simulation notes:**
- Chiton: `garments.py` linen (mass 0.55, tension 15, bending 0.6) with a slightly crumpled look from a small random displacement before the drop (2 mm noise), not more.
- Chlamys, silk-wool: mass 0.85, tension 20, shear 10, bending 1.5, corner weights mass 2.0. He moves fast: air damping 1.0, and give the cloak a little extra swing in game by binding the lower half more loosely (spring bones or a short secondary sim on the hem if the engine allows).
- Hat, caduceus and wings: rigid, not simulated. The hat must sit on the hair, not through it: shrink the hair under the crown with a mask.
- Simulate standing, bind. He doesn't sit in Episode 1.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Ivory linen *(added)* | `#D3C6A8` | His tunic in Style frame 2 |
| Blood red shadow | `#4A0509` | His cloak in Style frame 2; Hades's cloak 5585 |
| Burgundy drape | `#6E1A24` | Lit folds of the cloak |
| Blood red edge | `#C4202A` | Rim on cloak edges only (5769) |
| Gold | `#C9A24A` | Brooch, belt, hat band, caduceus (Style frame 2) |
| Night black | `#0B0A0C` | The petasos |

### What it must NOT look like

- A cartoon Mercury: no silver helmet, no winged cap like a bicycle helmet, no gold lamé tunic, no bare chest.
- A bright red superhero cape: the cloak is near black with red only on the edges and in the light.
- A pilgrim or a cowboy: the hat brim is flat and the crown is low and round, not conical and not dented.
- A short, flapping costume-shop cloak cut off at the waist.
- The cloak as a stiff flat panel behind him, or the caduceus passing through the cloak and shoulder (it rests on top of the cloak).

### Image prompt

A realistic, film-quality 3D character model sheet of Hermes, the messenger god, looking about 22, 1.80 m tall, slim and athletic, with light warm skin, bright quick grey-green eyes, a sly charming half-grin and tousled light-brown hair curling out under a wide-brimmed flat black felt traveller's hat with a thin gold band and two small white wings rising from the sides of the crown, shown three times in one wide image (front view, side view, back view) standing in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a knee-length chiton of pale ivory linen with a small round neck and short cap sleeves, bloused over a narrow gold belt, and a long near-black blood-red silk-wool cloak pinned at his right shoulder with a round gold disc brooch, wrapping his left shoulder and falling to mid-calf, its edges catching a thin red rim of light; a slim gold herald's staff with two twined snakes and small silver wings at the top rests diagonally over his right shoulder; dark leather sandals laced up the calf with small white wings at the ankles. Lit like a high-end period film at night, matching the approved river bank style frame: a cool shaft of top light, a warm torch-coloured glow from one side, deep shadows, soft haze, rich film grain. No text, no labels, no logos.

---

## 8. Elpenor, the sailor

### Silhouette

A lean young sailor sitting hunched on a bench by the black water, in a salt-stained charcoal work tunic off one shoulder with a faded red sail wrapped round his shoulders and knees, a net across his lap: wry, patient, dead.

### Body (MPFB)

- **Height** 1.75 m (in game scale 0.96). **Build** lean and wiry, a rower's shoulders and forearms, bony knees. **Age** about 21.
- **Skin** sun-dark Mediterranean, a sailor's tan on the forearms and face, gone a little dull and cool (he has been dead a while; let the cold light do most of the work, don't paint him grey). Start from `young_caucasian_male2` darkened toward a deep tan.
- **Hair** dark brown curls, salt-stiff, tied back from the face with a cord at the nape (`short02` with a small tied tail, recoloured `#2E2018`).
- **Eyes** dark brown, a little hooded, amused (`brown`). A crooked, wry mouth. **Facial hair** short scruffy beard, a few weeks' growth (hair cards or painted, `#2E2018`).
- **Macros:** gender 1.0, age 0.47, muscle 0.62, weight 0.3, proportions 0.7, height 0.55. Targets: `measure-upperarm-circ-incr` 0.2, `measure-lowerarm-circ-incr` 0.2 (rower's forearms), `head-oval` 0.2, `mouth-angles-up` 0.1 on one side only in the face rig (the wry smile).
- (Homer: he fell from Circe's roof asleep and broke his neck. No visible wound; at most a slight habitual tilt of the head to one side.)

Landmarks (standing): shoulder point 143, natural waist 108, knee 49, ankle 7. Fingertip span 177. Chest 92, waist 74. He is almost always seated: seated shoulder height about 100 above the ground, on a bench 45 high.

### Garment layers, inside out

**1. Exomis (sailor's work tunic).**
- *History:* the exomis is a short chiton pinned or knotted on the left shoulder only, leaving the right shoulder and arm bare, worn by workmen, sailors and Charon on the white-ground lekythoi (`refs/vases/met-251043-charon-hermes-lekythos.jpg`, Met 21.88.17; `refs/vases/met-248182-charon-lekythos.jpg`, Met 09.221.44, https://www.metmuseum.org/art/collection/search/248182). He died in what he slept in; he is a working sailor, so it is his work tunic.
- *Couture:* worn long enough to reach the knee when standing; knotted at the left shoulder (no brooch: a knot of the two corners), the right side falling open from the shoulder to the belt so the chest and right arm are bare. Clean, sculptural, a little wet: the edges cling.
- *Fabric:* heavy linen canvas, about 250 g per m², matte, salt-stiff, with white tide marks.
- *Colour:* Wet charcoal *(added)* `#3A3833`, salt marks Salt grey *(added)* `#8F8A7E`, shadows Cold black `#121418`.

**2. Belt.**
- A length of tarred rope, 1 cm, knotted at the left hip. Warm black `#16110E`. A bronze netting needle is tucked into it.

**3. The red sail (wrap).**
- *History:* none in the vase paintings; it comes from his camp in the game (the lean-to of an old red sail, `public/play/game.js`) and from the river bank's red cloth (pins 5769, 6432).
- *Couture:* a large scrap of old sail cloth worn as a shawl round both shoulders and down over his knees, pooling on the bench and the sand. It is the only warm colour near him and the board's red-over-black-water idea in one person.
- *Fabric:* heavy linen sailcloth, about 400 g per m², stiff, frayed edges, sun-faded on the outside, darker where it is wet near the ground.
- *Colour:* Burgundy drape `#6E1A24` faded on top, Blood red shadow `#4A0509` in the folds and where it is wet, Blood red `#8E0E14` where the cool shaft catches it.

**Footwear:** barefoot (sailors worked barefoot; he was carried out of nothing).

**Props:** the net across his knees (tarred cord, game texture), a netting needle, and his oar leaning on the bench (in Homer he asks to be buried with it).

**Jewellery:** none, except a single small bronze ring in one ear (sailor's).

### Sewing pattern

| Panel | Size (w x h) | Notes |
|---|---|---|
| Exomis | 180 x 104 | Width 180 (1.0 x span, 2 x chest). Length = shoulder 143 down to the knee at 49 = 94, plus 6 blousing and 4 for the knot |
| Rope belt | 1 x 160 | Knotted at the left hip |
| Sail wrap | 220 x 110 | Rectangle, frayed edges (alpha-cut fringe 3 cm on the two short ends) |

- **Exomis seams:** the rectangle sewn into a tube down the left side only from the hem to 26 cm below the top (left armhole); the right side left open from the top down to the belt.
- **Exomis tie:** the two top corners of the left side tied together at the left shoulder (landmark: left shoulder point, 3 cm in from the edge); the right side is unpinned, the front and back edges fall across the chest and back from the left shoulder diagonally to the right armpit.
- **Overfold:** none.
- **Belt height:** natural waist 108 standing (about 70 above the ground seated), 6 cm blouse.
- **Fullness:** 180 round a 74 waist: workman's fullness, no more.
- **Sail wrap:** centre of one long edge at the back of the neck, the cloth over both shoulders, the two ends brought forward over the knees and falling to the sand in front of the bench.

**Simulation notes:**
- Exomis, linen canvas: medium-heavy class. Mass 0.8, tension 30, shear 15, bending 3.0 (salt-stiff). A slightly wet look: higher friction (12) against the skin so the open edge clings across the chest.
- Sail wrap, sailcloth: heavy class. Mass 1.3, tension 40, shear 20, bending 8.0 so it makes big stiff folds rather than soft ones.
- **Seated is his main pose:** simulate both layers directly on the body posed seated on the bench (collision proxy for the bench and the sand), with the net prop on his knees as a collider for the sail, then bind. Make a standing variant separately for when he stands to talk to Odysseus in Chapter IV.
- Cloth through skin is the risk at the bent knees and the open right side: check the mending animation (hands moving over the net) frame by frame.

### Swatches

| Name | Hex | Source |
|---|---|---|
| Wet charcoal *(added)* | `#3A3833` | Smoke grey `#2A2D33` warmed and lightened for worn wet linen; hooded figures in 5879 |
| Salt grey *(added)* | `#8F8A7E` | Tide marks; the pale white-ground lekythos palette (Met 07.286.40) |
| Cold black | `#121418` | Shadows; the river |
| Burgundy drape | `#6E1A24` | The faded sail; draped ruins 5606 |
| Blood red shadow | `#4A0509` | Wet sail in its folds; Charon's red-brown (Met 21.88.17) |
| Blood red | `#8E0E14` | Where the shaft catches the sail; banners in 5769 |

### What it must NOT look like

- A pirate: no striped shirt, headscarf, earring hoops, boots or sash.
- A beach bum in a toga, or a modern fisherman in a jumper (no knit, no sleeves).
- A ghost with grey-blue skin, glowing eyes or a sheet: he looks alive until you notice nothing about him is warm.
- The sail as a flat cardboard board on his shoulders, or a neat blanket with hemmed edges.
- The exomis through the bent thighs, or the open right side tearing away from the body when he moves his arm.

### Image prompt

A realistic, film-quality 3D character model sheet of Elpenor, a lean, wiry young Greek sailor of about 21, 1.75 m tall, with deep sun-tanned skin gone slightly dull and cool, a rower's shoulders and forearms, dark brown salt-stiff curls tied back at the nape with a cord, a short scruffy beard, hooded amused dark brown eyes and a wry crooked smile, a small bronze ring in one ear, shown three times in one wide image (front view, side view, back view) standing barefoot in a neutral A-pose with relaxed, fully visible hands on a plain dark grey background. He wears a knee-length exomis of heavy wet charcoal linen with faint white salt marks, knotted at his left shoulder and open on the right so his right shoulder, arm and part of his chest are bare, belted with a knotted length of black tarred rope with a bronze netting needle tucked in, and a large frayed scrap of faded burgundy-red sailcloth wrapped round his shoulders and hanging in heavy stiff folds to his shins, darker where it is wet at the hem. Lit like a high-end period film at night, matching the approved river bank style frame: one cool shaft of light from above, a faint warm lantern glow from one side, cold black shadows, soft low fog, rich film grain. No text, no labels, no logos.

---

## Where bible.json and the board disagree (and what this file chose)

| Bible says | Board says | Chosen here |
|---|---|---|
| `style`: stylized, exaggerated cartoon proportions, big eyes, painted skin | Realistic film-quality couture on a museum plinth; the approved style frames are photoreal | Realistic MakeHuman bodies and film-quality renders. The bible's character traits (big nose, small eyes, big ears) are kept as realistic features, not cartoon exaggerations. The bible's style line should be updated if these sheets are approved |
| Thea: saffron-gold silk wedding gown | Bride in ivory liquid silk with a sheer veil (6358) | Ivory silk gown; saffron-gold moves to the full-length sheer veil and the narrow bands at neck and hem, so she still reads gold in candlelight |
| Thea: gold collar and gold cuffs | Lace gauntlet sleeves (6358); fine hair chains instead of a crown (5567) | Gold strap necklace (the collar) kept; cuffs become sheer gold-embroidered tulle gauntlets; silver crystal chains under the veil |
| Thea: short auburn bob | Pin 5567 is chains across a bun | Bob kept (her body is already built with `bob02`); the chains lie across the crown of the bob |
| Nikias: white tunic | Young men in black and charcoal at the wedding; menswear black over-layer (5760) | Ivory long Charioteer chiton (the white tunic) under a black himation |
| Lykon: sage tunic "too short for him" | Menswear long, not costume-shop | A long chiton made for a shorter man: ends at mid-shin, shins and ankles show; plus a smoke-grey chlamys |
| Mikon: coarse tunic with a brown rope belt | Menswear long and elegant | Long mid-shin chiton in undyed oatmeal, a twisted wool cord instead of rope, and a plain charcoal himation |
| Kleio: navy silk dress and navy veil | Older women in heavy wool himation over the head, undyed, charcoal, burgundy or black | Navy kept but darkened to read as black; silk-wool peplos with a navy-black wool himation drawn up as the veil |
| Demeas: plum cloak | Red held back at the wedding (one burgundy drape only) | Plum kept, but very dark and toward purple so it never reads as a second red |
| Hermes: short white tunic, red cloak | Silver details instead of colour; but the approved Style frame 2 shows oatmeal linen, a near-black red cloak and gold | Followed the approved frame: pale linen, near-black blood-red cloak, gold brooch, belt and caduceus; silver only on the caduceus wings and sandal wings |
| Elpenor | Not in bible.json at all | New entry written here (age, build, costume) from Homer and the game's river-bank camp in `game.js`. Suggest adding him to bible.json |
| Places: Styx river "glowing faint blue-green"; Corinth wedding "guests in colourful clothes" | Black water with no blue; guests in black and charcoal | Not a costume question, but the costumes assume the board (dark guests, black water) |
| Style frame 1 shows a beardless bald man with the cup | Bible Demeas has a bushy white beard | Beard kept (bible); everything else about Demeas follows the frame |
