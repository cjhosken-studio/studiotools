import { useEffect, useState } from "react";
import { TreeNode } from "./ProjectTree";
import { join } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { createFolder } from "../../types/Project";

import "./ProjectFolderDialog.css"

export default function ProjectFolderDialog({
    node,
    type,
    refresh,
    onClose,
}: {
    node: TreeNode;
    type: string | "folder";
    refresh: () => void;
    onClose: () => void;
}) {
    const [name, setName] = useState("folder");
    const [subtype, setSubtype] = useState<string>("custom");
    const [userTyped, setUserTyped] = useState(false);
    const [folderExists, setFolderExists] = useState(false);

    useEffect(() => {
        const checkExists = async() => {
            if (!name) return setFolderExists(false);
            const fullPath = await join(node.id, name)
            const doesExist = await exists(fullPath);
            setFolderExists(doesExist);
        };
        checkExists();
    }, [name, node.id]);

    useEffect(() => {
        if (!userTyped && type !== "folder") {
            setName(subtype);
        }
    }, [subtype, userTyped, type]);

    const handleCreate = async () => {
        const fullPath = await join(node.id, name);
        await createFolder(fullPath, type, subtype)
        refresh();
        onClose();
    }

    const options = () => {
        const subtype_options = []

        if (node.type === "folder") {
            subtype_options.push(
                "asset", "shot"
            )
        }

        if (node.type === "taskarea") {
            if (node.subtype == "asset") {
                subtype_options.push(
                    "scan",
                    "model", 
                    "texture", 
                    "lookdev", 
                    "rig",
                    "fx"
                )
            }

            if (node.subtype == "shot") {
                subtype_options.push(
                    "track",
                    "layout", 
                    "animate",
                    "fx",
                    "light",
                    "comp"
                )
            }

            subtype_options.push("tool")
        }

        subtype_options.push("custom")
        return subtype_options
    }

    return (
        <div id="project-folder-dialog">
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => {
                        setName(e.target.value); 
                        setUserTyped(true);
                    }}
                autoFocus
            />
            {type !== "folder" && (
                <select
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                >
                    {options().map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            )

            }
            <div className="row">
            <button onClick={onClose}>Cancel</button>
            <button onClick={handleCreate} disabled={
                !name || folderExists
            }>Create</button>
            </div>

        </div>
    )
}