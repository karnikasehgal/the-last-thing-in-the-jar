// Make the MPFB export ready for the web: each texture at the size it is seen at (the skin at 2048, the hair at 1024,
// the eyes and mouth smaller), WebP, and meshopt-compressed geometry.
// Run (with @gltf-transform installed, and sharp): node pack_bare.mjs in.glb out.glb
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup, textureCompress, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";
const [inp, out] = process.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({"meshopt.encoder": MeshoptEncoder});
const doc = await io.read(inp);
const SIZE = {skin_body: 2048, hair: 1024, eyes: 512, brows: 256, lashes: 256, teeth: 256, tongue: 128};
for (const m of doc.getRoot().listMaterials()) {
  const t = m.getBaseColorTexture(), s = SIZE[m.getName()]; if (!t || !s) continue;
  t.setName(m.getName());
}
await doc.transform(prune(), dedup());
for (const [name, s] of Object.entries(SIZE))
  await doc.transform(textureCompress({encoder: sharp, targetFormat: "webp", resize: [s, s], quality: name === "skin_body" ? 88 : 85, pattern: new RegExp(`^${name}$`)}));
await doc.transform(meshopt({encoder: MeshoptEncoder, level: "medium"}));
await io.write(out, doc);
