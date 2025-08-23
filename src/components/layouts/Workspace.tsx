import { useEffect, useState } from "react";

import "./Workspace.css";
import { useAppContext } from "../../ContextProvider";
import { getTypeFromFolder } from "../../types/Project";
import TaskTree from "../trees/TaskTree";
import AssetTree from "../trees/AssetTree";

export default function Workspace() {
    const { context } = useAppContext();
    const [isInTask, setIsInTask] = useState(false);

    useEffect(() => {
        const checkTask = async () => {
            setIsInTask(await getTypeFromFolder(context.cwd) === "task")
        };
        checkTask();
    }, [context.cwd]);

    return (
        <div id="workspace-panel">
            {isInTask && (
                <TaskTree context={context}/>
            )}
            <AssetTree context={context}/>
        </div>
    );
}