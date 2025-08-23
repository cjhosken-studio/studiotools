import Context from "../../types/Context"

import "./ConfigureProjectDialog.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Application, { loadDefaultApplications } from "../../types/Application";

export default function ConfigureProjectDialog({
    context,
    onClose
}: {
    context: Context
    onClose: () => void;
}) {
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        async function fetchApps() {
            const apps = await loadDefaultApplications();
            setApplications(apps);
        }
        fetchApps();
    }, [])

    return (
        <div className="dialog">
            <div id="configure-project-dialog">
                <div id="header">
                    <p id="title"> Configuring: {context.project.name} </p>
                    <button id="close" onClick={onClose}> <FontAwesomeIcon icon={faClose}/> </button>
                </div>
                <div id="app-list">
                    {applications.length === 0 ? (
                        <p> No Apps Found </p>
                    ) : (
                        <div>
                            {applications.map((app, i) => (
                            <div key={i} className="appItem">
                                <span className="appIcon">
                                    {app.icon ? <img src={app.getIcon()} alt=""/> : "📦"}
                                </span>
                                <div className="appInfo">
                                    <p className="appName">{app.name}</p>
                                    <button onClick={() => app.launch()} className="app-executable">Launch</button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}