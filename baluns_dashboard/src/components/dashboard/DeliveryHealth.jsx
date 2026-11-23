import Card from "../common/Card.jsx";
import "./DeliveryHealth.css";

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DeliveryHealth({ stats }) {
  const offset = CIRCUMFERENCE * (1 - stats.projectPct / 100);

  return (
    <Card title="Overall performance">
      <div className="health">
        <div className="health-ring">
          <svg
            viewBox="0 0 140 140"
            width="150"
            height="150"
            role="img"
            aria-label={`${stats.projectPct}% of projects completed`}
          >
            <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--burgundy-100)" strokeWidth="16" />
            <circle
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke="var(--burgundy-700)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="health-center">
            <strong>{stats.projectPct}%</strong>
            <span>Projects done</span>
          </div>
        </div>

        <ul className="health-list">
          <li>
            <span>Project completion</span>
            <strong>{stats.completed}/{stats.projectTotal}</strong>
          </li>
          <li>
            <span>Task completion</span>
            <strong>{stats.taskPct}%</strong>
          </li>
          <li>
            <span>Overdue tasks</span>
            <strong className={stats.overdue > 0 ? "health-alert" : ""}>{stats.overdue}</strong>
          </li>
        </ul>
      </div>
    </Card>
  );
}