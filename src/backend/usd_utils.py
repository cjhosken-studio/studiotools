import os
import sys
import traceback

# Import USD bindings safely
try:
    from pxr import Usd, Sdf, Vt, UsdGeom
    HAS_USD = True
except ImportError:
    HAS_USD = False

def inspect_usd_stage(filepath: str) -> dict:
    """
    Opens a USD stage and extracts its Prim hierarchy, specifiers, active status,
    and attributes to send as a JSON-compatible dict to the web UI.
    """
    if not os.path.exists(filepath):
        return {"error": f"File does not exist: {filepath}"}

    if not HAS_USD:
        # Fallback graceful mock parsing for environments without pxr.Usd installed
        return get_mock_usd_stage(filepath)

    try:
        stage = Usd.Stage.Open(filepath)
        if not stage:
            return {"error": "Failed to open USD Stage."}

        root_prim = stage.GetPseudoRoot()
        
        # Metadata
        metadata = {
            "filePath": filepath,
            "upAxis": str(UsdGeom.GetStageUpAxis(stage)),
            "startTimeCode": stage.GetStartTimeCode(),
            "endTimeCode": stage.GetEndTimeCode(),
            "framesPerSecond": stage.GetFramesPerSecond(),
            "hasUSD": True
        }

        # Create an XformCache for global coordinate evaluation
        time = stage.GetStartTimeCode()
        xform_cache = UsdGeom.XformCache(time)

        # Recursively parse the Prim tree
        hierarchy = _parse_prim_recursive(root_prim, xform_cache)
        
        return {
            "metadata": metadata,
            "hierarchy": hierarchy
        }
    except Exception as e:
        return {
            "error": f"USD stage parsing error: {str(e)}",
            "traceback": traceback.format_exc(),
            "hasUSD": HAS_USD
        }

