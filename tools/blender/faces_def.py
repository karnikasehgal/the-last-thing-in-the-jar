# The facial expressions, and how to pose them with a CloudRig face (Blender Studio's Rain and Snow).
import math
from mathutils import Vector

# corners up/out (metres), jaw (degrees), upper/lower lid (+ opens), brows up, sneer
FACES = {
    "smile":    dict(up=.016, out=.004, jaw=3, lidlow=.005),
    "grin":     dict(up=.02, out=.007, jaw=11, lidlow=.007),
    "sad":      dict(up=-.012, brow=-.004, lid=-.004),
    "surprise": dict(jaw=20, brow=.018, lid=.004),
    "worried":  dict(up=-.006, brow=.012, lid=.002),
    "angry":    dict(up=-.004, brow=-.008, lid=-.006, sneer=.004),
    "blink":    dict(lid=-.022, lidlow=.004),
    "A":        dict(jaw=16),
    "E":        dict(out=.011, jaw=6),
    "O":        dict(out=-.009, jaw=9),
}
CORNERS = ["ACT-Lips_Corner.L", "ACT-Lips_Corner.R"]

def outward(rig, name):  # +1 if the control's local x axis points away from the middle of the face
    m = rig.matrix_world @ rig.pose.bones[name].matrix
    xaxis = m.to_3x3() @ Vector((1, 0, 0))
    return 1 if xaxis.x * m.translation.x > 0 else -1

def reset(rig):
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)

def apply(rig, f, sign):
    P = rig.pose.bones
    for n in CORNERS: P[n].location = (sign[n] * f.get("out", 0), f.get("up", 0), 0)
    P["MSTR-Jaw"].rotation_mode = "XYZ"; P["MSTR-Jaw"].rotation_euler = (math.radians(f.get("jaw", 0)), 0, 0)
    for s in "LR":
        P[f"ACT-Eyelid_Upper.{s}"].location = (0, f.get("lid", 0), 0)
        P[f"ACT-Eyelid_Lower.{s}"].location = (0, f.get("lidlow", 0), 0)
        P[f"MSTR-Eyebrow.{s}"].location = (0, f.get("brow", 0), 0)
        if f"ACT-Sneer.{s}" in P: P[f"ACT-Sneer.{s}"].location = (0, f.get("sneer", 0), 0)

def bake_shape_keys(rig, objs, threshold=1e-5, targets=None):
    """Pose each expression and store what it does to every mesh as a shape key named face_<name>.
    targets maps a mesh's name to the object that receives its keys (a subdivided copy, say); default itself."""
    import bpy
    targets = targets or {}
    sign = {n: outward(rig, n) for n in CORNERS}
    rig.data.pose_position = "POSE"
    def coords(o):
        dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); me = ev.to_mesh()
        c = [v.co.copy() for v in me.vertices]; ev.to_mesh_clear(); return c
    # a mesh set to show only its active shape key would show each new expression while the next is measured
    for o in list(objs) + list(targets.values()):
        o.show_only_shape_key = False
    reset(rig); bpy.context.view_layer.update()
    rest = {o.name: coords(o) for o in objs}
    made = {}
    for name, f in FACES.items():
        reset(rig); apply(rig, f, sign); bpy.context.view_layer.update()
        for o in objs:
            t = targets.get(o.name, o)
            now = coords(o); r = rest[o.name]
            if len(now) != len(r) or len(now) != len(t.data.vertices): continue
            d = [a - b for a, b in zip(now, r)]
            if max(v.length for v in d) < threshold: continue
            if not t.data.shape_keys: t.shape_key_add(name="Basis", from_mix=False)
            k = t.shape_key_add(name="face_" + name, from_mix=False); k.value = 0; t.active_shape_key_index = 0
            basis = t.data.shape_keys.reference_key
            for i, dv in enumerate(d): k.data[i].co = basis.data[i].co + dv
            made.setdefault(t.name, []).append(name)
    reset(rig); bpy.context.view_layer.update(); rig.data.pose_position = "REST"
    return made
