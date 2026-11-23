import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  return (
    <div className="shell">
      <div className="frame">
        <Sidebar />
        <div className="main-col">
          <Topbar />
          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}