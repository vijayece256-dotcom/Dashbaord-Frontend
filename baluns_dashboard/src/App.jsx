import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import BoardPage from "./pages/BoardPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Projects from "./pages/Projects.jsx";
import TeamPage from "./pages/TeamPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="/tasks" element={<Placeholder title="Tasks" />} />
        <Route path="/projects" element={<Placeholder title="Projects" />} />
        <Route path="/team" element={<Placeholder title="Team" />} />
        <Route path="/analytics" element={<Placeholder title="Analytics" />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  );
}