import { Bell } from "lucide-react";

import "./ComingSoon.css";

export default function Notifications() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <Bell size={34} />
        </div>

        <span className="coming-soon-tag">Coming soon</span>

        <h1>Notifications</h1>

        <p>
          New announcements and comments where you are tagged will appear
          here. Clicking a notification will take you straight to that
          comment.
        </p>
      </div>
    </div>
  );
}