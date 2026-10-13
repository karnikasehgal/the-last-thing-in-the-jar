// The animated-film cast: Blender Studio characters (CC-BY), exported by tools/blender/export_rig.py.
// They are made to look like the Rocketbox people to the rest of the game: their main bones take the Rocketbox
// names, the Rocketbox motion is retargeted onto them once (and kept), and their hair swings on springs.
import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

// their skeleton (CloudRig) -> Rocketbox (3ds Max Biped)
const NAMES = {"DEF-Pelvis": "Bip01_Pelvis", "DEF-Spine1": "Bip01_Spine", "DEF-Spine2": "Bip01_Spine1", "DEF-Spine3": "Bip01_Spine2", "DEF-Neck": "Bip01_Neck", "DEF-Head": "Bip01_Head"};
for (const s of "LR") Object.assign(NAMES, {[`DEF-Clavicle.${s}`]: `Bip01_${s}_Clavicle`, [`DEF-Upperarm1.${s}`]: `Bip01_${s}_UpperArm`, [`DEF-Forearm1.${s}`]: `Bip01_${s}_Forearm`,
  [`DEF-Hand.${s}`]: `Bip01_${s}_Hand`, [`DEF-Thigh1.${s}`]: `Bip01_${s}_Thigh`, [`DEF-Shin1.${s}`]: `Bip01_${s}_Calf`, [`DEF-Foot.${s}`]: `Bip01_${s}_Foot`, [`DEF-Toe.${s}`]: `Bip01_${s}_Toe0`});
const HEADY = /head|eye|brow|lash|gum|teeth|tongue|hair/i; // drawn with the head (hidden from your own eyes in first person)

// Once per character file: rename the bones, sort the materials into skin and head.
export function prepareToon(g) {
  const sane = n => THREE.PropertyBinding.sanitizeNodeName(n);
  const to = Object.fromEntries(Object.entries(NAMES).map(([a, b]) => [sane(a), b]));
  g.scene.traverse(o => {
    if (o.isBone && to[o.name]) o.name = to[o.name];
    if (!o.isMesh) return;
    o.castShadow = true;
    for (const a of ["color", "color_1", "uv1"]) o.geometry.deleteAttribute(a); // (shader masks from Blender, not colours)
    const head = HEADY.test(o.name);
    if (head) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); // (the head may share the body's skin)
    for (const m of [].concat(o.material)) {
      m.vertexColors = false;
      if (head) m.name = m.name.replace("skin_body", "skin_head");
      if (/hair|brow|lash/i.test(m.name)) m.userData.hair = true;
      if (/skin_/.test(m.name)) m.userData.skin = true;
    }
    if (head) o.userData.head = true;
  });
  // a skin can list helper bones that aren't in the skeleton's tree (a face cage's root); hang them on the head
  const inTree = new Set(); g.scene.traverse(o => inTree.add(o));
  const headBone = g.scene.getObjectByName("Bip01_Head");
  g.scene.traverse(o => { if (o.isSkinnedMesh) for (const b of o.skeleton.bones) if (!inTree.has(b)) { headBone.attach(b); inTree.add(b); } });
  g.scene.userData.toon = true;
  return g;
}

/* ---------- motion ---------- */
// Each pair: the Rocketbox bone and ours (same name now), and the next bone down the limb on each, so each bone's
// rest direction can be turned onto the other's. A hand also takes a side direction (knuckles), or the wrist rolls.
const CHAIN = [["Bip01_Pelvis", "Bip01_Spine"], ["Bip01_Spine", "Bip01_Spine1"], ["Bip01_Spine1", "Bip01_Spine2"], ["Bip01_Spine2", "Bip01_Neck"], ["Bip01_Neck", "Bip01_Head"], ["Bip01_Head"]];
for (const s of "LR") CHAIN.push([`Bip01_${s}_Clavicle`, `Bip01_${s}_UpperArm`], [`Bip01_${s}_UpperArm`, `Bip01_${s}_Forearm`], [`Bip01_${s}_Forearm`, `Bip01_${s}_Hand`],
  [`Bip01_${s}_Hand`, [`Bip01_${s}_Finger2`, `DEF-Middle2.${s}`], [`Bip01_${s}_Finger1`, `Bip01_${s}_Finger4`, `DEF-Index2.${s}`, `DEF-Pinky2.${s}`]],
  [`Bip01_${s}_Thigh`, `Bip01_${s}_Calf`], [`Bip01_${s}_Calf`, `Bip01_${s}_Foot`], [`Bip01_${s}_Foot`, `Bip01_${s}_Toe0`]);
