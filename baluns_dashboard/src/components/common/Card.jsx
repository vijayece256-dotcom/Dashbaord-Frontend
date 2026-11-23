import "./Card.css";

// The white panel used on every page. `action` goes on the right of the title.
export default function Card({ title, action, className = "", children }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="card-head">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}