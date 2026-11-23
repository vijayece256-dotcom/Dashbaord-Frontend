import "./StatusBadge.css";

// tone: "neutral" | "primary" | "solid" | "outline"
export default function StatusBadge({ tone = "neutral", children }) {
  return <span className={`status-badge status-badge-${tone}`}>{children}</span>;
}