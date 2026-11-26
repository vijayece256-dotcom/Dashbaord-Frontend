import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/env.js";
import { jwtDecode } from "jwt-decode";
const AuthContext = createContext(null);
const SESSION_KEY = "baluns_auth_session";

const REFRESH_BEFORE_MS = 60 * 1000; // refresh 1 minute before the token expires
const RETRY_MS = 15 * 1000; // after a network hiccup, try again in 15 seconds

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!saved?.token) return null;
    // An expired refresh token means the person has to sign in again
    if (saved.refreshExpiresAt && new Date(saved.refreshExpiresAt) < new Date()) return null;
    return saved;
  } catch {
    return null;
  }
}

// "vijay.kumar@baluns.com" -> "Vijay Kumar" (until the API gives us a name)
const nameFromEmail = (email) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);
  const [retryTick, setRetryTick] = useState(0);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const refreshing = useRef(false); // rotation means only one refresh may run at a time

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  // ---------- Refresh ----------

  const refresh = async () => {
    const current = sessionRef.current;
    if (!current || refreshing.current) return;

    refreshing.current = true;
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshtoken: current.refreshToken }),
      });

      // The refresh token is no longer valid: sign out
      if (response.status === 401 || response.status === 403) {
        setSession(null);
        return;
      }

      // Server trouble: keep the session and try again shortly
      if (!response.ok) {
        setRetryTick((n) => n + 1);
        return;
      }

      const data = await response.json();
      const decoded = jwtDecode(data.token);

setSession((prev) =>
  prev && {
    ...prev,
    token: data.token,
    refreshToken: data.refreshtoken ?? prev.refreshToken,
    expiresAt: data.expiresAt ?? prev.expiresAt,
    refreshExpiresAt:
      data.refreshExpiresAt ?? prev.refreshExpiresAt,
    user: {
      ...prev.user,
      role: decoded.userType ?? "user",
    },
  }
);
    } catch {
      setRetryTick((n) => n + 1); // offline: try again shortly
    } finally {
      refreshing.current = false;
    }
  };

  // Schedule the next refresh from the real expiry time
  useEffect(() => {
    if (!session?.expiresAt) return;

    if (session.refreshExpiresAt && new Date(session.refreshExpiresAt) < new Date()) {
      setSession(null);
      return;
    }

    const msLeft = new Date(session.expiresAt).getTime() - Date.now();
    const delay = Math.max(msLeft - REFRESH_BEFORE_MS, retryTick ? RETRY_MS : 0);

    const timer = setTimeout(refresh, delay);
    return () => clearTimeout(timer);
  }, [session?.expiresAt, retryTick]);

  // Timers pause while a laptop sleeps or a tab is hidden, so check again on return
  useEffect(() => {
    const onVisible = () => {
      const current = sessionRef.current;
      if (document.visibilityState !== "visible" || !current?.expiresAt) return;
      if (new Date(current.expiresAt).getTime() - Date.now() < REFRESH_BEFORE_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // ---------- Sign in / out ----------

  // The Login page calls this with the backend's response
  const signIn = (data, email) => {
    const decoded = jwtDecode(data.token);
    const profile = data.profile ?? {};
    const firstName = profile.firstname ?? profile.firstName ?? "";
    const lastName = profile.lastname ?? profile.lastName ?? "";

    setSession({
      token: data.token,
      refreshToken: data.refreshtoken,
      expiresAt: data.expiresAt,
      refreshExpiresAt: data.refreshExpiresAt,
      user: {
        id: data.employeeId ?? decoded.sub ?? "",
        email: profile.email ?? email,
        name: `${firstName} ${lastName}`.trim() || nameFromEmail(email),
        role: profile.userType ?? decoded.userType ?? "user",
        featureAccess: Array.isArray(profile.featureAccess)
          ? profile.featureAccess
          : [],
        designation: profile.designation?.name ?? "",
        team: profile.team?.name ?? "",
        avatar: "",
        mustChangePassword:
          data.message === "NEW_PASSWORD_REQUIRED",
      },
    });
  };

  const logout = () => setSession(null);

  // Will be replaced when we connect the password endpoint
  // Used by the first-login page (temporary password) and the Settings > Profile tab
  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    const current = sessionRef.current;
    if (!current) return { ok: false, error: "You are not signed in." };

    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${current.token}`,
        },
        // CHECK these two field names against Swagger (PUT /auth/password)
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          return {
            ok: false,
            error: data.message || "Current password is incorrect, or your session has expired.",
          };
        }
        return { ok: false, error: data.message || "Could not change the password. Try again." };
      }

      // Password is set: clear the "must change" flag. If the server sent fresh
      // tokens, use them.
      setSession((prev) =>
        prev && {
          ...prev,
          token: data.token ?? prev.token,
          refreshToken: data.refreshtoken ?? prev.refreshToken,
          expiresAt: data.expiresAt ?? prev.expiresAt,
          refreshExpiresAt: data.refreshExpiresAt ?? prev.refreshExpiresAt,
          user: { ...prev.user, mustChangePassword: false },
        }
      );

      return { ok: true };
    } catch {
      return { ok: false, error: "Cannot reach the server. Check that the backend is running." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAdmin: session?.user?.role === "admin",
        signIn,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
