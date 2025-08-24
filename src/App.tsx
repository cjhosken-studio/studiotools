import NavigationBar from "./components/layouts/NavigationBar";

import "./App.css";
import { ContextProvider } from "./ContextProvider";
import ProjectTreePanel from "./components/trees/ProjectTree";
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
          </div>
        </main>
      </ContextProvider>
    </div>
  );
}

export default App;
