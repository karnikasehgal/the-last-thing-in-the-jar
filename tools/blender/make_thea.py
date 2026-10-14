# Build Thea as a bare, realistic body with MPFB (MakeHuman for Blender, CC0 assets) and export her as a GLB for the game.
#   ~/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup=0 --python make_thea.py -- out.glb
# The MPFB extension must be installed and enabled, with the MakeHuman system assets and Skins 01 in its data folder.
# She gets the game-engine skeleton (its bones are renamed in the game), and shape keys for blinking and talking made
# from MakeHuman's own expression units, carried over to the eyelashes and brows, named as the game's faces expect.
import bpy, sys, os
import numpy as np

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/thea.glb"
mpfb = sys.modules.get("bl_ext.user_default.mpfb")
if mpfb is None:
    import addon_utils
    addon_utils.enable("bl_ext.user_default.mpfb", default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.faceservice import FaceService
from bl_ext.user_default.mpfb.services.exportservice import ExportService
from bl_ext.user_default.mpfb.services.locationservice import LocationService

DATA = "/Users/karnikasehgal/Library/Application Support/Blender/5.4/extensions/.user/user_default/mpfb/data"
UNITS = os.path.join(os.path.dirname(sys.modules["bl_ext.user_default.mpfb"].__file__), "data/targets/expression/units/caucasian")

for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

# a young woman of about 23, petite, slim and shapely
info = HumanService._create_default_human_info_dict()
info["phenotype"] = {"gender": 0.0, "age": 0.5, "muscle": 0.42, "weight": 0.38, "proportions": 1.0, "height": 0.35, "cupsize": 0.6, "firmness": 0.75,
                     "race": {"caucasian": 0.9, "asian": 0.05, "african": 0.05}}
info["targets"] = [{"target": t, "value": v} for t, v in [
    ("measure-waist-circ-decr", .45), ("stomach-pregnant-decr", 1.0), ("hip-scale-horiz-incr", .12), ("measure-shoulder-dist-decr", .15),
    ("l-eye-scale-incr", .3), ("r-eye-scale-incr", .3), ("neck-scale-horiz-decr", .2),
    # a soft, young face: an oval head, a narrower chin, fuller lips with the corners lifted, a small neat nose, high cheekbones
    ("head-oval", .4), ("head-age-decr", .3), ("chin-width-decr", .3), ("mouth-upperlip-volume-incr", .35), ("mouth-lowerlip-volume-incr", .3),
    ("mouth-angles-up", .25), ("mouth-cupidsbow-incr", .3), ("nose-scale-horiz-decr", .2), ("nose-point-up", .2), ("nose-volume-decr", .2),
    ("l-cheek-bones-incr", .2), ("r-cheek-bones-incr", .2), ("l-eye-height2-incr", .2), ("r-eye-height2-incr", .2),
    # (she is only ever seen dressed: no nipples to show through a fitted bodice)
    ("nipple-point-decr", 1.0), ("nipple-size-decr", .6), ("breast-point-decr", .7)]]
info["rig"] = "game_engine"
info["eyes"] = "low-poly/low-poly.mhclo"
info["eyebrows"] = "eyebrow010/eyebrow010.mhclo"
info["eyelashes"] = "eyelashes02/eyelashes02.mhclo"
info["teeth"] = "teeth_base/teeth_base.mhclo"
info["tongue"] = "tongue01/tongue01.mhclo"
info["hair"] = "bob02/bob02.mhclo"
info["skin_material_type"] = "NONE"
settings = HumanService.get_default_deserialization_settings()
settings.update({"subdiv_levels": 0, "load_clothes": False})
body = HumanService.deserialize_from_dict(info, settings)
rig = body.parent
print("BODY", body.name, "RIG", rig and rig.name, [c.name for c in rig.children])

# fold the body's shape into the mesh, then add the face's moving shapes on top
TargetService.bake_targets(body)
unit = {}
for n in ["eye-left-closure", "eye-right-closure", "mouth-open", "mouth-retraction", "mouth-pursing", "mouth-protusion", "mouth-compression",
          "mouth-corner-puller", "eyebrows-left-inner-up", "eyebrows-right-inner-up", "mouth-depression"]:
    unit[n] = TargetService.load_target(body, os.path.join(UNITS, n + ".target.gz"), weight=0.0, name="u_" + n)
# each game shape is a mix of units; made under a borrowed ARKit/viseme name so MPFB carries it to the lashes and brows
MIX = {
    "eyeBlinkLeft": ("AK_09_EyeBlinkLeft", {"eye-left-closure": 1}),
    "eyeBlinkRight": ("AK_10_EyeBlinkRight", {"eye-right-closure": 1}),
    "jawOpen": ("AK_25_JawOpen", {"mouth-open": .8}),
    "browInnerUp": ("AK_03_BrowInnerUp", {"eyebrows-left-inner-up": .8, "eyebrows-right-inner-up": .8}),
    "mouthSmileLeft": ("AK_44_MouthSmileLeft", {"mouth-corner-puller": .45}),
    "mouthSmileRight": ("AK_45_MouthSmileRight", {"mouth-corner-puller": .45}),
    "aa_02": ("AA_VI_10_aa", {"mouth-open": .55}),
    "ey_eh_uh_04": ("AA_VI_11_E", {"mouth-open": .25, "mouth-retraction": .5}),
    "ow_08": ("AA_VI_13_O", {"mouth-open": .35, "mouth-pursing": .55}),
    "y_iy_ih_ix_06": ("AA_VI_12_I", {"mouth-open": .12, "mouth-retraction": .6}),
    "w_uw_07": ("AA_VI_14_U", {"mouth-pursing": .7, "mouth-protusion": .3}),
    "p_b_m_21": ("AA_VI_01_PP", {"mouth-compression": .6}),
    "s_z_15": ("AA_VI_07_SS", {"mouth-retraction": .4, "mouth-open": .06}),
    "f_v_18": ("AA_VI_02_FF", {"mouth-depression": .4, "mouth-open": .08}),
}
for tmp, (final, mix) in MIX.items():
    for k in body.data.shape_keys.key_blocks: k.value = 0  # (each mix from the units alone, never from the mixes made before it)
    for n, v in mix.items(): unit[n].value = v
    body.shape_key_add(name=tmp, from_mix=True).value = 0
for k in body.data.shape_keys.key_blocks: k.value = 0
for k in list(unit.values()): body.shape_key_remove(k)
FaceService.interpolate_targets(body)
ExportService.bake_modifiers_remove_helpers(body, bake_masks=False, remove_helpers=True, also_proxy=False)
meshes = [c for c in rig.children if c.type == "MESH"]
for m in meshes:
    if m.data.shape_keys:
        for kb in m.data.shape_keys.key_blocks:
            if kb.name in MIX: kb.name = MIX[kb.name][0]
            kb.value = 0
    for mod in list(m.modifiers):
        if mod.type != "ARMATURE": m.modifiers.remove(mod)
    print("MESH", m.name, len(m.data.vertices), len(m.data.polygons), m.data.shape_keys and [k.name for k in m.data.shape_keys.key_blocks])

# The bob's long side fringe hangs over her right eye: sweep it aside to the temple, swinging each strand about the
# parting (the lower, the further), then keep every strand just clear of the skin.
import mathutils
from mathutils.bvhtree import BVHTree
hair = next(m for m in meshes if "bob" in m.name)
eyes = next(m for m in meshes if "low-poly" in m.name)
if hair.data.shape_keys: hair.shape_key_clear()
ev = [eyes.matrix_world @ v.co for v in eyes.data.vertices]
re = [v for v in ev if v.x < 0]; eye = sum(re, mathutils.Vector()) / len(re)  # her right eye (Blender: -x is her right, -y her front)
front = min(v.y for v in ev)
dg = bpy.context.evaluated_depsgraph_get(); bm_body = body.evaluated_get(dg)
bvh = BVHTree.FromObject(bm_body, dg)
pivot = mathutils.Vector((eye.x + .045, eye.y, eye.z + .085))  # the parting, above the inner corner of the eye
SWEEP = .42  # radians, for a strand that reaches the eye
def ss(e0, e1, x): t = min(1.0, max(0.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
moved = 0
inv = hair.matrix_world.inverted()
for v in hair.data.vertices:
    p = hair.matrix_world @ v.co
    # how much of this is fringe: in front of the face, below the parting, on her right (soft edges, so nothing tears)
    w = ss(front + .07, front + .02, p.y) * ss(pivot.z + .02, pivot.z - .02, p.z) * ss(pivot.x + .06, pivot.x + .01, p.x)
    if w <= 0: continue
    d = p - pivot; drop = min(1.0, max(0.0, -d.z / .085)); a = SWEEP * w * drop * drop * (3 - 2 * drop)
    c, s_ = np.cos(a), np.sin(a)
    q = mathutils.Vector((pivot.x + d.x * c + d.z * s_, p.y, pivot.z - d.x * s_ + d.z * c))
    # and laid back against the head (swung out, it stood off the temple like a wing)
    hit = bvh.find_nearest(q)
    if hit[0] is not None:
        gap = (q - hit[0]).dot(hit[1]); lim = .006 + (1 - w) * .03
        if gap > lim: q = q - hit[1] * (gap - lim)
    v.co = inv @ q; moved += 1
for v in hair.data.vertices:  # clear of the skin by a few millimetres
    p = hair.matrix_world @ v.co; hit = bvh.find_nearest(p)
    if hit[0] is None: continue
    loc, nrm = hit[0], hit[1]; gap = (p - loc).dot(nrm)
    if gap < .004: v.co = inv @ (p + nrm * (.004 - gap))
print("FRINGE", moved, "eye", tuple(round(x, 3) for x in eye))

# plain materials the glTF exporter carries over exactly: an image, a roughness
def image(path):
    return bpy.data.images.load(path, check_existing=True)
def recolor(img, rgb, gain=1.0):
    # keep the strands' light and shade (and alpha), replace their colour: auburn
    w, h = img.size; px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    lum = px[:, :3] @ np.array([.2126, .7152, .0722], dtype=np.float32); a = px[:, 3] > .3
    mean = lum[a].mean() if a.any() else .2
    s = np.clip(lum / mean, .25, 2.2) * gain
    px[:, :3] = np.clip(np.outer(s, rgb), 0, 1)
    new = bpy.data.images.new(img.name + "_auburn", w, h, alpha=True); new.pixels.foreach_set(px.ravel()); new.pack(); return new
def material(name, img, rough=.6, alpha=False, spec=.5):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    if alpha:
        nt.links.new(t.outputs["Alpha"], bsdf.inputs["Alpha"])
        try: m.surface_render_method = "DITHERED"
        except Exception: pass
    bsdf.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in bsdf.inputs: bsdf.inputs["Specular IOR Level"].default_value = spec
    return m
def asset(*p): return os.path.join(DATA, *p)
AUBURN = np.array([.2, .065, .03], dtype=np.float32)  # linear: a deep copper-brown
mats = {
    "body": material("skin_body", image(asset("skins/toigo_light_skin_female_ginger_with_makeup/young_lightskinned_female_diffuse_Ginger_Makeup.png")), .5),
    "eyes": material("eyes", image(asset("eyes/materials/brownlight_eye.png")), .15),
    "eyebrows": material("brows", recolor(image(asset("eyebrows/eyebrow010/eyebrow010.png")), AUBURN * .8), .7, True),
    "eyelashes": material("lashes", recolor(image(asset("eyelashes/eyelashes02/eyelashes02.png")), np.array([.03, .015, .01], dtype=np.float32)), .7, True),
    "teeth": material("teeth", image(asset("teeth/teeth_base/teeth.png")), .3),
    "tongue": material("tongue", image(asset("tongue/tongue01/tongue01_diffuse.png")), .4),
    "hair": material("hair", recolor(image(asset("hair/bob02/bob02_diffuse.png")), AUBURN, 1.15), .42, True, .7),
}
for m in meshes:
    n = m.name.lower()
    key = "body" if m == body else next((k for k, t in [("hair", "bob"), ("eyebrows", "eyebrow"), ("eyelashes", "eyelash"), ("eyes", "low-poly"), ("teeth", "teeth"), ("tongue", "tongue")] if t in n), None)
    print("MAT", m.name, key)
    if key:
        m.data.materials.clear(); m.data.materials.append(mats[key])
    m.name = "thea_" + (key or m.name)

# petite, but a grown woman beside the others: 1.60 m to the top of her head
bpy.context.view_layer.update()
k = 1.60 / max((body.matrix_world @ v.co).z for v in body.data.vertices)
print("SCALE", k)
bpy.ops.object.select_all(action="DESELECT")
for o in [rig] + meshes: o.select_set(True)
bpy.context.view_layer.objects.active = rig
rig.scale = (k, k, k)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.select_all(action="DESELECT")
rig.select_set(True)
for m in meshes: m.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_skins=True, export_morph=True, export_morph_normal=False,
                          export_animations=False, export_yup=True, export_apply=False)
print("EXPORTED", out, os.path.getsize(out))
