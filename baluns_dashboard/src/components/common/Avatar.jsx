import { initialsOf } from "../../utils/format.js";
import "./Avatar.css";

// size: "sm" | "md" | "lg"
export default function Avatar({ name = "", src, size = "md" }) {
  if (src) return <img className={`avatar avatar-${size}`} src={src} alt={name} />;
  return (
    <span className={`avatar avatar-${size}`} title={name} aria-label={name || "Unassigned"}>
      {name ? initialsOf(name) : "?"}
    </span>
  );
}