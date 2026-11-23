import { useState } from "react";
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
    users,
    designations,
    createUser,
    resetPassword,
    setUserDesignation,
    setUserActive,
  } = useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [notice, setNotice] = useState("");

  const showError = (result) => setNotice(result.ok ? "" : result.error);

  const handleCreate = async (data) => {
    const result = await createUser(data);
    if (result.ok) {
      setShowAdd(false);
      setNotice("");
      setCredentials({
        title: "User created",
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: result.tempPassword,
      });
    }
    return result; // the modal shows the error if there is one
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
        action={<Button icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Add user</Button>}
      >
        {notice && <p className="settings-notice" role="alert">{notice}</p>}
        <DataTable columns={columns} rows={users} emptyText="No users yet." />
      </Card>

      {showAdd && <AddUserModal onCreate={handleCreate} onClose={() => setShowAdd(false)} />}

      {credentials && (
        <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />
      )}
    </>
  );
}