import Project from "./Project.tsx"
import { readDir, DirEntry, exists, mkdir, writeFile, readTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir, dirname } from "@tauri-apps/api/path";

export default class Context {
    project: Project = new Project("", "");
    cwd: string = "";

    constructor(project: Project, cwd: string) {
        this.project = project;
        this.cwd = cwd;
    }
    
    setProject(project: Project) {
        this.project = project;
        this.cwd = project.path;
    }

    async setCwd(cwd: string) {
        this.cwd = cwd;
    }
};

export async function isValidCwd(cwd: string) {
    if (await exists(cwd)) {
        const project = await getProjectFromCwd(cwd);
        return project;
    }

    return false;
}

export async function getProjectFromCwd(cwd: string): Promise<Project> {
    let current = cwd;

    while (true) {
        const entires = await readDir(current);
        const hasProjectConfig = entires.some((e: DirEntry) => e.name == "project.yaml");

        if (hasProjectConfig) {
            const parts = current.split(/[\\/]/);
            const projectName = parts[parts.length - 1];
            return new Project(projectName, current);
        }

        const parent = await dirname(current);
        if (parent == current) {
            return new Project("", "");
        }

        current = parent;
    }
}
