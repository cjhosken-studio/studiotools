import { join } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";

export default class Asset {
    name: string = "";
    path: string = "";

    constructor(name: string = "", path: string = "") {
        this.name = name;
        this.path = path;
    }
}

export async function loadAssets(task: string) : Promise<Asset[]> {
    const assets : Asset[] = [];
    const versions = await join(task, "versions");
    const published = await join(task, "published");

    const entries = await readDir(versions);
    for (const entry of entries) {
        assets.push(
            new Asset(entry.name, await join(versions, entry.name))
        )
    }

    return assets;
}