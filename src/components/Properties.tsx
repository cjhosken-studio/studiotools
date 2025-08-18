import { useEffect } from "react";
import { useAppContext } from "../ContextProvider";

import "./Properties.css";

export default function PropertiesPanel() {
    const { context, projectList, setContext, setProjectList } = useAppContext();

    useEffect(() => {
        (async () => {

        })();
    }, []);

    return (
        <div id="properties-panel">
            <p> Properties </p>
        </div>
    );
}