import os

from .project import Project, loadProjectFromYaml

class Context:
    def __init__(self):
        self.project = Project()
        self.cwd = ""

    def __init__(self, project):
        self.project = project
        self.cwd = project.path

    def __init__(self, project, cwd):
        self.project = project
        self.cwd = cwd

    def to_dict(self):
        return {
            "cwd": self.cwd,
            "project": self.project.to_dict()
        }
        
    def from_dict(data):
        project = Project.from_dict(data.get("project", {}))
        return Context(project, data.get("cwd", project.path))

def isValidCwd(cwd):
    if os.path.exists(cwd):
        project = getProjectFromCwd(cwd)
        return project
    
    return False

def getCwdFromProject(project):
    return project.path

def getProjectFromCwd(cwd):
    current = cwd
    while (True):
        files = os.listdir(current)

        hasProjectConfig = "project.yaml" in files

        if (hasProjectConfig):
            config = os.path.join(current, "project.yaml")
            return loadProjectFromYaml(config)

        parent = os.path.dirname(current)

        if (parent == current):
            return Project()

        current = parent


