import Project from "./Project.tsx"
import { readDir, DirEntry, exists } from "@tauri-apps/plugin-fs";
import { basename, dirname, normalize } from "@tauri-apps/api/path";

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
    let current = (await normalize(cwd)).replace(/[\\/]+$/, "");

    if (await exists(current)) {
        const project = await getProjectFromCwd(current);
        return project;
    }

    return false;
}

export async function getProjectFromCwd(cwd: string): Promise<Project> {
    let current = (await normalize(cwd)).replace(/[\\/]+$/, "");

    console.log(current);

    while (true) {
        const entires = await readDir(current);
        const hasProjectConfig = entires.some((e: DirEntry) => e.name == "project.yaml");

        if (hasProjectConfig) {
            const parts = current.split(/[\\/]/).filter(Boolean);
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
