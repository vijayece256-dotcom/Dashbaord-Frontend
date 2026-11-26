
import { useEffect, useMemo, useState } from "react";

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
  Bell,
  Megaphone,
} from "lucide-react";
import { API_BASE_URL } from "../../config/env.js";
import { useAuth } from "../../context/AuthContext.jsx";

import "./EmployeeFormModal.css";

const STEPS = [
  { id: 1, label: "Employee details", icon: UserRound },
  { id: 2, label: "Feature access", icon: ShieldCheck },
  { id: 3, label: "Board access", icon: Kanban },
];

// Icons are only for presentation. Feature names and codes
// always come from the backend.
const FEATURE_ICONS = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  projects: FolderKanban,
  team: Users,
  analytics: ChartNoAxesCombined,
  notifications: Bell,
  announcements: Megaphone,
  annoucements: Megaphone,
};

const getId = (item) => item?._id ?? item?.id ?? "";

const getRefId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value ?? "");
};

const getFeatureCode = (item) => {
  if (item && typeof item === "object") {
    return String(item.featureCode ?? item.code ?? "");
  }

  return String(item ?? "");
};

const getFeatureName = (feature) =>
  feature?.featureName ?? feature?.name ?? "Unnamed feature";

const getFeatureIcon = (feature) => {
  const normalizedName = getFeatureName(feature)
    .trim()
    .toLowerCase();

  return FEATURE_ICONS[normalizedName] || ShieldCheck;
};

const getFirstName = (account) =>
  account?.firstname ?? account?.firstName ?? "";

const getLastName = (account) =>
  account?.lastname ?? account?.lastName ?? "";

const getEmail = (account) =>
  account?.emailaddress ?? account?.email ?? "";

const getDesignationTeam = (designation) => {
  const team = designation?.team ?? designation?.teamDetails;

  return team && typeof team === "object" ? team : null;
};

const getDesignationTeamId = (designation) => {
  const team = designation?.team ?? designation?.teamDetails;

  const id =
    (typeof team === "object" ? team?._id ?? team?.id : team) ??
    designation?.teamId?._id ??
    designation?.teamId ??
    "";

  return String(id ?? "");
};

const getDesignationLabel = (designation) =>
  designation?.designationName ??
  designation?.name ??
  designation?.title ??
  "Unnamed designation";

// ---------------------------------------
// INITIAL EMPLOYEE FORM
// ---------------------------------------

const getInitialForm = (employee) => ({
  ...(employee || {}),

  userId: getRefId(employee?.userId),

  firstname:
    employee?.firstname ?? employee?.firstName ?? "",

  lastname:
    employee?.lastname ?? employee?.lastName ?? "",

  empId:
    employee?.empId ??
    employee?.employeeCode ??
    employee?.employee_code ??
    "",

  email:
    employee?.email ?? employee?.emailaddress ?? "",

  phonenumber:
    employee?.phonenumber ?? employee?.phone ?? "",

  teamId:
    getRefId(employee?.teamId) ||
    getRefId(employee?.designation?.team),

  designationId:
    getRefId(employee?.designationId) ||
    getRefId(employee?.designation),

  projectId: getRefId(employee?.projectId),

  reportingManagerId:
    getRefId(employee?.reportingManagerId) ||
    getRefId(employee?.manager_id),

  status:
    employee?.isActive === false ||
    employee?.status === "inactive"
      ? "inactive"
      : "active",

  isReportingManager:
    employee?.isReportingManager === true,
});

// ---------------------------------------
// INITIAL PERMISSIONS
// ---------------------------------------

const getInitialPermissions = (employee, features) => {
  const existingPermissions = employee?.permissions || {};

  const existingFeatures = Array.isArray(employee?.featureAccess)
    ? employee.featureAccess.map(getFeatureCode)
    : [];

  return Object.fromEntries(
    features.map((feature) => {
      const code = getFeatureCode(feature);

      const existing = existingPermissions[code];

      let enabled = false;

      if (typeof existing === "boolean") {
        enabled = existing;
      } else if (typeof existing?.view === "boolean") {
        enabled = existing.view;
      } else {
        enabled = existingFeatures.includes(code);
      }

      return [code, enabled];
    })
  );
};

