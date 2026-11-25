import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import ProfileTab from "../components/settings/ProfileTab.jsx";
import UsersTab from "../components/settings/UsersTab.jsx";
import DesignationsTab from "../components/settings/DesignationsTab.jsx";
import "./Settings.css";

export default function Settings() {
  const { isAdmin } = useAuth();

  const tabs = [
    { id: "profile", label: "Profile" },
    ...(isAdmin
      ? [
          { id: "users", label: "Users" },
          {
            id: "designations",
            label: "Teams & Designations",
          },
        ]
      : []),
  ];

  const [tab, setTab] = useState("profile");

  const active = tabs.some((t) => t.id === tab)
    ? tab
    : "profile";

  return (
    <div className="settings-page">
      {/* Fixed header */}
      <div className="settings-header">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and organisation settings."
        />
      </div>

      {/* Fixed tab navigation */}
      <div className="settings-tabs">
        <div className="settings-tab-group">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-tab-button ${
                active === item.id
                  ? "settings-tab-active"
                  : ""
              }`}
              aria-pressed={active === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className={`settings-content ${
          active === "designations"
            ? "settings-content-fixed"
            : ""
        }`}
      >
        {active === "profile" && <ProfileTab />}

        {active === "users" && isAdmin && (
          <UsersTab />
        )}

        {active === "designations" && isAdmin && (
          <DesignationsTab />
        )}
      </div>
    </div>
  );
}