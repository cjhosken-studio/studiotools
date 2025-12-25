import os
import re

_VERSION_RE = re.compile(r"[._-]?v(\d+)", re.IGNORECASE)

def get_latest_task_vesion(task):
    version = 1
    
    for appfolder in os.listdir(task):
        joint_appfolder = os.path.join(task, appfolder)
        if os.path.isdir(joint_appfolder):
            for appfile in os.listdir(joint_appfolder):
                joint_appfile = os.path.join(joint_appfolder, appfile)
                version = max(version, get_version_from_file(joint_appfile))
            
    return version


def get_version_from_file(file):
    match = _VERSION_RE.search(file)
    if not match:
        raise ValueError(f"Invalid version format: {file}")
    return int(match.group(1))

def format_version(version):
    return f"v{version:03d}"


def strip_version(name):
    STRIP_RE = re.compile(r"(?:^|[_\-.])v\d{3}(?=$|[_\-.])", re.IGNORECASE)
    stripped = STRIP_RE.sub("", name)
    return stripped.strip("_-. ")