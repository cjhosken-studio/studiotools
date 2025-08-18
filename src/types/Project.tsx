import { homeDir } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { mkdir, create } from "@tauri-apps/plugin-fs";

export default class Project {
    name: string = "";
    path: string = "";

    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }

    setName(name: string) {
        this.name = name
    }

    setPath(path: string) {
        this.path = path
    }
}

const defaultProjectStructure = [
  "config",
  "edit",
  "asset",
  "sequence",
]

export async function createProject(name: string, path: string) : Promise<Project> {
    
    await mkdir(path);

    for (const folder of defaultProjectStructure) {
      const folderPath = await join(path, folder);
      await mkdir(folderPath);
    }

    const configPath = await join(path, "project.yaml");

    const configFile = await create(configPath);
    await configFile.write(new TextEncoder().encode(
         `name: ${name}\npath: ${path}\n`
    ));
    await configFile.close();

    return new Project(name, path);
}

export async function loadHomeProjects(): Promise<Project[]> {
  const home = await homeDir();
  const projectsDir = `${home}projects`;

  try {
    const entries = await readDir(projectsDir);
    const projects: Project[] = [];
    for (const entry of entries) {
      if (entry.name) {
        const proj = await createProject(entry.name, await join(projectsDir, entry.name));
        projects.push(proj);
      }
    }
    return projects;
  } catch {
    return []; // no ~/projects folder
  }
}