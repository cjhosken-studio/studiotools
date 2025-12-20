import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { loadStoredContext, loadStoredProjects, storeContext, storeProjectList } from "./Storage";
import Context from "./types/Context"
import Project from "./types/Project";

const AppContext = createContext<{
    context: Context;
    projectList: Project[];
    setContext: (ctx: Context) => void
    setProjectList: (list: Project[]) => void
} | null>(null)


export function ContextProvider({ children } : { children: ReactNode }) {
    const [context, setContextState] = useState<Context>(new Context(new Project("", ""), ""))
    const [projectList, setProjectListState] = useState<Project[]>([]);
    const [hydrated, setHydrated] = useState(false);

    const setContext = (ctx: Context) => {
        setContextState(ctx);
        if (hydrated) {
            storeContext(ctx).catch(console.error);
        }
    }

    const setProjectList = (list: Project[]) => {
        setProjectListState(list);
        if (hydrated) {
            storeProjectList(list).catch(console.error)
        }
    }

    useEffect(() => {
        (async () => {
            const storedCtx = await loadStoredContext();

            if (storedCtx) setContextState(storedCtx);

            const storedProjects = await loadStoredProjects();
            if (storedProjects.length) setProjectListState(storedProjects);

            setHydrated(true);
        })();
    }, []);

    return (
        <AppContext.Provider value={{ context, projectList, setContext, setProjectList }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used inside ContextProvider")
    return ctx
}
