import { Link } from "react-router-dom";
import Card from "../common/Card.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import "./TeamPerformance.css";

export default function TeamPerformance({ teams }) {
  return (
    <Card title="Team performance" className="team-perf">
      {teams.length === 0 ? (
        <p className="team-empty">No teams yet. Create a board from the sidebar to add one.</p>
      ) : (
        <ul className="team-list">
          {teams.map((t) => (
            <li key={t.id}>
              <div className="team-row">
                <Link to={`/boards/${t.id}`} className="team-name">{t.name}</Link>
                <span className="team-meta">{t.done}/{t.total} tasks</span>
                <strong className="team-pct">{t.pct}%</strong>
              </div>
              <ProgressBar value={t.pct} label={`${t.name} progress`} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}