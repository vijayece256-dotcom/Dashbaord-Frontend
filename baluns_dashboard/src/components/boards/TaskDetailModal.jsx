
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X, ImagePlus, Trash2, Pencil } from "lucide-react";
import { COLUMNS } from "../../data/columns.js";
import { useProjects } from "../../context/ProjectsContext.jsx";
import { useBoards } from "../../context/BoardsContext.jsx";
import { currentUser } from "../../data/currentUser.js";
import { toEditorHtml } from "../../utils/richText.js";
import { generateDummyEmployees } from "../../data/dummyEmployees.js";
import Dropdown from "../common/Dropdown.jsx";
import "./CreateBoardModal.css";
import "./TaskDetailModal.css";

const MAX_IMAGES = 8;

// Only allow simple formatting in saved comments (never render arbitrary HTML).
function safeCommentHtml(value = "") {
  const doc = new DOMParser().parseFromString(value, "text/html");
  const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "UL", "OL", "LI", "P", "DIV", "BR"]);
  function clean(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 8) { child.remove(); continue; }
      if (child.nodeType !== 1) continue;
      if (!allowed.has(child.tagName)) {
        child.replaceWith(doc.createTextNode(child.textContent || ""));
      } else {
        for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
        clean(child);
      }
    }
  }
  clean(doc.body);
  return doc.body.innerHTML;
}

function RichToolbar({ editorRef }) {
  const commands = [
    ["bold", "B", "Bold"], ["italic", "I", "Italic"],
    ["underline", "U", "Underline"],
    ["insertUnorderedList", "• List", "Bullet list"],
    ["insertOrderedList", "1. List", "Numbered list"],
  ];
  return (
    <div className="detail-toolbar" role="toolbar" aria-label="Text formatting">
      {commands.map(([command, label, title]) => (
        <button key={command} type="button" title={title} aria-label={title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            editorRef.current?.focus();
            document.execCommand(command, false, null);
            editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
          }}>{label}</button>
      ))}
    </div>
  );
}

function CommentEditor({ value, onChange, editorRef, placeholder, onSubmit }) {
  const localRef = useRef(null);
  const ref = editorRef || localRef;
  useLayoutEffect(() => {
    if (ref.current) ref.current.innerHTML = safeCommentHtml(value);
  }, []);
  return (
    <div className="detail-editor-shell">
      <RichToolbar editorRef={ref} />
      <div ref={ref} className="rich-editor detail-comment-editor" contentEditable
        suppressContentEditableWarning data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); onSubmit?.(); }
          e.stopPropagation();
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }} />
    </div>
  );
}

