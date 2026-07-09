import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function DailyCollectionReports() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [byZone, setByZone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [{ data: list }, { data: st }, { data: bz }] = await Promise.all([
        ReportsAPI.dailyCollections(params),
        ReportsAPI.dailyCollectionStats(),
        ReportsAPI.dailyCollectionsByZone(),
      ]);
      setRows(list); setStats(st); setByZone(bz);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const columns = [
    { key: 'receiptNumber', label: 'N° Reçu', render: (r) => r.receiptNumber || '—' },
    { key: 'clientName', label: 'Client' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'zoneNom', label: 'Zone', render: (r) => r.zoneNom || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'montant', label: 'Montant', render: (r) => fmt(r.montant) },
    { key: 'montantCommission', label: 'Commission', render: (r) => fmt(r.montantCommission) },
    { key: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Daily Collection Reports</div>
          <div className="panel-subtitle">Analyse des collectes journalières — performance opérationnelle par collecteur et par zone.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Collectes aujourd'hui</div><div className="kpi-value">{stats.todayCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Montant aujourd'hui</div><div className="kpi-value accent">{fmt(stats.todayAmount)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collecte moyenne</div><div className="kpi-value">{fmt(stats.averageCollection)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Max</div><div className="kpi-value">{fmt(stats.highestCollection)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Min</div><div className="kpi-value">{fmt(stats.lowestCollection)}</div></div>
          <div className="kpi-card"><div className="kpi-label">En attente</div><div className="kpi-value">{stats.pendingCount}</div></div>
          <div className="kpi-card"><div className="kpi-label">Rejetées</div><div className="kpi-value text-red-600">{stats.rejectedCount}</div></div>
        </div>
      )}

      <div className="form-card mb-4">
        <div className="form-card-title">Collectes par zone</div>
        <table className="w-full text-xs mt-2">
          <thead><tr className="text-left text-gray-400"><th>Zone</th><th>Montant</th><th>Nb collectes</th></tr></thead>
          <tbody>
            {byZone.map((z, i) => (
              <tr key={i}><td>{z.label}</td><td>{fmt(z.amount)}</td><td>{z.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="toolbar flex-wrap gap-2">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="DAILY_COLLECTION_REPORTS" columns={columns} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
    </div>
  );
}
