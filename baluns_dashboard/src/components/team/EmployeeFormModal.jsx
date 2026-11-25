import { useEffect, useState } from "react";
import {
  X,
  UserRoundPlus,
  UserRound,
  ShieldCheck,
  Kanban,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  ChartNoAxesCombined,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { API_BASE_URL } from "../../config/env.js";
import "./EmployeeFormModal.css";

const STEPS = [
  { id: 1, label: "Employee details", icon: UserRound },
  { id: 2, label: "Feature access", icon: ShieldCheck },
  { id: 3, label: "Board access", icon: Kanban },
];

const FEATURES = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Access dashboard and work overview",
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: ListChecks,
    description: "Access the tasks page",
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    description: "Access project information",
  },
  {
    key: "team",
    label: "Team",
    icon: Users,
    description: "Access employee and team information",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: ChartNoAxesCombined,
    description: "Access reports and analytics",
  },
];

const DEFAULT_PERMISSIONS = {
  dashboard: false,
  tasks: false,
  projects: false,
  team: false,
  analytics: false,
};

const getId = (item) => item?._id ?? item?.id ?? "";

export default function EmployeeFormModal({
  employee,
  employees = [],
  accounts = [],
  boards = [],
  projects = [],
  onSave,
  onClose,
}) {
  const { token, isAdmin } = useAuth();

  const [step, setStep] = useState(1);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState(() => ({
    userId: "",
    firstname: "",
    lastname: "",
    empId: "",
    email: "",
    phonenumber: "",
    teamId: "",
    designationId: "",
    projectId: "",
    reportingManagerId: "",
    status: "active",
    ...employee,
    userId: employee?.userId?._id ?? employee?.userId ?? "",
    teamId: employee?.teamId ?? employee?.team?._id ?? "",
    designationId:
      employee?.designationId ?? employee?.designation?._id ?? "",
  }));

  const [permissions, setPermissions] = useState(() =>
    Object.fromEntries(
      FEATURES.map(({ key }) => {
        const existing = employee?.permissions?.[key];
  
        return [
          key,
          typeof existing === "boolean"
            ? existing
            : existing?.view ?? DEFAULT_PERMISSIONS[key],
        ];
      })
    )
  );
  
  const [boardAccess, setBoardAccess] = useState(() =>
    (employee?.boardAccess || [])
      .map((board) =>
        String(
          typeof board === "object"
            ? getId(board)
            : board
        )
      )
      .filter(Boolean)
  );

  // ---------------------------------------
  // Fetch designations from backend
  // ---------------------------------------

  useEffect(() => {
    if (!token || !isAdmin) {
      setLoading(false);
      setFetchError("Administrator access is required.");
      return;
    }

    const controller = new AbortController();

    const fetchDesignations = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/team/designation`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to fetch designations (${response.status})`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid designation response.");
        }

        if (!controller.signal.aborted) {
          setDesignations(
            data.filter(
              (d) =>
                d.isActive === true &&
                d.team?.isActive === true
            )
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setFetchError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDesignations();

    return () => controller.abort();
  }, [token, isAdmin]);

  // ---------------------------------------
  // Form handlers
  // ---------------------------------------

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
  };

  const selectAccount = (id) => {
    const account = accounts.find(
      (a) => String(getId(a)) === String(id)
    );

    setForm((prev) => ({
      ...prev,
      userId: id,
      email: account?.emailaddress || account?.email || "",
    }));

    setError("");
  };

  // Unique active teams from designation API.
  const teams = Array.from(
    new Map(
      designations.map((d) => [
        String(d.team._id),
        d.team,
      ])
    ).values()
  );

  const availableDesignations = designations.filter(
    (d) =>
      String(d.team?._id) === String(form.teamId)
  );

  const availableProjects = projects.filter(
    (p) =>
      String(p.teamId?._id ?? p.teamId ?? p.team?._id ?? "") ===
      String(form.teamId)
  );

  const availableManagers = employees.filter(
    (person) =>
      String(getId(person)) !== String(getId(employee)) &&
      person.status !== "inactive" &&
      person.isActive !== false
  );

  // ---------------------------------------
  // Feature permissions
  // ---------------------------------------

  const togglePermission = (feature) => {
    setPermissions((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };
  
  const toggleBoard = (id) => {
    const boardId = String(id);
  
    setBoardAccess((prev) =>
      prev.includes(boardId)
        ? prev.filter((item) => item !== boardId)
        : [...prev, boardId]
    );
  };
  


  const selectAllBoards = () => {
    setBoardAccess(boards.map((b) => String(getId(b))));
  };

  const clearAllBoards = () => {
    setBoardAccess([]);
  };

  // ---------------------------------------
  // Validation
  // ---------------------------------------

  const validateDetails = () => {
    if (!form.userId) {
      return "Select an existing user account.";
    }

    if (!form.firstname.trim()) {
      return "First name is required.";
    }

    if (!form.lastname.trim()) {
      return "Last name is required.";
    }

    if (!form.empId.trim()) {
      return "Employee ID is required.";
    }

    if (!form.teamId) {
      return "Select a department or team.";
    }

    if (!form.designationId) {
      return "Select a designation.";
    }

    if (
      !availableDesignations.some(
        (d) => String(d._id) === String(form.designationId)
      )
    ) {
      return "Select an active designation belonging to the selected team.";
    }

    return "";
  };

  const next = () => {
    if (step === 1) {
      const message = validateDetails();

      if (message) {
        setError(message);
        return;
      }
    }

    setError("");
    setStep((prev) => Math.min(prev + 1, 3));
  };

  // ---------------------------------------
  // Save employee
  // ---------------------------------------

  const submit = async (ev) => {
    ev.preventDefault();

    if (busy || !isAdmin) return;

    if (step !== 3) {
      next();
      return;
    }

    const message = validateDetails();

    if (message) {
      setError(message);
      setStep(1);
      return;
    }

    const selectedTeam = teams.find(
      (t) => String(t._id) === String(form.teamId)
    );

    const selectedDesignation = designations.find(
      (d) => String(d._id) === String(form.designationId)
    );

    const selectedProject = availableProjects.find(
      (p) => String(getId(p)) === String(form.projectId)
    );

    const selectedManager = employees.find(
      (p) => String(getId(p)) === String(form.reportingManagerId)
    );

    const payload = {
      ...form,

      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),

      // Existing table compatibility
      name: `${form.firstname.trim()} ${form.lastname.trim()}`,
      email: form.email,
      empId: form.empId.trim(),

      role: selectedDesignation?.name || "",
      team: selectedTeam?.teamName || "",
      project: selectedProject?.name || "",
      manager: selectedManager?.name || "",

      // Backend references
      userId: form.userId,
      teamId: form.teamId,
      designationId: form.designationId,
      projectId: selectedProject ? form.projectId : null,
      reportingManagerId: form.reportingManagerId || null,

      permissions,

boardAccess: boardAccess.filter((id) =>
  boards.some(
    (board) => String(getId(board)) === String(id)
  )
),
    };

    setBusy(true);
    setError("");

    try {
      const result = await onSave(payload);

      if (result === false || result?.ok === false) {
        throw new Error(
          result?.error || "Unable to save employee."
        );
      }
    } catch (err) {
      setError(err.message || "Unable to save employee.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="team-overlay"
      onMouseDown={() => !busy && onClose()}
    >
      <form
        className="team-dialog employee-wizard"
        onMouseDown={(ev) => ev.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-modal-title"
        noValidate
      >
        {/* HEADER */}

        <header className="employee-wizard-header">
          <div className="employee-header-icon">
            <UserRoundPlus size={24} />
          </div>

          <div>
            <h2 id="employee-modal-title">
              {employee ? "Edit employee" : "Add employee"}
            </h2>

            <p>
              Manage employee information and feature access.
            </p>
          </div>

          <button
            type="button"
            className="team-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        {/* STEPS */}

        <div className="employee-steps">
          {STEPS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                disabled={busy || item.id > step}
                onClick={() => {
                  setError("");
                  setStep(item.id);
                }}
                className={`employee-step ${
                  step === item.id ? "active" : ""
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="employee-wizard-body">

          {/* STEP 1: EMPLOYEE DETAILS */}

          {step === 1 && (
            <>
              <section className="employee-section">
                <h3>Personal information</h3>

                <div className="team-form-grid">

                  <label className="employee-full-width">
                    Link existing user account

                    <select
                      value={form.userId}
                      onChange={(ev) =>
                        selectAccount(ev.target.value)
                      }
                      disabled={!!employee}
                    >
                      <option value="">
                        Select registered account
                      </option>

                      {accounts.map((account) => (
                        <option
                          key={getId(account)}
                          value={getId(account)}
                        >
                          {account.emailaddress || account.email}
                        </option>
                      ))}
                    </select>

                    <small>
                      Create login accounts in Settings first.
                    </small>
                  </label>

                  <label>
                    First name
                    <input
                      value={form.firstname}
                      onChange={(ev) =>
                        set("firstname", ev.target.value)
                      }
                      placeholder="First name"
                    />
                  </label>

                  <label>
                    Last name
                    <input
                      value={form.lastname}
                      onChange={(ev) =>
                        set("lastname", ev.target.value)
                      }
                      placeholder="Last name"
                    />
                  </label>

                  <label>
                    Employee ID
                    <input
                      value={form.empId}
                      onChange={(ev) =>
                        set("empId", ev.target.value)
                      }
                      placeholder="EMP001"
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      type="tel"
                      value={form.phonenumber}
                      onChange={(ev) =>
                        set("phonenumber", ev.target.value)
                      }
                      placeholder="Phone number"
                    />
                  </label>

                  <label className="employee-full-width">
                    Email address
                    <input
                      value={form.email}
                      placeholder="Auto-filled from user account"
                      readOnly
                    />
                  </label>

                </div>
              </section>

              <section className="employee-section">
                <h3>Organisation details</h3>

                {fetchError && (
                  <p className="team-error">{fetchError}</p>
                )}

                <div className="team-form-grid">

                  <label>
                    Department / Team

                    <select
                      value={form.teamId}
                      disabled={loading || !!fetchError}
                      onChange={(ev) => {
                        setForm((prev) => ({
                          ...prev,
                          teamId: ev.target.value,
                          designationId: "",
                          projectId: "",
                        }));

                        setError("");
                      }}
                    >
                      <option value="">
                        {loading
                          ? "Loading teams..."
                          : "Select team"}
                      </option>

                      {teams.map((team) => (
                        <option
                          key={team._id}
                          value={team._id}
                        >
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Role / Designation

                    <select
                      value={form.designationId}
                      disabled={
                        !form.teamId ||
                        loading ||
                        !!fetchError
                      }
                      onChange={(ev) =>
                        set("designationId", ev.target.value)
                      }
                    >
                      <option value="">
                        Select designation
                      </option>

                      {availableDesignations.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Reporting manager

                    <select
                      value={form.reportingManagerId}
                      onChange={(ev) =>
                        set("reportingManagerId", ev.target.value)
                      }
                    >
                      <option value="">Select manager</option>

                      {availableManagers.map((person) => (
                        <option
                          key={getId(person)}
                          value={getId(person)}
                        >
                          {person.name ||
                            `${person.firstname || ""} ${person.lastname || ""}`}
                          {person.role ? ` — ${person.role}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Current project

                    <select
                      value={form.projectId}
                      onChange={(ev) =>
                        set("projectId", ev.target.value)
                      }
                    >
                      <option value="">No project</option>

                      {availableProjects.map((project) => (
                        <option
                          key={getId(project)}
                          value={getId(project)}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                </div>
              </section>
            </>
          )}

          {/* STEP 2: FEATURE ACCESS */}

          {/* STEP 2: FEATURE ACCESS */}

{step === 2 && (
  <section className="employee-section">
    <h3>Feature access</h3>

    <p className="employee-section-description">
      Enable the pages this employee is allowed to access.
    </p>

    <div className="employee-board-toolbar">
      <span>Available features</span>

      <strong>
        {Object.values(permissions).filter(Boolean).length}
        {" "}of {FEATURES.length} enabled
      </strong>
    </div>

    <div className="employee-toggle-list">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        const enabled = permissions[feature.key] === true;

        return (
          <div
            key={feature.key}
            className={`employee-toggle-card ${
              enabled ? "enabled" : ""
            }`}
          >
            <div className="employee-board-icon">
              <Icon size={21} />
            </div>

            <div className="employee-toggle-info">
              <strong>{feature.label}</strong>

              <span>{feature.description}</span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${feature.label} access`}
              disabled={busy}
              className={`employee-switch ${
                enabled ? "on" : ""
              }`}
              onClick={() =>
                togglePermission(feature.key)
              }
            >
              <span />
            </button>
          </div>
        );
      })}
    </div>

    <div className="employee-access-note">
      <ShieldCheck size={21} />

      <div>
        <strong>Permission-based access</strong>

        <p>
          Only enabled pages will appear in the
          employee's sidebar. Disabled pages will
          be restricted.
        </p>
      </div>
    </div>
  </section>
)}

          {/* STEP 3: BOARD ACCESS */}

{step === 3 && (
  <section className="employee-section">
    <h3>Board access</h3>

    <p className="employee-section-description">
      Choose which task boards this employee
      is allowed to access.
    </p>

    <div className="employee-board-toolbar">
      <span>
        {
          boards.filter((board) =>
            boardAccess.includes(String(getId(board)))
          ).length
        }
        {" "}of {boards.length} boards enabled
      </span>

      <div>
        <button
          type="button"
          disabled={busy}
          onClick={selectAllBoards}
        >
          Select all
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={clearAllBoards}
        >
          Clear
        </button>
      </div>
    </div>

    <div className="employee-toggle-list">
      {boards.map((board) => {
        const id = String(getId(board));
        const enabled = boardAccess.includes(id);

        return (
          <div
            key={id}
            className={`employee-toggle-card ${
              enabled ? "enabled" : ""
            }`}
          >
            <div className="employee-board-icon">
              <Kanban size={21} />
            </div>

            <div className="employee-toggle-info">
              <strong>{board.name}</strong>

              <span>
                {enabled
                  ? "Access enabled"
                  : "Access restricted"}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${board.name} access`}
              disabled={busy}
              className={`employee-switch ${
                enabled ? "on" : ""
              }`}
              onClick={() => toggleBoard(id)}
            >
              <span />
            </button>
          </div>
        );
      })}

      {boards.length === 0 && (
        <div className="employee-empty-boards">
          <Kanban size={32} />

          <strong>No task boards available</strong>

          <p>
            Create a board from the sidebar first.
            Created boards will automatically appear here.
          </p>
        </div>
      )}
    </div>

    <div className="employee-access-note">
      <ShieldCheck size={21} />

      <div>
        <strong>Board-based access</strong>

        <p>
          Employees can only access the individual
          boards assigned to them.
        </p>
      </div>
    </div>
  </section>
)}

          {error && (
            <p className="employee-wizard-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* FOOTER */}

        <footer className="employee-wizard-footer">
          <span>Step {step} of 3</span>

          <div className="employee-footer-actions">
            <button
              type="button"
              className="team-btn secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>

            {step > 1 && (
              <button
                type="button"
                className="team-btn secondary"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setStep((prev) => prev - 1);
                }}
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}

            <button
              type="submit"
              className="team-btn primary"
              disabled={
                busy ||
                !isAdmin ||
                loading ||
                !!fetchError
              }
            >
              {busy
                ? "Saving..."
                : step < 3
                ? "Continue"
                : employee
                ? "Save changes"
                : "Add employee"}

              {step < 3 && <ArrowRight size={15} />}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}