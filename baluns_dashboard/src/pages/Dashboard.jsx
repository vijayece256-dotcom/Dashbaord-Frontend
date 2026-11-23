import { useMemo } from "react";
import { Layers, Play, Check, Pause, Users } from "lucide-react";
import { useBoards } from "../context/BoardsContext.jsx";
import { useEmployees } from "../context/EmployeesContext.jsx";
// import { PROJECTS } from "../data/projects.js";
import { useProjects } from "../context/ProjectsContext.jsx";
import { formatDate } from "../utils/format.js";
import { buildDashboardStats } from "../utils/dashboardStats.js";
import StatCard from "../components/common/StatCard.jsx";
import DeliveryHealth from "../components/dashboard/DeliveryHealth.jsx";
import TeamPerformance from "../components/dashboard/TeamPerformance.jsx";
import HoldProjects from "../components/dashboard/HoldProjects.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const { boards } = useBoards();
  const { projects } = useProjects();
  const { employees = [] } = useEmployees();

const stats = useMemo(
  () => buildDashboardStats(boards, projects, employees),
  [boards, projects, employees]
);


  const percentOfProjects = (n) =>
    stats.projectTotal ? `${Math.round((n / stats.projectTotal) * 100)}% of projects` : "No projects yet";

  return (
    <div className="dashboard">
      <section className="dash-stats">
        <StatCard icon={Layers} label="Total projects" value={stats.projectTotal} note="All projects" />
        <StatCard icon={Play} label="In progress" value={stats.inProgress} note={percentOfProjects(stats.inProgress)} />
        <StatCard icon={Check} label="Completed" value={stats.completed} note={percentOfProjects(stats.completed)} />
        <StatCard icon={Pause} label="On hold" value={stats.holdProjects.length} note={percentOfProjects(stats.holdProjects.length)} />
        <StatCard
          icon={Users}
          label="Total employees"
          value={stats.employees}
          note={`Across ${stats.teams} ${stats.teams === 1 ? "team" : "teams"}`}
        />
      </section>

      <section className="dash-main">
        <div className="dash-left">
          <DeliveryHealth stats={stats} />
          <TeamPerformance teams={stats.byTeam} />
        </div>
        <HoldProjects stats={stats} />
      </section>
    </div>
  );
}