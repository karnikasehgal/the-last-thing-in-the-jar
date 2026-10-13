# Export a Blender Studio character rig to a game-ready GLB: deform skeleton, meshes, shape keys (as morph targets),
# facial expressions baked as exact shape keys, and every material's colour baked into a plain texture.
# Run: Blender -b --disable-autoexec <rig.blend> --python export_rig.py -- <out.glb> <RIG-name> [skip-substring ...]
import bpy, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bake_colors import bake
from faces_def import bake_shape_keys

argv = sys.argv[sys.argv.index("--") + 1:]
out, rig_name, skips = argv[0], argv[1], argv[2:]
rig = bpy.data.objects[rig_name]
rig.data.pose_position = "REST"  # the bind pose is the one the meshes were modelled in
bpy.context.preferences.system.use_gpu_subdivision = False  # otherwise subdivision happens only on screen, never in the mesh we export
bpy.context.scene.render.use_simplify = False  # studio files often cap viewport subdivision, which disables it entirely

keep = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig and not o.hide_render and not any(s in o.name for s in skips)]
if bpy.context.object: bpy.ops.object.mode_set(mode="OBJECT")

# 1. mirror modifiers become real geometry first (they can't be applied while a mesh has shape keys, so those go)
for o in keep:
    o.hide_set(False); o.hide_viewport = False
    if any(md.type == "MIRROR" for md in o.modifiers):
        if o.data.shape_keys: o.shape_key_clear()
        for md in [m for m in o.modifiers if m.type == "MIRROR"]:
            with bpy.context.temp_override(object=o, active_object=o): bpy.ops.object.modifier_apply(modifier=md.name)

# 2. the face is exported one subdivision smoother, the way Blender renders it (the bare cage lets the gums show through
#    the cheeks when she smiles): a subdivided copy carries the skinning, and the expressions are captured onto it
SMOOTH = [o for o in keep if o.name.endswith("-head")]
targets = {}
for o in SMOOTH:
    # the rig drives the face's subdivision level from a viewport-speed switch; that rule would override ours
    if o.animation_data:
        for d in list(o.animation_data.drivers):
            if d.data_path.endswith(".levels"): o.animation_data.drivers.remove(d)
    c = o.copy(); c.data = o.data.copy(); c.name = o.name + "_smooth"; c.animation_data_clear()
    bpy.context.scene.collection.objects.link(c); c.hide_viewport = False; c.hide_set(False)  # (a visible collection, or Blender treats its modifiers as off)
    if c.data.shape_keys: c.shape_key_clear()
    for md in list(c.modifiers):
        if md.type != "SUBSURF": c.modifiers.remove(md)
    subs = [m for m in c.modifiers if m.type == "SUBSURF"] or [c.modifiers.new("Subdivision", "SUBSURF")]
    subs[0].levels = 1; subs[0].show_viewport = True
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(c.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)  # keeps the skin weights
    c.modifiers.clear(); c.data = me
    targets[o.name] = c
for o in keep:
    for md in o.modifiers:
        if md.type == "SUBSURF":
            if o in SMOOTH: md.levels = 1; md.show_viewport = True
            else: md.show_viewport = False
print("FACE KEYS", bake_shape_keys(rig, keep, targets=targets))
for o in SMOOTH:  # the smooth copy replaces the original, deformed by the same skeleton
    c = targets[o.name]; c.parent = rig; c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
    a = c.modifiers.new("Armature", "ARMATURE"); a.object = rig
    keep[keep.index(o)] = c; bpy.data.objects.remove(o)
    c.name = c.name.replace("_smooth", "")

# 3. drop the Blender-only deformers the game can't run
for o in keep:
    for md in list(o.modifiers):
        if md.type in {"LATTICE", "CORRECTIVE_SMOOTH", "SUBSURF", "MASK", "VERTEX_WEIGHT_MIX", "SOLIDIFY"}: o.modifiers.remove(md)
    print("KEEP", o.name, len(o.data.vertices), "keys", len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0, [m.type for m in o.modifiers])

