// The story. Edit freely: each Age is one chapter, in order.
const GODS = {
  Zeus:{gk:"Ζεύς",a:"The Sovereign",gift:"Vision and decisiveness: builds the kingdom, makes the call.",shadow:"Confuses being in charge with being close. Can't hear no."},
  Hera:{gk:"Ἥρα",a:"The Committed",gift:"Loyalty that keeps vows when it would be easier not to.",shadow:"When betrayed, punishes the wrong person."},
  Poseidon:{gk:"Ποσειδῶν",a:"The Deep Feeler",gift:"Emotional depth and force: feels everything all the way down.",shadow:"Grudges that surface as storms, years later."},
  Demeter:{gk:"Δημήτηρ",a:"The Nurturer",gift:"Feeds, tends and sustains the people around her.",shadow:"Grief so total it freezes the whole world (ask about Persephone)."},
  Athena:{gk:"Ἀθηνᾶ",a:"The Strategist",gift:"Cool thinking under pressure; sees the whole board.",shadow:"Armoured. Solves the feeling instead of having it."},
  Apollo:{gk:"Ἀπόλλων",a:"The Clarifier",gift:"Truth, discipline, craft. Brings order and light.",shadow:"Perfectionism and distance; admired more than known."},
  Artemis:{gk:"Ἄρτεμις",a:"The Independent",gift:"Self-direction and fierce protection of the vulnerable.",shadow:"Contempt for weakness; can be merciless."},
  Ares:{gk:"Ἄρης",a:"The Warrior",gift:"Courage in the body. Acts now, while others debate.",shadow:"Impulsive anger; fights the fight instead of the problem."},
  Aphrodite:{gk:"Ἀφροδίτη",a:"The Connector",gift:"Magnetism; transforms people through relationship and beauty.",shadow:"Moves on fast, leaves chaos in the wake."},
  Hephaestus:{gk:"Ἥφαιστος",a:"The Maker",gift:"Turns pain into craft; builds what lasts.",shadow:"Withdraws to the forge; resentment kept warm."},
  Hermes:{gk:"Ἑρμῆς",a:"The Messenger",gift:"Wit and fluency; crosses between worlds and translates.",shadow:"Slippery. Talks past the truth when it's inconvenient."},
  Dionysus:{gk:"Διόνυσος",a:"The Liberator",gift:"Ecstasy and release; dissolves the walls between people.",shadow:"Excess. Loses the self along with the boundaries."}
};
const GOD_LIST = Object.keys(GODS);


