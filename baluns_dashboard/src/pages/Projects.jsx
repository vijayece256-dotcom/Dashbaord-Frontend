
import { useMemo, useState } from "react";
import {
  Layers,
  CalendarClock,
  Play,
  Check,
  Pause,
  Plus,
  ChevronRight,
} from "lucide-react";
import { generateDummyEmployees } from "../data/dummyEmployees.js";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";
import { PROJECT_STATUSES, statusById } from "../data/projectStatus.js";
import { taskStatsByProject, progressOf } from "../utils/projectStats.js";
import { formatDate } from "../utils/format.js";

import PageHeader from "../components/common/PageHeader.jsx";
import StatGrid from "../components/common/StatGrid.jsx";
import StatCard from "../components/common/StatCard.jsx";
import SearchInput from "../components/common/SearchInput.jsx";
import Dropdown from "../components/common/Dropdown.jsx";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import DataTable from "../components/common/DataTable.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import Pagination from "../components/common/Pagination.jsx";

import ProjectModal from "../components/projects/ProjectModal.jsx";
import ProjectFormModal from "../components/projects/ProjectFormModal.jsx";

import "./Projects.css";

const PAGE_SIZE = 10;
const ALL = "all";

const unique = (list, key) =>
  [...new Set(list.map((p) => p?.[key]).filter(Boolean))].sort();

const toOptions = (values) => [
  { id: ALL, title: "All" },
  ...values.map((v) => ({ id: v, title: v })),
];

