# Drop texture references whose image never got written (Blender export errors), so three.js can load the file.
import json, struct, sys
src, dst = sys.argv[1], sys.argv[2]
b = open(src, "rb").read()
n = struct.unpack("<I", b[12:16])[0]; j = json.loads(b[20:20 + n]); rest = b[20 + n:]
bad = {i for i, t in enumerate(j.get("textures", [])) if "source" not in t and not t.get("extensions")}
def clean(o):
    if isinstance(o, dict):
        for k in list(o):
            v = o[k]
            if isinstance(v, dict) and "index" in v and k.lower().endswith("texture") and v["index"] in bad: del o[k]; continue
            clean(v)
    elif isinstance(o, list):
        for v in o: clean(v)
for m in j.get("materials", []): clean(m)
print("dropped texture refs:", sorted(bad))
js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((4 - len(js) % 4) % 4)
out = b[:12] + struct.pack("<I", len(js)) + b"JSON" + js + rest
out = out[:8] + struct.pack("<I", len(out)) + out[12:]
open(dst, "wb").write(out)