const getOriginalFeatureCodes = (employee) =>
  Array.isArray(employee?.featureAccess)
    ? employee.featureAccess.map(getFeatureCode).filter(Boolean)
    : [];

const samePermissions = (a, b, features) =>
  features.every(({ featureCode }) =>
    Boolean(a?.[featureCode]) === Boolean(b?.[featureCode])
  );

// ---------------------------------------
// COMPONENT
// ---------------------------------------

export default function EmployeeFormModal({
  employee,
  employees = [],
  accounts = [],
  accountsLoading = false,
  accountsError = "",
  features = [],
  featuresLoading = false,
  featuresError = "",
  boards = [],
  projects = [],
  onSave,
  onClose,
}) {
  const { isAdmin,token } = useAuth();

  const [step, setStep] = useState(1);

  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ---------------------------------------
  // FORM STATE
  // ---------------------------------------

  const [form, setForm] = useState(() =>
    getInitialForm(employee)
  );

  // ---------------------------------------
  // FEATURE PERMISSIONS
  // ---------------------------------------

  const [permissions, setPermissions] = useState(() =>
    getInitialPermissions(employee, features)
  );

  const [boardAccess, setBoardAccess] = useState(() =>
    (employee?.boardAccess || []).map(getRefId).filter(Boolean)
  );

  // Synchronize employee and API features.
  useEffect(() => {
    setForm(getInitialForm(employee));

    setPermissions(
      getInitialPermissions(employee, features)
    );

    setBoardAccess(
      (employee?.boardAccess || [])
        .map(getRefId)
        .filter(Boolean)
    );

    setStep(1);
    setError("");
  }, [employee, features]);

  // ---------------------------------------
  // FETCH DESIGNATIONS
  // ---------------------------------------

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setFetchError("Administrator access is required.");
      return;
    }

    const controller = new AbortController();

    const fetchDesignations = async () => {
      setLoading(true);
      setFetchError("");

      try {
        // const token = localStorage.getItem("token");

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

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : result?.data ?? result?.designations ?? [];

        if (!Array.isArray(data)) {
          throw new Error("Invalid designation response.");
        }

        if (!controller.signal.aborted) {
          setDesignations(
            data.filter((designation) => {
              const active = designation.isActive !== false;
              const team = getDesignationTeam(designation);

              return active && (!team || team.isActive !== false);
            })
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
  }, [isAdmin]);

  // ---------------------------------------
  // FORM HANDLERS
  // ---------------------------------------

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
  };

  // ---------------------------------------
  // SELECT EXISTING ACCOUNT
  // ---------------------------------------

  const selectAccount = (id) => {
    const account = accounts.find(
      (item) => String(getId(item)) === String(id)
    );

    if (!account) {
      setForm((prev) => ({
        ...prev,
        userId: "",
        firstname: "",
        lastname: "",
        email: "",
      }));

      setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      userId: id,
      firstname: getFirstName(account),
      lastname: getLastName(account),
      email: getEmail(account),
    }));

    setError("");
  };

  // ---------------------------------------
  // TEAMS AND DESIGNATIONS
  // ---------------------------------------

  const teams = useMemo(() => {
    const teamMap = new Map();

    designations.forEach((designation) => {
      const teamId = getDesignationTeamId(designation);

      if (!teamId) return;

      const team = getDesignationTeam(designation);

      teamMap.set(teamId, {
        ...team,
        _id: teamId,
        teamName:
          team?.teamName ??
          team?.name ??
          designation.teamName ??
          "Unnamed team",
      });
    });

    return Array.from(teamMap.values());
  }, [designations]);

  const availableDesignations = useMemo(
    () =>
      designations.filter(
        (designation) =>
          getDesignationTeamId(designation) === String(form.teamId)
      ),
    [designations, form.teamId]
  );

  const availableProjects = useMemo(
    () =>
      projects.filter((project) => {
        const projectTeamId =
          getRefId(project.teamId) ||
          getRefId(project.team);

        return (
          !projectTeamId ||
          projectTeamId === String(form.teamId)
        );
      }),
    [projects, form.teamId]
  );

  const availableManagers = useMemo(
    () =>
      employees.filter(
        (person) =>
          String(getId(person)) !== String(getId(employee)) &&
          person.status !== "inactive" &&
          person.isActive !== false &&
          (person.isReportingManager === true ||
            String(getId(person)) ===
              String(form.reportingManagerId))
      ),
    [employees, employee, form.reportingManagerId]
  );

  // ---------------------------------------
  // FEATURE PERMISSIONS
  // ---------------------------------------

  const togglePermission = (featureCode) => {
    setPermissions((prev) => ({
      ...prev,
      [featureCode]: !prev[featureCode],
    }));

    setError("");
  };

  // ---------------------------------------
  // BOARD ACCESS
  // ---------------------------------------

  const toggleBoard = (id) => {
    const boardId = String(id);

    setBoardAccess((prev) =>
      prev.includes(boardId)
        ? prev.filter((item) => item !== boardId)
        : [...prev, boardId]
    );
  };

  const selectAllBoards = () => {
    setBoardAccess(
      boards.map((board) => String(getId(board))).filter(Boolean)
    );
  };

  const clearAllBoards = () => {
    setBoardAccess([]);
  };

  // ---------------------------------------
  // VALIDATION
  // ---------------------------------------

  const validateDetails = () => {
    if (!employee && !form.userId) {
      return "Select an existing user account.";
    }

    if (!form.firstname.trim()) {
      return "First name is required.";
    }

    if (!form.lastname.trim()) {
      return "Last name is required.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
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

    const designationExists = availableDesignations.some(
      (designation) =>
        String(getId(designation)) === String(form.designationId)
    );

    if (!designationExists) {
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
  // SAVE EMPLOYEE
  // ---------------------------------------

  const submit = async (ev) => {
    ev.preventDefault();

    if (busy || !isAdmin) return;

    if (step !== 3) {
      next();
      return;
    }

    const validationError = validateDetails();

    if (validationError) {
      setError(validationError);
      setStep(1);
      return;
    }

    if (featuresLoading) {
      setError("Please wait until features finish loading.");
      setStep(2);
      return;
    }

    if (featuresError) {
      setError(featuresError);
      setStep(2);
      return;
    }

    const selectedTeam = teams.find(
      (team) => String(getId(team)) === String(form.teamId)
    );

    const selectedDesignation = designations.find(
      (designation) =>
        String(getId(designation)) === String(form.designationId)
    );

    const selectedProject = availableProjects.find(
      (project) =>
        String(getId(project)) === String(form.projectId)
    );

    const selectedManager = employees.find(
      (person) =>
        String(getId(person)) === String(form.reportingManagerId)
    );

    const firstName = form.firstname.trim();
    const lastName = form.lastname.trim();
    const email = form.email.trim().toLowerCase();
    const employeeCode = form.empId.trim();

    // ---------------------------------------
    // FEATURE ACCESS
    // ---------------------------------------

    const originalPermissions = getInitialPermissions(
      employee,
      features
    );

    const featurePermissionsChanged = !samePermissions(
      permissions,
      originalPermissions,
      features
    );

    const originalFeatureCodes = getOriginalFeatureCodes(employee);

    let featureAccess;

    if (!featurePermissionsChanged) {
      // Preserve existing backend codes when unchanged.
      featureAccess = originalFeatureCodes;
    } else {
      // Send featureCode, NEVER featureName.
      featureAccess = features
        .filter(
          (feature) =>
            permissions[getFeatureCode(feature)] === true
        )
        .map(getFeatureCode)
        .filter(Boolean);
    }

    // ---------------------------------------
    // BOARD ACCESS
    // ---------------------------------------

    const validBoardAccess = boardAccess.filter((id) =>
      boards.some(
        (board) => String(getId(board)) === String(id)
      )
    );

    // ---------------------------------------
    // FINAL API PAYLOAD
    // ---------------------------------------

    const payload = {
      ...form,

      ...(employee
        ? {
            _id: getId(employee),
            id: getId(employee),
          }
        : {}),

      firstname: firstName,
      lastname: lastName,

      name: `${firstName} ${lastName}`,

      employee_code: employeeCode,

      emailaddress: email,

      phonenumber: form.phonenumber,

      userId: form.userId || undefined,

      teamId: form.teamId,
      designationId: form.designationId,

      projectId: selectedProject ? form.projectId : null,

      reportingManagerId: form.reportingManagerId || null,
      manager_id: form.reportingManagerId || null,

      role: selectedDesignation
        ? getDesignationLabel(selectedDesignation)
        : "",

      team: selectedTeam?.teamName ?? "",

      project: selectedProject?.name ?? "",

      manager: selectedManager?.name ?? "",

      isActive: form.status !== "inactive",

      status: form.status,

      isAccount: true,
      isEmployee: true,

      isReportingManager: !!form.isReportingManager,

      userType: "employee",

      // Actual API feature codes.
      featureAccess,

      boardAccess: validBoardAccess,
    };

    console.log("Employee payload:", payload);

    setBusy(true);
    setError("");

    try {
      const result = await onSave(payload);

      if (result === false || result?.ok !== true) {
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

  // ---------------------------------------
  // UI
  // ---------------------------------------

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
                  if (item.id === 1 || step === 1) {
                    const message = validateDetails();

                    if (message && item.id > 1) {
                      setError(message);
                      return;
                    }
                  }

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
                      value={form.userId || ""}
                      onChange={(ev) =>
                        selectAccount(ev.target.value)
                      }
                      disabled={!!employee || busy || accountsLoading}
                    >
                      <option value="">
                        {accountsLoading
                          ? "Loading accounts..."
                          : "Select registered account"}
                      </option>

                      {accounts.map((account) => (
                        <option
                          key={getId(account)}
                          value={getId(account)}
                        >
                          {getEmail(account)}
                        </option>
                      ))}
                    </select>

                    {accountsError && (
                      <small className="team-error">
                        {accountsError}
                      </small>
                    )}

                    <small>
                      Create login accounts in Settings first.
                      Select an account to autofill its details.
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
                      disabled={busy}
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
                      disabled={busy}
                    />
                  </label>

                  <label>
                    Employee ID

                    <input
                      value={form.empId}
                      onChange={(ev) =>
                        set("empId", ev.target.value)
                      }
                      placeholder="BAL001"
                      disabled={busy}
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
                      disabled={busy}
                    />
                  </label>

                  <label className="employee-full-width">
                    Email address

                    <input
                      value={form.email}
                      placeholder="Email address"
                      readOnly
                    />
                  </label>

                  <label>
                    Account status

                    <select
                      value={form.status}
                      onChange={(ev) =>
                        set("status", ev.target.value)
                      }
                      disabled={busy}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                      disabled={loading || !!fetchError || busy}
                      onChange={(ev) => {
                        const teamId = ev.target.value;

                        const currentDesignation =
                          designations.find(
                            (d) =>
                              String(getId(d)) ===
                              String(form.designationId)
                          );

                        const designationStillValid =
                          currentDesignation &&
                          getDesignationTeamId(
                            currentDesignation
                          ) === String(teamId);

                        setForm((prev) => ({
                          ...prev,
                          teamId,
                          designationId: designationStillValid
                            ? prev.designationId
                            : "",
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
                          key={getId(team)}
                          value={getId(team)}
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
                        !!fetchError ||
                        busy
                      }
                      onChange={(ev) =>
                        set("designationId", ev.target.value)
                      }
                    >
                      <option value="">
                        {!form.teamId
                          ? "Select team first"
                          : availableDesignations.length === 0
                          ? "No designations for this team"
                          : "Select role / designation"}
                      </option>

                      {availableDesignations.map((designation) => (
                        <option
                          key={getId(designation)}
                          value={getId(designation)}
                        >
                          {getDesignationLabel(designation)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Reporting manager

                    <select
                      value={form.reportingManagerId}
                      disabled={busy}
                      onChange={(ev) =>
                        set("reportingManagerId", ev.target.value)
                      }
                    >
                      <option value="">
                        {availableManagers.length === 0
                          ? "No reporting managers available"
                          : "Select manager"}
                      </option>

                      {availableManagers.map((person) => (
                        <option
                          key={getId(person)}
                          value={getId(person)}
                        >
                          {person.name ||
                            `${person.firstname || person.firstName || ""} ${
                              person.lastname || person.lastName || ""
                            }`.trim()}

                          {person.role ? ` — ${person.role}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Current project

                    <select
                      value={form.projectId}
                      disabled={busy}
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

                <label className="employee-checkbox">
                  <input
                    type="checkbox"
                    checked={!!form.isReportingManager}
                    disabled={busy}
                    onChange={(ev) =>
                      set("isReportingManager", ev.target.checked)
                    }
                  />

                  <span>Reporting manager</span>

                  <small>
                    Tick this if the employee can be selected as a
                    reporting manager for others.
                  </small>
                </label>
              </section>
            </>
          )}

          {/* STEP 2: FEATURE ACCESS */}

          {step === 2 && (
            <section className="employee-section">
              <h3>Feature access</h3>

              <p className="employee-section-description">
                Enable the pages this employee is allowed to access.
              </p>

              {featuresLoading && (
                <p>Loading available features...</p>
              )}

              {featuresError && (
                <p className="team-error" role="alert">
                  {featuresError}
                </p>
              )}

              {!featuresLoading &&
                !featuresError &&
                features.length === 0 && (
                  <p>No features returned from the API.</p>
                )}

              {!featuresLoading &&
                !featuresError &&
                features.length > 0 && (
                  <>
                    <div className="employee-board-toolbar">
                      <span>Available features</span>

                      <strong>
                        {
                          features.filter(
                            (feature) =>
                              permissions[getFeatureCode(feature)]
                          ).length
                        }{" "}
                        of {features.length} enabled
                      </strong>
                    </div>

                    <div className="employee-toggle-list">
                      {features.map((feature) => {
                        const code = getFeatureCode(feature);
                        const Icon = getFeatureIcon(feature);
                        const enabled = permissions[code] === true;

                        return (
                          <div
                            key={code}
                            className={`employee-toggle-card ${
                              enabled ? "enabled" : ""
                            }`}
                          >
                            <div className="employee-board-icon">
                              <Icon size={21} />
                            </div>

                            <div className="employee-toggle-info">
                              <strong>
                                {getFeatureName(feature)}
                              </strong>

                              <span>
                                {code}
                              </span>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={`${getFeatureName(feature)} access`}
                              disabled={busy}
                              className={`employee-switch ${
                                enabled ? "on" : ""
                              }`}
                              onClick={() =>
                                togglePermission(code)
                              }
                            >
                              <span />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              <div className="employee-access-note">
                <ShieldCheck size={21} />

                <div>
                  <strong>Permission-based access</strong>

                  <p>
                    Only enabled pages should appear in the employee's
                    sidebar. Disabled pages should be restricted.
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
                Choose which task boards this employee is allowed to access.
              </p>

              <div className="employee-board-toolbar">
                <span>
                  {
                    boards.filter((board) =>
                      boardAccess.includes(String(getId(board)))
                    ).length
                  }{" "}
                  of {boards.length} boards enabled
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
                    Employees can only access the individual boards
                    assigned to them.
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
                !!fetchError ||
                (step === 2 && featuresLoading)
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
