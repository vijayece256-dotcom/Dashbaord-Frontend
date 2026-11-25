import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/env.js";
import { Plus, KeyRound, UserX, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES, DEFAULT_TITLE, titleOf } from "../../data/roles.js";
import { formatDate } from "../../utils/format.js";
import Card from "../common/Card.jsx";
import Button from "../common/Button.jsx";
import Avatar from "../common/Avatar.jsx";
import DataTable from "../common/DataTable.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import AddUserModal from "./AddUserModal.jsx";
import CredentialsModal from "./CredentialsModal.jsx";

export default function UsersTab() {
  const {
    user,
    token,
    isAdmin,
    designations = [],
    createUser,
    resetPassword,
    setUserDesignation,
    setUserActive,
  } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [notice, setNotice] = useState("");

  const showError = (result) => setNotice(result.ok ? "" : result.error);
  useEffect(() => {
    if (!isAdmin || !token) {
      setUsers([]);
      setLoading(false);
      return;
    }
  
    const controller = new AbortController();
  
    const fetchUsers = async () => {
      setLoading(true);
      setNotice("");
  
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/employee`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );
  
        if (!response.ok) {
          throw new Error(
            `Failed to fetch employees (${response.status})`
          );
        }
  
        const data = await response.json();
  
        if (!Array.isArray(data)) {
          throw new Error("Invalid employee response.");
        }
  
        const formattedUsers = data.map((employee) => ({
          id: employee._id,
          name:
            `${employee.firstname ?? ""} ${employee.lastname ?? ""}`.trim()
            || employee.username,
          username: employee.username,
          email: employee.emailaddress,
          phone: employee.phonenumber,
          active: employee.isActive,
          mustChangePassword:
            employee.isPermanentPassword === false,
          designation:
            employee.designation?.designationName ?? "",
          designationId:
            employee.designation?._id ?? "",
          team: employee.team?.teamName ?? "",
          teamId: employee.team?._id ?? "",
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          role: employee.userType ?? employee.role,
        }));
  
        setUsers(formattedUsers);
      } catch (error) {
        if (error.name !== "AbortError") {
          setNotice(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
  
    fetchUsers();
  
    return () => controller.abort();
  }, [token, isAdmin]);
  const handleCreate = async (data) => {
    if (typeof createUser !== "function") {
      return {
        ok: false,
        error: "Create account API is not connected.",
      };
    }
  
    try {
      const result = await createUser(data);
  
      if (result.ok) {
        setShowAdd(false);
        setNotice("");
  
        if (result.tempPassword) {
          setCredentials({
            title: "Account created successfully",
            name: data.email,
            email: data.email,
            password: result.tempPassword,
          });
        }
  
        // Refresh the user accounts list here.
      }
  
      return result;
    } catch (error) {
      return {
        ok: false,
        error: error.message || "Unable to create account.",
      };
    }
  };

  const handleReset = async (person) => {
    if (!window.confirm(`Reset the password for ${person.name}?`)) return;
    const result = await resetPassword(person.id);
    if (result.ok) {
      setNotice("");
      setCredentials({
        title: "Password reset",
        name: person.name,
        email: person.email,
        password: result.tempPassword,
      });
    } else {
      showError(result);
    }
  };

  const handleToggle = (person) => {
    const deactivating = person.active !== false;
    if (deactivating && !window.confirm(`Deactivate ${person.name}? They will lose access.`)) return;
    showError(setUserActive(person.id, !deactivating));
  };

  const columns = [
    {
      key: "name",
      header: "User",
      render: (p) => (
        <div className="user-cell">
          <Avatar name={p.name} size="md" />
          <div>
            <strong>{p.name}</strong>
            <span>{p.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "designation",
      header: "Designation",
      render: (p) =>
        p.role === ROLES.ADMIN ? (
          <strong>{titleOf(p)}</strong>
        ) : (
          <select
            className="designation-select"
            value={p.designation || ""}
            aria-label={`Designation for ${p.name}`}
            onChange={(e) => showError(setUserDesignation(p.id, e.target.value))}
          >
            <option value="">{DEFAULT_TITLE}</option>
            {designations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        if (p.active === false) return <StatusBadge tone="neutral">Deactivated</StatusBadge>;
        if (p.mustChangePassword) return <StatusBadge tone="outline">Invited</StatusBadge>;
        return <StatusBadge tone="primary">Active</StatusBadge>;
      },
    },
    { key: "createdAt", header: "Added", render: (p) => formatDate(p.createdAt) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) =>
        p.id === user.id ? (
          <span className="you-label">You</span>
        ) : (
          <div className="row-actions">
            <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => handleReset(p)}>
              Reset password
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={p.active === false ? UserCheck : UserX}
              onClick={() => handleToggle(p)}
            >
              {p.active === false ? "Activate" : "Deactivate"}
            </Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <Card
        title={`Users (${users.length})`}
        action={<Button icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Create account</Button>}
      >
        {notice && <p className="settings-notice" role="alert">{notice}</p>}
        {loading ? (
  <p>Loading employees...</p>
) : (
  <DataTable
    columns={columns}
    rows={users}
    emptyText="No users yet."
  />
)}
      </Card>

      {showAdd && <AddUserModal onCreate={handleCreate} onClose={() => setShowAdd(false)} />}

      {credentials && (
        <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />
      )}
    </>
  );
}