def _parse_prim_recursive(prim, xform_cache=None) -> dict:
    """Recursively converts a USD Prim and its properties into a dictionary."""
    prim_path = str(prim.GetPath())
    raw_name = prim.GetName()
    prim_name = raw_name if raw_name else "/"
    
    # Gather basic details
    prim_type = prim.GetTypeName()
    specifier = str(prim.GetSpecifier()).split(".")[-1] if hasattr(prim, "GetSpecifier") else "def"
    is_active = prim.IsActive()
    
    # Extract 3D Geometry details
    geom_data = {}
    if HAS_USD and xform_cache and hasattr(prim, "IsA") and prim.IsA(UsdGeom.Gprim):
        try:
            world_transform = xform_cache.GetLocalToWorldTransform(prim)
            matrix = []
            for i in range(4):
                for j in range(4):
                    matrix.append(world_transform[i][j])
            geom_data["transform"] = matrix
            
            if prim_type == "Sphere":
                sphere = UsdGeom.Sphere(prim)
                r = sphere.GetRadiusAttr().Get()
                geom_data["shape"] = "sphere"
                geom_data["radius"] = r if r is not None else 1.0
            elif prim_type == "Cube":
                cube = UsdGeom.Cube(prim)
                s = cube.GetSizeAttr().Get()
                geom_data["shape"] = "cube"
                geom_data["size"] = s if s is not None else 2.0
            elif prim_type == "Cylinder":
                cyl = UsdGeom.Cylinder(prim)
                r = cyl.GetRadiusAttr().Get()
                h = cyl.GetHeightAttr().Get()
                geom_data["shape"] = "cylinder"
                geom_data["radius"] = r if r is not None else 1.0
                geom_data["height"] = h if h is not None else 2.0
            elif prim_type == "Cone":
                cone = UsdGeom.Cone(prim)
                r = cone.GetRadiusAttr().Get()
                h = cone.GetHeightAttr().Get()
                geom_data["shape"] = "cone"
                geom_data["radius"] = r if r is not None else 1.0
                geom_data["height"] = h if h is not None else 2.0
            elif prim_type == "Mesh":
                mesh = UsdGeom.Mesh(prim)
                points_attr = mesh.GetPointsAttr().Get()
                indices_attr = mesh.GetFaceVertexIndicesAttr().Get()
                counts_attr = mesh.GetFaceVertexCountsAttr().Get()
                orient_attr = mesh.GetOrientationAttr().Get()
                if points_attr:
                    geom_data["shape"] = "mesh"
                    geom_data["points"] = [list(pt) for pt in points_attr]
                    geom_data["orientation"] = orient_attr if orient_attr else "rightHanded"
                    
                    if indices_attr and counts_attr:
                        # Triangulate USD polygon faces (fan triangulation)
                        # Three.js requires purely triangulated face index arrays.
                        triangulated_indices = []
                        index_offset = 0
                        for count in counts_attr:
                            face_indices = indices_attr[index_offset : index_offset + count]
                            index_offset += count
                            
                            # Fan triangulation split
                            # Poly face [v0, v1, v2, ..., v_n] -> Triangles: [v0, v1, v2], [v0, v2, v3]...
                            for i in range(1, count - 1):
                                triangulated_indices.append(face_indices[0])
                                triangulated_indices.append(face_indices[i])
                                triangulated_indices.append(face_indices[i + 1])
                                
                        geom_data["indices"] = triangulated_indices
                    elif indices_attr:
                        geom_data["indices"] = list(indices_attr)
                    else:
                        geom_data["indices"] = list(range(len(points_attr)))
        except Exception as e:
            print(f"Xform/geom error on prim {prim.GetPath()}: {e}")

    # Variant sets
    variant_sets = {}
    if hasattr(prim, "GetVariantSets"):
        vsets = prim.GetVariantSets()
        for vs_name in vsets.GetNames():
            variant_sets[vs_name] = {
                "selected": vsets.GetVariantSelection(vs_name),
                "options": vsets.GetVariantNames(vs_name)
            }

    # Composition arcs (references, payloads)
    references = []
    if hasattr(prim, "GetPrimStack"):
        for prim_spec in prim.GetPrimStack():
            # Gather references
            for ref in prim_spec.referenceList.prependedItems:
                references.append({
                    "assetPath": ref.assetPath,
                    "primPath": str(ref.primPath) if ref.primPath else "",
                    "type": "reference"
                })
            for pl in prim_spec.payloadList.prependedItems:
                references.append({
                    "assetPath": pl.assetPath,
                    "primPath": str(pl.primPath) if pl.primPath else "",
                    "type": "payload"
                })

    # Attributes
    attributes = []
    for attr in prim.GetAttributes():
        name = attr.GetName()
        # Avoid private/internal variables to keep it clean
        if name.startswith("_"):
            continue
        
        attr_type = str(attr.GetTypeName())
        value = None
        if attr.HasValue():
            val = attr.Get()
            if isinstance(val, (Vt.Vec3fArray, Vt.Vec3dArray, Vt.Vec3hArray, Vt.FloatArray, Vt.DoubleArray, Vt.IntArray)):
                # Convert array types to plain lists for JSON
                value = list(val)
                if len(value) > 10: # Truncate large arrays
                    value = value[:10] + [f"... ({len(value) - 10} more items)"]
            elif hasattr(val, '__str__') and not isinstance(val, (str, int, float, bool, list, dict)):
                value = str(val)
            else:
                value = val

        attributes.append({
            "name": name,
            "type": attr_type,
            "value": value,
            "variability": str(attr.GetVariability()).split(".")[-1]
        })

    children = []
    for child in prim.GetChildren():
        children.append(_parse_prim_recursive(child, xform_cache))

    return {
        "name": prim_name,
        "path": prim_path,
        "type": prim_type if prim_type else "Scope",
        "specifier": specifier,
        "active": is_active,
        "variantSets": variant_sets,
        "references": references,
        "attributes": attributes,
        "children": children,
        "geomData": geom_data
    }

