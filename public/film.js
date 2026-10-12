// THE LAST THING IN THE JAR · Episode I: The Coin
// The screenplay lives in docs/episode-1-the-coin.md. This is the same script, ready to play.
//
// A shot is one spoken line: {id, who, line, see:[...]}.
//   who  = a key in CAST (sets the voice and the name over the subtitle). Leave it out for silent beats.
//   see  = what the camera shows while the line plays, in order, as named looks from SHOTS (shots.js).
//          Several looks = quick cuts within the line.
//   id   = the recording: audio/<id>.mp3 (made by scripts/voice/make.mjs).

const CAST = {
  mikon:     {name:"Mikon",     voice:"apollo"},
  hermes:    {name:"Hermes",    voice:"hermes"},
  charon:    {name:"Charon",    voice:"saturn"},
  shade:     {name:"A shade",   voice:"draco"},
  orpheus:   {name:"Orpheus",   voice:"orpheus"},
  theseus:   {name:"Theseus",   voice:"mars"},
  pirithous: {name:"Pirithous", voice:"aries"},
  hades:     {name:"Hades",     voice:"pluto"},
  heracles:  {name:"Heracles",  voice:"atlas"},
  elpenor:   {name:"Elpenor",   voice:"orion"},
  sibyl:     {name:"The Sibyl", voice:"athena"}
};

