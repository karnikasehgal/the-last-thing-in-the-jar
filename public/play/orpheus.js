// CHAPTER II · THE LYRE. You are Orpheus.
// Virgil, Georgics 4.453 to 527, and Ovid, Metamorphoses 10.1 to 77: he sings his way past the ferryman,
// the dog and the Furies, sings for the king and queen of the dead, and gets his wife back on one condition.
import { FAR, scatterShades } from "./farbank.js";
import { perform, SONGS, lullaby, pluck } from "./music.js";

export function makeOrpheus(G) {
  const {THREE, scene, camera, me, NPC, dog, V, flat, $} = G;
  const st = {stage: 0, lyre: false, breath: 1, tired: false, eury: null, trail: [], ride: false, lookT: 0, fired: {}, over: false, sis: false, met: {}};
  const song = lullaby();
  const say = (who, id, text, cut) => G.line(who, id, text, cut);
  const voice = (who, id, text) => G.line(who, id, text, "voice");

  /* ---------- the lyre in your hands ---------- */
  const lyre = (() => {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x5a3a1e, roughness: .5}));
    shell.scale.set(1, .45, 1.15); shell.rotation.x = -Math.PI / 2; g.add(shell);
    const horn = new THREE.MeshStandardMaterial({color: 0x2a1c12, roughness: .4});
    for (const s of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([V(s * .06, .04, 0), V(s * .1, .16, -.01), V(s * .07, .27, 0), V(s * .1, .34, .01)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, .012, 6), horn));
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .24, 8), horn); bar.rotation.z = Math.PI / 2; bar.position.y = .31; g.add(bar);
    const strings = [];
    for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.0018, .0018, .29, 3), new THREE.MeshBasicMaterial({color: 0xe8dcc0})); s.position.set(-.045 + i * .015, .165, .018); g.add(s); strings.push(s); }
    g.position.set(.3, -.36, -.62); g.rotation.set(.25, -.35, -.15);
    g.visible = false; camera.add(g);
    return {g, strings};
  })();

  /* ---------- setting the stage ---------- */
  function setup() {
    G.clearChapterOne(); G.save.meet("orpheus");
    me.pos.copy(G.PLACES.start); me.yaw = -Math.PI / 2;
    // Mikon is still on the bank, ninety-something years in.
    NPC.mikon = Object.assign(G.cast("mikon_bank", {seated: true}), {name: "Mikon", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: V(14, 0, 16.05), yaw: Math.PI, seatY: .5});
    NPC.hades = Object.assign(G.cast("hades", {scale: 1.06, seated: true}), {name: "Hades", idle: "Sitting_Idle_Loop", talk: "Sitting_Talking_Loop", pos: FAR.hades.clone(), yaw: Math.PI, seatY: 1.1});
    NPC.persephone = Object.assign(G.cast("persephone", {seated: true}), {name: "Persephone", idle: "sittable", talk: "sittabletalk", pos: FAR.persephone.clone(), yaw: Math.PI, seatY: 1.1});
    NPC.sisyphus = Object.assign(G.cast("sisyphus"), {name: "Sisyphus", idle: "Push_Loop", talk: "Idle_Talking_Loop", pos: FAR.sisyphus.clone(), yaw: 0});
    NPC.eurydice = Object.assign(G.cast("eurydice"), {name: "Eurydice", idle: "Idle_Loop", talk: "Idle_Loop", pos: V(0, 0, 134), yaw: 0});
    for (const id of ["mikon", "hades", "persephone", "sisyphus", "eurydice"]) G.placeNPC(NPC[id]);
    // Sisyphus leans into the rock with both hands on it (the push is a slow walk on the spot)
    { const sis = NPC.sisyphus; sis.root.rotation.order = "YXZ";
      G.poses.add(() => { if (!sis.root.visible) return; const pushing = sis.idle === "Push_Loop"; sis.root.rotation.x = pushing ? .3 : 0; if (!pushing) return;
        sis.root.updateMatrixWorld(true); const c = G.farWorld.boulder.position, ch = new THREE.Vector3(); sis.bones.spine_03.getWorldPosition(ch);
        const toMe = ch.clone().sub(c).setY(0).normalize(), side = new THREE.Vector3(-toMe.z, 0, toMe.x);
        for (const [s, k] of [["l", 1], ["r", -1]]) { const t = c.clone().add(new THREE.Vector3(0, .25, 0)).addScaledVector(toMe, .95).addScaledVector(side, k * .38);
          G.reach(sis, s, t, ch.clone().addScaledVector(side, k * .6).add(new THREE.Vector3(0, -.4, 0)), .085); } }); }
    NPC.eurydice.root.visible = false;
    const shadeT = G.cast("shade"); shadeT.root.visible = false;
    st.shades = scatterShades(scene, shadeT, G.SkeletonUtils, G.CLIPS, 9);
    dog.pos.copy(FAR.gateMouth); dog.mode = "guard"; dog.calm = 0; dog.yaw = Math.PI; dog.asleep = false;
    lyre.g.visible = false; // only in your hands while you play (it hung in front of the camera through the film)
    Object.assign(G.CARDS, {
      mikon: ["Mikon", "Ninety-nine years on the bank. Still no coin."],
      sisyphus: ["Sisyphus", "King of Corinth. Cheated death twice. Pushes a rock."],
      hades: ["Hades and Persephone", "King and Queen of the dead."],
      hermes: ["Hermes", "Guide of the dead. He has seen everything. Not this."],
      charon: ["Charon", "Ferryman of the dead. Does not take the living."]
    });
  }

  /* ---------- goals ---------- */
  const GOALS = [
    {label: "Talk to Hermes, just ahead", at: () => NPC.hermes.pos},
    {label: "Find Charon at the end of the dock. He won't take the living. He might take a song", at: () => G.PLACES.dock},
    {label: () => dog.asleep ? "Through the gate, and follow the path to the House of Hades" : "Get past Cerberus at the gate. Hold F to play your lyre and keep him calm", at: () => dog.asleep ? FAR.throneFront : FAR.gateMouth},
    {label: "Follow the path through the meadow to the House of Hades. Ask for her", at: () => FAR.throneFront},
    {label: () => st.side === "far" ? "Lead her back to the ferry. Don't look back" : "Lead her to the way up, at the far end of the bank. Don't look back", at: () => st.side === "far" ? V(0, 0, 52) : V(-43, 0, 13)}
  ];
  const stageNow = () => st.stage === 2 && dog.asleep && me.pos.z > FAR.gateZ + 1 ? 3 : Math.min(st.stage, 4);
  st.side = "near";

  /* ---------- conversations ---------- */
  async function conversation(id) {
    G.beginTalk(NPC[id] || NPC.hades, id);
    if (id === "hermes") {
      await say("hermes", "v2_oh1", "Hold on. You're breathing. Nobody down here breathes, it's one of the first things they give up. Who are you, and how did you get past the gate at Taenarum?");
      await say("orpheus", "v2_o1", "My name is Orpheus. My wife is Eurydice. We were married in the spring, and that same afternoon a snake found her ankle in the long grass. I sang at her funeral. Then I stopped singing, and I came here instead.");
      await say("hermes", "v2_oh2", "I'm sorry. I mean that, I was there, I heard the song. But I have to tell you how this goes. The living don't cross. Charon won't take you. And on the far bank there's a dog whose entire purpose is to keep people exactly where they are.", "ferry");
      const k = await G.choose([{t: "Ask for his help"}, {t: "Show him the lyre"}, {t: "Ask if she remembers"}]);
      me.choices.hermes = [{Hermes: 2, Athena: 1}, {Apollo: 2, Dionysus: 1}, {Aphrodite: 2, Hera: 1}][k];
      if (k === 0) await say("hermes", "v2_oh4", "I walk people down. I don't walk them back. There isn't a road for that, Orpheus. There's barely a road down.");
      if (k === 1) { await say("orpheus", "v2_o2", "I brought my lyre."); await say("hermes", "v2_oh3", "Against the ferryman of the dead, a lyre. You know I invented that instrument? Out of a tortoise shell, when I was one day old. I'd very much like to see what it does to Charon."); }
      if (k === 2) await say("hermes", "v2_oh5", "Nobody talks much down here, but I'll tell you this much. She hasn't drunk from Lethe, the river of forgetting. Whatever she was, she still is. Go on, then. I'll be over here, looking the other way.");
      st.stage = Math.max(st.stage, 1); G.hermesLeaves();
    } else if (id === "mikon") {
      await say("mikon", "v2_om1", "You're the singer, aren't you? Everybody's talking about you. Well, nobody talks down here, but they're all looking at you the way people look at the weather. Good luck with Charon. I've been working on him for ninety-nine years.");
    } else if (id === "charon") {
      if (st.stage >= 4 && st.side === "far") return backAcross();
      if (st.side === "far") { await say("charon", "v2_oc1", "Coin."); G.endTalk(); return; }
      if (st.stage >= 2) { await say("charon", "v2_oc1", "Coin."); G.endTalk(); return; }
      await say("charon", "v2_oc1", "Coin.");
      await say("orpheus", "v2_o3", "I don't have one. I'm not dead.");
      await say("charon", "v2_oc2", "Then you're on the wrong side of the river, and that's where you'll stay.");
      await say("orpheus", "v2_o4", "Let me play you something first. One song. If you still want me gone when it's over, I'll go.");
      const r = await perform(SONGS.ferry, {title: "A song for the ferryman", sub: "Press Space, or tap, as each note reaches the ring", need: .65});
      if (!r.passed) { await say("charon", "v2_oc5", "I've heard better from the gulls. Go home, singer."); G.endTalk(); G.toast("He didn't feel it. Try again: talk to him."); return; }
      await say("charon", "v2_oc3", "That was her song. The girl from Thrace. She sat right there in the middle and hummed it the whole way over. Get in. Sit where she sat.");
      G.endTalk();
      st.stage = 2;
      await G.crossRiver(true, {during: async () => { await voice("charon", "v2_oc4", "The dog's awake on the other side. He doesn't care for music. He doesn't care for anything, as far as I can tell, and I've known him since he was a pup."); await voice("orpheus", "v2_o5", "Everybody cares for something. You just have to find out what."); }});
      st.side = "far";
      G.toast("Hold F, or the lyre button, to play. While you play, the dog calms down. Your fingers tire, so rest when he's far away.", 6500);
      G.paintGoal(); return;
    } else if (id === "sisyphus") {
      await say("sisyphus", "v2_os1", "Don't stop. Please, whatever you do, don't stop playing. This is the first time I've sat down in four hundred years.");
      await say("orpheus", "v2_o7", "What happens when I stop?");
      await say("sisyphus", "v2_os2", "The rock remembers it's a rock, and I remember I'm me, and we both go back up that hill together. Play a little longer, would you?");
      const k = await G.choose([{t: "Play him one more"}, {t: "Ask how he got here"}, {t: "Leave him to it"}]);
      me.choices.sisyphus = [{Demeter: 2, Apollo: 1}, {Hermes: 1, Athena: 2}, {Ares: 1, Zeus: 1}][k];
      if (k === 0) { [4, 5, 7, 8, 7, 5, 4].forEach((n, i) => pluck(n, .8, i * .32)); await say("sisyphus", "v2_os3", "Oh, that's lovely. That's the kindest thing anybody has done for me since I tricked my way out of here the first time."); }
      if (k === 1) await say("sisyphus", "v2_os4", "I cheated death. Twice. The first time, I chained up Death himself, and for a whole week nobody in the world could die. Ares was furious, his wars kept not working. The second time, I talked my way out of this place and simply didn't come back. They took that personally.");
      if (k === 2) await say("sisyphus", "v2_os5", "Fair enough. Everyone's busy. Mind the asphodel on your way, it bruises.");
    } else if (id === "hades") {
      G.save.meet("persephone");
      await say("hades", "v2_oha1", "A living man, in my house, holding an instrument. I can't remember the last time that happened, and I would very much like to go on not remembering. Explain yourself, and be quick about it.");
      await say("orpheus", "v2_o8", "My wife came here too early. I'm not asking you to change your law, my lord. I'm asking you to lend her back to me for the years she didn't get.");
      await say("persephone", "v2_op1", "Let him sing it, Hades. He didn't come all this way to make a speech.");
      const k = await G.choose([{t: "Sing of the day you met"}, {t: "Ask for a loan, not a gift"}, {t: "Sing to Persephone"}]);
      me.choices.plea = [{Aphrodite: 2, Dionysus: 1}, {Athena: 2, Hermes: 1}, {Hera: 2, Demeter: 1}][k];
      await say("orpheus", ["v2_o9a", "v2_o9b", "v2_o9c"][k], ["This one's about a girl who laughed at my lyre the first time she heard it, and then made me play it for her until the sun came up.", "Everyone comes here in the end, my lord, and in the end you'll have her back. I'm only asking for a loan, not a gift.", "They say love brought you down here too, my queen. If that story is true, then you already know what I'm asking for."][k]);
      let r;
      for (;;) {
        r = await perform(SONGS.plea, {title: "A song for the King and Queen of the dead", sub: "Space, or tap, on every note. This one matters", need: .62});
        if (r.passed) break;
        await say("hades", "v2_oha4", "No. It was pretty, and the answer is no.");
        await say("persephone", "v2_op3", "Play it again. Play it as if he isn't listening.");
      }
      await say("persephone", "v2_op2", "Hades. Look at me.");
      await say("hades", "v2_oha2", "Fine. She'll follow you up. You walk in front, and you do not look back at her. Not once, not for any reason, not until you are both standing in the light. If you do, she comes straight back down to me.");
      await say("orpheus", "v2_o10", "That's all?");
      await say("hades", "v2_oha3", "You'd be amazed how many people find that too much.");
      // face the door; she appears behind you
      me.pos.copy(FAR.throneFront).add(V(0, 0, -1.5)); me.yaw = 0; me.pitch = -.03;
      G.camShot.active = false;
      startWalk();
      await voice("eurydice", "v2_oe1", "Orpheus? Is that you? I heard you all the way from the meadow.");
      await voice("orpheus", "v2_o11", "Don't say anything else. Just follow my voice and keep walking. Please.");
      G.endTalk(); G.paintGoal();
      G.toast("She's behind you. If she comes into view, even for a moment, she's gone.", 5200);
      return;
    }
    if (NPC[id] || id === "hades") st.met[id] = true;
    G.endTalk();
  }

  /* ---------- the walk out ---------- */
  function startWalk() {
    st.stage = 4; st.trail = [];
    const e = NPC.eurydice; e.root.visible = true; e.root.position.set(FAR.throneFront.x, 0, FAR.throneFront.z + 1.8); e.play("Idle_Loop");
    for (let k = 0; k < 20; k++) st.trail.push(V(e.root.position.x, 0, e.root.position.z - k * .3 * 0)); // seed the trail where she stands
    st.trail.push(flat(me.pos));
    G.save.meet("eurydice");
    st.walkStart = performance.now(); st.grace = performance.now() + 1500;
  }
  function trailPoint(back) { // the point `back` metres behind you along the way you walked
    let need = back, prev = flat(me.pos);
    for (let i = st.trail.length - 1; i >= 0; i--) {
      const p = st.trail[i], d = prev.distanceTo(p);
      if (d >= need) return prev.clone().lerp(p, need / d);
      need -= d; prev = p;
    }
    return st.trail[0].clone();
  }
  async function backAcross() {
    await say("charon", "v2_oc7", "Back again, singer. Get in, both of you. Eyes front the whole way over.");
    G.endTalk();
    await G.crossRiver(false, {eury: NPC.eurydice, during: async () => { await new Promise(r => setTimeout(r, 3500)); await voice("charon", "v2_oc6", "She's right behind you. Don't."); }});
    st.side = "near"; st.trail = [V(0, 0, 37), V(0, 0, 36), flat(me.pos)];
    G.paintGoal();
  }
  async function lookedBack() {
    if (st.over) return; st.over = true;
    G.setPlaying(false); G.releaseMouse();
    const e = NPC.eurydice; e.play("Idle_Loop");
    await voice("eurydice", "v2_oe5", "Goodbye, my love.");
    fade(e, 1600);
    await voice("orpheus", "v2_o12", "Eurydice!");
    G.finish("You looked back. In every version of the story, he does.", {retry: retryWalk});
  }
  function fade(p, ms) {
    const t0 = performance.now(), mats = []; p.root.traverse(o => { if (o.isMesh) mats.push(...[].concat(o.material)); });
    const base = mats.map(m => m.opacity);
    (function f() { const k = Math.min(1, (performance.now() - t0) / ms); mats.forEach((m, i) => m.opacity = base[i] * (1 - k)); p.root.position.y += .004; if (k < 1) requestAnimationFrame(f); else p.root.visible = false; })();
    G.sound.chime();
  }
  function retryWalk() { // Hades lets you try the walk again, which is more than Orpheus got
    st.over = false; st.fired = {};
    const e = NPC.eurydice; e.root.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => m.opacity = .62); }); e.root.position.y = 0;
    G.setLightsFar(true); st.side = "far";
    G.boatTo(false);
    me.pos.copy(FAR.throneFront).add(V(0, 0, -1.5)); me.yaw = 0; me.pitch = -.03;
    startWalk();
    G.setPlaying(true); G.grabMouse(); G.paintGoal();
  }
  async function theLight() {
    st.over = true; G.setPlaying(false); G.releaseMouse(); $("#prompt").classList.remove("on");
    G.beginTalk(null, "none");
    st.stepsOff = true;
    await voice("eurydice", "v2_oe4", "Orpheus... I can't hear your footsteps anymore. Are you even there?");
    const k = await G.choose([{t: "Look back"}, {t: "Keep walking"}]);
    if (k === 0) {
      G.endTalk(); me.yaw += Math.PI; // turn round
      await new Promise(r => setTimeout(r, 900));
      await voice("eurydice", "v2_oe5", "Goodbye, my love.");
      fade(NPC.eurydice, 1600);
      await voice("orpheus", "v2_o12", "Eurydice!");
      me.choices.end = {Poseidon: 2, Aphrodite: 1};
      return G.finish("You looked back, right at the end. In every version of the story, he does.");
    }
    G.endTalk(); st.stepsOff = false;
    st.autoWalk = true;
    await voice("eurydice", "v2_oe6", "It's so bright. I'd forgotten it could ever be this bright.");
    await voice("orpheus", "v2_o13", "Keep walking. I've got you. I've got you.");
    me.choices.end = {Hera: 2, Athena: 1};
    document.body.classList.add("daylight");
    await new Promise(r => setTimeout(r, 2600));
    G.finish("You didn't look back. In every other version of the story, he does.");
  }

  /* ---------- what's nearby ---------- */
  function nearby() {
    const near = (p, r) => flat(p).distanceTo(flat(me.pos)) < r;
    if (st.stage >= 4) {
      if (st.side === "far" && near(V(0, 0, 51), 3.4)) return {kind: "talk", id: "charon", label: "talk to Charon"};
      return null;
    }
    if (!NPC.hermes.leaving && NPC.hermes.root.visible && near(NPC.hermes.pos, 3.2)) return {kind: "talk", id: "hermes", label: "talk to Hermes"};
    if (near(NPC.mikon.pos, 3)) return {kind: "talk", id: "mikon", label: "talk to Mikon"};
    if (st.side === "near" && near(NPC.charon.pos, 4.2)) return {kind: "talk", id: "charon", label: "talk to Charon"};
    if (st.side === "far" && near(V(0, 0, 51), 3)) return {kind: "talk", id: "charon", label: "talk to Charon"};
    if (st.side === "far" && near(NPC.sisyphus.pos, 4.5)) return {kind: "talk", id: "sisyphus", label: "talk to Sisyphus"};
    if (st.side === "far" && near(FAR.throneFront, 4.6)) return {kind: "talk", id: "hades", label: "speak to Hades and Persephone"};
    return null;
  }

  /* ---------- every frame ---------- */
  function update(dt, now) {
    // the lyre: hold F (or the lyre button) to play
    const want = (G.keys.KeyF || G.touchLyre()) && !st.tired;
    st.lyre = want && st.stage >= 1 && st.stage < 4;
    if (st.lyre) { st.breath -= dt / 8.5; if (st.breath <= 0) { st.breath = 0; st.tired = true; G.toast("Your fingers need a rest.", 1600); } }
    else { st.breath = Math.min(1, st.breath + dt / 5); if (st.tired && st.breath > .4) st.tired = false; }
    song.tick(now, st.lyre);
    lyre.g.visible = st.lyre;
    lyre.g.position.set(Math.min(.3, .16 * camera.aspect), -.36 + (st.lyre ? .07 : 0), -.62);
    if (st.carried) st.carried.visible = !st.lyre;
    lyre.strings.forEach((s, i) => s.position.z = .018 + (st.lyre ? Math.sin(now / 18 + i * 2) * .0015 : 0));
    G.speedScale(st.lyre ? .55 : 1);
    const meter = $("#lyremeter");
    meter.classList.toggle("on", st.side === "far" && st.stage >= 2 && st.stage < 4 && !dog.asleep);
    meter.querySelector(".breath i").style.width = (st.breath * 100) + "%";
    meter.querySelector(".calm i").style.width = ((dog.calm || 0) * 100) + "%";
    meter.classList.toggle("tired", st.tired);

    // Cerberus at the gate
    if (st.side === "far" && !dog.asleep) guardDog(dt, now);
    // asleep, he pads aside and lies down by the gate post, so the way through is clear (you used to walk through him)
    if (st.side === "far" && dog.asleep) { const rest = V(FAR.gateMouth.x - 5.4, 0, FAR.gateMouth.z - 1.2), to = flat(rest).sub(flat(dog.pos)), d = to.length();
      if (d > .15) { dog.mode = "guard"; dog.speed = 1.3; dog.yaw = Math.atan2(to.x, to.z); dog.pos.addScaledVector(to.normalize(), Math.min(d, dt * 1.3)); }
      else if (dog.mode !== "sleep") { dog.mode = "sleep"; dog.speed = 0; dog.yaw = Math.PI * .5; } }

    // Sisyphus stops to listen
    const sis = NPC.sisyphus, listening = st.lyre && flat(sis.pos).distanceTo(flat(me.pos)) < 18;
    if (listening !== st.sis) { st.sis = listening; sis.idle = listening ? "Crouch_Idle_Loop" : "Push_Loop"; sis.play(sis.idle); }
    if (!listening) G.farWorld.boulder.rotation.x += dt * .4;

    // leading Eurydice out
    if (st.stage >= 4 && !st.over) walkOut(dt, now);
    if (st.stage >= 2 && me.pos.z > FAR.hallZ - 2 && !st.fired.hall) { st.fired.hall = true; G.save.meet("hades"); }
  }
  function guardDog(dt, now) {
    const d = flat(dog.pos).distanceTo(flat(me.pos));
    if (st.lyre && d < 24) dog.calm = Math.min(1, dog.calm + dt * (d < 12 ? .3 : .16));
    else dog.calm = Math.max(0, dog.calm - dt * .1);
    if (dog.calm >= 1 && me.pos.z > FAR.gateZ + .5) {
      dog.asleep = true; dog.mode = "sleep"; dog.speed = 0; $("#lyremeter").classList.remove("on"); G.paint.uniforms.danger.value = 0; $("#danger").classList.remove("on");
      G.save.meet("cerberus");
      voice("orpheus", "v2_o6", "There. Three heads, one lullaby. Sleep, dog."); G.paintGoal(); return;
    }
    let target = FAR.gateMouth.clone().add(V(Math.sin(now / 1600) * 3, 0, 0)), speed = 1.4;
    dog.mode = dog.calm > .75 ? "sleepish" : "guard";
    const onLanding = Math.abs(me.pos.x) < 1.6 && me.pos.z < FAR.shore + .4;
    if (dog.calm < .3 && d < 12 && !onLanding) { target = flat(me.pos); speed = 5.6; dog.mode = "hunt"; }
    if (dog.calm > .75) speed = 0;
    const dir = flat(target).sub(flat(dog.pos)), dd = dir.length();
    dog.speed = 0;
    if (dd > .3 && speed > 0) {
      dir.normalize(); const step = Math.min(dd, speed * dt);
      dog.pos.x += dir.x * step; dog.pos.z = Math.max(FAR.shore + 1, Math.min(FAR.gateZ - 1.6, dog.pos.z + dir.z * step)); dog.speed = speed;
      const wantY = Math.atan2(dir.x, dir.z); let dy = wantY - dog.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); dog.yaw += dy * Math.min(1, dt * 5);
    } else if (dog.mode !== "hunt") { const wantY = Math.atan2(me.pos.x - dog.pos.x, me.pos.z - dog.pos.z); let dy = wantY - dog.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); dog.yaw += dy * Math.min(1, dt * 2); }
    const danger = dog.mode === "hunt" ? Math.max(0, 1 - d / 14) : Math.max(0, .5 - dog.calm) * (d < 16 ? .6 : 0);
    $("#danger").classList.toggle("on", danger > .2);
    G.paint.uniforms.danger.value += (danger - G.paint.uniforms.danger.value) * .1;
    if (dog.mode === "hunt" && now > (dog.growl || 0)) { G.sound.growl(.7); dog.growl = now + 500; }
    if (dog.mode === "hunt" && d < 1.9) G.caughtBy(() => { me.pos.copy(FAR.landing); me.yaw = Math.PI; dog.pos.copy(FAR.gateMouth); dog.calm = 0; });
  }
  function walkOut(dt, now) {
    const e = NPC.eurydice, last = st.trail[st.trail.length - 1];
    if (!st.ride && flat(me.pos).distanceTo(last) > .3) st.trail.push(flat(me.pos));
    if (st.trail.length > 4000) st.trail.splice(0, 1000);
    if (!st.ride) {
      const target = trailPoint(4.6), to = target.clone().sub(flat(e.root.position)), d = to.length();
      if (d > .08) {
        const step = Math.min(d, (d > 2 ? 5.5 : 4.2) * dt); to.normalize();
        e.root.position.x += to.x * step; e.root.position.z += to.z * step;
        e.root.rotation.y = Math.atan2(to.x, to.z);
        e.play("Walk_Loop");
        if (!st.stepsOff && now > (st.stepT || 0)) { G.sound.step(false, .35); st.stepT = now + 520; }
      } else e.play("Idle_Loop");
    }
    // did you look back?
    if (G.camShot.active || G.isTalking() || now < st.grace) return;
    const head = e.root.position.clone().add(V(0, 1.45, 0)), v = head.clone().project(camera);
    const ahead = camera.getWorldDirection(V(0, 0, 0)).dot(head.clone().sub(camera.position)) > 0;
    const inView = ahead && Math.abs(v.x) < .74 && Math.abs(v.y) < .95 && camera.position.distanceTo(head) < 45;
    const edge = ahead && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.1;
    $("#danger").classList.toggle("on", edge && !inView);
    if (inView) { st.lookT += dt; if (st.lookT > .1) lookedBack(); } else st.lookT = 0;
    // things that happen on the way
    if (!st.fired.slow && me.pos.z < FAR.hallZ - 4 && st.side === "far") { st.fired.slow = true; voice("eurydice", "v2_oe3", "You're walking so fast. My foot still hurts, where it bit me."); }
    if (!st.fired.stop && me.pos.z < FAR.gateZ - 2 && st.side === "far") { st.fired.stop = true; st.stepsOff = true; setTimeout(() => { voice("eurydice", "v2_oe2", "Orpheus? Are you still there? I can't hear you anymore.").then(() => setTimeout(() => st.stepsOff = false, 1500)); }, 1200); }
    if (!st.fired.mikon && st.side === "near" && flat(NPC.mikon.pos).distanceTo(flat(me.pos)) < 8) { st.fired.mikon = true; voice("mikon", "v2_om2", "Mate. Mate. Don't turn around. Just keep walking. I'll tell you if anything weird happens. Everything's weird. Keep walking."); }
    if (!st.fired.light && st.side === "near" && me.pos.x < -34 && me.pos.z > 9 && me.pos.z < 17) { st.fired.light = true; theLight(); }
  }
  function always(dt, now) {
    for (const s of st.shades || []) s.mixer.update(dt);
    if (st.autoWalk) { me.pos.x -= dt * 1.4; me.yaw += (Math.PI / 2 - me.yaw) * .05; }
    if (st.stage >= 4 && st.ride) { const e = NPC.eurydice; e.play("Idle_Loop"); }
  }

  /* ---------- the map ---------- */
  function drawMap(cv) {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height;
    // the journey runs left to right: near bank, river, gate, meadow, hall. Map x = world z, map y = world x.
    const s = Math.min(W / 160, H / 100), X = z => 20 + (z + 8) * s, Y = x => H / 2 - (x - 12) * s * .9;
    g.fillStyle = "#e6d8b8"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,70,45,${Math.random() * .05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    const ink = "#3a2a1c", label = (t, x, y, size = 22, it = false, color = ink, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = color; g.font = `${it ? "italic " : ""}${size}px "IM Fell English", Georgia, serif`; g.textAlign = "center"; g.fillText(t, 0, 0); g.restore(); };
    g.fillStyle = "rgba(30,150,185,.5)"; g.fillRect(X(22), 0, X(64) - X(22), H);
    label("THE STYX", X(43), H / 2 + 8, 26, false, "#2c4450", -Math.PI / 2);
    g.fillStyle = "rgba(120,95,60,.2)"; g.fillRect(X(0), Y(38), X(8.5) - X(0), Y(-38) - Y(38));
    label("the arcade", X(4), Y(-20), 18, true, ink, -Math.PI / 2);
    g.fillStyle = "#6b4e2e"; g.fillRect(X(22), Y(1.5), X(36) - X(22), Y(-1.5) - Y(1.5)); g.fillRect(X(50), Y(1.5), X(64) - X(50), Y(-1.5) - Y(1.5));
    label("Charon", X(43), Y(0) - 12, 18, true);
    g.fillStyle = "#4a3a2c"; g.fillRect(X(79), Y(46), X(81) - X(79), Y(3.2) - Y(46)); g.fillRect(X(79), Y(-3.2), X(81) - X(79), Y(-46) - Y(-3.2));
    label("the gate", X(80), Y(-8), 18, true, ink, -Math.PI / 2);
    g.fillStyle = "rgba(40,25,20,.6)"; g.beginPath(); g.arc(X(FAR.dogHome.z), Y(FAR.dogHome.x), 12, 0, 7); g.fill();
    label(dog.asleep ? "Cerberus, asleep" : "Cerberus", X(FAR.dogHome.z), Y(FAR.dogHome.x) - 16, 17, true, "#7a2414");
    g.strokeStyle = "#8a7a60"; g.setLineDash([6, 6]); g.lineWidth = 3; g.beginPath(); FAR.path.forEach(([x, z], i) => i ? g.lineTo(X(z), Y(x)) : g.moveTo(X(z), Y(x))); g.stroke(); g.setLineDash([]);
    label("Asphodel Meadow", X(99), Y(22), 20, true, "#55604a");
    label("Sisyphus", X(FAR.sisyphus.z), Y(FAR.sisyphus.x) + 22, 17, true);
    g.strokeStyle = ink; g.lineWidth = 2.5; g.strokeRect(X(118), Y(14), X(141) - X(118), Y(-14) - Y(14));
    label("THE HOUSE", X(129.5), Y(0) - 6, 19); label("OF HADES", X(129.5), Y(0) + 16, 19);
    label("white cypress", X(124), Y(-24) + 24, 15, true); label("Lake of Memory", X(126), Y(25) - 14, 15, true);
    label("the way up", X(13), Y(-43) + 4, 17, true, "#a2432c");
    const mx = X(me.pos.z), my = Y(me.pos.x);
    g.fillStyle = "#a2432c"; g.beginPath(); g.arc(mx, my, 9, 0, 7); g.fill();
    g.strokeStyle = "#a2432c"; g.lineWidth = 4; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx - Math.cos(me.yaw) * 24, my + Math.sin(me.yaw) * 24); g.stroke();
    label("you", mx, my + 28, 19, true, "#a2432c");
    g.strokeStyle = ink; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  }

  return {
    id: 2, player: "Orpheus", rule: "Don't look back.", setup, conversation, nearby, update, always, drawMap,
    goal: () => GOALS[stageNow()], stage: stageNow, st,
    interact(n) { if (n.kind === "talk") conversation(n.id); },
    onBody(p) { // the same lyre, hanging from your left hand when you're not playing it
      const c = lyre.g.clone(); c.visible = true; c.scale.setScalar(1.05);
      G.hold(p, "l", c, V(0, .31, 0)); st.carried = c; // held by the crossbar, the body of the lyre hanging below the hand
    },
    onRide(on) { st.ride = on; },
    howto: `
      <div><b>1 · Sing for the ferryman</b>Charon doesn't take the living. When you play for someone, press Space, or tap, as each note reaches the ring.</div>
      <div><b>2 · Get past the dog</b>Hold F, or the lyre button, to keep playing as you walk. While you play, Cerberus calms down, but your fingers tire. Rest when he's far away.</div>
      <div><b>3 · Ask the King and Queen</b>Follow the path through the meadow to the House of Hades.</div>
      <div><b>4 · Don't look back</b>She follows you all the way up. If she comes into view, even for a moment, she's gone.</div>
      <div><b>Look around</b>Things glow where something's been left behind. Press E to pick them up, and C for the Codex.</div>`,
    keys: "<b>WASD</b><span>walk</span><b>Mouse</b><span>look</span><b>F</b><span>hold to play the lyre</span><b>Space</b><span>play a note, in a song</span><b>E</b><span>talk, pick up</span><b>C</b><span>Codex</span>"
  };
}
