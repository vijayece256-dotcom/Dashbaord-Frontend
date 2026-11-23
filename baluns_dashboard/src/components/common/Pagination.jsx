import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

export default function Pagination({ page, pageSize, total, onChange, noun = "items" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = [];
  for (let n = start; n <= Math.min(pages, start + 4); n++) numbers.push(n);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {from} to {to} of {total} {noun}
      </span>

      {pages > 1 && (
        <div className="pagination-buttons">
          <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          {numbers.map((n) => (
            <button
              key={n}
              className={n === page ? "pagination-active" : ""}
              aria-current={n === page ? "page" : undefined}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
          <button disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}