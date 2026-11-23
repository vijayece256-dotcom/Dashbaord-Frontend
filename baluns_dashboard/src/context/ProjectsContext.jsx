import { createContext, useContext, useEffect, useState } from "react";
import { SEED_PROJECTS } from "../data/projects.js";

const ProjectsContext = createContext(null);
const STORAGE_KEY = "baluns_projects";

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    /* fall through to sample data */
  }
  return SEED_PROJECTS;
}

const nextProjectId = (projects) => {
  const numbers = projects.map((p) => Number(p.id.replace("PRJ-", ""))).filter(Boolean);
  return `PRJ-${Math.max(1000, ...numbers) + 1}`;
};

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(loadProjects);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addProject = (data) => {
    const project = { ...data, id: nextProjectId(projects) };
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const updateProject = (id, changes) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  const deleteProject = (id) => setProjects((prev) => prev.filter((p) => p.id !== id));

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectsContext);