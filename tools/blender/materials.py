# List each material's image textures and what drives the base colour. Run with Blender -b --disable-autoexec file.blend --python materials.py
import bpy
for m in bpy.data.materials:
    if not m.use_nodes or not m.name.startswith("MAT-"): continue
    imgs = [(n.name, n.image.name if n.image else None, n.image.source if n.image else None) for n in m.node_tree.nodes if n.type == "TEX_IMAGE"]
    bsdf = [n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"]
    base = None
    if bsdf:
        bc = bsdf[0].inputs["Base Color"]
        base = (bc.links[0].from_node.type + ":" + bc.links[0].from_node.name) if bc.is_linked else tuple(round(x, 3) for x in bc.default_value)
    groups = [n.node_tree.name for n in m.node_tree.nodes if n.type == "GROUP" and n.node_tree]
    print("MAT", m.name, "| base:", base, "| imgs:", imgs, "| groups:", groups)
