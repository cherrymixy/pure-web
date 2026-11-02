"""NVIDIA SimReady (OpenUSD) → web/MuJoCo 에셋 변환.

  python -I scripts/simready/convert.py --cache <download dir> [asset_id ...]

필요 패키지: usd-core trimesh pillow numpy coacd (requirements.txt)
목록은 scripts/simready/assets.json. 결과물:
  public/assets/simready/<id>/model.glb   시각용 (glTF Y-up, 텍스처 ≤1024)
  public/assets/simready/<id>/col_NN.stl  충돌용 볼록 조각 (MuJoCo Z-up, m)
  public/assets/simready/<id>/thumb.png   라이브러리 썸네일
  data/simready-assets.ts                 카탈로그 (생성 파일)
원점은 바운딩박스 바닥 중앙. 라이선스 CC BY 4.0 (NVIDIA SimReady).
"""

import argparse
import io
import json
import os
import sys
import urllib.request
from pathlib import Path

import coacd
import numpy as np
import trimesh
from PIL import Image
from pxr import Gf, Usd, UsdGeom, UsdPhysics, UsdShade

ROOT = Path(__file__).resolve().parents[2]
LIST = Path(__file__).with_name("assets.json")
OUT = ROOT / "public/assets/simready"
CATALOG = ROOT / "data/simready-assets.ts"
REPO = "nvidia/simready-assets"
HF = f"https://huggingface.co/datasets/{REPO}"
API = f"https://huggingface.co/api/datasets/{REPO}/tree/main"

TEX_MAX = 1024
BIG_TEXTURE = 4_000_000  # 이보다 큰 원본 텍스처는 HF 의 512 썸네일로 대체
HULLS = {"prop": 8, "stage": 24}


# ---------- download ----------

def tree(path):
    out = []
    for x in json.load(urllib.request.urlopen(f"{API}/{path}")):
        if x["type"] == "directory":
            out += tree(x["path"])
        else:
            out.append((x["path"], x.get("size") or 0))
    return out


