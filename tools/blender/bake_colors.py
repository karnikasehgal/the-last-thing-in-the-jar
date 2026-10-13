# Bake every material's final base colour (whatever shader network makes it) into a plain image texture, and rewire the
# material to use that image, so the glTF exporter carries the real colours. Import and call bake(objects, outdir, size).
import bpy, os

def bake(objs, outdir, size=1024):
    os.makedirs(outdir, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"; sc.cycles.samples = 1; sc.cycles.device = "CPU"
    sc.render.bake.use_selected_to_active = False; sc.render.bake.margin = 8
    done = {}
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not m or not m.use_nodes or m.name in done: continue
            nt = m.node_tree
            bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
            out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output), None) or next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
            if not bsdf or not out or not bsdf.inputs["Base Color"].is_linked: done[m.name] = None; continue
            src = bsdf.inputs["Base Color"].links[0].from_socket
            tiled = any(n.type == "TEX_IMAGE" and n.image and n.image.source == "TILED" for n in nt.nodes)
            name = "BAKE-" + m.name
            img = bpy.data.images.new(name, size, size, alpha=False, tiled=tiled)
            if tiled:
                for t in (1002, 1003): img.tiles.new(tile_number=t)
                for t in img.tiles:
                    with bpy.context.temp_override(edit_image=img):
                        img.tiles.active = t
                        bpy.ops.image.tile_fill(color=(0, 0, 0, 1), width=size, height=size, generated_type="BLANK", float=False, alpha=False)
            tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img; tex.name = "BAKE"
            emit = nt.nodes.new("ShaderNodeEmission"); nt.links.new(src, emit.inputs["Color"])
            surf = out.inputs["Surface"].links[0].from_socket if out.inputs["Surface"].is_linked else None
            nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
            for n in nt.nodes: n.select = False
            tex.select = True; nt.nodes.active = tex
            done[m.name] = (m, img, tex, emit, out, surf, bsdf)
    # bake all objects that use a baked material, in one pass
    for x in bpy.data.objects: x.select_set(False)
    for o in objs:
        if any(s.material and done.get(s.material.name) for s in o.material_slots): o.select_set(True)
    bpy.context.view_layer.objects.active = next(o for o in objs if o.select_get())
    bpy.ops.object.bake(type="EMIT")
    # rewire: the baked image becomes the base colour; the original shading output comes back
    for k, v in done.items():
        if not v: continue
        m, img, tex, emit, out, surf, bsdf = v
        nt = m.node_tree
        # replace the whole network with the simplest one the exporter understands: baked colour into a plain surface
        rough = bsdf.inputs["Roughness"].default_value
        for n in list(nt.nodes):
            if n != tex: nt.nodes.remove(n)
        p = nt.nodes.new("ShaderNodeBsdfPrincipled"); o = nt.nodes.new("ShaderNodeOutputMaterial")
        p.inputs["Roughness"].default_value = max(.35, rough)
        nt.links.new(tex.outputs["Color"], p.inputs["Base Color"]); nt.links.new(p.outputs["BSDF"], o.inputs["Surface"])
        img.filepath_raw = os.path.join(outdir, img.name.replace(".", "_") + (".<UDIM>.png" if img.source == "TILED" else ".png"))
        img.file_format = "PNG"; img.save(); img.pack()
        print("BAKED", m.name, img.size[:], "tiled" if img.source == "TILED" else "")
