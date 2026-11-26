import { Megaphone } from "lucide-react";

import "./ComingSoon.css";

export default function Announcements() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <Megaphone size={34} />
        </div>

        <span className="coming-soon-tag">Coming soon</span>

        <h1>Announcements</h1>

        <p>
          Administrators and reporting managers will be able to create
          announcements here, and every employee will be able to read them.
        </p>
      </div>
    </div>
  );
}