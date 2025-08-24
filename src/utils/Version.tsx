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


export async function createVersionedFileInFolder(basename: string, folder: string) {
    const ext = await extname(basename);
    const name = basename.slice(0, -(ext.length+1));

    const version = await getNextGlobalVersion(folder);
    const padded = String(version).padStart(3, "0");

    return `${name}_v${padded}.${ext}`;
}


export function removeVersionFromName(basename: string): string {
    // Matches "_v" followed by 1+ digits at the end, optionally before an extension
    const cleanName = basename.replace(/_v\d+(?=(\.[^.]+)?$)/, "");
    return cleanName;
}


export async function getLatestVersion(folder: string): Promise<number> {
    const entries = await readDir(folder);
    let maxVersion = 0;

    for (const entry of entries) {
        if (!entry.isFile) continue;

        const match = entry.name.match(/_v(\d+)/);
        if (match) {
            const ver = parseInt(match[1], 10);
            if (ver > maxVersion) maxVersion = ver;
        }
    }

    return maxVersion;
}

export async function getNextGlobalVersion(folder: string): Promise<number> {
    const latest = await getLatestVersion(folder);
    return latest + 1;
}
