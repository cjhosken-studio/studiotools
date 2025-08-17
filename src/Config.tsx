import { appConfigDir, join } from "@tauri-apps/api/path";
import Project from "./types/Project";
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import Context from "./types/Context";

const CONFIG_FILE = "config.json"

async function getConfigPath() {
    const dir = await appConfigDir();
    return join(dir, CONFIG_FILE);
}


export async function saveRecentProjects(projects: Project[]) {
  const path = await getConfigPath();
  await writeTextFile(path, JSON.stringify(projects));
}

export async function loadRecentProjects(): Promise<Project[]> {
  const path = await getConfigPath();
  if (!(await exists(path))) return [];
  const text = await readTextFile(path);
  return JSON.parse(text) as Project[];
}

const CONTEXT_FILE = 'last-context.json';

export async function saveLastContext(context: Context) {
  const path = await appConfigDir();
  await writeTextFile(`${path}${CONTEXT_FILE}`, JSON.stringify({
    cwd: context.cwd,
    project: {
      name: context.project.name,
      path: context.project.path
    }
  }));
}

export async function loadLastContext(): Promise<Context | null> {
  const path = await appConfigDir();
  const filePath = `${path}${CONTEXT_FILE}`;
  if (!(await exists(filePath))) return null;
  const data = JSON.parse(await readTextFile(filePath));
  return new Context(new Project(data.project.name, data.project.path), data.cwd);
}
