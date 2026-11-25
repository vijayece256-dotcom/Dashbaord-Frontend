import { useMemo, useState } from "react";
import {
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { API_BASE_URL } from "../../config/env.js";

import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Kanban,
  Trash2,
} from "lucide-react";

import { useBoards } from "../../context/BoardsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CreateBoardModal from "../boards/CreateBoardModal.jsx";

import "./Sidebar.css";

const menu = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/team", label: "Employee Details", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { boards = [], addBoard, deleteBoard } = useBoards();
  const { logout, token, isAdmin } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Count all tasks across every Kanban board
  const totalTasks = useMemo(
    () =>
      boards.reduce(
        (total, board) => total + (board.tasks?.length ?? 0),
        0
      ),
    [boards]
  );

  const handleCreate = (name) => {
    const board = addBoard(name);

    setShowCreate(false);

    navigate(`/boards/${board.id}`);
  };

  // Delete board - Admin only
  const handleDeleteBoard = async (board) => {
    if (!isAdmin || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${board.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(board.id);

    try {
      await deleteBoard(board.id);

      // Redirect if the deleted board is currently open
      if (location.pathname === `/boards/${board.id}`) {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      alert(error.message || "Unable to delete board.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      /* Still sign out on this device */
    }

    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* BRAND */}

      <div className="brand">Baluns Technologies</div>

      {/* MAIN MENU */}

      <p className="menu-label">MENU</p>

      <nav className="nav">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />

            <span>{label}</span>

            {to === "/tasks" && (
              <span className="badge">{totalTasks}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* KANBAN BOARDS */}

      <div className="boards-section">
        <div className="boards-head">
          <p className="menu-label">BALUNS TASK BOARD</p>

          <button
            type="button"
            className="add-board-btn"
            onClick={() => setShowCreate(true)}
            aria-label="Create board"
            title="Create board"
          >
            <Plus size={14} />
          </button>
        </div>

        {boards.length === 0 ? (
          <p className="boards-empty">
            No boards yet. Click + to create one.
          </p>
        ) : (
          <nav className="nav boards-list">
            {boards.map((board) => (
              <div
                key={board.id}
                className="sidebar-board-row"
              >
                <NavLink to={`/boards/${board.id}`}>
                  <Kanban size={20} />

                  <span className="board-name">
                    {board.name}
                  </span>
                </NavLink>

                {/* Delete option - Admin only */}
                {isAdmin && (
                  <button
                    type="button"
                    className="sidebar-board-delete"
                    title={`Delete ${board.name}`}
                    aria-label={`Delete ${board.name}`}
                    disabled={deletingId !== null}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteBoard(board);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* BOTTOM MENU */}

      <div className="sidebar-bottom">
        <p className="menu-label">GENERAL</p>

        <nav className="nav">
          <NavLink to="/settings">
            <Settings size={20} />
            Settings
          </NavLink>

          <button
            type="button"
            className="nav-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </div>

      {/* CREATE BOARD MODAL */}

      {showCreate && (
        <CreateBoardModal
          existingNames={boards.map((board) =>
            board.name.toLowerCase()
          )}
          onCreate={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </aside>
  );
}