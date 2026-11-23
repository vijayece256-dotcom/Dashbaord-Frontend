import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Card from "../common/Card.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";

export default function DesignationsTab() {
  const { users, designations, addDesignation, removeDesignation } = useAuth();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const countOf = (designation) => users.filter((u) => u.designation === designation).length;

  const add = () => {
    const result = addDesignation(name);
    if (!result.ok) return setError(result.error);
    setName("");
    setError("");
  };

  const remove = (designation) => {
    if (!window.confirm(`Remove "${designation}"?`)) return;
    const result = removeDesignation(designation);
    setError(result.ok ? "" : result.error);
  };

  return (
    <Card title={`Designations (${designations.length})`}>
      <p className="designation-intro">
        Create the job titles used in your company, such as Frontend Developer, Tester, HR or
        Manager. Then give each person a title in the Users tab.
      </p>

      <div className="designation-add">
        <Input
          aria-label="New designation"
          placeholder="e.g. Frontend Developer"
          value={name}
          error={error}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button icon={Plus} onClick={add}>Add</Button>
      </div>

      {designations.length === 0 ? (
        <p className="designation-empty">No designations yet. Add your first one above.</p>
      ) : (
        <ul className="designation-list">
          {designations.map((d) => {
            const count = countOf(d);
            return (
              <li key={d}>
                <strong>{d}</strong>
                <span>{count} {count === 1 ? "person" : "people"}</span>
                <button
                  type="button"
                  className="designation-remove"
                  onClick={() => remove(d)}
                  disabled={count > 0}
                  title={count > 0 ? "Change these people to another designation first" : "Remove"}
                  aria-label={`Remove ${d}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}