export default function Projects() {
  const {
    projects = [],
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const { boards = [] } = useBoards();
  const employees = useMemo(
    () => generateDummyEmployees(boards),
    [boards]
  );
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    status: ALL,
    team: ALL,
    client: ALL,
    owner: ALL,
  });

  const [page, setPage] = useState(1);

  // Details modal: project object or null
  const [selectedProject, setSelectedProject] = useState(null);

  // Form modal: "new", project object, or null
  const [editingProject, setEditingProject] = useState(null);

  const taskStats = useMemo(
    () => taskStatsByProject(boards),
    [boards]
  );

  const allTasks = useMemo(
    () =>
      boards.flatMap((board) =>
        Array.isArray(board.tasks) ? board.tasks : []
      ),
    [boards]
  );

  const count = (status) =>
    projects.filter((p) => p?.status === status).length;

  const q = query.trim().toLowerCase();

  const rows = useMemo(
    () =>
      projects.filter((p) => {
        if (!p) return false;

        const matchesSearch =
          !q ||
          String(p.id ?? "").toLowerCase().includes(q) ||
          String(p.name ?? "").toLowerCase().includes(q);

        if (!matchesSearch) return false;

        return Object.entries(filters).every(
          ([key, value]) =>
            value === ALL || p[key] === value
        );
      }),
    [projects, q, filters]
  );

  const pages = Math.max(
    1,
    Math.ceil(rows.length / PAGE_SIZE)
  );

  const current = Math.min(page, pages);

  const visible = rows.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE
  );

  const setFilter = (key) => (value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const teamNames = useMemo(
    () =>
      [
        ...new Set([
          ...boards.map((b) => b?.name).filter(Boolean),
          ...unique(projects, "team"),
        ]),
      ].sort(),
    [boards, projects]
  );

  const openCreate = () => {
    setSelectedProject(null);
    setEditingProject("new");
  };

  const openDetails = (project) => {
    if (!project) return;
    setEditingProject(null);
    setSelectedProject(project);
  };

  const openEdit = (project) => {
    if (!project) return;
    setSelectedProject(null);
    setEditingProject(project);
  };

  const saveProject = (data) => {
    if (editingProject === "new") {
      addProject(data);
    } else if (editingProject?.id) {
      updateProject(editingProject.id, data);
    }

    setEditingProject(null);
  };

  const removeProject = () => {
    if (
      editingProject &&
      editingProject !== "new" &&
      editingProject.id
    ) {
      deleteProject(editingProject.id);
    }

    setEditingProject(null);
  };

  const columns = [
    {
      key: "id",
      header: "Project ID",
    },
    {
      key: "name",
      header: "Project name",
      render: (p) => <strong>{p.name}</strong>,
    },
    {
      key: "client",
      header: "Client",
    },
    {
      key: "team",
      header: "Team",
    },
    {
      key: "owner",
      header: "Project owner",
    },
    {
      key: "startDate",
      header: "Start date",
      render: (p) => formatDate(p.startDate),
    },
    {
      key: "endDate",
      header: "Expected end date",
      render: (p) => formatDate(p.endDate),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        const status = statusById(p.status) ?? {
          title: p.status || "Unknown",
          tone: "neutral",
        };

        return (
          <StatusBadge tone={status.tone}>
            {status.title}
          </StatusBadge>
        );
      },
    },
    {
      key: "progress",
      header: "Progress",
      width: 150,
      render: (p) => {
        const pct = progressOf(
          p,
          taskStats[p.id]
        );

        return (
          <div className="progress-cell">
            <span>{pct}%</span>
            <ProgressBar
              value={pct}
              label={`${p.name} progress`}
            />
          </div>
        );
      },
    },
    {
      key: "tasks",
      header: "Tasks",
      render: (p) => {
        const stats = taskStats[p.id] ?? {
          done: 0,
          total: 0,
        };

        return `${stats.done} / ${stats.total}`;
      },
    },
    {
      key: "open",
      header: "",
      width: 32,
      render: () => <ChevronRight size={16} />,
    },
  ];

  return (
    <div className="projects-page">
      <PageHeader
        title="Projects"
        subtitle="Manage upcoming and active projects across all teams."
      >
        <Button icon={Plus} onClick={openCreate}>
          Create project
        </Button>
      </PageHeader>

      <StatGrid>
        <StatCard
          icon={Layers}
          label="Total projects"
          value={projects.length}
          note="All projects"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming"
          value={count("upcoming")}
          note="Not started yet"
        />
        <StatCard
          icon={Play}
          label="In progress"
          value={count("inprogress")}
          note="Being worked on"
        />
        <StatCard
          icon={Check}
          label="Completed"
          value={count("completed")}
          note="Delivered"
        />
        <StatCard
          icon={Pause}
          label="On hold"
          value={count("hold")}
          note="Waiting for action"
        />
      </StatGrid>

      <Card className="projects-card">
        <div className="projects-toolbar">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search by project name or ID"
          />

          <Dropdown
            compact
            label="Status"
            value={filters.status}
            onChange={setFilter("status")}
            options={[
              {
                id: ALL,
                title: "All",
                color: "var(--grey-300)",
              },
              ...PROJECT_STATUSES,
            ]}
          />

          <Dropdown
            compact
            label="Team"
            value={filters.team}
            onChange={setFilter("team")}
            options={toOptions(unique(projects, "team"))}
          />

          <Dropdown
            compact
            label="Client"
            value={filters.client}
            onChange={setFilter("client")}
            options={toOptions(unique(projects, "client"))}
          />

          <Dropdown
            compact
            label="Owner"
            value={filters.owner}
            onChange={setFilter("owner")}
            options={toOptions(unique(projects, "owner"))}
          />
        </div>

        <div className="projects-table-scroll">
  <DataTable
    columns={columns}
    rows={visible}
    onRowClick={openDetails}
    emptyText={
      projects.length === 0
        ? "No projects yet. Click Create project to add one."
        : "No projects match your search or filters."
    }
  />
</div>

        <Pagination
          page={current}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onChange={setPage}
          noun="projects"
        />
      </Card>

      {selectedProject && (
        <ProjectModal
        project={projects.find((p) => p.id === selectedProject.id)}
        employees={employees}
        tasks={allTasks}
        onUpdateProject={updateProject}
        onEdit={() => {
          setModal(selectedProject);
          setSelectedProject(null);
        }}
        onClose={() => setSelectedProject(null)}
      />
      )}

      {editingProject && (
        <ProjectFormModal
          key={
            editingProject === "new"
              ? "new"
              : editingProject.id
          }
          project={
            editingProject === "new"
              ? null
              : editingProject
          }
          teams={teamNames}
          employees={employees}
          onSave={saveProject}
          onDelete={removeProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
