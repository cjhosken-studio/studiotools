import Context from "../../types/Context"

import "./ConfigureProjectDialog.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Application, { loadApplications } from "../../types/Application";
import { homeDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import yaml from "js-yaml";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";  // or plugin-fs if v2

export default function ConfigureProjectDialog({
    context,
    onClose
}: {
    context: Context
    onClose: () => void;
}) {
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        fetchApps();
    }, [])

    async function CreateApplicationLauncher(context: Context) {
        const exe = await open({
            defaultPath: await homeDir(),
            directory: false,
            multiple: false,
        });

        if (!exe) return;

        const appConfigPath = await join(context.project.path, "apps.yaml");

        let config: { apps?: Array<{ name: string; path: string }> } = {};

        try {
            const existing = await readTextFile(appConfigPath);
            config = (yaml.load(existing)) || {};
        } catch (e) {
            console.log(e);
        }

        if (!Array.isArray(config.apps)) {
            config.apps = [];
        }

        // Add or avoid duplicates
        if (!config.apps.some(a => a.name === exe)) {
            config.apps.push({
                name: exe,
                path: exe
            });
        }

        // Turn object → YAML
        const out = yaml.dump(config);

        // Save updated file
        await writeTextFile(appConfigPath, out);
    };

    async function fetchApps() {
        const apps = await loadApplications(context);
        setApplications(apps);
    }

    return (
        <div className="dialog">
            <div id="configure-project-dialog">
                <div id="header">
                    <p id="title"> Configuring: {context.project.name} </p>
                    <button id="close" onClick={onClose}> <FontAwesomeIcon icon={faClose} /> </button>
                </div>
                <div id="subheader">
                    <button id="create" onClick={() => { CreateApplicationLauncher(context) }}>Add Application</button>
                </div>
                <div id="app-list">
                    {applications.length === 0 ? (
                        <p> No Apps Found </p>
                    ) : (
                        <div>
                            {applications.map((app, i) => (
                                <div key={i} className="appItem">
                                    <span className="appIcon">
                                        {app.icon ? "📦" : <img src={app.getIcon()} alt="" className="appIcon" />}
                                    </span>
                                    <div className="appInfo">
                                        <p className="appName">{app.name}</p>
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