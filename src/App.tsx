import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

import NavigationBar from "./components/NavigationBar";

import Context from "./types/Context";

import "./App.css";
import { ContextProvider } from "./ContextProvider";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div id="root">
      <ContextProvider>
        <NavigationBar/>
        <main>
          <h1>Welcome to Tauri + React</h1>
        </main>
      </ContextProvider>
    </div>
  );
}

export default App;
