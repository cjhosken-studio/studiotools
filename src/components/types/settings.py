from PySide6.QtCore import QSettings
import sys
from .context import Context
from .project import Project

def loadContext():
    settings = QSettings()

    context_data = settings.value("context", {})

    return Context.from_dict(context_data)

def loadProjectList():
    settings = QSettings()

    projects_data = settings.value("project_list", [])

    project_list = [
        Project.from_dict(p)
        for p in projects_data
    ]

    return project_list

def saveContext(context):
    settings = QSettings()

    settings.setValue("context", context.to_dict())

def saveProjectList(project_list):
    settings = QSettings()

    settings.setValue("project_list", [p.to_dict() for p in project_list])