import { join } from "@tauri-apps/api/path";
import { readDir, stat } from "@tauri-apps/plugin-fs";
import { getVersion, removeVersionFromName } from "../utils/Version";

export default class Asset {
    name: string = "";
    path: string = "";
    size: number = 0;
    version: number = 0;
    modified: Date | null = null;
    root: string = "";
    rootType: string = "";

    constructor(name: string = "", path: string = "", version: number = 0, size: number = 0, modified: Date | null = null, root: string = "", rootType: string="") {
        this.name = name;
        this.path = path;
        this.version = version;
        this.size = size;
        this.modified = modified;
        this.root = root;
        this.rootType = rootType;
    }
}

export async function loadAssets(task: string) : Promise<Asset[]> {
    const assets : Asset[] = [];
    const versions = await join(task, "versions");

    const entries = await readDir(versions);
    for (const entry of entries) {
        const fullPath = await join(versions, entry.name);
        const version = getVersion(entry.name);
        const cleanName = removeVersionFromName(entry.name);

        const root = await join(fullPath, "stage.usd")
        const rootType = "usd";

        const stats = await stat(root);

        assets.push(
            new Asset(cleanName, fullPath, version ?? 0, stats.size ?? 0, stats.mtime ? new Date(stats.mtime) : null, root, rootType)
        )
    }

    return assets;
}