import React, { useRef, useState } from "react";
import "./NavigationBar.css";

const NavigationBar: React.FC = () => {
    const [projectPath, setProjectPath] = useState("");

    const handleProjectChange = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/select-project");
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || "Failed to fetch folder");
            }

            setProjectPath(data.projectPath);  // Use "folderPath" instead of "realPath"
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="navigation-bar">
            <input
                className="project-url"
                placeholder="/home/user/projects/a00001"
                value={projectPath}
            />
            <button className="set-project-url-button" onClick={handleProjectChange}>Browse</button>
        </div>
    );
};

export default NavigationBar;