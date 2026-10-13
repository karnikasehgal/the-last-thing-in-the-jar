// Make an exported character ready for the game: give the skin materials their tiled textures (the exporter can't
// write tiled images), mark them as skin, then the CLI shrinks and compresses it.
// Run (with @gltf-transform installed): node pack_toon.mjs in.glb out.glb <dir with BAKE-*-body.100N.png>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import fs from "fs";
const [inp, out, dir] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
for (const m of doc.getRoot().listMaterials()) {
  const t = m.getName().match(/body\.(100\d)$/); if (!t) continue;
  const f = fs.readdirSync(dir).find(n => n.endsWith(`body.${t[1]}.png`));
  const tex = doc.createTexture("skin" + t[1]).setImage(fs.readFileSync(`${dir}/${f}`)).setMimeType("image/png");
  m.setBaseColorTexture(tex).setBaseColorFactor([1, 1, 1, 1]).setName(m.getName().replace("body.", "skin_body."));
}
await io.write(out, doc);
