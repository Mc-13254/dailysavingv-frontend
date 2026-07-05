import { useMemo, useState } from 'react';

const PAGE_SIZE = 10;

/**
 * Generic table matching the blue-header / white-card look from the reference
 * screenshots. columns: [{ key, label, render? }]
 */
export default function DataTable({ columns, rows, totalLabel, loading }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((rows?.length || 0) / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (rows || []).slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (loading) {
    return <div className="empty-state">Chargement…</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className="empty-state">Aucune donnée à afficher.</div>;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>{totalLabel ?? `TOTAL: ${rows.length}`}</span>
        <div>
          <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </>
  );
}
