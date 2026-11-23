import { useState } from "react";
import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";

export default function CreateBoardModal({ existingNames, onCreate, onClose }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const value = name.trim();
    if (!value) return setError("Enter a board name.");
    if (existingNames.includes(value.toLowerCase()))
      return setError("A board with this name already exists.");
    onCreate(value);
  };

  return (
    <Modal title="Create board" size="sm" onClose={onClose}>
      <Input
        label="Board name"
        placeholder="e.g. Software Team, Application Team"
        value={name}
        error={error}
        autoFocus
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>Create board</Button>
      </div>
    </Modal>
  );
}