// THE LAST THING IN THE JAR: the screenplay.
// Each act follows one ordinary person doing their job while a myth happens around them.
// Nobody explains anything. Viewers piece it together.
//
// A shot is {img, a:[x, y, zoom], b:[x, y, zoom], line}. x and y are where the camera looks,
// as fractions of the painting (0 to 1). zoom is how much of the painting's width fills the
// screen (1 = all of it, 0.25 = a close-up). The camera drifts from a to b while the line plays.
// Each spoken line has an id; its audio lives at audio/<id>.mp3 (made by scripts/voice/make.mjs).

const PAINTINGS = {
  ceiling:   {src:"img/ceiling.jpg",   credit:"Michelangelo, ceiling of the Sistine Chapel, 1508–12. Vatican. Photo: Wikimedia Commons, CC BY-SA 3.0"},
  golden:    {src:"img/golden.jpg",    credit:"Michelangelo, The Delphic Sibyl, 1509. Sistine Chapel, Vatican"},
  silver:    {src:"img/silver.jpg",    credit:"Piero di Cosimo, The Myth of Prometheus, c. 1515. Alte Pinakothek, Munich"},
  bronze:    {src:"img/bronze.jpg",    credit:"Michelangelo, The Deluge, 1508–09. Sistine Chapel, Vatican. (He painted Noah's flood; the Greeks told the same story about Deucalion.)"},
  heroic:    {src:"img/heroic.jpg",    credit:"Annibale Carracci, The Triumph of Bacchus and Ariadne, 1597–1602. Palazzo Farnese, Rome"},
  iron:      {src:"img/iron.jpg",      credit:"Raphael, Hope, from the Baglioni Altarpiece, 1507. Pinacoteca Vaticana"},
  parnassus: {src:"img/parnassus.jpg", credit:"Raphael, The Parnassus, 1511. Stanza della Segnatura, Vatican"},
  council:   {src:"img/council.jpg",   credit:"Raphael and workshop, The Council of the Gods, 1517–18. Villa Farnesina, Rome"}
};

