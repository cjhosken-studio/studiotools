import React, { useEffect, useState } from "react";
import { useAppContext } from "../../ContextProvider";

import "./ProjectTree.css";
import { exists, readDir, remove } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import Context from "../../types/Context";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openPath } from '@tauri-apps/plugin-opener';
import Project, { getIconFromTypes, getSubtypeFromFolder, getTypeFromFolder } from "../../types/Project";
import ProjectFolderDialog from "./ProjectFolderDialog";

export type TreeNode = {
    id: string;
    label: string;
    type: string | "folder";
    subtype: string | "custom";
    children?: TreeNode[];
    hasChildren?: boolean;
}

type MenuAction = {
    label: string
    onClick: () => void;
}

const isInPath = ( nodeId: string, cwd: string | null) => {
    console.log("checking:", nodeId, ">", cwd);
    if (!cwd) return false;
    return cwd.startsWith(nodeId)
}

function TreeItem({
    node,
    loadChildren,
    selectedId,
    onSelect,
    onRightClick,
    reloadCounter,
    defaultExpanded = false,
}: {
    node: TreeNode;
    loadChildren: (node: TreeNode) => Promise<TreeNode[]>;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onRightClick: (e: React.MouseEvent, node: TreeNode) => void;
    reloadCounter: number;
    defaultExpanded?: boolean;
}) {

    const [expanded, setExpanded] = useState(defaultExpanded);
    const [children, setChildren] = useState<TreeNode[] | null>(node.children ?? null);

    const loadNodeChildren = async () => {
        if (node.type === "task") return;
        const result = await loadChildren(node);
        setChildren(result);
    }

    useEffect(() => {
        if (defaultExpanded && children === null && node.hasChildren) {
            loadNodeChildren();
        }
    }, [defaultExpanded, node])

    useEffect(() => {
        if (children !== null) {
            loadNodeChildren();
        }
    }, [reloadCounter])

    const toggleExpand = async () => {
        if (node.type === "task") return;

        if (!expanded && node.hasChildren) {
            if (children === null) {
                const result = await loadChildren(node);
                setChildren(result);
            }
            setExpanded(true);
        } else {
            setExpanded(false);
        }
    };

    const isSelected = selectedId === node.id;

    return (
        <div>
            <li className={`tree-item ${expanded ? "expanded" : ""}`}>
                <div
                    className={`tree-label ${isSelected ? "selected" : ""}`}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onRightClick(e, node);
                    }}
                    style={{ cursor: node.hasChildren ? "pointer" : "default" }}
                >
                    <span className="tree-arrow"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(node.id);
                            if (node.hasChildren) toggleExpand();
                        }}
                    >
                        {node.type !== "task" && node.hasChildren ? (expanded ? "▼" : "▶") : " "}
                    </span>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(node.id);
                        }}
                    >
                        <span className="tree-icon">
                            {getIconFromTypes(node.type, node.subtype)}
                        </span>
                        <span className="tree-text">{node.label}</span>
                    </div>

                </div>
                <ul className={`tree-children ${expanded ? "open" : ""}`}>
                    {children?.map((child) => (
                        <TreeItem key={child.id} node={child} loadChildren={loadChildren} reloadCounter={reloadCounter} selectedId={selectedId} onSelect={onSelect} onRightClick={onRightClick} defaultExpanded={isInPath(node.id, selectedId)}/>
                    ))}
                </ul>
            </li>
        </div>
    )
}

