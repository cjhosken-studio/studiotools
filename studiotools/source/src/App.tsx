import { useState } from 'react';
import 'react-resizable/css/styles.css'; // Don't forget to import the styles
import './App.css'; // Your custom CSS

import NavigationBar from './components/NavigationBar';
import AppBar from './components/AppBar';

function App() {
  return (
    <div className="app-container">
      <AppBar></AppBar>
      <NavigationBar></NavigationBar>
      <div className="grid-container">
        <div>
        </div>
        <div>
          lolololol
        </div>
      </div>
    </div>
  );
}

export default App;