const frame = (f, s) => { f = f.clone().normalize(); const u = new THREE.Vector3().crossVectors(f, s).normalize(), v = new THREE.Vector3().crossVectors(u, f);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, v, u)); };
const BAKED = new WeakMap();
// Play every clip on an invisible Rocketbox skeleton and record, frame by frame, how our bones must turn to match.
export function toonClips(asset, rbAnims, clips) {
  const key = rbAnims.scene; let cache = BAKED.get(asset); if (!cache) BAKED.set(asset, cache = new Map());
  if (cache.has(key)) return cache.get(key);
  const src = SkeletonUtils.clone(rbAnims.scene), dst = SkeletonUtils.clone(asset.scene);
  src.updateMatrixWorld(true); dst.updateMatrixWorld(true);
  const by = (r, n) => r.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n));
  const wq = o => o.getWorldQuaternion(new THREE.Quaternion()), wp = o => o.getWorldPosition(new THREE.Vector3());
  const pairs = CHAIN.map(([n, next, side]) => {
    const S = by(src, n), D = by(dst, n); if (!S || !D) return null;
    let C = new THREE.Quaternion();
    if (next) {
      const [ns, nd] = Array.isArray(next) ? next : [next, next], A = by(src, ns), B = by(dst, nd);
      if (A && B) {
        const dS = wp(A).sub(wp(S)).normalize(), dD = wp(B).sub(wp(D)).normalize();
        if (side) { const [a, b, c, e] = side.map((m, i) => by(i < 2 ? src : dst, m)); C = frame(dS, wp(a).sub(wp(b))).multiply(frame(dD, wp(c).sub(wp(e))).invert()); }
        else C.setFromUnitVectors(dD, dS);
      }
    }
    return {S, D, S0: wq(S), D0: wq(D), C, rest: D.quaternion.clone()};
  }).filter(Boolean);
  const hipS = by(src, "Bip01_Pelvis"), hipD = by(dst, "Bip01_Pelvis");
  const leg = (r, a, b) => wp(by(r, a)).distanceTo(wp(by(r, b)));
  const k = leg(dst, "Bip01_L_Thigh", "Bip01_L_Foot") / leg(src, "Bip01_L_Thigh", "Bip01_L_Foot"), hipS0 = wp(hipS), hipD0 = wp(hipD), hipRest = hipD.position.clone();
  const mixer = new THREE.AnimationMixer(src), out = {}, want = new THREE.Quaternion(), pw = new THREE.Quaternion();
  for (const [name, clip] of Object.entries(clips)) {
    const FPS = 30, n = Math.max(2, Math.round(clip.duration * FPS) + 1), times = new Float32Array(n);
    const Q = pairs.map(() => new Float32Array(n * 4)), H = new Float32Array(n * 3);
    mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset().play();
    for (let f = 0; f < n; f++) {
      const t = Math.min(clip.duration, f / FPS); times[f] = t;
      mixer.setTime(t); src.updateMatrixWorld(true);
      pairs.forEach((p, i) => {
        want.copy(wq(p.S)).multiply(p.S0.clone().invert()).multiply(p.C).multiply(p.D0);
        p.D.parent.getWorldQuaternion(pw); p.D.quaternion.copy(pw.invert().multiply(want)); p.D.updateMatrixWorld(true);
        p.D.quaternion.toArray(Q[i], f * 4);
      });
      // the hips carry the bob and sway, scaled to our legs (Rocketbox moves its root; we move the pelvis)
      const d = wp(hipS).sub(hipS0).multiplyScalar(k), target = hipD0.clone().add(d);
      hipD.parent.worldToLocal(target); target.toArray(H, f * 3); hipD.position.copy(target); hipD.updateMatrixWorld(true);
    }
    a.stop(); mixer.uncacheAction(clip);
    const tracks = pairs.map((p, i) => new THREE.QuaternionKeyframeTrack(p.D.name + ".quaternion", times, Q[i]));
    tracks.push(new THREE.VectorKeyframeTrack(hipD.name + ".position", times, H));
    out[name] = new THREE.AnimationClip(name, clip.duration, tracks);
    pairs.forEach(p => p.D.quaternion.copy(p.rest)); hipD.position.copy(hipRest);
  }
  cache.set(key, out);
  return out;
}

/* ---------- secondary motion: hair that hangs, lags and swings ----------
   Each hair bone's tip is a little weight on a spring: pulled toward where the animation puts it, pulled down by
   gravity, slowed by drag. The bone is then turned to point at the weight. */
