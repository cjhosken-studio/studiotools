import { join } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile, stat } from "@tauri-apps/plugin-fs";
import { getVersion, removeVersionFromName } from "../utils/Version";
import yaml from "js-yaml";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getTypeFromFolder } from "./Project";

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

    constructor(name: string = "", path: string = "", version: number = 0, size: number = 0, modified: Date | null = null, root: string = "", type: string = "", published = false, thumbnail = "") {
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
        if (this.type === "images") {
            return convertFileSrc(this.root + "/" + "render.0011.exr");
        }

        if (this.thumbnail) {
            return convertFileSrc(this.thumbnail!);
        }

        return ""
    }
}

export async function loadAssets(path: string): Promise<Asset[]> {
    const assets: Asset[] = [];

    if (!path || !(await exists(path))) return assets;

    const scanFolder = async (folder: string) => {
        if (await getTypeFromFolder(folder) === "task") {
            const versions = await join(folder, "versions");
            const published = await join(folder, "published");

            const entries = await readDir(versions);
            const childAssets = (
                await Promise.all(
                    entries.map(async entry => {
                        const path = await join(versions, entry.name);

                        const metadata = await join(path, "metadata.yaml");
                        if (!(await exists(metadata))) {
                            return null;
                        }

                        const version = getVersion(entry.name);
                        const name = removeVersionFromName(entry.name);

                        const root = await getRootFromAssetPath(path);
                        const type = await getTypeFromAssetPath(path);
                        // Check if published

                        const thumbnail = await join(path, "thumbnail.png");

                        let is_published = false;

                        const publishedEntry = await join(published, name);
                        if (await exists(publishedEntry)) {
                            const published_version = await getVersionFromAssetPath(publishedEntry);
                            is_published = published_version === version;
                        }

                        const stats = await stat(root);

                        return new Asset(
                            name,
                            path,
                            version ?? 0,
                            stats.size ?? 0,
                            stats.mtime ? new Date(stats.mtime) : null,
                            root,
                            type,
                            is_published,
                            thumbnail
                        )
                    })
                )
            ).filter((a: Asset | null): a is Asset => a !== null);  // <-- filter nulls safely

            assets.push(...childAssets);

        } else {
            const subEntires = await readDir(folder);
            await Promise.all(
                subEntires
                    .filter(e => e.isDirectory)
                    .map(async e => {
                        const subFolder = await join(folder, e.name);
                        await scanFolder(subFolder)
                    })
            );
        }
    };

    await scanFolder(path);
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