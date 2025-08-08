
from .project import Project, get_project_from_cwd

# Context is the current context that is in use.

class Context:
    def __init__(self):
        self._project = Project()
        self._cwd = ""

    def cwd(self):
        return self._cwd
    
    def set_cwd(self, cwd : str):
        self._cwd = cwd
        self._set_project_from_cwd(cwd)

    def project(self):
        return self._project
    
    def set_project(self, project : Project):
        self._project = project
        self.set_cwd(project.path())

    def _set_project_from_cwd(self, cwd):
        self._project = get_project_from_cwd(cwd)

        