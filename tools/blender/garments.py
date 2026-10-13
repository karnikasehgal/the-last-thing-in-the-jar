# Greek clothes, sewn and dropped onto a realistic body with cloth simulation, then bound to its skeleton.
#
# A chiton is a tube of linen with no sleeves: the front and back are pinned together along the top of each shoulder
# (where brooches would hold it), the arms come out through openings at the sides, and a belt gathers it at the waist
# so it blouses over. Here the tube is cut, pinned and belted on the body standing in its rest pose, and left to fall
# under gravity against the body until it settles into real folds. Then each point of the cloth takes its weights from
# the nearest point of the skin, so it moves with every animation the game plays, and it's exported with the skeleton.
#
# Run: Blender -b --python garments.py -- body.glb out.glb kind
#   kind: short (to the knee, men), long (to the ankle), long_belted_high (a woman's, belted under the bust)
import bpy, bmesh, sys, math
from mathutils import Vector, kdtree

args = sys.argv[sys.argv.index("--") + 1:]
src, out, kind = args[0], args[1], (args[2] if len(args) > 2 else "short")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.parent == arm]
# the skin: a realistic person is one mesh; an animated one (Snow, Rain) has a body and a separate head
skin = [o for o in meshes if any(k in o.name.lower() for k in ("body", "head"))] or [max(meshes, key=lambda o: len(o.data.vertices))]
body = max(skin, key=lambda o: len(o.data.vertices) if "body" in o.name.lower() else 0)
for o in list(bpy.context.scene.objects):
    if o.type == "MESH" and o not in skin: bpy.data.objects.remove(o)
# bones by the realistic rig's names, or the animated rig's
ALIAS = {"Bip01_Pelvis": "DEF-Pelvis", "Bip01_Neck": "DEF-Neck", "Bip01_L_Clavicle": "DEF-Clavicle.L", "Bip01_L_UpperArm": "DEF-Upperarm1.L",
         "Bip01_L_Calf": "DEF-Shin1.L", "Bip01_L_Foot": "DEF-Foot.L", "Bip01_L_Thigh": "DEF-Thigh1.L"}
def W(n):
    b = arm.data.bones.get(n) or arm.data.bones.get(ALIAS.get(n, n))
    return arm.matrix_world @ b.head_local
PELVIS = "Bip01_Pelvis" if arm.data.bones.get("Bip01_Pelvis") else "DEF-Pelvis"
shoulder_z = max(W("Bip01_L_Clavicle").z, W("Bip01_L_UpperArm").z) + .045
waist_z = W("Bip01_Pelvis").z + (.36 if kind == "long_belted_high" else .11)
hem_z = {"short": W("Bip01_L_Calf").z + .02, "long": W("Bip01_L_Foot").z - .02, "long_belted_high": W("Bip01_L_Foot").z - .02}[kind]
neck = W("Bip01_Neck")

# the body as it stands, frozen (all the skin, joined), to fall against
dg = bpy.context.evaluated_depsgraph_get()
bm0 = bmesh.new()
for o in skin:
    t = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); t.transform(o.matrix_world); bm0.from_mesh(t); bpy.data.meshes.remove(t)
me = bpy.data.meshes.new("collider"); bm0.to_mesh(me); bm0.free()
col = bpy.data.objects.new("collider", me); bpy.context.scene.collection.objects.link(col)
dec = col.modifiers.new("dec", "DECIMATE"); dec.ratio = .35
bpy.context.view_layer.objects.active = col; bpy.ops.object.modifier_apply(modifier="dec")
c = col.modifiers.new("col", "COLLISION"); col.collision.thickness_outer = .008; col.collision.thickness_inner = .004; col.collision.cloth_friction = 8
P = [col.matrix_world @ v.co for v in col.data.vertices]
TORSO = [p for p in P if waist_z - .1 < p.z < waist_z + .1 and abs(p.x) < .24]; cy = sum(p.y for p in TORSO) / max(1, len(TORSO))

# the tube starts close to the body, as cloth that's been put on does: at each height, the body's own width and depth
# (the torso only, not the arms) and a few centimetres of ease; from the hips down it hangs straight, and flares a
# little toward the hem
hip_z = W("Bip01_Pelvis").z - .08
def extent(z, band=.02):
    pts = [p for p in P if abs(p.z - z) < band and abs(p.x) < (.26 if z > hip_z - .05 else .32)]
    if not pts: return .2, .15
    return max(abs(p.x) for p in pts), max(abs(p.y - cy) for p in pts)
