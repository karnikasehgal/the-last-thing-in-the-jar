# Pose face controls and render a close-up, to learn how each control moves the face.
# Run: Blender -b --disable-autoexec rig.blend --python pose_test.py -- out_dir 'Control:loc|rot:x,y,z' ...
import bpy, sys, os, math
from mathutils import Vector, Euler
args = sys.argv[sys.argv.index("--") + 1:]
outdir, tests = args[0], args[1:]
os.makedirs(outdir, exist_ok=True)
rig = bpy.data.objects["RIG-rain"]
sc = bpy.context.scene
# keep only the character's meshes renderable
for o in bpy.data.objects:
    if o.type == "MESH" and (o.parent != rig or "viewport" in o.name or "_nomask" in o.name): o.hide_render = True
# camera on the face
head = rig.pose.bones["DEF-Head"]; hpos = rig.matrix_world @ head.head
cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 85
cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.location = hpos + Vector((0, -0.75, 0.07))
cam.rotation_euler = (math.radians(90), 0, 0)
light = bpy.data.objects.new("key", bpy.data.lights.new("key", "SUN")); light.data.energy = 3; light.rotation_euler = (math.radians(50), 0, math.radians(30)); sc.collection.objects.link(light)
sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_WORKBENCH"
sc.render.resolution_x = 360; sc.render.resolution_y = 360; sc.render.film_transparent = False
if sc.world is None: sc.world = bpy.data.worlds.new("w")
sc.world.color = (.3, .27, .24)
def reset():
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
for i, t in enumerate(["rest"] + tests):
    reset()
    if t != "rest":
        for part in t.split(";"):
            name, kind, vals = part.split(":"); v = [float(x) for x in vals.split(",")]
            pb = rig.pose.bones[name]
            if kind == "loc": pb.location = v
            else: pb.rotation_mode = "XYZ"; pb.rotation_euler = [math.radians(x) for x in v]
    bpy.context.view_layer.update()
    sc.render.filepath = os.path.join(outdir, f"{i:02d}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", i, t)
