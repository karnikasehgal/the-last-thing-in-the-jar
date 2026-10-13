# Run: Blender -b --disable-autoexec <file.blend> --python inspect.py
import bpy
print("=== SCENE", bpy.data.filepath)
for o in bpy.data.objects:
    line = f"{o.type:9s} {o.name:40s} parent={o.parent.name if o.parent else '-':25s} visible={not o.hide_render}"
    if o.type == "MESH":
        m = o.data
        sk = len(m.shape_keys.key_blocks) if m.shape_keys else 0
        mods = ",".join(f"{md.type}" for md in o.modifiers)
        line += f" verts={len(m.vertices)} shapekeys={sk} vgroups={len(o.vertex_groups)} mods=[{mods}] mats={[s.material.name if s.material else None for s in o.material_slots]}"
    if o.type == "ARMATURE":
        b = o.data.bones
        deform = [x.name for x in b if x.use_deform]
        line += f" bones={len(b)} deform={len(deform)}"
    print(line)
for c in bpy.data.collections:
    print("COLL", c.name, [o.name for o in c.objects][:12])
print("ACTIONS", [a.name for a in bpy.data.actions][:20])
