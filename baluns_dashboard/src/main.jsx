
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { BoardsProvider } from "./context/BoardsContext.jsx";
import { ProjectsProvider } from "./context/ProjectsContext.jsx";
import { EmployeesProvider } from "./context/EmployeesContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BoardsProvider>
            <EmployeesProvider>
              <ProjectsProvider>
                <App />
              </ProjectsProvider>
            </EmployeesProvider>
          </BoardsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
