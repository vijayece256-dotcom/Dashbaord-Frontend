import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { BoardsProvider } from "./context/BoardsContext.jsx";
import { ProjectsProvider } from "./context/ProjectsContext.jsx";
import { EmployeesProvider } from "./context/EmployeesContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <BoardsProvider>
      <EmployeesProvider>
        <ProjectsProvider>
          <App />
        </ProjectsProvider>
        </EmployeesProvider>
      </BoardsProvider>
    </BrowserRouter>
  </React.StrictMode>
);