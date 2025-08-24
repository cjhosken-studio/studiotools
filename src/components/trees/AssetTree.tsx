import { useEffect, useState } from "react";

import "./AssetTree.css";
import Context from "../../types/Context";
import Asset, { loadAssets } from "../../types/Asset";
import { invoke } from "@tauri-apps/api/core";
import { dirname, join } from "@tauri-apps/api/path";
import { formatFileSize, formatIconFromAssetType, formatTime, formatVersion } from "../../utils/Format";
import { MenuAction } from "../../types/Menu";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import DeleteDialog from "../dialogs/DeleteDialog";
import { platform } from "@tauri-apps/plugin-os";
import { openPath } from "@tauri-apps/plugin-opener";
import { removeVersionFromName } from "../../utils/Version";
import { exists, remove } from "@tauri-apps/plugin-fs";

export default function AssetTree(
    {
        context,
        setContext

    }: {
        context: Context
        setContext: (context: Context) => void;
    }
) {
    const [assets, setAssets] = useState<Asset[]>([]);

    const [sortKey, setSortKey] = useState<"name" | "version" | "size" | "modified">("modified");
    const [sortAsc, setSortAsc] = useState(false);

    const [menuActions, setMenuActions] = useState<MenuAction[]>([]);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [pathToDelete, setPathToDelete] = useState<string | null>(null);

    useEffect(() => {
        const handleClick = () => { setMenuPosition(null) };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    function handleSort(key: typeof sortKey) {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    }

    const sortedAssets = [...assets].sort((a, b) => {
        let valA: number | string;
        let valB: number | string;

        if (sortKey == "modified") {
            valA = a.modified ? a.modified.getTime() : 0;
            valB = a.modified ? a.modified.getTime() : 0;
        } if (sortKey == "size") {
            valA = a.size ? a.size : 0;
            valB = b.size ? b.size : 0
        }

        else {
            valA = a[sortKey] as number | string;
            valB = b[sortKey] as number | string;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    async function refresh() {
            const assets = await loadAssets(context.cwd);
            setAssets(assets);
     }

    useEffect(() => {
        refresh();
    });

    async function launchUSDView(asset: Asset) {
        invoke("launch", { executable: "usdview", id: "usdview", path: await join(asset.path, "stage.usd") })

    }

    const handleRightClick = (e: React.MouseEvent, asset: Asset) => {
        e.preventDefault();

        const actions: MenuAction[] = []

        if (asset.type === "usd") {
            actions.push({ label: "Open with USDView", onClick: () => launchUSDView(asset) });
        }

        actions.push({ label: "Set as Published", onClick: async () => await setAsPublished(asset) });
        const prettyPlatform = platform().charAt(0).toUpperCase() + platform().slice(1);
        actions.push({ label: `Open in ${prettyPlatform}`, onClick: async () => await openPath(asset.path) });
        actions.push({ label: "Copy Path", onClick: async () => await writeText(asset.path) });
        actions.push({ label: "Delete", onClick: () => setPathToDelete(asset.path) });

        setMenuActions(actions);
        setMenuPosition({ x: e.clientX, y: e.clientY });
    }

    const handleMenuAction = (action: MenuAction) => {
        setMenuPosition(null);
        action.onClick();
    }

    async function setAsPublished(asset: Asset) {
        const publishedPath = await join(await dirname(await dirname(asset.path)), "published");

        const cleanName = removeVersionFromName(asset.name);
        const symlinkPath = await join(publishedPath, cleanName);

        if (await exists(symlinkPath)) {
            await remove(symlinkPath);
        }

        invoke("symlink", {asset: asset.path, symlink: symlinkPath});
    }

    return (
        <div id="asset-tree">
            <div id="asset-tree-panel">
                <table id="asset-tree-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>File</th>
                            <th onClick={() => handleSort("version")}>Version</th>
                            <th onClick={() => handleSort("size")}>Size</th>
                            <th onClick={() => handleSort("modified")}>Modified</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAssets.map((asset, i) => (
                            <tr key={i} onContextMenu={(e) => handleRightClick(e, asset)} onDoubleClick={() => launchUSDView(asset)} className={`assetItem ${asset.published ? "published" : ""}`}>
                                <td><img src={formatIconFromAssetType(asset.type)} /></td>
                                <td>{asset.name}</td>
                                <td>{formatVersion(asset.version)}</td>
                                <td>{formatFileSize(asset.size)} </td>
                                <td>{formatTime(asset.modified)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {menuPosition && (
                <div className="popup">
                    <ul
                        className="menu"
                        style={{
                            position: "fixed",
                            top: menuPosition.y,
                            left: menuPosition.x,
                            listStyle: "none",
                            backgroundColor: "#131313",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderRadius: "0em 1em 1em 1em",
                            borderColor: "#333333",
                            zIndex: 1000,
                        }}
                    >
                        {menuActions.map((action) => (
                            <li
                                key={action.label}
                                onClick={() => handleMenuAction(action)}
                                className="menuItem"
                            >
                                {action.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {pathToDelete && (
                <DeleteDialog pathToDelete={pathToDelete} setPathToDelete={setPathToDelete} context={context} setContext={setContext} refresh={refresh} onClose={() => { setPathToDelete(null) }} />
            )}
        </div>
    )
}