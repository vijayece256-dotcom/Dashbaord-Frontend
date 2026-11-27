import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import "./DatePicker.css";

const pad = (value) => String(value).padStart(2, "0");

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value) {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DatePicker({
  value = "",
  onChange,
  min,
  max,
  label,
  ariaLabel = "Choose date",
  placeholder = "Select date",
  id,
  className = "",
  compact = false,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const selectedDate = parseDate(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = selectedDate || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [position, setPosition] = useState(null);
  const minDate = String(min || "").slice(0, 10);
  const maxDate = String(max || "").slice(0, 10);

  const cells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 24);
      const height = popoverRef.current?.getBoundingClientRect().height || 370;
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      let top = rect.bottom + 8;
      if (top + height > window.innerHeight - 12) top = rect.top - height - 8;
      top = Math.max(12, Math.min(top, window.innerHeight - height - 12));
      setPosition({ top, left, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, month]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !popoverRef.current?.contains(event.target)
      ) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openCalendar = () => {
    const initial = selectedDate || new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setPosition(null);
    setOpen(true);
  };

  const selectDate = (date) => {
    const nextValue = dateKey(date);
    if ((minDate && nextValue < minDate) || (maxDate && nextValue > maxDate)) return;
    onChange?.(nextValue);
    setOpen(false);
  };

  const today = dateKey(new Date());
  const monthTitle = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <div
      className={`date-picker ${compact ? "date-picker-compact" : ""} ${className}`}
      ref={rootRef}
    >
      {label && <span className="date-picker-label">{label}</span>}
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className="date-picker-trigger"
        aria-label={selectedDate ? `${label || ariaLabel}: ${dateLabel(selectedDate)}` : label || ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openCalendar())}
      >
        <CalendarDays className="date-picker-icon" size={17} />
        <span className={selectedDate ? "date-picker-value" : "date-picker-placeholder"}>
          {selectedDate ? dateLabel(selectedDate) : placeholder}
        </span>
        <ChevronDown className="date-picker-chevron" size={15} />
      </button>

      {open && createPortal(
        <div
          className="date-picker-popover"
          ref={popoverRef}
          role="dialog"
          aria-label="Choose a date"
          style={position ? { top: position.top, left: position.left, width: position.width } : undefined}
        >
          <div className="date-picker-head">
            <button
              type="button"
              className="date-picker-nav"
              aria-label="Previous month"
              onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>{monthTitle}</strong>
            <button
              type="button"
              className="date-picker-nav"
              aria-label="Next month"
              onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="date-picker-weekdays" aria-hidden="true">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="date-picker-grid" role="grid">
            {cells.map((date) => {
              const key = dateKey(date);
              const outsideMonth = date.getMonth() !== month.getMonth();
              const isDisabled = (minDate && key < minDate) || (maxDate && key > maxDate);
              const selected = key === (selectedDate ? dateKey(selectedDate) : "");
              return (
                <button
                  type="button"
                  key={key}
                  role="gridcell"
                  aria-label={dateLabel(date)}
                  aria-selected={selected}
                  disabled={isDisabled}
                  className={`date-picker-day ${outsideMonth ? "is-outside" : ""} ${selected ? "is-selected" : ""} ${key === today ? "is-today" : ""}`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-text-btn" onClick={() => selectDate(new Date())}>
              Today
            </button>
            {value && (
              <button type="button" className="date-picker-text-btn" onClick={() => { onChange?.(""); setOpen(false); }}>
                Clear date
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
