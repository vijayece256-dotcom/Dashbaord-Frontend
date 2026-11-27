
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { useEmployees } from "../context/EmployeesContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";

import Dropdown from "../components/common/Dropdown.jsx";
import EmployeeTable from "../components/team/EmployeeTable.jsx";
import EmployeeDetailModal from "../components/team/EmployeeDetailModal.jsx";
import EmployeeFormModal from "../components/team/EmployeeFormModal.jsx";
import PageSkeleton from "../components/common/PageSkeleton.jsx";

import "./TeamPage.css";

const PAGE_SIZE = 8;

const getId = (item) => item?._id ?? item?.id ?? "";

const getEmployeeCode = (item) =>
  item?.employeeCode ??
  item?.empId ??
  item?.employee_code ??
  "";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const mergeEmployee = (base, detail) => {
  const merged = { ...base };

  Object.entries(detail || {}).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      merged[key] = value;
    }
  });

  return merged;
};

export default function TeamPage() {
  const {
    employees = [],
    accounts = [],
    loading = false,
    error = "",

    accountsLoading = false,
    accountsError = "",

    // Shared feature API data.
    features = [],
    featuresLoading = false,
    featuresError = "",

    saveEmployee,
    removeEmployee,
    fetchEmployee,
  } = useEmployees();

  const { projects = [] } = useProjects();
  const { boards = [] } = useBoards();

  const { isAdmin } = useAuth();

  // ---------------------------------------
  // STATE
  // ---------------------------------------

  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");
  const [project, setProject] = useState("");

  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const detailRequestId = useRef(0);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [notice, setNotice] = useState(null);

  // ---------------------------------------
  // AUTO-DISMISS SUCCESS POPUP
  // ---------------------------------------

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => {
      setNotice(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notice]);

  // ---------------------------------------
  // FILTER OPTIONS
  // ---------------------------------------

  const opts = (title, values) => [
    { id: "", title },
    ...values.map((value) => ({
      id: String(value),
      title: String(value),
    })),
  ];

  const teamOptions = opts(
    "All Departments",
    [
      ...new Set(
        employees.map((employee) => employee.team).filter(Boolean)
      ),
    ].sort()
  );

  const roleOptions = opts(
    "All Roles",
    [
      ...new Set(
        employees.map((employee) => employee.role).filter(Boolean)
      ),
    ].sort()
  );

  const projectOptions = [
    { id: "", title: "All Projects" },
    ...projects.map((projectItem) => ({
      id: String(getId(projectItem)),
      title: projectItem.name,
    })),
  ];

  // ---------------------------------------
  // FILTER EMPLOYEES
  // ---------------------------------------

  const filtered = useMemo(() => {
    const selectedProject = projects.find(
      (projectItem) =>
        String(getId(projectItem)) === String(project)
    );

    const allTasks = boards.flatMap((board) =>
      (board.tasks || []).map((task) => ({
        ...task,
        boardId: getId(board),
      }))
    );

    return employees.filter((employee) => {
      const searchText = [
        employee.name,
        getEmployeeCode(employee),
        employee.email,
        employee.role,
        employee.team,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(normalize(query));

      const matchesTeam =
        !team || employee.team === team;

      const matchesRole =
        !role || employee.role === role;

      let matchesProject = !project;

      if (project && selectedProject) {
        const selectedProjectId = String(
          getId(selectedProject)
        );

        const directMatch =
          String(employee.projectId || "") === selectedProjectId ||
          employee.project === selectedProject.name;

        const taskMatch = allTasks.some((task) => {
          const sameProject =
            String(task.projectId || "") === selectedProjectId ||
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
  }, [
    employees,
    projects,
    boards,
    query,
    team,
    role,
    project,
  ]);

  // ---------------------------------------
  // PAGINATION
  // ---------------------------------------

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

  // ---------------------------------------
  // EMPLOYEE ACTIONS
  // ---------------------------------------

  const handleAdd = () => {
    if (!isAdmin) return;

    setEditing(null);
  };

  const handleOpen = async (employee) => {
    const requestId = ++detailRequestId.current;
    setSelected(employee);

    try {
      const detail = await fetchEmployee(getId(employee));
      if (requestId === detailRequestId.current) {
        setSelected(mergeEmployee(employee, detail));
      }
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setNotice(error.message || "Unable to load employee details.");
      }
    }
  };

  const handleCloseDetails = () => {
    detailRequestId.current += 1;
    setSelected(null);
  };

  const handleEdit = async (employee) => {
    if (!isAdmin) return;

    detailRequestId.current += 1;
    setSelected(null);

    let full = employee;

    try {
      const detail = await fetchEmployee(getId(employee));

      full = mergeEmployee(employee, detail);
    } catch {
      // Use employee list data if detail request fails.
    }

    setEditing(full);
  };

  const handleDeleteRequest = (employee) => {
    if (!isAdmin) return;

    setDeleteError("");
    setDeleting(employee);
  };

  // ---------------------------------------
  // SAVE EMPLOYEE
  // ---------------------------------------

  const handleSave = async (data) => {
    if (!isAdmin) {
      return {
        ok: false,
        error: "Administrator access is required.",
      };
    }

    const isEdit = Boolean(getId(editing));

    try {
      const result = await saveEmployee(data);

      if (result?.ok !== true) {
        return {
          ok: false,
          error: result?.error || "Unable to save employee.",
        };
      }

      setEditing(undefined);

      setNotice({
        title: isEdit ? "Employee updated" : "Employee added",

        message: `${data.name || "The employee"} has been ${
          isEdit ? "updated" : "added"
        } successfully.`,
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error.message || "Unable to save employee.",
      };
    }
  };

  // ---------------------------------------
  // DELETE EMPLOYEE
  // ---------------------------------------

  const handleDelete = async () => {
    if (!isAdmin || !deleting || deleteBusy) return;

    setDeleteBusy(true);
    setDeleteError("");

    try {
      const result = await removeEmployee(getId(deleting));

      if (result?.ok !== true) {
        throw new Error(
          result?.error || "Unable to delete employee."
        );
      }

      const deletedName = deleting.name;

      setDeleting(null);

      setNotice({
        title: "Employee deleted",
        message: `${deletedName} has been removed from the directory.`,
      });
    } catch (error) {
      setDeleteError(
        error.message || "Unable to delete employee."
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------

  if (loading) return <PageSkeleton variant="team" />;

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
              onChange={(event) =>
                change(setQuery)(event.target.value)
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
            onOpen={handleOpen}
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

            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                className={
                  currentPage === index + 1 ? "active" : ""
                }
                onClick={() => setPage(index + 1)}
              >
                {index + 1}
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
          employee={selected}
          projects={projects}
          boards={boards}
          isAdmin={isAdmin}
          onClose={handleCloseDetails}
          onEdit={handleEdit}
        />
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}

      {isAdmin && editing !== undefined && (
        <EmployeeFormModal
          key={getId(editing) || "new-employee"}
          employee={editing}
          employees={employees}
          accounts={accounts}
          accountsLoading={accountsLoading}
          accountsError={accountsError}
          features={features}
          featuresLoading={featuresLoading}
          featuresError={featuresError}
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
            onMouseDown={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-employee-title"
          >
            <h2 id="delete-employee-title">
              Delete employee?
            </h2>

            <p>
              Remove <strong>{deleting.name}</strong> from the
              employee directory?
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
                {deleteBusy ? "Deleting..." : "Delete employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}

      {notice && (
        <div
          className="team-overlay"
          onMouseDown={() => setNotice(null)}
        >
          <div
            className="team-dialog team-confirm team-success"
            onMouseDown={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="employee-notice-title"
          >
            <div className="team-success-icon">
              <CheckCircle2 size={28} />
            </div>

            <h2 id="employee-notice-title">
              {notice.title}
            </h2>

            <p>{notice.message}</p>

            <div className="team-dialog-actions">
              <button
                type="button"
                className="team-btn primary"
                autoFocus
                onClick={() => setNotice(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
