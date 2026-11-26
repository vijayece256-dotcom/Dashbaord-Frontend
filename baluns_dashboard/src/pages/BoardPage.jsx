
import { useMemo, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Flag,
  UserRound,
  ChevronDown,
  Check,
} from "lucide-react";

import { useBoards } from "../context/BoardsContext.jsx";
import { COLUMNS } from "../data/columns.js";

import PageHeader from "../components/common/PageHeader.jsx";
import SearchInput from "../components/common/SearchInput.jsx";
import Button from "../components/common/Button.jsx";

import KanbanColumn from "../components/boards/KanbanColumn.jsx";
import CreateTaskModal from "../components/boards/CreateTaskModal.jsx";
import TaskDetailModal from "../components/boards/TaskDetailModal.jsx";

import "./BoardPage.css";

const FIRST_COLUMN = COLUMNS[0].id;

const PRIORITIES = [
  { label: "All priorities", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

export default function BoardPage() {
  const { boardId } = useParams();

  const {
    boards,
    addTask,
    updateTask,
    moveTask,
    deleteTask,
    addComment,
    editComment,
  } = useBoards();

  const [showCreate, setShowCreate] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [query, setQuery] = useState("");

  const [filters, setFilters] = useState({
    priority: "all",
    assignee: "all",
  });

  const [openDropdown, setOpenDropdown] = useState(null);

  const priorityRef = useRef(null);
  const assigneeRef = useRef(null);

  const board = boards.find(
    (b) => String(b.id) === String(boardId)
  );

  const assignees = useMemo(
    () =>
      [
        ...new Set(
          (board?.tasks || [])
            .map((task) => task.assignee)
            .filter(Boolean)
        ),
      ].sort(),
    [board]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !priorityRef.current?.contains(event.target) &&
        !assigneeRef.current?.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  if (!board) {
    return (
      <PageHeader
        title="Board not found"
        subtitle="This board doesn't exist. Pick one from the sidebar."
      />
    );
  }

  const q = query.trim().toLowerCase();

  const tasks = (board.tasks || []).filter((task) => {
    const matchesSearch =
      !q ||
      (task.title || "").toLowerCase().includes(q) ||
      (task.assignee || "").toLowerCase().includes(q);

    const matchesPriority =
      filters.priority === "all" ||
      task.priority === filters.priority;

    const matchesAssignee =
      filters.assignee === "all" ||
      task.assignee === filters.assignee;

    return (
      matchesSearch &&
      matchesPriority &&
      matchesAssignee
    );
  });

  const openTask = (board.tasks || []).find(
    (task) => task.id === openTaskId
  );

  const handleDelete = (taskId) => {
    deleteTask(board.id, taskId);

    if (openTaskId === taskId) {
      setOpenTaskId(null);
    }
  };

  return (
    <div className="board-page">
      <PageHeader
        title={board.name}
        subtitle={`${(board.tasks || []).length} tasks. Drag a card to change its status, double-click to open it.`}
      >
        <div className="board-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search tasks or assignee"
          />

          {/* PRIORITY FILTER */}
          <div className="board-filter" ref={priorityRef}>
            <button
              type="button"
              className={`board-filter-btn ${
                filters.priority !== "all" ? "is-active" : ""
              }`}
              onClick={() =>
                setOpenDropdown(
                  openDropdown === "priority" ? null : "priority"
                )
              }
            >
              <Flag size={16} />
              <span>
                {filters.priority === "all"
                  ? "Priority"
                  : PRIORITIES.find(
                      (p) => p.value === filters.priority
                    )?.label}
              </span>
              <ChevronDown size={14} />
            </button>

            {openDropdown === "priority" && (
              <div className="board-filter-menu">
                {PRIORITIES.map((priority) => (
                  <button
                    type="button"
                    key={priority.value}
                    className={`filter-option ${
                      filters.priority === priority.value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        priority: priority.value,
                      }));
                      setOpenDropdown(null);
                    }}
                  >
                    <span>{priority.label}</span>

                    {filters.priority === priority.value && (
                      <Check size={16} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ASSIGNEE FILTER */}
          <div className="board-filter" ref={assigneeRef}>
            <button
              type="button"
              className={`board-filter-btn ${
                filters.assignee !== "all" ? "is-active" : ""
              }`}
              onClick={() =>
                setOpenDropdown(
                  openDropdown === "assignee" ? null : "assignee"
                )
              }
            >
              <UserRound size={16} />

              <span>
                {filters.assignee === "all"
                  ? "Assignee"
                  : filters.assignee}
              </span>

              <ChevronDown size={14} />
            </button>

            {openDropdown === "assignee" && (
              <div className="board-filter-menu">
                <button
                  type="button"
                  className={`filter-option ${
                    filters.assignee === "all" ? "selected" : ""
                  }`}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      assignee: "all",
                    }));
                    setOpenDropdown(null);
                  }}
                >
                  <span>All assignees</span>

                  {filters.assignee === "all" && (
                    <Check size={16} />
                  )}
                </button>

                {assignees.map((assignee) => (
                  <button
                    type="button"
                    key={assignee}
                    className={`filter-option ${
                      filters.assignee === assignee
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        assignee,
                      }));
                      setOpenDropdown(null);
                    }}
                  >
                    <span>{assignee}</span>

                    {filters.assignee === assignee && (
                      <Check size={16} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            icon={Plus}
            onClick={() => setShowCreate(true)}
          >
            Create task
          </Button>
        </div>
      </PageHeader>

      <div className="kanban">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => {
              const known = COLUMNS.some(
                (c) => c.id === task.status
              );

              return (
                (known ? task.status : FIRST_COLUMN) ===
                column.id
              );
            })}
            onDropTask={(taskId, status) =>
              moveTask(board.id, taskId, status)
            }
            onDeleteTask={handleDelete}
            onOpenTask={setOpenTaskId}
          />
        ))}
      </div>

      {showCreate && (
        <CreateTaskModal
          boardId={board.id}
          onClose={() => setShowCreate(false)}
          onCreate={(data) => {
            addTask(board.id, data);
            setShowCreate(false);
          }}
        />
      )}

      {openTask && (
        <TaskDetailModal
          key={openTask.id}
          task={openTask}
          onClose={() => setOpenTaskId(null)}
          onUpdate={(changes) =>
            updateTask(board.id, openTask.id, changes)
          }
          onAddComment={(comment) =>
            addComment(board.id, openTask.id, comment)
          }
          onEditComment={(commentId, text) =>
            editComment(
              board.id,
              openTask.id,
              commentId,
              text
            )
          }
        />
      )}
    </div>
  );
}
