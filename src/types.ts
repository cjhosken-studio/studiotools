export interface Project {
  name: string;
  path: string;
  archived?: boolean;
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
  disabled?: boolean;
}

export interface Application {
  name: string;
  appType: string;
  executable: string;
  installed: boolean;
  extensions: string[];
  icon: string;
  disabled?: boolean;
  startupScript?: string;
}
