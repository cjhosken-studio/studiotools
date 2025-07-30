name = "studiotools_ui"
version = "1.0.0"

variants = [
    #["python-3.11"],
    #["python-3.13"]
]

requires = [

]

uuid = "cjhosken.studiotools_ui"

build_command = "python {root}/build.py {install}"

def commands():
    env.PYTHONPATH.prepend("{root}/python")
    env.PATH.append("{root}/bin")