export default function ProjectTreePanel() {
    const { context, setContext } = useAppContext();
    const [selectedId, setSelectedId] = useState<string | null>(context.cwd ?? null);
    const [root, setRoot] = useState<TreeNode>({
        id: context.project.path,
        label: context.project.name,
        type: "project",
        subtype: "custom",
        hasChildren: true,
    });

    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [menuActions, setMenuActions] = useState<MenuAction[]>([]);
    const [pathToDelete, setPathToDelete] = useState<string | null>(null);
    const [nodeToCreateFolder, setNodetoCreateFolder] = useState<TreeNode | null>(null);
    const [createFolderType, setCreateFolderType] = useState<string>("folder");
    const [projectToConfigure, setProjectToConfigure] = useState<Project | null>(null);

    const [reloadCounter, setReloadCounter] = useState(0);

    useEffect(() => {
        const handleClick = () => setMenuPosition(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        setSelectedId(context.cwd ?? null);
    }, [context.cwd]);

    const refresh = () => {
        if (context.project) {
            setRoot({
                id: context.project.path,
                label: context.project.name,
                type: "project",
                subtype: "custom",
                hasChildren: true,
            })
            setReloadCounter(prev => prev + 1)
        }
    }

    useEffect(() => {
        refresh();
    }, [context.project]);


    const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
        const entires = await readDir(node.id);
        const children: TreeNode[] = [];

        for (const e of entires) {
            if (!e.isDirectory) continue;
            const fullPath = await join(node.id, e.name);
            if (!(await exists(fullPath))) continue;

            const subEntires = await readDir(fullPath);
            const hasChildren = subEntires.some(sub => sub.isDirectory) && node.type !== "task";
            children.push({
                id: fullPath,
                label: e.name,
                subtype: await getSubtypeFromFolder(fullPath),
                type: await getTypeFromFolder(fullPath),
                hasChildren: hasChildren,
            });

        }
        return children;
    }

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        await context.setCwd(id)
        setContext(new Context(context.project, context.cwd));
    };

    const handleRightClick = (e: React.MouseEvent, node: TreeNode) => {
        e.preventDefault();

        const actions: MenuAction[] = []

        if (node.type === "project") {
            actions.push({ label: "Configure Project", onClick: () => { handleProjectConfiguration(context.project) } });
        }

        if (node.type !== "taskarea" && node.type !== "task") {
            actions.push({ label: "Add Folder", onClick: () => { handleFolderCreate(node, "folder") } });
        }

        if (node.type === "folder") {
            actions.push({ label: "Add Task Area", onClick: () => { handleFolderCreate(node, "taskarea") } });
        }

        if (node.type == "taskarea") {
            actions.push({ label: "Add Task", onClick: () => { handleFolderCreate(node, "task") } });
        }

        actions.push({ label: "Copy Path", onClick: async () => await writeText(node.id) });
        actions.push({ label: "Open In FileSystem", onClick: async () => await openPath(node.id) });

        if (node.type !== "project") {
            actions.push({ label: "Delete", onClick: () => handleFolderDelete(node) });
        }

        setMenuActions(actions);
        setMenuPosition({ x: e.clientX, y: e.clientY });
    }

    const handleMenuAction = (action: MenuAction) => {
        setMenuPosition(null);
        action.onClick();
    }

    const handleFolderCreate = async (node: TreeNode, type: string) => {
        setNodetoCreateFolder(node);
        setCreateFolderType(type);
    }

    const handleFolderDelete = async (node: TreeNode) => {
        setPathToDelete(node.id);
    }

    const handleProjectConfiguration = async (project: Project) => {
        setProjectToConfigure(project);
    }

    return (
        <div id="project-tree-panel">
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                <TreeItem key={root.id} node={root} loadChildren={loadChildren} reloadCounter={reloadCounter} selectedId={selectedId} onSelect={handleSelect} onRightClick={handleRightClick} defaultExpanded={isInPath(root.id, selectedId)} />
            </ul>
            {menuPosition && (
                <div className="dialogContainer">
                    <ul
                        className="context-menu"
                        style={{
                            position: "fixed",
                            top: menuPosition.y,
                            left: menuPosition.x,
                            listStyle: "none",
                            backgroundColor: "black",
                            zIndex: 1000,
                        }}
                    >
                        {menuActions.map((action) => (
                            <li
                                key={action.label}
                                onClick={() => handleMenuAction(action)}
                                style={{ padding: "5px 15px", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                                {action.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {nodeToCreateFolder && createFolderType && (
                <div className="dialogContainer">
                <ProjectFolderDialog node={nodeToCreateFolder} type={createFolderType} refresh={refresh} onClose={() => { setNodetoCreateFolder(null); }} />
                </div>
            )}
            {pathToDelete && (
                <div className="dialogContainer">
                    <div id="project-delete-dialog">
                        <p>
                        Are you sure you want to delete {pathToDelete}? 
                        This cannot be undone.
                        </p>
                        <div className="row">
                                                    <button onClick={async () => {
                            if (context.cwd == pathToDelete) {
                                context.setCwd(context.project.path)
                                setContext(new Context(context.project, context.cwd))
                            }
                            await remove(pathToDelete, { recursive: true })
                            setPathToDelete(null);
                            refresh();
                        }}>Delete</button>

                        <button onClick={()=>setPathToDelete(null)}> Cancel </button>
                        </div>
                    </div>
                </div>
            )}
            {
                projectToConfigure && (
                    <div>
                    </div>
                )
            }
        </div>
    )
}
