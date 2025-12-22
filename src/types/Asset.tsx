import { join } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile, stat } from "@tauri-apps/plugin-fs";
import { getVersion, removeVersionFromName } from "../utils/Version";
import yaml from "js-yaml";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getTypeFromFolder } from "./Project";
import { getFolderSize } from "../utils/Files";
import { formatVersion } from "../utils/Format";

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

    getThumbnail(): string[] {
        if (this.thumbnail) {
            return [convertFileSrc(this.thumbnail!)];
        }

        return []
    }

    async getImages(): Promise<string[]> {
        if (this.type !== "images") return [];

        try {
            const entires = await readDir(this.root);

            return entires.sort((a, b) => {
                // sort numerically: render.0001.exr < render.0010.exr
                const na = a.name?.match(/\d+/)?.[0] ?? "0";
                const nb = b.name?.match(/\d+/)?.[0] ?? "0";
                return Number(na) - Number(nb);
            })
                .map((e) =>
                    convertFileSrc(`${this.root}/${e.name}`)
                )
        }
        catch (err) {
            console.error("Failed to read image sequence:", err);
            return [];
        }
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
                            console.log("current v", version.toString());
                            console.log("published v", published_version);
                            is_published = published_version.toString() === version.toString();
                        }

                        const stats = await stat(root);

                        let size = stats.size;

                        if (type === "images") {
                            size = await getFolderSize(root);
                        }

                        return new Asset(
                            name,
                            path,
                            version ?? 0,
                            size ?? 0,
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

export async function getVersionFromAssetPath(asset_path: string): Promise<string> {
    try {
        const metadataYamlPath = await join(asset_path, "metadata.yaml");
        if (!(await exists(metadataYamlPath))) return "v000";

        const content = await readTextFile(metadataYamlPath);
        const data = yaml.load(content) as { version: string };
        return data.version ?? "v000";
    } catch (err) {
        console.error("Error reading metadata.yaml:", err);
        return "v000";
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