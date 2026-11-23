import { Pause, Check, Play, Layers, Clock } from "lucide-react";
import { daysSince } from "../../utils/dashboardStats.js";
import { formatDate } from "../../utils/format.js";
import "./HoldProjects.css";

function EmptyIllustration() {
  return (
    <svg className="hold-illustration" viewBox="0 0 200 150" aria-hidden="true">
      <circle cx="105" cy="75" r="62" fill="#eceffd" />
      {/* sparkle lines */}
      <line x1="48" y1="52" x2="56" y2="62" stroke="#6d3fd8" strokeWidth="5" strokeLinecap="round" />
      <line x1="36" y1="78" x2="50" y2="84" stroke="#7c4ddb" strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="104" x2="54" y2="104" stroke="#7b9bf0" strokeWidth="5" strokeLinecap="round" />
      {/* leaves */}
      <path d="M128 112 C122 84 140 66 158 64 C162 86 150 106 128 112 Z" fill="#3fae7e" />
      <path d="M140 112 C140 98 152 88 168 90 C166 104 156 112 140 112 Z" fill="#6fd0a3" />
      {/* clipboard */}
      <g transform="rotate(-8 100 78)">
        <rect x="64" y="34" width="82" height="86" rx="12" fill="#5b6be0" />
        <rect x="70" y="42" width="70" height="72" rx="8" fill="#f4f6ff" />
        <rect x="86" y="28" width="38" height="16" rx="6" fill="#7e8cf0" />
        <circle cx="105" cy="34" r="3" fill="#fff" />
        <circle cx="105" cy="76" r="20" fill="#fff" />
        <path d="M95 76 l8 8 l14 -16" fill="none" stroke="#4a56c9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="104" width="46" height="4" rx="2" fill="#dfe3fb" />
      </g>
    </svg>
  );
}

export default function HoldProjects({ stats }) {
  const list = stats.holdProjects;

  return (
    <section className="hold">
      <header className="hold-head">
        <span className="hold-head-icon"><Pause size={22} /></span>
        <span className="hold-divider" />
        <div className="hold-head-text">
          <h3>On Hold Projects</h3>
          <p>Projects paused and waiting for action.</p>
        </div>
        <button type="button" className="hold-history">
          <Clock size={16} /> View Hold History
        </button>
      </header>

      {list.length === 0 ? (
        <div className="hold-empty">
          <EmptyIllustration />
          <h4>No Projects <span>on Hold</span></h4>
          <p>All projects are currently in progress or completed.</p>

          <div className="hold-chips">
            <span className="chip chip-total">
              <Layers size={22} /> <strong>{stats.projectTotal}</strong> Total Projects
            </span>
            <span className="chip chip-progress">
              <Play size={22} /> <strong>{stats.inProgress}</strong> In Progress
            </span>
            <span className="chip chip-done">
              <Check size={22} /> <strong>{stats.completed}</strong> Completed
            </span>
          </div>
        </div>
      ) : (
        <ul className="hold-list">
          {list.map((p) => {
            const days = daysSince(p.holdSince);
            return (
              <li className="hold-item" key={p.id}>
                <div className="hold-item-top">
                  <div>
                    <h4>{p.name}</h4>
                    <p>{p.client} · Owner: {p.owner}</p>
                  </div>
                  <span className="hold-days">{days} {days === 1 ? "day" : "days"} on hold</span>
                </div>

                <dl className="hold-details">
                  <div>
                    <dt>Hold reason</dt>
                    <dd>{p.holdReason}</dd>
                  </div>
                  <div>
                    <dt>Hold since</dt>
                    <dd>{formatDate(p.holdSince)}</dd>
                  </div>
                  <div>
                    <dt>Expected resolution</dt>
                    <dd>{formatDate(p.expectedResolution)}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}