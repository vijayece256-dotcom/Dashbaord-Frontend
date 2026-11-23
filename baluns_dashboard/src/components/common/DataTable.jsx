import "./DataTable.css";

// columns: [{ key, header, render?(row), width?, align? }]
export default function DataTable({ columns, rows, rowKey = "id", onRowClick, emptyText = "Nothing to show." }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="table-empty" colSpan={columns.length}>{emptyText}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? "table-row-click" : ""}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => e.key === "Enter" && onRowClick?.(row)}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}