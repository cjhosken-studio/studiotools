import { exists } from "@tauri-apps/plugin-fs";
import Context, { getProjectFromCwd } from "./types/Context";
import Project, { ProjectDTO } from "./types/Project";
import { Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;



export async function initStore() {
  if (!store) {
    store = await Store.load("storage.json");
  }
  return store;
}

async function ensureStore() {
    if (!store) {
        store = await Store.load("storage.json");
    }
    return store
}

/**
 * General setter for any store item
 */
export async function setStoreItem<T>(key: string, item: T) {
    const store = await ensureStore();

    await store.set(key, item);
    await store.save();
}

/**
 * General getter for any store item
 */
export async function getStoreItem<T>(key: string): Promise<T | null> {
    const store = await ensureStore();
    
    const data = await store.get(key);
    return (data ?? null) as T | null;
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

    if (!await exists(parsed.project.path)) {
        if (!await exists(parsed.cwd)) {
            return null;
        }

        const project = await getProjectFromCwd(parsed.cwd);
        parsed.project = { name: project.name, path: project.path };
    };

    if (!await exists(parsed.cwd)) {
        parsed.cwd = parsed.project.path;
    }

    return new Context(new Project(parsed.project.name, parsed.project.path), parsed.cwd);
}


export async function storeProjectList(projects: Project[]) {
    const dto: ProjectDTO[] = projects.map(p => ({
        name: p.name,
        path: p.path
    }));

    console.log("dto:", dto);

    await setStoreItem("projectList", dto);
}


export async function loadStoredProjects(): Promise<Project[]> {
    const parsed = await getStoreItem<{
        name: string;
        path: string
    }[]>("projectList");

    console.log("parsed:", parsed);
    
    if (!parsed || !Array.isArray(parsed)) return [];

    const validProjects: Project[] = [];
    for (const p of parsed) {
        if (await exists(p.path)) {
            validProjects.push(new Project(p.name, p.path));
        }
    }

    return validProjects;
}
