import { remove } from "@tauri-apps/plugin-fs";
import Context from "../../types/Context"

import "./DeleteDialog.css"

export default function DeleteDialog({
    pathToDelete,
    context,
    setContext,
    setPathToDelete,
    refresh,
    onClose
}: {
    pathToDelete: string,
    context: Context
    setContext: (context: Context) => void;
    setPathToDelete: (path: string | null) => void;
    refresh: () => void;
    onClose: () => void;
}) {

    return (
        <div className="dialog">
            <div id="delete-dialog">
                <div id="delete-text"> 
                    <p>
                        Are you sure you want to delete:
                    </p>
                    <p className="link">
                        {pathToDelete}
                    </p>
                    <p>
                        This cannot be undone.
                    </p>
                </div>

                <div className="row">
                    <button onClick={async () => {

                        if (context.cwd == pathToDelete) {
                            context.setCwd(context.project.path)
                            setContext(new Context(context.project, context.cwd))
                        }
                        await remove(pathToDelete, { recursive: true })
                        setPathToDelete(null);
                        refresh();
                    }}>Delete</button>

                    <button onClick={() => onClose()}> Cancel </button>
                </div>
            </div>
        </div>
    )
}