def create_empty_usd(filepath: str) -> dict:
    """Creates a simple base USD stage with a root Xform."""
    if not HAS_USD:
        # Graceful fallback write
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w") as f:
                f.write('#usda 1.0\n(\n    defaultPrim = "root"\n    upAxis = "Z"\n)\n\ndef Xform "root"\n{\n    def Sphere "sphere"\n    {\n        double radius = 2.0\n    }\n}\n')
            return {"success": True, "path": filepath, "fallback": True}
        except Exception as e:
            return {"error": f"Failed to write mock USD: {str(e)}"}

    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        stage = Usd.Stage.CreateNew(filepath)
        Usd.StageUpAxis(stage).Set("Z")
        
        # Create a simple default root hierarchy
        root = stage.DefinePrim("/root", "Xform")
        stage.SetDefaultPrim(root)
        
        sphere = stage.DefinePrim("/root/sphere", "Sphere")
        radius_attr = sphere.CreateAttribute("radius", Sdf.ValueTypeNames.Double)
        radius_attr.Set(2.0)
        
        stage.GetRootLayer().Save()
        return {"success": True, "path": filepath, "hasUSD": True}
    except Exception as e:
        return {"error": f"Failed to create USD Stage: {str(e)}"}

def get_mock_usd_stage(filepath: str) -> dict:
    """Generates realistic mock USD structure for testing/environments without pxr."""
    basename = os.path.basename(filepath)
    return {
        "metadata": {
            "filePath": filepath,
            "upAxis": "Z",
            "startTimeCode": 1.0,
            "endTimeCode": 100.0,
            "framesPerSecond": 24.0,
            "hasUSD": False,
            "mock": True
        },
        "hierarchy": {
            "name": "/",
            "path": "/",
            "type": "PseudoRoot",
            "specifier": "def",
            "active": True,
            "variantSets": {},
            "references": [],
            "attributes": [],
            "children": [
                {
                    "name": "root",
                    "path": "/root",
                    "type": "Xform",
                    "specifier": "def",
                    "active": True,
                    "variantSets": {
                        "lod": {
                            "selected": "high",
                            "options": ["low", "medium", "high"]
                        }
                    },
                    "references": [
                        {"assetPath": "./assets/layout_base.usd", "primPath": "/layout", "type": "reference"}
                    ],
                    "attributes": [
                        {"name": "xformOpOrder", "type": "token[]", "value": ["xformOp:translate", "xformOp:rotateXYZ"], "variability": "Varying"}
                    ],
                    "geomData": {
                        "shape": "group",
                        "transform": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
                    },
                    "children": [
                        {
                            "name": "sphere",
                            "path": "/root/sphere",
                            "type": "Sphere",
                            "specifier": "def",
                            "active": True,
                            "variantSets": {},
                            "references": [],
                            "attributes": [
                                {"name": "radius", "type": "double", "value": 2.0, "variability": "Uniform"},
                                {"name": "xformOp:translate", "type": "double3", "value": [0.0, 1.5, 0.0], "variability": "Varying"}
                            ],
                            "geomData": {
                                "shape": "sphere",
                                "radius": 2.0,
                                "transform": [1,0,0,0,  0,1,0,0,  0,0,1,0,  0,1.5,0,1]
                            },
                            "children": []
                        },
                        {
                            "name": "env_light",
                            "path": "/root/env_light",
                            "type": "DomeLight",
                            "specifier": "def",
                            "active": True,
                            "variantSets": {},
                            "references": [
                                {"assetPath": "./textures/hdri_sky.exr", "primPath": "", "type": "payload"}
                            ],
                            "attributes": [
                                {"name": "intensity", "type": "float", "value": 1.5, "variability": "Varying"},
                                {"name": "color", "type": "color3f", "value": [0.9, 0.95, 1.0], "variability": "Varying"}
                            ],
                            "children": []
                        }
                    ]
                }
            ]
        }
    }
