import { useAppContext } from "../ContextProvider";
import { open, save } from "@tauri-apps/plugin-dialog";
import Context from "../types/Context";
import { createProject } from "../types/Project";
import { homeDir } from "@tauri-apps/api/path";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";
import "./NavigationBar.css"

function NavigationBar() {
    const { context, projectList, setContext, setProjectList } = useAppContext();
    
    const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const project = projectList.find(p => p.path === e.target.value);
        if (!project) return;

        setContext(new Context(project, project.path))
    }

    const handleCwdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCwd = e.target.value;

        await context.setCwd(newCwd);
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

        await context.setCwd(cwd)
        setContext(new Context(context.project, context.cwd));

        if (oldProject != context.project.path) {
            const updated = [context.project, ...projectList.filter(p => p.path !== context.project.path)];
            setProjectList(updated);
        }
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

        const updated = [project, ...projectList.filter(p => p.path !== project.path)];
        setProjectList(updated);
    }

    return (
        <nav>
            <select
                id="project-select"
                value={context.project.path}
                onChange={handleProjectChange}
                autoComplete="off"
            >
                {projectList.map(p => (
                    <option key={p.path} value={p.path}>{p.name}</option>
                ))}
            </select>
            <input
                id="cwd-input"
                placeholder="Current Working Directory"
                value={context.cwd}
                onChange={handleCwdChange}
            />
            <button id="search-button" className="iconButton" onClick={() => searchCwd()}><FontAwesomeIcon icon={faSearch} /></button>
            <button id="create-button" className="iconButton" onClick={() => createNewProject()}><FontAwesomeIcon icon={faPlus} /></button>
        </nav>
    )
}

export default NavigationBar;