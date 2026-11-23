
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

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
} from "lucide-react";

import { useBoards } from "../../context/BoardsContext.jsx";
import CreateBoardModal from "../boards/CreateBoardModal.jsx";

import "./Sidebar.css";

const menu = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ListChecks,
  },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    to: "/team",
    label: "Team",
    icon: Users,
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const { boards = [], addBoard } = useBoards();

  const [showCreate, setShowCreate] = useState(false);

  // Count all tasks across every Kanban board
  
const totalTasks = useMemo(() => {
  return boards.reduce((total, board) => {
    return total + (board.tasks?.length ?? 0);
  }, 0);
}, [boards]);

  const handleCreate = (name) => {
    const board = addBoard(name);

    setShowCreate(false);

    navigate(`/boards/${board.id}`);
  };

  const handleLogout = () => {
    // TODO: clear token / call logout API
    navigate("/");
  };

  return (
    <aside className="sidebar">
      {/* BRAND */}

      <div className="brand">
        Baluns Technologies
      </div>

      {/* MAIN MENU */}

      <p className="menu-label">MENU</p>

      <nav className="nav">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />

            <span>{label}</span>

            {to === "/tasks" && (
              <span className="badge">
                {totalTasks}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* KANBAN BOARDS */}

      <div className="boards-section">
        <div className="boards-head">
          <p className="menu-label">
            BALUNS TASK BOARD
          </p>

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
              <NavLink
                key={board.id}
                to={`/boards/${board.id}`}
              >
                <Kanban size={20} />

                <span className="board-name">
                  {board.name}
                </span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* BOTTOM MENU */}

      <div className="sidebar-bottom">
        <p className="menu-label">
          GENERAL
        </p>

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
