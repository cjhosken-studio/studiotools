import React, { JSX, useEffect, useState } from "react";
import { useAppContext } from "../ContextProvider";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";

import "./ProjectTree.css";
import { create, exists, mkdir, readDir, readTextFile, remove } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { TreeItem, TreeItemContent, TreeItemProps, TreeViewBaseItem, UseTreeItemContentSlotOwnProps } from "@mui/x-tree-view";
import Box from '@mui/material/Box';
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import Context from "../types/Context";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openPath } from "@tauri-apps/plugin-opener";
import yaml from "js-yaml";
import Select from "@mui/material/Select";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";


type ProjectFolderType = "project" | "task" | "taskarea" | "folder";

export async function getTypeFromFolder(path: string): Promise<ProjectFolderType> {
    let type: ProjectFolderType = "folder";
    const configPath = await join(path, "folder.yaml");
    if (await exists(configPath)) {
        const content = await readTextFile(configPath);
        const parsed = yaml.load(content) as any;

        if (parsed && typeof parsed.type == "string") {
            const parsed_type = parsed.type.toLowerCase();
            if (parsed_type == "task" || parsed_type == "taskarea" || parsed_type == "folder" || parsed_type == "project") {
                type = parsed_type;
            }
        }
    }

    return type;
}

function buildTreeNode(path: string, label?: string, type: ProjectFolderType = "folder", children: TreeViewBaseItem[] = []) {
    return {
        id: path,
        label: label || path.split("/").pop() || "",
        type,
        children,
    };
}

async function scanFolder(path: string): Promise<TreeViewBaseItem[]> {
    let entries = [];
    try {
        entries = await readDir(path);
    } catch (err) {
        console.error("Failed to read directory:", path, err);
        return [];
    }

    const folders = [];
    for (const e of entries) {
        const fullPath = await join(path, e.name);
        if (await exists(fullPath)) {
            if (e.isDirectory && (await exists(fullPath))) {
                const type = await getTypeFromFolder(fullPath);
                
                const subTree = await scanFolder(fullPath);
                folders.push(buildTreeNode(fullPath, e.name, type, subTree));
            }
        }
    }

    return folders;
}

function getIconForType(type: ProjectFolderType, expanded?: boolean) {
  switch (type) {
    case "project":
      return <WorkspacesIcon fontSize="small" />;
    case "taskarea":
      return <DashboardIcon fontSize="small" />;
    case "task":
      return <AssignmentIcon fontSize="small" />;
    case "folder":
    default:
      return expanded ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />;
  }
}


interface ProjectTreeItemContentProps extends UseTreeItemContentSlotOwnProps {
    children: React.ReactNode;
    context: Context;
    type: ProjectFolderType;
    handleContextMenu: () => Promise<void>;
}

function ProjectTreeItemContent({
    children,
    context,
    type,
    handleContextMenu,
    ...props
}: ProjectTreeItemContentProps) {
    return (
        <TreeItemContent
            {...props}
            onContextMenu={handleContextMenu}
        >
            {getIconForType(type)}
            {children}
        </TreeItemContent>
    )
}