# 4. the real colours, baked into plain textures so they survive export
bake(keep, os.path.join(os.path.dirname(out), "bake-" + os.path.basename(out).split(".")[0]), 1024)

# 5. give the deforming bones a proper chain (pelvis > spine > shoulder > arm > hand ...). In the rig they hang off
#    helper bones the game never sees, so without this a hand wouldn't follow its forearm.
CHAIN = {"DEF-Spine1": "DEF-Pelvis", "DEF-Head": "DEF-Neck", "DEF-Scarf1": "DEF-Spine3",
         # hair as chains, so the game can swing it (in the rig each piece hangs straight off the head)
         "DEF-Hair_Ponytail2": "DEF-Hair_Ponytail1", "DEF-Hair_Ponytail3": "DEF-Hair_Ponytail2", "DEF-Hair_Ponytail4": "DEF-Hair_Ponytail3",
         "DEF-Hair_Strand2": "DEF-Hair_Strand1"}
for s in "LR":
    CHAIN.update({f"DEF-Clavicle.{s}": "DEF-Spine3", f"DEF-Upperarm1.{s}": f"DEF-Clavicle.{s}", f"DEF-Forearm1.{s}": f"DEF-Upperarm2.{s}",
                  f"DEF-Hand.{s}": f"DEF-Forearm2.{s}", f"DEF-Thigh1.{s}": "DEF-Pelvis", f"DEF-Shin1.{s}": f"DEF-Thigh2.{s}",
                  f"DEF-Foot.{s}": f"DEF-Shin2.{s}", f"DEF-Toe.{s}": f"DEF-Foot.{s}"})
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
eb = rig.data.edit_bones
deform = {b.name for b in rig.data.bones if b.use_deform}
def nearest_def(b):
    p = b.parent
    while p and p.name not in deform: p = p.parent
    return p
BODY = ["DEF-Pelvis", "DEF-Spine1", "DEF-Spine2", "DEF-Spine3", "DEF-Neck", "DEF-Head"] + [f"DEF-{n}.{s}" for s in "LR" for n in
        ("Clavicle", "Upperarm1", "Upperarm2", "Forearm1", "Forearm2", "Hand", "Thigh1", "Thigh2", "Shin1", "Shin2", "Foot", "Toe")]
def closest_body_bone(p):
    from mathutils.geometry import intersect_point_line
    best, bd = None, 1e9
    for n in BODY:
        if n not in eb: continue
        h, t = eb[n].head, eb[n].tail
        q, f = intersect_point_line(p, h, t); f = min(1, max(0, f)); d = (p - (h + (t - h) * f)).length
        if d < bd: best, bd = n, d
    return best
FACE_PARTS = ("Lip", "LaughLine", "Cheek", "Chin", "Jaw", "Mouth", "Nose", "Teeth", "Tongue")  # (the mouth hangs below the head's pivot)
fixed = 0
for b in list(eb):
    if b.name not in deform or b.name == "DEF-Pelvis": continue
    want = CHAIN.get(b.name)
    if not want:
        if b.parent and b.parent.name in deform: continue
        p = nearest_def(b)
        face = b.head.z > eb["DEF-Head"].head.z or any(k in b.name for k in FACE_PARTS)
        if face and (not p or p.name in ("DEF-Neck", "DEF-Spine3")):
            want = "DEF-Head"  # the whole face moves with the skull (the lips' helper chain leads back to the neck otherwise)
        elif p: want = p.name
        else: want = closest_body_bone(b.head)  # a knee's corrective bone goes with its leg (by distance, not name: "NoseRing" is no finger)
    if want in eb and (not b.parent or b.parent.name != want):
        b.use_connect = False; b.parent = eb[want]; fixed += 1
bpy.ops.object.mode_set(mode="OBJECT")
print("CHAINED", fixed)

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
