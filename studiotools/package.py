name = "studiotools"
version = "1.0.0"

tools = ["studiotools"]

requires = [
    "python-3.13",
    "node",
]

uuid = "cjhosken.studiotools"

build_command = "cd {root}; npm run build --prefix=$REZ_BUILD_INSTALL_PATH"

def commands():
    env.PATH.append("{root}/bin")