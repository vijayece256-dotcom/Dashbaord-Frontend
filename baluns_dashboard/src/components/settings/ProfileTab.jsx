import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { titleOf } from "../../data/roles.js";
import { formatDate } from "../../utils/format.js";
import Card from "../common/Card.jsx";
import Avatar from "../common/Avatar.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";

export default function ProfileTab() {
  const { user, changePassword } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const clear = (key) => {
    setErrors((er) => ({ ...er, [key]: "", form: "" }));
    setSuccess("");
  };

  const submit = async (e) => {
    e.preventDefault();

    const found = {};
    if (!current) found.current = "Enter your current password.";
    if (next.length < 8) found.next = "Use at least 8 characters.";
    if (confirm !== next) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const result = await changePassword({ currentPassword: current, newPassword: next });
    setBusy(false);

    if (!result.ok) return setErrors({ form: result.error });

    setCurrent("");
    setNext("");
    setConfirm("");
    setSuccess("Your password has been updated.");
  };

  return (
    <div className="settings-stack">
      <Card title="Your profile">
        <div className="profile-head">
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <dl className="profile-details">
          <div>
            <dt>Designation</dt>
            <dd>{titleOf(user)}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Change password" className="password-card">
        <form className="form-stack" onSubmit={submit} noValidate>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={current}
            error={errors.current}
            onChange={(e) => {
              setCurrent(e.target.value);
              clear("current");
            }}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={next}
            error={errors.next}
            onChange={(e) => {
              setNext(e.target.value);
              clear("next");
            }}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clear("confirm");
            }}
          />

          {errors.form && <p className="settings-notice" role="alert">{errors.form}</p>}
          {success && <p className="settings-success" role="status">{success}</p>}

          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}