HIP = extent(hip_z)
# Cut full, as a chiton is: a wide rectangle of linen, far wider than the body, gathered by the brooches and the belt;
# the excess is what falls into folds. (Cut close, it hangs as cut, like a box.)
def fit(z):
    if z > hip_z: ex, ey = extent(z); return ex + .1, ey + .06
    t = (hip_z - z); return HIP[0] + .13 + t * .12, HIP[1] + .1 + t * .08
RX, RY, SEG, STEP = .27, .19, 56, .022
rows = int((shoulder_z - hem_z) / STEP) + 1
bm = bmesh.new(); grid = []
for r in range(rows + 1):
    z = shoulder_z - r * (shoulder_z - hem_z) / rows; ring = []
    rx, ry = fit(z)
    for s in range(SEG):
        a = s / SEG * math.tau
        ring.append(bm.verts.new((math.cos(a) * rx, cy + math.sin(a) * ry, z)))
    grid.append(ring)
for r in range(rows):
    for s in range(SEG):
        a, b, cc, d = grid[r][s], grid[r][(s + 1) % SEG], grid[r + 1][(s + 1) % SEG], grid[r + 1][s]
        mid = (a.co + b.co + cc.co + d.co) / 4
        # the openings at the sides for the arms, from the top down to below the armpit
        if abs(mid.x) > .2 and mid.z > shoulder_z - .27: continue
        bm.faces.new((a, b, cc, d))
for v in [v for v in bm.verts if not v.link_faces]: bm.verts.remove(v)
# texture coordinates as the cloth was cut: round the tube, and down it (a metre of cloth to one repeat), so the game's
# fabric (its weave and its colour) lies along the threads
uvl = bm.loops.layers.uv.new("UVMap")
for f in bm.faces:
    for l in f.loops:
        a = math.atan2(l.vert.co.y - cy, l.vert.co.x); l[uvl].uv = ((a / math.tau + .5) * 1.7, (shoulder_z - l.vert.co.z))
    # (at the seam where the angle wraps round, keep each face's coordinates together)
    us = [l[uvl].uv.x for l in f.loops]
    if max(us) - min(us) > .85:
        for l in f.loops:
            if l[uvl].uv.x < .85: l[uvl].uv.x += 1.7
bm.verts.ensure_lookup_table()
garm_me = bpy.data.meshes.new("chiton"); bm.to_mesh(garm_me); bm.free()
garm = bpy.data.objects.new("chiton", garm_me); bpy.context.scene.collection.objects.link(garm)

# pins: along the top of each shoulder the front edge and the back edge are brought together and held (the brooches);
# round the waist, a ring of cloth is drawn in to the body and held (the belt)
pin = garm.vertex_groups.new(name="pin")
top = max(v.co.z for v in garm.data.vertices)
# two brooches on each shoulder, front edge to back edge; between them, and across the neck, the cloth hangs free and
# falls into the soft draped neckline of Greek dress
# the whole top edge, front and back, is gathered onto the shoulder line and round the base of the neck (the neckline
# lower in front); the full width of cloth then falls from there over the chest and back in folds
for v in garm.data.vertices:
    if v.co.z > top - .001 and abs(v.co.x) < .21:
        front = v.co.y < cy; ax = abs(v.co.x) / .21
        v.co.x *= .82
        v.co.y = cy + (-.07 if front else .06) * (1 - ax * .55)
        v.co.z = shoulder_z - (.07 * (1 - ax) ** 2 if front else .025 * (1 - ax) ** 2) - .012 * ax
        pin.add([v.index], 1, "REPLACE")
waist_pts = [p for p in P if abs(p.z - waist_z) < .015 and abs(p.x) < .24]  # (the torso only: the hands hang at this height too)
wx = max(abs(p.x) for p in waist_pts) + .015; wy = max(abs(p.y - cy) for p in waist_pts) + .015
for v in garm.data.vertices:
    if abs(v.co.z - waist_z) < STEP * .55:
        a = math.atan2(v.co.y - cy, v.co.x); v.co.x = math.cos(a) * wx; v.co.y = cy + math.sin(a) * wy; pin.add([v.index], 1, "REPLACE")

