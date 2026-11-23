import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEFAULT_TITLE } from "../../data/roles.js";
import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// onCreate({ name, email, designation, password }) must return { ok, error? }
export default function AddUserModal({ onCreate, onClose }) {
  const { designations } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", designation: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "", form: "" }));
  };

  const submit = async () => {
    const found = {};
    if (!form.name.trim()) found.name = "Enter the person's full name.";
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (form.password && form.password.trim().length < 6) {
      found.password = "Use at least 6 characters, or leave empty to generate one.";
    }
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const result = await onCreate(form);
    setBusy(false);

    if (!result.ok) setErrors({ form: result.error });
  };

  return (
    <Modal title="Add user" size="md" onClose={onClose}>
      <div className="form-stack">
        <Input
          label="Full name"
          placeholder="e.g. Meena R"
          value={form.name}
          error={errors.name}
          autoFocus
          onChange={set("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={form.email}
          error={errors.email}
          onChange={set("email")}
        />

        <Input as="select" label="Designation" value={form.designation} onChange={set("designation")}>
          <option value="">{DEFAULT_TITLE}</option>
          {designations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Input>
        {designations.length === 0 && (
          <p className="modal-hint">
            No designations yet. Add them in Settings, Designations tab, then set one here or later.
          </p>
        )}

        <Input
          label="Temporary password (optional)"
          placeholder="Leave empty to generate one"
          value={form.password}
          error={errors.password}
          onChange={set("password")}
        />
        {errors.form && <p className="field-error">{errors.form}</p>}
      </div>

      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={busy}>{busy ? "Creating..." : "Create user"}</Button>
      </div>
    </Modal>
  );
}