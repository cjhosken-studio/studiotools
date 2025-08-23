import NavigationBar from "./components/layouts/NavigationBar";

import "./App.css";
import { ContextProvider } from "./ContextProvider";
import ProjectTreePanel from "./components/trees/ProjectTree";
import PropertiesPanel from "./components/layouts/Properties";
import Workspace from "./components/layouts/Workspace";

function App() {
  return (
    <div id="root">
      <ContextProvider>
        <NavigationBar/>
        <main>
          <div className="row">
            <ProjectTreePanel/>
            <Workspace/>
            <PropertiesPanel/>
          </div>
        </main>
      </ContextProvider>
    </div>
  );
}

export default App;
