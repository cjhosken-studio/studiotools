import os
import sys
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

# --- Helper Functions ---

def load_projects_list() -> List[dict]:
    if not os.path.isfile(PROJECTS_CONFIG):
        return []
    try:
        with open(PROJECTS_CONFIG, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            return data.get("projects", [])
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
        
        project_yaml = os.path.join(current_path, "project.yaml")
        folder_yaml = os.path.join(current_path, "folder.yaml")
        
        if os.path.isfile(project_yaml):
            node_type = "project"
        elif os.path.isfile(folder_yaml):
            try:
                with open(folder_yaml, "r") as f:
                    data = yaml.safe_load(f) or {}
                    node_type = data.get("type", "folder")
                    subtype = data.get("subtype", "custom")
            except Exception:
                pass

        # Find USD and other files if it's a task or folder
        files = []
        if node_type == "task":
            for sub in ["wip", "versions", "published"]:
                sub_dir = os.path.join(current_path, sub)
                if os.path.exists(sub_dir):
                    for root, _, filenames in os.walk(sub_dir):
                        for f in filenames:
                            # Skip pipeline metadata cards and Blender backup files from being shown in workspace lists
                            import re
                            if f.endswith((".yaml", ".yml")) or re.search(r"\.blend\d+$", f):
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
                            
                            # Automatically generate thumbnail on-the-fly for published USD deliverables
                            if sub == "published" and ext in ["usd", "usda", "usdc"]:
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

@app.get("/api/applications")
def get_applications(projectPath: str):
    """Scans the system for applications and returns available tools for launch."""
    apps = []
    
    # 1. Blender
    blender_exe = None
    for path in ["/usr/bin/blender", "/snap/bin/blender", "/usr/local/bin/blender"]:
        if os.path.isfile(path):
            blender_exe = path
            break
            
    apps.append({
        "name": "Blender",
        "appType": "blender",
        "executable": blender_exe or "mock_blender",
        "installed": blender_exe is not None,
        "extensions": ["blend"],
        "icon": "blender"
    })
    
    # 2. Houdini
    houdini_exe = None
    for path in sorted(glob.glob("/opt/hfs*")):
        exe = os.path.join(path, "bin", "houdini")
        if os.path.isfile(exe):
            houdini_exe = exe
            break
            
    apps.append({
        "name": "Houdini",
        "appType": "houdini",
        "executable": houdini_exe or "mock_houdini",
        "installed": houdini_exe is not None,
        "extensions": ["hip", "hipnc"],
        "icon": "houdini"
    })

    # 3. Nuke
    nuke_exe = None
    for path in sorted(glob.glob("/usr/local/Nuke*")) + sorted(glob.glob("/opt/Nuke*")):
        exe = os.path.join(path, "Nuke*")
        matches = glob.glob(exe)
        if matches and os.path.isfile(matches[0]):
            nuke_exe = matches[0]
            break
            
    apps.append({
        "name": "Nuke",
        "appType": "nuke",
        "executable": nuke_exe or "mock_nuke",
        "installed": nuke_exe is not None,
        "extensions": ["nk"],
        "icon": "nuke"
    })

    # Add a built-in interactive USD Web Editor
    apps.append({
        "name": "USD Inspector",
        "appType": "usd_web",
        "executable": "web_viewer",
        "installed": True,
        "extensions": ["usd", "usda", "usdc"],
        "icon": "usd"
    })

    return apps

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
            # Determine latest task version
            version = get_latest_task_version(req.taskPath)
            ext = "blend" if req.appType == "blender" else ("hip" if req.appType == "houdini" else "nk")
            
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

        # Register custom Houdini path to load our menus and startup script
        if req.appType == "houdini":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "houdini_studiotools")
            env["HOUDINI_PATH"] = f"{plugin_dir}:&"
        
        # Only pass the launch file to the DCC if it already exists on disk and is non-empty (avoiding 0-byte corruptions).
        # If it doesn't exist, we start the DCC empty and let its startup scripts initialize and save the new version.
        if os.path.exists(launch_file) and os.path.getsize(launch_file) > 0:
            command = [req.executable, launch_file]
        else:
            command = [command_item for command_item in [req.executable] if command_item]
        
        # Register custom Blender startup script integration
        if req.appType == "blender":
            plugin_dir = os.path.join(env["STUDIOTOOLS"], "plugins", "blender_studiotools")
            startup_script = os.path.join(plugin_dir, "scripts", "startup.py")
            if os.path.exists(startup_script):
                command.extend(["--python", startup_script])
        
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

# --- Session command queues for active DCC sessions ---
SESSION_COMMANDS = {}

class SessionCommand(BaseModel):
    appType: str
    taskPath: str
    command: str
    argument: str

@app.post("/api/sessions/command")
def queue_session_command(cmd: SessionCommand):
    """Queues a command for a running DCC session."""
    key = f"{cmd.appType}:{cmd.taskPath}"
    if key not in SESSION_COMMANDS:
        SESSION_COMMANDS[key] = []
    SESSION_COMMANDS[key].append({
        "command": cmd.command,
        "argument": cmd.argument
    })
    return {"status": "success", "message": "Command queued successfully!"}

@app.get("/api/sessions/poll")
def poll_session_commands(appType: str, taskPath: str):
    """DCC calls this endpoint to retrieve and clear queued commands."""
    key = f"{appType}:{taskPath}"
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