# linen, falling
cl = garm.modifiers.new("cloth", "CLOTH"); st = cl.settings
st.quality = 12; st.mass = .55; st.air_damping = 1
st.tension_stiffness = st.compression_stiffness = 15; st.shear_stiffness = 10; st.bending_stiffness = .6  # linen: soft, rounded folds, not crumpled paper
st.vertex_group_mass = "pin"; st.pin_stiffness = 1
cs = cl.collision_settings; cs.distance_min = .006; cs.use_self_collision = True; cs.self_distance_min = .005; cs.collision_quality = 5
bpy.context.scene.frame_start = 1; bpy.context.scene.frame_end = 170
cl.point_cache.frame_end = 170
before = [v.co.copy() for v in garm.data.vertices]
for f in range(1, 171): bpy.context.scene.frame_set(f)
ev2 = garm.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
moved = sorted((ev2.vertices[i].co - before[i]).length for i in range(len(before)))
print("MOVED median %.3f max %.3f" % (moved[len(moved) // 2], moved[-1]))
bpy.context.view_layer.objects.active = garm; bpy.ops.object.select_all(action="DESELECT"); garm.select_set(True)
bpy.ops.object.modifier_apply(modifier="cloth")
print("SETTLED", len(garm.data.vertices), "verts")

# the free edges of the armholes settle ragged (each edge point on its own): run each along its neighbours a few times
# so the openings are clean curves, as a hemmed edge is
bm = bmesh.new(); bm.from_mesh(garm.data); bm.verts.ensure_lookup_table()
edge = [v for v in bm.verts if v.is_boundary and v.co.z > waist_z + .03 and v.co.z < shoulder_z - .02]
for _ in range(12):
    new = {}
    for v in edge:
        nb = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
        if len(nb) == 2: new[v] = v.co * .4 + (nb[0].co + nb[1].co) * .3
    for v, co in new.items(): v.co = co
bm.to_mesh(garm.data); bm.free()

# smooth it a touch, then once more as a subdivided surface, so the folds are round
sm = garm.modifiers.new("sm", "CORRECTIVE_SMOOTH"); sm.factor = .3; sm.iterations = 3; bpy.ops.object.modifier_apply(modifier="sm")
sd = garm.modifiers.new("sd", "SUBSURF"); sd.levels = 1; sd.render_levels = 1; bpy.ops.object.modifier_apply(modifier="sd")

# weights: each point of the cloth takes the skin's weights at the nearest point of the body; below the hips the
# cloth hangs more from the pelvis than from each leg, so a stride swings the hem instead of splitting it
bpy.data.objects.remove(col)
src_pts = []  # (position, {group: weight}) for every vertex of the skin
for o in skin:
    nm = {g.index: g.name for g in o.vertex_groups}
    for v in o.data.vertices: src_pts.append((o.matrix_world @ v.co, {nm[g.group]: g.weight for g in v.groups if g.group in nm}))
for n in sorted({k for _, d in src_pts for k in d}): garm.vertex_groups.new(name=n)
kd = kdtree.KDTree(len(src_pts))
for i, (co, _) in enumerate(src_pts): kd.insert(co, i)
kd.balance()
pelvis_z = W("Bip01_Pelvis").z
for v in garm.data.vertices:
    near = kd.find_n(v.co, 6); acc = {}
    for (co, i, d) in near:
        w = 1 / (d + .01) ** 2
        for k, x in src_pts[i][1].items(): acc[k] = acc.get(k, 0) + x * w
    tot = sum(acc.values()) or 1
    acc = {k: x / tot for k, x in acc.items()}
    if v.co.z < pelvis_z:  # the skirt: mostly the pelvis
        t = min(1, (pelvis_z - v.co.z) / .25) * .6
        acc = {k: x * (1 - t) for k, x in acc.items()}; acc[PELVIS] = acc.get(PELVIS, 0) + t
    for k, x in sorted(acc.items(), key=lambda kv: -kv[1])[:4]:
        if x > .01: garm.vertex_groups[k].add([v.index], x, "REPLACE")
garm.vertex_groups.remove(garm.vertex_groups["pin"])
garm.parent = arm; garm.matrix_parent_inverse = arm.matrix_world.inverted()
am = garm.modifiers.new("Armature", "ARMATURE"); am.object = arm
mat = bpy.data.materials.new("linen"); mat.diffuse_color = (.9, .86, .78, 1); garm.data.materials.append(mat)
for p in garm.data.polygons: p.use_smooth = True

if len(args) > 3:  # a picture to check the drape: front and side, the body and the cloth
    sc = bpy.context.scene; sc.render.engine = "BLENDER_WORKBENCH"; sc.display.shading.light = "STUDIO"; sc.display.shading.color_type = "MATERIAL"
    sc.render.resolution_x, sc.render.resolution_y = 640, 900
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 50
    for tag, pos in (("front", (0, -4.2, 1.0)), ("side", (4.2, 0, 1.0)), ("back", (0, 4.2, 1.0))):
        cam.location = pos; d = Vector((0, 0, 1.0)) - Vector(pos); cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = args[3] + "_" + tag + ".png"; bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action="DESELECT"); arm.select_set(True); garm.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_skins=True, export_animations=False, export_morph=False)
print("EXPORTED", out)
