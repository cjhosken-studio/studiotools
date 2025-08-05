import React from "react";
import "./AppBar.css";


const AppBar: React.FC = ({

}) => {
    return [
        <div className="app-bar">
            <button className="app-button"> Studio Tools </button>
            <button className="app-button"> Developer </button>
        </div>
    ]
}


export default AppBar;