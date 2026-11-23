import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import Tabs from "../components/common/Tabs.jsx";
import ProfileTab from "../components/settings/ProfileTab.jsx";
import UsersTab from "../components/settings/UsersTab.jsx";
import DesignationsTab from "../components/settings/DesignationsTab.jsx";
import "./Settings.css";

export default function Settings() {
  const { isAdmin } = useAuth();

  // Everyone sees Profile. Only the CEO sees the other two.
  const tabs = [
    { id: "profile", label: "Profile" },
    ...(isAdmin
      ? [
          { id: "users", label: "Users" },
          { id: "designations", label: "Designations" },
        ]
      : []),
  ];

  const [tab, setTab] = useState("profile");
  const active = tabs.some((t) => t.id === tab) ? tab : "profile";

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        subtitle={isAdmin ? "Manage your account, your team and their designations." : "Manage your account."}
      />

      {tabs.length > 1 && <Tabs tabs={tabs} value={active} onChange={setTab} />}

      {active === "profile" && <ProfileTab />}
      {active === "users" && isAdmin && <UsersTab />}
      {active === "designations" && isAdmin && <DesignationsTab />}
    </div>
  );
}