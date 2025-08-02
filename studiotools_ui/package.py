name = "studiotools_ui"
version = "1.0.0"

variants = []

requires = [
    "python-3.11",
    "usd-25.05"
]

uuid = "cjhosken.studiotools_ui"

build_command = "python {root}/build.py {install}"

def commands():
    env.PYTHONPATH.prepend("{root}/python")
    env.PATH.append("{root}/bin")