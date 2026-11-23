import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import DashboardPreview from "../components/auth/DashboardPreview.jsx";
import "./Login.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT = {
  signin: {
    title: "Welcome back",
    sub: "Sign in to manage your projects, teams and tasks.",
    button: "Sign in",
  },
  setup: {
    title: "Set up your administrator account",
    sub: "This is a one-time step. You will add everyone else from Settings.",
    button: "Create administrator account",
  },
};

export default function Login() {
  const { user, hasAccounts, login, setupAdmin } = useAuth();
  const location = useLocation();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) {
    return user.mustChangePassword ? (
      <Navigate to="/change-password" replace />
    ) : (
      <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />
    );
  }

  const isSetup = mode === "setup" && !hasAccounts;
  const text = TEXT[isSetup ? "setup" : "signin"];

  const clear = (key) => setErrors((er) => ({ ...er, [key]: "", form: "" }));

  const switchMode = () => {
    setMode(isSetup ? "signin" : "setup");
    setErrors({});
    setPassword("");
    setConfirm("");
  };

  const submit = async (e) => {
    e.preventDefault();

    const found = {};
    if (isSetup && !name.trim()) found.name = "Enter your full name.";
    if (!EMAIL_PATTERN.test(email.trim())) found.email = "Enter a valid email address.";
    if (password.length < 6) found.password = "Password must be at least 6 characters.";
    if (isSetup && confirm !== password) found.confirm = "Passwords do not match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    const result = isSetup
      ? await setupAdmin({ name, email, password })
      : await login({ email, password });
    setBusy(false);

    if (!result.ok) setErrors({ form: result.error });
  };

  const eye = (
    <button
      type="button"
      className="login-eye"
      onClick={() => setShowPassword((s) => !s)}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className="login">
      <section className="login-side">
        <div className="login-brand">
          <span className="login-mark" />
          Baluns Technologies
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <h1>{text.title}</h1>
          <p className="login-sub">{text.sub}</p>

          <div className="form-stack">
            {isSetup && (
              <Input
                label="Full name"
                placeholder="e.g. Vijay Kumar"
                autoComplete="name"
                value={name}
                error={errors.name}
                onChange={(e) => {
                  setName(e.target.value);
                  clear("name");
                }}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                clear("email");
              }}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder={isSetup ? "At least 6 characters" : "Enter your password"}
              autoComplete={isSetup ? "new-password" : "current-password"}
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
              }}
              suffix={eye}
            />

            {isSetup && (
              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirm}
                error={errors.confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  clear("confirm");
                }}
              />
            )}

            {errors.form && <p className="login-form-error" role="alert">{errors.form}</p>}

            <Button type="submit" className="login-submit" disabled={busy}>
              {busy ? "Please wait..." : text.button}
            </Button>
          </div>

          {/* Only visible on a brand-new install with no accounts yet */}
          {!hasAccounts && (
            <p className="login-switch">
              {isSetup ? "Already set up?" : "First time here?"}{" "}
              <button type="button" onClick={switchMode}>
                {isSetup ? "Sign in" : "Set up the administrator account"}
              </button>
            </p>
          )}
        </form>

        <p className="login-foot">© 2026 Baluns Technologies</p>
      </section>

      <aside className="login-showcase">
        <div className="login-copy">
          <h2>All-in-One Organisation Management Platform</h2>
          <p>
            Projects, task boards, teams and performance, everything your organisation needs
            to run smoothly in one place.
          </p>
        </div>
        <DashboardPreview />
      </aside>
    </div>
  );
}