import "./App.css";
import { ContextProvider } from "./ContextProvider";
import ProjectTreePanel from "./components/widgets/ProjectTree";
import Workspace from "./components/widgets/Workspace";
import NavigationBar from "./components/widgets/NavigationBar";


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
