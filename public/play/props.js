// Real objects from Poly Haven (CC0), scanned from life: boulders and rocks, clay vases, shrubs.
// The world was blocked out with faceted placeholder rocks (dodecahedra) wherever stone was wanted: cliffs, the dog's
// cave, the far bank, the stream. rockify() finds every one and puts a scanned boulder of the same size in its place,
// darkened to the placeholder's own colour so a black cave stays black and a riverside stone stays pale.
import * as THREE from "three";

export const PROPS = ["namaqualand_boulder_02", "namaqualand_boulder_04", "rock_moss_set_01", "rock_07", "boulder_01", "coast_rocks_02",
  "antique_ceramic_vase_01", "ceramic_vase_02", "wooden_bowl_01", "wooden_lantern_01", "fern_02", "shrub_02",
  // for the wedding table and courtyard: brass goblets and candelabra, carved wooden plates, pomegranates, a clay jug, potted plants, a tree
  "brass_goblets", "carved_wooden_plate", "brass_candleholders", "food_pomegranate_01", "ceramic_vase_04", "potted_plant_02", "tree_small_02"];
const ROCKS = ["namaqualand_boulder_02", "namaqualand_boulder_04", "rock_07", "boulder_01", "rock_moss_set_01"];

// one model, centred on its middle, with its radius measured, ready to clone ("set#item" takes one piece of a set)
const prepped = {};
function prep(A, name) {
  if (prepped[name]) return prepped[name];
  const [file, part] = name.split("#"), whole = A["props_" + file]?.scene; if (!whole) return null;
  const src = part ? whole.getObjectByName(part) : whole; if (!src) return null;
  const g = src.clone(true); g.position.set(0, 0, 0); g.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  const wrap = new THREE.Group(); g.position.sub(c); wrap.add(g);
  return prepped[name] = {wrap, r: Math.max(size.x, size.y, size.z) / 2, h: size.y, base: box.min.y - c.y};
}
function cloneTinted(p, color) {
  const c = p.wrap.clone(true);
  if (color) c.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(color); } });
  return c;
}

export function rockify(scene, A) {
  const swap = [];
  scene.traverse(o => { if (o.isMesh && o.geometry?.type === "DodecahedronGeometry" && !o.userData.rocked && o.parent) swap.push(o); });
  let i = 0;
  for (const o of swap) {
    o.userData.rocked = true;
    const p = prep(A, ROCKS[i++ % ROCKS.length]); if (!p) continue;
    // the placeholder's colour (from near-black to pale) becomes a tint on the real rock, lifted so the scan's detail shows
    const base = o.material?.color ? o.material.color.clone() : new THREE.Color(.5, .5, .5);
    const tint = new THREE.Color(1, 1, 1).lerp(base.multiplyScalar(2.2), .75);
    const r = (o.geometry.parameters.radius || 1) * Math.max(o.scale.x, o.scale.y, o.scale.z);
    const rock = cloneTinted(p, tint);
    rock.position.copy(o.position); rock.quaternion.copy(o.quaternion);
    rock.scale.set(o.scale.x, o.scale.y, o.scale.z).multiplyScalar(r / p.r / Math.max(o.scale.x, o.scale.y, o.scale.z) * 1.15);
    o.parent.add(rock); o.visible = false;
  }
  return swap.length;
}

// a prop standing on the ground at (x, z), its height set in metres
export function place(A, name, parent, x, y, z, height, {yaw = Math.random() * 6.3, tint} = {}) {
  const p = prep(A, name); if (!p) return null;
  const o = cloneTinted(p, tint ? new THREE.Color(tint) : null), s = height / p.h;
  o.scale.setScalar(s); o.position.set(x, y - p.base * s, z); o.rotation.y = yaw; parent.add(o);
  return o;
}