// Shrinks screenshots so they fit in browser storage
function compressImage(file, maxSize = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const formatTime = (iso) =>
  new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString([], { dateStyle: "medium" });

const initialsOf = (name) =>
  (name || "").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function TaskDetailModal({ task, onUpdate, onAddComment, onEditComment, onClose }) {
  const { projects = [] } = useProjects();
  const { boards = [] } = useBoards();

const employees = useMemo(
  () => generateDummyEmployees(boards),
  [boards]
);
  const linkedProject = projects.find((p) => String(p.id) === String(task.projectId));
  const projectName = linkedProject?.name || task.project || "";
  const boardProjects = projects.filter((p) => !task.boardId || String(p.boardId) === String(task.boardId));

  const projectOptions = [
    {
      id: "",
      title: "Select project",
      color: "#a5a0a5",
    },
    ...boardProjects.map((project) => ({
      id: String(project.id),
      title: project.name,
      color: "#82143c",
    })),
  ];


  const employeeOptions = [
    {
      id: "",
      title: "Unassigned",
      color: "#a5a0a5",
    },
    ...employees.map((employee) => ({
      id: String(employee.id ?? employee.empId),
      title: `${employee.name} — ${employee.role} (${employee.empId ?? employee.id})`,
      color: "#82143c",
    })),
  ];

  const findEmployee = (value) =>
    employees.find(
      (employee) =>
        String(employee.id) === String(value) ||
        String(employee.empId) === String(value) ||
        employee.name === value
    );




  // Include the currently selected project even if
  // its boardId is missing or different.
  if (
    linkedProject &&
    !projectOptions.some(
      (option) =>
        option.id === String(linkedProject.id)
    )
  ) {
    projectOptions.push({
      id: String(linkedProject.id),
      title: linkedProject.name,
      color: "#82143c",
    });
  }

  const [initialHtml] = useState(() => toEditorHtml(task.description || ""));
  const [title, setTitle] = useState(task.title);
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [reporter, setReporter] = useState(task.reporter || "");
  const selectedAssignee = findEmployee(assignee);
const selectedReporter = findEmployee(reporter);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [preview, setPreview] = useState(null);
  const [imageError, setImageError] = useState("");

  const editorRef = useRef(null);
  const commentRef = useRef(null);
  const editRef = useRef(null);
  const fileRef = useRef(null);
  const previewEl = useRef(null);
  const overlayDown = useRef(false);
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  // What is typed so far, and what is already saved
  const draft = useRef({ title: task.title, description: initialHtml, assignee: task.assignee || "", reporter: task.reporter || "" });
  const saved = useRef({ ...draft.current });

  const flush = () => {
    const changes = {};
    for (const key of ["title", "description", "assignee", "reporter"]) {
      let value = draft.current[key];
      if (key !== "description") value = value.trim();
      if (key === "title" && !value) continue;
      if (value !== saved.current[key]) changes[key] = value;
    }
    if (Object.keys(changes).length) {
      saved.current = { ...saved.current, ...changes };
      updateRef.current(changes);
    }
  };

  // Fill the editor once, and save anything unsaved when the popup closes
  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
    return () => flush();
  }, []);

  const close = () => {
    flush();
    onClose();
  };

  // Esc closes the image preview first, then the popup
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (preview) setPreview(null);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const syncDescription = () => {
    draft.current.description = editorRef.current.innerHTML;
  };

  const insertImage = (src) => {
    const el = editorRef.current;
    el.focus();
    const sel = window.getSelection();
    let range;
    if (sel.rangeCount && el.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }
    range.deleteContents();
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Screenshot";
    const br = document.createElement("br");
    range.insertNode(br);
    range.insertNode(img);
    range.setStartAfter(br);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const addImages = async (files) => {
    const room = MAX_IMAGES - editorRef.current.querySelectorAll("img").length;
    if (room <= 0) return setImageError(`You can add up to ${MAX_IMAGES} images.`);
    try {
      const list = await Promise.all(files.slice(0, room).map((f) => compressImage(f)));
      list.forEach(insertImage);
      syncDescription();
      flush();
      setImageError("");
    } catch {
      setImageError("Could not read that image.");
    }
  };

  const onPaste = (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
    e.preventDefault();
    if (files.length) return addImages(files);
    const text = e.clipboardData.getData("text/plain");
    if (text) document.execCommand("insertText", false, text);
  };

  const onDropFiles = (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      e.preventDefault();
      addImages(files);
    }
  };

  const onEditorClick = (e) => {
    if (e.target.tagName === "IMG") {
      previewEl.current = e.target;
      setPreview(e.target.src);
    }
  };

  const removePreviewImage = () => {
    previewEl.current?.remove();
    previewEl.current = null;
    setPreview(null);
    syncDescription();
    flush();
  };

  const postComment = () => {
    const text = safeCommentHtml(comment).trim();
    if (!text || !new DOMParser().parseFromString(text, "text/html").body.textContent.trim()) return;
    onAddComment({ text, author: currentUser.name });
    setComment("");
    if (commentRef.current) commentRef.current.innerHTML = "";
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = () => {
    const text = safeCommentHtml(editText).trim();
    if (!text || !new DOMParser().parseFromString(text, "text/html").body.textContent.trim()) return;
    onEditComment(editingId, text);
    cancelEdit();
  };

  const startDate = task.startDate || "";
  const endDate = task.endDate || task.dueDate || "";
  const dateProblem = startDate && endDate && endDate < startDate;
  const comments = [...(task.comments || [])].reverse();

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => (overlayDown.current = e.target === e.currentTarget)}
      onClick={(e) => e.target === e.currentTarget && overlayDown.current && close()}
    >
      <div className="modal task-modal">
        <div className="task-modal-scroll">
          <button className="modal-close detail-close" onClick={close} aria-label="Close">
            <X size={18} />
          </button>

          <div className="detail-layout">
            {/* ---------- Left: title, description, updates ---------- */}
            <div className="detail-main">
              <input
                className="detail-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  draft.current.title = e.target.value;
                }}
                onBlur={flush}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                aria-label="Task title"
              />

              <div className="detail-section-head">
                <span className="modal-label">Description</span>
                <button className="detail-add" onClick={() => fileRef.current.click()}>
                  <ImagePlus size={15} /> Add image
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    addImages([...e.target.files]);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="detail-editor-shell">
                <RichToolbar editorRef={editorRef} />
                <div
                  ref={editorRef}
                  className="rich-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Describe the task. Press Ctrl+V to paste a screenshot here."
                  onInput={syncDescription}
                  onBlur={flush}
                  onPaste={onPaste}
                  onDrop={onDropFiles}
                  onDragOver={(e) => e.dataTransfer?.types?.includes("Files") && e.preventDefault()}
                  onClick={onEditorClick}
                />
              </div>
              {imageError && <p className="modal-error">{imageError}</p>}

              <div className="detail-section">
                <span className="modal-label">Daily updates ({comments.length})</span>

                <CommentEditor editorRef={commentRef} value={comment} onChange={setComment}
                  placeholder="Write today's update..." onSubmit={postComment} />
                <div className="detail-comment-actions">
                  <span className="detail-hint">Ctrl+Enter to post</span>
                  <button
                    className="modal-btn modal-btn-primary"
                    onClick={postComment}
                    disabled={!comment.trim()}
                  >
                    Post update
                  </button>
                </div>

                <ul className="detail-comments">
                  {comments.length === 0 && <li className="detail-hint">No updates yet.</li>}
                  {comments.map((c) => (
                    <li className="detail-comment" key={c.id}>
                      <span className="detail-avatar detail-avatar-lg">{initialsOf(c.author)}</span>
                      <div className="detail-comment-body">
                        <div className="detail-comment-meta">
                          <strong>{c.author}</strong>
                          <span>{formatTime(c.createdAt)}</span>
                          {c.editedAt && <span className="detail-edited">(edited)</span>}
                          {c.author === currentUser.name && editingId !== c.id && (
                            <button className="detail-comment-edit" onClick={() => startEdit(c)}>
                              <Pencil size={12} /> Edit
                            </button>
                          )}
                        </div>

                        {editingId === c.id ? (
                          <>
                            <CommentEditor key={editingId} editorRef={editRef} value={editText}
                              onChange={setEditText} placeholder="Edit your update..." onSubmit={saveEdit} />
                            <div className="detail-edit-actions">
                              <button className="modal-btn modal-btn-outline" onClick={cancelEdit}>
                                Cancel
                              </button>
                              <button
                                className="modal-btn modal-btn-primary"
                                onClick={saveEdit}
                                disabled={!editText.trim()}
                              >
                                Save
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="detail-comment-text" dangerouslySetInnerHTML={{ __html: safeCommentHtml(c.text) }} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---------- Right: status and details ---------- */}
            <aside className="detail-side">
              <Dropdown
                value={task.status}
                options={COLUMNS}
                onChange={(status) => onUpdate({ status })}
              />

              <div className="detail-card">
                <h4>Details</h4>

                <div className="detail-row detail-project-row">
                  <span className="detail-label">Project</span>

                  <div className="detail-project-dropdown">
                    <Dropdown
                      compact
                      value={String(task.projectId ?? "")}
                      options={projectOptions}
                      onChange={(id) => {
                        const project = projects.find(
                          (p) => String(p.id) === String(id)
                        );

                        if (!project) return;

                        onUpdate({
                          projectId: project.id,
                          project: project.name,
                        });
                      }}
                    />
                  </div>
                </div>


                <div className="detail-row detail-employee-row">
                  <span className="detail-label">Assignee</span>

                  <div className="detail-employee-dropdown">
                    <Dropdown
                      compact
                      value={
                        selectedAssignee
                          ? String(selectedAssignee.id ?? selectedAssignee.empId)
                          : ""
                      }
                      options={employeeOptions}
                      onChange={(id) => {
                        const employee = findEmployee(id);
                        const name = employee?.name || "";

                        setAssignee(name);
                        draft.current.assignee = name;
                        saved.current.assignee = name;

                        onUpdate({ assignee: name });
                      }}
                    />
                  </div>
                </div>



                <div className="detail-row detail-employee-row">
                  <span className="detail-label">Reporter</span>

                  <div className="detail-employee-dropdown">
                    <Dropdown
                      compact
                      value={
                        selectedReporter
                          ? String(selectedReporter.id ?? selectedReporter.empId)
                          : ""
                      }
                      options={employeeOptions}
                      onChange={(id) => {
                        const employee = findEmployee(id);
                        const name = employee?.name || "";

                        setReporter(name);
                        draft.current.reporter = name;
                        saved.current.reporter = name;

                        onUpdate({ reporter: name });
                      }}
                    />
                  </div>
                </div>


                <div className="detail-row">
                  <label className="detail-label" htmlFor="detail-start">Start date</label>
                  <input
                    id="detail-start"
                    type="date"
                    className="detail-inline-input"
                    value={startDate}
                    onChange={(e) => onUpdate({ startDate: e.target.value })}
                  />
                </div>

                <div className="detail-row">
                  <label className="detail-label" htmlFor="detail-end">End date</label>
                  <input
                    id="detail-end"
                    type="date"
                    className="detail-inline-input"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => onUpdate({ endDate: e.target.value, dueDate: e.target.value })}
                  />
                </div>
                {dateProblem && <p className="detail-date-error">End date is before the start date.</p>}

                <div className="detail-row">
                  <span className="detail-label">Created</span>
                  <span className="detail-person-name">
                    {task.createdAt ? formatDate(task.createdAt) : "-"}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {preview && (
        <div
          className="lightbox"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
          }}
        >
          <img src={preview} alt="Screenshot preview" />
          <button
            className="lightbox-remove"
            onClick={(e) => {
              e.stopPropagation();
              removePreviewImage();
            }}
          >
            <Trash2 size={15} /> Remove image
          </button>
        </div>
      )}
    </div>
  );
}