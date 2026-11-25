import {
  X,
  Pencil,
  Check,
  Minus,
  Kanban,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

import "./EmployeeDetailModal.css";

const FEATURES = [
  {
    key: "dashboard",
    label: "Dashboard",
    actions: ["view"],
  },
  {
    key: "tasks",
    label: "Tasks",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "projects",
    label: "Projects",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "team",
    label: "Team",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "boards",
    label: "Task boards",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "analytics",
    label: "Analytics",
    actions: ["view"],
  },
];

const ACTIONS = ["view", "create", "edit", "delete"];

const getId = (item) =>
  item?._id ?? item?.id ?? "";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

export default function EmployeeDetailModal({
  employee: e,
  projects = [],
  boards = [],
  isAdmin = false,
  onClose,
  onEdit,
}) {
  if (!e) return null;

  const name =
    e.name ||
    `${e.firstname || ""} ${e.lastname || ""}`.trim() ||
    "Employee";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const teamName =
    typeof e.team === "object"
      ? e.team?.teamName
      : e.team;

  const role =
    e.role ||
    e.designation?.designationName ||
    e.designation?.name ||
    "Employee";

  const inactive =
    e.status === "inactive" || e.isActive === false;

  // ---------------------------------------
  // PROJECT INFORMATION
  // ---------------------------------------

  const current = projects.find(
    (p) =>
      String(getId(p)) ===
        String(e.projectId?._id ?? e.projectId ?? "") ||
      p.name === e.project
  );

  const assigned = projects.filter((p) => {
    const members =
      p.assignedEmployees || p.employeeIds || [];

    return (
      members.some((member) => {
        const id =
          typeof member === "object"
            ? getId(member)
            : member;

        return String(id) === String(getId(e));
      }) ||
      (current &&
        String(getId(p)) === String(getId(current)))
    );
  });

  // ---------------------------------------
  // EMPLOYEE TASKS
  // ---------------------------------------

  const assignedTasks = boards.flatMap((board) =>
    (board.tasks || [])
      .filter((task) => {
        const assignees = [
          task.assignee,
          ...(Array.isArray(task.assignees)
            ? task.assignees
            : []),
        ].filter(Boolean);

        return assignees.some((person) => {
          if (typeof person === "object") {
            return (
              (!!getId(person) &&
                String(getId(person)) ===
                  String(getId(e))) ||
              normalize(person.name) === normalize(name)
            );
          }

          return (
            normalize(person) === normalize(name) ||
            String(person) === String(getId(e)) ||
            (!!e.empId &&
              String(person) === String(e.empId))
          );
        });
      })
      .map((task) => ({
        ...task,
        boardName: board.name,
        boardId: getId(board),
      }))
  );

  const completedStatuses = [
    "done",
    "completed",
    "complete",
  ];

  const completedTasks = assignedTasks.filter((task) =>
    completedStatuses.includes(normalize(task.status))
  );

  const inProgressTasks = assignedTasks.filter((task) =>
    ["in-progress", "in_progress", "in progress", "inprogress"].includes(
      normalize(task.status)
    )
  );

  const pendingTasks =
    assignedTasks.length - completedTasks.length;

  // ---------------------------------------
  // FEATURE ACCESS
  // ---------------------------------------

  const permissions = e.permissions || {};

  const hasPermissionData = e.permissions != null;

  const enabledFeatures = FEATURES.filter(
    (feature) => permissions[feature.key]?.view === true
  ).length;

  // ---------------------------------------
  // BOARD ACCESS
  // ---------------------------------------

  const boardAccess = (
    Array.isArray(e.boardAccess) ? e.boardAccess : []
  ).map((board) =>
    String(
      typeof board === "object"
        ? getId(board)
        : board
    )
  );

  const allowedBoards = boards.filter(
    (board) =>
      permissions.boards?.view === true &&
      boardAccess.includes(String(getId(board)))
  );

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <div
      className="team-overlay"
      onMouseDown={onClose}
    >
      <section
        className="team-dialog team-detail employee-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Employee details"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        {/* FIXED HEADER */}

        <div className="employee-detail-header">
          <button
            type="button"
            className="team-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>

          <div className="team-detail-head">
            <span className="team-avatar large">
              {initials}
            </span>

            <div>
              <h2>{name}</h2>

              <p>
                {e.empId || getId(e)} · {role}
              </p>

              <small>
                {teamName || "Unassigned team"}
              </small>
            </div>

            <span
              className={`team-status ${
                inactive ? "inactive" : ""
              }`}
            >
              {inactive ? "Inactive" : "Active"}
            </span>
          </div>
        </div>

        {/* SCROLLABLE BODY */}

        <div className="employee-detail-body">

          {/* EMPLOYEE INFORMATION */}

          <div className="team-panel">
            <h3>Employee information</h3>

            <div className="team-facts">
              <div>
                <span>Employee ID</span>
                <strong>{e.empId || getId(e)}</strong>
              </div>

              <div>
                <span>Team</span>
                <strong>{teamName || "—"}</strong>
              </div>

              <div>
                <span>Full name</span>
                <strong>{name}</strong>
              </div>

              <div>
                <span>Reporting manager</span>
                <strong>{e.manager || "—"}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{role}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {e.email || e.emailaddress || "—"}
                </strong>
              </div>

              <div>
                <span>Phone number</span>
                <strong>
                  {e.phonenumber || e.phone || "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* TASK OVERVIEW */}

          <div className="team-panel">
            <div className="employee-detail-section-head">
              <h3>
                <ListChecks size={17} />
                Task overview
              </h3>
            </div>

            <div className="employee-task-stats">
              <div className="employee-task-stat">
                <span>Total assigned</span>
                <strong>{assignedTasks.length}</strong>
              </div>

              <div className="employee-task-stat progress">
                <span>In progress</span>
                <strong>{inProgressTasks.length}</strong>
              </div>

              <div className="employee-task-stat completed">
                <span>Completed</span>
                <strong>{completedTasks.length}</strong>
              </div>

              <div className="employee-task-stat pending">
                <span>Pending</span>
                <strong>{pendingTasks}</strong>
              </div>
            </div>
          </div>

          {/* CURRENT PROJECT */}

          <div className="team-panel">
            <h3>Current project</h3>

            {current ? (
              <div className="team-project-line">
                <strong>{current.name}</strong>
                <span>{current.status || "—"}</span>
              </div>
            ) : (
              <p className="team-muted">
                No current project assigned.
              </p>
            )}
          </div>

          {/* PROJECT INFORMATION */}

          <div className="team-detail-grid">
            <div className="team-panel">
              <h3>Projects worked on</h3>

              <p className="team-muted">
                Project history is not recorded yet.
              </p>
            </div>

            <div className="team-panel">
              <h3>Projects currently working on</h3>

              {assigned.length ? (
                assigned.map((p) => (
                  <div
                    className="team-project-line"
                    key={getId(p)}
                  >
                    <strong>{p.name}</strong>
                    <span>{p.status || "—"}</span>
                  </div>
                ))
              ) : (
                <p className="team-muted">
                  No linked projects.
                </p>
              )}
            </div>
          </div>

          {/* FEATURE ACCESS */}

          <div className="team-panel">
            <div className="employee-detail-section-head">
              <h3>
                <ShieldCheck size={17} />
                Feature access
              </h3>

              {hasPermissionData && (
                <span className="employee-access-count">
                  {enabledFeatures} of {FEATURES.length} enabled
                </span>
              )}
            </div>

            {!hasPermissionData ? (
              <p className="team-muted">
                No feature permissions recorded.
              </p>
            ) : (
              <div className="employee-detail-table-wrap">
                <table className="employee-detail-permissions">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>View</th>
                      <th>Create</th>
                      <th>Edit</th>
                      <th>Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    {FEATURES.map((feature) => (
                      <tr key={feature.key}>
                        <td>{feature.label}</td>

                        {ACTIONS.map((action) => {
                          const applicable =
                            feature.actions.includes(action);

                          const allowed =
                            permissions[feature.key]?.[
                              action
                            ] === true;

                          return (
                            <td key={action}>
                              {!applicable ? (
                                <span className="employee-permission-na">
                                  —
                                </span>
                              ) : allowed ? (
                                <span
                                  className="employee-permission-allowed"
                                  title="Allowed"
                                  aria-label="Allowed"
                                >
                                  <Check size={14} />
                                </span>
                              ) : (
                                <span
                                  className="employee-permission-denied"
                                  title="Restricted"
                                  aria-label="Restricted"
                                >
                                  <X size={13} />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="employee-permission-legend">
              <span>
                <Check size={14} />
                Allowed
              </span>

              <span>
                <X size={14} />
                Restricted
              </span>

              <span>
                <Minus size={14} />
                Not applicable
              </span>
            </div>
          </div>

          {/* BOARD ACCESS */}

          <div className="team-panel">
            <div className="employee-detail-section-head">
              <h3>
                <Kanban size={17} />
                Board access
              </h3>

              <span className="employee-access-count">
                {hasPermissionData
                  ? `${allowedBoards.length} of ${boards.length} boards`
                  : "Not recorded"}
              </span>
            </div>

            <div className="employee-detail-board-list">
              {boards.map((board) => {
                const allowed =
                  permissions.boards?.view === true &&
                  boardAccess.includes(
                    String(getId(board))
                  );

                return (
                  <div
                    className="employee-detail-board"
                    key={getId(board)}
                  >
                    <div className="employee-detail-board-name">
                      <span className="employee-detail-board-icon">
                        <Kanban size={17} />
                      </span>

                      <strong>{board.name}</strong>
                    </div>

                    <span
                      className={`employee-board-status ${
                        allowed ? "allowed" : "restricted"
                      }`}
                    >
                      {!hasPermissionData
                        ? "Not recorded"
                        : allowed
                        ? "Allowed"
                        : "Restricted"}
                    </span>
                  </div>
                );
              })}

              {!boards.length && (
                <p className="team-muted">
                  No task boards available.
                </p>
              )}
            </div>
          </div>

          {/* ASSIGNED TASK LIST */}

          <div className="team-panel">
            <div className="employee-detail-section-head">
              <h3>Assigned tasks</h3>

              <span className="employee-access-count">
                {assignedTasks.length} tasks
              </span>
            </div>

            {assignedTasks.length ? (
              <div className="employee-assigned-task-list">
                {assignedTasks.map((task, index) => (
                  <div
                    className="employee-assigned-task"
                    key={`${task.boardId}-${getId(task) || index}`}
                  >
                    <div>
                      <strong>
                        {task.taskNumber
                          ? `#${String(task.taskNumber).padStart(3, "0")} · `
                          : ""}
                        {task.title || "Untitled task"}
                      </strong>

                      <small>{task.boardName}</small>
                    </div>

                    <span className="employee-task-status">
                      {task.status || "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="team-muted">
                No tasks assigned to this employee.
              </p>
            )}
          </div>
        </div>

        {/* FIXED FOOTER */}

        <div className="team-dialog-actions employee-detail-footer">
          {isAdmin && (
            <button
              type="button"
              className="team-btn secondary"
              onClick={() => onEdit(e)}
            >
              <Pencil size={15} />
              Edit employee
            </button>
          )}

          <button
            type="button"
            className="team-btn primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}