# Tile PNG renders into one contact sheet. Run: Blender -b --python contact.py -- out.png cols a.png b.png ...
import bpy, sys, numpy as np
args = sys.argv[sys.argv.index("--") + 1:]
out, cols, files = args[0], int(args[1]), args[2:]
ims = []
for f in files:
    im = bpy.data.images.load(f); w, h = im.size
    ims.append(np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4))
h, w = ims[0].shape[:2]; rows = (len(ims) + cols - 1) // cols
sheet = np.zeros((rows * h, cols * w, 4), np.float32); sheet[..., 3] = 1
for i, a in enumerate(ims):
    r, c = divmod(i, cols); r = rows - 1 - r  # Blender images are stored bottom-up
    sheet[r * h:(r + 1) * h, c * w:(c + 1) * w] = a
img = bpy.data.images.new("sheet", cols * w, rows * h); img.pixels = sheet.ravel(); img.filepath_raw = out; img.file_format = "PNG"; img.save()
print("SHEET", out)
