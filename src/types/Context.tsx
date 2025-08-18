import Project from "./Project.tsx"
import { readDir, DirEntry, exists } from "@tauri-apps/plugin-fs";
import { dirname } from "@tauri-apps/api/path";

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
        if (await exists(cwd)) {
            this.cwd = cwd;
            
            const project = await getProject(cwd);

            if (!project) {
                return;
            }

            this.project = project;
        }
    }
};

async function getProject(cwd: string): Promise<Project | null> {
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
            return null;
        }

        current = parent;
    }
}