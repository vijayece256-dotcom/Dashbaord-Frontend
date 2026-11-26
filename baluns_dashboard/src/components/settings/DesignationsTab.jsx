
import { useEffect, useState, useRef } from "react";
import { Plus, Users, Briefcase, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/env.js";
import "./DesignationsTab.css";

export default function DesignationsTab() {
  const { token } = useAuth();

  const [teams, setTeams] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [mode, setMode] = useState("existing");
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deletingTeamId, setDeletingTeamId] = useState("");

  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [teamDeleteConfirmation, setTeamDeleteConfirmation] = useState(null);

  const initialLoadToken = useRef(null);

  // API request helper
  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const text = await response.text();

    let data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        `API returned an invalid response (${response.status})`
      );
    }

    if (!response.ok) {
      const validationErrors = data?.errors
        ? Object.values(data.errors).join(", ")
        : "";

      throw new Error(
        validationErrors ||
        data?.message ||
        data?.error ||
        `Request failed (${response.status})`
      );
    }

    return data;
  };

  // Handle array responses
 // Handle different API response structures
const getArray = (response, key) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.[key])) return response[key];

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  // Employee list is optional for loading the teams/designations screen.
  return [];
};
  // Load teams, designations and employees
  // Load teams, designations and employees
// Load teams, designations and employees
const loadData = async () => {
  setLoading(true);
  setFetchError("");

  try {
    const [teamDesignationData, employeeData] = await Promise.all([
      request("/v1/team-designation/?isAnalytics=true"),
      request("/v1/employee"),
    ]);

    // New team-designation API response
    const teamList = Array.isArray(teamDesignationData?.teams)
      ? teamDesignationData.teams
      : [];

    const designationList = Array.isArray(
      teamDesignationData?.designations
    )
      ? teamDesignationData.designations
      : [];

    // Employee API response
    const employeeList = getArray(employeeData, "employees");

    setTeams(teamList);
    setDesignations(designationList);
    setEmployees(employeeList);
  } catch (err) {
    setFetchError(err.message);
  } finally {
    setLoading(false);
  }
};
  // Initial API loading
  useEffect(() => {
    if (!token) {
      initialLoadToken.current = null;
      setLoading(false);
      return;
    }

    if (initialLoadToken.current === token) return;

    initialLoadToken.current = token;
    loadData();
  }, [token]);

 

  // Get designations belonging to a team
  // Get designations belonging to a team
