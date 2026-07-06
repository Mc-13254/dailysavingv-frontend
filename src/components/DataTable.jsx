import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 10;

/**
 * Generic table matching the Any Collect reference look: blue gradient
 * header, sortable columns (click header to sort), hover-green rows.
 * columns: [{ key, label, render?, sortable? (default true) }]
 */
export default function DataTable({ columns, rows, totalLabel, loading }) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const totalPages = Math.max(1, Math.ceil((rows?.length || 0) / PAGE_SIZE));

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows || [];
    const copy = [...(rows || [])];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'boolean') {
        if (av === bv) return 0;
        return sortDir === 'asc' ? (av ? -1 : 1) : (av ? 1 : -1);
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), undefined, { numeric: true })
        : String(bv).localeCompare(String(av), undefined, { numeric: true });
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page]);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  if (loading) return <div className="empty-state">Chargement…</div>;
  if (!rows || rows.length === 0) return <div className="empty-state">Aucune donnée à afficher.</div>;

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c)}>
                  {c.label}
                  {sortKey === c.key && (sortDir === 'asc' ? <ChevronUp className="inline ml-1 w-3 h-3" /> : <ChevronDown className="inline ml-1 w-3 h-3" />)}
                </th>
              ))}
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
          <button className="pagination-btn ml-2" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </>
  );
}