const FILM = {
  title:"The Coin",
  episode:"Episode I: The Last Thing in the Jar",

  cold:[
    {id:"c01", who:"mikon", line:"Okay. Okay okay okay. I have it. I actually have it.", see:["river dark", "charon face", "crowd of shades"]},
    {id:"c02", who:"mikon", line:"Do not drop it. Do not drop the...", see:["coin", "river dark"]},
    {sfx:"splash", see:["river dark"]},
    {id:"c03", who:"mikon", line:"...Every time.", see:["mikon face"]}
  ],
  after:"One hundred years earlier.",

  acts:[
    {
      id:"bank", num:"I", label:"Day one", title:"The Bank",
      shots:[
        {id:"a01", who:"mikon", line:"My cousin's wedding. Great food. I'm on my fourth plate of olives, which is three more than I should be on.", see:["banquet wide", "banquet faces", "mikon face"]},
        {id:"a02", who:"mikon", line:"Here is a thing nobody tells you about olives.", see:["banquet faces"]},
        {id:"a03", who:"mikon", line:"They have pits.", see:["funeral bier"], pause:900},
        {id:"a04", who:"hermes", line:"Right. Here's you. River's there, boat's there, ferryman's that one. Coin?", see:["hermes leading souls", "hermes face", "charon boat"]},
        {id:"a05", who:"mikon", line:"Sorry?", see:["mikon face"]},
        {id:"a06", who:"hermes", line:"The coin. They put a coin in your mouth. For the fare.", see:["hermes face", "coin"]},
        {id:"a07", who:"mikon", line:"I think there was a wedding on.", see:["mikon face"]},
        {id:"a08", who:"hermes", line:"Ah. Hundred years, then. Rules are rules. Lovely to meet you.", see:["hermes face", "hermes leading souls"]},
        {id:"a09", who:"mikon", line:"Hi! Quick question about the...", see:["charon boat"]},
        {id:"a10", who:"charon", line:"Coin.", see:["charon face"]},
        {id:"a11", who:"mikon", line:"I don't have a...", see:["mikon face"]},
        {sfx:"splash", see:["charon oar", "river dark"]},
        {id:"a12", who:"mikon", line:"Okay. That's fine. That's fine. Ninety-nine years and three hundred and sixty-four days.", see:["crowd of shades", "mikon face"]}
      ],
      q:"A hundred years is a long time. What's the plan?",
      opts:[
        {t:"Make friends. You'll be here a while.", g:{Aphrodite:2, Dionysus:1},
          reply:[{id:"a13", who:"mikon", line:"Hi, I'm Mikon. What are you in for?", see:["crowd of shades"]}, {id:"a14", who:"mikon", line:"Okay. We'll circle back.", see:["shade face"]}]},
        {t:"Start looking for a coin. They have to drop somewhere.", g:{Hermes:2, Hephaestus:1},
          reply:[{id:"a15", who:"mikon", line:"People die rich all the time. Somebody's going to drop one.", see:["riverbank mud", "mikon face"]}]},
        {t:"Ask Charon nicely. Every day.", g:{Hera:2, Apollo:1},
          reply:[{id:"a16", who:"mikon", line:"Morning, Charon!", see:["charon boat"]}, {id:"a17", who:"charon", line:"Coin.", see:["charon face"]}, {id:"a18", who:"mikon", line:"Tomorrow, then!", see:["mikon face"]}]}
      ]
    },
    {
      id:"singer", num:"II", label:"Year nine", title:"The Singer",
      shots:[
        {id:"b01", who:"mikon", line:"Who is that.", see:["orpheus walking", "crowd of shades"]},
        {id:"b02", who:"shade", line:"Orpheus. His wife died. He's come to sing her back.", see:["shade face", "orpheus face"]},
        {id:"b03", who:"mikon", line:"Can you do that?", see:["mikon face"]},
        {sfx:"lyre", see:["orpheus playing", "orpheus face", "hades and persephone"]},
        {id:"b04", who:"mikon", line:"Charon's crying. I didn't know he had... water.", see:["charon face", "mikon face"]}
      ],
      q:"Charon is weeping. Nobody's watching the boat.",
      opts:[
        {t:"Sneak on.", g:{Ares:2, Hermes:1},
          reply:[{sfx:"splash", see:["charon boat", "charon oar"]}, {id:"b05", who:"mikon", line:"So close.", see:["mikon face"]}]},
        {t:"Ask Orpheus for a coin.", g:{Athena:2, Zeus:1},
          reply:[{id:"b06", who:"mikon", line:"Sorry, huge fan, quick one, do you have a spare...", see:["orpheus walking"]}, {id:"b07", who:"orpheus", line:"I'm getting my wife.", see:["orpheus face"]}, {id:"b08", who:"mikon", line:"Totally. Totally. Good luck.", see:["mikon face"]}]},
        {t:"Sing along.", g:{Dionysus:2, Apollo:1, Aphrodite:1},
          reply:[{id:"b09", who:"mikon", line:"La la laaa, la la la...", see:["mikon face", "crowd of shades"]}, {id:"b10", who:"shade", line:"Please don't.", see:["shade face"]}]}
      ],
      after:[
        {id:"b11", who:"mikon", line:"He's coming back. On his own.", see:["orpheus looks back", "eurydice lost"]},
        {id:"b12", who:"mikon", line:"He looked back. Yeah. I'd have looked back too.", see:["orpheus face", "mikon face"], pause:900}
      ]
    },
    {
      id:"chairs", num:"III", label:"Year twenty-three", title:"The Chairs",
      shots:[
        {id:"d01", who:"theseus", line:"Down, in, grab the queen, out. Easy.", see:["theseus face", "two heroes"]},
        {id:"d02", who:"mikon", line:"Sorry, grab who?", see:["mikon face"]},
        {id:"d03", who:"pirithous", line:"Persephone. I'm going to marry her.", see:["pirithous face", "persephone face"]},
        {id:"d04", who:"mikon", line:"She's married. To Hades. Who is... the guy who owns all this.", see:["hades face", "underworld wide"]},
        {id:"d05", who:"pirithous", line:"For now.", see:["pirithous face"]},
        {sfx:"splash", see:["charon boat", "mikon face"]},
        {id:"d06", who:"hades", line:"Please. Sit. You must be tired.", see:["hades and persephone", "hades face"]}
      ],
      q:"You can hear it from the bank. Two stone chairs. Do you shout a warning?",
      opts:[
        {t:"“DON'T SIT DOWN!”", g:{Artemis:2, Hera:1},
          reply:[{id:"d07", who:"mikon", line:"Don't sit down! Don't sit...", see:["mikon face"]}, {id:"d08", who:"mikon", line:"...Okay.", see:["two heroes"]}]},
        {t:"Stay out of it. They're heroes, they'll figure it out.", g:{Apollo:2, Zeus:1},
          reply:[{id:"d09", who:"mikon", line:"They're heroes. They'll figure it out.", see:["mikon face", "two heroes"]}]},
        {t:"“Is anyone else seeing this?”", g:{Hermes:1, Demeter:1, Dionysus:1},
          reply:[{id:"d10", who:"mikon", line:"Is anyone else seeing this?", see:["mikon face"]}, {id:"d11", who:"shade", line:"Yes.", see:["shade face"]}, {id:"d12", who:"mikon", line:"Should we...", see:["mikon face"]}, {id:"d13", who:"shade", line:"No.", see:["shade face"]}]}
      ],
      after:[
        {id:"d14", who:"theseus", line:"I can't get up.", see:["theseus face"]},
        {id:"d15", who:"pirithous", line:"Why can't I get up?", see:["pirithous face"]},
        {id:"d16", who:"mikon", line:"Because you sat down in the house of the god of death!", see:["mikon face", "hades face"]}
      ]
    },
    {
      id:"dog", num:"IV", label:"Year forty", title:"The Dog",
      shots:[
        {sfx:"bark", see:["underworld wide"]},
        {sfx:"hit", see:["cerberus heads"], cut:true},
        {id:"f01", who:"mikon", line:"Nope. Nope nope nope.", see:["mikon face", "cerberus heads"]},
        {id:"f02", who:"heracles", line:"Who's a good boy. Who's a good, big, three-headed...", see:["heracles face", "heracles and cerberus"]},
        {sfx:"rumble", see:["heracles and cerberus", "cerberus heads"]},
        {id:"f03", who:"charon", line:"Coin.", see:["charon face"]},
        {id:"f04", who:"heracles", line:"No.", see:["heracles face"]},
        {id:"f05", who:"mikon", line:"Oh, so that works?", see:["charon boat", "mikon face"]}
      ],
      q:"Heracles doesn't pay. Heracles just goes.",
      opts:[
        {t:"Try it yourself. “No.”", g:{Ares:2, Zeus:1},
          reply:[{id:"f06", who:"mikon", line:"No.", see:["mikon face"]}, {id:"f07", who:"charon", line:"Coin.", see:["charon face"]}, {id:"f08", who:"mikon", line:"Okay, yeah, no, that's fair.", see:["mikon face"]}, {sfx:"splash", see:["charon oar"]}]},
        {t:"Ask Heracles to take you with him.", g:{Aphrodite:1, Hera:1, Poseidon:1},
          reply:[{id:"f09", who:"heracles", line:"Can't, mate. Got a dog to carry.", see:["heracles and cerberus", "cerberus heads"]}]},
        {t:"Hide behind a rock until the dog is gone.", g:{Athena:1, Artemis:1, Poseidon:1},
          reply:[{id:"f10", who:"mikon", line:"Rock. Rock rock rock.", see:["underworld wide"]}, {sfx:"bark", see:["cerberus heads"], cut:true}, {id:"f11", who:"mikon", line:"I'll hide behind a different rock.", see:["mikon face"]}]}
      ],
      after:[
        {id:"f12", who:"pirithous", line:"Guys?", see:["pirithous face"], pause:900}
      ]
    },
    {
      id:"coin", num:"V", label:"Year one hundred", title:"The Coin",
      shots:[
        {id:"g01", who:"elpenor", line:"Where am I.", see:["elpenor face"]},
        {id:"g02", who:"mikon", line:"Dead! Welcome. How'd you go?", see:["mikon face"]},
        {id:"g03", who:"elpenor", line:"Fell off a roof. I was asleep up there. Somebody shouted, I got up, I forgot I was on a roof.", see:["elpenor face", "odysseus and the dead"]},
        {id:"g04", who:"mikon", line:"Olive pit.", see:["mikon face"], pause:700},
        {id:"g05", who:"elpenor", line:"Odysseus! It's me! Go back and bury me! Put my oar on top, so people know I was a rower!", see:["odysseus and the dead", "odysseus face"]},
        {id:"g06", who:"mikon", line:"That's great. That's great for you. Could you ask him if he has a coin?", see:["mikon face", "crowd of shades"]},
        {id:"g07", who:"sibyl", line:"Keep walking. Don't make eye contact with the unburied. They'll talk to you.", see:["aeneas and sibyl", "sibyl face"]},
        {id:"g08", who:"mikon", line:"Hi! I'm unburied!", see:["mikon face"]},
        {id:"g09", who:"sibyl", line:"See.", see:["sibyl face"]},
        {id:"g10", who:"mikon", line:"A coin. A branch. A song. A dog. Everybody's got something.", see:["golden bough", "charon boat"]},
        {sfx:"splash", see:["charon oar"]},
        {id:"g11", who:"mikon", line:"Two. She's got two.", see:["psyche face", "psyche with charon"]},
        {id:"g12", who:"mikon", line:"Miss! Miss! Sorry! Could you possibly...", see:["mikon old", "psyche with charon"]},
        {id:"g13", who:"mikon", line:"No, I get it. You're not allowed. Somebody told you not to. Somebody's always told you not to.", see:["psyche face", "mikon old"], pause:900},
        {id:"g14", who:"charon", line:"Time.", see:["charon face"]},
        {id:"g15", who:"mikon", line:"Sorry?", see:["mikon old"]},
        {id:"g16", who:"charon", line:"A hundred years. Get in.", see:["charon face", "charon boat"]}
      ],
      q:"You can finally cross. There's a kid on the bank with no coin.",
      opts:[
        {t:"Get in the boat. A hundred years. You earned it.", g:{Zeus:1, Apollo:1, Hephaestus:1},
          reply:[{id:"g17", who:"mikon", line:"It goes faster than you'd think. Make friends. Watch out for the oar.", see:["mikon old", "charon boat"]}]},
        {t:"Give the kid your place.", g:{Demeter:2, Hera:1},
          reply:[{id:"g18", who:"charon", line:"Doesn't work like that.", see:["charon face"]}, {id:"g19", who:"mikon", line:"Then I'll wait with him.", see:["mikon old"]}, {id:"g20", who:"charon", line:"...Both of you. Get in.", see:["charon face", "charon boat"]}]},
        {t:"Stay. You've got a good spot now.", g:{Poseidon:2, Dionysus:1, Hephaestus:1},
          reply:[{id:"g21", who:"mikon", line:"You know what? I've got a rock. I've got a view. I've seen Heracles. Next century.", see:["mikon old", "river wide"]}]}
      ],
      after:[
        {sfx:"oar", see:["charon oar", "river wide"]},
        {id:"g22", who:"mikon", line:"Huh. Could be worse.", see:["mikon old"], pause:1200}
      ]
    }
  ],

  // Silent, on black, after the last act.
  card:{text:"Virgil wrote that the unburied wait a hundred years on the bank.\nApuleius wrote that Psyche was told to ignore an old man begging from the river.\nNobody wrote down his name.", src:"Virgil, Aeneid 6 · Apuleius, Metamorphoses 6.18–19"},

  // After the credits.
  sting:{see:["river wide"], text:"Mikon's rock, on the bank. A coin is lying on it."}
};

// The Oracle reads the player's choices back to them at the end.
const ORACLE = {voice:"thalia"};

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

if (typeof module !== "undefined") module.exports = {CAST, FILM, ORACLE};
