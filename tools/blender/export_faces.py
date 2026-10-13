# Pose a set of facial expressions with the rig's face controls, bake what they do to the deforming bones, and export
# them as one animation (one expression per frame) for the game to blend.
# Run: Blender -b --disable-autoexec rig.blend --python export_faces.py -- out.glb RIG-name
import bpy, sys, math
from mathutils import Vector
out, rig_name = sys.argv[sys.argv.index("--") + 1:][:2]
rig = bpy.data.objects[rig_name]
P = rig.pose.bones

def outward(name):  # +1 if the control's local x axis points away from the middle of the face, else -1
    pb = P[name]; m = rig.matrix_world @ pb.matrix
    xaxis = m.to_3x3() @ Vector((1, 0, 0)); side = m.translation.x
    return 1 if xaxis.x * side > 0 else -1

# each expression: corners up/out (metres), jaw (degrees), upper/lower lid (+ opens), brows up
FACES = {
    "smile":     dict(up=.016, out=.004, jaw=3, lidlow=.005),
    "grin":      dict(up=.02, out=.007, jaw=11, lidlow=.007),
    "sad":       dict(up=-.012, brow=-.004, lid=-.004),
    "surprise":  dict(jaw=20, brow=.018, lid=.004),
    "worried":   dict(up=-.006, brow=.012, lid=.002),
    "angry":     dict(up=-.004, brow=-.008, lid=-.006, sneer=.004),
    "blink":     dict(lid=-.022, lidlow=.004),
    "A":         dict(jaw=16),
    "E":         dict(out=.011, jaw=6),
    "O":         dict(out=-.009, jaw=9),
}
corners = ["ACT-Lips_Corner.L", "ACT-Lips_Corner.R"]
sign = {n: outward(n) for n in corners}
print("OUTWARD", sign)

def reset():
    for pb in P:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)

def apply(f):
    for n in corners: P[n].location = (sign[n] * f.get("out", 0), f.get("up", 0), 0)
    P["MSTR-Jaw"].rotation_mode = "XYZ"; P["MSTR-Jaw"].rotation_euler = (math.radians(f.get("jaw", 0)), 0, 0)
    for s in "LR":
        P[f"ACT-Eyelid_Upper.{s}"].location = (0, f.get("lid", 0), 0)
        P[f"ACT-Eyelid_Lower.{s}"].location = (0, f.get("lidlow", 0), 0)
        P[f"MSTR-Eyebrow.{s}"].location = (0, f.get("brow", 0), 0)
        if f.get("sneer") and f"ACT-Sneer.{s}" in P: P[f"ACT-Sneer.{s}"].location = (0, f["sneer"], 0)

ctrls = corners + ["MSTR-Jaw"] + [f"{b}.{s}" for s in "LR" for b in ("ACT-Eyelid_Upper", "ACT-Eyelid_Lower", "MSTR-Eyebrow", "ACT-Sneer") if f"{b}.{s}" in P]
rig.animation_data_create(); rig.animation_data.action = bpy.data.actions.new("face_ctrl")
names = ["rest"] + list(FACES)
for i, n in enumerate(names):
    reset()
    if n != "rest": apply(FACES[n])
    for c in ctrls:
        P[c].keyframe_insert("location", frame=i)
        if P[c].rotation_mode == "XYZ": P[c].keyframe_insert("rotation_euler", frame=i)
        else: P[c].keyframe_insert("rotation_quaternion", frame=i)
# bake what the controls do to the deforming bones
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode="POSE")
for pb in P:  # (Blender 5 keeps selection on the pose bone; older versions on the bone)
    if hasattr(pb, "select"): pb.select = pb.bone.use_deform
    else: pb.bone.select = pb.bone.use_deform
bpy.ops.nla.bake(frame_start=0, frame_end=len(names) - 1, only_selected=True, visual_keying=True, clear_constraints=False, use_current_action=False, bake_types={"POSE"})
baked = rig.animation_data.action; baked.name = "faces"
bpy.ops.object.mode_set(mode="OBJECT")
print("FRAMES", names)
for o in bpy.data.objects: o.select_set(False)
rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_def_bones=True, export_rest_position_armature=True,
    export_animations=True, export_animation_mode="ACTIVE_ACTIONS", export_force_sampling=True, export_frame_range=False, export_morph=False, export_skins=True)
print("EXPORTED", out)
