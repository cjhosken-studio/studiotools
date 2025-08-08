import { useContext, useState } from "react";
import { createContext } from "vm";
import Project from "./project";

interface ContextType {
    project: Project;
    cwd: string;
    setProject: (project: Project) => void;
    setCwd: (path: string) => void;
}

export default ContextType;

const Context = createContext<ContextType | undefined>(undefined);

export const ContextProvider = ({children}: {children: React.ReactNode}) => {
    const [project, setProject] = useState<Project>();
    const [cwd, setCwd] = useState("");

    return (
        <Context.Provider value={{project, cwd, setProject, setCwd}}>
            {children}
        </Context.Provider>
    );
};

export const getContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("getContext must be used with a ContextProvider");
    }
    return context
}