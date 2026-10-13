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

# 0. one naming for every character: a rig from Snow's generation gets Rain's bone names (Blender renames the
#    skin weights and drivers along with the bones)
SNOW = {"DEF-Hip_Center": "DEF-Pelvis", "DEF-Spine": "DEF-Spine1", "DEF-RibCage": "DEF-Spine2", "DEF-Chest": "DEF-Spine3", "DEF-Ponytail1": "DEF-Hair_Ponytail1"}
for s in "LR":
    SNOW.update({f"DEF-Shoulder.{s}": f"DEF-Clavicle.{s}", f"DEF-UpperArm_1.{s}": f"DEF-Upperarm1.{s}", f"DEF-UpperArm_2.{s}": f"DEF-Upperarm2.{s}",
                 f"DEF-Forearm_1.{s}": f"DEF-Forearm1.{s}", f"DEF-Forearm_2.{s}": f"DEF-Forearm2.{s}", f"DEF-Wrist.{s}": f"DEF-Hand.{s}",
                 f"DEF-Thigh_1.{s}": f"DEF-Thigh1.{s}", f"DEF-Thigh_2.{s}": f"DEF-Thigh2.{s}", f"DEF-Knee_1.{s}": f"DEF-Shin1.{s}", f"DEF-Knee_2.{s}": f"DEF-Shin2.{s}",
                 f"DEF-Toes.{s}": f"DEF-Toe.{s}", f"DEF-Finger_Thumb1.{s}": f"DEF-Thumb1.{s}", f"DEF-Finger_Thumb2.{s}": f"DEF-Thumb2.{s}", f"DEF-Finger_Thumb3.{s}": f"DEF-Thumb3.{s}"})
    for f in ("Index", "Middle", "Ring", "Pinky"):  # (Snow counts from the knuckle, Rain from the palm)
        SNOW.update({f"DEF-Finger_{f}_Carpal.{s}": f"DEF-{f}1.{s}", f"DEF-Finger_{f}1.{s}": f"DEF-{f}2.{s}", f"DEF-Finger_{f}2.{s}": f"DEF-{f}3.{s}", f"DEF-Finger_{f}3.{s}": f"DEF-{f}4.{s}"})
if "DEF-Pelvis" not in rig.data.bones:
    for a, b in SNOW.items():
        if a not in rig.data.bones: continue
        for o in bpy.data.objects:  # a stale weight group already holding the new name would stop the real one being renamed
            if o.type == "MESH" and a in o.vertex_groups and b in o.vertex_groups: o.vertex_groups.remove(o.vertex_groups[b])
        rig.data.bones[a].name = b
    # some weight groups were painted under older names without the underscore (DEF-Knee1.L for DEF-Knee_1.L)
    loose = {a.replace("_", ""): b for a, b in SNOW.items()}
    for o in bpy.data.objects:
        if o.type != "MESH": continue
        for g in o.vertex_groups:
            t = loose.get(g.name.replace("_", ""))
            if t and g.name not in rig.data.bones and t not in o.vertex_groups: g.name = t

keep = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig and not o.hide_render and not any(s in o.name for s in skips)]
if bpy.context.object: bpy.ops.object.mode_set(mode="OBJECT")

# 1a. textures follow the UV layout used for rendering (a mesh can carry others, a tattoo map say, that may be the active one)
for o in keep:
    uvs = o.data.uv_layers
    main = next((l for l in uvs if l.active_render), None)
    if main:
        for l in [l for l in uvs if l != main]: uvs.remove(l)
        uvs.active = uvs[0]
    # painted masks the Blender shaders read; a game engine would multiply the colour by them
    for a in list(o.data.color_attributes): o.data.color_attributes.remove(a)

# 1. mirror modifiers become real geometry first (they can't be applied while a mesh has shape keys, so those go)
for o in keep:
    o.hide_set(False); o.hide_viewport = False
    if any(md.type == "MIRROR" for md in o.modifiers):
        if o.data.shape_keys: o.shape_key_clear()
        for md in [m for m in o.modifiers if m.type == "MIRROR"]:
            with bpy.context.temp_override(object=o, active_object=o): bpy.ops.object.modifier_apply(modifier=md.name)