const Y = new THREE.Vector3(0, 1, 0), GRAV = new THREE.Vector3(0, -9.8, 0);
export function hairSprings(root) {
  const springs = [];
  const chains = {}; root.traverse(o => { const m = o.isBone && o.name.match(/^DEF-Hair_([A-Za-z]+)(\d+)$/); if (m) (chains[m[1]] ||= [])[+m[2] - 1] = o; });
  for (const bones of Object.values(chains)) bones.filter(Boolean).forEach((b, i, all) => {
    const next = all[i + 1], L = next ? next.position.length() : (all[i - 1] ? b.position.length() : .08);
    springs.push({b, L, stiff: Math.max(20, 70 - i * 12), p: null, v: new THREE.Vector3(), rest: b.quaternion.clone()});
  });
  const head = new THREE.Vector3(), q = new THREE.Quaternion(), dir = new THREE.Vector3(), aim = new THREE.Vector3(), pw = new THREE.Quaternion(), target = new THREE.Vector3(), want = new THREE.Quaternion();
  return dt => {
    if (!springs.length || !root.visible) return;
    dt = Math.min(dt, 1 / 20);
    for (const s of springs) {
      const b = s.b; b.quaternion.copy(s.rest); b.parent.updateMatrixWorld(true); b.updateMatrixWorld(true);
      b.getWorldPosition(head); b.getWorldQuaternion(q); dir.copy(Y).applyQuaternion(q);
      const L = s.L * root.scale.y; target.copy(head).addScaledVector(dir, L);
      if (!s.p || s.p.distanceToSquared(head) > 4) { s.p = target.clone(); s.v.set(0, 0, 0); } // (first frame, or teleported)
      s.v.addScaledVector(target.sub(s.p), s.stiff * dt).addScaledVector(GRAV, dt).multiplyScalar(Math.exp(-6 * dt));
      s.p.addScaledVector(s.v, dt);
      aim.copy(s.p).sub(head).normalize(); s.p.copy(head).addScaledVector(aim, L); // (hair doesn't stretch)
      want.setFromUnitVectors(dir, aim).multiply(q);
      b.parent.getWorldQuaternion(pw); b.quaternion.copy(pw.invert().multiply(want)); b.updateMatrixWorld(true);
    }
  };
}

/* ---------- the face ----------
   The game speaks in the Rocketbox (ARKit) shape names; ours are sculpted expressions. Translate. */
export function toonFace(w) {
  const avg = (a, b) => ((w[a] || 0) + (w[b] || 0)) / 2;
  return {
    face_blink: avg("AK_09_EyeBlinkLeft", "AK_10_EyeBlinkRight"),
    face_smile: avg("AK_44_MouthSmileLeft", "AK_45_MouthSmileRight"),
    face_worried: Math.min(1, (w.AK_03_BrowInnerUp || 0) * .8),
    face_A: Math.min(1, (w.AA_VI_10_aa || 0) + (w.AK_25_JawOpen || 0) * 1.6),
    face_E: Math.min(1, (w.AA_VI_11_E || 0) + (w.AA_VI_12_I || 0) + (w.AA_VI_07_SS || 0) * .4),
    face_O: Math.min(1, (w.AA_VI_13_O || 0) + (w.AA_VI_14_U || 0)),
  };
}

// Everyone shares two faces, so colouring does the rest: a skin tone of their own, from porcelain to ebony (multipliers
// on the model's painted skin, which is a medium brown), and hair from black to grey.
const SKIN = {fair: [2.75, 2.42, 2.22], porcelain: [2.45, 2.12, 1.96], rosy: [2.15, 1.72, 1.56], olive: [1.75, 1.6, 1.28], golden: [1.55, 1.3, .98], tan: [1.3, 1.12, .95],
  brown: [1, .9, .82], umber: [.9, .82, .7], deep: [.72, .6, .54], dark: [.56, .46, .41], ebony: [.43, .35, .32], ash: [1.5, 1.48, 1.46]};
const LOOK = {
  orpheus: ["golden", 0x2a1a10], hermes: ["fair", 0xd9b45e], charon: ["ash", 0xb8b0a4], hades: ["porcelain", 0x0e0a08], sisyphus: ["umber", 0x7a6a58],
  mikon: ["olive", 0x3b2a1c], mikon_bank: ["olive", 0x3b2a1c], elpenor: ["tan", 0x5a3a20], theseus: ["brown", 0x3a2516], pirithous: ["deep", 0x1d140d],
  demeas: ["rosy", 0x8a8278], nikias: ["dark", 0x1a120c], lykon: ["ebony", 0x120c08], piper: ["umber", 0x2a1d14], shade: ["olive", 0x3a3028],
  persephone: ["porcelain", 0x2a160e], eurydice: ["tan", 0x3a2a1c], eurydice_alive: ["tan", 0x3a2a1c], eurydice_meadow: ["tan", 0x3a2a1c],
  aunt: ["dark", 0x9a9088], thea: ["deep", 0x6a3a1a], dancer: ["golden", 0x120c08],
};
const TONES = Object.keys(SKIN).filter(k => k !== "ash");
export function toonLook(id) {
  const [tone, hair] = LOOK[id] || [TONES[Math.random() * TONES.length | 0], [0x120c08, 0x2a1a10, 0x4a3018, 0x6a4422, 0x8a8278][Math.random() * 5 | 0]];
  return {tone: SKIN[tone], hairColor: hair};
}
export function tintToon(root, {tone, hairColor}) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.material = [].concat(o.material).map(m => {
      if (tone && m.userData.skin) { m = m.clone(); m.color.setRGB(...tone); }
      else if (hairColor && m.userData.hair) { m = m.clone(); const h = new THREE.Color(hairColor), l = h.getHSL({}).l;
        if (l > .12) { m.map = null; m.color = h; m.roughness = .55; } // (the painted hair is near black: a lighter colour replaces it outright)
        else m.color = h.multiplyScalar(1.2 / Math.max(.08, .1 + l * .3)); }
      return m;
    });
    if (o.material.length === 1) o.material = o.material[0];
  });
}
