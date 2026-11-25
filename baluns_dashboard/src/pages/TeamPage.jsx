import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { useEmployees } from "../context/EmployeesContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";

import Dropdown from "../components/common/Dropdown.jsx";
import EmployeeTable from "../components/team/EmployeeTable.jsx";
import EmployeeDetailModal from "../components/team/EmployeeDetailModal.jsx";
import EmployeeFormModal from "../components/team/EmployeeFormModal.jsx";

import "./TeamPage.css";

const PAGE_SIZE = 8;

const getId = (item) => item?._id ?? item?.id ?? "";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

export default function TeamPage() {
  // =====================================
  // CONTEXT
  // =====================================

  const { isAdmin } = useAuth();

  const {
    employees = [],
    saveEmployee,
    removeEmployee,
  } = useEmployees();

  const { projects = [] } = useProjects();
  const { boards = [] } = useBoards();

  // Temporary until registered accounts API is available
  const [accounts] = useState([]);

  // =====================================
  // STATE
  // =====================================

  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [project, setProject] = useState("");

  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // =====================================
  // FILTER OPTIONS
  // =====================================

  const opts = (title, values) => [
    { id: "", title },
    ...values.map((v) => ({
      id: String(v),
      title: String(v),
    })),
  ];

  const teamOptions = opts(
    "All Departments",
    [
      ...new Set(
        employees.map((e) => e.team).filter(Boolean)
      ),
    ].sort()
  );

  const roleOptions = opts(
    "All Roles",
    [
      ...new Set(
        employees.map((e) => e.role).filter(Boolean)
      ),
    ].sort()
  );

  const projectOptions = [
    { id: "", title: "All Projects" },

    ...projects.map((p) => ({
      id: String(getId(p)),
      title: p.name,
    })),
  ];

  // =====================================
  // FILTER EMPLOYEES
  // =====================================

  const filtered = useMemo(() => {
    const selectedProject = projects.find(
      (p) => String(getId(p)) === String(project)
    );

    const allTasks = boards.flatMap((board) =>
      (board.tasks || []).map((task) => ({
        ...task,
        boardId: getId(board),
      }))
    );

    return employees.filter((employee) => {
      // Search filter

      const searchText = [
        employee.name,
        employee.empId || getId(employee),
        employee.email,
        employee.role,
        employee.team,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        normalize(query)
      );

      // Department filter

      const matchesTeam =
        !team || employee.team === team;

      // Designation filter

      const matchesRole =
        !role || employee.role === role;

      // Project filter

      let matchesProject = !project;

      if (project && selectedProject) {
        const selectedProjectId = String(
          getId(selectedProject)
        );

        // Direct project assignment

        const directMatch =
          String(employee.projectId || "") ===
            selectedProjectId ||
          employee.project === selectedProject.name;

        // Task-based project assignment

        const taskMatch = allTasks.some((task) => {
          const sameProject =
            String(task.projectId || "") ===
              selectedProjectId ||
            (!task.projectId &&
              task.project === selectedProject.name);

          if (!sameProject) return false;

          const assignee = task.assignee;

          if (!assignee) return false;

          const employeeName = normalize(employee.name);

          if (typeof assignee === "string") {
            return (
              !!employeeName &&
              normalize(assignee) === employeeName
            );
          }

          const assigneeId =
            getId(assignee) || assignee.empId;

          const employeeId =
            getId(employee) || employee.empId;

          const sameId =
            !!assigneeId &&
            !!employeeId &&
            String(assigneeId) === String(employeeId);

          const sameName =
            !!employeeName &&
            normalize(assignee.name) === employeeName;

          return sameId || sameName;
        });

        matchesProject = directMatch || taskMatch;
      }

      return (
        matchesSearch &&
        matchesTeam &&
        matchesRole &&
        matchesProject
      );
    });
  }, [employees, projects, boards, query, team, role, project]);

  // =====================================
  // PAGINATION
  // =====================================

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, pages);

  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // =====================================
  // EMPLOYEE ACTIONS
  // =====================================

  const handleAdd = () => {
    if (!isAdmin) return;

    setEditing(null);
  };

  const handleEdit = (employee) => {
    if (!isAdmin) return;

    setSelected(null);
    setEditing(employee);
  };

  const handleDeleteRequest = (employee) => {
    if (!isAdmin) return;

    setDeleteError("");
    setDeleting(employee);
  };

  // Save employee

  const handleSave = async (data) => {
    if (!isAdmin) {
      return {
        ok: false,
        error: "Administrator access is required.",
      };
    }

    try {
      const result = await saveEmployee(data);

      if (result === false || result?.ok === false) {
        return {
          ok: false,
          error: result?.error || "Unable to save employee.",
        };
      }

      setEditing(undefined);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error.message || "Unable to save employee.",
      };
    }
  };

  // Delete employee

  const handleDelete = async () => {
    if (!isAdmin || !deleting || deleteBusy) return;

    setDeleteBusy(true);
    setDeleteError("");

    try {
      const result = await removeEmployee(getId(deleting));

      if (result === false || result?.ok === false) {
        throw new Error(
          result?.error || "Unable to delete employee."
        );
      }

      setDeleting(null);
    } catch (error) {
      setDeleteError(
        error.message || "Unable to delete employee."
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="team-page">

      {/* PAGE HEADER */}

      <div className="team-heading">
        <div>
          <h1>Employees Details</h1>

          <p>
            Manage employees, designations, departments,
            project assignments and feature access.
          </p>
        </div>

        {isAdmin && (
          <button
            className="team-btn primary"
            onClick={handleAdd}
          >
            <Plus size={17} />
            Add Employee
          </button>
        )}
      </div>

      {/* MAIN CONTENT */}

      <div className="team-content-card">

        {/* FILTER TOOLBAR */}

        <div className="team-toolbar">

          <div className="team-search">
            <Search size={17} />

            <input
              placeholder="Search employees"
              value={query}
              onChange={(ev) =>
                change(setQuery)(ev.target.value)
              }
            />
          </div>

          <Dropdown
            value={team}
            options={teamOptions}
            onChange={change(setTeam)}
          />

          <Dropdown
            value={role}
            options={roleOptions}
            onChange={change(setRole)}
          />

          <Dropdown
            value={project}
            options={projectOptions}
            onChange={change(setProject)}
          />

        </div>

        {/* EMPLOYEE TABLE */}

        <div className="team-table-scroll">
          <EmployeeTable
            employees={visible}
            projects={projects}
            isAdmin={isAdmin}
            onOpen={setSelected}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        </div>

        {/* PAGINATION */}

        <div className="team-footer">
          <span>
            Showing{" "}
            {filtered.length
              ? (currentPage - 1) * PAGE_SIZE + 1
              : 0}
            –
            {Math.min(
              currentPage * PAGE_SIZE,
              filtered.length
            )}{" "}
            of {filtered.length} employees
          </span>

          <div className="team-pagination">

            <button
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={
                  currentPage === i + 1 ? "active" : ""
                }
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              aria-label="Next page"
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>

          </div>
        </div>
      </div>

      {/* EMPLOYEE DETAILS MODAL */}

      {selected && (
        <EmployeeDetailModal
          employee={
            employees.find(
              (e) =>
                String(getId(e)) ===
                String(getId(selected))
            ) || selected
          }
          projects={projects}
          boards={boards}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onEdit={handleEdit}
        />
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}

      {isAdmin && editing !== undefined && (
        <EmployeeFormModal
          employee={editing}
          employees={employees}
          accounts={accounts}
          boards={boards}
          projects={projects}
          onClose={() => setEditing(undefined)}
          onSave={handleSave}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}

      {isAdmin && deleting && (
        <div
          className="team-overlay"
          onMouseDown={() => {
            if (!deleteBusy) setDeleting(null);
          }}
        >
          <div
            className="team-dialog team-confirm"
            onMouseDown={(ev) => ev.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-employee-title"
          >
            <h2 id="delete-employee-title">
              Delete employee?
            </h2>

            <p>
              Remove <strong>{deleting.name}</strong>{" "}
              from the employee directory?
            </p>

            {deleteError && (
              <p className="team-error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="team-dialog-actions">

              <button
                className="team-btn secondary"
                disabled={deleteBusy}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>

              <button
                className="team-btn danger"
                disabled={deleteBusy}
                onClick={handleDelete}
              >
                {deleteBusy
                  ? "Deleting..."
                  : "Delete employee"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}