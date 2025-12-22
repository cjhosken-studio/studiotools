import os
import yaml
from datetime import datetime

from PySide6.QtGui import QIcon

class Project:
    def __init__(self):
        self.name = ""
        self.path = ""

    def __init__(self, path):
        self.path = path
        self.name = os.path.basename(path)

    def to_dict(self):
        return {
            "name": self.name,
            "path": self.path
        }
    
    def from_dict(dict):
        return Project(dict.get("path", ""))
        
def loadProjectFromYaml(yaml_path):
    if os.path.isfile(yaml_path):
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            
            path = data.get("path", "")

            return Project(path=path)
    return Project()

def saveProjectToYaml(project, yaml_path):
    directory = os.path.dirname(os.path.abspath(yaml_path))
    os.makedirs(directory, exist_ok=True)

    data = {
        "name": project.name,
        "path": project.path
    }

    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            sort_keys=False,
            default_flow_style=False
        )


#
#       PROJECT CREATION
#

DEFAULT_PROJECT_STRUCTURE = [
    {
        "name": "sandbox",
        "type": "folder",
        "subtype": "",
    },
    {
        "name":"build",
        "type": "folder",
        "subtype": ""
    },
    {
        "name":"editorial",
        "type": "folder",
        "subtype":"",
    },
    {
        "name":"sequence",
        "type":"folder",
        "subtype":""
    }
]

def createProject(path):
    if os.path.exists(path):
        return
    
    os.makedirs(path, exist_ok=True)

    project = Project(path)

    project_config = os.path.join(path, "project.yaml")
    saveProjectToYaml(project, project_config)

    for item in DEFAULT_PROJECT_STRUCTURE:
        createFolder(path, item)

def createFolder(parent_path, item):
    item_path = os.path.join(parent_path, item["name"])

    os.makedirs(item_path)
        
    item_config = os.path.join(item_path, "folder.yaml")

    item_data = {
        "name": item.get("name", "unknown"),
        "path": os.path.abspath(item_path),
        "type": item.get("type", "folder"),
        "subtype": item.get("subtype", "custom"),
        "date": datetime.now()
    }

    with open(item_config, "w", encoding="utf-8") as f:
        yaml.safe_dump(
            item_data,
            f,
            sort_keys=False,
            default_flow_style=False
        )    

def getTypeFromFolder(path):
    folder_config = os.path.join(path, "folder.yaml")

    if os.path.isfile(folder_config):
        with open(folder_config, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            return data.get("type", "folder"), data.get("subtype", "custom")
    else:
        return None, None
    
def getIconFromTypes(type, subtype):
    if (type == "project"):
        return QIcon()
    
    if (type == "taskarea"):
        if (subtype == "shot"): return QIcon()
        if (subtype == "asset"): return QIcon()

        return QIcon()

    if (type == "task"):
        if (subtype == "scan"): return QIcon()
        if (subtype == "model"): return QIcon()
        if (subtype == "texture"): return QIcon()
        if (subtype == "lookdev"): return QIcon()
        if (subtype == "rig"): return QIcon()

        if (subtype == "tool"): return QIcon()

        if (subtype == "track"): return QIcon()
        if (subtype == "comp"): return QIcon()

        if (subtype == "layout"): return QIcon()
        if (subtype == "animate"): return QIcon()
        if (subtype == "fx"): return QIcon()
        if (subtype == "light"): return QIcon()

        return QIcon()
    
    return QIcon()