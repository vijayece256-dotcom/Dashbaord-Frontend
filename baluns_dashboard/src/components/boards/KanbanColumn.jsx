import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import TaskCard from "./TaskCard.jsx";
import Dropdown from "../common/Dropdown.jsx";
import "./KanbanColumn.css";

const PRIORITIES = ["high", "medium", "low"];

export default function KanbanColumn({
  column,
  tasks,
  onDropTask,
  onDeleteTask,
  onOpenTask,
}) {
  const [isOver, setIsOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [priority, setPriority] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const menuRef = useRef(null);

  // Close the filter menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const assignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort(),
    [tasks]
  );

  const visibleTasks = tasks.filter(
    (t) =>
      (priority === "all" || t.priority === priority) &&
      (assignee === "all" || t.assignee === assignee)
  );

  const isFiltered = priority !== "all" || assignee !== "all";

  const clearFilters = () => {
    setPriority("all");
    setAssignee("all");
  };

  return (
    <section
      className={`kanban-col ${isOver ? "kanban-col-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onDropTask(taskId, column.id);
      }}
    >
      <header className="kanban-col-head">
        <h3>{column.title}</h3>
        <span className="kanban-count">
          {isFiltered ? `${visibleTasks.length}/${tasks.length}` : tasks.length}
        </span>

        <div className="kanban-filter" ref={menuRef}>
          <button
            type="button"
            className={`kanban-filter-btn ${isFiltered ? "is-active" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`Filter ${column.title}`}
            aria-expanded={menuOpen}
          >
            <SlidersHorizontal size={15} />
            {isFiltered && <span className="kanban-filter-dot" />}
          </button>

          {menuOpen && (
            <div className="kanban-filter-menu" role="dialog" aria-label="Filter tasks">
              <p className="kanban-filter-label">Priority</p>
              <div className="kanban-filter-options">
                {["all", ...PRIORITIES].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`kanban-filter-chip ${priority === p ? "is-selected" : ""}`}
                    onClick={() => setPriority(p)}
                  >
                    {p === "all" ? "Any" : p}
                  </button>
                ))}
              </div>

              <p className="kanban-filter-label">Assignee</p>
              <Dropdown
                compact
                className="kanban-assignee-dropdown"
                value={assignee}
                options={[
                  { id: "all", title: "Anyone" },
                  ...assignees.map((name) => ({ id: name, title: name })),
                ]}
                onChange={setAssignee}
              />

              <button
                type="button"
                className="kanban-filter-clear"
                onClick={clearFilters}
                disabled={!isFiltered}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="kanban-col-body">
        {visibleTasks.length === 0 && (
          <p className="kanban-empty">
            {isFiltered ? "No tasks match these filters" : "Drop tasks here"}
          </p>
        )}

        {visibleTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            tint={column.color}
            statusLabel={column.title}
            onDelete={() => onDeleteTask(t.id)}
            onOpen={() => onOpenTask(t.id)}
          />
        ))}
      </div>
    </section>
  );
}
