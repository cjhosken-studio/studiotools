import TaskFile from "../types/TaskFile";


export function formatTime(date: Date | null): string {
    if (!date) return "N/A"

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const intervals: [number, string][] = [
        [60, "second"],
        [60, "minute"],
        [24, "hour"],
        [7, "day"],
        [4.34524, "week"],  // ~1 month
        [12, "month"],
        [Number.MAX_SAFE_INTEGER, "year"],
    ];

    let unit = "second";
    let value = seconds;

    for (const [limit, name] of intervals) {
        if (value < limit) {
            unit = name;
            break;
        }
        value = Math.floor(value / limit);
        unit = name;
    }

    return `${value} ${unit}${value !== 1 ? "s" : ""} ago`;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}

export function formatVersion(version: number): string {
    return `v${String(version).padStart(3, "0")}`;
}

export function formatIconFromTaskfile(taskfile: TaskFile) {
    const path = taskfile.path;

    // Remove trailing slash/backslash
    const cleaned = path.replace(/[\\/]+$/, "");

    // Find the last folder separator
    const lastSlash = Math.max(cleaned.lastIndexOf("/"), cleaned.lastIndexOf("\\"));

    // Get parent folder name
    const parentFolder = lastSlash !== -1 ? cleaned.slice(0, lastSlash) : cleaned;
    const folderName = parentFolder.split(/[\\/]/).pop() || "";

    return `/icons/${folderName}.png`;
}

export function formatIconFromAssetType(type: string) {
    return `/icons/${type}.png`;
}