const AGES = [
  { id:"golden", c:"#a8823a", num:"I", label:"The Golden Age", title:"The Stone", greek:"χρύσεον γένος · when Cronus ruled", glyph:"Ε", gpos:"top:46%;right:6%",
    myth:"Cronus swallowed his children so none could overthrow him. When Zeus was born, his mother Rhea handed Cronus a stone in swaddling clothes instead. He swallowed it whole.", cite:"Hesiod, Theogony 453–500",
    witness:["I wrapped it. Rhea's hands were shaking too much to fold the linen, so I did it, and sealed the knot with clay.","My thumb slipped. It left a print. I didn't fix it."],
    echo:"If you're hearing this, the stone made it out. He swallowed it and never tasted the difference. Remember that. The ones who devour everything rarely look at what they're eating.",
    relic:{icon:"stone",name:"Swaddled Stone",desc:"Fist-sized river stone. Linen wrapping, clay seal, one small thumbprint.",found:"Delphi",by:"Every pilgrim for 1,000 years"},
    q:"Rhea asks you to help deceive a king to save a child. If he notices, everyone in the room dies.",
    opts:[
      {t:"Wrap the stone. A lie that saves a life isn't a lie.",g:{Hermes:2,Demeter:2}},
      {t:"Refuse. The risk to everyone else is too high.",g:{Hera:2,Apollo:1,Zeus:1}},
      {t:"Wrap it, and keep the baby's real blanket as proof, in case it all goes wrong.",g:{Athena:2,Hermes:1,Hephaestus:1}}],
    reveal:"Zeus grew up, forced Cronus to cough the stone back up, and set it at Delphi as the <i>omphalos</i>, the navel of the world. Pilgrims anointed it with oil for a thousand years. Nobody asked about the thumbprint." },

  { id:"silver", c:"#6f7f8f", num:"II", label:"The Silver Age", title:"The Fire", greek:"ἀργύρεον γένος · children for a hundred years", glyph:"Λ", gpos:"bottom:14%;left:3%",
    myth:"The silver race stayed children for a century. Then Prometheus stole fire from the gods, hidden in a hollow fennel stalk. Zeus answered with a gift of his own: Pandora, and a sealed jar.", cite:"Works and Days 90–142 · Theogony 565–567",
    witness:["I held the stalk while he climbed down. It was warm all the way through, like holding someone's wrist.","Later I stood next to Pandora when the lid came up. Everything flew out: sickness, toil, grief. <i>One thing didn't.</i> I'll tell you what at the end."],
    echo:"He told me fire was a gift. Zeus said it was a theft. They were both right. That's what nobody tells you about gifts.",
    relic:{icon:"fennel",name:"Hollow Fennel Stalk",desc:"Giant fennel (narthex). Interior scorched black. Still faintly warm.",found:"The Caucasus",by:"Heracles"},
    q:"You're holding the only fire on earth. Zeus will punish whoever is caught with it.",
    opts:[
      {t:"Light every hearth you can reach before dawn.",g:{Hephaestus:2,Demeter:1,Dionysus:1}},
      {t:"Hide it and keep it for your own village.",g:{Ares:2,Hera:1,Poseidon:1}},
      {t:"Give it back to the gods. Some things aren't ours.",g:{Zeus:2,Apollo:2}}],
    reveal:"Generations later Heracles climbed the Caucasus, shot the eagle, and freed Prometheus. At the foot of the rock he found a scorched stalk, still warm. He kept it. He never knew why." },

  { id:"bronze", c:"#8e5a33", num:"III", label:"The Bronze Age", title:"The Flood", greek:"χάλκειον γένος · a race that loved war", glyph:"Π", gpos:"top:24%;left:46%",
    myth:"The bronze race lived for violence, and Zeus decided to drown them. Deucalion and Pyrrha floated in a wooden chest for nine days and nights until they grounded on Mount Parnassus.", cite:"Apollodorus 1.7.2 · Ovid, Metamorphoses I",
    witness:["I drilled the air holes. Then I scratched a mark into the oak every morning, and counted out loud so they'd know someone was counting.","They were told to throw <i>the bones of their mother</i> behind them. Pyrrha wept at the thought. I said nothing, and looked at the ground."],
    echo:"Nine days. When the water drops, look down. The answer is always lying on the ground.",
    relic:{icon:"plank",name:"Oak Plank, Nine Marks",desc:"Split from a sea chest. Nine scratches, evenly spaced. Salt-bleached.",found:"Mount Parnassus",by:"Deucalion"},
    q:"The water is rising and the chest holds only two.",
    opts:[
      {t:"Save the two kindest people you know.",g:{Artemis:2,Demeter:1,Aphrodite:1}},
      {t:"Save the two strongest. Someone has to rebuild.",g:{Ares:2,Poseidon:2,Zeus:1}},
      {t:"Refuse the question. Start building a bigger boat.",g:{Hephaestus:2,Athena:2}}],
    reveal:"Deucalion understood it in the end: <i>mother</i> was the Earth, and her <i>bones</i> were stones. The stones he threw became men, and Pyrrha's became women. He found the answer scratched beside nine marks, on a plank that had washed up at his feet." },

  { id:"heroic", c:"#a2432c", num:"IV", label:"The Age of Heroes", title:"The Thread", greek:"ἡρώων θεῖον γένος · the demigods", glyph:"Ι", gpos:"bottom:22%;right:44%",
    myth:"Theseus entered Daedalus' Labyrinth, killed the Minotaur, and found his way out with a thread from Ariadne. Then he sailed away and left her asleep on Naxos.", cite:"Plutarch, Theseus 19–20 · Catullus 64",
    witness:["I spun it. Red wool on an olive-wood spindle. Ariadne asked for <i>something that remembers the way back.</i>","Every hero you've heard of had help: a thread, a sword under a rock, a voice in a dark room. History only keeps the one who walked out."],
    echo:"I wasn't asking to be remembered. I was asking you to notice. Look at what the heroes are holding, and ask who handed it to them.",
    relic:{icon:"thread",name:"Ball of Red Thread",desc:"Hand-spun wool, dyed madder red. One end frayed against stone.",found:"A beach on Naxos",by:"Dionysus"},
    q:"You know Theseus will leave Ariadne the moment he's safe. She doesn't.",
    opts:[
      {t:"Warn her, even if it breaks her heart early.",g:{Artemis:2,Hera:2}},
      {t:"Say nothing. It's her story to live.",g:{Apollo:2,Zeus:1,Dionysus:1}},
      {t:"Tie a second thread, one that leads someone better to her.",g:{Aphrodite:2,Dionysus:2,Hermes:1}}],
    reveal:"Theseus dropped the thread on the beach when he sailed. Dionysus found it lying beside Ariadne, followed it to her, and married her. Her crown is still in the sky: <i>Corona Borealis</i>." },

  { id:"iron", c:"#46607e", num:"V", label:"The Iron Age", title:"You", greek:"γένος σιδήρεον · our age, of toil and grief", glyph:"Σ", gpos:"top:12%;right:30%", iron:true,
    myth:"Hesiod wrote that he wished he'd never been born into the fifth race, the age of iron, of labour by day and worry by night. He meant his own time. He also meant ours.", cite:"Works and Days 174–201",
    witness:["You've been carrying the same thing every hero carried. You just didn't have a name for it.","When the lid came up, everything escaped. One thing stayed under the lip of the jar. Me.","__BIG__","Hope. I was there in every Age because I'm the only thing that never left."],
    echo:"Every Age, I stayed. Now you've found me, on a glowing screen, at whatever hour this is. That's the last relic. And you're the one who found it.",
    relic:{icon:"screen",name:"The Screen in Your Hand",desc:"Glass, light, and whoever is reading this right now.",found:"wherever you are",by:"you"},
    q:"Hesiod never said whether hope in the jar was a blessing kept for us or a curse kept from us. What do you do with it?",
    opts:[
      {t:"Keep it close. It's the one thing that's mine.",g:{Poseidon:2,Artemis:1}},
      {t:"Give it away to someone who needs it more.",g:{Aphrodite:2,Demeter:1,Dionysus:1}},
      {t:"Question it. Hope that can't be examined is just wishing.",g:{Athena:2,Apollo:1,Hermes:1}}],
    reveal:"The psychologist C. R. Snyder described hope as more than a feeling: a goal, a <i>pathway</i> towards it, and the will to walk it. The stone, the stalk, the plank and the thread were each a pathway for someone. Your reading follows." }
];

