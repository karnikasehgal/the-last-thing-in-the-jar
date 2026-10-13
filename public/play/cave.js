// Sandstone caves: layered rock worn smooth into ridges and honeycomb hollows, like a sea cave lit by the
// morning sun. The layers are coloured by height, so they run level the way real sandstone beds do.
import * as THREE from "three";
import { pbr } from "./pbr.js";

// small, cheap value noise
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
           L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
}
const fbm = (x, y, z) => noise3(x, y, z) * .5 + noise3(x * 2.1, y * 2.1, z * 2.1) * .3 + noise3(x * 4.3, y * 4.3, z * 4.3) * .2;

const SAND = [0xf2a35c, 0xd8662a, 0xb84a1c, 0xe8843e, 0xc95824, 0xf6b878, 0x9e3c18];
const speckle = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#d8d0c8"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 170 + Math.random() * 85 | 0; g.fillStyle = `rgba(${v},${v - 10},${v - 20},.5)`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

// A tunnel of sandstone along the x axis, from x0 to x1 (x1 < x0), centred on z, with a flat floor at y = 0.
export function sandstoneTunnel(scene, {x0, x1, z, r = 4.2, palette = SAND, dark = 1}) {
  const len = Math.abs(x1 - x0), geo = new THREE.CylinderGeometry(r, r, len, 72, Math.ceil(len * 3), true);
  geo.rotateZ(Math.PI / 2);
  const pos = geo.attributes.position, col = [], c = new THREE.Color(), cy = r * .62;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
    const wx = (x0 + x1) / 2 + lx, a = Math.atan2(ly, lz);
    let k = 1 + (fbm(wx * .18, ly * .18, lz * .18) - .5) * .55;                     // big lumps
    k += Math.sin((ly + cy) * 7 + fbm(wx * .5, ly * .2, lz * .5) * 6) * .025;           // level ridges along the beds
    const hc = noise3(wx * 1.6, ly * 1.6, lz * 1.6); if (hc > .62) k -= (hc - .62) * .35;  // honeycomb hollows (tafoni)
    const flare = Math.max(0, 1 - Math.abs(wx - x1) / 4) * .55;                         // the mouth opens out toward the light
    let y = ly * k * (1 + flare), zz = lz * k * (1 + flare * .8);
    const wy = y + cy;
    if (wy < .06) y = -cy + .06 + fbm(wx, lz, 3) * .08;                                   // a floor you can walk on
    pos.setXYZ(i, lx, y, zz);
    // colour from height: the sandstone beds, wavy, with darker stain toward the floor
    const t = (y + cy) * 1.7 + fbm(wx * .3, y * .5, zz * .3) * 3.2;
    const band = palette[Math.abs(Math.floor(t)) % palette.length], next = palette[Math.abs(Math.floor(t) + 1) % palette.length];
    c.setHex(band).lerp(new THREE.Color(next), t - Math.floor(t));
    const shade = (.72 + fbm(wx * .9, y * .9, zz * .9) * .5) * dark * (wy < .4 ? .55 : 1);
    col.push(c.r * shade, c.g * shade, c.b * shade);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, pbr("rock_wall_10", {size: 3.5, vc: true, rough: .95, bump: 1.2, side: THREE.DoubleSide}) /* real rock under the sandstone's bands */);
  mesh.position.set((x0 + x1) / 2, cy, z);
  scene.add(mesh);
  return mesh;
}

// What you see at the mouth of the way up: the sea at sunrise.
export function sunrise() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, "#2a3e6a"); sky.addColorStop(.45, "#c27a8a"); sky.addColorStop(.8, "#f6a463"); sky.addColorStop(1, "#ffe0a0");
  g.fillStyle = sky; g.fillRect(0, 0, 512, 300);
  const sun = g.createRadialGradient(256, 300, 0, 256, 300, 160); sun.addColorStop(0, "rgba(255,250,220,1)"); sun.addColorStop(.15, "rgba(255,230,160,.9)"); sun.addColorStop(1, "rgba(255,180,90,0)");
  g.fillStyle = sun; g.fillRect(0, 140, 512, 220);
  const sea = g.createLinearGradient(0, 300, 0, 512); sea.addColorStop(0, "#d58a58"); sea.addColorStop(.15, "#3e5a6e"); sea.addColorStop(1, "#16303e");
  g.fillStyle = sea; g.fillRect(0, 300, 512, 212);
  for (let i = 0; i < 260; i++) { const y = 302 + Math.pow(Math.random(), 2) * 200, w = 6 + Math.random() * 40 * (1 - (y - 300) / 260); g.fillStyle = `rgba(255,${200 + Math.random() * 40 | 0},150,${.5 * (1 - (y - 300) / 212)})`; g.fillRect(256 - w / 2 + (Math.random() - .5) * (y - 290) * 1.4, y, w, 1.5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
