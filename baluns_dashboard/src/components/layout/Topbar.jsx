import Avatar from "../common/Avatar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
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

      <div className="user">
        <Avatar name={currentUser.name} src={currentUser.avatar} size="lg" />
        <div>
          <div className="user-name">{currentUser.name}</div>
          <div className="user-role">{titleOf(currentUser)}</div>
        </div>
      </div>
    </header>
  );
}