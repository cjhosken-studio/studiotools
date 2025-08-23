import { useEffect, useState } from "react";

import "./AssetTree.css";
import Context from "../../types/Context";
import Asset, { loadAssets } from "../../types/Asset";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

export default function AssetTree(
    {
        context

    }: {
        context: Context
    }
) {
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const load = async () => {
            const files = await loadAssets(context.cwd);
            setAssets(files);
        }

        load();
    });

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
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset, i) => (
                            <tr key={i} onDoubleClick={() => handleAction(asset)} className="assetItem">
                                <td>{asset.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}