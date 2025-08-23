import { useEffect, useState } from "react";

import "./TaskTree.css";
import TaskFile, { loadTaskFiles } from "../../types/TaskFile";
import Context from "../../types/Context";
import ApplicationDialog from "../dialogs/ApplicationDialog";
import { formatFileSize, formatIconFromTaskfile, formatTime, formatVersion } from "../../utils/Format";

export default function TaskTree(
    {
        context

    }: {
        context: Context
    }
) {
    const [files, setFiles] = useState<TaskFile[]>([]);
    const [openApplication, setOpenApplication] = useState(false);
    const [taskFile, setTaskFile] = useState<TaskFile | null>(null);

    const [sortKey, setSortKey] = useState<"name" | "version" | "size" | "modified">("modified");
    const [sortAsc, setSortAsc] = useState(false);

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

    useEffect(() => {
        const loadFiles = async () => {
            const files = await loadTaskFiles(context.cwd);
            setFiles(files);
        }

        loadFiles();
    });

    function openTaskFile(taskfile: TaskFile) {
        setTaskFile(taskfile);
        setOpenApplication(true)
    };

    return (
        <div id="task-tree">
            <div id="task-tree-panel">
                <div id="task-header">
                    <button onClick={() => { setTaskFile(null); setOpenApplication(true) }}> Create + </button>
                </div>
                <table id="task-tree-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>File</th>
                            <th onClick={() => handleSort("version")}>Version</th>
                            <th onClick={() => handleSort("size")}>Size</th>
                            <th onClick={() => handleSort("modified")}>Modified</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFiles.map((taskfile, i) => (
                            <tr
                                key={i}
                                onDoubleClick={() => openTaskFile(taskfile)}
                            >   
                                <td><img src={formatIconFromTaskfile(taskfile)}/></td>
                                <td>{taskfile.name}</td>
                                <td>{formatVersion(taskfile.version)}</td>
                                <td>{formatFileSize(taskfile.size)} </td>
                                <td>{formatTime(taskfile.modified)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {openApplication && (
                    <ApplicationDialog context={context} taskFile={taskFile} onClose={() => { setOpenApplication(false) }} />
                )}
            </div>
        </div>
    )
}