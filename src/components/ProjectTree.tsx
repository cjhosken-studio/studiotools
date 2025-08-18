import { useEffect, useState } from "react";
import { useAppContext } from "../ContextProvider";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";

import "./ProjectTree.css";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { TreeViewBaseItem } from "@mui/x-tree-view";
import Box from '@mui/material/Box';

function buildTreeNode(path: string, label?: string, children: TreeViewBaseItem[] = []) {
  return {
    id: path,
    label: label || path.split("/").pop() || "",
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
        const subTree = await scanFolder(fullPath);
        folders.push(buildTreeNode(fullPath, e.name, subTree));
        } 
        else if (e.isFile || e.isSymlink) {
            folders.push(
                buildTreeNode(fullPath, e.name, [])
            );
        }
    }
  }

  return folders;
}

export default function ProjectTreePanel() {
  const { context } = useAppContext();
  const [treeData, setTreeData] = useState<TreeViewBaseItem[]>([]);

  useEffect(() => {
    if (!context.project?.path) return;

    (async () => {
      // Scan subfolders first
      const children = await scanFolder(context.project.path);

      // Wrap the root project folder as the top node
      const rootNode: TreeViewBaseItem = buildTreeNode(context.project.path, context.project.name, children);

      setTreeData([rootNode]); // root node as first item
    })();
  }, [context.project?.path]);

  return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
      <RichTreeView items={treeData} />
    </Box>
  );
}
