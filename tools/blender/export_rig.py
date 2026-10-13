# Export a Blender Studio character rig to a game-ready GLB: deform skeleton, meshes, shape keys (as morph targets).
# Run: Blender -b --disable-autoexec <rig.blend> --python export_rig.py -- <out.glb> <RIG-name> [skip-substring ...]
import bpy, sys

argv = sys.argv[sys.argv.index("--") + 1:]
out, rig_name, skips = argv[0], argv[1], argv[2:]
rig = bpy.data.objects[rig_name]
# rest pose, so the bind pose is the one the meshes were modelled in
rig.data.pose_position = "REST"

keep = []
for o in list(bpy.data.objects):
    if o.type != "MESH" or o.parent != rig: continue
    if o.hide_render or any(s in o.name for s in skips): continue
    keep.append(o)

bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object else None
for o in keep:
    bpy.context.view_layer.objects.active = o
    o.hide_set(False); o.hide_viewport = False
    # Blender-only deformers: drop them (lattices, smoothing, subdivision, masks driven by weight mixing)
    for md in list(o.modifiers):
        if md.type in {"LATTICE", "CORRECTIVE_SMOOTH", "SUBSURF", "MASK", "VERTEX_WEIGHT_MIX", "SOLIDIFY"}:
            o.modifiers.remove(md)
    # a mirror modifier has to become real geometry; it can't be applied while the mesh has shape keys, so those go
    if any(md.type == "MIRROR" for md in o.modifiers):
        if o.data.shape_keys:
            o.shape_key_clear()
        for md in list(o.modifiers):
            if md.type == "MIRROR":
                with bpy.context.temp_override(object=o, active_object=o):
                    bpy.ops.object.modifier_apply(modifier=md.name)
    print("KEEP", o.name, len(o.data.vertices), "keys", len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0, [m.type for m in o.modifiers])

# bake the real colours into plain textures so they survive export
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bake_colors import bake
bake(keep, os.path.join(os.path.dirname(out), "bake-" + os.path.basename(out).split(".")[0]), 1024)

# select what goes out
for o in bpy.data.objects: o.select_set(False)
rig.select_set(True)
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(
    filepath=out, export_format="GLB", use_selection=True,
    export_def_bones=True, export_rest_position_armature=True,
    export_morph=True, export_morph_normal=False, export_skins=True, export_animations=False,
    export_apply=False, export_image_format="WEBP", export_yup=True,
)
print("EXPORTED", out)
