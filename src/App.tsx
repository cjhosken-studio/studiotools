import NavigationBar from "./components/layouts/NavigationBar";

import "./App.css";
import { ContextProvider } from "./ContextProvider";
import ProjectTreePanel from "./components/trees/ProjectTree";
import WorkspacePanel from "./components/layouts/WorkspacePanel";
import PropertiesPanel from "./components/layouts/Properties";

function App() {
  return (
    <div id="root">
      <ContextProvider>
        <NavigationBar/>
        <main>
          <div className="row">
            <ProjectTreePanel/>
            <WorkspacePanel/>
            <PropertiesPanel/>
          </div>
        </main>
      </ContextProvider>
    </div>
  );
}

export default App;
