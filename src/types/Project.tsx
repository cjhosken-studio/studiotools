import { homeDir } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { mkdir, create } from "@tauri-apps/plugin-fs";
import yaml from "js-yaml";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faFire, faKitchenSet, faLightbulb, faPersonRunning, faFilm, faClapperboard, faBox, faBone, faImages, faHammer, faCameraRetro, faToolbox, faCube, faCubes, faSwatchbook, faArrowsToCircle, faObjectGroup } from "@fortawesome/free-solid-svg-icons";

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
  "sandbox",
  "build",
  "sequence",
  "editorial"
]

export async function createProject(name: string, path: string): Promise<Project> {

  await createFolder(path, "project")

  const projectConfigPath = await join(path, "project.yaml");
  const projectConfigFile = await create(projectConfigPath);
  await projectConfigFile.write(new TextEncoder().encode(
    `name: ${name}\npath: ${path}\n`
  ));
  await projectConfigFile.close();

  for (const folder of defaultProjectStructure) {
    const folderPath = await join(path, folder);
    await createFolder(folderPath, "folder");
  }

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

export async function createFolder(path: string, type: string, subtype: string = "custom") {
  await mkdir(path);
  const folderConfigPath = await join(path, "folder.yaml");
  const folderConfigFile = await create(folderConfigPath);
  await folderConfigFile.write(new TextEncoder().encode(
    `type: ${type}\nsubtype: ${subtype}\n`
  ));
  await folderConfigFile.close();
  if (type == "taskarea") {
    if (subtype == "asset") {
      await createFolder(await join(path, "model"), "task", "model")
      await createFolder(await join(path, "texture"), "task", "texture")
      await createFolder(await join(path, "lookdev"), "task", "lookdev")
    } 

    if (subtype == "shot") {
      await createFolder(await join(path, "layout"), "task", "layout")
      await createFolder(await join(path, "animate"), "task", "animate")
      await createFolder(await join(path, "fx"), "task", "fx")
      await createFolder(await join(path, "light"), "task", "light")
      await createFolder(await join(path, "comp"), "task", "comp")
    }
  }

  if (type == "task") {
    await mkdir(await join(path, "published"))
    await mkdir(await join(path, "versions"))
    await mkdir(await join(path, "wip"))
  }

}

export async function getTypeFromFolder(folderPath: string): Promise<string> {
    try {
        const folderYamlPath = await join(folderPath, "folder.yaml");
        if (!(await exists(folderYamlPath))) return "folder";

        const content = await readTextFile(folderYamlPath);
        const data = yaml.load(content) as { type?: string };
        return data?.type ?? "folder";
    } catch (err) {
        console.error("Error reading folder.yaml:", err);
        return "folder";
    }
}

export async function getSubtypeFromFolder(folderPath: string): Promise<string> {
    try {
        const folderYamlPath = await join(folderPath, "folder.yaml");
        if (!(await exists(folderYamlPath))) return "folder";

        const content = await readTextFile(folderYamlPath);
        const data = yaml.load(content) as { type?: string, subtype?: string };
        return data?.subtype ?? "custom";
    } catch (err) {
        console.error("Error reading folder.yaml:", err);
        return "custom";
    }
}

export function getIconFromTypes(type: string, subtype: string) {
    if (type === "project") {
        return <FontAwesomeIcon icon={faFilm} />; // you can use a custom project icon
    }

    if (type === "taskarea") {
      if (subtype === "shot") return <FontAwesomeIcon icon={faClapperboard} />;
      if (subtype === "asset") return <FontAwesomeIcon icon={faCubes} />;

      return <FontAwesomeIcon icon={faBox} />;
    }

    if (type === "task") {
        if (subtype === "scan") return <FontAwesomeIcon icon={faCameraRetro} />;
        if (subtype === "model") return <FontAwesomeIcon icon={faHammer} />;
        if (subtype === "texture") return <FontAwesomeIcon icon={faImages} />;
        if (subtype === "lookdev") return <FontAwesomeIcon icon={faSwatchbook} />;
        if (subtype === "rig") return <FontAwesomeIcon icon={faBone} />;

        if (subtype === "tool") return <FontAwesomeIcon icon={faToolbox} />;

        if (subtype === "track") return <FontAwesomeIcon icon={faArrowsToCircle} />;
        if (subtype === "comp") return <FontAwesomeIcon icon={faObjectGroup} />;

        if (subtype === "layout") return <FontAwesomeIcon icon={faKitchenSet} />;
        if (subtype === "animate") return <FontAwesomeIcon icon={faPersonRunning} />;
        if (subtype === "fx") return <FontAwesomeIcon icon={faFire} />;
        if (subtype === "light") return <FontAwesomeIcon icon={faLightbulb} />;

        // fallback for unknown task subtypes
        return <FontAwesomeIcon icon={faCube} />;
    }

    // fallback for normal folder or unknown types
    return <FontAwesomeIcon icon={faFolder} />;
}