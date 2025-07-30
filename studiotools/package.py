name = "studiotools"
version = "1.0.0"

tools = ["studiotools"]

variants = [
    #["python-3.11"],
    #["python-3.13"]
]

requires = [
    "studiotools_ui"
]

uuid = "cjhosken.studiotools"

build_command = "python {root}/build.py {install}"

def commands():
    env.PATH.append("{root}/bin")

    alias("studiotools", "python {root}/bin/studiotools")