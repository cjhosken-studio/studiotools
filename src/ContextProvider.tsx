import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Context from "./types/Context"
import Project from "./types/Project";
import { loadStoredContext, loadStoredProjects, storeContext, storeProjectList } from "./Storage";

const AppContext = createContext<{
    context: Context;
    projectList: Project[];
    setContext: (ctx: Context) => void
    setProjectList: (list: Project[]) => void
} | null>(null)

export function ContextProvider({ children } : { children: ReactNode }) {
    const [context, setContextState] = useState<Context>(new Context(new Project("", ""), ""))
    const [projectList, setProjectListState] = useState<Project[]>([]);

    const setContext = (ctx: Context) => {
        setContextState(ctx);
        storeContext(ctx).catch(console.error);
    }

    const setProjectList = (list: Project[]) => {
        setProjectListState(list);
        storeProjectList(list).catch(console.error)
    }

    useEffect(() => {
        (async () => {
            const storedCtx = await loadStoredContext();

            console.log("context:", storedCtx?.cwd)

            if (storedCtx) setContextState(storedCtx);

            const storedProjects = await loadStoredProjects?.();
            if (storedProjects) setProjectListState(storedProjects)
        })();
    }, []);

    return (
        <AppContext.Provider value={{ context, projectList, setContext, setProjectList }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error("useAppContext must be used inside ContextProvider")
    return ctx
}