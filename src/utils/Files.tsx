import { join } from "@tauri-apps/api/path";
import { readDir, stat } from "@tauri-apps/plugin-fs";


export async function getFolderSize(path: string): Promise<number> {
  let total = 0;

  const entries = await readDir(path);

  for (const entry of entries) {
    const stats = await stat(await join(path, entry.name));

    if (!entry.isDirectory && typeof stats.size === "number") {
      total += stats.size;
    }
  }

  return total;
}