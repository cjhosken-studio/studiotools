name = "studiotools"
version = "1.0.0"

tools = ["studiotools"]

requires = [
    "python-3.11",
    "studiotools_ui"
]

uuid = "cjhosken.studiotools"

build_command = "python {root}/build.py {install}"

def commands():
    env.PATH.append("{root}/bin")

    alias("studiotools", "python {root}/bin/studiotools")