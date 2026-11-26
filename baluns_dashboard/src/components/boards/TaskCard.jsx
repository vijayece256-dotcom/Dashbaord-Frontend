import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  Trash2,
  CalendarDays,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  Flag,
  X,
} from "lucide-react";

import { descriptionToText, countImages } from "../../utils/richText.js";

import "./TaskCard.css";

/* "Vijay Kumar" -> "VK", "vijay" -> "V" */
export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Same name always gets the same colour */
const AVATAR_COLORS = [
  ["#f5e3ea", "#82143c"],
  ["#e1efe8", "#1f5e44"],
  ["#e2ebf7", "#27508a"],
  ["#f7ead8", "#8a5a14"],
  ["#ece4f5", "#5b3a8a"],
];

function avatarColors(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function TaskCard({
  task,
  onDelete,
  onOpen,
  readOnly = false,
  tag,
  tint,          // column colour, used to tint the card
  statusLabel,   // column title, shown as the status pill
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const endDate = task.endDate || task.dueDate;
  const description = descriptionToText(task.description);
  const imageCount = countImages(task.description);
  const commentCount = (task.comments || []).length;

  const taskNumber =
    task.taskNumber != null
      ? `#${String(task.taskNumber).padStart(3, "0")}`
      : "#---";

  const [avatarBg, avatarFg] = avatarColors(task.assignee);

  // Close with Escape and lock background scroll
  useEffect(() => {
    if (!showDeleteModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setShowDeleteModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [showDeleteModal]);

  const openDeleteModal = (event) => {
    event.stopPropagation();
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => setShowDeleteModal(false);

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className="task-card"
        style={tint ? { "--tint": tint } : undefined}
        draggable={!readOnly && !showDeleteModal}
        onDoubleClick={readOnly ? undefined : onOpen}
        onDragStart={
          readOnly
            ? undefined
            : (event) => {
                event.dataTransfer.setData("text/plain", String(task.id));
                event.dataTransfer.effectAllowed = "move";
              }
        }
      >
        {/* NUMBER + STATUS + DELETE */}
        <div className="task-card-top">
          <span className="task-number">{taskNumber}</span>

          <div className="task-card-right">
            {statusLabel && <span className="task-status">{statusLabel}</span>}

            {!readOnly && (
              <button
                type="button"
                className="task-delete"
                onClick={openDeleteModal}
                onDoubleClick={(event) => event.stopPropagation()}
                aria-label={`Delete ${task.title}`}
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* TITLE */}
        <h4 className="task-title">{task.title}</h4>

        {description && <p className="task-desc">{description}</p>}

        {/* CHIPS */}
        <div className="task-chips">
          {task.priority && (
            <span className={`task-chip task-priority task-priority-${task.priority}`}>
              <Flag size={11} />
              {task.priority}
            </span>
          )}
          {tag && <span className="task-chip task-tag">{tag}</span>}
        </div>

        {/* BOTTOM */}
        <div className="task-card-bottom">
          <div className="task-meta">
            {endDate && (
              <span className="task-due">
                <CalendarDays size={13} />
                {endDate}
              </span>
            )}
            {imageCount > 0 && (
              <span className="task-due">
                <Paperclip size={13} />
                {imageCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="task-due">
                <MessageSquare size={13} />
                {commentCount}
              </span>
            )}
          </div>

          {task.assignee && (
            <span
              className="task-avatar"
              style={{ background: avatarBg, color: avatarFg }}
              title={task.assignee}
            >
              {getInitials(task.assignee)}
            </span>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {showDeleteModal &&
        createPortal(
          <div
            className="task-delete-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDeleteModal();
            }}
          >
            <div
              className="task-delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="task-delete-title"
              aria-describedby="task-delete-description"
              onDoubleClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="task-delete-close"
                onClick={closeDeleteModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="task-delete-icon">
                <AlertTriangle size={24} />
              </div>

              <h3 id="task-delete-title">Delete task?</h3>

              <p className="task-delete-description" id="task-delete-description">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>

              <div className="task-delete-preview">
                <span className="task-delete-number">{taskNumber}</span>
                <strong>{task.title}</strong>
              </div>

              <div className="task-delete-actions">
                <button
                  type="button"
                  className="task-delete-cancel"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="task-delete-confirm"
                  onClick={confirmDelete}
                  autoFocus
                >
                  <Trash2 size={15} />
                  Delete task
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}