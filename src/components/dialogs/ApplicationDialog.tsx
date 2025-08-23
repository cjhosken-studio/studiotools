import Context from "../../types/Context"

import "./ApplicationDialog.css"
import TaskFile, { createTaskFile, openTaskFile } from "../../types/TaskFile";
import { useEffect, useState } from "react";
import Application, { loadDefaultApplications } from "../../types/Application";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

export default function ApplicationDialog({
    context,
    taskFile,
    onClose,
}: {
    context: Context
    taskFile: TaskFile | null
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

    function handleAction(app: Application) {
        if (taskFile) {
            openTaskFile(app, taskFile);
        } else {
            createTaskFile(app, context)
        }
    }

    const filteredApplications = taskFile 
        ? applications.filter(app => app.files.some(ext => taskFile.name.toLowerCase().endsWith(ext.toLowerCase())))
        : applications;

    return (
        <div className="dialog">
            <div id="application-dialog">
                <div id="header">
                    <button id="close" onClick={onClose}> <FontAwesomeIcon icon={faClose} /> </button>
                </div>
                <div id="app-list">
                    {filteredApplications.map((app, i) => (
                        <div key={i} className="appItem" onClick={() => handleAction(app)}>
                            <img src={app.getIcon()} alt="" className="appIcon" />
                            <div className="appInfo">
                                <p className="appName">{app.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}