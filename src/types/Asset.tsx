import { join } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile, stat } from "@tauri-apps/plugin-fs";
import { getVersion, removeVersionFromName } from "../utils/Version";
import yaml from "js-yaml";
import { convertFileSrc } from "@tauri-apps/api/core";

export default class Asset {
    name: string = "";
    path: string = "";
    size: number = 0;
    version: number = 0;
    modified: Date | null = null;
    root: string = "";
    type: string = "";
    published: boolean = false;
    thumbnail: string;

    constructor(name: string = "", path: string = "", version: number = 0, size: number = 0, modified: Date | null = null, root: string = "", type: string="", published = false, thumbnail="") {
        this.name = name;
        this.path = path;
        this.version = version;
        this.size = size;
        this.modified = modified;
        this.root = root;
        this.type = type;
        this.published = published;
        this.thumbnail = thumbnail;
    }

    getThumbnail() {
        if (this.thumbnail) {
            return convertFileSrc(this.thumbnail!)
        } 

        return ""
    }
}

export async function loadAssets(task: string) : Promise<Asset[]> {
    const assets : Asset[] = [];
    const versions = await join(task, "versions");
    const published = await join(task, "published");

    const entries = await readDir(versions);
    for (const entry of entries) {
        const fullPath = await join(versions, entry.name);
        const version = getVersion(entry.name);
        const cleanName = removeVersionFromName(entry.name);

        const root = await getRootFromAssetPath(fullPath);
        const type = await getTypeFromAssetPath(fullPath);
        // Check if published

        const thumbnailPath = await join(fullPath, "thumbnail.png");

        let is_published = false;

        const publishedEntry = await join(published, cleanName);
        if (await exists(publishedEntry)) {
            const published_version = await getVersionFromAssetPath(publishedEntry);
            is_published = published_version === version;
        }

        const stats = await stat(root);

        assets.push(
            new Asset(cleanName, fullPath, version ?? 0, stats.size ?? 0, stats.mtime ? new Date(stats.mtime) : null, root, type, is_published, thumbnailPath)
        )
    }

    return assets;
}

export async function getVersionFromAssetPath(asset_path: string): Promise<number> {
    try {
        const metadataYamlPath = await join(asset_path, "metadata.yaml");
        if (!(await exists(metadataYamlPath))) return 0;

        const content = await readTextFile(metadataYamlPath);
        const data = yaml.load(content) as { version: number };
        return data.version ?? 0;
    } catch (err) {
        console.error("Error reading metadata.yaml:", err);
        return 0;
    }
}

export async function getRootFromAssetPath(asset_path: string): Promise<string> {
    try {
        const metadataYamlPath = await join(asset_path, "metadata.yaml");
        if (!(await exists(metadataYamlPath))) return "";

        const content = await readTextFile(metadataYamlPath);
        const data = yaml.load(content) as { root: string };
        return data.root ?? "";
    } catch (err) {
        console.error("Error reading metadata.yaml:", err);
        return "folder";
    }
}

export async function getTypeFromAssetPath(asset_path: string): Promise<string> {
    try {
        const metadataYamlPath = await join(asset_path, "metadata.yaml");
        if (!(await exists(metadataYamlPath))) return "usd";

        const content = await readTextFile(metadataYamlPath);
        const data = yaml.load(content) as { type: string };
        return data.type ?? "usd";
    } catch (err) {
        console.error("Error reading folder.yaml:", err);
        return "usd";
    }
}