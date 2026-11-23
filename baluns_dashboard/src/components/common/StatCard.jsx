import "./StatCard.css";

export default function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="stat-card">
      <span className="stat-card-icon">
        <Icon size={22} />
      </span>
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-note">{note}</div>
      </div>
    </div>
  );
}