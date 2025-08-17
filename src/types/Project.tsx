import { join } from "@tauri-apps/api/path";
import { mkdir, writeTextFile, create } from "@tauri-apps/plugin-fs";

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

export async function createProject(name: string, path: string) : Promise<Project> {
    
    await mkdir(path);
    const configPath = await join(path, "project.yaml");

    const configFile = await create(configPath);
    await configFile.write(new TextEncoder().encode(
         `name: ${name}\npath: ${path}\n`
    ));
    await configFile.close();

    return new Project(name, path);
}