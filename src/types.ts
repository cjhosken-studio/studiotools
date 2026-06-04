export interface Project {
  name: string;
  path: string;
  archived?: boolean;
}

export interface VersionFileEntry {
  name: string;
  absolutePath: string;
  ext: string;
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
  sourceScene?: string; // absolute path to the originating workfile (from metadata.yaml)
  realPath?: string;     // absolute path to the real version folder on disk
  /** All files within a version folder (for category=versions/published) */
  versionFiles?: VersionFileEntry[];
  /** Absolute path to the primary USD file inside this version folder (if any) */
  usdPath?: string;
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
