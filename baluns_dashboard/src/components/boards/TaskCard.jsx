
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  Trash2,
  CalendarDays,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";

import Avatar from "../common/Avatar.jsx";

import {
  descriptionToText,
  countImages,
} from "../../utils/richText.js";

import "./TaskCard.css";

export default function TaskCard({
  task,
  onDelete,
  onOpen,
  readOnly = false,
  tag,
}) {
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const endDate = task.endDate || task.dueDate;

  const description = descriptionToText(
    task.description
  );

  const imageCount = countImages(task.description);

  const commentCount = (task.comments || []).length;

  const taskNumber =
    task.taskNumber != null
      ? `#${String(task.taskNumber).padStart(3, "0")}`
      : "#---";

  // Close with Escape and prevent background scrolling
  useEffect(() => {
    if (!showDeleteModal) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setShowDeleteModal(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );
    };
  }, [showDeleteModal]);

  const openDeleteModal = (event) => {
    event.stopPropagation();
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    // The parent must delete directly,
    // without another window.confirm().
    onDelete?.();
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className="task-card"
        draggable={!readOnly && !showDeleteModal}
        onDoubleClick={
          readOnly ? undefined : onOpen
        }
        onDragStart={
          readOnly
            ? undefined
            : (event) => {
                event.dataTransfer.setData(
                  "text/plain",
                  String(task.id)
                );

                event.dataTransfer.effectAllowed =
                  "move";
              }
        }
      >
        {/* TASK NUMBER AND PRIORITY */}

        <div className="task-card-top">
          <div className="task-card-info">
            <span className="task-number">
              {taskNumber}
            </span>

            <span className="task-separator">
              –
            </span>

            <span
              className={`task-priority task-priority-${task.priority}`}
            >
              {task.priority}
            </span>

            {tag && (
              <span className="task-tag">
                {tag}
              </span>
            )}
          </div>

          {!readOnly && (
            <button
              type="button"
              className="task-delete"
              onClick={openDeleteModal}
              onDoubleClick={(event) =>
                event.stopPropagation()
              }
              aria-label={`Delete ${task.title}`}
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* TASK TITLE */}

        <h4 className="task-title">
          {task.title}
        </h4>

        {/* DESCRIPTION */}

        {description && (
          <p className="task-desc">
            {description}
          </p>
        )}

        {/* BOTTOM DETAILS */}

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
            <Avatar
              name={task.assignee}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* CUSTOM DELETE CONFIRMATION */}

      {showDeleteModal &&
        createPortal(
          <div
            className="task-delete-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDeleteModal();
              }
            }}
          >
            <div
              className="task-delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="task-delete-title"
              aria-describedby="task-delete-description"
              onDoubleClick={(event) =>
                event.stopPropagation()
              }
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

              <h3 id="task-delete-title">
                Delete task?
              </h3>

              <p
                className="task-delete-description"
                id="task-delete-description"
              >
                Are you sure you want to delete this
                task? This action cannot be undone.
              </p>

              <div className="task-delete-preview">
                <span className="task-delete-number">
                  {taskNumber}
                </span>

                <strong>
                  {task.title}
                </strong>
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
