import os
import sys
import re
import yaml
import glob
import subprocess
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .usd_utils import inspect_usd_stage, create_empty_usd
from .thumbnail_generator import generate_usd_thumbnail

app = FastAPI(title="Studio Tools API", version="2.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SETTINGS_DIR = os.path.expanduser("~/.studiotools")
PROJECTS_CONFIG = os.path.join(SETTINGS_DIR, "projects.yaml")

# Make sure settings directory exists
os.makedirs(SETTINGS_DIR, exist_ok=True)

class ProjectModel(BaseModel):
    name: str
    path: str

class FolderCreate(BaseModel):
    parentPath: str
    name: str
    type: str # folder, taskarea, task
    subtype: str # shot, asset, model, lookdev, rig, fx, etc.

class TaskCreate(BaseModel):
    parentPath: str
    name: str
    subtype: str # model, rig, fx, etc.

class LaunchRequest(BaseModel):
    appName: str
    appType: str
    executable: str
    taskPath: str
    preload: Optional[str] = None
    startupScript: Optional[str] = None
    preloadUSD: Optional[str] = None

class ProjectArchiveRequest(BaseModel):
    path: str
    archived: bool

class ProjectDeleteRequest(BaseModel):
    path: str
    deleteDiskFiles: bool

class ApplicationModel(BaseModel):
    name: str
    appType: str
    executable: str
    installed: bool
    extensions: List[str]
    icon: str
    disabled: Optional[bool] = False
    startupScript: Optional[str] = None

class ProjectApplicationsUpdate(BaseModel):
    projectPath: str
    applications: List[ApplicationModel]

class PublishVersionRequest(BaseModel):
    taskPath: str
    assetName: str
    versionFolder: str

class ToggleDisabledRequest(BaseModel):
    path: str
    disabled: bool

# --- Helper Functions ---


def load_projects_list() -> List[dict]:
    if not os.path.isfile(PROJECTS_CONFIG):
        return []
    try:
        with open(PROJECTS_CONFIG, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            projects = data.get("projects", [])
            
        valid_projects = []
        changed = False
        for p in projects:
            if os.path.exists(p.get("path", "")):
                valid_projects.append(p)
            else:
                changed = True
                print(f"Auto-removing invalid project context: {p.get('name')} ({p.get('path')})")
                
        if changed:
            save_projects_list(valid_projects)
            
        return valid_projects
    except Exception:
        return []

def save_projects_list(projects: List[dict]):
    try:
        with open(PROJECTS_CONFIG, "w", encoding="utf-8") as f:
            yaml.safe_dump({"projects": projects}, f, sort_keys=False, default_flow_style=False)
    except Exception as e:
        print(f"Failed to save projects list: {e}")

def create_folder_yaml(path: str, name: str, node_type: str, subtype: str):
    os.makedirs(path, exist_ok=True)
    config_path = os.path.join(path, "folder.yaml")
    data = {
        "name": name,
        "path": os.path.abspath(path),
        "type": node_type,
        "subtype": subtype,
        "date": datetime.now().isoformat()
    }
    with open(config_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False, default_flow_style=False)

def get_latest_task_version(task_path: str) -> int:
    version = 1
    wip_dir = os.path.join(task_path, "wip")
    if not os.path.exists(wip_dir):
        return version
        
    for app_folder in os.listdir(wip_dir):
        joint_folder = os.path.join(wip_dir, app_folder)
        if os.path.isdir(joint_folder):
            for file_name in os.listdir(joint_folder):
                # Simple version extraction like v001
                import re
                match = re.search(r"[._-]?v(\d+)", file_name, re.IGNORECASE)
                if match:
                    version = max(version, int(match.group(1)))
    return version

# --- API Endpoints ---

@app.get("/api/projects")
def get_projects():
    """Lists all registered VFX projects."""
    return load_projects_list()

@app.post("/api/projects")
def create_project(project: ProjectModel):
    """Creates a new project directory structure and registers it."""
    path = os.path.abspath(project.path)
    if os.path.exists(os.path.join(path, "project.yaml")):
        # Register if already exists
        projects = load_projects_list()
        if not any(p["path"] == path for p in projects):
            projects.append({"name": project.name, "path": path})
            save_projects_list(projects)
        return {"status": "success", "message": "Project already existed and was registered", "path": path}

    try:
        os.makedirs(path, exist_ok=True)
        # Create project.yaml
        project_config = os.path.join(path, "project.yaml")
        with open(project_config, "w", encoding="utf-8") as f:
            yaml.safe_dump({"name": project.name, "path": path, "created": datetime.now().isoformat()}, f)

        # Create default subfolders
        default_folders = [
            {"name": "sandbox", "type": "folder", "subtype": "custom"},
            {"name": "build", "type": "folder", "subtype": "custom"},
            {"name": "editorial", "type": "folder", "subtype": "custom"},
            {"name": "sequence", "type": "folder", "subtype": "custom"},
        ]
        for folder in default_folders:
            folder_path = os.path.join(path, folder["name"])
            create_folder_yaml(folder_path, folder["name"], folder["type"], folder["subtype"])

        # Register project
        projects = load_projects_list()
        if not any(p["path"] == path for p in projects):
            projects.append({"name": project.name, "path": path})
            save_projects_list(projects)

        return {"status": "success", "message": "Project created successfully", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@app.get("/api/project-tree")
def get_project_tree(path: str):
    """Recursively builds the project folder/task hierarchy."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Project path not found")

    def build_tree(current_path: str):
        name = os.path.basename(current_path)
        if not name:
            name = current_path
            
        node_type = "folder"
        subtype = "custom"
        
        disabled = False
        project_yaml = os.path.join(current_path, "project.yaml")
        folder_yaml = os.path.join(current_path, "folder.yaml")
        
        if os.path.isfile(project_yaml):
            node_type = "project"
            try:
                with open(project_yaml, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
                    disabled = data.get("disabled", False)
            except Exception:
                pass
        elif os.path.isfile(folder_yaml):
            try:
                with open(folder_yaml, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f) or {}
                    node_type = data.get("type", "folder")
                    subtype = data.get("subtype", "custom")
                    disabled = data.get("disabled", False)
            except Exception:
                pass

        # Find USD and other files if it's a task or folder
        files = []
        if node_type == "task":
            for sub in ["wip", "versions", "published"]:
                sub_dir = os.path.join(current_path, sub)
                if os.path.exists(sub_dir):
                    for root, _, filenames in os.walk(sub_dir, followlinks=True):
                        for f in filenames:
                            # Skip pipeline metadata cards and Blender backup files from being shown in workspace lists
                            import re
                            if f.endswith((".yaml", ".yml")) or re.search(r"\.blend\d+$", f):
                                continue
                            # .blend companion copies in versions/ are for reference only — exclude from deliverables
                            if sub == "versions" and f.endswith(".blend"):
                                continue
                            full_f = os.path.join(root, f)
                            rel_f = os.path.relpath(full_f, current_path)
                            ext = os.path.splitext(f)[-1].lstrip(".")
                            
                            file_item = {
                                "name": f,
                                "relativePath": rel_f,
                                "absolutePath": full_f,
                                "category": sub,
                                "ext": ext
                            }
                            
                            # Automatically generate thumbnail on-the-fly for published/versioned USD deliverables
                            if sub in ["published", "versions"] and ext in ["usd", "usda", "usdc"]:
                                app = "blender"
                                app_version = ""
                                shape = "mesh"
                                meta_path = os.path.join(root, "metadata.yaml")
                                if os.path.exists(meta_path):
                                    try:
                                        with open(meta_path, "r", encoding="utf-8") as mf:
                                            meta = yaml.safe_load(mf) or {}
                                            app = meta.get("application", "blender")
                                            app_version = meta.get("application_version", "")
                                            # Guess shape based on exported objects
                                            objs = meta.get("exported_root_objects", [])
                                            if objs:
                                                obj0 = str(objs[0]).lower()
                                                if "sphere" in obj0:
                                                    shape = "sphere"
                                                elif "cube" in obj0:
                                                    shape = "cube"
                                                elif "cylinder" in obj0:
                                                    shape = "cylinder"
                                                elif "cone" in obj0:
                                                    shape = "cone"
                                    except Exception:
                                        pass
                                
                                file_item["application"] = app
                                file_item["appVersion"] = app_version if app_version else None
                                
                                thumb_path = os.path.join(root, "thumbnail.png")
                                if not os.path.exists(thumb_path):
                                    try:
                                        # Use base asset name from filename for clean HUD display
                                        asset_display = os.path.splitext(f)[0]
                                        # Remove _v\d+ suffix for clean HUD title
                                        clean_asset_display = re.sub(r"_v\d+$", "", asset_display)
                                        generate_usd_thumbnail(thumb_path, shape=shape, asset_name=clean_asset_display, app_name=app)
                                    except Exception as te:
                                        print(f"Failed to generate thumbnail for {f}: {te}")
                                
                                if os.path.exists(thumb_path):
                                    file_item["thumbnailPath"] = thumb_path
                                    
                            files.append(file_item)

        # Recurse children
        children = []
        try:
            for item in os.listdir(current_path):
                # Ignore hidden directories and build outputs
                if item.startswith(".") or item in ["__pycache__", "wip", "versions", "published"]:
                    continue
                item_path = os.path.join(current_path, item)
                if os.path.isdir(item_path):
                    # Check if it has folder.yaml or project.yaml
                    if os.path.exists(os.path.join(item_path, "folder.yaml")) or os.path.exists(os.path.join(item_path, "project.yaml")):
                        children.append(build_tree(item_path))
        except Exception:
            pass

        return {
            "name": name,
            "path": current_path,
            "type": node_type,
            "subtype": subtype,
            "disabled": disabled,
            "children": children,
            "files": files
        }

    return build_tree(path)

@app.post("/api/folders")
def create_folder(req: FolderCreate):
    """Creates a subfolder or task area with metadata."""
    full_path = os.path.join(req.parentPath, req.name)
    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="Path already exists")

    try:
        create_folder_yaml(full_path, req.name, req.type, req.subtype)
        return {"status": "success", "path": full_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
def create_task(req: TaskCreate):
    """Creates a VFX pipeline task, creating the standard wip/versions/published subfolders."""
    full_path = os.path.join(req.parentPath, req.name)
    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="Task path already exists")

    try:
        # Create task folder with YAML
        create_folder_yaml(full_path, req.name, "task", req.subtype)
        
        # Create standard folders
        for folder in ["wip", "versions", "published"]:
            os.makedirs(os.path.join(full_path, folder), exist_ok=True)
            
        return {"status": "success", "path": full_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def scan_system_applications() -> List[dict]:
    apps = []
    
    # 1. Blender
    blender_exe = None
    blender_version = None
    
    blender_paths = glob.glob("/public/software/blender_foundation/blender/blender-*-linux-x64/blender")
    if blender_paths:
        blender_exe = blender_paths[0]
        match = re.search(r"blender-(\d+\.\d+\.\d+)-linux-x64", blender_exe)
        if match:
            blender_version = match.group(1)
    
    if not blender_exe:
        for path in ["/usr/bin/blender", "/snap/bin/blender", "/usr/local/bin/blender"]:
            if os.path.isfile(path):
                blender_exe = path
                break
                
    blender_name = f"Blender {blender_version}" if blender_version else "Blender"
    apps.append({
        "name": blender_name,
        "appType": "blender",
        "executable": blender_exe or "mock_blender",
        "installed": blender_exe is not None,
        "extensions": ["blend"],
        "icon": "blender"
    })
    
    # 2. Houdini
    houdini_exe = None
    houdini_version = None
    
    houdini_paths = sorted(glob.glob("/public/software/sidefx/hfs*/bin/houdini"))
    if houdini_paths:
        houdini_exe = houdini_paths[-1]
        match = re.search(r"hfs(\d+\.\d+\.\d+)", houdini_exe)
        if match:
            houdini_version = match.group(1)
            
    if not houdini_exe:
        fallback_paths = sorted(glob.glob("/opt/hfs*"))
        for path in fallback_paths:
            exe = os.path.join(path, "bin", "houdini")
            if os.path.isfile(exe):
                houdini_exe = exe
                match = re.search(r"hfs(\d+\.\d+\.\d+)", exe)
                if match:
                    houdini_version = match.group(1)
                break
                
    houdini_name = f"Houdini {houdini_version}" if houdini_version else "Houdini"
    apps.append({
        "name": houdini_name,
        "appType": "houdini",
        "executable": houdini_exe or "mock_houdini",
        "installed": houdini_exe is not None,
        "extensions": ["hip", "hipnc"],
        "icon": "houdini"
    })

    # 3. Nuke
    nuke_exe = None
    nuke_version = None
    
    nuke_paths = sorted(glob.glob("/public/software/foundry/nuke/Nuke*"))
    for nuke_dir in nuke_paths:
        dir_name = os.path.basename(nuke_dir)
        match = re.search(r"Nuke(\d+\.\d+v\d+|\d+\.\d+)", dir_name, re.IGNORECASE)
        if match:
            version_str = match.group(1)
            exe_glob = os.path.join(nuke_dir, "Nuke*")
            exe_matches = sorted(glob.glob(exe_glob))
            for em in exe_matches:
                if os.path.isfile(em) and not em.endswith((".so", ".dylib", ".dll", ".crt", ".conf")):
                    if os.path.basename(em).startswith("Nuke"):
                        nuke_exe = em
                        nuke_version = version_str
                        break
            if nuke_exe:
                break
                
    if not nuke_exe:
        fallback_dirs = sorted(glob.glob("/usr/local/Nuke*")) + sorted(glob.glob("/opt/Nuke*"))
        for path in fallback_dirs:
            exe_glob = os.path.join(path, "Nuke*")
            exe_matches = glob.glob(exe_glob)
            if exe_matches and os.path.isfile(exe_matches[0]):
                nuke_exe = exe_matches[0]
                dir_name = os.path.basename(path)
                match = re.search(r"Nuke(\d+\.\d+v\d+|\d+\.\d+)", dir_name, re.IGNORECASE)
                if match:
                    nuke_version = match.group(1)
                break
                
    nuke_name = f"Nuke {nuke_version}" if nuke_version else "Nuke"
    apps.append({
        "name": nuke_name,
        "appType": "nuke",
        "executable": nuke_exe or "mock_nuke",
        "installed": nuke_exe is not None,
        "extensions": ["nk"],
        "icon": "nuke"
    })

    # 4. Mari
    mari_exe = None
    mari_version = None
    
    mari_paths = sorted(glob.glob("/public/software/foundry/mari/Mari*/mari"))
    if mari_paths:
        mari_exe = mari_paths[-1]
        dir_name = os.path.basename(os.path.dirname(mari_exe))
        match = re.search(r"Mari(\d+\.\d+v\d+|\d+\.\d+)", dir_name, re.IGNORECASE)
        if match:
            mari_version = match.group(1)
            
    if not mari_exe:
        fallback_dirs = sorted(glob.glob("/usr/local/Mari*")) + sorted(glob.glob("/opt/Mari*"))
        for path in fallback_dirs:
            exe = os.path.join(path, "mari")
            if os.path.isfile(exe):
                mari_exe = exe
                dir_name = os.path.basename(path)
                match = re.search(r"Mari(\d+\.\d+v\d+|\d+\.\d+)", dir_name, re.IGNORECASE)
                if match:
                    mari_version = match.group(1)
                break
                
    mari_name = f"Mari {mari_version}" if mari_version else "Mari"
    apps.append({
        "name": mari_name,
        "appType": "mari",
        "executable": mari_exe or "mock_mari",
        "args": ["--dpiscaling=qt"],
        "installed": mari_exe is not None,
        "extensions": ["mra"],
        "icon": "mari"
    })

    # 5. ComfyUI
    comfyui_exe = None
    comfyui_version = None
    
    comfy_sh = "/public/software/comfyui/goComfy.sh"
    if os.path.isfile(comfy_sh):
        comfyui_exe = comfy_sh
        version_file = "/public/software/comfyui/ComfyUI/comfyui_version.py"
        if os.path.isfile(version_file):
            try:
                with open(version_file, "r", encoding="utf-8") as f:
                    content = f.read()
                v_match = re.search(r'__version__\s*=\s*["\']([^"\']+)["\']', content)
                if v_match:
                    comfyui_version = v_match.group(1)
            except Exception:
                pass
    else:
        for path in ["/public/software/comfyui/ComfyUI/main.py", "/usr/local/bin/comfyui", "/opt/comfyui/main.py"]:
            if os.path.isfile(path):
                comfyui_exe = path
                break
                
    comfyui_name = f"ComfyUI {comfyui_version}" if comfyui_version else "ComfyUI"
    apps.append({
        "name": comfyui_name,
        "appType": "comfyui",
        "executable": comfyui_exe or "mock_comfyui",
        "installed": comfyui_exe is not None,
        "extensions": ["json"],
        "icon": "comfyui"
    })

    return apps

@app.get("/api/applications/scan")
def get_applications_scan():
    """Scans the system paths for standard DCC software and returns them."""
    return scan_system_applications()

@app.get("/api/applications")
def get_applications(projectPath: str):
    """Gets applications configured for the project, falling back to scanned ones."""
    yaml_path = os.path.join(projectPath, "project.yaml")
    scanned_apps = scan_system_applications()
    if os.path.isfile(yaml_path):
        try:
            with open(yaml_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            
            apps = data.get("applications")
            if apps is None:
                apps = scanned_apps
                data["applications"] = apps
                with open(yaml_path, "w", encoding="utf-8") as f:
                    yaml.safe_dump(data, f, sort_keys=False, default_flow_style=False)
                return apps
            
            for app in apps:
                app_exe = app.get("executable", "")
                app["installed"] = "mock_" in app_exe or os.path.exists(app_exe)
                
            # Merge newly scanned/installed DCCs
            modified = False
            for sa in scanned_apps:
                if not sa.get("installed"):
                    continue
                exists = False
                for ea in apps:
                    if ea.get("executable") == sa.get("executable") or ea.get("name") == sa.get("name"):
                        exists = True
                        break
                if not exists:
                    apps.append(sa)
                    modified = True
                    
            if modified:
                data["applications"] = apps
                with open(yaml_path, "w", encoding="utf-8") as f:
                    yaml.safe_dump(data, f, sort_keys=False, default_flow_style=False)
                    
            return apps
        except Exception as e:
            print(f"Error in get_applications: {e}")
            pass
    return scanned_apps

@app.post("/api/projects/applications")
def save_project_applications(req: ProjectApplicationsUpdate):
    """Updates list of configured DCC applications inside the project's project.yaml."""
    yaml_path = os.path.join(req.projectPath, "project.yaml")
    if not os.path.isfile(yaml_path):
        raise HTTPException(status_code=404, detail="Project configuration file not found")
        
    try:
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
        # Update applications list
        data["applications"] = [app.dict() for app in req.applications]
        
        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, sort_keys=False, default_flow_style=False)
            
        return {"status": "success", "message": "Applications list updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project applications: {str(e)}")

@app.post("/api/launch")
def launch_application(req: LaunchRequest):
    """Launches the selected application in the context of the task, resolving version files."""
    # Handle mock launches for testing environments gracefully
    if "mock_" in req.executable:
        return {
            "status": "mock_success",
            "message": f"Successfully simulated launching {req.appName} in task context!",
            "details": {
                "ST_PROJECT": os.path.abspath(req.taskPath),
                "ST_CWD": req.taskPath
            }
        }

    if not os.path.exists(req.executable):
        raise HTTPException(status_code=404, detail=f"Executable not found at: {req.executable}")
    try:
        if req.preload:
            launch_file = os.path.abspath(req.preload)
            # Ensure the preload file exists
            if not os.path.exists(launch_file):
                raise HTTPException(status_code=404, detail=f"Preload file not found: {req.preload}")
        else:
            version = get_latest_task_version(req.taskPath)
            ext_map = {
                "blender": "blend",
                "houdini": "hip",
                "nuke": "nk",
                "mari": "mra",
                "comfyui": "json"
            }
            ext = ext_map.get(req.appType, "custom")
            
            file_name = f"scene_v{version:03d}.{ext}"
            
            # Prepare wip directory structure
            wip_dir = os.path.join(req.taskPath, "wip")
            app_dir = os.path.join(wip_dir, req.appType)
            os.makedirs(app_dir, exist_ok=True)
            
            launch_file = os.path.join(app_dir, file_name)
        

                
        # Setup environment variables
        env = os.environ.copy()
        # Clean virtual environment leaks to prevent DCC internal Python conflicts
        env.pop("PYTHONPATH", None)
        env.pop("PYTHONHOME", None)
        env.pop("VIRTUAL_ENV", None)
        
        # Clean VIRTUAL_ENV paths from PATH
        if "PATH" in env:
            paths = env["PATH"].split(os.pathsep)
            cleaned_paths = [p for p in paths if ".venv" not in p]
            env["PATH"] = os.pathsep.join(cleaned_paths)
        
        env["ST_PROJECT"] = req.taskPath # approximate project folder by walking up
        env["ST_TASK"] = os.path.basename(req.taskPath)
        env["ST_TASKAREA"] = os.path.basename(os.path.dirname(req.taskPath))
        env["ST_CWD"] = req.taskPath
        env["STUDIOTOOLS"] = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

        env["ST_APP_NAME"] = req.appType
        app_version = ""
        version_match = re.search(r"\d+\.\d+v\d+|\d+\.\d+(?:\.\d+)?", req.appName)
        if version_match:
            app_version = version_match.group(0)
        env["ST_APP_VERSION"] = app_version

        if req.preloadUSD:
            env["ST_PRELOAD_USD"] = req.preloadUSD

        if req.startupScript:
            env["ST_STARTUP_SCRIPT"] = req.startupScript

        # Only pass the launch file to the DCC if it already exists on disk and is non-empty (avoiding 0-byte corruptions).
        # If it doesn't exist, we start the DCC empty and let its startup scripts initialize and save the new version.
        if os.path.exists(launch_file) and os.path.getsize(launch_file) > 0:
            command = [req.executable, launch_file]
        else:
            command = [command_item for command_item in [req.executable] if command_item]

        # Register custom Houdini package directories so all packages merge correctly.
        # Using HOUDINI_PACKAGE_DIR (colon-separated list of dirs containing .json package files)
        # avoids overwriting HOUDINI_PATH and is fully compatible with the existing
        # /public/pipeline/houdini/packages/ package set (axiom, groombear, paradigm, etc.)
        if req.appType == "houdini":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "houdini_studiotools")
            st_packages_dir = os.path.join(plugin_dir, "packages")
            pipeline_packages_dir = "/public/pipeline/houdini/packages"
            existing_pkg_dirs = env.get("HOUDINI_PACKAGE_DIR", "")
            pkg_dirs = [st_packages_dir]
            if os.path.isdir(pipeline_packages_dir):
                pkg_dirs.append(pipeline_packages_dir)
            if existing_pkg_dirs:
                pkg_dirs.append(existing_pkg_dirs)
            env["HOUDINI_PACKAGE_DIR"] = os.pathsep.join(pkg_dirs)

        # Set Blender pipeline addons directory so all /public/pipeline/blender addons load
        if req.appType == "blender":
            pipeline_blender_addons = "/public/pipeline/blender/addons"
            if os.path.isdir(pipeline_blender_addons):
                env["BLENDER_USER_EXTENSIONS"] = pipeline_blender_addons

        # Set Nuke plugin path to auto-load nuke_studiotools init.py + menu.py
        if req.appType == "nuke":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "nuke_studiotools")
            existing_nuke_path = env.get("NUKE_PATH", "")
            nuke_dirs = [plugin_dir]
            if existing_nuke_path:
                nuke_dirs.append(existing_nuke_path)
            env["NUKE_PATH"] = os.pathsep.join(nuke_dirs)
            # Tell the plugin where to find the user's pipeline nuke tools
            env["ST_NUKE_PLUGIN_PATH"] = "/public/pipeline/nuke"

        # Set MARI_SCRIPT_PATH so Mari auto-executes the studiotools startup.py on launch
        if req.appType == "mari":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "mari_studiotools")
            existing_mari_path = env.get("MARI_SCRIPT_PATH", "")
            mari_dirs = [plugin_dir]
            command.extend(["--dpiscaling=qt"])
            if existing_mari_path:
                mari_dirs.append(existing_mari_path)
            env["MARI_SCRIPT_PATH"] = os.pathsep.join(mari_dirs)
        
        # Register custom Blender startup script integration
        if req.appType == "blender":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "blender_studiotools")
            startup_script = os.path.join(plugin_dir, "scripts", "startup.py")
            if os.path.exists(startup_script):
                command.extend(["--python", startup_script])
            if req.startupScript and os.path.exists(req.startupScript):
                command.extend(["--python", req.startupScript])
        elif req.startupScript and os.path.exists(req.startupScript):
            command.append(req.startupScript)
        
        # Try to launch with a persistent terminal emulator so the user can see console output and debug crashes
        import shutil
        import shlex
        
        terminals = ["x-terminal-emulator", "gnome-terminal", "ptyxis", "konsole", "xterm"]
        found_term = None
        for term in terminals:
            path = shutil.which(term)
            if path:
                found_term = path
                break
        
        if found_term:
            cmd_str = " ".join(shlex.quote(arg) for arg in command)
            # Build bash command that executes the DCC and keeps the terminal open on exit
            bash_cmd = f"{cmd_str}; echo; echo '[StudioTools] {req.appName} exited with code $?'; read -p 'Press Enter to close terminal...'"
            
            term_name = os.path.basename(found_term)
            if term_name in ["xterm"]:
                launch_cmd = [found_term, "-T", f"StudioTools: {req.appName}", "-e", "bash", "-c", bash_cmd]
            else:
                launch_cmd = [found_term, "-T", f"StudioTools: {req.appName}", "--", "bash", "-c", bash_cmd]
            
            subprocess.Popen(launch_cmd, env=env, shell=False)
            message = f"Application {req.appName} launched in a persistent terminal!"
        else:
            # Fallback to direct background process if no terminal emulator is found
            subprocess.Popen(command, env=env, shell=False)
            message = f"Application {req.appName} launched!"
            
        return {"status": "success", "message": message, "file": launch_file}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to launch application: {str(e)}")

