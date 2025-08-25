import { useEffect, useState } from "react";

import "./Workspace.css";
import { useAppContext } from "../../ContextProvider";
import { getTypeFromFolder } from "../../types/Project";
import TaskListView from "./TaskListView";
import AssetListView from "./AssetListView";
import PropertiesPanel from "./Properties";
import Asset from "../../types/Asset";
import TaskFile from "../../types/TaskFile";

export default function Workspace() {
    const { context } = useAppContext();
    const [isInTask, setIsInTask] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [selectedTaskFile, setSelectedTaskFile] = useState<TaskFile | null>(null);

    useEffect(() => {
        const checkTask = async () => {
            setIsInTask(await getTypeFromFolder(context.cwd) === "task")
        };
        checkTask();
        setSelectedAsset(null);
    }, [context]);

    return (
        <div id="workspace-panel">
            <div className="row">
                <div className="column">
                    {isInTask && (<TaskListView selectedTaskFile={selectedTaskFile} setSelectedTaskFile={setSelectedTaskFile}/>)}
                    <AssetListView selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />
                </div>
                {selectedAsset && (<PropertiesPanel asset={selectedAsset} />)}
            </div>
        </div>
    );
}