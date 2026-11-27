
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { API_BASE_URL } from "../config/env.js";
import { useAuth } from "./AuthContext.jsx";
import { waitForMinimumLoading } from "../utils/minimumLoadingTime.js";

const Context = createContext(null);

const EMPLOYEES_PATH = "/v1/employee";
const EMPLOYEE_ACCOUNTS_PATH = "/v1/employee/?isAccountPage=false";
const FEATURES_PATH = "/v1/feature";

const employeePath = (id) =>
  `${EMPLOYEES_PATH}/${encodeURIComponent(id)}`;

const LEGACY_KEY = "baluns_employees_v1";

const isObject = (value) =>
  value !== null && typeof value === "object";

const pickId = (value) =>
  isObject(value)
    ? String(value._id ?? value.id ?? "")
    : String(value ?? "");

// Extract the actual featureCode returned by the API.
const getFeatureCode = (item) => {
  if (isObject(item)) {
    return item.featureCode ?? item.code ?? item.key ?? "";
  }

  return item ?? "";
};

// Preserve backend feature codes. Never convert them to names.
const normalizeFeatureAccess = (items) =>
  (Array.isArray(items) ? items : [])
    .map(getFeatureCode)
    .map((code) => String(code))
    .filter(Boolean);

// ---------------------------------------
// NORMALIZE EMPLOYEE
// ---------------------------------------

const normalizeEmployee = (raw = {}) => {
  const id = String(raw._id ?? raw.id ?? "");

  const firstName = raw.firstName ?? raw.firstname ?? "";
  const lastName = raw.lastName ?? raw.lastname ?? "";

  const designation = isObject(raw.designation)
    ? raw.designation
    : isObject(raw.designationId)
    ? raw.designationId
    : null;

  const team = isObject(raw.team)
    ? raw.team
    : isObject(raw.teamId)
    ? raw.teamId
    : isObject(designation?.team)
    ? designation.team
    : null;

  const project = isObject(raw.project)
    ? raw.project
    : isObject(raw.projectId)
    ? raw.projectId
    : null;

  const manager = isObject(raw.manager_id)
    ? raw.manager_id
    : isObject(raw.manager)
    ? raw.manager
    : null;

  const managerName = manager
    ? `${manager.firstName ?? manager.firstname ?? ""} ${
        manager.lastName ?? manager.lastname ?? ""
      }`.trim() || manager.name || ""
    : typeof raw.manager === "string"
    ? raw.manager
    : "";

  const featureAccess = normalizeFeatureAccess(raw.featureAccess);

  return {
    ...raw,

    id,
    _id: id,

    firstname: firstName,
    lastname: lastName,

    name:
      raw.name ??
      (`${firstName} ${lastName}`.trim() ||
        raw.emailaddress ||
        raw.email ||
        ""),

    employee_code:
      raw.employeeCode ??
      raw.empId ??
      raw.employee_code ??
      "",

    email: raw.email ?? raw.emailaddress ?? "",
    emailaddress: raw.emailaddress ?? raw.email ?? "",

    phonenumber: raw.phonenumber ?? raw.phone ?? "",

    userId: pickId(raw.userId) || id,

    teamId: pickId(raw.teamId ?? raw.team ?? designation?.team),

    team:
      team?.teamName ??
      team?.name ??
      raw.teamName ??
      "",

    designationId: pickId(raw.designationId ?? raw.designation),

    role:
      designation?.designationName ??
      designation?.name ??
      raw.designationName ??
      raw.role ??
      "",

    projectId: pickId(raw.projectId ?? raw.project),

    project:
      project?.name ??
      (typeof raw.project === "string" ? raw.project : ""),

    reportingManagerId: pickId(
      raw.manager_id ?? raw.reportingManagerId
    ),

    manager: managerName,

    // These are actual backend codes, e.g. BF-001.
    featureAccess,

    boardAccess: Array.isArray(raw.boardAccess)
      ? raw.boardAccess.map(pickId).filter(Boolean)
      : [],

    isActive: raw.isActive !== false,

    status: raw.isActive === false ? "inactive" : "active",

    isReportingManager: raw.isReportingManager === true,
  };
};