def fetch(rel, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        urllib.request.urlretrieve(f"{HF}/resolve/main/{rel}", dest)


def download(asset_id, cache):
    files = dict(tree(asset_id))
    base = f"{asset_id}/simready_usd/"
    for rel, size in files.items():
        sub = rel[len(base):] if rel.startswith(base) else None
        if sub is None:
            if rel.endswith("LICENSE.txt"):
                fetch(rel, cache / rel)
            continue
        if sub.startswith(("runnables/", "source_assets/", ".")):
            continue
        if sub.endswith((".usd", ".usda", ".usdc")):
            fetch(rel, cache / rel)
        elif sub.startswith("Textures/") and sub.count("/") == 1 and sub.endswith(".png"):
            name = sub.split("/")[1]
            thumb = f"{base}Textures/.thumbs/512x512/{name}.png"
            src = thumb if size > BIG_TEXTURE and thumb in files else rel
            fetch(src, cache / rel)
    thumbs = [r for r in files if r.startswith(f"{base}.thumbs/256x256/")]
    pick = (
        [r for r in thumbs if r.endswith("_transparent.png")]
        or [r for r in thumbs if not r.endswith("_light.png")]
    )
    if pick:
        fetch(pick[0], cache / asset_id / "thumb.png")
    roots = json.loads(
        urllib.request.urlopen(f"{HF}/resolve/main/{asset_id}/.metadata/com.nvidia.simready.root_usds.json").read()
    )["entries"]
    return cache / asset_id / roots[0]


# ---------- USD → meshes ----------

def to_np(m):
    return np.array([[m[i][j] for j in range(4)] for i in range(4)])


def texture_inputs(material):
    """Material 아래 UsdUVTexture / OmniPBR 입력에서 텍스처·상수·UV 변환을 모은다."""
    tex, const, uvx = {}, {}, None
    for p in Usd.PrimRange(material.GetPrim(), Usd.TraverseInstanceProxies()):
        if not p.IsA(UsdShade.Shader):
            continue
        sh = UsdShade.Shader(p)
        sid = sh.GetIdAttr().Get() or ""
        vals = {i.GetBaseName(): i.Get() for i in sh.GetInputs()}
        f = vals.get("file")
        if f is not None and f.resolvedPath:
            path = f.resolvedPath
            low = os.path.basename(path).lower()
            if "_alb" in low or "albedo" in low or "basecolor" in low or "diff" in low:
                tex.setdefault("alb", path)
            elif "_orm" in low:
                tex.setdefault("orm", path)
            elif "_nor" in low or "normal" in low:
                tex.setdefault("nor", path)
        if sid == "UsdTransform2d":
            uvx = (vals.get("scale"), vals.get("translation"), vals.get("rotation"))
        if sid == "UsdPreviewSurface" or p.GetName() == "Principled_BSDF":
            for k in ("diffuseColor", "metallic", "roughness", "opacity"):
                if vals.get(k) is not None:
                    const.setdefault(k, vals[k])
        for k in ("diffuse_color_constant", "metallic_constant", "reflection_roughness_constant"):
            if vals.get(k) is not None:
                const.setdefault(k, vals[k])
        for k in ("diffuse_texture", "ORM_texture", "normalmap_texture"):
            v = vals.get(k)
            if v is not None and v.resolvedPath:
                tex.setdefault({"diffuse_texture": "alb", "ORM_texture": "orm", "normalmap_texture": "nor"}[k], v.resolvedPath)
    return tex, const, uvx


def load_image(path, mode):
    im = Image.open(path).convert(mode)
    if max(im.size) > TEX_MAX:
        im.thumbnail((TEX_MAX, TEX_MAX), Image.LANCZOS)
    return im


def as_jpeg(im):
    buf = io.BytesIO()
    im.convert("RGB").save(buf, "JPEG", quality=88)
    buf.seek(0)
    return Image.open(buf)


MAT_CACHE = {}


def pbr(material):
    key = str(material.GetPath()) if material else None
    if key in MAT_CACHE:
        return MAT_CACHE[key]
    if not material:
        m = trimesh.visual.material.PBRMaterial(baseColorFactor=[200, 200, 200, 255], metallicFactor=0, roughnessFactor=0.7)
        MAT_CACHE[key] = (m, None)
        return MAT_CACHE[key]
    tex, const, uvx = texture_inputs(material)
    kw = {"name": material.GetPrim().GetName(), "doubleSided": False}
    if "alb" in tex:
        alb = load_image(tex["alb"], "RGBA")
        opaque = alb.getextrema()[3][0] == 255
        kw["baseColorTexture"] = as_jpeg(alb) if opaque else alb
        if not opaque:
            kw["alphaMode"] = "BLEND"
    else:
        c = const.get("diffuseColor") or const.get("diffuse_color_constant") or (0.8, 0.8, 0.8)
        kw["baseColorFactor"] = [float(c[0]), float(c[1]), float(c[2]), float(const.get("opacity", 1.0))]
    if "orm" in tex:
        orm = as_jpeg(load_image(tex["orm"], "RGB"))
        kw["metallicRoughnessTexture"] = orm
        kw["occlusionTexture"] = orm
        kw["metallicFactor"], kw["roughnessFactor"] = 1.0, 1.0
    else:
        kw["metallicFactor"] = float(const.get("metallic", const.get("metallic_constant", 0.0)))
        kw["roughnessFactor"] = float(const.get("roughness", const.get("reflection_roughness_constant", 0.6)))
    if "nor" in tex:
        kw["normalTexture"] = load_image(tex["nor"], "RGB")
    MAT_CACHE[key] = (trimesh.visual.material.PBRMaterial(**kw), uvx)
    return MAT_CACHE[key]


def apply_uvx(uv, uvx):
    if not uvx:
        return uv
    scale, trans, rot = uvx
    out = uv.copy()
    if scale is not None:
        out = out * np.array([scale[0], scale[1]])
    if rot:
        r = np.radians(rot)
        c, s = np.cos(r), np.sin(r)
        out = out @ np.array([[c, s], [-s, c]])
    if trans is not None:
        out = out + np.array([trans[0], trans[1]])
    return out


def mesh_parts(stage):
    """(vertices[Z-up m], faces, uv|None, material) 조각들. 렌더 대상 Mesh 만."""
    mpu = UsdGeom.GetStageMetersPerUnit(stage) or 1.0
    y_up = UsdGeom.GetStageUpAxis(stage) == UsdGeom.Tokens.y
    cache = UsdGeom.XformCache()
    parts, collide = [], []
    for p in Usd.PrimRange.Stage(stage, Usd.TraverseInstanceProxies()):
        if not p.IsA(UsdGeom.Mesh):
            continue
        img = UsdGeom.Imageable(p)
        if img.ComputeVisibility() == UsdGeom.Tokens.invisible:
            continue
        purpose = img.ComputePurpose()
        mesh = UsdGeom.Mesh(p)
        pts = np.array(mesh.GetPointsAttr().Get() or [], dtype=np.float64)
        counts = np.array(mesh.GetFaceVertexCountsAttr().Get() or [], dtype=np.int64)
        idx = np.array(mesh.GetFaceVertexIndicesAttr().Get() or [], dtype=np.int64)
        if len(pts) == 0 or len(counts) == 0:
            continue
        M = to_np(cache.GetLocalToWorldTransform(p))
        world = (np.c_[pts, np.ones(len(pts))] @ M)[:, :3] * mpu
        if y_up:
            world = world[:, [0, 2, 1]] * np.array([1, -1, 1])
        flip = mesh.GetOrientationAttr().Get() == UsdGeom.Tokens.leftHanded
        if np.linalg.det(M[:3, :3]) < 0:
            flip = not flip

        # corner(면-꼭짓점) 단위 UV
        pv = UsdGeom.PrimvarsAPI(p).GetPrimvar("st")
        uv_corner = None
        if pv and pv.HasValue():
            vals = np.array(pv.ComputeFlattened(), dtype=np.float64)
            interp = pv.GetInterpolation()
            if interp == UsdGeom.Tokens.faceVarying and len(vals) == len(idx):
                uv_corner = vals
            elif interp in (UsdGeom.Tokens.vertex, UsdGeom.Tokens.varying) and len(vals) == len(pts):
                uv_corner = vals[idx]

        # 삼각화 (fan)
        starts = np.r_[0, np.cumsum(counts)[:-1]]
        tri_corners = []
        face_of_tri = []
        for fi, (s, n) in enumerate(zip(starts, counts)):
            for k in range(1, n - 1):
                tri = (s, s + k + 1, s + k) if flip else (s, s + k, s + k + 1)
                tri_corners.append(tri)
                face_of_tri.append(fi)
        tri_corners = np.array(tri_corners, dtype=np.int64)
        face_of_tri = np.array(face_of_tri, dtype=np.int64)

        if p.HasAPI(UsdPhysics.CollisionAPI) or purpose == UsdGeom.Tokens.guide:
            collide.append(trimesh.Trimesh(world, idx[tri_corners], process=True))
        if purpose not in (UsdGeom.Tokens.default_, UsdGeom.Tokens.render):
            continue

        binding = UsdShade.MaterialBindingAPI(p)
        groups = []
        subsets = binding.GetMaterialBindSubsets()
        if subsets:
            for sub in subsets:
                faces = np.array(sub.GetIndicesAttr().Get() or [], dtype=np.int64)
                mat = UsdShade.MaterialBindingAPI(sub.GetPrim()).ComputeBoundMaterial()[0]
                groups.append((np.isin(face_of_tri, faces), mat))
        else:
            groups.append((np.ones(len(tri_corners), bool), binding.ComputeBoundMaterial()[0]))

        for mask, mat in groups:
            tc = tri_corners[mask]
            if len(tc) == 0:
                continue
            flat = tc.reshape(-1)
            verts = world[idx[flat]]
            faces = np.arange(len(flat)).reshape(-1, 3)
            uv = uv_corner[flat] if uv_corner is not None else None
            parts.append((verts, faces, uv, mat if mat else None))
    return parts, collide


# ---------- physics ----------

def physics(stage):
    dp = stage.GetDefaultPrim()
    vset = dp.GetVariantSets()
    if vset.HasVariantSet("MuJoCo"):
        vset.GetVariantSet("MuJoCo").SetVariantSelection("Enabled")
    mass, friction = 0.0, None
    for p in Usd.PrimRange.Stage(stage, Usd.TraverseInstanceProxies()):
        if p.HasAPI(UsdPhysics.MassAPI):
            m = UsdPhysics.MassAPI(p).GetMassAttr().Get()
            if m:
                mass += float(m)
        if friction is None and p.HasAPI(UsdPhysics.MaterialAPI):
            f = UsdPhysics.MaterialAPI(p).GetDynamicFrictionAttr().Get()
            if f:
                friction = float(f)
    return mass, friction or 0.5


# ---------- main ----------

def convert(entry, cache):
    aid = entry["id"]
    print(f"[{aid}] download", flush=True)
    root_usd = download(aid, cache)
    stage = Usd.Stage.Open(str(root_usd))
    mass, friction = physics(stage)
    parts, collide = mesh_parts(stage)
    if not parts:
        raise RuntimeError("no render meshes")

    allv = np.vstack([v for v, *_ in parts])
    lo, hi = allv.min(0), allv.max(0)
    offset = np.array([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]])
    dims = hi - lo

    out = OUT / aid
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("col_*.stl"):
        f.unlink()

    # 시각 GLB (Y-up: x, z, -y)
    scene = trimesh.Scene()
    for i, (v, f, uv, mat) in enumerate(parts):
        v = v - offset
        vy = np.c_[v[:, 0], v[:, 2], -v[:, 1]]
        material, uvx = pbr(mat)
        visual = None
        if uv is not None:
            uvt = apply_uvx(uv, uvx)
            visual = trimesh.visual.TextureVisuals(uv=uvt, material=material)
        else:
            visual = trimesh.visual.TextureVisuals(material=material)
        m = trimesh.Trimesh(vy, f, visual=visual, process=False)
        m.merge_vertices()
        scene.add_geometry(m, node_name=f"part_{i:02d}")
    (out / "model.glb").write_bytes(scene.export(file_type="glb"))

    # 충돌 (Z-up, 바닥 중앙 원점). 충돌 메시가 따로 없으면 시각 메시 사용
    src = collide or [trimesh.Trimesh(v, f, process=True) for v, f, *_ in parts]
    whole = trimesh.util.concatenate([m.copy() for m in src])
    whole.apply_translation(-offset)
    whole.merge_vertices()
    hulls = coacd.run_coacd(
        coacd.Mesh(whole.vertices, whole.faces),
        threshold=0.08 if entry["role"] == "prop" else 0.05,
        max_convex_hull=HULLS[entry["role"]],
        max_ch_vertex=48,
        preprocess_mode="auto",
    )
    cols = []
    for i, (hv, hf) in enumerate(hulls):
        h = trimesh.Trimesh(hv, hf).convex_hull
        if h.volume <= 1e-9:
            continue
        name = f"col_{i:02d}.stl"
        h.export(out / name)
        cols.append(name)

    if mass <= 0:
        mass = float(whole.convex_hull.volume * 500)

    thumb = cache / aid / "thumb.png"
    if thumb.exists():
        im = Image.open(thumb).convert("RGBA")
        im.thumbnail((256, 256), Image.LANCZOS)
        im.save(out / "thumb.png", optimize=True)

    lic = cache / aid / ".metadata/LICENSE.txt"
    license_ok = lic.exists() and "Attribution 4.0" in lic.read_text(errors="ignore")
    size = sum(f.stat().st_size for f in out.iterdir())
    print(f"[{aid}] {len(parts)} parts, {len(cols)} hulls, {mass:.2f} kg, dims {np.round(dims, 3)}, {size/1e6:.1f} MB", flush=True)
    return {
        **entry,
        "dims": [round(float(d), 4) for d in dims],
        "mass": round(mass, 4),
        "friction": round(friction, 3),
        "collision": cols,
        "license": "CC-BY-4.0" if license_ok else "UNKNOWN",
    }


