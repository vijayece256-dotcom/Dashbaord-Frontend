
import { useState } from "react";
import {
  UserPlus,
  UserRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";
import "./AddUserModal.css";

import { useAuth } from "../../context/AuthContext.jsx";
import { API_BASE_URL } from "../../config/env.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[A-Za-z]{1,50}$/;

const ACCOUNT_TYPES = [
  {
    value: "employee",
    label: "Normal user",
    description: "Access assigned features and projects.",
    icon: UserRound,
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Full system and account management access.",
    icon: ShieldCheck,
  },
];

export default function AddUserModal({ onCreate, onClose }) {
  const { token } = useAuth();

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    userType: "employee",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
      form: "",
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (busy) return;

    const found = {};

    const firstName = form.firstname.trim();
    const lastName = form.lastname.trim();

    if (!NAME_PATTERN.test(firstName)) {
      found.firstname = "Use 1–50 letters without spaces or symbols.";
    }

    if (!NAME_PATTERN.test(lastName)) {
      found.lastname = "Use 1–50 letters without spaces or symbols.";
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      found.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      found.password = "Temporary password must contain at least 8 characters.";
    }

    if (!["employee", "admin"].includes(form.userType)) {
      found.userType = "Select a valid account type.";
    }

    if (!token) {
      found.form = "Please log in again.";
    }

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setBusy(true);

    try {
      const payload = {
        firstName,
        lastName,
        emailaddress: form.email.trim().toLowerCase(),
        userType: form.userType,
        password: form.password,
        isPermanentPassword: false,
        isActive: true,
        isAccount: true,
        isEmployee: false,
      };

      const response = await fetch(
        `${API_BASE_URL}/v1/employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Unable to create account (${response.status}).`
        );
      }

      const result = await onCreate?.({
        ...payload,
        ...data,
      });

      if (result?.ok === false) {
        throw new Error(result.error || "Unable to complete account creation.");
      }

      onClose();

    } catch (error) {
      setErrors({
        form: error.message || "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Create user account"
      size="md"
      onClose={busy ? () => {} : onClose}
    >
      <form
        className="create-account-form"
        onSubmit={submit}
        noValidate
      >
        <div className="account-intro">
          <div className="account-intro-icon">
            <UserPlus size={23} />
          </div>

          <p>
            Create login credentials for a new member
            of your organisation.
          </p>
        </div>

        {/* First name */}
        <Input
          label="First name"
          placeholder="Enter first name"
          value={form.firstname}
          error={errors.firstname}
          autoComplete="given-name"
          disabled={busy}
          onChange={(e) =>
            updateField("firstname", e.target.value)
          }
        />

        {/* Last name */}
        <Input
          label="Last name"
          placeholder="Enter last name"
          value={form.lastname}
          error={errors.lastname}
          autoComplete="family-name"
          disabled={busy}
          onChange={(e) =>
            updateField("lastname", e.target.value)
          }
        />

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="name@company.com"
          value={form.email}
          error={errors.email}
          autoComplete="off"
          autoFocus
          disabled={busy}
          onChange={(e) =>
            updateField("email", e.target.value)
          }
        />

        {/* Account type */}
        <div className="account-type-section">
          <label className="account-field-label">
            Account type
          </label>

          <div
            className="account-type-options"
            role="radiogroup"
            aria-label="Account type"
          >
            {ACCOUNT_TYPES.map((account) => {
              const Icon = account.icon;
              const selected = form.userType === account.value;

              return (
                <label
                  key={account.value}
                  className={`account-type-card ${
                    selected ? "selected" : ""
                  }`}
                >
                  <div className="account-type-icon">
                    <Icon size={21} />
                  </div>

                  <div className="account-type-content">
                    <strong>{account.label}</strong>
                    <span>{account.description}</span>
                  </div>

                  <input
                    type="radio"
                    name="userType"
                    value={account.value}
                    checked={selected}
                    disabled={busy}
                    onChange={() =>
                      updateField("userType", account.value)
                    }
                  />
                </label>
              );
            })}
          </div>

          {errors.userType && (
            <p className="field-error">{errors.userType}</p>
          )}
        </div>

        {/* Temporary password */}
        <Input
          label="Temporary password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter temporary password"
          value={form.password}
          error={errors.password}
          autoComplete="new-password"
          disabled={busy}
          onChange={(e) =>
            updateField("password", e.target.value)
          }
          suffix={
            <button
              type="button"
              className="account-password-toggle"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          }
        />

        <div className="account-security-note">
          <ShieldCheck size={21} />

          <div>
            <strong>Secure first login</strong>
            <p>
              The user must change their temporary password
              when signing in for the first time.
            </p>
          </div>
        </div>

        {errors.form && (
          <p className="account-form-error" role="alert">
            {errors.form}
          </p>
        )}

        <div className="modal-actions account-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
