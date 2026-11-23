import { useMemo, useState } from "react";
import { Search, List, LayoutGrid, X } from "lucide-react";
import { generateDummyEmployees } from "../data/dummyEmployees.js";
import { useBoards } from "../context/BoardsContext.jsx";
import Avatar from "../components/common/Avatar.jsx";
import TaskCard from "../components/boards/TaskCard.jsx";
import Dropdown from "../components/common/Dropdown.jsx";
import { formatDate } from "../utils/format.js";

import "../components/boards/KanbanColumn.css";
import "./Tasks.css";

// -----------------------------------------
// TASK STATUSES
// -----------------------------------------

const STATUSES = [
  {
    id: "aligned",
    title: "Aligned Next",
    color: "#8a8a93",
  },
  {
    id: "progress",
    title: "In Progress",
    color: "var(--burgundy-300)",
  },
  {
    id: "testing",
    title: "Testing",
    color: "var(--burgundy-600, #a3345a)",
  },
  {
    id: "completed",
    title: "Completed",
    color: "var(--burgundy-900)",
  },
];

const STATUS_TITLE = Object.fromEntries(
  STATUSES.map((status) => [status.id, status.title])
);

// -----------------------------------------
// DROPDOWN OPTIONS
// -----------------------------------------

const withAll = (label, options) => [
  {
    id: "",
    title: label,
  },
  ...options,
];

const STATUS_OPTIONS = withAll(
  "All statuses",
  STATUSES
);

const PRIORITY_OPTIONS = withAll(
  "All priorities",
  ["Low", "Medium", "High", "Critical"].map(
    (priority) => ({
      id: priority,
      title: priority,
      color: "var(--burgundy-700)",
    })
  )
);

// -----------------------------------------
// HELPERS
// -----------------------------------------

const normStatus = (task) => {
  const raw = String(
    task.status ??
      task.columnId ??
      task.column ??
      ""
  )
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (raw.includes("test")) {
    return "testing";
  }

  if (raw.includes("progress")) {
    return "progress";
  }

  if (
    raw.includes("complet") ||
    raw.includes("done")
  ) {
    return "completed";
  }

  return "aligned";
};

const nameOf = (person) => {
  if (typeof person === "string") {
    return person;
  }

  return person?.name || "";
};

const assigneesOf = (task) => {
  const additional =
    task.additionalAssignees ??
    task.assignees ??
    [];

  const additionalList = Array.isArray(additional)
    ? additional
    : [additional];

  return [
    task.assignee,
    ...additionalList,
  ]
    .map(nameOf)
    .filter(Boolean);
};

const EMPTY = {
  search: "",
  employee: "",
  department: "",
  project: "",
  status: "",
  priority: "",
  from: "",
  to: "",
};

// -----------------------------------------
// TASKS PAGE
// -----------------------------------------

