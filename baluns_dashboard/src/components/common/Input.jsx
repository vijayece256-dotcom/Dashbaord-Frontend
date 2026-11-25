import { useId, useState } from "react";
import { Eye, EyeOff, Check, Circle } from "lucide-react";
import "./Input.css";

// as: "input" (default) | "textarea" | "select". For select, pass <option>s as children.
// suffix: optional element shown inside the right edge of the field.
// type="password": an eye button is added automatically (unless you pass your own suffix).
// rules: optional [{ id, label, test(value) }] shown as a live checklist under the field.
export default function Input({
  label,
  error,
  as: Tag = "input",
  className = "",
  suffix,
  rules,
  type,
  children,
  ...rest
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  const isPassword = Tag === "input" && type === "password";
  const eye =
    isPassword && !suffix ? (
      <button
        type="button"
        className="field-eye"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    ) : null;

  const rightSide = suffix || eye;
  const value = String(rest.value ?? "");

  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label" htmlFor={id}>{label}</label>}

      <div className="field-wrap">
        <Tag
          id={id}
          type={isPassword && visible ? "text" : type}
          className={`field-control field-${Tag} ${rightSide ? "field-has-suffix" : ""}`}
          {...rest}
        >
          {children}
        </Tag>
        {rightSide && <span className="field-suffix">{rightSide}</span>}
      </div>

      {rules && (
        <ul className="field-rules" aria-label="Requirements">
          {rules.map((rule) => {
            const passed = rule.test(value);
            return (
              <li key={rule.id} className={passed ? "field-rule-pass" : ""}>
                {passed ? <Check size={14} /> : <Circle size={14} />}
                <span>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}