import Avatar from "../common/Avatar.jsx";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { titleOf } from "../../data/roles.js";
import "./Topbar.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Topbar() {
  const { user: currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-text">
        <h1 className="topbar-greeting">
          {getGreeting()}, {currentUser.name}
        </h1>
        <p className="topbar-sub">
          Stay on top of your tasks, monitor progress, and track status.
        </p>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="user">
          <Avatar name={currentUser.name} src={currentUser.avatar} size="lg" />
          <div>
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{titleOf(currentUser)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
