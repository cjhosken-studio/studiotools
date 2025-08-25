import React, { useEffect, useState } from "react";
import { useAppContext } from "../../ContextProvider";

import "./ProjectTree.css";
import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import Context, { getProjectFromCwd } from "../../types/Context";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openPath } from '@tauri-apps/plugin-opener';
import Project, { getIconFromTypes, getSubtypeFromFolder, getTypeFromFolder } from "../../types/Project";
import ProjectFolderDialog from "../dialogs/ProjectFolderDialog";
import {platform} from "@tauri-apps/plugin-os";
import DeleteDialog from "../dialogs/DeleteDialog";
import ConfigureProjectDialog from "../dialogs/ConfigureProjectDialog";
import { MenuAction } from "../../types/Menu";

export type TreeNode = {
    id: string;
    label: string;
    type: string | "folder";
    subtype: string | "custom";
    children?: TreeNode[];
    hasChildren?: boolean;
}

const isInPath = ( nodeId: string, cwd: string | null) => {
    if (!cwd) return false;
    return cwd.startsWith(nodeId)
}

function TreeItem({
    node,
    loadChildren,
    selectedId,
    onSelect,
    onClick,
    onRightClick,
    reloadCounter,
    defaultExpanded = false,
}: {
    node: TreeNode;
    loadChildren: (node: TreeNode) => Promise<TreeNode[]>;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onClick: () => void;
    onRightClick: (e: React.MouseEvent, node: TreeNode) => void;
    reloadCounter: number;
    defaultExpanded?: boolean;
}) {

    const [expanded, setExpanded] = useState(defaultExpanded);
    const [children, setChildren] = useState<TreeNode[] | null>(null);

    const loadNodeChildren = async () => {
        if (!node.hasChildren || node.type === "task") return;
        const result = await loadChildren(node);
        setChildren(result);
    }

    useEffect(() => {
        if (defaultExpanded) {
            loadNodeChildren();
        }
    }, [defaultExpanded])

    useEffect(() => {
        if (expanded) {
            loadNodeChildren();
        }
    }, [reloadCounter])

    const toggleExpand = async () => {
        if (!node.hasChildren || node.type === "task") return;

        if (!expanded) {
            if (!children) {
                loadNodeChildren();
            }
            setExpanded(true);
        } else {
            setExpanded(false);
        }
    };

    const isSelected = selectedId === node.id;

    return (
        <div>
            <li className={`treeItem ${expanded ? "expanded" : ""}`}>
                <div
                    className={`treeLabel ${isSelected ? "selected" : ""}`}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onRightClick(e, node);
                    }}
                >
                    {node.type !== "task" && node.hasChildren && (
                    <span className="treeArrow"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                            onSelect(node.id);
                            if (node.hasChildren) toggleExpand();
                        }}
                    >▶</span>
                    )}
                    <div className={`treeInfo ${node.type == "task" || !node.hasChildren ? "offset" : ""}`}
                        onClick={(e) => {
                            onClick();
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
                <ul className={`treeChildren ${expanded ? "open" : ""}`}>
                    {children?.map((child) => (
                        <TreeItem key={child.id} node={child} loadChildren={loadChildren} reloadCounter={reloadCounter} selectedId={selectedId} onSelect={onSelect} onClick={onClick} onRightClick={onRightClick} defaultExpanded={isInPath(node.id, selectedId)}/>
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
        const handleClick = () => { setMenuPosition(null); };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        setSelectedId(context.cwd ?? null);
        refresh();
    }, [context]);

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

    const loadChildren = async (node: TreeNode): Promise<TreeNode[]> => {
        const entires = await readDir(node.id);
        
        const childPromises = entires
            .filter((e) => e.isDirectory)
            .map(async (e) => {
                const path = await join(node.id, e.name);

                const subEntires = await readDir(path);
                const hasChildren = subEntires.some((sub) => sub.isDirectory)

                const [subtype, type] = await Promise.all([
                    getSubtypeFromFolder(path),
                    getTypeFromFolder(path)
                ]);

                return {
                    subtype,
                    id: path,
                    label: e.name,
                    type,
                    hasChildren
                } as TreeNode;
            });
        
        const children = await Promise.all(childPromises);
        return children;
    }

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        setContext(new Context(await getProjectFromCwd(id), id));
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
        
        const prettyPlatform = platform().charAt(0).toUpperCase() + platform().slice(1);
        actions.push({ label: `Open in ${prettyPlatform}`, onClick: async () => await openPath(node.id) });

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
            <ul id="project-tree">
                <TreeItem key={root.id} node={root} loadChildren={loadChildren} reloadCounter={reloadCounter} selectedId={selectedId} onSelect={handleSelect} onRightClick={handleRightClick} onClick={() => {setMenuPosition(null)}} defaultExpanded={isInPath(root.id, selectedId)} />
            </ul>
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
                            borderColor: "#333333" ,
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
            {nodeToCreateFolder && createFolderType && (
                <ProjectFolderDialog node={nodeToCreateFolder} type={createFolderType} refresh={refresh} onClose={() => { setNodetoCreateFolder(null); }} />
            )}
            {pathToDelete && (
                <DeleteDialog pathToDelete={pathToDelete} setPathToDelete={setPathToDelete} context={context} setContext={setContext} refresh={refresh} onClose={() => {setPathToDelete(null)}}/>
            )}
            {projectToConfigure && (
                <ConfigureProjectDialog context={context} onClose={() => setProjectToConfigure(null)}/>
             )}
        </div>
    )
}
