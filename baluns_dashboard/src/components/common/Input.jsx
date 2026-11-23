import { useId } from "react";
import "./Input.css";

// as: "input" (default) | "textarea" | "select". For select, pass <option>s as children.
// suffix: optional element shown inside the right edge of the field (e.g. a button).
export default function Input({ label, error, as: Tag = "input", className = "", suffix, children, ...rest }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <div className="field-wrap">
        <Tag
          id={id}
          className={`field-control field-${Tag} ${suffix ? "field-has-suffix" : ""}`}
          {...rest}
        >
          {children}
        </Tag>
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}