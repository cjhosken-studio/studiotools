import { useEffect } from "react";
import { useAppContext } from "../ContextProvider";

import "./Workspace.css";

export default function WorkspacePanel() {
    const { context, projectList, setContext, setProjectList } = useAppContext();

    useEffect(() => {
        (async () => {
            
        })();
    }, []);

    return (
        <div id="workspace-panel">
            <p> Workspace </p>
        </div>
    );
}