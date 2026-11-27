import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { titleOf } from "../../data/roles.js";
import { PASSWORD_RULES, passwordIsValid } from "../../utils/passwordRules.js";
import Card from "../common/Card.jsx";
import Avatar from "../common/Avatar.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";
import Modal from "../common/Modal.jsx";

const displayValue = (value) => (value ? String(value) : "Not provided");

export default function ProfileTab() {
  const { user, changePassword, isAdmin } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const clear = (key) => {
    setErrors((existing) => ({ ...existing, [key]: "", form: "" }));
    setSuccess("");
  };

  const closePasswordModal = () => {
    if (busy) return;
    setShowPasswordModal(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!current) found.current = "Enter your current password.";
    if (!passwordIsValid(next)) {
      found.next = "Your new password does not meet all the requirements.";
    }
    if (next && next === current) {
      found.next = "Choose a password different from the current one.";
    }
    if (confirm !== next) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm,
    });
    setBusy(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    setShowPasswordModal(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
    setSuccess("Your password has been updated.");
  };

  const featureAccess = Array.isArray(user?.featureAccess)
    ? user.featureAccess.filter(Boolean)
    : [];

  return (
    <div className="profile-layout">
      <Card title="Profile information" className="profile-card">
        <div className="profile-identity">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div className="profile-identity-copy">
            <h2>{user?.name || "Your profile"}</h2>
            <p>{user?.email || ""}</p>
            <span className="profile-role">{isAdmin ? "Administrator" : "Employee"}</span>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-item">
            <span>Designation</span>
            <strong>{titleOf(user) || "Not Assigned"}</strong>
          </div>
          <div className="profile-info-item">
            <span>Team</span>
            <strong>{displayValue(user?.team)}</strong>
          </div>
          <div className="profile-info-item">
            <span>Mobile number</span>
            <strong>{displayValue(user?.phoneNumber ?? user?.phonenumber ?? user?.phone)}</strong>
          </div>
          <div className="profile-info-item">
            <span>Email address</span>
            <strong>{displayValue(user?.email)}</strong>
          </div>
        </div>
      </Card>

      <Card title="Feature access" className="profile-card">
        <p className="profile-section-description">
          Features available to your account.
        </p>
        {isAdmin ? (
          <div className="profile-feature-list">
            <span className="profile-feature-chip"><ShieldCheck size={15} /> All features</span>
          </div>
        ) : featureAccess.length ? (
          <div className="profile-feature-list">
            {featureAccess.map((feature) => (
              <span className="profile-feature-chip" key={feature}>{feature}</span>
            ))}
          </div>
        ) : (
          <p className="profile-empty">No features are assigned to your account.</p>
        )}
      </Card>

      <Card title="Password & security" className="profile-card profile-security-card">
        <div className="profile-security-copy">
          <div className="profile-security-icon"><KeyRound size={18} /></div>
          <div>
            <strong>Keep your account secure</strong>
            <p>Change your password periodically to protect your account.</p>
          </div>
        </div>
        <Button variant="outline" icon={KeyRound} onClick={() => {
          setSuccess("");
          setShowPasswordModal(true);
        }}>
          Change password
        </Button>
      </Card>

      {success && <p className="settings-success profile-success" role="status">{success}</p>}

      {showPasswordModal && (
        <Modal title="Change password" onClose={closePasswordModal} size="md">
          <p className="profile-modal-description">
            Enter your current password, then choose a new password for your account.
          </p>
          <form className="form-stack profile-password-form" onSubmit={submit} noValidate>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={current}
              error={errors.current}
              onChange={(event) => {
                setCurrent(event.target.value);
                clear("current");
              }}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              rules={PASSWORD_RULES}
              value={next}
              error={errors.next}
              onChange={(event) => {
                setNext(event.target.value);
                clear("next");
              }}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              error={errors.confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                clear("confirm");
              }}
            />
            {errors.form && <p className="settings-notice" role="alert">{errors.form}</p>}
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={closePasswordModal} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Update password"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
