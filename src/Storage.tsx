import { exists } from "@tauri-apps/plugin-fs";
import Context from "./types/Context";
import Project from "./types/Project";
import { Store } from "@tauri-apps/plugin-store";

const store = await Store.load("storage.json");

/**
 * General setter for any store item
 */
export async function setStoreItem<T>(key: string, item: T) {
    await store.set(
        key,
        item
    )
    await store.save()
}

/**
 * General getter for any store item
 */
export async function getStoreItem<T>(key: string): Promise<T | null> {
    const data = await store.get(key);
    if (!data) return null;

    return data as T;
}


/**
 * Specialized wrappers using the generic store functions
 */


export async function storeContext(ctx: Context) {
    await setStoreItem("lastContext", {
        project: ctx.project,
        cwd: ctx.cwd
    });
}


export async function loadStoredContext(): Promise<Context | null> {
    const parsed = await getStoreItem<{
        project: {name: string; path:string};
        cwd: string;
    }>("lastContext");
    
    if (!parsed || !parsed.project || parsed.cwd === undefined) return null;

    return new Context(new Project(parsed.project.name, parsed.project.path), parsed.cwd);
}


export async function storeProjectList(projects: Project[]) {
    await setStoreItem("projectList", projects);
}


export async function loadStoredProjects(): Promise<Project[]> {
    const parsed = await getStoreItem<{
        name: string;
        path: string
    }[]>("projectList");
    
    if (!parsed || !Array.isArray(parsed)) return [];

    const validProjects: Project[] = [];
    for (const p of parsed) {
        if (await exists(p.path)) {
            validProjects.push(new Project(p.name, p.path));
        }
    }

    return validProjects;
}
