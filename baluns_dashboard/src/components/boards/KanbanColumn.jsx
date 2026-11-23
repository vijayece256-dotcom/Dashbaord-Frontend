import { useState } from "react";
import TaskCard from "./TaskCard.jsx";
import "./KanbanColumn.css";

export default function KanbanColumn({ column, tasks, onDropTask, onDeleteTask, onOpenTask }) {
  const [isOver, setIsOver] = useState(false);

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
        <span className="kanban-dot" style={{ background: column.color }} />
        <h3>{column.title}</h3>
        <span className="kanban-count">{tasks.length}</span>
      </header>

      <div className="kanban-col-body">
        {tasks.length === 0 && <p className="kanban-empty">Drop tasks here</p>}
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onDelete={() => onDeleteTask(t.id)}
            onOpen={() => onOpenTask(t.id)}
          />
        ))}
      </div>
    </section>
  );
}