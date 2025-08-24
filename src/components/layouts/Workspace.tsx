import { useEffect, useState } from "react";

import "./Workspace.css";
import { useAppContext } from "../../ContextProvider";
import { getTypeFromFolder } from "../../types/Project";
import TaskTree from "../trees/TaskTree";
import AssetTree from "../trees/AssetTree";
import PropertiesPanel from "./Properties";
import Asset from "../../types/Asset";

export default function Workspace() {
    const { context, setContext } = useAppContext();
    const [isInTask, setIsInTask] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    useEffect(() => {
        const checkTask = async () => {
            setIsInTask(await getTypeFromFolder(context.cwd) === "task")
        };
        checkTask();
        setSelectedAsset(null);
    }, [context.cwd]);

    return (
        <div id="workspace-panel">
            <div className="row">

                <div className="column">
                    {isInTask && (
                        <TaskTree />
                    )}
                    <AssetTree selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />
                </div>
                {selectedAsset && (<PropertiesPanel asset={selectedAsset} />)}
            </div>
        </div>
    );
}