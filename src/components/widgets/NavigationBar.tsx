import React, { useEffect, useState } from "react";
import { useAppContext } from "../../ContextProvider";
import { open, save } from "@tauri-apps/plugin-dialog";
import Context, { getProjectFromCwd, isValidCwd } from "../../types/Context";
import { createProject } from "../../types/Project";
import { homeDir } from "@tauri-apps/api/path";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import "./NavigationBar.css"

function NavigationBar() {
    const { context, projectList, setContext, setProjectList } = useAppContext();
    const [displayCwd, setDisplayCwd] = useState<string>("");

    useEffect(() => {
        setDisplayCwd(context.cwd);

        updateProjectList();
    }, [context])

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const project = projectList.find(p => p.path === e.target.value);
        if (project) {
            setContext(new Context(project, project.path));
        }
    }

    const handleCwdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const cwd = e.target.value;

        setDisplayCwd(cwd);

        if (await isValidCwd(cwd)) {
            setContext(new Context(await getProjectFromCwd(cwd), cwd));
        }
    };

    const updateProjectList = () => {
        const project = context.project;

        if (!project.name.trim()) return;

        const next = [
            project,
            ...projectList.filter(
                p => p.name !== project.name
            )
        ];

        setProjectList(next);
    };


    const setCwd = async () => {
        const cwd = await open({
            defaultPath: await homeDir(),
            directory: true,
            multiple: false,
        });

        if (!cwd || !isValidCwd(cwd)) return;

        const lastProject = context.project;
        const cwdProject = await getProjectFromCwd(cwd);

        setContext(new Context(cwdProject, cwd));

        if (lastProject.path != cwdProject.path) {
            setProjectList([context.project, ...projectList.filter(p => p.path !== cwdProject.path)]);
        }
    }

    const createNewProject = async () => {
        const projectPath = await save({
            defaultPath: await homeDir(),
            title: "Create Project",
            filters: []
        });

        if (!projectPath) return;

        const parts = projectPath.split(/[\\/]/);
        const projectName = parts[parts.length - 1];

        const project = await createProject(projectName, projectPath);
        setContext(new Context(project, project.path));
        setProjectList([project, ...projectList.filter(p => p.path !== project.path)]);
    }

    return (
        <nav>
            <select
                id="project-select"
                value={context.project!.path}
                onChange={handleProjectChange}
                autoComplete="off"
            >
                {projectList.map(p => (
                    <option key={p.path} value={p.path}>{p.name}</option>
                ))}
            </select>
            <div id="cwd-container">
                <button id="search-button" className="iconButton" onClick={() => setCwd()}><FontAwesomeIcon icon={faSearch} /></button>
                <input
                    id="cwd-input"
                    placeholder="Current Working Directory"
                    value={displayCwd}
                    onChange={handleCwdChange}
                />
                <button id="create-button" className="iconButton" onClick={() => createNewProject()}><FontAwesomeIcon icon={faPlus} /></button>
            </div>
        </nav>
    )
}

export default NavigationBar;