import { extname } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";

export function getVersion(name: string) {
    let version = 0;
    const versionMatch = name.match(/_v(\d+)/);
    if (versionMatch) {
        version = parseInt(versionMatch[1], 10);
    }

    return version;
}

export function getNextVersion(name: string) {
    const version = getVersion(name);
    return version + 1;
}


export async function getNewTaskFileName(basename: string, wip : string) {
    const ext = await extname(basename);
    const name = basename.slice(0, -(ext.length+1));

    const version = await getNextGlobalVersion(wip);
    const padded = String(version).padStart(3, "0");

    return `${name}_v${padded}.${ext}`;
}


export function removeVersionFromName(basename: string): string {
    // Matches "_v" followed by 1+ digits at the end, optionally before an extension
    const cleanName = basename.replace(/_v\d+(?=(\.[^.]+)?$)/, "");
    return cleanName;
}


export async function getLatestVersionRecursive(folder: string): Promise<number> {
    let maxVersion = 0;

    async function checkFolder(path: string) {
        const entries = await readDir(path);
        for (const entry of entries) {
            const fullPath = `${path}/${entry.name}`;
            if (entry.isFile) {
                const match = entry.name.match(/_v(\d+)/);
                if (match) {
                    const ver = parseInt(match[1], 10);
                    if (ver > maxVersion) maxVersion = ver;
                }
            } else if (entry.isDirectory) {
                await checkFolder(fullPath); // recursively check subfolder
            }
        }
    }

    await checkFolder(folder);
    return maxVersion;
}

export async function getNextGlobalVersion(folder: string): Promise<number> {
    const latest = await getLatestVersionRecursive(folder);
    return latest + 1;
}
