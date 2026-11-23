import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/common/Card.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import "./ChangePassword.css";

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/dashboard" replace />;

  const clear = (key) => setErrors((er) => ({ ...er, [key]: "", form: "" }));

  const submit = async (e) => {
    e.preventDefault();

    const found = {};
    if (!current) found.current = "Enter the temporary password you were given.";
    if (next.length < 8) found.next = "Use at least 8 characters.";
    if (confirm !== next) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const result = await changePassword({ currentPassword: current, newPassword: next });
    setBusy(false);

    // On success the account updates and this page redirects to the dashboard by itself
    if (!result.ok) setErrors({ form: result.error });
  };

  return (
    <div className="change-page">
      <Card title="Set your new password" className="change-card">
        <p className="change-sub">
          Welcome, {user.name}. For your security, replace the temporary password with one
          only you know.
        </p>

        <form className="form-stack" onSubmit={submit} noValidate>
          <Input
            label="Temporary password"
            type="password"
            autoComplete="current-password"
            value={current}
            error={errors.current}
            autoFocus
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

          {errors.form && <p className="change-error" role="alert">{errors.form}</p>}

          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save password"}
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}