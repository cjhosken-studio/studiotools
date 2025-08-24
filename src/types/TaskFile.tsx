import { join } from "@tauri-apps/api/path";
import { exists, mkdir, readDir, stat } from "@tauri-apps/plugin-fs";
import Application from "./Application";
import Context from "./Context";
import { createVersionedFileInFolder, getVersion, removeVersionFromName } from "../utils/Version";

export default class TaskFile {
    name: string = "";
    path: string = "";
    size: number = 0;
    version: number = 0;
    modified: Date | null = null;

    constructor(name: string = "", path: string = "", version: number = 0, size: number = 0, modified: Date | null = null) {
        this.name = name;
        this.path = path;
        this.version = version;
        this.size = size;
        this.modified = modified;
    }
}


export async function createTaskFile(application: Application, context: Context) {
    const id = application.id;
    const cwd = context.cwd;
    const wip = await join(cwd, "wip")

    const app_folder = await join(wip, id);

    if (!(await exists(app_folder))) {
        await mkdir(await join(app_folder));
    }

    const ext = application.files[0];
    const basename = `scene${ext}`
    const filename = await createVersionedFileInFolder(basename, app_folder);

    application.launch(await join(app_folder, filename))
}

export async function openTaskFile(application: Application, taskFile: TaskFile) {
    application.launch(taskFile.path)
}

export async function loadTaskFiles(task: string) : Promise<TaskFile[]> {
    const files : TaskFile[] = [];
    const wip = await join(task, "wip");

    const extensions = [".blend", ".hip", ".hipnc"];

    async function scanDir(dir: string) {
        const entries = await readDir(dir);
        for (const entry of entries) {
            const fullPath = await join(dir, entry.name);

            if (entry.isDirectory) {
                await scanDir(fullPath);
            } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                try {
                    const version = getVersion(entry.name);

                    const cleanName = removeVersionFromName(entry.name);

                    const stats = await stat(fullPath);
                    files.push(
                        new TaskFile(
                            cleanName, 
                            fullPath,
                            version ?? 0,
                            stats.size ?? 0,
                            stats.mtime ? new Date(stats.mtime) : null
                        )
                    );
                } catch (err) {
                    console.error(`Failed to read metadata for ${fullPath}`, err);
                }
            }
        }
    }

    await scanDir(wip);

    return files;
}