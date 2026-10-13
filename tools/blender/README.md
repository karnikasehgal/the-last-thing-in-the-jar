# Blender character pipeline

Turns a Blender character rig (e.g. Blender Studio's Rain or Snow, CC-BY) into a game-ready GLB for three.js.

    B=~/Applications/Blender.app/Contents/MacOS/Blender
    $B -b --disable-autoexec rig.blend --python inspect.py            # what's in the file
    $B -b --disable-autoexec rig.blend --python materials.py          # what drives each material's colour
    $B -b --disable-autoexec rig.blend --python export_rig.py -- out.glb RIG-name _nomask eyes_viewport cornea eye_dots
    python3 fix_glb.py out.glb game.glb                                # drop texture slots whose image failed to export

export_rig.py keeps only the deforming bones, drops Blender-only deformers (lattices, smoothing, subdivision, masks),
applies mirror modifiers, and bakes every material's final colour into a plain texture (bake_colors.py) so the colours
survive export. Tiled (UDIM) skin textures are written next to the export as bake-<name>/BAKE-*.100N.png; the loader
attaches them to the matching body.100N materials.

Credit when used: "Rain Rig (CC) Blender Foundation | studio.blender.org" (likewise for Snow).
