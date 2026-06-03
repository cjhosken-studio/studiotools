export interface Project {
  name: string;
  path: string;
}

export interface ProjectFile {
  name: string;
  relativePath: string;
  absolutePath: string;
  category: string;
  ext: string;
  thumbnailPath?: string;
  appVersion?: string;
  application?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: string;
  subtype: string;
  children: TreeNode[];
  files: ProjectFile[];
}

export interface Application {
  name: string;
  appType: string;
  executable: string;
  installed: boolean;
  extensions: string[];
  icon: string;
}