const ACTS = [
  {
    id:"golden", num:"I", age:"The Golden Age", place:"Crete",
    who:{name:"Eudoros", greek:"Εὔδωρος", job:"a courier", voice:"apollo"},
    shots:[
      {id:"e1", img:"golden", a:[.5,.5,1], b:[.5,.42,.7], line:"Golden Age. No taxes, no winters, nobody gets old. Great time to be alive. Terrible time to be a courier, because nobody needs anything."},
      {id:"e2", img:"golden", a:[.52,.4,.42], b:[.52,.36,.28], line:"So when a lady at the palace waves me over at midnight, I'm not asking questions. Well. I'm asking one."},
      {id:"e3", img:"golden", a:[.36,.48,.4], b:[.33,.45,.32], line:"Why is the baby so heavy? She says, he's big for his age. He is a rock. I'm pretty sure he's a literal rock."},
      {id:"e4", img:"golden", a:[.36,.35,.34], b:[.4,.33,.28], line:"Delivery to the king. Signature required. I've heard things about this king. I've heard he eats his kids. Could be worse. Could be me."},
      {id:"e5", img:"golden", a:[.45,.12,.5], b:[.45,.1,.4], line:"I seal the blanket with clay. My thumb slips and leaves a print. Whatever. Nobody checks the seal."}
    ],
    q:"Cronus's guard looks at the bundle. Then at you. “That baby looks weird.”",
    opts:[
      {t:"Straight face. “They're all lumpy at this age.”", g:{Hermes:2, Athena:1}, reply:{id:"e-a", line:"They're all lumpy at this age, I tell him. He nods like a man who has never held a baby. We're fine."}},
      {t:"Tell him the truth and hope he's a dad.", g:{Apollo:2, Hera:1, Zeus:1}, reply:{id:"e-b", line:"Turns out the guard has kids too. He goes very quiet, and waves me through."}},
      {t:"Start crying. Loudly. Proud uncle energy.", g:{Aphrodite:2, Dionysus:1, Demeter:1}, reply:{id:"e-c", line:"I cry. Loudly. He's so uncomfortable he waves me through just to make it stop."}}
    ],
    after:[
      {id:"e6", img:"golden", a:[.52,.36,.26], b:[.52,.38,.36], line:"The king doesn't sign. Doesn't even look. Just swallows it. Whole. Tip was zero."},
      {id:"e7", img:"golden", a:[.5,.45,.7], b:[.5,.5,1], line:"Somewhere in a cave on this island, a real baby is screaming his head off. Not my problem. I'm off the clock."}
    ],
    card:{text:"Years later, the baby in the cave, Zeus, made Cronus cough the stone back up.\nIt was set up at Delphi, the centre of the world, and rubbed with oil every day for a thousand years.\nNobody asked about the thumbprint.", src:"Hesiod, Theogony 453–500 · Pausanias 10.24.6"},
    relic:{name:"Stone, in baby clothes", note:"clay seal, one thumbprint", mark:"Ε"}
  },
  {
    id:"silver", num:"II", age:"The Silver Age", place:"Mekone, near Corinth",
    who:{name:"Lyka", greek:"Λύκα", job:"a potter", voice:"andromeda"},
    shots:[
      {id:"l1", img:"silver", a:[.5,.5,1], b:[.45,.5,.75], line:"Silver Age. Everyone around here acts about twelve years old, for about a hundred years. I make pots. Pots don't whine."},
      {id:"l2", img:"silver", a:[.24,.72,.45], b:[.2,.74,.36], line:"My neighbour's making people out of clay again. Nice guy. Weird hobby. Calls himself Prometheus. Big ideas. No oven."},
      {id:"l3", img:"silver", a:[.49,.45,.4], b:[.49,.35,.3], line:"Tonight he buys a fennel stalk off me. The giant hollow kind. Asks if it'll hold a hot coal. I say, a coal from where? He points up."},
      {id:"l4", img:"silver", a:[.8,.18,.34], b:[.86,.13,.24], line:"So that's where he's going."},
      {id:"l5", img:"silver", a:[.74,.66,.4], b:[.76,.64,.3], line:"Then an order comes in from upstairs. One storage jar. Big. Sealed. A wedding gift for a lovely young woman named Pandora. Do not open."},
      {id:"l6", img:"silver", a:[.28,.2,.3], b:[.24,.17,.2], line:"Who sends a sealed jar as a wedding present? Rich people. Rich people do."}
    ],
    q:"Olympus wants the jar sealed tight. No questions. You're the potter.",
    opts:[
      {t:"Put a little something in the bottom for luck. Tradition.", g:{Demeter:2, Hephaestus:1, Aphrodite:1}, reply:{id:"l-a", line:"A tiny clay bird, tucked under the rim. You never send a jar out empty. Bad luck."}},
      {t:"Build it exactly to spec. The client is always right.", g:{Zeus:2, Apollo:1, Hera:1}, reply:{id:"l-b", line:"Built to spec. And, fine, a tiny clay bird under the rim. I'm not a monster. Tradition."}},
      {t:"Make the lid a little loose. Things should be able to get out.", g:{Dionysus:2, Hermes:1, Artemis:1}, reply:{id:"l-c", line:"A lid that sits a bit loose. And a tiny clay bird under the rim, for luck. Tradition."}}
    ],
    after:[
      {id:"l7", img:"silver", a:[.4,.47,.4], b:[.49,.4,.5], line:"Next morning there's a fire in every house on the street, and my neighbour's gone. Chained to a mountain, they say. Over a fennel stalk."},
      {id:"l8", img:"silver", a:[.5,.5,.7], b:[.5,.5,1], line:"And the jar? Delivered. Signed for. I'm sure it's fine."}
    ],
    card:{text:"Pandora lifted the lid. Sickness, toil and grief flew out into the world.\nOne thing stayed behind, under the rim of the jar.", src:"Hesiod, Works and Days 90–99 · Theogony 565–567 · It was a jar, not a box. The box is a Renaissance mistranslation."},
    relic:{name:"Rim of a storage jar", note:"tiny clay bird baked underneath", mark:"Λ"}
  },
  {
    id:"bronze", num:"III", age:"The Bronze Age", place:"Phthia, Thessaly",
    who:{name:"Pamphilos", greek:"Πάμφιλος", job:"a carpenter", voice:"aries"},
    shots:[
      {id:"p1", img:"bronze", a:[.5,.5,.85], b:[.42,.52,.6], line:"Bronze Age. Everyone's built like a door and wants to fight about it. Good for business, though. Everybody needs a new door."},
      {id:"p2", img:"bronze", a:[.4,.34,.34], b:[.39,.32,.24], line:"Today, a rush job. Old man named Deucalion wants a chest. Not a boat, he says. A chest. Big enough for two adults and nine days of bread."},
      {id:"p3", img:"bronze", a:[.32,.52,.38], b:[.28,.5,.3], line:"I say, expecting weather? He says his dad told him to build it. His dad is Prometheus. The one on the mountain. So. Yes. Expecting weather."},
      {id:"p4", img:"bronze", a:[.6,.6,.26], b:[.6,.57,.18], line:"Pitch on every seam. Air holes in the lid. And because I'm a professional, I carve my usual note inside the lid. Stuck? Look down. It means check the floor for the latch. Customers love it."},
      {id:"p5", img:"bronze", a:[.3,.32,.34], b:[.28,.3,.26], line:"It starts raining while I'm still sanding."}
    ],
    q:"The chest holds two. A neighbour is banging on your door, begging to come.",
    opts:[
      {t:"Offer her the space. Somebody can squeeze.", g:{Demeter:2, Artemis:1}, reply:{id:"p-a", line:"I offer. She looks at the size of it and says she'll take her chances with the hills. Smart woman. I hope."}},
      {t:"Two means two. Nail the lid down.", g:{Poseidon:2, Ares:1, Zeus:1}, reply:{id:"p-b", line:"Two means two. I nail it shut and I don't look at her. I'm still not looking at her."}},
      {t:"Give her your hammer and shout instructions through the rain.", g:{Hephaestus:2, Athena:2}, reply:{id:"p-c", line:"I give her my spare hammer and shout instructions through the rain. Last I saw, she had most of a raft."}}
    ],
    after:[
      {id:"p6", img:"bronze", a:[.49,.48,.3], b:[.49,.46,.22], line:"Nine days later I'm sitting on a roof, counting. I scratch a mark on a plank every morning. Out loud. Somebody should be counting."},
      {id:"p7", img:"bronze", a:[.8,.5,.36], b:[.5,.5,.85], line:"Could be worse. I've got a plank."}
    ],
    card:{text:"The chest came to rest on Mount Parnassus. An oracle told them to throw the bones of their mother over their shoulders.\nDeucalion looked down.\nThe mother was the Earth. Her bones were stones. The stones he threw became men, and the ones Pyrrha threw became women.", src:"Apollodorus 1.7.2 · Ovid, Metamorphoses I"},
    relic:{name:"Chest lid, oak", note:"carved inside: STUCK? LOOK DOWN.", mark:"Π"}
  },
  {
    id:"heroic", num:"IV", age:"The Age of Heroes", place:"Knossos, Crete",
    who:{name:"Ion", greek:"Ἴων", job:"a night janitor", voice:"orion"},
    shots:[
      {id:"i1", img:"heroic", a:[.7,.45,.4], b:[.66,.42,.3], line:"Age of Heroes. Every week some guy with great hair shows up and wants to kill something. Then I clean up."},
      {id:"i2", img:"heroic", a:[.42,.8,.34], b:[.4,.78,.26], line:"I'm on nights at the Labyrinth. Daedalus designed it. Daedalus has never had to mop it."},
      {id:"i3", img:"heroic", a:[.5,.5,1], b:[.5,.5,.8], line:"I get lost every single shift. So I tie red yarn to the front door and unroll it as I go. My mum knits. I have a lot of yarn."},
      {id:"i4", img:"heroic", a:[.38,.4,.3], b:[.36,.36,.2], line:"Tonight the king's daughter, Ariadne, catches me coming out. She stares at the yarn. Does that work? Every time, princess."},
      {id:"i5", img:"heroic", a:[.22,.45,.32], b:[.2,.42,.24], line:"She wants a ball. It's for a friend. The friend is the Athenian in the cells with the jawline. I've seen how this goes."}
    ],
    q:"Ariadne wants your yarn for a prisoner named Theseus.",
    opts:[
      {t:"Give her the red one. Love is love.", g:{Aphrodite:2, Dionysus:1}, reply:{id:"i-a", line:"I give her the red one. Love is love. Mum would want me to."}},
      {t:"Give it, and tell her he's going to leave her.", g:{Artemis:2, Hera:2}, reply:{id:"i-b", line:"I give it to her and say, he's going to leave you on an island. She laughs. I don't."}},
      {t:"Union rates. Two drachmas.", g:{Hermes:2, Ares:1}, reply:{id:"i-c", line:"Two drachmas. Union rates. She pays three. I feel bad about it for exactly one minute."}}
    ],
    after:[
      {id:"i6", img:"heroic", a:[.8,.82,.36], b:[.82,.82,.26], line:"Next night: no bull, no Athenians, no princess. Just my yarn, unrolled all the way to the middle and back. Easiest shift I've ever had."},
      {id:"i7", img:"heroic", a:[.22,.15,.26], b:[.22,.13,.18], line:"Could be worse."}
    ],
    card:{text:"Theseus killed the Minotaur, followed the thread out, and sailed away with Ariadne.\nHe left her asleep on the island of Naxos.\nDionysus found her there, married her, and set her crown among the stars. You can still see it: Corona Borealis.", src:"Plutarch, Theseus 19–20 · Catullus 64"},
    relic:{name:"Red wool, mostly unrolled", note:"label: ION'S. DO NOT TOUCH.", mark:"Ι"}
  },
  {
    id:"iron", num:"V", age:"The Iron Age", place:"Vatican City, last Tuesday",
    who:{name:"Sofia", greek:"Σοφία", job:"an intern", voice:"luna"},
    shots:[
      {id:"s1", img:"ceiling", a:[.15,.5,.4], b:[.4,.5,.4], line:"Iron Age. That's us. The poet Hesiod said it's the worst one. Work all day, worry all night. He'd have loved my internship."},
      {id:"s2", img:"ceiling", a:[.6,.5,.45], b:[.85,.5,.38], line:"Vatican Museums, night shift. I'm cataloguing a crate from the basement that's been down there since before electricity. No donor. No paperwork."},
      {id:"s3", img:"golden", a:[.33,.47,.4], b:[.33,.45,.3], line:"Item one. A stone, wrapped in what used to be baby clothes. Clay seal, with a little mark on it. Like an E."},
      {id:"s4", img:"silver", a:[.49,.4,.4], b:[.49,.36,.3], line:"Item two. Part of a big jar. There's a tiny clay bird stuck under the rim. Potter's mark looks like an upside down V."},
      {id:"s5", img:"bronze", a:[.39,.34,.3], b:[.39,.32,.22], line:"Item three. An oak lid. Someone carved, stuck, look down, inside it. In Greek. That's either very deep, or about a latch."},
      {id:"s6", img:"heroic", a:[.36,.38,.28], b:[.36,.36,.2], line:"Item four. Red yarn. The label says, Ion's, do not touch. Sorry, Ion."},
      {id:"s7", img:"iron", a:[.15,.5,.34], b:[.15,.48,.26], line:"Two thousand years of nobody opening this crate, and they give it to the intern."}
    ],
    q:"The crate has no donor. The form needs a name.",
    opts:[
      {t:"Write “unknown”, sign it, go home.", g:{Apollo:1, Zeus:1, Hera:1}, reply:{id:"s-a", line:"Donor: unknown. I sign it and go home. Could be worse."}},
      {t:"Stay late and work out who sent it.", g:{Athena:2, Artemis:1, Hephaestus:1}, reply:{id:"s-b", line:"I stay until four in the morning reading Hesiod. I don't find a name. I find a lot of jars."}},
      {t:"Keep the little bird. Nobody will miss a bird.", g:{Poseidon:2, Dionysus:1, Ares:1}, reply:{id:"s-c", line:"I keep the bird. Nobody's going to miss a bird. It lives on my desk now."}}
    ],
    after:[
      {id:"s8", img:"iron", a:[.5,.5,.8], b:[.53,.3,.24], line:"On the way out I cut through the Pinacoteca. There's a little panel I've never noticed. A woman, hands together, looking up. The label just says, Hope."},
      {id:"s9", img:"iron", a:[.53,.32,.2], b:[.53,.3,.16], line:"Funny. Felt like she was looking at me."}
    ],
    card:null,
    relic:{name:"Inventory form, crate 7", note:"catalogued by S.", mark:"Σ"}
  }
];