const ProjectTreeItem = React.forwardRef(function ProjectTreeItem(
    props: TreeItemProps & { context: Context, refreshTree: () => Promise<void> },
    ref: React.Ref<HTMLLIElement>,
) {
    const { context, refreshTree, ...rest } = props
    const [menuPosition, setMenuPosition] = useState<{ mouseX: number, mouseY: number } | null>(null);
    const [menuItems, setMenuItems] = useState<JSX.Element[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogParentPath, setDialogParentPath] = useState("");
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"task" | "taskarea" | "folder">("folder");
    const [parentType, setParentType] = useState<ProjectFolderType>("folder");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pathToDelete, setPathToDelete] = useState<string | null>(null);
    const [type, setType] = useState<ProjectFolderType>("folder");

    useEffect(() => {
        const fetchType = async () => {
            if (!rest.itemId) return;
            const id = rest.itemId.toString();
            const folderType = await getTypeFromFolder(id);
            setType(folderType)
        }  
        fetchType();
    }, [rest.itemId])

    const handleClose = () => setMenuPosition(null);

    const openAddDialog = (parentPath: string, parentType: ProjectFolderType, defaultName: string) => {
        handleClose();
        setParentType(parentType);
        setDialogParentPath(parentPath);
        setNewName(defaultName);
        
        if (parentType === "taskarea") {
            setNewType("task");
        } else {
            setNewType("folder");
        }

        setDialogOpen(true);
    };

    const handleCreateFolder = async () => {
        if (!newName || !dialogParentPath) return;
        const fullPath = await join(dialogParentPath, newName);
        try {
            await mkdir(fullPath, { recursive: true });

            const folderConfigPath = await join(fullPath, "folder.yaml");
            const folderConfigFile = await create(folderConfigPath);
            await folderConfigFile.write(new TextEncoder().encode(
                `type: ${newType}\n`
            ));
            await folderConfigFile.close();

            console.log("Created:", fullPath);
            await refreshTree();
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
        setDialogOpen(false);
    };

    const confirmDeleteItem = (path: string) => {
        setPathToDelete(path);
        setDeleteDialogOpen(true)
    }

    const copyPath = async (path: string) => {
        await writeText(path);
    }

    const openInFileBrowser = async (path: string) => {
        await openPath(path);
    }

    const handleContextMenu = async (event: React.MouseEvent) => {
        event?.preventDefault()
        setMenuPosition({ mouseX: event.clientX - 2, mouseY: event.clientY - 4 });

        const id = rest.itemId?.toString().toLowerCase();
        const root = context.project.path.toLowerCase();
        const type = await getTypeFromFolder(id);

        const context_menu_items = [];
        let deletable = true;

        if (id === root) {
            context_menu_items.push(<MenuItem key="project_config" onClick={handleClose}>Open Project Configuration</MenuItem>)
            deletable = false;
        }

        context_menu_items.push(<MenuItem key="create_folder" onClick={() => openAddDialog(id, type, "item")}>Add</MenuItem>);
        context_menu_items.push(<MenuItem key="copy_path" onClick={() => copyPath(id)}>Copy Path</MenuItem>);
        context_menu_items.push(<MenuItem key="open_in_browser" onClick={() => openInFileBrowser(id)}>Open in File Browser</MenuItem>);
        
        if (deletable) {
            context_menu_items.push(<MenuItem key="delete" onClick={() => confirmDeleteItem(id)}>Delete</MenuItem>);
        }

        setMenuItems(context_menu_items);
    }

    return (
        <>
            <TreeItem
                {...rest}
                ref={ref}
                slots={{
                    content: ProjectTreeItemContent
                }}
                slotProps={{
                    content: {
                        handleContextMenu,
                        context,
                        type: type
                    } as ProjectTreeItemContentProps
                }}
            />
            <Menu
                open={menuPosition !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    menuPosition !== null
                        ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
                        : undefined
                }
            >
                {menuItems}
            </Menu>

            <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); handleClose(); }}>
                <DialogTitle> Create New Task </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Folder Name"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <Select
                        label="Type"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as "task" | "taskarea" | "folder")}
                        fullWidth
                        margin="dense"
                    >
                        {(parentType === "folder" || parentType === "project") && <MenuItem value="folder">Folder</MenuItem>}
                        {parentType === "folder" && <MenuItem value="taskarea">Task Area</MenuItem>}
                        {parentType === "taskarea" && <MenuItem value="task">Task</MenuItem>}
                    </Select>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setDialogOpen(false); handleClose(); }}>Cancel</Button>
                    <Button onClick={handleCreateFolder}>Create</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete "{pathToDelete}" and all of its contents? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={async () => {
                        if (pathToDelete) {
                            await remove(pathToDelete, {recursive: true});
                            await refreshTree();
                        }
                        setDialogOpen(false);
                    }}></Button>
                </DialogActions>
            </Dialog>
        </>
    )
})

export default function ProjectTreePanel() {
    const { context } = useAppContext();
    const [treeData, setTreeData] = useState<TreeViewBaseItem[]>([]);

    const refreshTree = async () => {
        if (!context.project?.path) return;
        const children = await scanFolder(context.project.path);

        // Wrap the root project folder as the top node
        const rootNode: TreeViewBaseItem = buildTreeNode(context.project.path, context.project.name, "project", children);

        setTreeData([rootNode]); // root node as first item
    }

    useEffect(() => {
        refreshTree();
    }, [context.project?.path]);

    return (
        <Box sx={{ minHeight: 352, minWidth: 250 }}>
            <RichTreeView
                items={treeData}
                slots={{
                    item: (props) => <ProjectTreeItem {...props} context={context} refreshTree={refreshTree} />
                }}

            />
        </Box>
    );
}
