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
  Megaphone,
  Bell,
} from "lucide-react";

import { useBoards } from "../../context/BoardsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CreateBoardModal from "../boards/CreateBoardModal.jsx";

import "./Sidebar.css";

const menu = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    feature: "dashboard",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ListChecks,
    feature: "tasks",
  },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderKanban,
    feature: "projects",
  },
  {
    to: "/team",
    label: "Employee Details",
    icon: Users,
    feature: "team",
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    feature: "analytics",
  },
];

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getFeatureCode = (item) =>
  typeof item === "object"
    ? item?.code ?? item?.key ?? item?.name ?? item?._id
    : item;

function hasFeatureAccess(user, feature) {
  if (!user) return false;

  const permissions = user.permissions ?? {};
  const featureAccess = Array.isArray(user.featureAccess)
    ? user.featureAccess
    : [];

  if (permissions[feature]?.view === true) {
    return true;
  }

  return featureAccess.some(
    (item) =>
      normalize(getFeatureCode(item)) === normalize(feature)
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { boards = [], addBoard, deleteBoard } = useBoards();

  const auth = useAuth();

  const {
    logout,
    token,
    isAdmin,
  } = auth;

  const currentUser =
    auth.currentUser ??
    auth.user ??
    auth.employee ??
    auth.profile ??
    null;

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const totalTasks = useMemo(
    () =>
      boards.reduce(
        (total, board) =>
          total + (board.tasks?.length ?? 0),
        0
      ),
    [boards]
  );

  // Derive the links from the latest auth state on every render so a login
  // or restored session updates the menu without waiting for a side effect.
  const visibleMenu = isAdmin
    ? menu
    : !currentUser
      ? []
      : menu.filter((item) => hasFeatureAccess(currentUser, item.feature));

  const boardViewAllowed =
    isAdmin ||
    hasFeatureAccess(currentUser, "boards");

  const handleCreate = (name) => {
    if (!isAdmin && !hasFeatureAccess(currentUser, "boards")) {
      return;
    }

    const board = addBoard(name);

    setShowCreate(false);

    if (board?.id) {
      navigate(`/boards/${board.id}`);
    }
  };

  const handleDeleteBoard = async (board) => {
    if (!isAdmin || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${board.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(board.id);

    try {
      await deleteBoard(board.id);

      if (location.pathname === `/boards/${board.id}`) {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      window.alert(
        error.message || "Unable to delete board."
      );
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
      // Sign out locally even if the API call fails.
    }

    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand">Baluns Technologies</div>

      <p className="menu-label">MENU</p>

      <nav className="nav">
        {visibleMenu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />
            <span>{label}</span>

            {to === "/tasks" && (
              <span className="badge">{totalTasks}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {boardViewAllowed && (
        <div className="boards-section">
          <div className="boards-head">
            <p className="menu-label">BALUNS TASK BOARD</p>

            {isAdmin && (
              <button
                type="button"
                className="add-board-btn"
                onClick={() => setShowCreate(true)}
                aria-label="Create board"
                title="Create board"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {boards.length === 0 ? (
            <p className="boards-empty">
              No boards available.
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
      )}

      <div className="sidebar-bottom">
        <p className="menu-label">GENERAL</p>

        <nav className="nav">
          <NavLink to="/announcements">
            <Megaphone size={20} />
            <span>Announcements</span>
          </NavLink>

          <NavLink to="/notifications">
            <Bell size={20} />
            <span>Notifications</span>
          </NavLink>

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