// ---------------------------------------
// NORMALIZE REGISTERED ACCOUNT
// ---------------------------------------

const normalizeAccount = (account = {}) => {
  const firstName =
    account.firstname ?? account.firstName ?? "";

  const lastName =
    account.lastname ?? account.lastName ?? "";

  return {
    ...account,

    _id: String(account._id ?? account.id ?? ""),
    id: String(account._id ?? account.id ?? ""),

    firstname: firstName,
    lastname: lastName,

    firstName,
    lastName,

    email: account.email ?? account.emailaddress ?? "",
    emailaddress: account.emailaddress ?? account.email ?? "",

    name: account.name ?? `${firstName} ${lastName}`.trim(),
  };
};

// ---------------------------------------
// BUILD API PAYLOAD
// ---------------------------------------

const buildRequestBody = (data) => ({
  userId: data.userId || undefined,

  employee_code:
    data.empId ??
    data.employeeCode ??
    data.employee_code,

  firstName: data.firstName ?? data.firstname,
  lastName: data.lastName ?? data.lastname,

  emailaddress: data.emailaddress ?? data.email,

  phonenumber: data.phonenumber,

  teamId: data.teamId,
  designationId: data.designationId,

  projectId: data.projectId || null,

  isAccount: true,
  isEmployee: true,

  manager_id:
    data.manager_id ??
    data.reportingManagerId ??
    null,

  isActive: data.isActive !== false,

  isReportingManager: data.isReportingManager === true,

  userType: data.userType ?? "employee",

  // Send backend feature codes directly.
  featureAccess: normalizeFeatureAccess(data.featureAccess),

  boardAccess: Array.isArray(data.boardAccess)
    ? data.boardAccess
    : [],
});

// ---------------------------------------
// PROVIDER
// ---------------------------------------

