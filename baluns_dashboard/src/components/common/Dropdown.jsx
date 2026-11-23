// import { useEffect, useRef, useState } from "react";
// import { ChevronDown, Check } from "lucide-react";
// import "./Dropdown.css";

// export default function StatusSelect({ value, options, onChange }) {
//   const [open, setOpen] = useState(false);
//   const [active, setActive] = useState(0);
//   const rootRef = useRef(null);

//   const current = options.find((o) => o.id === value) || options[0];

//   useEffect(() => {
//     if (!open) return;
//     const onDown = (e) => {
//       if (!rootRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDown);
//     return () => document.removeEventListener("mousedown", onDown);
//   }, [open]);

//   const openMenu = () => {
//     setActive(Math.max(0, options.findIndex((o) => o.id === value)));
//     setOpen(true);
//   };

//   const choose = (id) => {
//     onChange(id);
//     setOpen(false);
//   };

//   const onKeyDown = (e) => {
//     if (e.key === "Escape" && open) {
//       e.stopPropagation(); // close the menu only, not the popup
//       setOpen(false);
//       return;
//     }
//     if (e.key === "ArrowDown" || e.key === "ArrowUp") {
//       e.preventDefault();
//       if (!open) return openMenu();
//       const step = e.key === "ArrowDown" ? 1 : -1;
//       setActive((i) => (i + step + options.length) % options.length);
//       return;
//     }
//     if ((e.key === "Enter" || e.key === " ") && open) {
//       e.preventDefault();
//       choose(options[active].id);
//     }
//   };

//   return (
//     <div className="status-select" ref={rootRef} onKeyDown={onKeyDown}>
//       <button
//         type="button"
//         className={`status-trigger ${open ? "status-trigger-open" : ""}`}
//         aria-haspopup="listbox"
//         aria-expanded={open}
//         onClick={() => (open ? setOpen(false) : openMenu())}
//       >
//         <span className="status-dot" style={{ background: current.color }} />
//         <span className="status-text">{current.title}</span>
//         <ChevronDown size={16} className="status-chevron" />
//       </button>

//       {open && (
//         <ul className="status-menu" role="listbox">
//           {options.map((o, i) => (
//             <li
//               key={o.id}
//               role="option"
//               aria-selected={o.id === value}
//               className={`status-option ${i === active ? "status-option-active" : ""}`}
//               onMouseEnter={() => setActive(i)}
//               onClick={() => choose(o.id)}
//             >
//               <span className="status-dot" style={{ background: o.color }} />
//               <span className="status-text">{o.title}</span>
//               {o.id === value && <Check size={16} className="status-check" />}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import "./Dropdown.css";

export default function Dropdown({ value, options, onChange, label, compact = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);

  const current = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };

  const choose = (id) => {
    onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation(); // close the menu only, not a popup around it
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openMenu();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(options[active].id);
    }
  };

  return (
    <div
      className={`dropdown ${compact ? "dropdown-compact" : ""} ${className}`}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className={`dropdown-trigger ${open ? "dropdown-trigger-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        {current.color && <span className="dropdown-dot" style={{ background: current.color }} />}
        <span className="dropdown-text">
          {label && <span className="dropdown-label">{label}: </span>}
          {current.title}
        </span>
        <ChevronDown size={16} className="dropdown-chevron" />
      </button>

      {open && (
        <ul className="dropdown-menu" role="listbox">
          {options.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              className={`dropdown-option ${i === active ? "dropdown-option-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.id)}
            >
              {o.color && <span className="dropdown-dot" style={{ background: o.color }} />}
              <span className="dropdown-text">{o.title}</span>
              {o.id === value && <Check size={16} className="dropdown-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}