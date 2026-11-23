
import { useMemo, useState } from "react";
import { Search, Check, ChevronDown } from "lucide-react";

import { useProjects } from "../../context/ProjectsContext.jsx";
import { useBoards } from "../../context/BoardsContext.jsx";
import { generateDummyEmployees } from "../../data/dummyEmployees.js";

import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";
import Dropdown from "../common/Dropdown.jsx";

import "./CreateTaskModal.css";

const PRIORITY_OPTIONS = [
  { id: "low", title: "Low", color: "#22a06b" },
  { id: "medium", title: "Medium", color: "#e6a23c" },
  { id: "high", title: "High", color: "#e5484d" },
];

export default function CreateTaskModal({
  onCreate,
  onClose,
  boardId,
}) {
  const { projects = [] } = useProjects();
  const { boards = [] } = useBoards();

  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium",
    assignee: "",
    dueDate: "",
  });

  const [error, setError] = useState("");
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const set = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
    setError("");
  };

  const setDropdown = (key) => (value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setError("");
  };

  // Projects belonging to the current board
  const currentProjects = useMemo(() => {
    if (!boardId) return projects;
  
    const currentBoard = boards.find(
      (board) => String(board.id) === String(boardId)
    );
  
    if (!currentBoard) return [];
  
    const normalize = (value) =>
      String(value ?? "").trim().toLowerCase();
  
    return projects.filter((project) => {
      const projectTeamId =
        project.boardId ??
        project.teamId ??
        project.assignedTeamId;
  
      const projectTeamName =
        project.assignedTeam ??
        project.team ??
        project.teamName;
  
      return (
        normalize(projectTeamId) === normalize(boardId) ||
        normalize(projectTeamName) === normalize(currentBoard.name)
      );
    });
  }, [projects, boards, boardId]);

  const projectOptions = useMemo(() => {
    return [
      {
        id: "",
        title: "Select project",
        color: "#a5a0a5",
      },
      ...currentProjects.map((project) => ({
        id: String(project.id),
        title: project.name,
        color: "#82143c",
      })),
    ];
  }, [currentProjects]);

  // Generate dummy employees
  const employees = useMemo(() => {
    return generateDummyEmployees(boards);
  }, [boards]);

  // Show employees from the selected board/team
  const availableEmployees = useMemo(() => {
    if (!boardId) return employees;

    return employees.filter(
      (employee) =>
        String(employee.teamId) === String(boardId)
    );
  }, [employees, boardId]);

  // Search employees by name, role or ID
  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLowerCase();

    if (!search) return availableEmployees;

    return availableEmployees.filter((employee) => {
      const text = [
        employee.name,
        employee.role,
        employee.empId,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }, [availableEmployees, employeeSearch]);

  const selectedEmployee = employees.find(
    (employee) => employee.name === form.assignee
  );

  const selectEmployee = (employee) => {
    setForm((previous) => ({
      ...previous,
      assignee: employee.name,
    }));

    setEmployeeOpen(false);
    setEmployeeSearch("");
    setError("");
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const submit = () => {
    if (!form.title.trim()) {
      setError("Enter a task title.");
      return;
    }

    if (!form.projectId) {
      setError("Please select a project.");
      return;
    }

    const selectedProject = currentProjects.find(
      (project) =>
        String(project.id) === String(form.projectId)
    );

    if (!selectedProject) {
      setError("Please select a valid project.");
      return;
    }

    onCreate({
      ...form,
      title: form.title.trim(),
      assignee: form.assignee.trim(),
      projectId: selectedProject.id,
      project: selectedProject.name,
    });
  };

  return (
    <Modal
      title="Create task"
      size="md"
      onClose={onClose}
    >
      <div className="create-task-form">
        <div className="form-stack">
          <Input
            label="Title"
            placeholder="e.g. Create a Task.."
            value={form.title}
            autoFocus
            error={
              error && !form.title.trim() ? error : ""
            }
            onChange={set("title")}
          />

          <Input
            as="textarea"
            label="Description"
            placeholder="Optional details"
            value={form.description}
            onChange={set("description")}
          />

          {/* PROJECT */}
          <div className="create-task-field">
            <label className="create-task-label">
              Project
            </label>

            <Dropdown
              value={form.projectId}
              options={projectOptions}
              onChange={setDropdown("projectId")}
            />

            {error &&
              form.title.trim() &&
              !form.projectId && (
                <span className="create-task-error">
                  {error}
                </span>
              )}

            {currentProjects.length === 0 && (
              <span className="create-task-error">
                No projects available for this team.
              </span>
            )}
          </div>

          {/* PRIORITY AND DUE DATE */}
          <div className="form-row create-task-row">
            <div className="create-task-field">
              <label className="create-task-label">
                Priority
              </label>

              <Dropdown
                value={form.priority}
                options={PRIORITY_OPTIONS}
                onChange={setDropdown("priority")}
              />
            </div>

            <div className="create-task-date">
              <Input
                type="date"
                label="Due date"
                value={form.dueDate}
                onChange={set("dueDate")}
              />
            </div>
          </div>

          {/* ASSIGNEE */}
          <div className="create-task-field ct-assignee-field">
            <label className="create-task-label">
              Assignee
            </label>

            <button
              type="button"
              className={`ct-assignee-trigger ${
                employeeOpen ? "is-open" : ""
              }`}
              aria-expanded={employeeOpen}
              onClick={() =>
                setEmployeeOpen((previous) => !previous)
              }
            >
              {selectedEmployee ? (
                <div className="ct-selected-employee">
                  <span className="ct-employee-avatar">
                    {getInitials(selectedEmployee.name)}
                  </span>

                  <span className="ct-employee-info">
                    <strong>{selectedEmployee.name}</strong>
                    <small>{selectedEmployee.role}</small>
                  </span>
                </div>
              ) : (
                <span className="ct-placeholder">
                  Select employee
                </span>
              )}

              <ChevronDown size={17} />
            </button>

            {employeeOpen && (
              <div className="ct-employee-dropdown">
                <div className="ct-employee-search">
                  <Search size={15} />

                  <input
                    type="text"
                    placeholder="Search name, role or ID..."
                    value={employeeSearch}
                    onChange={(event) =>
                      setEmployeeSearch(event.target.value)
                    }
                    autoFocus
                  />
                </div>

                <div className="ct-employee-list">
                  {filteredEmployees.length === 0 ? (
                    <p className="ct-no-employees">
                      No employees found
                    </p>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <button
                        type="button"
                        key={employee.id}
                        className={`ct-employee-option ${
                          form.assignee === employee.name
                            ? "is-selected"
                            : ""
                        }`}
                        onClick={() => selectEmployee(employee)}
                      >
                        <span className="ct-employee-avatar">
                          {getInitials(employee.name)}
                        </span>

                        <span className="ct-employee-info">
                          <strong>{employee.name}</strong>
                          <small>{employee.role}</small>
                        </span>

                        <span className="ct-employee-id">
                          {employee.empId}
                        </span>

                        {form.assignee === employee.name && (
                          <Check size={15} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button onClick={submit}>
            Create task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
