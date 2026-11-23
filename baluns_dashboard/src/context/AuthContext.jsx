import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLES } from "../data/roles.js";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "baluns_accounts";
const SESSION_KEY = "baluns_session";
const DESIGNATIONS_KEY = "baluns_designations";

const DENIED = { ok: false, error: "Only the CEO can do this." };

function loadList(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

const makeSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

// Passwords are never stored as typed, only as a salted SHA-256 hash.
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

// 12 characters, no look-alikes (0/O, 1/l/I)
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Never expose the hash or salt to the rest of the app
const publicUser = ({ passwordHash, salt, ...rest }) => rest;

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => loadList(ACCOUNTS_KEY));
  const [designations, setDesignations] = useState(() => loadList(DESIGNATIONS_KEY));
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY));

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(DESIGNATIONS_KEY, JSON.stringify(designations));
  }, [designations]);

  useEffect(() => {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
    else localStorage.removeItem(SESSION_KEY);
  }, [sessionId]);

  // A deactivated account loses access immediately
  const account = accounts.find((a) => a.id === sessionId && a.active !== false);
  const user = useMemo(() => (account ? publicUser(account) : null), [account]);
  const isAdmin = user?.role === ROLES.ADMIN;

  // Only the CEO gets the full list of accounts
  const users = useMemo(
    () => (isAdmin ? accounts.map(publicUser) : []),
    [accounts, isAdmin]
  );

  // ---------- Sign in / out ----------

  const login = async ({ email, password }) => {
    const found = accounts.find((a) => a.email === email.trim().toLowerCase());
    const valid = found && (await hashPassword(password, found.salt)) === found.passwordHash;

    if (!valid) return { ok: false, error: "Incorrect email or password." };
    if (found.active === false) {
      return { ok: false, error: "This account is deactivated. Contact the CEO." };
    }

    setSessionId(found.id);
    return { ok: true };
  };

  const logout = () => setSessionId(null);

  // ---------- One-time setup of the very first account (the CEO) ----------

  const setupAdmin = async ({ name, email, password }) => {
    if (accounts.length > 0) {
      return { ok: false, error: "Setup is already complete. Please sign in." };
    }

    const salt = makeSalt();
    const created = {
      id: newId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: ROLES.ADMIN,
      designation: "",
      active: true,
      mustChangePassword: false,
      avatar: "",
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    setAccounts([created]);
    setSessionId(created.id);
    return { ok: true };
  };

  // ---------- Password change (any signed-in user) ----------

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!account) return { ok: false, error: "You are not signed in." };

    if ((await hashPassword(currentPassword, account.salt)) !== account.passwordHash) {
      return { ok: false, error: "Current password is incorrect." };
    }
    if (newPassword === currentPassword) {
      return { ok: false, error: "Choose a password different from the current one." };
    }

    const salt = makeSalt();
    const passwordHash = await hashPassword(newPassword, salt);

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === account.id ? { ...a, salt, passwordHash, mustChangePassword: false } : a
      )
    );
    return { ok: true };
  };

  // ---------- CEO actions: designations ----------

  const addDesignation = (name) => {
    if (!isAdmin) return DENIED;

    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return { ok: false, error: "Enter a designation name." };
    if (clean.length > 40) return { ok: false, error: "Keep it under 40 characters." };
    if (designations.some((d) => d.toLowerCase() === clean.toLowerCase())) {
      return { ok: false, error: "This designation already exists." };
    }

    setDesignations((prev) => [...prev, clean]);
    return { ok: true };
  };

  const removeDesignation = (name) => {
    if (!isAdmin) return DENIED;

    const inUse = accounts.filter((a) => a.designation === name).length;
    if (inUse > 0) {
      return {
        ok: false,
        error: `${inUse} ${inUse === 1 ? "person has" : "people have"} this designation. Change them first.`,
      };
    }

    setDesignations((prev) => prev.filter((d) => d !== name));
    return { ok: true };
  };

  const setUserDesignation = (id, designation) => {
    if (!isAdmin) return DENIED;
    if (designation && !designations.includes(designation)) {
      return { ok: false, error: "Choose a designation from the list." };
    }

    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, designation } : a)));
    return { ok: true };
  };

  // ---------- CEO actions: people ----------

  // Creates an account with a temporary password. Does NOT sign the new user in.
  const createUser = async ({ name, email, designation, password }) => {
    if (!isAdmin) return DENIED;

    const cleanEmail = email.trim().toLowerCase();
    if (accounts.some((a) => a.email === cleanEmail)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    if (designation && !designations.includes(designation)) {
      return { ok: false, error: "Choose a designation from the list." };
    }

    const tempPassword = password?.trim() || generatePassword();
    const salt = makeSalt();

    const created = {
      id: newId(),
      name: name.trim(),
      email: cleanEmail,
      role: ROLES.USER,
      designation: designation || "",
      active: true,
      mustChangePassword: true,
      avatar: "",
      salt,
      passwordHash: await hashPassword(tempPassword, salt),
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, created]);
    return { ok: true, tempPassword };
  };

  // New temporary password; the person must change it at next sign in
  const resetPassword = async (id) => {
    if (!isAdmin) return DENIED;
    if (id === account?.id) {
      return { ok: false, error: "You cannot reset your own password here." };
    }

    const tempPassword = generatePassword();
    const salt = makeSalt();
    const passwordHash = await hashPassword(tempPassword, salt);

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, salt, passwordHash, mustChangePassword: true } : a))
    );
    return { ok: true, tempPassword };
  };

  const setUserActive = (id, active) => {
    if (!isAdmin) return DENIED;
    if (id === account?.id) {
      return { ok: false, error: "You cannot deactivate your own account." };
    }

    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)));
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAdmin,
        designations,
        hasAccounts: accounts.length > 0,
        login,
        logout,
        setupAdmin,
        changePassword,
        addDesignation,
        removeDesignation,
        setUserDesignation,
        createUser,
        resetPassword,
        setUserActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);