import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config/env.js";
import { useAuth } from "./AuthContext.jsx";
import { waitForMinimumLoading } from "../utils/minimumLoadingTime.js";

const ProjectsContext = createContext(null);
const API_PATH = `${API_BASE_URL}/v1/project`;
const TEAM_API_PATH = `${API_BASE_URL}/v1/team`;

const statusFromApi = {
  Upcoming: "upcoming",
  InProgress: "inprogress",
  Completed: "completed",
  OnHold: "hold",
  upcoming: "upcoming",
  inprogress: "inprogress",
  completed: "completed",
  hold: "hold",
};

const statusToApi = {
  upcoming: "Upcoming",
  inprogress: "InProgress",
  completed: "Completed",
  hold: "OnHold",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const normalizeProject = (project = {}, knownTeams = []) => {
  const team = project.team ?? project.teamId;
  const teamId =
    typeof team === "object" && team !== null
      ? team._id ?? team.id ?? ""
      : team ?? "";

  return {
    ...project,
    id: String(project._id ?? project.id ?? ""),
    projectID: project.projectID ?? project.code ?? "",
    name: project.projectName ?? project.name ?? "",
    client: project.clientName ?? project.client ?? "",
    owner: project.projectOwner ?? project.owner ?? "",
    team: typeof team === "object" && team !== null
      ? team.teamName ?? team.name ?? ""
      : project.teamName ?? knownTeams.find((item) =>
          String(item._id ?? item.id) === String(team)
        )?.teamName ?? team ?? "",
    teamId: String(teamId),
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.expectedEndDate ?? project.endDate),
    status: statusFromApi[project.status] ?? "upcoming",
    memberIds: Array.isArray(project.assignedEmployees)
      ? project.assignedEmployees.map((employee) =>
          String(typeof employee === "object" ? employee?._id ?? employee?.id ?? "" : employee)
        ).filter(Boolean)
      : Array.isArray(project.memberIds)
        ? project.memberIds.map(String)
        : [],
  };
};

const normalizeComment = (comment = {}) => ({
  ...comment,
  id: String(comment._id ?? comment.id ?? ""),
  text: comment.comments ?? comment.text ?? "",
  by: comment.employeeDetails?.employeeName ?? comment.by ?? "",
  at: comment.createdAt ?? comment.at ?? "",
});

const toApiPayload = (project) => ({
  projectName: String(project.name ?? project.projectName ?? "").trim(),
  clientName: String(project.client ?? project.clientName ?? "").trim(),
  projectOwner: String(project.owner ?? project.projectOwner ?? "").trim(),
  department: String(project.department ?? "").trim(),
  teamId: String(project.teamId ?? ""),
  startDate: project.startDate
    ? `${project.startDate}T00:00:00.000Z`
    : undefined,
  expectedEndDate: (project.endDate ?? project.expectedEndDate)
    ? `${project.endDate ?? project.expectedEndDate}T00:00:00.000Z`
    : undefined,
  assignedEmployees: Array.isArray(project.memberIds)
    ? project.memberIds.map(String)
    : Array.isArray(project.assignedEmployees)
      ? project.assignedEmployees.map((employee) =>
          String(typeof employee === "object" ? employee?._id ?? employee?.id ?? "" : employee)
        ).filter(Boolean)
      : [],
  status: statusToApi[project.status] ?? project.status ?? "Upcoming",
  description: String(project.description ?? "").trim(),
});

async function readResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const details = data?.errors && typeof data.errors === "object"
      ? Object.values(data.errors).join(" ")
      : "";
    throw new Error(details || data?.message || `Request failed (${response.status}).`);
  }
  return data;
}

