import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import "./CredentialsModal.css";

export default function CredentialsModal({ title, name, email, password, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${password}`);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the details are still on screen to copy by hand
    }
  };

  return (
    <Modal title={title} size="sm" onClose={onClose}>
      <p className="cred-intro">
        Share these details with <strong>{name}</strong>. They will be asked to choose their own
        password at first sign in.
      </p>

      <dl className="cred-box">
        <div>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt>Temporary password</dt>
          <dd className="cred-password">{password}</dd>
        </div>
      </dl>

      <p className="cred-warning">This password is shown only once. Copy it before closing.</p>

      <div className="modal-actions">
        <Button variant="outline" icon={copied ? Check : Copy} onClick={copy}>
          {copied ? "Copied" : "Copy details"}
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}