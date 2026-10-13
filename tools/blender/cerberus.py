# Cerberus from a real Doberman: "Doberman Walk Cycle" by joshpurple (Sketchfab, CC-BY 4.0), which comes as a mesh with
# its walk baked into 143 shape keys and no skeleton. This takes the frame where it stands most squarely, finds its
# anatomy from the mesh (paws, legs, withers, hips, head, tail), gives it two more heads on their own necks, builds a
# skeleton through those points, weights the skin region by region, and exports a rigged GLB for the game to animate.
# Run: Blender -b --python cerberus.py -- in/scene.gltf out.glb
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix

src, out = sys.argv[sys.argv.index("--") + 1:][:2]
FRAME = 6          # the walk frame with the legs most nearly under the body
SPLAY = .62        # radians each extra head turns out from the middle one
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
dog = next(o for o in bpy.context.scene.objects if o.type == "MESH")
mw = dog.matrix_world.copy()

# 1. the chosen frame becomes the mesh, in metres, standing on the ground; no shape keys, no animation
kb = dog.data.shape_keys.key_blocks
co = [mw @ kb[FRAME].data[i].co * .01 for i in range(len(dog.data.vertices))]
dog.data.shape_keys.animation_data_clear(); dog.animation_data_clear(); dog.shape_key_clear()
for i, v in enumerate(dog.data.vertices): v.co = co[i]
dog.parent = None; dog.matrix_world = Matrix.Identity(4)
bpy.context.view_layer.update()
for o in list(bpy.context.scene.objects):
    if o != dog: bpy.data.objects.remove(o)
P = [v.co.copy() for v in dog.data.vertices]
zmin = min(p.z for p in P); [setattr(v.co, "z", v.co.z - zmin) for v in dog.data.vertices]; P = [v.co.copy() for v in dog.data.vertices]
H = max(p.z for p in P)                       # height to the top of the head
ymin, ymax = min(p.y for p in P), max(p.y for p in P)   # the head is toward -y
mid = lambda pts: sum(pts, Vector()) / max(1, len(pts))

# 2. anatomy, found from the mesh
low = [p for p in P if p.z < .04]
cy = mid(low).y
paws = {}
for front in (True, False):
    for side in (1, -1):
        g = [p for p in low if (p.y < cy) == front and p.x * side > 0]
        paws[(front, side)] = mid(g)
def leg_chain(front, side):
    # follow the leg up from the paw, slice by slice, staying near the line it has drawn so far
    chain, cur = [paws[(front, side)]], paws[(front, side)]
    for z in [.13, .28, .42, .55]:
        zz = z * H
        g = [p for p in P if abs(p.z - zz) < .02 * H and p.x * side > 0 and (p.y - cur.y) ** 2 + (p.x - cur.x) ** 2 < (.12 * H) ** 2]
        if g: cur = mid(g); chain.append(cur)
    return chain
legs = {k: leg_chain(*k) for k in paws}
top = lambda y0: max((p for p in P if abs(p.y - y0) < .03 * H and abs(p.x) < .05 * H), key=lambda p: p.z)
fy = (paws[(True, 1)].y + paws[(True, -1)].y) / 2; by = (paws[(False, 1)].y + paws[(False, -1)].y) / 2
withers = top(fy).copy(); withers.z -= .1 * H                     # inside the body, under the top of the shoulders
hips = top(by).copy(); hips.z -= .12 * H
chest = (withers + hips) / 2 + Vector((0, (fy - by) * .18, 0))
headv = [p for p in P if p.y < fy - .25 * H and p.z > .78 * H]
head = mid(headv); nose = min(P, key=lambda p: p.y)
neck = (withers * .45 + head * .55); neck.z -= .04 * H
tailv = [p for p in P if p.y > ymax - .08 * H]; tail0 = mid(tailv) if tailv else hips + Vector((0, .2 * H, .1 * H))
print("ANATOMY H", round(H, 3), "withers", withers, "hips", hips, "head", head, "nose", nose)

# 3. two more heads: the neck and head, copied and turned out about the base of the neck
region = lambda p: p.y < withers.y - .06 * H and p.z > .58 * H          # in front of the shoulders and above the chest
pivot = Vector((0, withers.y - .08 * H, .62 * H))
bm = bmesh.new(); bm.from_mesh(dog.data); bm.verts.ensure_lookup_table()
faces = [f for f in bm.faces if all(region(v.co) for v in f.verts)]
copies = {}
for side in (1, -1):
    res = bmesh.ops.duplicate(bm, geom=faces)
    nv = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
    R = Matrix.Rotation(side * SPLAY, 4, "Z") @ Matrix.Rotation(-side * .12, 4, "Y")
    for v in nv: v.co = pivot + (R @ (v.co - pivot)) + Vector((side * .06 * H, .02 * H, 0))
    copies[side] = nv
