import NavigationBar from "./components/NavigationBar";

import "./App.css";
import { ContextProvider } from "./ContextProvider";
import ProjectTreePanel from "./components/ProjectTree";
import WorkspacePanel from "./components/WorkspacePanel";
import PropertiesPanel from "./components/Properties";

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
