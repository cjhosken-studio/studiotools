import { useAppContext } from "../ContextProvider";
import { open, save } from "@tauri-apps/plugin-dialog";
import Context from "../types/Context";
import Project, {createProject} from "../types/Project";
import { homeDir } from "@tauri-apps/api/path";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import "./NavigationBar.css"
import { useEffect, useState } from "react";
import { loadLastContext, loadRecentProjects, saveLastContext, saveRecentProjects } from "../Config";


function NavigationBar() {
    const { context, setContext } = useAppContext();
    const [recentProjects, setRecentProjects] = useState<Project[]>([]);

    useEffect(() => {
        (async () => {
            const lastCtx = await loadLastContext();
            if (lastCtx) setContext(lastCtx);

            const recent = await loadRecentProjects();
            setRecentProjects(recent);
        })();
    }, [])

    const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const project = recentProjects.find(p => p.path === e.target.value);
        if (!project) return;

        setContext(new Context(project, project.path))
        await saveLastContext(context);
    }

    const handleCwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCwd = e.target.value;

        context.setCwd(newCwd);
        setContext(new Context(context.project, context.cwd));
    };

    const searchCwd = async () => {
        const cwd = await open({
            defaultPath: await homeDir(),
            directory: true,
            multiple: false,
        });

        if (!cwd || typeof cwd !== "string") {
            return;
        }

        const oldProject = context.project.path

        context.setCwd(cwd)
        setContext(new Context(context.project, context.cwd));
        
        if (oldProject != context.project.path) {
            const updated = [context.project, ...recentProjects.filter(p => p.path !== context.project.path)];
            setRecentProjects(updated);
            await saveRecentProjects(updated);
        }

        saveLastContext(context);
        
    }

    const createNewProject = async () => {
        const projectPath = await save({
            defaultPath: await homeDir(),
            title: "Create Project",
            filters: []
        });

        if (!projectPath || typeof projectPath !== "string") {
            return;
        }

        const parts = projectPath.split(/[\\/]/);
        const projectName = parts[parts.length - 1];

        let project = await createProject(projectName, projectPath);
        context.setProject(project);
        setContext(new Context(context.project, context.cwd));

        const updated = [project, ...recentProjects.filter(p => p.path !== project.path)];
        setRecentProjects(updated);
        await saveRecentProjects(updated);
        await saveLastContext(context);
    }

    return (
        <nav>
            <select
                id = "project-select"
                value={context.project.name}
                onChange={handleProjectChange}
            >
                {recentProjects.map(p => (
                    <option key={p.path} value={p.path}>{p.name}</option>
                ))}
            </select>
            <input
                id = "cwd-input"
                placeholder="Current Working Directory"
                value={context.cwd}
                onChange={handleCwdChange}
            />
            <button id="search-button" className="iconButton" onClick={() => searchCwd()}><FontAwesomeIcon icon={faSearch}/></button>
            <button id="create-button" className="iconButton" onClick={() => createNewProject()}><FontAwesomeIcon icon={faPlus}/></button>
        </nav>
    )
}

export default NavigationBar;