bm.verts.index_update(); side_of = {v.index: side for side, nv in copies.items() for v in nv}  # (read before the bmesh goes)
bm.to_mesh(dog.data); bm.free()

# 4. the skeleton
arm = bpy.data.armatures.new("cerberus"); rig = bpy.data.objects.new("cerberus", arm); bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode="EDIT")
eb = arm.edit_bones
def bone(name, a, b, parent=None):
    x = eb.new(name); x.head, x.tail = a, b
    if parent: x.parent = eb[parent]
    return x
bone("root", Vector((0, (fy + by) / 2, 0)), Vector((0, (fy + by) / 2, .1 * H)))
bone("hips", hips, chest, "root")
bone("chest", chest, withers, "hips")
turn = lambda p, s: pivot + (Matrix.Rotation(s * SPLAY, 4, "Z") @ Matrix.Rotation(-s * .12, 4, "Y") @ (p - pivot)) + Vector((s * .06 * H, .02 * H, 0))
for tag, s in (("C", 0), ("L", 1), ("R", -1)):
    w, n, h, t = withers, neck, head, Vector((head.x, nose.y, head.z - .04 * H))
    if s: n, h, t = turn(n, s), turn(h, s), turn(t, s)
    bone("neck" + tag, w, n, "chest"); bone("head" + tag, n, h, "neck" + tag); bone("muzzle" + tag, h, t, "head" + tag)
for (front, side), ch in legs.items():
    tag = ("F" if front else "B") + ("L" if side > 0 else "R")
    top_ = (withers if front else hips) + Vector((side * .1 * H, 0, -.05 * H))
    pts = [top_] + list(reversed(ch))[:-1] + [ch[0]]          # shoulder/hip, down the slices, to the paw
    pts = [pts[0], pts[len(pts) // 3], pts[2 * len(pts) // 3], pts[-1]]
    par = "chest" if front else "hips"
    for k, nm in enumerate(("upper", "mid", "low")):
        bone(f"{tag}_{nm}", pts[k], pts[k + 1], par); par = f"{tag}_{nm}"
t1 = tail0; bone("tail1", hips + Vector((0, .08 * H, .05 * H)), t1, "hips")
bone("tail2", t1, t1 + Vector((0, .08 * H, .03 * H)), "tail1")
bpy.ops.object.mode_set(mode="OBJECT")

# 5. skin weights: each vertex to the nearest bones it is allowed, by distance to the bone's line
names = [b.name for b in arm.bones]
segs = {b.name: (rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local) for b in arm.bones}
def dseg(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(1e-9, ab.length_squared))); return (p - (a + ab * t)).length
groups = {n: dog.vertex_groups.new(name=n) for n in names if n != "root"}
belly = .5 * H
for v in dog.data.vertices:
    p = v.co
    if v.index in side_of:
        tag = "L" if side_of[v.index] > 0 else "R"; allowed = ["neck" + tag, "head" + tag, "muzzle" + tag, "chest"]
    elif p.z < belly and min(abs(p.y - fy), abs(p.y - by)) < .3 * H:
        # which leg: the one whose bones it is nearest (legs that nearly touch can't be told apart by side alone)
        leg = min(("FL", "FR", "BL", "BR"), key=lambda t: min(dseg(p, *segs[f"{t}_{n}"]) for n in ("upper", "mid", "low")))
        allowed = [f"{leg}_{n}" for n in ("upper", "mid", "low")] + (["chest"] if leg[0] == "F" else ["hips"])
    else:
        allowed = ["hips", "chest", "neckC", "headC", "muzzleC", "tail1", "tail2", "FL_upper", "FR_upper", "BL_upper", "BR_upper"]
        if p.x > .05 * H: allowed = [a for a in allowed if not a.endswith("R_upper")]
        if p.x < -.05 * H: allowed = [a for a in allowed if not a.endswith("L_upper")]
    ws = sorted(((1 / (dseg(p, *segs[n]) + .01 * H) ** 4, n) for n in allowed), reverse=True)[:3]
    tot = sum(w for w, _ in ws)
    for w, n in ws: groups[n].add([v.index], w / tot, "REPLACE")
dog.parent = rig; mod = dog.modifiers.new("Armature", "ARMATURE"); mod.object = rig

# 6. export: the skeleton and the skin, no animation (the game moves the bones)
for o in bpy.data.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_skins=True, export_animations=False, export_morph=False, export_yup=True)
print("EXPORTED", out, len(dog.data.vertices), "verts", len(names), "bones")
