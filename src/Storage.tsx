// Storage.tsx
import { exists } from "@tauri-apps/plugin-fs";
import Context from "./types/Context";
import Project from "./types/Project";
import { Store } from "@tauri-apps/plugin-store";

const store = await Store.load("storage.json");

const CONTEXT_KEY = "lastContext";
const PROJECTS_KEY = "projectList";

export async function storeContext(ctx: Context) {
        await store.set(
            CONTEXT_KEY,
            {
                project: ctx.project,
                cwd: ctx.cwd,
            }
        );
        await store.save();
}

export async function loadStoredContext(): Promise<Context | null> {
    const data = await store.get(CONTEXT_KEY)
    if (!data) return null;

    const parsed = data as { project: { name: string; path: string }; cwd: string };

    if (!parsed.project || parsed.cwd === undefined) return null;
    
    return new Context(new Project(parsed.project.name, parsed.project.path), parsed.cwd);
}

export async function storeProjectList(projects: Project[]) {
    await store.set(PROJECTS_KEY, projects)
    await store.save()
}

export async function loadStoredProjects(): Promise<Project[]> {
    const data = await store.get(PROJECTS_KEY);
    if (!data) return [];
    const parsed = data as { name: string; path: string }[];

    if (!Array.isArray(parsed)) return [];

    const validProjects: Project[] = [];
    for (const p of parsed) {
        if (await exists(p.path)) {
            validProjects.push(new Project(p.name, p.path));
        }
    }

    return validProjects;
}