# 2. every mesh is exported as a plain copy of itself at rest: corrective shapes, lattices and teeth that ride the face
#    through a helper surface are all baked in. The face goes one subdivision smoother, the way Blender renders it (the
#    bare cage lets the gums show through the cheeks in a smile). The expressions are captured from the rigged original
#    onto the copy.
TOPOLOGY = {"MASK"}  # (modifiers that change the vertex count: off in both, so the two can be compared vertex for vertex)
targets = {}
deform = {b.name for b in rig.data.bones if b.use_deform}
for o in keep:
    if o.animation_data:  # rigs switch subdivision levels by viewport speed; that rule would override ours
        for d in list(o.animation_data.drivers):
            if ".levels" in d.data_path or "show_viewport" in d.data_path: o.animation_data.drivers.remove(d)
    smooth = o.name.endswith("-head")
    for md in o.modifiers:
        if md.type in TOPOLOGY: md.show_viewport = False
        if md.type == "SUBSURF":
            md.show_viewport = smooth
            if smooth: md.levels = 1
    c = o.copy(); c.data = o.data.copy(); c.name = o.name + "_rest"; c.animation_data_clear()
    bpy.context.scene.collection.objects.link(c); c.hide_viewport = False; c.hide_set(False)  # (a visible collection, or Blender treats its modifiers as off)
    for md in list(c.modifiers):
        # (a lattice squashes and stretches the face for the animator; at rest it can still shift it)
        if md.type in TOPOLOGY | {"ARMATURE", "LATTICE"} or (md.type == "SUBSURF" and not smooth): c.modifiers.remove(md)
    for md in c.modifiers:
        if md.type == "SUBSURF": md.levels = 1; md.show_viewport = True
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(c.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)  # keeps the skin weights
    c.modifiers.clear(); c.shape_key_clear() if c.data.shape_keys else None; c.data = me
    if me.shape_keys: c.shape_key_clear()
    # something that followed the face through a helper (teeth, gums) has no bones of its own: it rides the skull
    if not any(g.name in deform for g in c.vertex_groups):
        g = c.vertex_groups.new(name="DEF-Head"); g.add(range(len(me.vertices)), 1.0, "REPLACE")
    targets[o.name] = c
print("FACE KEYS", bake_shape_keys(rig, keep, targets=targets))
for i, o in enumerate(list(keep)):  # the copy replaces the original, deformed by the same skeleton
    c = targets[o.name]; c.parent = rig; c.matrix_parent_inverse = o.matrix_parent_inverse.copy(); c.matrix_world = o.matrix_world.copy()
    a = c.modifiers.new("Armature", "ARMATURE"); a.object = rig
    name = o.name; bpy.data.objects.remove(o); c.name = name; keep[i] = c

# 3. drop the Blender-only deformers the game can't run
for o in keep:
    for md in list(o.modifiers):
        if md.type in {"LATTICE", "CORRECTIVE_SMOOTH", "SUBSURF", "MASK", "VERTEX_WEIGHT_MIX", "SOLIDIFY"}: o.modifiers.remove(md)
    print("KEEP", o.name, len(o.data.vertices), "keys", len(o.data.shape_keys.key_blocks) if o.data.shape_keys else 0, [m.type for m in o.modifiers])

# 4. the real colours, baked into plain textures so they survive export
bake(keep, os.path.join(os.path.dirname(out), "bake-" + os.path.basename(out).split(".")[0]), 1024)

# 4b. tiled (UDIM) skin: split it ourselves into one plain material per tile, its UVs moved back into the unit square
#     (pack_toon.mjs gives each its tile's image). The exporter's own split drops faces on a head with several skins.
#     Shading variants of the skin that couldn't be baked (a darker patch, the lips) join the main skin first.
import math
def tiled(m):
    return m and m.use_nodes and any(n.type == "TEX_IMAGE" and n.image and n.image.source == "TILED" for n in m.node_tree.nodes)
split = {}
for o in keep:
    me = o.data; mats = [s.material for s in o.material_slots]
    base = {i: next((j for j, b in enumerate(mats) if tiled(b) and m and m.name.startswith(b.name)), None) for i, m in enumerate(mats)}
    if not any(v is not None for v in base.values()): continue
    uv = me.uv_layers.active.data
    for p in me.polygons:
        b = base.get(p.material_index)
        if b is None: continue
        u = sum(uv[l].uv.x for l in p.loop_indices) / p.loop_total; v = sum(uv[l].uv.y for l in p.loop_indices) / p.loop_total
        tu, tv = math.floor(u), math.floor(v); tile = 1001 + tu + 10 * tv
        key = (mats[b].name, tile)
        if key not in split:
            m = mats[b].copy(); m.name = f"{mats[b].name}.{tile}"
            for n in m.node_tree.nodes:
                if n.type == "TEX_IMAGE": n.image = None
            split[key] = m
        m = split[key]
        if m.name not in o.data.materials: o.data.materials.append(m)
        p.material_index = list(o.data.materials).index(m)
        for l in p.loop_indices: uv[l].uv.x -= tu; uv[l].uv.y -= tv
print("TILES", sorted(m.name for m in split.values()))

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
