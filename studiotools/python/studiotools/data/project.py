import os
import pathlib
import yaml
from datetime import datetime
import platform
import socket
import sys

class Project:
    def __init__(self, yaml_path=""):
        self._name = ""
        self._path = ""

        if yaml_path:
            self.load(yaml_path)
    
    def set_name(self, name : str):
        self._name = name

    def name(self):
        return self._name

    def set_path(self, path : str):
        self._path = path

    def path(self):
        return self._path
    
    def load(self, yaml_file):
        with open(yaml_file) as stream:
            data = yaml.safe_load(stream)
            if data:
                self._name = data.get("name", "")
                self._path = data.get("path", "")

            stream.close()
    
    def yaml(self):
        return os.path.join(self._path, "project.yaml")
    
    def exists(self):
        return self._name and self._path

def get_project(path):
    if os.path.exists(path) and os.path.isdir(path):
        if "project.yaml" in os.listdir(path):
            return Project(os.path.join(path, "project.yaml"))
    
    return Project()

def get_project_from_cwd(cwd):
    current_path = cwd

    while current_path != os.path.dirname(current_path):
        project = get_project(current_path)

        if project.exists():
            return project

        current_path = os.path.dirname(current_path)

    return Project()

def create_project(project_path):

    if not os.path.exists(project_path):
        os.mkdir(project_path)

        project_yaml_path = os.path.join(project_path, "project.yaml")

        project_data = {
            "name": os.path.basename(project_path),
            "path": project_path,
            "metadata": {
                "author": os.getenv("USER") or os.getenv("USERNAME"),
                "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "system": {
                    "os": platform.system(),
                    "machine": platform.machine(),
                    "hostname": socket.gethostname()
                }
            }
        }

        #create_project_structure()

        with open(project_yaml_path, "w") as yaml_file:
            yaml.dump(project_data, yaml_file, default_flow_style=False, sort_keys=False)

        return Project(project_yaml_path)

    return Project()
    
def delete_project(path):
    project = get_project(path)
    if project.exists():
        os.rmdir(path)
        return True
    return False

def get_projects():
    project_directory_path = os.path.join(pathlib.Path.home(), "projects")

    projects = []

    for project_name in os.listdir(project_directory_path):
        project_path = os.path.join(project_directory_path, project_name)

        project = get_project(project_path)

        if project.exists():
            projects.append(project)
    return projects