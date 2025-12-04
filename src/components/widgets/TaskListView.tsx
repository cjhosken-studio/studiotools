import { useEffect, useState } from "react";

import "./ListView.css"
import "./TaskListView.css";
import TaskFile, { loadTaskFiles } from "../../types/TaskFile";
import ApplicationDialog from "../dialogs/ApplicationDialog";
import { formatFileSize, formatIconFromTaskfile, formatTime, formatVersion } from "../../utils/Format";
import { MenuAction } from "../../types/Menu";
import { platform } from "@tauri-apps/plugin-os";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openPath } from "@tauri-apps/plugin-opener";
import DeleteDialog from "../dialogs/DeleteDialog";
import { dirname } from "@tauri-apps/api/path";
import { useAppContext } from "../../ContextProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRefresh } from "@fortawesome/free-solid-svg-icons";

export default function TaskListView(
    {
        selectedTaskFile,
        setSelectedTaskFile
    }: {
        selectedTaskFile: TaskFile | null;
        setSelectedTaskFile: (taskFile: TaskFile | null) => void;
    }
) {
    const { context, setContext } = useAppContext();

    const [files, setFiles] = useState<TaskFile[]>([]);
    const [openApplication, setOpenApplication] = useState(false);
    const [taskFile, setTaskFile] = useState<TaskFile | null>(null);

    const [sortKey, setSortKey] = useState<"name" | "version" | "size" | "modified">("modified");
    const [sortAsc, setSortAsc] = useState(false);

    const [menuActions, setMenuActions] = useState<MenuAction[]>([]);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);

    const [pathToDelete, setPathToDelete] = useState<string | null>(null);

    useEffect(() => {
        const handleClick = () => { setMenuPosition(null) };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    function handleSort(key: typeof sortKey) {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    }

    const sortedFiles = [...files].sort((a, b) => {
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

    async function refresh() {
        const taskFiles = await loadTaskFiles(context.cwd)
        setFiles(taskFiles);
    }

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000); // every 5 seconds
        return () => clearInterval(interval);
    }, [context.cwd]);

    function openTaskFile(taskfile: TaskFile) {
        setTaskFile(taskfile);
        setOpenApplication(true)
    };

    const handleRightClick = (e: React.MouseEvent, taskfile: TaskFile) => {
        e.preventDefault();

        const actions: MenuAction[] = []

        actions.push({ label: "Open", onClick: () => openTaskFile(taskfile) });

        const prettyPlatform = platform().charAt(0).toUpperCase() + platform().slice(1);
        actions.push({ label: `Open in ${prettyPlatform}`, onClick: async () => await openPath(await dirname(taskfile.path)) });
        actions.push({ label: "Copy Path", onClick: async () => await writeText(taskfile.path) });
        actions.push({ label: "Delete", onClick: () => setPathToDelete(taskfile.path) });

        setMenuActions(actions);
        setMenuPosition({ x: e.clientX, y: e.clientY });
    }

    const handleMenuAction = (action: MenuAction) => {
        setMenuPosition(null);
        action.onClick();
    }

    return (
        <div className="listView">
            <div className="listViewPanel">
                <div className="listViewHeader">
                    <button className="create-button" onClick={() => { setTaskFile(null); setOpenApplication(true) }}> Create + </button>
                    <button className="iconButton" onClick={() => { refresh() }}> <FontAwesomeIcon icon={faRefresh} /> </button>
                </div>
                <div className="listViewContainer">
                    <table className="listViewTable">
                        <thead>
                            <tr>
                                <th></th>
                                <th onClick={() => handleSort("name")}>File</th>
                                <th onClick={() => handleSort("version")}>Version</th>
                                <th onClick={() => handleSort("size")}>Size</th>
                                <th onClick={() => handleSort("modified")}>Modified</th>
                            </tr>
                        </thead>
                    </table>
                    <div id="listViewBodyContainer">
                        <table className="listViewTable">
                            <tbody>
                                {sortedFiles.map((taskfile, i) => (
                                    <tr
                                        key={i}
                                        onContextMenu={(e) => handleRightClick(e, taskfile)}
                                        onClick={() => {
                                            if (selectedTaskFile && selectedTaskFile.path == taskfile.path) {
                                                setSelectedTaskFile(null);
                                            } else {
                                                setSelectedTaskFile(taskfile);
                                            }
                                        }}
                                        onDoubleClick={() => openTaskFile(taskfile)}
                                        className={`listViewItem ${selectedTaskFile && taskfile.path == selectedTaskFile.path ? "selected" : ""}`}
                                    >
                                        <td><img src={formatIconFromTaskfile(taskfile)} /></td>
                                        <td>{taskfile.name}</td>
                                        <td>{formatVersion(taskfile.version)}</td>
                                        <td>{formatFileSize(taskfile.size)} </td>
                                        <td>{formatTime(taskfile.modified)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {menuPosition && (
                    <div className="popup">
                        <ul
                            className="menu"
                            style={{
                                position: "fixed",
                                top: menuPosition.y,
                                left: menuPosition.x,
                                listStyle: "none",
                                backgroundColor: "#131313",
                                borderWidth: "1px",
                                borderStyle: "solid",
                                borderRadius: "0em 1em 1em 1em",
                                borderColor: "#333333",
                                zIndex: 1000,
                            }}
                        >
                            {menuActions.map((action) => (
                                <li
                                    key={action.label}
                                    onClick={() => handleMenuAction(action)}
                                    className="menuItem"
                                >
                                    {action.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {pathToDelete && (
                    <DeleteDialog pathToDelete={pathToDelete} setPathToDelete={setPathToDelete} context={context} setContext={setContext} refresh={refresh} onClose={() => { setPathToDelete(null) }} />
                )}
                {openApplication && (
                    <ApplicationDialog context={context} taskFile={taskFile} onClose={() => { setOpenApplication(false) }} />
                )}
            </div>
        </div>
    )
}