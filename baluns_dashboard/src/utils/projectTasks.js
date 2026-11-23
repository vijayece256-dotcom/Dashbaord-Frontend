import { COLUMNS } from "../data/columns.js";

// A task belongs to a project by id (new tasks) or by name (older tasks).
export const belongsTo = (item, project) => {
  const ref = item.projectId ?? item.project_id ?? item.project;
  return ref === project.id || ref === project.name || ref?.id === project.id;
};

// Uses your board columns: first = pending, last = completed, anything between = in progress.
// Unknown statuses count as the first column, the same as BoardPage does.
export const bucket = (status) => {
  const i = COLUMNS.findIndex((c) => c.id === status);
  if (i <= 0) return "pending";
  if (i === COLUMNS.length - 1) return "completed";
  return "inprogress";
};

export function taskStats(tasks, project) {
  const mine = tasks.filter((t) => belongsTo(t, project));
  const done = mine.filter((t) => bucket(t.status) === "completed").length;
  const total = mine.length;
  return { mine, total, done, progress: total ? Math.round((done / total) * 100) : 0 };
}

// Unique people assigned to the project's tasks.
export const taskMembers = (tasks) =>
  [...new Set(tasks.map((t) => (t.assignee || "").trim()).filter(Boolean))].map((name) => ({ id: name, name }));

// Activity built from task creation and the daily updates (comments) on each task.
export function taskActivity(tasks) {
  const out = [];
  for (const t of tasks) {
    if (t.createdAt)
      out.push({ id: `${t.id}-created`, text: `Task created: ${t.title}`, by: t.reporter || "", at: t.createdAt });
    for (const c of t.comments || [])
      out.push({ id: `${t.id}-${c.id}`, text: `Update posted on ${t.title}`, by: c.author, at: c.createdAt });
  }
  return out;
}