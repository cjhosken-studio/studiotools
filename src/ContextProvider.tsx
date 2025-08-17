import { createContext, useContext, useState, ReactNode } from "react";
import Context from "./types/Context"
import Project from "./types/Project";

const AppContext = createContext<{
    context: Context
    setContext: (ctx: Context) => void
} | null>(null)

export function ContextProvider({ children } : { children: ReactNode }) {
    const [context, setContext] = useState<Context>(new Context(new Project("", ""), ""))

    return (
        <AppContext.Provider value={{ context, setContext }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error("useAppContext must be used inside ContextProvider")
    return ctx
}