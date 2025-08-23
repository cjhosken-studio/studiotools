import { useEffect, useState } from "react";

import "./AssetTree.css";
import Context from "../../types/Context";
import Asset, { loadAssets } from "../../types/Asset";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { formatFileSize, formatIconFromAssetType, formatTime, formatVersion } from "../../utils/Format";

export default function AssetTree(
    {
        context

    }: {
        context: Context
    }
) {
    const [assets, setAssets] = useState<Asset[]>([]);

    const [sortKey, setSortKey] = useState<"name" | "version" | "size" | "modified">("modified");
    const [sortAsc, setSortAsc] = useState(false);

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

    useEffect(() => {
        const load = async () => {
            const assets = await loadAssets(context.cwd);
            setAssets(assets);
        }

        load();
    },[context.cwd]);

    async function handleAction(asset: Asset) {
        invoke("launch", { executable: "usdview", id: "usdview", path: await join(asset.path, "stage.usd") })

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
                            <tr key={i} onDoubleClick={() => handleAction(asset)} className="assetItem">
                                <td><img src={formatIconFromAssetType(asset.rootType)}/></td>
                                <td>{asset.name}</td>
                                <td>{formatVersion(asset.version)}</td>
                                <td>{formatFileSize(asset.size)} </td>
                                <td>{formatTime(asset.modified)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}