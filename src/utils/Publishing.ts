import { dirname, join } from "@tauri-apps/api/path";
import Asset from "../types/Asset";
import { removeVersionFromName } from "./Version";
import { exists, remove } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

export default async function setAsPublished(asset: Asset) {
        const publishedPath = await join(await dirname(await dirname(asset.path)), "published");

        const cleanName = removeVersionFromName(asset.name);
        const symlinkPath = await join(publishedPath, cleanName);

        if (await exists(symlinkPath)) {
            await remove(symlinkPath);
        }

        invoke("symlink", { asset: asset.path, symlink: symlinkPath });
    }