def write_catalog(items):
    body = json.dumps(items, indent=2, ensure_ascii=False)
    CATALOG.write_text(
        "// GENERATED by scripts/simready/convert.py — 직접 수정 금지.\n"
        "// Source: NVIDIA SimReady (huggingface.co/datasets/nvidia/simready-assets), CC BY 4.0.\n"
        "\n"
        "export type SimReadyAsset = {\n"
        "  id: string;\n"
        "  name: string;\n"
        '  category: "furniture" | "object";\n'
        '  /** stage = 무대(가구), prop = 로봇과 상호작용하는 소품 */\n'
        '  role: "stage" | "prop";\n'
        "  /** 바운딩박스 [x, y, z] m (MuJoCo Z-up) */\n"
        "  dims: [number, number, number];\n"
        "  mass: number;\n"
        "  friction: number;\n"
        "  /** public/assets/simready/<id>/ 아래 볼록 조각 STL */\n"
        "  collision: string[];\n"
        "  license: string;\n"
        "};\n"
        "\n"
        'export const SIMREADY_BASE = "/assets/simready";\n'
        'export const SIMREADY_CREDIT = "3D assets: NVIDIA SimReady (CC BY 4.0)";\n'
        "\n"
        f"export const SIMREADY_ASSETS: SimReadyAsset[] = {body};\n"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", required=True, type=Path)
    ap.add_argument("ids", nargs="*")
    args = ap.parse_args()
    entries = json.loads(LIST.read_text())
    prev = {}
    if CATALOG.exists() and args.ids:
        txt = CATALOG.read_text()
        prev = {a["id"]: a for a in json.loads(txt[txt.index("= [") + 2 : txt.rindex(";")])}
    items = []
    for e in entries:
        if args.ids and e["id"] not in args.ids:
            if e["id"] in prev:
                items.append({**prev[e["id"]], **e})
            continue
        MAT_CACHE.clear()
        items.append(convert(e, args.cache))
    write_catalog(items)


if __name__ == "__main__":
    sys.exit(main())
