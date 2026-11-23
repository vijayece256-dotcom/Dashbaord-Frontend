
import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import Modal from "../common/Modal.jsx";
import { PROJECT_STATUSES } from "../../data/projectStatus.js";
import "./ProjectFormModal.css";

const EMPTY = {
  name: "",
  client: "",
  owner: "",
  department: "",
  team: "",
  startDate: "",
  endDate: "",
  status: "upcoming",
  description: "",
  memberIds: [],
};

export default function ProjectFormModal({
  project = null,
  teams = [],
  employees = [],
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = Boolean(project);

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(project || {}),
    memberIds: [...(project?.memberIds || [])],
  }));

  const [errors, setErrors] = useState({});
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleEmployee = (id) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((value) => value !== id)
        : [...prev.memberIds, id],
    }));
  };

  
const filteredEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLowerCase();
  
    return employees.filter((employee) => {
      const matchesTeam =
        !form.team ||
        employee.teamId === form.teamId ||
        employee.team?.trim().toLowerCase() ===
          form.team.trim().toLowerCase();
  
      const matchesSearch = [
        employee.name,
        employee.role,
        employee.empId,
        employee.id,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
  
      return matchesTeam && matchesSearch;
    });
  }, [employees, form.team, form.teamId, employeeSearch]);
  

  const selectedEmployees = employees.filter((e) =>
    form.memberIds.includes(e.id)
  );

  const submit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.name.trim())
      nextErrors.name = "Project name is required";

    if (!form.owner.trim())
      nextErrors.owner = "Owner is required";

    if (!form.team)
      nextErrors.team = "Team is required";

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      nextErrors.endDate = "Invalid end date";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    const data = {
      ...form,
      name: form.name.trim(),
      owner: form.owner.trim(),
    };

    if (!isEdit) delete data.id;

    onSave?.(data);
  };

  return (
    <Modal
      title={isEdit ? "Edit project" : "Create project"}
      size="lg"
      onClose={onClose}
    >
      <form className="project-form-compact" onSubmit={submit}>
        <div className="pf-grid">
          <div className="pf-field pf-full">
            <label>Project name *</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter project name"
            />
            {errors.name && <small>{errors.name}</small>}
          </div>

          <div className="pf-field">
            <label>Client</label>
            <input
              value={form.client}
              onChange={(e) => update("client", e.target.value)}
              placeholder="Client name"
            />
          </div>

          <div className="pf-field">
            <label>Project owner *</label>
            <input
              value={form.owner}
              onChange={(e) => update("owner", e.target.value)}
              placeholder="Owner name"
            />
            {errors.owner && <small>{errors.owner}</small>}
          </div>

          <div className="pf-field">
            <label>Department</label>
            <input
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="Department"
            />
          </div>

          <div className="pf-field">
            <label>Assigned team *</label>
            <select
              value={form.team}
              onChange={(e) => {
                update("team", e.target.value);
                setForm((prev) => ({
                  ...prev,
                  team: e.target.value,
                  memberIds: [],
                }));
              }}
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {errors.team && <small>{errors.team}</small>}
          </div>

          <div className="pf-field">
            <label>Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </div>

          <div className="pf-field">
            <label>Expected end date</label>
            <input
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
            {errors.endDate && <small>{errors.endDate}</small>}
          </div>

          <div className="pf-field pf-full pf-employee-field">
            <label>
              Assign employees
              <span className="pf-count">
                {form.memberIds.length} selected
              </span>
            </label>

            <div
              className="pf-employee-control"
              onClick={() => setEmployeeOpen((v) => !v)}
            >
              {selectedEmployees.length ? (
                <div className="pf-chips">
                  {selectedEmployees.map((employee) => (
                    <span className="pf-chip" key={employee.id}>
                      {employee.name}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleEmployee(employee.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="pf-placeholder">
                  Select employees working on this project
                </span>
              )}
              <span className="pf-chevron">⌄</span>
            </div>

            {employeeOpen && (
              <div className="pf-employee-dropdown">
                <div className="pf-employee-search">
                  <Search size={15} />
                  <input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) =>
                      setEmployeeSearch(e.target.value)
                    }
                  />
                </div>

                
<div className="pf-employee-options">
  {filteredEmployees.length === 0 ? (
    <p className="pf-no-employees">
      No employees available
    </p>
  ) : (
    filteredEmployees.map((employee) => {
      const selected = form.memberIds.includes(employee.id);

      return (
        <label
          className="pf-employee-option"
          key={employee.id}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleEmployee(employee.id)}
          />

          <div className="pf-employee-avatar">
            {employee.name
              .split(" ")
              .map((name) => name[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          <div className="pf-employee-info">
            <strong>{employee.name}</strong>
            <span>{employee.role}</span>
          </div>

          <span className="pf-employee-id">
            {employee.empId || employee.id}
          </span>
        </label>
      );
    })
  )}
</div>


                <button
                  type="button"
                  className="pf-done"
                  onClick={() => setEmployeeOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div className="pf-field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pf-field">
            <label>Description</label>
            <input
              value={form.description}
              onChange={(e) =>
                update("description", e.target.value)
              }
              placeholder="Short description"
            />
          </div>
        </div>

        {confirmDelete && (
          <div className="pf-delete-confirm">
            <span>Delete this project permanently?</span>
            <button type="button" onClick={onDelete}>
              Confirm delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
            >
              Keep project
            </button>
          </div>
        )}

        <div className="pf-actions">
          {isEdit && !confirmDelete && (
            <button
              type="button"
              className="pf-delete"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          )}
          <div className="pf-action-right">
            <button
              type="button"
              className="pf-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="pf-submit">
              {isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