export function ProjectsProvider({ children }) {
  const { token, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return readResponse(response);
  }, [token]);

  const refreshProjects = useCallback(async () => {
    if (!token || !isAdmin) {
      setProjects([]);
      setLoading(false);
      return [];
    }

    const loadingStartedAt = Date.now();
    setLoading(true);
    setError("");
    try {
      const result = await request(API_PATH);
      const items = Array.isArray(result) ? result : result?.projects;
      if (!Array.isArray(items)) throw new Error("Invalid projects response.");
      const normalized = items.map((project) => normalizeProject(project));
      setProjects(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Unable to load projects.");
      setProjects([]);
      return [];
    } finally {
      await waitForMinimumLoading(loadingStartedAt);
      setLoading(false);
    }
  }, [token, isAdmin, request]);

  const refreshTeams = useCallback(async () => {
    if (!token || !isAdmin) {
      setTeams([]);
      return [];
    }
    try {
      const result = await request(TEAM_API_PATH);
      const items = Array.isArray(result) ? result : result?.teams;
      const activeTeams = Array.isArray(items)
        ? items.filter((team) => team.isActive !== false)
        : [];
      setTeams(activeTeams);
      return activeTeams;
    } catch {
      setTeams([]);
      return [];
    }
  }, [token, isAdmin, request]);

  useEffect(() => {
    if (!token || !isAdmin) {
      setProjects([]);
      setTeams([]);
      setLoading(false);
      setError("");
      return;
    }
    refreshProjects();
    refreshTeams();
  }, [token, isAdmin, refreshProjects, refreshTeams]);

  const getProject = useCallback(async (id) => {
    const projectPath = `${API_PATH}/${encodeURIComponent(id)}`;
    const [result, commentsResult] = await Promise.all([
      request(projectPath),
      request(`${projectPath}/comments`).catch(() => []),
    ]);
    const rawProject = result?.project ?? result?.data ?? result;
    const comments = Array.isArray(commentsResult)
      ? commentsResult.map(normalizeComment)
      : [];
    const detail = {
      ...normalizeProject(rawProject, teams),
      comments,
    };
    setProjects((items) => items.map((project) =>
      String(project.id) === String(id) ? { ...project, ...detail } : project
    ));
    return detail;
  }, [request, teams]);

  const addProjectComment = useCallback(async (id, text) => {
    const projectPath = `${API_PATH}/${encodeURIComponent(id)}`;
    const result = await request(`${projectPath}/comments`, {
      method: "POST",
      body: JSON.stringify({ comments: text }),
    });
    const comment = normalizeComment(result?.comment ?? result?.data ?? result);
    setProjects((items) => items.map((project) =>
      String(project.id) === String(id)
        ? { ...project, comments: [comment, ...(project.comments ?? [])] }
        : project
    ));
    return comment;
  }, [request]);

  const getProjectActivity = useCallback(async (id) => {
    const result = await request(
      `${API_PATH}/${encodeURIComponent(id)}/activities`
    );
    if (!Array.isArray(result)) {
      throw new Error("Invalid project activity response.");
    }
    return result;
  }, [request]);

  const addProject = useCallback(async (data) => {
    const result = await request(API_PATH, {
      method: "POST",
      body: JSON.stringify(toApiPayload(data)),
    });
    const created = normalizeProject(result?.project ?? result?.data ?? result, teams);
    setProjects((current) => [...current, created]);
    return created;
  }, [request, teams]);

  const updateProject = useCallback(async (id, changes) => {
    const existing = projects.find((project) => String(project.id) === String(id));
    const detailResult = await request(`${API_PATH}/${encodeURIComponent(id)}`);
    const current = normalizeProject(detailResult?.project ?? detailResult?.data ?? detailResult, teams);
    const merged = { ...current, ...changes };
    const result = await request(`${API_PATH}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(toApiPayload(merged)),
    });
    const updated = {
      ...merged,
      ...normalizeProject(result?.project ?? result?.data ?? result, teams),
      comments: existing?.comments ?? merged.comments,
      statusHistory: existing?.statusHistory ?? merged.statusHistory,
    };
    setProjects((items) => items.map((project) =>
      String(project.id) === String(id) ? updated : project
    ));
    return updated;
  }, [projects, request, teams]);

  const deleteProject = useCallback(async (id) => {
    await request(`${API_PATH}/${encodeURIComponent(id)}`, { method: "DELETE" });
    setProjects((items) => items.filter((project) => String(project.id) !== String(id)));
  }, [request]);

  return (
    <ProjectsContext.Provider value={{
      projects,
      teams,
      loading,
      error,
      addProject,
      updateProject,
      deleteProject,
      getProject,
      addProjectComment,
      getProjectActivity,
      refreshProjects,
      refreshTeams,
    }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectsContext);