const getDesignations = (id) =>
  designations.filter(
    (designation) =>
      designation.teamId === id ||
      designation.team?._id === id ||
      designation.team === id
  );
  // Create designation or team + designation
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      busy ||
      loading ||
      fetchError ||
      !token ||
      deletingId ||
      deletingTeamId
    ) return;

    setError("");
    setSuccess("");

    const trimmedTeamName = teamName.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a designation name.");
      return;
    }

    if (mode === "existing" && !teamId) {
      setError("Please select a team.");
      return;
    }

    if (mode === "new" && !trimmedTeamName) {
      setError("Please enter a team name.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "existing") {
        await request(
          `/v1/team/${encodeURIComponent(teamId)}/designation`,
          {
            method: "POST",
            body: JSON.stringify({
              name: trimmedName,
              isActive: true,
            }),
          }
        );

        setSuccess("Designation created successfully.");
      } else {
        const response = await request("/v1/team-designation/?isAnalytics=true", {
          method: "POST",
          body: JSON.stringify({
            teamName: trimmedTeamName,
            designationName: trimmedName,
          }),
        });

        const createdTeam = response?.data?.team || response?.team;

        if (createdTeam?._id) {
          setTeamId(createdTeam._id);
        }

        setSuccess("Team and designation created successfully.");
      }

      setName("");
      setTeamName("");

      if (mode === "new") {
        setMode("existing");
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Delete individual designation
  const handleDeleteDesignation = async (
    deleteTeamId,
    designationId,
    designationName
  ) => {
    if (!token || deletingId || deletingTeamId || busy) return;

    setError("");
    setSuccess("");
    setDeletingId(designationId);

    try {
      await request(
        `/v1/team/${encodeURIComponent(deleteTeamId)}/designation/${encodeURIComponent(designationId)}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(`Designation "${designationName}" deleted successfully.`);
      setDeleteConfirmation(null);

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  };

  // Delete entire team
  const handleDeleteTeam = async (deleteTeamId, deleteTeamName) => {
    if (!token || deletingTeamId || deletingId || busy) return;

    setError("");
    setSuccess("");
    setDeletingTeamId(deleteTeamId);

    try {
      await request(
        `/v1/team/${encodeURIComponent(deleteTeamId)}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(`Team "${deleteTeamName}" deleted successfully.`);
      setTeamDeleteConfirmation(null);

      if (teamId === deleteTeamId) {
        setTeamId("");
      }

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingTeamId("");
    }
  };

  return (
    <section className="td-page">

      {/* Heading */}
      <div className="td-heading">
        <h2>Teams & Designations</h2>
        <p>Create teams and manage their designations.</p>
      </div>

      {/* Statistics */}
      <div className="td-stats">
        <div className="td-stat">
          <div className="td-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total teams</span>
            <h3>{teams.length}</h3>
          </div>
        </div>

        <div className="td-stat">
          <div className="td-icon">
            <Briefcase size={22} />
          </div>

          <div>
            <span>Total designations</span>
            <h3>{designations.length}</h3>
          </div>
        </div>
      </div>

      {/* Add designation */}
      <form className="td-card" onSubmit={handleSubmit}>
        <h3>Add designation</h3>

        <div className="td-mode">
          <button
            type="button"
            className={mode === "existing" ? "selected" : ""}
            onClick={() => {
              setMode("existing");
              setError("");
              setSuccess("");
            }}
          >
            Existing team
          </button>

          <button
            type="button"
            className={mode === "new" ? "selected" : ""}
            onClick={() => {
              setMode("new");
              setError("");
              setSuccess("");
            }}
          >
            <Plus size={15} />
            New team
          </button>
        </div>

        <div className="td-fields">
          <div className="td-field">
            <label htmlFor="td-team">
              {mode === "existing" ? "Select team" : "Team name"}
            </label>

            {mode === "existing" ? (
              <select
                id="td-team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                <option value="">Select a team</option>

                {teams
  .filter((team) => team.isActive !== false)
  .map((team) => (
    <option key={team._id} value={team._id}>
      {team.teamName || team.name}
    </option>
  ))}
              </select>
            ) : (
              <input
                id="td-team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                required
              />
            )}
          </div>

          <div className="td-field">
            <label htmlFor="td-designation">Designation name</label>

            <input
              id="td-designation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Developer"
              required
            />
          </div>
        </div>

        {error && <div className="td-error">{error}</div>}
        {success && <div className="td-success">{success}</div>}

        <div className="td-actions">
          <button
            type="submit"
            className="td-primary"
            disabled={
              busy ||
              loading ||
              !!fetchError ||
              !!deletingId ||
              !!deletingTeamId ||
              !token
            }
          >
            <Plus size={17} />
            {busy ? "Creating..." : "Add designation"}
          </button>
        </div>
      </form>

      {/* Manage teams */}
      <div className="td-list-heading">
        <h3>Manage teams</h3>
        <span>{teams.length} teams</span>
      </div>

      {loading ? (
        <div className="td-empty">Loading teams...</div>
      ) : fetchError ? (
        <div className="td-error">
          {fetchError}
          <button type="button" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="td-empty">No teams created yet.</div>
      ) : (
        teams.map((team) => {
          const roles = getDesignations(team._id);
          console.log("Designations for team:", team.teamName || team.name, roles);
          return (
            <div className="td-team-card" key={team._id}>

              {/* Team header */}
              <div className="td-team-header">
                <div className="td-icon">
                  <Users size={20} />
                </div>

                <div className="td-team-info">
                <h3>{team.teamName || team.name}</h3>
                  <span>{roles.length} designations</span>
                </div>

                <span
                  className={`td-status ${
                    team.isActive === false ? "inactive" : "active"
                  }`}
                >
                  {team.isActive === false ? "Inactive" : "Active"}
                </span>

                {/* Delete team */}
                <button
                  type="button"
                  className="td-delete-btn"
                  disabled={
                    !!deletingTeamId ||
                    !!deletingId ||
                    busy
                  }
                  onClick={() =>
                    setTeamDeleteConfirmation({
                      teamId: team._id,
                      teamName: team.teamName,
                    })
                  }
                >
                  <Trash2 size={15} />
                  {deletingTeamId === team._id
                    ? "Deleting..."
                    : "Delete team"}
                </button>
              </div>

              {/* Designations */}
              {roles.length === 0 ? (
                <div className="td-empty">
                  No designations in this team.
                </div>
              ) : (
                <div className="td-table-wrap">
                  <table className="td-table">
                    <thead>
                      <tr>
                        <th>Designation</th>
                        <th>Employees</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {roles.map((role) => (
                        <tr key={role._id}>
                          <td>{role.name}</td>

                          <td>{role.totalEmployeeCount}</td>

                          <td>
                            <span
                              className={`td-status ${
                                role.isActive ? "active" : "inactive"
                              }`}
                            >
                              {role.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="td-delete-btn"
                              disabled={
                                !!deletingId ||
                                !!deletingTeamId ||
                                busy
                              }
                              onClick={() =>
                                setDeleteConfirmation({
                                  teamId:
                                    role.team?._id ||
                                    role.teamId ||
                                    team._id,
                                  designationId: role._id,
                                  designationName: role.name,
                                })
                              }
                            >
                              <Trash2 size={15} />
                              {deletingId === role._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Delete designation confirmation */}
      {deleteConfirmation && (
        <div className="td-modal-overlay">
          <div
            className="td-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="td-delete-title"
          >
            <div className="td-delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h3 id="td-delete-title">Delete designation?</h3>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteConfirmation.designationName}</strong>?
              This action cannot be undone.
            </p>

            <div className="td-delete-modal-actions">
              <button
                type="button"
                className="td-modal-cancel"
                disabled={!!deletingId}
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="td-modal-delete"
                disabled={!!deletingId}
                onClick={() =>
                  handleDeleteDesignation(
                    deleteConfirmation.teamId,
                    deleteConfirmation.designationId,
                    deleteConfirmation.designationName
                  )
                }
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete team confirmation */}
      {teamDeleteConfirmation && (
        <div className="td-modal-overlay">
          <div
            className="td-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="td-team-delete-title"
          >
            <div className="td-delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h3 id="td-team-delete-title">Delete entire team?</h3>

            <p>
              Are you sure you want to delete the team{" "}
              <strong>{teamDeleteConfirmation.teamName}</strong>?
              <br />
              <br />
              This action cannot be undone. Please check whether
              employees or designations are assigned to this team.
            </p>

            <div className="td-delete-modal-actions">
              <button
                type="button"
                className="td-modal-cancel"
                disabled={!!deletingTeamId}
                onClick={() => setTeamDeleteConfirmation(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="td-modal-delete"
                disabled={!!deletingTeamId}
                onClick={() =>
                  handleDeleteTeam(
                    teamDeleteConfirmation.teamId,
                    teamDeleteConfirmation.teamName
                  )
                }
              >
                {deletingTeamId ? "Deleting..." : "Delete team"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