@app.get("/api/usd/inspect")
def get_usd_inspect(path: str):
    """Opens a USD file and returns its stage prim hierarchy and attributes."""
    result = inspect_usd_stage(path)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/api/usd/thumbnail")
def get_usd_thumbnail(path: str):
    """Serves a generated thumbnail PNG file from absolute disk path."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Thumbnail file not found")
    from fastapi.responses import FileResponse
    return FileResponse(path, media_type="image/png")

class ThumbnailRegenerateRequest(BaseModel):
    usdPath: str

@app.post("/api/usd/thumbnail/regenerate")
def post_usd_thumbnail_regenerate(req: ThumbnailRegenerateRequest):
    """Deletes existing thumbnail and forces regeneration of high-res beauty preview thumbnail."""
    import re
    usd_file = os.path.abspath(req.usdPath)
    if not os.path.exists(usd_file):
        raise HTTPException(status_code=404, detail="USD file not found")
        
    root = os.path.dirname(usd_file)
    f = os.path.basename(usd_file)
    
    thumb_path = os.path.join(root, "thumbnail.png")
    
    # Clean up existing thumbnail first if it exists
    if os.path.exists(thumb_path):
        try:
            os.remove(thumb_path)
        except Exception as e:
            print(f"Failed to delete old thumbnail: {e}")
            
    # Resolve metadata details just like in project tree scan
    app = "blender"
    shape = "mesh"
    meta_path = os.path.join(root, "metadata.yaml")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as mf:
                meta = yaml.safe_load(mf) or {}
                app = meta.get("application", "blender")
                objs = meta.get("exported_root_objects", [])
                if objs:
                    obj0 = str(objs[0]).lower()
                    if "sphere" in obj0:
                        shape = "sphere"
                    elif "cube" in obj0:
                        shape = "cube"
                    elif "cylinder" in obj0:
                        shape = "cylinder"
                    elif "cone" in obj0:
                        shape = "cone"
        except Exception:
            pass
            
    try:
        # Use base asset name from filename for clean HUD display
        asset_display = os.path.splitext(f)[0]
        clean_asset_display = re.sub(r"_v\d+$", "", asset_display)
        generate_usd_thumbnail(thumb_path, shape=shape, asset_name=clean_asset_display, app_name=app)
        return {"status": "success", "message": "Thumbnail regenerated successfully!", "thumbnailPath": thumb_path}
    except Exception as te:
        raise HTTPException(status_code=500, detail=f"Failed to generate thumbnail: {str(te)}")

@app.post("/api/usd/create")
def post_usd_create(path: str):
    """Creates a new USD stage at the target path."""
    result = create_empty_usd(path)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@app.post("/api/usd/publish-version")
def publish_version(req: PublishVersionRequest):
    """Sets a specific version folder as the symlinked 'published' version."""
    task_path = os.path.abspath(req.taskPath)
    published_dir = os.path.join(task_path, "published")
    versions_dir = os.path.join(task_path, "versions")
    
    os.makedirs(published_dir, exist_ok=True)
    
    target_link = os.path.join(published_dir, req.assetName)
    target_dir = os.path.join(versions_dir, req.versionFolder)
    
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=404, detail=f"Version folder not found: {req.versionFolder}")
        
    try:
        # Remove existing symlink or file/directory
        if os.path.islink(target_link) or os.path.exists(target_link):
            if os.path.isdir(target_link) and not os.path.islink(target_link):
                import shutil
                shutil.rmtree(target_link)
            else:
                os.remove(target_link)
                
        # Create relative symlink to versions/
        src = os.path.join("..", "versions", req.versionFolder)
        os.symlink(src, target_link)
        return {"status": "success", "message": f"Successfully set version {req.versionFolder} as published."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create symlink: {str(e)}")

@app.delete("/api/items")
def delete_item(path: str):
    """Safely and recursively deletes a directory inside a registered project context."""
    import shutil
    target_path = os.path.abspath(path)
    projects = load_projects_list()
    
    # Safety Check: Must be a subpath of a registered project and NOT the project root itself
    is_safe = False
    for p in projects:
        project_path = os.path.abspath(p["path"])
        if target_path.startswith(project_path) and target_path != project_path:
            is_safe = True
            break
            
    if not is_safe:
        raise HTTPException(
            status_code=400, 
            detail="Forbidden: Target path must be a subdirectory within a registered project context and cannot be the project root itself."
        )
        
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Path not found on disk")
        
    try:
        if os.path.isdir(target_path):
            shutil.rmtree(target_path)
        else:
            os.remove(target_path)
        return {"status": "success", "message": f"Successfully deleted '{os.path.basename(target_path)}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")

@app.post("/api/items/toggle-disabled")
def toggle_item_disabled(req: ToggleDisabledRequest):
    """Toggles the disabled state of a folder/task in its folder.yaml or project.yaml."""
    target_path = os.path.abspath(req.path)
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="Path not found on disk")
        
    project_yaml = os.path.join(target_path, "project.yaml")
    folder_yaml = os.path.join(target_path, "folder.yaml")
    
    target_yaml = None
    if os.path.isfile(project_yaml):
        target_yaml = project_yaml
    elif os.path.isfile(folder_yaml):
        target_yaml = folder_yaml
    else:
        # If it's a directory but has no yaml metadata, create a default folder.yaml first
        if os.path.isdir(target_path):
            target_yaml = folder_yaml
            try:
                create_folder_yaml(target_path, os.path.basename(target_path), "folder", "custom")
            except Exception as ce:
                raise HTTPException(status_code=500, detail=f"Failed to create default folder configuration: {str(ce)}")
        else:
            raise HTTPException(status_code=400, detail="Target is not a directory or has no configuration metadata file.")

    try:
        with open(target_yaml, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
        data["disabled"] = req.disabled
        
        with open(target_yaml, "w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, sort_keys=False, default_flow_style=False)
            
        status = "disabled" if req.disabled else "enabled"
        return {"status": "success", "message": f"Successfully {status} '{os.path.basename(target_path)}'"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item disabled status: {str(e)}")

@app.post("/api/projects/archive")
def archive_project(req: ProjectArchiveRequest):
    """Archives or restores a project context in projects.yaml."""
    projects = load_projects_list()
    target_path = os.path.abspath(req.path)
    
    found = False
    for p in projects:
        if os.path.abspath(p["path"]) == target_path:
            p["archived"] = req.archived
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Project path not registered")
        
    save_projects_list(projects)
    action = "archived" if req.archived else "restored"
    return {"status": "success", "message": f"Project successfully {action}!"}

@app.post("/api/projects/delete")
def delete_project(req: ProjectDeleteRequest):
    """Unregisters a project and optionally deletes all files on disk."""
    import shutil
    projects = load_projects_list()
    target_path = os.path.abspath(req.path)
    
    # Remove from list
    new_projects = [p for p in projects if os.path.abspath(p["path"]) != target_path]
    if len(new_projects) == len(projects):
        raise HTTPException(status_code=404, detail="Project path not registered")
        
    save_projects_list(new_projects)
    
    deleted_files = False
    if req.deleteDiskFiles:
        if os.path.exists(target_path):
            try:
                shutil.rmtree(target_path)
                deleted_files = True
            except Exception as e:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Unregistered project, but failed to delete disk files: {str(e)}"
                )
                
    return {
        "status": "success", 
        "message": "Project unregistered successfully!" + (" All files on disk deleted." if deleted_files else "")
    }

# --- Session command queues for active DCC sessions ---
SESSION_COMMANDS = {}
SESSION_POLL_TIMES = {}

class SessionCommand(BaseModel):
    appType: str
    taskPath: str
    command: str
    argument: str

def get_configured_application(task_path: str, app_type: str) -> Optional[dict]:
    # Walk up to find project.yaml
    current = task_path
    project_path = None
    while current and current != os.path.dirname(current):
        if os.path.isfile(os.path.join(current, "project.yaml")):
            project_path = current
            break
        current = os.path.dirname(current)
        
    if not project_path:
        projects = load_projects_list()
        for p in projects:
            p_path = os.path.abspath(p["path"])
            if task_path.startswith(p_path):
                project_path = p_path
                break
                
    if project_path:
        apps = get_applications(project_path)
    else:
        apps = scan_system_applications()
        
    for app in apps:
        if app.get("appType") == app_type:
            return app
    return None

@app.post("/api/sessions/command")
def queue_session_command(cmd: SessionCommand):
    """Queues a command for a running DCC session, or launches the DCC if not active."""
    key = f"{cmd.appType}:{cmd.taskPath}"
    
    import time
    last_poll = SESSION_POLL_TIMES.get(key, 0)
    
    if time.time() - last_poll < 3.0:
        # Session is active! Just queue the command
        if key not in SESSION_COMMANDS:
            SESSION_COMMANDS[key] = []
        SESSION_COMMANDS[key].append({
            "command": cmd.command,
            "argument": cmd.argument
        })
        return {"status": "success", "message": "Command queued successfully for active session!"}
    else:
        # Session is not active, launch the DCC with USD preloaded
        app_config = get_configured_application(cmd.taskPath, cmd.appType)
        if not app_config:
            raise HTTPException(status_code=404, detail=f"No application configuration found for {cmd.appType}")
            
        req = LaunchRequest(
            appName=app_config["name"],
            appType=cmd.appType,
            executable=app_config["executable"],
            taskPath=cmd.taskPath,
            preload=None,
            startupScript=app_config.get("startupScript"),
            preloadUSD=cmd.argument if cmd.command == "load_usd" else None
        )
        return launch_application(req)

@app.get("/api/sessions/poll")
def poll_session_commands(appType: str, taskPath: str):
    """DCC calls this endpoint to retrieve and clear queued commands."""
    import time
    key = f"{appType}:{taskPath}"
    SESSION_POLL_TIMES[key] = time.time()
    commands = SESSION_COMMANDS.get(key, [])
    if commands:
        SESSION_COMMANDS[key] = []
    return {"commands": commands}

# --- Serving Built Frontend ---
# Verify if the built folder exists before mounting
BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "pipeline", "studiotools"))

if os.path.isdir(BUILD_DIR):
    app.mount("/public/pipeline/studiotools", StaticFiles(directory=BUILD_DIR, html=True), name="frontend")
    
    # Root redirect
    from fastapi.responses import RedirectResponse
    @app.get("/")
    def root():
        return RedirectResponse(url="/public/pipeline/studiotools/index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "FastAPI is running! The React frontend is not compiled yet.",
            "hint": "Please run `npm run build` in the workspace to compile the frontend and place it in `/public/pipeline/studiotools`."
        }
