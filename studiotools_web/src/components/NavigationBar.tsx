import React, { createContext, useState, useEffect } from "react"
import "./NavigationBar.css"
import { FaMagnifyingGlass, FaPlus } from 'react-icons/fa6'
import Project from "../data/project.tsx"
import ContextType, { getContext } from "../data/context.tsx"

function NavigationBar() {
    const { project, cwd } = getContext();
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch("/api/projects/get", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data: { projects: Project[] } = await response.json();
                setProjects(data.projects || []);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };

        fetchProjects();

        cwd.set

        setCwdPath(projects.at(0).path);

    }, []);

    const handleProjectCreate = async () => {
        try {
            const response = await fetch("/api/projects/create", {
                "method": "GET",
                "headers": {
                    "Content-Type":"application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            setProjectPath(data.url);

            console.log("Success:", data);
        } catch (error) {
            console.log("Error:", error);
        }
    }

    const handleProjectSelect = (e) => {
        setProjectPath(e.target.value);
        setCwdPath(e.target.value);
    };

    return (
        <div id="navigation-bar">
            <select 
                id="project-url-select"
                value={projectPath}
                onChange={handleProjectSelect}
            >
                {projects.map((project) => (
                    <option key={project.path} value={project.path}>
                        {project.name}
                    </option>
                ))}

            </select>
            <input id="cwd-url-input"
                value={cwdPath}
                placeholder="/enter/project/url"
            />
            <button id="project-create-button" onClick={handleProjectCreate}> <FaPlus/> </button>
        </div>
    )
}

export default NavigationBar
