#!/usr/bin/env python

import os
import os.path
import shutil
import sys
import stat


def build(source_path, build_path, install_path, targets):

    def _build():
        # python source
        for name in ("python", "icons"):
            src_py = os.path.join(source_path, name)
            dest_py = os.path.join(build_path, name)

            if not os.path.exists(dest_py):
                shutil.copytree(src_py, dest_py)

    def _install():
        for name in ("python", "icons"):
            src = os.path.join(build_path, name)
            dest = os.path.join(install_path, name)

            if os.path.exists(dest):
                shutil.rmtree(dest)

            print(src)
            print(dest)
            shutil.copytree(src, dest)

    _build()

    if "install" in (targets or []):
        _install()


if __name__ == '__main__':
    build(
        source_path=os.environ['REZ_BUILD_SOURCE_PATH'],
        build_path=os.environ['REZ_BUILD_PATH'],
        install_path=os.environ['REZ_BUILD_INSTALL_PATH'],
        targets=sys.argv[1:]
    )