export default function Tasks() {
  const { boards = [] } = useBoards();

  const [view, setView] = useState("kanban");

  const [f, setF] = useState({ ...EMPTY });

  // Native input handler
  const set = (key) => (event) => {
    setF((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  // Custom dropdown handler
  const setValue = (key) => (value) => {
    const selectedValue =
      value?.target?.value ??
      (typeof value === "object" && value !== null
        ? value.id ?? value.value ?? ""
        : value);

    setF((previous) => ({
      ...previous,
      [key]: selectedValue ?? "",
    }));
  };

  // -----------------------------------------
  // COLLECT ALL TASKS
  // -----------------------------------------

  const all = useMemo(() => {
    return boards.flatMap((board) => {
      return (board.tasks || []).map((task) => ({
        ...task,

        department: board.name,

        project: task.project || "",

        statusId: normStatus(task),

        people: assigneesOf(task),

        start: task.startDate || "",

        end:
          task.endDate ||
          task.dueDate ||
          "",
      }));
    });
  }, [boards]);

  // -----------------------------------------
  // FILTER OPTIONS
  // -----------------------------------------

  
const employees = useMemo(() => {
  // Generate all 100 employees from existing boards.
  const dummyEmployees = generateDummyEmployees(boards);

  // Include employees already assigned to tasks.
  const assignedEmployees = all.flatMap(
    (task) => task.people
  );

  // Merge both sources and remove duplicate names.
  return [
    ...new Set([
      ...dummyEmployees.map((employee) => employee.name),
      ...assignedEmployees,
    ]),
  ].sort((a, b) => a.localeCompare(b));
}, [boards, all]);


  const departments = useMemo(() => {
    return [
      ...new Set(
        boards
          .map((board) => board.name)
          .filter(Boolean)
      ),
    ].sort();
  }, [boards]);

  const projects = useMemo(() => {
    return [
      ...new Set(
        all
          .map((task) => task.project)
          .filter(Boolean)
      ),
    ].sort();
  }, [all]);

  const toOptions = (label, names) => {
    return withAll(
      label,
      names.map((name) => ({
        id: name,
        title: name,
        color: "var(--burgundy-700)",
      }))
    );
  };

  const employeeOptions = toOptions(
    "All employees",
    employees
  );

  const departmentOptions = toOptions(
    "All departments",
    departments
  );

  const projectOptions = toOptions(
    "All projects",
    projects
  );

  // -----------------------------------------
  // FILTER TASKS
  // -----------------------------------------

  const tasks = useMemo(() => {
    const search = f.search
      .trim()
      .toLowerCase();

    return all.filter((task) => {
      // Search
      if (search) {
        const searchableText = `
          ${task.id ?? ""}
          ${task.title ?? ""}
          ${task.project ?? ""}
          ${task.department ?? ""}
        `.toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      // Employee
      if (
        f.employee &&
        !task.people.includes(f.employee)
      ) {
        return false;
      }

      // Department
      if (
        f.department &&
        task.department !== f.department
      ) {
        return false;
      }

      // Project
      if (
        f.project &&
        task.project !== f.project
      ) {
        return false;
      }

      // Status
      if (
        f.status &&
        task.statusId !== f.status
      ) {
        return false;
      }

      // Priority
      if (
        f.priority &&
        String(task.priority ?? "").toLowerCase() !==
          String(f.priority).toLowerCase()
      ) {
        return false;
      }

      // Due date from
      if (
        f.from &&
        (!task.end ||
          String(task.end).slice(0, 10) < f.from)
      ) {
        return false;
      }

      // Due date to
      if (
        f.to &&
        (!task.end ||
          String(task.end).slice(0, 10) > f.to)
      ) {
        return false;
      }

      return true;
    });
  }, [all, f]);

  const isFiltered = Object.keys(EMPTY).some(
    (key) => f[key] !== EMPTY[key]
  );

  const clearFilters = () => {
    setF({ ...EMPTY });
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <div className="tasks-page">

      {/* PAGE HEADER */}

      <header className="tasks-head">
        <div>
          <h2>Tasks</h2>

          <p>
            {tasks.length} of {all.length} tasks
            across all departments
          </p>
        </div>

        <div
          className="tasks-toggle"
          role="tablist"
          aria-label="Task view"
        >
          <button
            type="button"
            className={
              view === "kanban" ? "on" : ""
            }
            onClick={() => setView("kanban")}
          >
            <LayoutGrid size={16} />
            Kanban
          </button>

          <button
            type="button"
            className={
              view === "list" ? "on" : ""
            }
            onClick={() => setView("list")}
          >
            <List size={16} />
            List
          </button>
        </div>
      </header>

      {/* FILTER SECTION */}

      <section className="tasks-filters">

        {/* SEARCH */}

        <label className="tasks-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search by ID, title, project..."
            value={f.search}
            onChange={set("search")}
          />
        </label>

        {/* EMPLOYEE */}

        <div className="tasks-select">
          <Dropdown
            value={f.employee}
            options={employeeOptions}
            onChange={setValue("employee")}
          />
        </div>

        {/* DEPARTMENT */}

        <div className="tasks-select">
          <Dropdown
            value={f.department}
            options={departmentOptions}
            onChange={setValue("department")}
          />
        </div>

        {/* PROJECT */}

        <div className="tasks-select">
          <Dropdown
            value={f.project}
            options={projectOptions}
            onChange={setValue("project")}
          />
        </div>

        {/* STATUS */}

        <div className="tasks-select">
          <Dropdown
            value={f.status}
            options={STATUS_OPTIONS}
            onChange={setValue("status")}
          />
        </div>

        {/* PRIORITY */}

        <div className="tasks-select">
          <Dropdown
            value={f.priority}
            options={PRIORITY_OPTIONS}
            onChange={setValue("priority")}
          />
        </div>

        {/* DATE FILTER */}

        <div className="tasks-dates">
          <input
            type="date"
            value={f.from}
            onChange={set("from")}
            aria-label="Due from"
          />

          <span>to</span>

          <input
            type="date"
            value={f.to}
            onChange={set("to")}
            aria-label="Due to"
          />
        </div>

        {/* CLEAR FILTERS */}

        {isFiltered && (
          <button
            type="button"
            className="tasks-clear"
            onClick={clearFilters}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </section>

      {/* TASK CONTENT */}

      {tasks.length === 0 ? (

        <div className="tasks-empty">
          No tasks match your filters.
        </div>

      ) : view === "list" ? (

        /* LIST VIEW */

        <div className="tasks-table-wrap">
          <table className="tasks-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Task</th>
                <th>Project</th>
                <th>Department</th>
                <th>Assignees</th>
                <th>Reporter</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Start</th>
                <th>Due</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={`${task.department}-${task.id ?? index}`}
                >

                  {/* TASK ID */}

                  <td className="tk-id">
  {task.taskNumber != null
    ? `#${String(task.taskNumber).padStart(3, "0")}`
    : "—"}
</td>

                  {/* TASK TITLE */}

                  <td className="tk-title">
                    {task.title}
                  </td>

                  {/* PROJECT */}

                  <td>
                    {task.project || "-"}
                  </td>

                  {/* DEPARTMENT */}

                  <td>
                    {task.department}
                  </td>

                  {/* ASSIGNEES */}

                  <td>
                    <div className="tk-people">
                      {task.people.length === 0 && "-"}

                      {task.people.map((name, i) => (
                        <span
                          key={`${name}-${i}`}
                          title={
                            i === 0
                              ? `${name} (primary)`
                              : name
                          }
                        >
                          <Avatar
                            name={name}
                            size="sm"
                          />
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* REPORTER */}

                  <td>
                    {task.reporter || "-"}
                  </td>

                  {/* PRIORITY */}

                  <td>
                    <span
                      className={`tk-priority tk-priority-${String(
                        task.priority || ""
                      ).toLowerCase()}`}
                    >
                      {task.priority || "-"}
                    </span>
                  </td>

                  {/* STATUS */}

                  <td>
                    <span className="tk-status">
                      <i
                        style={{
                          background:
                            STATUSES.find(
                              (status) =>
                                status.id === task.statusId
                            )?.color || "#8a8a93",
                        }}
                      />

                      {STATUS_TITLE[task.statusId] ||
                        "Aligned Next"}
                    </span>
                  </td>

                  {/* START DATE */}

                  <td>
                    {task.start
                      ? formatDate(task.start)
                      : "-"}
                  </td>

                  {/* DUE DATE */}

                  <td>
                    {task.end
                      ? formatDate(task.end)
                      : "-"}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      ) : (

        /* KANBAN VIEW */

        <div className="tasks-kanban">

          {STATUSES.map((status) => {
            const columnTasks = tasks.filter(
              (task) => task.statusId === status.id
            );

            return (
              <section
                className="kanban-col"
                key={status.id}
              >

                {/* COLUMN HEADER */}

                <header className="kanban-col-head">
                  <span
                    className="kanban-dot"
                    style={{
                      background: status.color,
                    }}
                  />

                  <h3>
                    {status.title}
                  </h3>

                  <span className="kanban-count">
                    {columnTasks.length}
                  </span>
                </header>

                {/* COLUMN TASKS */}

                <div className="kanban-col-body">

                  {columnTasks.length === 0 && (
                    <p className="kanban-empty">
                      No tasks
                    </p>
                  )}

                  {columnTasks.map((task, index) => (
                    <TaskCard
                      key={`${task.department}-${task.id ?? index}`}
                      task={task}
                      readOnly
                      tag={task.department}
                    />
                  ))}

                </div>

              </section>
            );
          })}

        </div>
      )}

    </div>
  );
}
