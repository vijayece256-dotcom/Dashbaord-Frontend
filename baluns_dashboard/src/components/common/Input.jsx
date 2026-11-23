import { useId } from "react";
import "./Input.css";

// as: "input" (default) | "textarea" | "select". For select, pass <option>s as children.
export default function Input({ label, error, as: Tag = "input", className = "", children, ...rest }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <Tag id={id} className={`field-control field-${Tag}`} {...rest}>
        {children}
      </Tag>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}