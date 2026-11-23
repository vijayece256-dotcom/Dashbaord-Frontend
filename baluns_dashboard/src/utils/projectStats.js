import { DONE_STATUS } from "../data/columns.js";

// { projectId: { done, total } } built from every task on every board
export function taskStatsByProject(boards) {
  const map = {};
  boards.forEach((b) =>
    (b.tasks || []).forEach((t) => {
      if (!t.projectId) return;
      const s = (map[t.projectId] = map[t.projectId] || { done: 0, total: 0 });
      s.total += 1;
      if (t.status === DONE_STATUS) s.done += 1;
    })
  );
  return map;
}

export function progressOf(project, stats = { done: 0, total: 0 }) {
  if (project.status === "completed") return 100;
  return stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
}