import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import "./Modal.css";

// size: "sm" | "md" | "lg". Handles overlay, close button, Esc and click-outside.
// Use closeOnEsc={false} when the content wants to handle Esc itself.
export default function Modal({ title, onClose, size = "md", closeOnEsc = true, children }) {
  const pressedOnOverlay = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!closeOnEsc) return;
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOnEsc]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => (pressedOnOverlay.current = e.target === e.currentTarget)}
      onClick={(e) => e.target === e.currentTarget && pressedOnOverlay.current && closeRef.current()}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {title && <h3 className="modal-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
}