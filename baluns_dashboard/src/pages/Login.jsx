import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../config/env.js";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import DashboardPreview from "../components/auth/DashboardPreview.jsx";
import "./Login.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { user, signIn } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const clear = (key) => setErrors((er) => ({ ...er, [key]: "", form: "" }));

  const submit = async (e) => {
    e.preventDefault();

    const found = {};
    if (!EMAIL_PATTERN.test(email.trim())) found.email = "Enter a valid email address.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailaddress: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setErrors({ form: "Incorrect email or password." });
      } else if (response.status === 403) {
        setErrors({ form: "This account is inactive. Contact your administrator." });
      } else if (!response.ok) {
        setErrors({ form: data.message || "Login failed. Please try again." });
      } else {
        signIn(data, email.trim().toLowerCase());
      }
    } catch {
      setErrors({ form: "Cannot reach the server. Check that the backend is running." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-side">
        <div className="login-brand">
          <span className="login-mark" />
          Baluns Technologies
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <h1>Welcome back</h1>
          <p className="login-sub">Sign in to manage your projects, teams and tasks.</p>

          <div className="form-stack">
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
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              error={errors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
              }}
              suffix={
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {errors.form && <p className="login-form-error" role="alert">{errors.form}</p>}

            <Button type="submit" className="login-submit" disabled={busy}>
              {busy ? "Please wait..." : "Sign in"}
            </Button>
          </div>
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