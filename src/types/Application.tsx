import { exists, readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export default class Application {
    name: string = "";
    icon: string | null = null;
    executable: string = "";
    files: string[] = [];

    constructor(name: string, icon: string | null, executable: string, files: string[]) {
        this.name = name;
        this.icon = icon;
        this.files = files;
        this.executable = executable;
    }

    async launch(path: string = "") {
        invoke("launch", { executable: this.executable, path: path })
    }

    setName(name: string) {
        this.name = name
    }

    setExecutable(executable: string) {
        this.icon = executable
    }

    setIcon(icon: string) {
        this.icon = icon
    }

    getIcon() {
        return convertFileSrc(this.icon!)
    }
}

export async function loadDefaultApplications(): Promise<Application[]> {
    const applications: Application[] = []
    const os_platform = platform();

    if (os_platform == "windows") {

        // BLENDER

        const blenderRoot = await join("C:", "Program Files", "Blender Foundation")
        if (await exists(blenderRoot)) {
            const entries = await readDir(blenderRoot);
            const files = [".blend"]

            for (const entry of entries) {
                if (!entry.isDirectory) continue;

                const executable = await join(blenderRoot, entry.name, "blender.exe")

                if (await exists(executable)) {
                    applications.push(
                        new Application(`${entry.name}`, null, executable, files)
                    )
                }
            }
        }

        // HOUDINI

        const sidefxRoot = await join("C:", "Program Files", "Side Effects Software");
        if (await exists(sidefxRoot)) {
            const entries = await readDir(sidefxRoot);

            const files = [".hip", ".hipnc"]

            for (const entry of entries) {
                if (!entry.isDirectory) continue;

                const versionBin = await join(sidefxRoot, entry.name, "bin")
                const icon = await join(sidefxRoot, entry.name, "houdini", "pic", "minimizedicon.png")

                if (await exists(versionBin) && await exists(icon)) {
                    const base_exe = await join(versionBin, "houdini.exe")
                    applications.push(
                        new Application(`${entry.name}`, icon, base_exe, files)
                    )

                    const core_exe = await join(versionBin, "houdinicore.exe")
                    applications.push(
                        new Application(`${entry.name} Core`, icon, core_exe, files)
                    )

                    const fx_exe = await join(versionBin, "houdinifx.exe")
                    applications.push(
                        new Application(`${entry.name} FX`, icon, fx_exe, files)
                    )
                }
            }
        }

        // FOUNDRY

        const foundryRoot = await join("C:", "Program Files");
        if (await exists(foundryRoot)) {
            const entries = await readDir(foundryRoot);

            for (const entry of entries) {
                if (!entry.isDirectory) continue;

                if (entry.name.includes("Nuke")) {
                    const folderName = entry.name;
                    const match = folderName.match(/Nuke\d+\.\d+/);
                    const files = [".nk"]

                    if (match) {
                        const base_exe = await join(foundryRoot, entry.name, `${match[0]}.exe`);

                        applications.push(
                            new Application(`${entry.name}`, null, base_exe, files)
                        )
                    }


                    const x_exe = await join(foundryRoot, entry.name, "NukeXApp.exe")

                    applications.push(
                        new Application(`${entry.name} X`, null, x_exe, files)
                    )
                }
            }
        }

    }

    return applications;
}