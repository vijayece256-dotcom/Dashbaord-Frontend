
import { useMemo, useState } from "react";
import Modal from "../common/Modal.jsx";
import { useProjects } from "../../context/ProjectsContext.jsx";
import Button from "../common/Button.jsx";
import Dropdown from "../common/Dropdown.jsx";
import {
  PROJECT_STATUSES,
  statusById,
} from "../../data/projectStatus.js";
import {
  belongsTo,
  bucket,
  taskMembers,
  taskActivity,
} from "../../utils/projectTasks.js";
import "./ProjectModal.css";
import { Upload, FileUp } from "lucide-react";
const TABS = ["Overview", "Tasks", "Activity History","Project Files",];

const initials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const fmtDate = (date) =>
  date && !Number.isNaN(new Date(date).getTime())
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";

const fmtStamp = (date) =>
  date && !Number.isNaN(new Date(date).getTime())
    ? new Date(date).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

export default function ProjectModal({
  project,
  employees = [],
  tasks = [],
  activity = [],
  onAddMember,
  onRemoveMember,
  onUpdateProject,
  actorName = "Project Manager",
  onEdit,
  onClose,
}) {
  const { projects, updateProject } = useProjects();
  const [showUploadSoon, setShowUploadSoon] = useState(false);
  const liveProject =
    projects?.find(
      (item) => String(item.id) === String(project?.id)
    ) || project;

  const saveProject = onUpdateProject || updateProject;

  const [tab, setTab] = useState("Overview");
  const [adding, setAdding] = useState(false);
  const [nextStatus, setNextStatus] = useState(
    liveProject?.status || "upcoming"
  );
  const [holdReason, setHoldReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const projectTasks = useMemo(() => {
    if (!liveProject) return [];

    return tasks.filter((task) =>
      belongsTo(task, liveProject)
    );
  }, [tasks, liveProject]);

  const members = useMemo(() => {
    const assigned = (liveProject?.memberIds || [])
      .map((id) =>
        employees.find(
          (employee) =>
            String(employee.id) === String(id) ||
            String(employee.empId) === String(id)
        )
      )
      .filter(Boolean);

    const fromTasks = taskMembers(projectTasks).map(
      (member) =>
        employees.find(
          (employee) =>
            String(employee.id) === String(member.id) ||
            employee.name === member.name
        ) || member
    );

    return [...assigned, ...fromTasks].filter(
      (member, index, list) =>
        list.findIndex(
          (other) =>
            String(other.id) === String(member.id)
        ) === index
    );
  }, [liveProject, employees, projectTasks]);

  const candidates = employees.filter(
    (employee) =>
      !members.some(
        (member) =>
          String(member.id) === String(employee.id)
      )
  );

  const projectActivity = useMemo(() => {
    if (!liveProject) return [];

    return [
      ...taskActivity(projectTasks),

      ...activity.filter((item) =>
        belongsTo(item, liveProject)
      ),

      ...(liveProject.statusHistory || []).map(
        (entry, index) => ({
          id: entry.id || `status-${index}`,
          text:
            entry.text ||
            `Status changed to ${
              statusById(entry.to)?.title || entry.to
            }`,
          by: entry.by,
          at: entry.at,
        })
      ),

      ...(liveProject.comments || []).map(
        (entry, index) => ({
          id: entry.id || `comment-${index}`,
          text: `Comment: ${entry.text}`,
          by: entry.by,
          at: entry.at,
        })
      ),
    ]
      .filter((item) => item?.at)
      .sort(
        (a, b) =>
          new Date(b.at) - new Date(a.at)
      );
  }, [liveProject, projectTasks, activity]);

  const count = (value) =>
    projectTasks.filter(
      (task) => bucket(task.status) === value
    ).length;

  const total = projectTasks.length;
  const completed = count("completed");

  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  const nameOf = (value) =>
    employees.find(
      (employee) =>
        String(employee.id) === String(value) ||
        String(employee.empId) === String(value)
    )?.name ||
    value ||
    "Unassigned";

  if (!liveProject) return null;

  const status =
    statusById(liveProject.status || "upcoming") || {
      title: "Upcoming",
      tone: "neutral",
    };

  const statusOptions = PROJECT_STATUSES || [];
  const comments = liveProject.comments || [];
  const canUpdate = typeof saveProject === "function";

  const memberOptions = [
    {
      id: "",
      title: "Select employee",
      color: "#aaa1ad",
    },
    ...candidates.map((employee) => ({
      id: String(employee.id),
      title: `${employee.name} — ${employee.role || "Employee"}`,
      color: "#c96789",
    })),
  ];

  async function saveStatus() {
    if (
      !canUpdate ||
      saving ||
      nextStatus === liveProject.status
    ) {
      return;
    }

    const reason = holdReason.trim();

    if (nextStatus === "hold" && !reason) {
      setError(
        "Please enter a reason before putting this project on hold."
      );
      return;
    }

    setError("");
    setSaving(true);

    const at = new Date().toISOString();

    const entry = {
      id: `status-${Date.now()}`,
      from: liveProject.status,
      to: nextStatus,
      by: actorName,
      at,
      text: `Status changed from ${status.title} to ${
        statusById(nextStatus)?.title || nextStatus
      }${reason ? ` — ${reason}` : ""}`,
    };

    const changes = {
      status: nextStatus,
      statusHistory: [
        ...(liveProject.statusHistory || []),
        entry,
      ],
      ...(reason
        ? {
            comments: [
              ...comments,
              {
                id: `comment-${Date.now()}`,
                text: reason,
                by: actorName,
                at,
                type: "hold",
              },
            ],
          }
        : {}),
    };

    try {
      await saveProject(liveProject.id, changes);
      setHoldReason("");
    } catch (err) {
      setError(
        err?.message || "Could not update project status."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();

    if (
      !canUpdate ||
      saving ||
      !commentText.trim()
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await saveProject(liveProject.id, {
        comments: [
          ...comments,
          {
            id: `comment-${Date.now()}`,
            text: commentText.trim(),
            by: actorName,
            at: new Date().toISOString(),
          },
        ],
      });

      setCommentText("");
    } catch (err) {
      setError(
        err?.message || "Could not save comment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Project details"
      size="lg"
      onClose={onClose}
    >
      <div className="pd">
        {/* PROJECT HEADER */}

        <header className="pd-head">
          <div className="pd-head-text">
            <h3>
              {liveProject.name || "Untitled project"}
            </h3>
            <p>
              Project ID: {liveProject.id || "-"}
            </p>
          </div>

          <span
            className={`pd-status pd-status--${status.tone}`}
          >
            {status.title}
          </span>
        </header>

        {/* TABS */}

        <nav className="pd-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={
                tab === item
                  ? "pd-tab is-active"
                  : "pd-tab"
              }
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {error && (
          <p className="pd-error" role="alert">
            {error}
          </p>
        )}

        {/* OVERVIEW */}

        {tab === "Overview" && (
          <div className="pd-body">
            <div className="pd-overview-grid">

              {/* PROJECT OVERVIEW */}

              <section className="pd-card">
                <h4>Project overview</h4>

                <p className="pd-desc">
                  {liveProject.description ||
                    "No description added yet."}
                </p>

                <dl className="pd-facts">
                  <div>
                    <dt>Client</dt>
                    <dd>{liveProject.client || "-"}</dd>
                  </div>

                  <div>
                    <dt>Project owner</dt>
                    <dd>{liveProject.owner || "-"}</dd>
                  </div>

                  <div>
                    <dt>Department</dt>
                    <dd>
                      {liveProject.department || "-"}
                    </dd>
                  </div>

                  <div>
                    <dt>Assigned team</dt>
                    <dd>{liveProject.team || "-"}</dd>
                  </div>
                </dl>
              </section>

              {/* PROJECT STATUS */}

              <section className="pd-card">
                <h4>Project status</h4>

                <label className="pd-label">
                  Change status
                </label>

                <div className="pd-status-dropdown">
                  <Dropdown
                    value={nextStatus}
                    options={statusOptions}
                    onChange={(value) => {
                      if (!canUpdate || saving) return;

                      setNextStatus(value);
                      setError("");
                    }}
                  />
                </div>

                {nextStatus === "hold" &&
                  nextStatus !== liveProject.status && (
                    <>
                      <label
                        className="pd-label"
                        htmlFor="pd-hold-reason"
                      >
                        Reason for hold *
                      </label>

                      <textarea
                        id="pd-hold-reason"
                        className="pd-textarea"
                        rows={3}
                        value={holdReason}
                        onChange={(event) =>
                          setHoldReason(event.target.value)
                        }
                        placeholder="Explain why this project is on hold..."
                        required
                      />
                    </>
                  )}

                {nextStatus !== liveProject.status && (
                  <button
                    type="button"
                    className="pd-primary"
                    onClick={saveStatus}
                    disabled={
                      !canUpdate ||
                      saving ||
                      (nextStatus === "hold" &&
                        !holdReason.trim())
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save status"}
                  </button>
                )}

                {!canUpdate && (
                  <p className="pd-hint">
                    Project updates are unavailable.
                  </p>
                )}
              </section>

              {/* PROJECT MEMBERS */}

              <section className="pd-card">
                <div className="pd-card-head">
                  <h4>
                    Project members ({members.length})
                  </h4>

                  {candidates.length > 0 &&
                    typeof onAddMember ===
                      "function" && (
                      <button
                        type="button"
                        className="pd-link"
                        onClick={() =>
                          setAdding((value) => !value)
                        }
                      >
                        {adding ? "Done" : "Add member"}
                      </button>
                    )}
                </div>

                {adding && (
                  <div className="pd-member-dropdown">
                    <Dropdown
                      value=""
                      options={memberOptions}
                      onChange={(id) => {
                        if (id) {
                          onAddMember?.(id);
                        }
                      }}
                    />
                  </div>
                )}

                {members.length === 0 ? (
                  <p className="pd-empty">
                    No employees assigned to this
                    project yet.
                  </p>
                ) : (
                  <ul className="pd-members">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="pd-member"
                      >
                        <span className="pd-avatar">
                          {initials(member.name)}
                        </span>

                        <div className="pd-member-info">
                          <strong>
                            {member.name}
                          </strong>

                          <span>
                            {member.role || "Employee"}
                          </span>

                          <small>
                            {member.empId || member.id}
                          </small>
                        </div>

                        {adding &&
                          typeof onRemoveMember ===
                            "function" && (
                            <button
                              className="pd-remove"
                              type="button"
                              aria-label={`Remove ${member.name}`}
                              onClick={() =>
                                onRemoveMember(member.id)
                              }
                            >
                              ×
                            </button>
                          )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* PROJECT DATES */}

              <section className="pd-card">
                <h4>Project dates</h4>

                <dl className="pd-facts">
                  <div>
                    <dt>Start date</dt>
                    <dd>
                      {fmtDate(liveProject.startDate)}
                    </dd>
                  </div>

                  <div>
                    <dt>Expected end date</dt>
                    <dd>
                      {fmtDate(liveProject.endDate)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* PROJECT PROGRESS */}

              <section className="pd-card">
                <div className="pd-card-head">
                  <h4>Project progress</h4>

                  <strong className="pd-percent">
                    {progress}%
                  </strong>
                </div>

                <div
                  className="pd-bar"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <p className="pd-hint">
                  {total
                    ? `${completed} of ${total} tasks completed`
                    : "Progress starts once tasks are added."}
                </p>
              </section>

              {/* RELATED TASKS */}

              <section className="pd-card">
                <div className="pd-card-head">
                  <h4>Related tasks</h4>

                  {total > 0 && (
                    <button
                      className="pd-link"
                      type="button"
                      onClick={() => setTab("Tasks")}
                    >
                      View all
                    </button>
                  )}
                </div>

                <dl className="pd-stats">
                  <div>
                    <dt>Total</dt>
                    <dd>{total}</dd>
                  </div>

                  <div>
                    <dt>Completed</dt>
                    <dd>{completed}</dd>
                  </div>

                  <div>
                    <dt>In progress</dt>
                    <dd>{count("inprogress")}</dd>
                  </div>

                  <div>
                    <dt>Pending</dt>
                    <dd>{count("pending")}</dd>
                  </div>
                </dl>
              </section>

              {/* COMMENTS */}

              <section className="pd-card pd-wide">
                <h4>
                  Comments ({comments.length})
                </h4>

                <form
                  onSubmit={addComment}
                  className="pd-comment-form"
                >
                  <textarea
                    className="pd-textarea"
                    rows={2}
                    value={commentText}
                    onChange={(event) =>
                      setCommentText(event.target.value)
                    }
                    placeholder="Add a project comment..."
                    disabled={!canUpdate || saving}
                  />

                  <button
                    type="submit"
                    className="pd-primary"
                    disabled={
                      !canUpdate ||
                      saving ||
                      !commentText.trim()
                    }
                  >
                    Post comment
                  </button>
                </form>

                <div className="pd-comments">
                  {comments.length === 0 ? (
                    <p className="pd-empty">
                      No comments yet.
                    </p>
                  ) : (
                    [...comments]
                      .reverse()
                      .map((item, index) => (
                        <div
                          className="pd-comment"
                          key={item.id || index}
                        >
                          <div className="pd-comment-meta">
                            <strong>
                              {item.by || "Unknown"}
                            </strong>

                            <span>
                              {fmtStamp(item.at)}
                            </span>
                          </div>

                          <p>{item.text}</p>
                        </div>
                      ))
                  )}
                </div>
              </section>

              {/* LATEST ACTIVITY */}

              <section className="pd-card pd-wide">
                <div className="pd-card-head">
                  <h4>Latest activity</h4>

                  {projectActivity.length > 3 && (
                    <button
                      className="pd-link"
                      type="button"
                      onClick={() =>
                        setTab("Activity History")
                      }
                    >
                      View all
                    </button>
                  )}
                </div>

                <ActivityList
                  items={projectActivity.slice(0, 3)}
                />
              </section>
            </div>
          </div>
        )}

        {/* TASKS TAB */}

        {tab === "Tasks" && (
          <div className="pd-body">
            {projectTasks.length === 0 ? (
              <p className="pd-empty pd-empty--block">
                No tasks yet. Tasks appear here when
                you select this project while creating
                a task.
              </p>
            ) : (
              <ul className="pd-tasks">
                {projectTasks.map((task) => {
                  const taskStatus = bucket(task.status);

                  return (
                    <li
                      key={task.id}
                      className="pd-task"
                    >
                      <div>
                        <strong>
                          {task.title ??
                            task.name ??
                            "Untitled task"}
                        </strong>

                        <span>
                          {nameOf(
                            task.assigneeId ??
                              task.assignee
                          )}
                        </span>
                      </div>

                      <span
                        className={`pd-chip pd-chip--${taskStatus}`}
                      >
                        {taskStatus === "inprogress"
                          ? "In progress"
                          : taskStatus === "completed"
                          ? "Completed"
                          : "Pending"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ACTIVITY HISTORY TAB */}

        {tab === "Activity History" && (
          <div className="pd-body">
            <section className="pd-card">
              <ActivityList
                items={projectActivity}
              />
            </section>
          </div>
        )}
        {/* PROJECT FILES TAB */}

{tab === "Project Files" && (
  <div className="pd-body">
    <section className="pd-card pd-wide">
      <div className="pd-card-head">
        <div>
          <h4>Project files</h4>
          <p className="pd-hint">
            Manage and access files related to this project.
          </p>
        </div>

        <button
          type="button"
          className="pd-upload-btn"
          onClick={() => setShowUploadSoon(true)}
        >
          <Upload size={15} />
          Upload files
        </button>
      </div>

      {showUploadSoon ? (
        <div className="pd-soon" role="status">
          <FileUp size={22} />

          <div>
            <strong>Coming soon</strong>
            <p>
              File uploads for each project will be available soon.
            </p>
          </div>

          <button
            type="button"
            className="pd-link"
            onClick={() => setShowUploadSoon(false)}
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="pd-empty pd-empty--block">
          <FileUp size={28} />
          <p>No files uploaded yet.</p>
          <span>
            Upload project documents, images and other files here.
          </span>
        </div>
      )}
    </section>
  </div>
)}
      </div>

      {/* FOOTER */}

      <div className="modal-actions pd-actions">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>

        <Button
          onClick={onEdit}
          disabled={typeof onEdit !== "function"}
        >
          Edit project
        </Button>
      </div>
    </Modal>
  );
}

function ActivityList({ items = [] }) {
  if (!items.length) {
    return (
      <p className="pd-empty">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="pd-timeline">
      {items.map((item, index) => (
        <li key={item.id ?? index}>
          <p>{item.text}</p>

          <span>
            {item.by ? `${item.by} · ` : ""}
            {fmtStamp(item.at)}
          </span>
        </li>
      ))}
    </ol>
  );
}