// The Oracle reads the visitor's choices back to them at the end.
const ORACLE = {voice:"thalia", img:"parnassus", frames:[[.5,.45,.85],[.53,.42,.3],[.28,.4,.3],[.5,.45,.7]]};

const GODS = {
  Zeus:{gk:"Ζεύς", a:"The Sovereign", gift:"Vision and decisiveness: builds the kingdom, makes the call.", shadow:"Confuses being in charge with being close. Can't hear no."},
  Hera:{gk:"Ἥρα", a:"The Committed", gift:"Loyalty that keeps promises when it would be easier not to.", shadow:"When betrayed, punishes the wrong person."},
  Poseidon:{gk:"Ποσειδῶν", a:"The Deep Feeler", gift:"Emotional depth and force: feels everything all the way down.", shadow:"Grudges that surface as storms, years later."},
  Demeter:{gk:"Δημήτηρ", a:"The Nurturer", gift:"Feeds, tends and sustains the people around her.", shadow:"Grief so total it freezes the whole world."},
  Athena:{gk:"Ἀθηνᾶ", a:"The Strategist", gift:"Cool thinking under pressure; sees the whole board.", shadow:"Armoured. Solves the feeling instead of having it."},
  Apollo:{gk:"Ἀπόλλων", a:"The Clarifier", gift:"Truth, discipline, craft. Brings order and light.", shadow:"Perfectionism and distance; admired more than known."},
  Artemis:{gk:"Ἄρτεμις", a:"The Independent", gift:"Self-direction, and fierce protection of the vulnerable.", shadow:"Contempt for weakness; can be merciless."},
  Ares:{gk:"Ἄρης", a:"The Warrior", gift:"Courage in the body. Acts now, while others debate.", shadow:"Impulsive anger; fights the fight instead of the problem."},
  Aphrodite:{gk:"Ἀφροδίτη", a:"The Connector", gift:"Magnetism; changes people through closeness and beauty.", shadow:"Moves on fast, leaves chaos behind."},
  Hephaestus:{gk:"Ἥφαιστος", a:"The Maker", gift:"Turns pain into craft; builds what lasts.", shadow:"Withdraws to the workshop; resentment kept warm."},
  Hermes:{gk:"Ἑρμῆς", a:"The Messenger", gift:"Wit and fluency; moves between worlds and translates.", shadow:"Slippery. Talks past the truth when it's inconvenient."},
  Dionysus:{gk:"Διόνυσος", a:"The Liberator", gift:"Joy and release; dissolves the walls between people.", shadow:"Excess. Loses himself along with the boundaries."}
};
const GOD_LIST = Object.keys(GODS);

if (typeof module !== "undefined") module.exports = {PAINTINGS, ACTS, ORACLE};