export function EmployeesProvider({ children }) {
  const { token, isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [features, setFeatures] = useState([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState("");

  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [error, setError] = useState("");
  const [accountsError, setAccountsError] = useState("");

  const loadedToken = useRef(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  // ---------------------------------------
  // API REQUEST HELPER
  // ---------------------------------------

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `API returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        const validationErrors = data?.errors
          ? Object.values(data.errors).join(", ")
          : "";

        throw new Error(
          validationErrors ||
            data?.message ||
            data?.error ||
            `Request failed (${response.status})`
        );
      }

      return data;
    },
    [token]
  );

  // ---------------------------------------
  // FETCH FEATURES
  // ---------------------------------------

  const fetchFeatures = useCallback(async () => {
    if (!token || !isAdmin) {
      setFeatures([]);
      setFeaturesLoading(false);
      setFeaturesError("");
      return;
    }

    setFeaturesLoading(true);
    setFeaturesError("");

    try {
      const result = await request(FEATURES_PATH);

      const data = Array.isArray(result)
        ? result
        : result?.data ?? result?.features ?? [];

      if (!Array.isArray(data)) {
        throw new Error("Invalid feature API response.");
      }

      // Keep only valid API feature records.
      setFeatures(
        data.filter(
          (feature) =>
            feature?.featureName && feature?.featureCode
        )
      );
    } catch (err) {
      setFeatures([]);
      setFeaturesError(
        err.message || "Unable to load features."
      );
    } finally {
      setFeaturesLoading(false);
    }
  }, [token, isAdmin, request]);

  // ---------------------------------------
  // FETCH EMPLOYEES + ACCOUNTS
  // ONE REQUEST
  // ---------------------------------------

  const fetchEmployees = useCallback(async () => {
    if (!token || !isAdmin) {
      setEmployees([]);
      setAccounts([]);

      setLoading(false);
      setAccountsLoading(false);

      setError("");
      setAccountsError("");
      return;
    }

    const loadingStartedAt = Date.now();
    setLoading(true);
    setAccountsLoading(true);

    setError("");
    setAccountsError("");

    try {
      const result = await request(EMPLOYEE_ACCOUNTS_PATH);

      const responseData = result?.data ?? result ?? {};

      const activeEmployees = Array.isArray(
        responseData.activeEmployee
      )
        ? responseData.activeEmployee
        : [];

      const newAccounts = Array.isArray(
        responseData.newAccounts
      )
        ? responseData.newAccounts
        : [];

      setEmployees(activeEmployees.map(normalizeEmployee));
      setAccounts(newAccounts.map(normalizeAccount));
    } catch (err) {
      setError(err.message || "Unable to load employees.");

      setAccountsError(
        err.message || "Unable to load registered accounts."
      );

      setEmployees([]);
      setAccounts([]);
    } finally {
      await waitForMinimumLoading(loadingStartedAt);
      setLoading(false);
      setAccountsLoading(false);
    }
  }, [token, isAdmin, request]);

  // ---------------------------------------
  // FETCH SINGLE EMPLOYEE
  // ---------------------------------------

  const fetchEmployee = useCallback(
    async (id) => {
      if (!id) {
        throw new Error("Employee ID is required.");
      }

      const result = await request(employeePath(id));

      const raw =
        result?.data ??
        result?.employee ??
        result;

      return normalizeEmployee(raw);
    },
    [request]
  );

  // ---------------------------------------
  // INITIAL LOAD
  // ---------------------------------------

  useEffect(() => {
    if (!token || !isAdmin) {
      loadedToken.current = null;

      setEmployees([]);
      setAccounts([]);
      setFeatures([]);

      setLoading(false);
      setAccountsLoading(false);
      setFeaturesLoading(false);

      setError("");
      setAccountsError("");
      setFeaturesError("");

      return;
    }

    if (loadedToken.current === token) {
      return;
    }

    loadedToken.current = token;

    fetchEmployees();
    fetchFeatures();
  }, [token, isAdmin, fetchEmployees, fetchFeatures]);

  // ---------------------------------------
  // CREATE / UPDATE EMPLOYEE
  // ---------------------------------------

  const saveEmployee = useCallback(
    async (data) => {
      if (!isAdmin) {
        return {
          ok: false,
          error: "Administrator access is required.",
        };
      }

      const id = String(
        data?._id ??
        data?.id ??
        data?.userId ??
        ""
      );

      if (!id) {
        return {
          ok: false,
          error: "Select an existing user account.",
        };
      }

      const body = buildRequestBody(data);

      try {
        await request(employeePath(id), {
          method: "PUT",
          body: JSON.stringify(body),
        });

        await fetchEmployees();

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err.message || "Unable to save employee.",
        };
      }
    },
    [isAdmin, request, fetchEmployees]
  );

  // ---------------------------------------
  // DELETE EMPLOYEE
  // ---------------------------------------

  const removeEmployee = useCallback(
    async (id) => {
      if (!isAdmin) {
        return {
          ok: false,
          error: "Administrator access is required.",
        };
      }

      if (!id) {
        return {
          ok: false,
          error: "Employee ID is required.",
        };
      }

      try {
        await request(employeePath(id), {
          method: "DELETE",
        });

        await fetchEmployees();

        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err.message || "Unable to delete employee.",
        };
      }
    },
    [isAdmin, request, fetchEmployees]
  );

  // ---------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------

  const value = useMemo(
    () => ({
      employees,
      loading,
      error,

      accounts,
      accountsLoading,
      accountsError,

      // Shared features from the API.
      features,
      featuresLoading,
      featuresError,

      refreshEmployees: fetchEmployees,
      fetchAccounts: fetchEmployees,

      refreshFeatures: fetchFeatures,

      fetchEmployee,
      saveEmployee,
      removeEmployee,
    }),
    [
      employees,
      loading,
      error,
      accounts,
      accountsLoading,
      accountsError,
      features,
      featuresLoading,
      featuresError,
      fetchEmployees,
      fetchFeatures,
      fetchEmployee,
      saveEmployee,
      removeEmployee,
    ]
  );

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

// ---------------------------------------
// CUSTOM HOOK
// ---------------------------------------

export const useEmployees = () => {
  const value = useContext(Context);

  if (!value) {
    throw new Error("Wrap the app with EmployeesProvider");
  }

  return value;
};
