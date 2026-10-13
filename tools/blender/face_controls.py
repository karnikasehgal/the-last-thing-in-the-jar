# List a rig's animator controls (the bones an animator moves, not the deform/mechanism ones), with any custom
# properties, so we can find the face controls. Run: Blender -b --disable-autoexec rig.blend --python face_controls.py -- RIG-name
import bpy, sys
rig = bpy.data.objects[sys.argv[sys.argv.index("--") + 1]]
skip = ("DEF-", "MCH-", "ORG-", "WGT-", "COR-", "TGT-", "P-", "VIS-", "STR-")
names = [b.name for b in rig.pose.bones if not b.name.startswith(skip)]
print("CONTROLS", len(names))
for n in names:
    pb = rig.pose.bones[n]
    props = [k for k in pb.keys() if not k.startswith("_")]
    print("CTL", n, "lock_loc" if all(pb.lock_location) else "", props[:6])
