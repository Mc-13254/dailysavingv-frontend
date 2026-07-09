import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import { ReportsAPI } from '../api/endpoints';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function CommissionReports() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [byCollector, setByCollector] = useState([]);
  const [byAgency, setByAgency] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const [{ data: list }, { data: st }, { data: bc }, { data: ba }] = await Promise.all([
        ReportsAPI.commissions(params),
        ReportsAPI.commissionStats(),
        ReportsAPI.commissionByCollector(),
        ReportsAPI.commissionByAgency(),
      ]);
      setRows(list); setStats(st); setByCollector(bc); setByAgency(ba);
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const columns = [
    { key: 'receiptNumber', label: 'N° Reçu', render: (r) => r.receiptNumber || '—' },
    { key: 'collectorName', label: 'Collecteur', render: (r) => r.collectorName || '—' },
    { key: 'agenceNom', label: 'Agence' },
    { key: 'clientName', label: 'Client' },
    { key: 'commissionTypeName', label: 'Type Commission', render: (r) => r.commissionTypeName || '—' },
    { key: 'montant', label: 'Montant Transaction', render: (r) => fmt(r.montant) },
    { key: 'montantCommission', label: 'Commission', render: (r) => fmt(r.montantCommission) },
    { key: 'dateTransaction', label: 'Date', render: (r) => new Date(r.dateTransaction).toLocaleString('fr-FR') },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Commission Reports</div>
          <div className="panel-subtitle">Analyse complète des commissions générées par transaction, collecteur et agence.</div>
        </div>
      </div>

      {stats && (
        <div className="kpi-grid mb-4">
          <div className="kpi-card"><div className="kpi-label">Total</div><div className="kpi-value accent">{fmt(stats.totalCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Aujourd'hui</div><div className="kpi-value">{fmt(stats.todayCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Ce mois</div><div className="kpi-value">{fmt(stats.monthlyCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Cette année</div><div className="kpi-value">{fmt(stats.yearlyCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Moyenne</div><div className="kpi-value">{fmt(stats.averageCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Max</div><div className="kpi-value">{fmt(stats.highestCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Min</div><div className="kpi-value">{fmt(stats.lowestCommission)}</div></div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="form-card">
          <div className="form-card-title">Top 10 Collecteurs (par commission)</div>
          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Collecteur</th><th>Commission</th><th>Collectes</th><th>Nb</th></tr></thead>
            <tbody>
              {byCollector.map((c, i) => (
                <tr key={i}><td>{c.label}</td><td>{fmt(c.commissionAmount)}</td><td>{fmt(c.collectionAmount)}</td><td>{c.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-card">
          <div className="form-card-title">Commission par Agence</div>
          <table className="w-full text-xs mt-2">
            <thead><tr className="text-left text-gray-400"><th>Agence</th><th>Commission</th><th>Collectes</th><th>Nb</th></tr></thead>
            <tbody>
              {byAgency.map((a, i) => (
                <tr key={i}><td>{a.label}</td><td>{fmt(a.commissionAmount)}</td><td>{fmt(a.collectionAmount)}</td><td>{a.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="toolbar flex-wrap gap-2">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        <button className="btn btn-outline" onClick={load}>Filtrer</button>
        <ExportDropdown filename="COMMISSION_REPORTS" columns={columns} rows={rows} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} totalLabel={`TOTAL: ${rows.length}`} />
    </div>
  );
}
