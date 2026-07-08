import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import ExportDropdown from '../components/ExportDropdown';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import WorldMap from '../components/WorldMap';
import { CollectorPerformanceAPI } from '../api/endpoints';

const DATE_RANGES = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'year', label: 'Cette année' },
];

function buildDateFilter(rangeKey) {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  switch (rangeKey) {
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { dateFrom: iso(y), dateTo: iso(y) }; }
    case 'week': { const s = new Date(today); s.setDate(today.getDate() - today.getDay()); return { dateFrom: iso(s), dateTo: iso(today) }; }
    case 'month': { const s = new Date(today.getFullYear(), today.getMonth(), 1); return { dateFrom: iso(s), dateTo: iso(today) }; }
    case 'year': { const s = new Date(today.getFullYear(), 0, 1); return { dateFrom: iso(s), dateTo: iso(today) }; }
    default: return { dateFrom: iso(today), dateTo: iso(today) };
  }
}

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

export default function CollectorPerformanceManagement() {
  const [range, setRange] = useState('month');
  const [kpis, setKpis] = useState(null);
  const [rows, setRows] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bottomPerformers, setBottomPerformers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);

  const filter = buildDateFilter(range);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, t, l, b, a, c] = await Promise.all([
        CollectorPerformanceAPI.kpis(filter),
        CollectorPerformanceAPI.table(filter),
        CollectorPerformanceAPI.leaderboard(filter, 10),
        CollectorPerformanceAPI.bottomPerformers(filter),
        CollectorPerformanceAPI.alerts(),
        CollectorPerformanceAPI.charts('Collections', filter),
      ]);
      setKpis(k.data); setRows(t.data); setLeaderboard(l.data); setBottomPerformers(b.data); setAlerts(a.data);
      setChartData((c.data?.[0]?.points || []).map((p) => ({ date: p.x, amount: p.y })));
    } catch {
      setKpis(null); setRows([]); setLeaderboard([]); setBottomPerformers([]); setAlerts([]); setChartData([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (collectorId) => {
    setDetailId(collectorId);
    try {
      const { data } = await CollectorPerformanceAPI.detail(collectorId, filter);
      setDetail(data);
    } catch { setDetail(null); }
  };

  const tableColumns = [
    { key: 'collectorCode', label: 'Code' },
    { key: 'fullName', label: 'Nom' },
    { key: 'agency', label: 'Agence' },
    { key: 'zone', label: 'Zone' },
    { key: 'assignedClients', label: 'Clients' },
    { key: 'clientsVisitedToday', label: 'Visités' },
    { key: 'collectionsToday', label: "Aujourd'hui" },
    { key: 'collectionsThisMonth', label: 'Ce mois' },
    { key: 'monthlyAmount', label: 'Montant/mois', render: (r) => fmt(r.monthlyAmount) },
    { key: 'commissionEarned', label: 'Commission', render: (r) => fmt(r.commissionEarned) },
    { key: 'targetAchievementPercent', label: 'Objectif', render: (r) => `${r.targetAchievementPercent}%` },
    { key: 'collectionSuccessPercent', label: 'Réussite', render: (r) => `${r.collectionSuccessPercent}%` },
    { key: 'status', label: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', sortable: false,
      render: (r) => <button className="btn-icon" onClick={() => openDetail(r.collectorID)}><Eye size={14} /></button>,
    },
  ];

  const exportColumns = tableColumns.filter((c) => c.key !== 'actions').map((c) => ({
    label: c.label, key: c.key, format: c.render ? (row) => String(c.render(row)).replace(/[<>]/g, '') : undefined,
  }));

  const mapZones = rows
    .filter((r) => r.zone)
    .map((r, i) => ({ zoneCollecteID: i, libelle: r.zone }));

  return (
    <div>
      <div className="panel-header">
        <div className="panel-title" style={{ marginBottom: 0 }}>Performance des collecteurs</div>
        <div className="date-range-tabs">
          {DATE_RANGES.map((r) => (
            <button key={r.key} className={`tab ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>{r.label}</button>
          ))}
        </div>
      </div>

      {loading && <div className="empty-state">Chargement des indicateurs…</div>}

      {kpis && (
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Total Collecteurs</div><div className="kpi-value">{kpis.totalCollectors}</div></div>
          <div className="kpi-card"><div className="kpi-label">Actifs Aujourd'hui</div><div className="kpi-value accent">{kpis.activeCollectorsToday}</div></div>
          <div className="kpi-card"><div className="kpi-label">Inactifs</div><div className="kpi-value">{kpis.inactiveCollectors}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collectes Aujourd'hui (XAF)</div><div className="kpi-value">{fmt(kpis.todaysCollections)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Collectes du Mois (XAF)</div><div className="kpi-value">{fmt(kpis.monthlyCollections)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Commission Totale (XAF)</div><div className="kpi-value accent">{fmt(kpis.totalCommission)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Taux de Réussite</div><div className="kpi-value accent">{kpis.collectionSuccessRate}%</div></div>
          <div className="kpi-card"><div className="kpi-label">Moyenne / Collecteur (XAF)</div><div className="kpi-value">{fmt(kpis.averageCollectionPerCollector)}</div></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="panel lg:col-span-2">
          <div className="panel-title" style={{ marginBottom: 8 }}>Tendance des collectes</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${fmt(v)} XAF`} />
              <Line type="monotone" dataKey="amount" stroke="#1E90FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 8 }}>Alertes</div>
          {alerts.length === 0 && <div className="empty-state py-6">Aucune alerte active.</div>}
          <ul className="alert-list">
            {alerts.slice(0, 8).map((a, i) => (
              <li key={i} className={`alert-item alert-${a.severity?.toLowerCase()}`}>
                <span className="alert-dot" />
                <div><strong className="normal-case">{a.collectorName}</strong><p>{a.message}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel mb-4">
        <div className="panel-header">
          <div className="panel-title" style={{ marginBottom: 0 }}>Performance des Collecteurs</div>
          <ExportDropdown columns={exportColumns} rows={rows} filename="PERFORMANCE_COLLECTEURS" />
        </div>
        <DataTable columns={tableColumns} rows={rows} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 8 }}>Top 10 Collecteurs</div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Collecteur</th><th>Collectes</th><th>Commission</th><th>Objectif</th><th>Réussite</th></tr></thead>
            <tbody>
              {leaderboard.length === 0 && <tr><td colSpan={6} className="empty-state">Aucune donnée.</td></tr>}
              {leaderboard.map((e) => (
                <tr key={e.rank}>
                  <td className="font-bold text-brand-blue">{e.rank}</td>
                  <td>{e.collectorName}</td>
                  <td>{e.collections}</td>
                  <td>{fmt(e.commission)}</td>
                  <td>{e.achievementPercent}%</td>
                  <td>{e.successRatePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-title" style={{ marginBottom: 8 }}>Collecteurs à surveiller</div>
          {bottomPerformers.length === 0 && <div className="empty-state py-6">Aucun collecteur en difficulté.</div>}
          <ul className="alert-list">
            {bottomPerformers.map((p, i) => (
              <li key={i} className="alert-item alert-warning">
                <span className="alert-dot" />
                <div><strong className="normal-case">{p.collectorName}</strong><p>{p.reasons.join(', ')}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ marginBottom: 8 }}>Carte des zones</div>
        <WorldMap zones={mapZones} height={380} />
      </div>

      {detailId && (
        <Modal title="Détail de performance" onClose={() => { setDetailId(null); setDetail(null); }} wide>
          {!detail && <div className="empty-state">Chargement…</div>}
          {detail && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="form-card"><div className="form-card-title">Collecteur</div>
                <div className="text-sm font-bold normal-case">{detail.summary.fullName}</div>
                <div className="text-[11px] text-gray-500 normal-case">{detail.summary.collectorCode} — {detail.summary.agency}</div>
                <div className="text-[11px] text-gray-500 normal-case">Zones: {detail.assignedZones.join(', ') || '—'}</div>
              </div>
              <div className="form-card"><div className="form-card-title">Objectif mensuel</div>
                <div className="text-lg font-extrabold">{detail.monthlyTarget.achievementPercent.toFixed(1)}%</div>
                <div className="text-[11px] text-gray-500 normal-case">{fmt(detail.monthlyTarget.collectedAmount)} / {fmt(detail.monthlyTarget.targetAmount)} XAF</div>
              </div>
              <div className="form-card"><div className="form-card-title">Collectes</div>
                <div className="text-[11px] text-gray-500 normal-case">Total: {fmt(detail.totalAmountCollected)} XAF</div>
                <div className="text-[11px] text-gray-500 normal-case">Moyenne: {fmt(detail.averageCollection)} XAF</div>
                <div className="text-[11px] text-gray-500 normal-case">Manquées/annulées ce mois: {detail.missedCollections}</div>
              </div>
              <div className="form-card sm:col-span-3"><div className="form-card-title">Clients</div>
                <table className="data-table">
                  <thead><tr><th>Client</th><th>Dernière collecte</th><th>Montant</th><th>Épargne</th><th>Statut</th></tr></thead>
                  <tbody>
                    {detail.clients.map((c) => (
                      <tr key={c.clientID}>
                        <td>{c.clientName}</td>
                        <td>{c.lastCollectionDate ? new Date(c.lastCollectionDate).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>{c.lastCollectionAmount ? fmt(c.lastCollectionAmount) : '—'}</td>
                        <td>{fmt(c.totalSavings)}</td>
                        <td><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
