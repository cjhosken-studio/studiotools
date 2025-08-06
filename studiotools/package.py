name = "studiotools"
version = "1.0.0"

tools = ["studiotools"]

requires = [
    "python-3.13",
    "node",
]

uuid = "cjhosken.studiotools"

build_command = "cd {root}; npm run build; cp -r dist/* $REZ_BUILD_INSTALL_PATH"

def commands():
    alias("studiotools", f"{{root}}/studiotools-{version}.AppImage")