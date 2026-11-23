
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";

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

  // Find current board
  const board = boards.find(
    (b) => String(b.id) === String(boardId)
  );

  if (!board) {
    return (
      <PageHeader
        title="Board not found"
        subtitle="This board doesn't exist. Pick one from the sidebar."
      />
    );
  }

  // Search tasks
  const q = query.trim().toLowerCase();

  const tasks = (board.tasks || []).filter(
    (task) =>
      !q ||
      task.title.toLowerCase().includes(q) ||
      (task.assignee || "")
        .toLowerCase()
        .includes(q)
  );

  // Currently opened task
  const openTask = (board.tasks || []).find(
    (task) => task.id === openTaskId
  );

  // =========================================
  // DELETE TASK
  // Confirmation is handled in TaskCard.jsx
  // =========================================

  const handleDelete = (taskId) => {
    deleteTask(board.id, taskId);

    // Close details if deleted task was open
    if (openTaskId === taskId) {
      setOpenTaskId(null);
    }
  };

  return (
    <div className="board-page">
      {/* PAGE HEADER */}

      <PageHeader
        title={board.name}
        subtitle={`${
          (board.tasks || []).length
        } tasks. Drag a card to change its status, double-click to open it.`}
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search tasks or assignee"
        />

        <Button
          icon={Plus}
          onClick={() => setShowCreate(true)}
        >
          Create task
        </Button>
      </PageHeader>

      {/* KANBAN BOARD */}

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
                (known
                  ? task.status
                  : FIRST_COLUMN) === column.id
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

      {/* CREATE TASK MODAL */}

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

      {/* TASK DETAILS MODAL */}

      {openTask && (
        <TaskDetailModal
          key={openTask.id}
          task={openTask}
          onClose={() => setOpenTaskId(null)}
          onUpdate={(changes) =>
            updateTask(
              board.id,
              openTask.id,
              changes
            )
          }
          onAddComment={(comment) =>
            addComment(
              board.id,
              openTask.id,
              comment
            )
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
