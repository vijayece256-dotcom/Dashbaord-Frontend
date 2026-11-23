
const DAY = 24 * 60 * 60 * 1000;

export const daysSince = (value) =>
  value
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(value).getTime()) / DAY
        )
      )
    : 0;

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const isDone = (task) =>
  task.done === true ||
  ["done", "completed"].includes(normalize(task.status));

export function buildDashboardStats(
  boards = [],
  projects = [],
  employees = []
) {
  const safeBoards = Array.isArray(boards) ? boards : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeEmployees = Array.isArray(employees)
    ? employees
    : [];

  // PROJECT STATISTICS

// PROJECT STATISTICS

const projectTotal = safeProjects.length;

const completed = safeProjects.filter(
  (project) =>
    normalize(project.status) === "completed"
).length;

const inProgress = safeProjects.filter(
  (project) =>
    normalize(project.status) === "inprogress"
).length;

const holdProjects = safeProjects.filter(
  (project) => {
    const status = normalize(project.status);

    return status === "onhold" || status === "hold";
  }
);

const upcoming = safeProjects.filter(
  (project) =>
    normalize(project.status) === "upcoming"
).length;
  
  // TEAM PERFORMANCE

  const byTeam = safeBoards.map((board) => {
    const tasks = board.tasks || [];

    const done = tasks.filter(isDone).length;

    return {
      id: board.id,
      name: board.name,
      done,
      total: tasks.length,
      pct: tasks.length
        ? Math.round((done / tasks.length) * 100)
        : 0,
    };
  });

  // TASK STATISTICS

  const allTasks = safeBoards.flatMap(
    (board) => board.tasks || []
  );

  const doneTasks = allTasks.filter(isDone).length;

  const now = Date.now();

  const overdue = allTasks.filter((task) => {
    const dueDate = task.endDate || task.dueDate;

    if (isDone(task) || !dueDate) return false;

    const timestamp = new Date(dueDate).getTime();

    return Number.isFinite(timestamp) && timestamp < now;
  }).length;

  // EMPLOYEE STATISTICS

  const totalEmployees = safeEmployees.length;

  return {
    projectTotal,
    completed,
    inProgress,
    holdProjects,
    upcoming,

    projectPct: projectTotal
      ? Math.round((completed / projectTotal) * 100)
      : 0,

    taskPct: allTasks.length
      ? Math.round((doneTasks / allTasks.length) * 100)
      : 0,

    taskTotal: allTasks.length,
    doneTasks,
    overdue,

    employees: totalEmployees,
    teams: safeBoards.length,

    byTeam,
  };
}
